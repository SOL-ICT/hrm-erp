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
        'file_size',
        'file_type',
        'status',
        'records_processed',
        'records_failed',
        'error_details',
        'uploaded_by',
        'processing_started_at',
        'processing_completed_at'
    ];

    protected $casts = [
        'error_details' => 'array',
        'processing_started_at' => 'datetime',
        'processing_completed_at' => 'datetime'
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
