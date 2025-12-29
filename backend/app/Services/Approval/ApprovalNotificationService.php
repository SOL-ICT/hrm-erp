<?php

namespace App\Services\Approval;

use App\Models\Approval;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class ApprovalNotificationService
{
    /**
     * Notify approver of pending approval request
     *
     * @param Approval $approval
     * @param int $approverId
     * @return void
     */
    public function notifyPendingApproval(Approval $approval, int $approverId): void
    {
        try {
            $approver = User::find($approverId);
            if (!$approver) {
                Log::warning("Approver not found for notification", ['approver_id' => $approverId]);
                return;
            }

            $payload = $this->buildNotificationPayload($approval, 'pending');

            // TODO: Implement actual notification (email, in-app, etc.)
            Log::info("Approval notification sent", [
                'approval_id' => $approval->id,
                'approver_id' => $approverId,
                'type' => 'pending',
            ]);

            // Placeholder for actual notification implementation
            // $approver->notify(new PendingApprovalNotification($payload));

        } catch (\Exception $e) {
            Log::error("Failed to send approval notification", [
                'approval_id' => $approval->id,
                'approver_id' => $approverId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify requester that approval is completed
     *
     * @param Approval $approval
     * @param string $outcome ('approved' or 'rejected')
     * @return void
     */
    public function notifyApprovalCompleted(Approval $approval, string $outcome): void
    {
        try {
            $requester = User::find($approval->requested_by);
            if (!$requester) {
                Log::warning("Requester not found for notification", ['requester_id' => $approval->requested_by]);
                return;
            }

            $payload = $this->buildNotificationPayload($approval, $outcome);

            Log::info("Completion notification sent", [
                'approval_id' => $approval->id,
                'requester_id' => $approval->requested_by,
                'outcome' => $outcome,
            ]);

            // Placeholder for actual notification implementation
            // $requester->notify(new ApprovalCompletedNotification($payload));

        } catch (\Exception $e) {
            Log::error("Failed to send completion notification", [
                'approval_id' => $approval->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify requester of approval status change
     *
     * @param Approval $approval
     * @param string $status
     * @param string|null $message
     * @return void
     */
    public function notifyRequester(Approval $approval, string $status, ?string $message = null): void
    {
        try {
            $requester = User::find($approval->requested_by);
            if (!$requester) {
                return;
            }

            $payload = [
                'approval_id' => $approval->id,
                'status' => $status,
                'message' => $message,
                'approval_type' => $approval->approval_type,
                'module' => $approval->module_name,
            ];

            Log::info("Requester notified", [
                'approval_id' => $approval->id,
                'status' => $status,
            ]);

            // Placeholder for actual notification
            // $requester->notify(new ApprovalStatusNotification($payload));

        } catch (\Exception $e) {
            Log::error("Failed to notify requester", [
                'approval_id' => $approval->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify about escalation
     *
     * @param Approval $approval
     * @param int $escalateTo
     * @return void
     */
    public function notifyEscalation(Approval $approval, int $escalateTo): void
    {
        try {
            $escalationUser = User::find($escalateTo);
            if (!$escalationUser) {
                return;
            }

            $payload = $this->buildNotificationPayload($approval, 'escalated');

            Log::info("Escalation notification sent", [
                'approval_id' => $approval->id,
                'escalate_to' => $escalateTo,
            ]);

            // Placeholder for actual notification
            // $escalationUser->notify(new ApprovalEscalatedNotification($payload));

        } catch (\Exception $e) {
            Log::error("Failed to send escalation notification", [
                'approval_id' => $approval->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send reminder to approver
     *
     * @param Approval $approval
     * @param int $approverId
     * @return void
     */
    public function sendReminder(Approval $approval, int $approverId): void
    {
        try {
            $approver = User::find($approverId);
            if (!$approver) {
                return;
            }

            $payload = $this->buildNotificationPayload($approval, 'reminder');

            Log::info("Reminder sent", [
                'approval_id' => $approval->id,
                'approver_id' => $approverId,
            ]);

            // Placeholder for actual notification
            // $approver->notify(new ApprovalReminderNotification($payload));

        } catch (\Exception $e) {
            Log::error("Failed to send reminder", [
                'approval_id' => $approval->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Process overdue approvals (scheduled task)
     *
     * @return void
     */
    public function processOverdueApprovals(): void
    {
        try {
            $overdueApprovals = Approval::pending()
                ->where('due_date', '<', now())
                ->where('is_overdue', false)
                ->get();

            foreach ($overdueApprovals as $approval) {
                $approval->is_overdue = true;
                $approval->save();

                // Send reminder to current approver
                if ($approval->current_approver_id) {
                    $this->sendReminder($approval, $approval->current_approver_id);
                }
            }

            Log::info("Processed overdue approvals", ['count' => $overdueApprovals->count()]);

        } catch (\Exception $e) {
            Log::error("Failed to process overdue approvals", ['error' => $e->getMessage()]);
        }
    }

    /**
     * Send daily summary to user
     *
     * @param int $userId
     * @return void
     */
    public function sendDailySummary(int $userId): void
    {
        try {
            $user = User::find($userId);
            if (!$user) {
                return;
            }

            $pendingCount = Approval::pending()
                ->forApprover($userId)
                ->count();

            if ($pendingCount === 0) {
                return; // No pending approvals, skip
            }

            $payload = [
                'user_id' => $userId,
                'pending_count' => $pendingCount,
                'date' => now()->format('Y-m-d'),
            ];

            Log::info("Daily summary sent", [
                'user_id' => $userId,
                'pending_count' => $pendingCount,
            ]);

            // Placeholder for actual notification
            // $user->notify(new DailyApprovalSummaryNotification($payload));

        } catch (\Exception $e) {
            Log::error("Failed to send daily summary", [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Build notification payload
     *
     * @param Approval $approval
     * @param string $type
     * @return array
     */
    public function buildNotificationPayload(Approval $approval, string $type): array
    {
        $requester = $approval->requester;
        $currentApprover = $approval->currentApprover;

        return [
            'approval_id' => $approval->id,
            'approval_type' => $approval->approval_type,
            'module_name' => $approval->module_name,
            'status' => $approval->status,
            'priority' => $approval->priority,
            'current_level' => $approval->current_approval_level,
            'total_levels' => $approval->total_approval_levels,
            'requester_name' => $requester ? $requester->first_name . ' ' . $requester->last_name : 'Unknown',
            'approver_name' => $currentApprover ? $currentApprover->first_name . ' ' . $currentApprover->last_name : 'Unassigned',
            'due_date' => $approval->due_date?->format('Y-m-d H:i:s'),
            'is_overdue' => $approval->is_overdue,
            'request_data' => $approval->request_data,
            'notification_type' => $type,
            'created_at' => $approval->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
