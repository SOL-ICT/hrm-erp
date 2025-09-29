<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceLineItem extends Model
{
    protected $table = 'invoice_line_items';

    protected $fillable = [
        'generated_invoice_id',
        'attendance_record_id',
        'employee_id',
        'employee_name',
        'designation',
        'days_worked',
        'basic_salary',
        'gross_pay',
        'paye_deduction',
        'nhf_deduction',
        'nsitf_deduction',
        'other_deductions',
        'total_deductions',
        'net_pay',
        'allowances_breakdown',
        'deductions_breakdown'
    ];

    protected $casts = [
        'basic_salary' => 'decimal:2',
        'gross_pay' => 'decimal:2',
        'paye_deduction' => 'decimal:2',
        'nhf_deduction' => 'decimal:2',
        'nsitf_deduction' => 'decimal:2',
        'other_deductions' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'allowances_breakdown' => 'array',
        'deductions_breakdown' => 'array'
    ];

    public function generatedInvoice(): BelongsTo
    {
        return $this->belongsTo(GeneratedInvoice::class);
    }

    public function attendanceRecord(): BelongsTo
    {
        return $this->belongsTo(AttendanceRecord::class);
    }
}
