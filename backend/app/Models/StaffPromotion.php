<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffPromotion extends Model
{
    protected $fillable = [
        'staff_id',
        'client_id',
        'old_job_structure_id',
        'old_pay_grade_structure_id',
        'new_job_structure_id',
        'new_pay_grade_structure_id',
        'effective_date',
        'old_emoluments',
        'new_emoluments',
        'reason',
        'processed_by',
        'notes',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'old_emoluments' => 'array',
        'new_emoluments' => 'array',
    ];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function oldJobStructure(): BelongsTo
    {
        return $this->belongsTo(JobStructure::class, 'old_job_structure_id');
    }

    public function oldPayGrade(): BelongsTo
    {
        return $this->belongsTo(PayGradeStructure::class, 'old_pay_grade_structure_id');
    }

    public function newJobStructure(): BelongsTo
    {
        return $this->belongsTo(JobStructure::class, 'new_job_structure_id');
    }

    public function newPayGrade(): BelongsTo
    {
        return $this->belongsTo(PayGradeStructure::class, 'new_pay_grade_structure_id');
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
