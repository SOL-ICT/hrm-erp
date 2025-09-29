<?php

namespace App\Services;

use App\Models\Client;
use App\Models\AttendanceUpload;
use App\Models\AttendanceRecord;
use App\Models\GeneratedInvoice;
use App\Models\InvoiceLineItem;
use App\Services\PayrollCalculationService;
use App\Services\AttendanceCalculationService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class InvoiceGenerationService
{
    const MANAGEMENT_FEE_RATE = 0.07; // 7%
    const VAT_RATE = 0.075; // 7.5%

    /**
     * Generate invoice from attendance upload
     */
    public static function generateInvoice($attendanceUploadId, $invoiceType = 'with_schedule', $options = [])
    {
        try {
            DB::beginTransaction();

            $attendanceUpload = AttendanceUpload::with('attendanceRecords')->findOrFail($attendanceUploadId);
            $client = Client::findOrFail($attendanceUpload->client_id);

            // Get attendance records for this upload
            $attendanceRecords = $attendanceUpload->attendanceRecords()
                ->where('status', 'processed')
                ->get();

            if ($attendanceRecords->isEmpty()) {
                throw new \Exception('No processed attendance records found for invoice generation');
            }

            // Calculate payroll for all employees
            $payrollData = [];
            foreach ($attendanceRecords as $record) {
                $calculation = PayrollCalculationService::calculateEmployeePayroll([
                    'employee_id' => $record->employee_id,
                    'employee_name' => $record->employee_name,
                    'designation' => $record->designation,
                    'payroll_month' => $record->payroll_month,
                    'days_worked' => $record->days_worked,
                    'basic_salary' => $record->basic_salary,
                    'allowances' => $record->allowances,
                    'deductions' => $record->deductions
                ], $client->id);

                $payrollData[] = [
                    'record' => $record,
                    'calculation' => $calculation
                ];
            }

            // Calculate totals
            $totals = self::calculateInvoiceTotals($payrollData);

            // Add management fee and VAT
            $managementFee = $totals['net_payroll'] * self::MANAGEMENT_FEE_RATE;
            $vatAmount = $managementFee * self::VAT_RATE;
            $whtAmount = $options['wht_amount'] ?? 0; // WHT if applicable

            $totalInvoiceAmount = $totals['net_payroll'] + $managementFee + $vatAmount - $whtAmount;

            // Generate invoice number
            $invoiceNumber = self::generateInvoiceNumber($client);

            // Create invoice record
            $invoice = GeneratedInvoice::create([
                'invoice_number' => $invoiceNumber,
                'client_id' => $client->id,
                'attendance_upload_id' => $attendanceUploadId,
                'invoice_month' => $attendanceUpload->payroll_month,
                'invoice_type' => $invoiceType,
                'total_employees' => $totals['total_employees'],
                'gross_payroll' => $totals['gross_payroll'],
                'total_deductions' => $totals['total_deductions'],
                'net_payroll' => $totals['net_payroll'],
                'management_fee' => $managementFee,
                'vat_amount' => $vatAmount,
                'wht_amount' => $whtAmount,
                'total_invoice_amount' => $totalInvoiceAmount,
                'status' => 'generated',
                'calculation_breakdown' => self::buildCalculationBreakdown($payrollData, $totals, $managementFee, $vatAmount, $whtAmount),
                'generated_by' => Auth::id() ?? 1,
                'generated_at' => now()
            ]);

            // Create line items if detailed invoice
            if ($invoiceType === 'with_schedule') {
                self::createInvoiceLineItems($invoice, $payrollData);
            }

            DB::commit();

            return [
                'success' => true,
                'invoice' => $invoice->load('lineItems'),
                'message' => 'Invoice generated successfully'
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice generation failed', [
                'attendance_upload_id' => $attendanceUploadId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new \Exception("Invoice generation failed: " . $e->getMessage());
        }
    }

    /**
     * Calculate invoice totals from payroll data
     */
    private static function calculateInvoiceTotals($payrollData)
    {
        $totals = [
            'total_employees' => count($payrollData),
            'gross_payroll' => 0,
            'total_deductions' => 0,
            'net_payroll' => 0,
            'total_paye' => 0,
            'total_nhf' => 0,
            'total_nsitf' => 0,
            'total_other_deductions' => 0
        ];

        foreach ($payrollData as $item) {
            $calc = $item['calculation'];

            $totals['gross_payroll'] += $calc['gross_pay'];
            $totals['total_deductions'] += $calc['total_deductions'];
            $totals['net_payroll'] += $calc['net_pay'];
            $totals['total_paye'] += $calc['paye_deduction'];
            $totals['total_nhf'] += $calc['nhf_deduction'];
            $totals['total_nsitf'] += $calc['nsitf_deduction'];
            $totals['total_other_deductions'] += $calc['other_deductions'];
        }

        return $totals;
    }

    /**
     * Generate unique invoice number
     */
    private static function generateInvoiceNumber($client)
    {
        $prefix = 'INV';
        $clientCode = strtoupper(substr($client->organisation_name, 0, 3));
        $year = now()->year;
        $month = now()->format('m');

        // Get next sequence number for this client and month
        $lastInvoice = GeneratedInvoice::where('client_id', $client->id)
            ->where('invoice_number', 'LIKE', "{$prefix}-{$clientCode}-{$year}-{$month}-%")
            ->orderBy('invoice_number', 'desc')
            ->first();

        if ($lastInvoice) {
            $lastSequence = (int) substr($lastInvoice->invoice_number, -3);
            $sequence = str_pad($lastSequence + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $sequence = '001';
        }

        return "{$prefix}-{$clientCode}-{$year}-{$month}-{$sequence}";
    }

    /**
     * Build detailed calculation breakdown for JSON storage
     */
    private static function buildCalculationBreakdown($payrollData, $totals, $managementFee, $vatAmount, $whtAmount)
    {
        return [
            'payroll_summary' => $totals,
            'fees_and_taxes' => [
                'management_fee' => [
                    'rate' => self::MANAGEMENT_FEE_RATE * 100 . '%',
                    'calculation' => 'Net Payroll × ' . (self::MANAGEMENT_FEE_RATE * 100) . '%',
                    'amount' => round($managementFee, 2)
                ],
                'vat' => [
                    'rate' => self::VAT_RATE * 100 . '%',
                    'calculation' => 'Management Fee × ' . (self::VAT_RATE * 100) . '%',
                    'amount' => round($vatAmount, 2)
                ],
                'wht' => [
                    'rate' => 'Variable',
                    'amount' => round($whtAmount, 2)
                ]
            ],
            'invoice_calculation' => [
                'net_payroll' => round($totals['net_payroll'], 2),
                'add_management_fee' => round($managementFee, 2),
                'add_vat' => round($vatAmount, 2),
                'less_wht' => round($whtAmount, 2),
                'total_invoice_amount' => round($totals['net_payroll'] + $managementFee + $vatAmount - $whtAmount, 2)
            ],
            'employee_count' => $totals['total_employees'],
            'generation_timestamp' => now()->toISOString()
        ];
    }

    /**
     * Create invoice line items for detailed invoices
     */
    private static function createInvoiceLineItems($invoice, $payrollData)
    {
        foreach ($payrollData as $item) {
            $record = $item['record'];
            $calc = $item['calculation'];

            InvoiceLineItem::create([
                'generated_invoice_id' => $invoice->id,
                'attendance_record_id' => $record->id,
                'employee_id' => $record->employee_id,
                'employee_name' => $record->employee_name,
                'designation' => $record->designation,
                'days_worked' => $record->days_worked,
                'basic_salary' => $record->basic_salary,
                'gross_pay' => $calc['gross_pay'],
                'paye_deduction' => $calc['paye_deduction'],
                'nhf_deduction' => $calc['nhf_deduction'],
                'nsitf_deduction' => $calc['nsitf_deduction'],
                'other_deductions' => $calc['other_deductions'],
                'total_deductions' => $calc['total_deductions'],
                'net_pay' => $calc['net_pay'],
                'allowances_breakdown' => $calc['allowances_breakdown'],
                'deductions_breakdown' => $calc['deductions_breakdown']
            ]);
        }
    }

    /**
     * Generate invoice without employee details (summary only)
     */
    public static function generateSummaryInvoice($attendanceUploadId, $options = [])
    {
        return self::generateInvoice($attendanceUploadId, 'without_schedule', $options);
    }

    /**
     * Generate detailed invoice with employee breakdown
     */
    public static function generateDetailedInvoice($attendanceUploadId, $options = [])
    {
        return self::generateInvoice($attendanceUploadId, 'with_schedule', $options);
    }

    /**
     * Get invoice summary for display
     */
    public static function getInvoiceSummary($invoiceId)
    {
        $invoice = GeneratedInvoice::with(['client', 'attendanceUpload'])->findOrFail($invoiceId);

        return [
            'invoice_number' => $invoice->invoice_number,
            'client_name' => $invoice->client->organisation_name,
            'invoice_month' => Carbon::parse($invoice->invoice_month)->format('F Y'),
            'total_employees' => $invoice->total_employees,
            'gross_payroll' => $invoice->gross_payroll,
            'net_payroll' => $invoice->net_payroll,
            'management_fee' => $invoice->management_fee,
            'vat_amount' => $invoice->vat_amount,
            'wht_amount' => $invoice->wht_amount,
            'total_invoice_amount' => $invoice->total_invoice_amount,
            'status' => $invoice->status,
            'generated_at' => $invoice->generated_at->format('Y-m-d H:i:s'),
            'calculation_breakdown' => $invoice->calculation_breakdown
        ];
    }

    /**
     * Generate attendance-based invoice using enhanced calculation model
     * Implements Credit to Bank calculation and new allowance component terminology
     * 
     * @param int $attendanceUploadId
     * @param string $invoiceType
     * @param array $options
     * @return array
     */
    public static function generateAttendanceBasedInvoice($attendanceUploadId, $invoiceType = 'with_schedule', $options = [])
    {
        try {
            DB::beginTransaction();

            $attendanceUpload = AttendanceUpload::with('attendanceRecords')->findOrFail($attendanceUploadId);
            $client = Client::findOrFail($attendanceUpload->client_id);

            // Get attendance records for this upload
            $attendanceRecords = $attendanceUpload->attendanceRecords()
                ->where('status', 'processed')
                ->get();

            if ($attendanceRecords->isEmpty()) {
                throw new \Exception('No processed attendance records found for invoice generation');
            }

            // Calculate attendance-based payroll for all employees using new service
            $payrollData = [];
            $attendanceService = new AttendanceCalculationService();

            foreach ($attendanceRecords as $record) {
                $calculation = PayrollCalculationService::calculateAttendanceBasedPayroll([
                    'employee_id' => $record->employee_id,
                    'employee_name' => $record->employee_name,
                    'designation' => $record->designation,
                    'payroll_month' => $record->payroll_month,
                    'days_worked' => $record->days_worked,
                    'basic_salary' => $record->basic_salary,
                    'allowances' => $record->allowances,
                    'deductions' => $record->deductions
                ], $client->id);

                $payrollData[] = [
                    'record' => $record,
                    'calculation' => $calculation
                ];
            }

            // Calculate enhanced totals using Credit to Bank model
            $totals = self::calculateAttendanceBasedTotals($payrollData);

            // Management fee and VAT calculations (based on net payroll to employees)
            $managementFee = $totals['total_net_to_employees'] * self::MANAGEMENT_FEE_RATE;
            $vatAmount = $managementFee * self::VAT_RATE;
            $whtAmount = $options['wht_amount'] ?? 0;

            // Final invoice amount = Total Credit to Bank + Management Fee + VAT - WHT
            $totalInvoiceAmount = $totals['total_credit_to_bank'] + $managementFee + $vatAmount - $whtAmount;

            // Generate invoice number
            $invoiceNumber = self::generateInvoiceNumber($client);

            // Create invoice record with enhanced fields
            $invoice = GeneratedInvoice::create([
                'invoice_number' => $invoiceNumber,
                'client_id' => $client->id,
                'attendance_upload_id' => $attendanceUploadId,
                'invoice_month' => $attendanceUpload->payroll_month,
                'invoice_type' => $invoiceType,
                'total_employees' => $totals['total_employees'],
                'gross_payroll' => $totals['total_adjusted_gross'], // Adjusted gross (allowance components)
                'total_deductions' => $totals['total_deductions'],
                'net_payroll' => $totals['total_net_to_employees'], // What employees receive
                'management_fee' => $managementFee,
                'vat_amount' => $vatAmount,
                'wht_amount' => $whtAmount,
                'total_invoice_amount' => $totalInvoiceAmount,
                'status' => 'generated',
                'calculation_breakdown' => self::buildAttendanceBasedBreakdown($payrollData, $totals, $managementFee, $vatAmount, $whtAmount),
                'generated_by' => Auth::id() ?? 1,
                'generated_at' => now()
            ]);

            // Create line items if detailed invoice
            if ($invoiceType === 'with_schedule') {
                self::createAttendanceBasedLineItems($invoice, $payrollData);
            }

            DB::commit();

            return [
                'success' => true,
                'invoice' => $invoice->load('lineItems'),
                'totals' => $totals,
                'calculation_method' => 'attendance_based',
                'message' => 'Attendance-based invoice generated successfully'
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Attendance-based invoice generation failed', [
                'attendance_upload_id' => $attendanceUploadId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new \Exception("Attendance-based invoice generation failed: " . $e->getMessage());
        }
    }

    /**
     * Calculate enhanced totals for attendance-based invoicing
     * Implements Credit to Bank model and new component terminology
     * 
     * @param array $payrollData
     * @return array
     */
    private static function calculateAttendanceBasedTotals($payrollData)
    {
        $totals = [
            'total_employees' => count($payrollData),
            'total_adjusted_gross' => 0, // Sum of adjusted allowance components
            'total_deductions' => 0, // Sum of all deductions
            'total_credit_to_bank' => 0, // What client pays us (gross + deductions)
            'total_net_to_employees' => 0, // What employees receive (adjusted gross)
            'average_attendance_factor' => 0,
            'component_breakdown' => [
                'total_basic_salary' => 0,
                'total_allowances' => 0,
                'total_paye' => 0,
                'total_nhf' => 0,
                'total_nsitf' => 0,
                'total_pension' => 0,
                'total_other_deductions' => 0
            ]
        ];

        $totalAttendanceFactors = 0;

        foreach ($payrollData as $item) {
            $calc = $item['calculation'];

            $totals['total_adjusted_gross'] += $calc['adjusted_gross'];
            $totals['total_deductions'] += $calc['total_deductions'];
            $totals['total_credit_to_bank'] += $calc['credit_to_bank'];
            $totals['total_net_to_employees'] += $calc['net_to_employee'];
            $totalAttendanceFactors += $calc['attendance_factor'];

            // Component breakdown
            if (isset($calc['allowance_components']['basic_salary'])) {
                $totals['component_breakdown']['total_basic_salary'] += $calc['allowance_components']['basic_salary']['adjusted_amount'];
            }

            // Deduction breakdown
            if (isset($calc['deductions']['paye_tax'])) {
                $totals['component_breakdown']['total_paye'] += $calc['deductions']['paye_tax']['amount'];
            }
            if (isset($calc['deductions']['nhf_contribution'])) {
                $totals['component_breakdown']['total_nhf'] += $calc['deductions']['nhf_contribution']['amount'];
            }
            if (isset($calc['deductions']['nsitf_contribution'])) {
                $totals['component_breakdown']['total_nsitf'] += $calc['deductions']['nsitf_contribution']['amount'];
            }
            if (isset($calc['deductions']['pension_contribution'])) {
                $totals['component_breakdown']['total_pension'] += $calc['deductions']['pension_contribution']['amount'];
            }
        }

        // Calculate average attendance factor
        $totals['average_attendance_factor'] = $totals['total_employees'] > 0 ?
            round($totalAttendanceFactors / $totals['total_employees'], 4) : 0;

        // Round all totals
        foreach ($totals as $key => $value) {
            if (is_numeric($value)) {
                $totals[$key] = round($value, 2);
            }
        }

        return $totals;
    }

    /**
     * Build enhanced calculation breakdown for attendance-based invoicing
     * 
     * @param array $payrollData
     * @param array $totals
     * @param float $managementFee
     * @param float $vatAmount
     * @param float $whtAmount
     * @return array
     */
    private static function buildAttendanceBasedBreakdown($payrollData, $totals, $managementFee, $vatAmount, $whtAmount)
    {
        return [
            'calculation_method' => 'attendance_based',
            'summary' => [
                'total_employees' => $totals['total_employees'],
                'average_attendance_factor' => $totals['average_attendance_factor'],
                'total_adjusted_gross' => $totals['total_adjusted_gross'],
                'total_deductions' => $totals['total_deductions'],
                'total_credit_to_bank' => $totals['total_credit_to_bank'],
                'total_net_to_employees' => $totals['total_net_to_employees']
            ],
            'component_breakdown' => $totals['component_breakdown'],
            'fees' => [
                'management_fee' => $managementFee,
                'vat_amount' => $vatAmount,
                'wht_amount' => $whtAmount
            ],
            'employee_calculations' => array_map(function ($item) {
                return [
                    'employee_name' => $item['calculation']['employee_info']['employee_name'],
                    'attendance_factor' => $item['calculation']['attendance_factor'],
                    'adjusted_gross' => $item['calculation']['adjusted_gross'],
                    'total_deductions' => $item['calculation']['total_deductions'],
                    'credit_to_bank' => $item['calculation']['credit_to_bank'],
                    'net_to_employee' => $item['calculation']['net_to_employee']
                ];
            }, $payrollData)
        ];
    }

    /**
     * Create line items for attendance-based invoices
     * 
     * @param GeneratedInvoice $invoice
     * @param array $payrollData
     */
    private static function createAttendanceBasedLineItems($invoice, $payrollData)
    {
        foreach ($payrollData as $item) {
            $calc = $item['calculation'];
            $record = $item['record'];

            InvoiceLineItem::create([
                'invoice_id' => $invoice->id,
                'employee_id' => $record->employee_id,
                'employee_name' => $record->employee_name,
                'designation' => $record->designation,
                'days_worked' => $record->days_worked,
                'attendance_factor' => $calc['attendance_factor'],
                'adjusted_gross' => $calc['adjusted_gross'],
                'total_deductions' => $calc['total_deductions'],
                'credit_to_bank' => $calc['credit_to_bank'], // What client pays for this employee
                'net_to_employee' => $calc['net_to_employee'], // What employee receives
                'calculation_details' => json_encode([
                    'allowance_components' => $calc['allowance_components'],
                    'deductions' => $calc['deductions'],
                    'method' => 'attendance_based'
                ])
            ]);
        }
    }
}
