<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttendanceUpload extends Model
{
    protected $table = 'attendance_uploads';

    protected $fillable = [
        'client_id',
        'file_name',
        'file_path',
        'file_type',
        'total_records',
        'processed_records',
        'failed_records',
        'processing_status',
        'processing_errors',
        'payroll_month',
        'uploaded_by',
        'processed_at',
        // Phase 1.3: Enhanced upload tracking fields
        'format_validation_results',
        'matching_validation_results',
        'template_coverage_results',
        'successfully_matched',
        'failed_matches',
        'match_percentage',
        'validation_status',
        'ready_for_processing',
        'validation_completed_at',

    ];

    protected $casts = [
        'processing_errors' => 'array',
        'format_validation_results' => 'array',
        'matching_validation_results' => 'array',
        'template_coverage_results' => 'array',
        'payroll_month' => 'date',
        'processed_at' => 'datetime',
        'validation_completed_at' => 'datetime',
        'match_percentage' => 'decimal:2',
        'ready_for_processing' => 'boolean',

    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function generatedInvoices(): HasMany
    {
        return $this->hasMany(GeneratedInvoice::class);
    }
}
