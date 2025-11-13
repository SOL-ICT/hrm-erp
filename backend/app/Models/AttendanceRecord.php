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
        'status',
        'processing_notes',

        // Phase 1.3: Enhanced attendance upload fields
        'employee_code',
        'pay_grade_structure_id',
        'direct_id_matched',
        'validation_errors',
        'record_status',
        'template_available',
        'template_name',
        'ready_for_calculation',

        // Phase 3.1 - Attendance calculation fields
        'attendance_factor',
        'total_expected_days',
        'actual_working_days',
        'prorated_percentage',
        'calculation_method',
        'calculation_metadata',
        'calculated_at',
        'calculated_by',

        // Phase 3.1 - Enhanced payroll fields (removed redundant salary fields - now template-driven)
        'calculation_details'
    ];

    protected $casts = [
        'validation_errors' => 'array',
        'calculation_details' => 'array',
        'calculation_metadata' => 'array',
        'payroll_month' => 'date',
        'attendance_factor' => 'decimal:4',
        'prorated_percentage' => 'decimal:2',
        'calculated_at' => 'datetime',
        'direct_id_matched' => 'boolean',
        'template_available' => 'boolean',
        'ready_for_calculation' => 'boolean'
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
