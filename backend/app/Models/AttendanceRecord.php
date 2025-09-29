<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceRecord extends Model
{
    protected $table = 'attendance_records';

    protected $fillable = [
        'attendance_upload_id',
        'client_id',
        'staff_id',
        'employee_id',
        'employee_name',
        'designation',
        'payroll_month',
        'days_worked',
        'basic_salary',
        'allowances',
        'deductions',
        'gross_pay',
        'gross_salary', // Phase 3.1 - alternative field name
        'net_pay',
        'net_salary', // Phase 3.1 - alternative field name
        'status',
        'processing_notes',

        // Phase 3.1 - Attendance calculation fields
        'attendance_factor',
        'total_expected_days',
        'actual_working_days',
        'prorated_percentage',
        'calculation_method',
        'calculation_metadata',
        'calculated_at',
        'calculated_by',

        // Phase 3.1 - Enhanced payroll fields
        'credit_to_bank',
        'adjusted_components',
        'calculation_details'
    ];

    protected $casts = [
        'allowances' => 'array',
        'deductions' => 'array',
        'adjusted_components' => 'array', // Phase 3.1
        'calculation_details' => 'array', // Phase 3.1
        'calculation_metadata' => 'array',
        'payroll_month' => 'date',
        'basic_salary' => 'decimal:2',
        'gross_pay' => 'decimal:2',
        'gross_salary' => 'decimal:2', // Phase 3.1
        'net_pay' => 'decimal:2',
        'net_salary' => 'decimal:2', // Phase 3.1
        'credit_to_bank' => 'decimal:2', // Phase 3.1
        'attendance_factor' => 'decimal:4',
        'prorated_percentage' => 'decimal:2',
        'calculated_at' => 'datetime'
    ];

    public function attendanceUpload(): BelongsTo
    {
        return $this->belongsTo(AttendanceUpload::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }
}
