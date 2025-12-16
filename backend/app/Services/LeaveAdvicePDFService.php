<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class LeaveAdvicePDFService
{
    /**
     * Generate Leave Advice PDF and send via email
     *
     * @param object $leave Leave application data with staff details
     * @param string|null $resumptionDate Optional custom resumption date
     * @return void
     */
    public static function generateAndEmail($leave, $resumptionDate = null)
    {
        try {
            // Calculate resumption date if not provided
            if (!$resumptionDate) {
                $endDate = Carbon::parse($leave->end_date);
                $resumption = $endDate->copy();
                
                // Skip to next working day (skip weekends)
                do {
                    $resumption->addDay();
                } while ($resumption->isWeekend());
                
                $resumptionDate = $resumption->format('l, d F, Y');
            } else {
                $resumptionDate = Carbon::parse($resumptionDate)->format('l, d F, Y');
            }

            // Generate document number
            $docNumber = self::generateDocumentNumber($leave->id);

            // Get logo as base64
            $logoPath = public_path('images/sol-logo.png');
            $logoBase64 = null;
            if (file_exists($logoPath)) {
                $logoBase64 = base64_encode(file_get_contents($logoPath));
            }

            // Prepare data for PDF
            $data = [
                'doc_number' => $docNumber,
                'date' => Carbon::now()->format('l, d F, Y'),
                'staff_name' => trim("{$leave->first_name} {$leave->middle_name} {$leave->last_name}"),
                'staff_address' => $leave->address ?? 'N/A',
                'leave_type' => $leave->leave_type,
                'days' => $leave->days,
                'days_in_words' => self::numberToWords($leave->days),
                'start_date' => Carbon::parse($leave->start_date)->format('l, d F Y'),
                'end_date' => Carbon::parse($leave->end_date)->format('l, d F Y'),
                'resumption_date' => $resumptionDate,
                'approved_date' => Carbon::now()->format('Y'),
                'logo_base64' => $logoBase64,
            ];

            // Generate PDF
            $pdf = app('dompdf.wrapper')->loadView('pdf.leave-advice', $data);
            $pdf->setPaper('A4', 'portrait');

            // Set PDF options
            $pdf->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
                'isFontSubsettingEnabled' => true
            ]);

            // Generate filename
            $filename = "Leave_Advice_{$docNumber}.pdf";

            // Get PDF output
            $pdfOutput = $pdf->output();

            // Render the email HTML for debugging
            $emailHtml = view('emails.leave-advice', $data)->render();
            file_put_contents(storage_path('logs/email_content.html'), $emailHtml);

            // Send email with PDF attachment
            Mail::send('emails.leave-advice', $data, function ($message) use ($leave, $pdfOutput, $filename, $data) {
                $message->to($leave->staff_email, $data['staff_name'])
                    ->subject('Leave Approval - ' . $data['doc_number'])
                    ->attachData($pdfOutput, $filename, [
                        'mime' => 'application/pdf',
                    ]);
            });

            Log::info('Leave advice generated and sent', [
                'leave_id' => $leave->id,
                'staff_email' => $leave->staff_email,
                'doc_number' => $docNumber
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to generate/send leave advice: ' . $e->getMessage(), [
                'leave_id' => $leave->id ?? 'unknown',
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Generate unique document number
     */
    private static function generateDocumentNumber($leaveId)
    {
        $year = Carbon::now()->year;
        $number = str_pad($leaveId, 5, '0', STR_PAD_LEFT);
        return "LA/{$year}/{$number}";
    }

    /**
     * Convert number to words (for days)
     */
    private static function numberToWords($number)
    {
        $words = [
            1 => 'One', 2 => 'Two', 3 => 'Three', 4 => 'Four', 5 => 'Five',
            6 => 'Six', 7 => 'Seven', 8 => 'Eight', 9 => 'Nine', 10 => 'Ten',
            11 => 'Eleven', 12 => 'Twelve', 13 => 'Thirteen', 14 => 'Fourteen', 15 => 'Fifteen',
            16 => 'Sixteen', 17 => 'Seventeen', 18 => 'Eighteen', 19 => 'Nineteen', 20 => 'Twenty',
            21 => 'Twenty-One', 22 => 'Twenty-Two', 23 => 'Twenty-Three', 24 => 'Twenty-Four', 25 => 'Twenty-Five',
            26 => 'Twenty-Six', 27 => 'Twenty-Seven', 28 => 'Twenty-Eight', 29 => 'Twenty-Nine', 30 => 'Thirty'
        ];

        return $words[$number] ?? (string)$number;
    }
}
