<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Payroll Item Model
 * 
 * Represents individual staff payroll calculation
 * Stores complete breakdown with snapshots for audit trail
 */
class PayrollItem extends Model
{
    protected $table = 'payroll_items';

    protected $fillable = [
        'payroll_run_id',
        'staff_id',
        'client_id',
        'pay_grade_structure_id',
        'attendance_id',
        'staff_name',
        'staff_code',
        'bank_name',
        'account_number',
        'pfa_code',
        'days_present',
        'days_absent',
        'total_days',
        'proration_factor',
        'annual_gross_salary',
        'annual_reimbursables',
        'pensionable_amount',
        'monthly_gross',
        'monthly_reimbursables',
        'prorated_monthly_gross',
        'prorated_monthly_reimbursables',
        'taxable_income',
        'paye_tax',
        'pension_deduction',
        'leave_allowance_deduction',
        'thirteenth_month_deduction',
        'other_deductions',
        'total_deductions',
        'net_pay',
        'credit_to_bank',
        'emoluments_snapshot',
        'calculation_date',
        'notes',
    ];

    protected $casts = [
        'proration_factor' => 'decimal:4',
        'annual_gross_salary' => 'decimal:2',
        'annual_reimbursables' => 'decimal:2',
        'pensionable_amount' => 'decimal:2',
        'monthly_gross' => 'decimal:2',
        'monthly_reimbursables' => 'decimal:2',
        'prorated_monthly_gross' => 'decimal:2',
        'prorated_monthly_reimbursables' => 'decimal:2',
        'taxable_income' => 'decimal:2',
        'paye_tax' => 'decimal:2',
        'pension_deduction' => 'decimal:2',
        'leave_allowance_deduction' => 'decimal:2',
        'thirteenth_month_deduction' => 'decimal:2',
        'other_deductions' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'credit_to_bank' => 'decimal:2',
        'emoluments_snapshot' => 'array', // JSON
        'calculation_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationships
     */
    public function payrollRun(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function payGradeStructure(): BelongsTo
    {
        return $this->belongsTo(PayGradeStructure::class);
    }

    public function attendanceRecord(): BelongsTo
    {
        return $this->belongsTo(AttendanceRecord::class, 'attendance_id');
    }

    /**
     * Scopes
     */
    public function scopeForPayrollRun($query, $payrollRunId)
    {
        return $query->where('payroll_run_id', $payrollRunId);
    }

    public function scopeForStaff($query, $staffId)
    {
        return $query->where('staff_id', $staffId);
    }

    public function scopeWithNegativeNetPay($query)
    {
        return $query->where('net_pay', '<', 0);
    }

    /**
     * Get formatted emoluments breakdown
     */
    public function getFormattedEmoluments(): array
    {
        $formatted = [];

        foreach ($this->emoluments_snapshot as $code => $amount) {
            $formatted[] = [
                'code' => $code,
                'amount' => number_format($amount, 2),
            ];
        }

        return $formatted;
    }

    /**
     * Check if has attendance issues
     */
    public function hasAttendanceIssues(): bool
    {
        return $this->proration_factor < 1.0;
    }

    /**
     * Check if has negative net pay
     */
    public function hasNegativeNetPay(): bool
    {
        return $this->net_pay < 0;
    }
}
