<?php

namespace App\Console\Commands;

use App\Models\Staff;
use App\Models\StaffOfferAcceptanceLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class CheckOfferExpiry extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'offers:check-expiry';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for offer expiry and send reminders, suspend or terminate staff based on days elapsed';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting offer expiry check...');

        try {
            // Get all staff with offers that are still pending
            $staffWithPendingOffers = DB::table('staff')
                ->where('offer_acceptance_status', 'sent')
                ->whereNotNull('offer_sent_at')
                ->get();

            if ($staffWithPendingOffers->isEmpty()) {
                $this->info('No pending offers found.');
                return 0;
            }

            $this->info("Found {$staffWithPendingOffers->count()} staff with pending offers.");

            $remindedCount = 0;
            $suspendedCount = 0;
            $terminatedCount = 0;

            foreach ($staffWithPendingOffers as $staff) {
                $this->processStaffOffer($staff, $remindedCount, $suspendedCount, $terminatedCount);
            }

            $this->info("\nSummary:");
            $this->info("- Reminders sent: {$remindedCount}");
            $this->info("- Staff suspended: {$suspendedCount}");
            $this->info("- Staff terminated: {$terminatedCount}");

            Log::info('CheckOfferExpiry command completed', [
                'reminded' => $remindedCount,
                'suspended' => $suspendedCount,
                'terminated' => $terminatedCount,
            ]);

            return 0;

        } catch (\Exception $e) {
            $this->error('Error checking offer expiry: ' . $e->getMessage());
            Log::error('CheckOfferExpiry command failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }
    }

    /**
     * Process individual staff offer
     */
    protected function processStaffOffer($staff, &$remindedCount, &$suspendedCount, &$terminatedCount)
    {
        $sentDate = Carbon::parse($staff->offer_sent_at);
        $now = Carbon::now();
        $daysElapsed = $sentDate->diffInDays($now);

        $this->line("\nProcessing: {$staff->first_name} {$staff->last_name} (ID: {$staff->id})");
        $this->line("  Offer sent: {$staff->offer_sent_at}");
        $this->line("  Days elapsed: {$daysElapsed}");

        // Check if action already taken today
        $actionTakenToday = DB::table('staff_offer_acceptance_log')
            ->where('staff_id', $staff->id)
            ->whereDate('created_at', $now->toDateString())
            ->whereIn('action', ['reminded', 'suspended', 'terminated'])
            ->exists();

        if ($actionTakenToday) {
            $this->line("  ⏭ Skipping (action already taken today)");
            return;
        }

        // Day 30: Terminate staff
        if ($daysElapsed >= 30) {
            $this->handleTermination($staff, $daysElapsed);
            $terminatedCount++;
        }
        // Day 27: Send final reminder
        elseif ($daysElapsed == 27) {
            $this->handleReminder($staff, $daysElapsed, true);
            $remindedCount++;
        }
        // Day 14: Suspend staff
        elseif ($daysElapsed >= 14) {
            // Only suspend once
            if ($staff->status !== 'inactive') {
                $this->handleSuspension($staff, $daysElapsed);
                $suspendedCount++;
            } else {
                $this->line("  ⏭ Already suspended");
            }
        }
        // Day 11: Send first reminder
        elseif ($daysElapsed == 11) {
            $this->handleReminder($staff, $daysElapsed, false);
            $remindedCount++;
        }
    }

    /**
     * Send reminder email (Day 11 or Day 27)
     */
    protected function handleReminder($staff, $daysElapsed, $isFinal = false)
    {
        $reminderType = $isFinal ? 'final' : 'first';
        $daysRemaining = 30 - $daysElapsed;

        $this->warn("  📧 Sending {$reminderType} reminder ({$daysRemaining} days remaining)");

        try {
            // Send email notification
            $this->sendReminderEmail($staff, $daysRemaining, $isFinal);

            // Log the action
            StaffOfferAcceptanceLog::logReminded(
                $staff->id,
                $isFinal 
                    ? "Final reminder sent - {$daysRemaining} days remaining before termination"
                    : "First reminder sent - {$daysRemaining} days remaining before suspension",
                [
                    'days_elapsed' => $daysElapsed,
                    'days_remaining' => $daysRemaining,
                    'reminder_type' => $reminderType,
                    'email_sent_to' => $staff->email,
                ]
            );

            $this->info("  ✅ Reminder sent successfully");

        } catch (\Exception $e) {
            $this->error("  ❌ Failed to send reminder: " . $e->getMessage());
            Log::error('Failed to send reminder email', [
                'staff_id' => $staff->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Suspend staff (Day 14)
     */
    protected function handleSuspension($staff, $daysElapsed)
    {
        $this->warn("  ⚠️ Suspending staff (Day 14 reached)");

        try {
            DB::beginTransaction();

            // Update staff status
            DB::table('staff')
                ->where('id', $staff->id)
                ->update([
                    'status' => 'inactive',
                    'updated_at' => Carbon::now(),
                ]);

            // Log the action
            StaffOfferAcceptanceLog::logSuspended(
                $staff->id,
                'Staff suspended due to non-acceptance of offer within 14 days',
                [
                    'days_elapsed' => $daysElapsed,
                    'previous_status' => $staff->status,
                    'suspension_date' => Carbon::now()->toDateTimeString(),
                ]
            );

            DB::commit();

            $this->info("  ✅ Staff suspended successfully");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("  ❌ Failed to suspend staff: " . $e->getMessage());
            Log::error('Failed to suspend staff', [
                'staff_id' => $staff->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Terminate staff (Day 30)
     */
    protected function handleTermination($staff, $daysElapsed)
    {
        $this->error("  🛑 Terminating staff (Day 30 reached)");

        try {
            DB::beginTransaction();

            // Update staff status and offer status
            DB::table('staff')
                ->where('id', $staff->id)
                ->update([
                    'status' => 'inactive',
                    'offer_acceptance_status' => 'expired',
                    'updated_at' => Carbon::now(),
                ]);

            // Create termination record
            DB::table('staff_terminations')->insert([
                'staff_id' => $staff->id,
                'client_id' => $staff->client_id ?? 1,
                'termination_type' => 'terminated',
                'termination_date' => Carbon::now(),
                'transaction_date' => Carbon::now(),
                'actual_relieving_date' => Carbon::now(),
                'reason' => 'Offer not accepted within 30 days. Offer sent on ' . $staff->offer_sent_at,
                'exit_penalty' => 'no',
                'ppe_return' => 'n/a',
                'exit_interview' => 'n/a',
                'is_blacklisted' => false,
                'processed_by' => null, // System action
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            // Log the action
            StaffOfferAcceptanceLog::logTerminated(
                $staff->id,
                'Staff terminated due to non-acceptance of offer within 30 days',
                [
                    'days_elapsed' => $daysElapsed,
                    'termination_date' => Carbon::now()->toDateTimeString(),
                    'termination_reason' => 'Offer expired',
                ]
            );

            DB::commit();

            $this->info("  ✅ Staff terminated successfully");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("  ❌ Failed to terminate staff: " . $e->getMessage());
            Log::error('Failed to terminate staff', [
                'staff_id' => $staff->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send reminder email to staff
     */
    protected function sendReminderEmail($staff, $daysRemaining, $isFinal = false)
    {
        // For now, log the email that would be sent
        // TODO: Implement actual email sending with Mail facade
        
        $subject = $isFinal 
            ? "URGENT: Final Reminder - Offer Expires in {$daysRemaining} Days"
            : "Reminder: Please Accept Your Offer - {$daysRemaining} Days Remaining";

        $message = $isFinal
            ? "This is your final reminder. Your offer will expire in {$daysRemaining} days. Please log in to accept or reject your offer immediately."
            : "Your offer was sent {$daysRemaining} days ago. Please log in to your staff dashboard to accept or reject the offer. You have {$daysRemaining} days remaining.";

        Log::info('Offer reminder email', [
            'staff_id' => $staff->id,
            'email' => $staff->email,
            'subject' => $subject,
            'message' => $message,
            'is_final' => $isFinal,
            'days_remaining' => $daysRemaining,
        ]);

        // Uncomment when email template is ready:
        // Mail::to($staff->email)->send(new OfferReminderMail($staff, $daysRemaining, $isFinal));
    }
}
