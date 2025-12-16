<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FidelityClaim extends Model
{
    protected $fillable = [
        'claim_number',
        'client_id',
        'client_contact_name',
        'client_contact_email',
        'staff_id',
        'staff_position',
        'assignment_start_date',
        'incident_date',
        'incident_description',
        'reported_loss',
        'policy_single_limit',
        'policy_aggregate_limit',
        'status',
        'sol_evaluation_status',
        'sol_evaluator_id',
        'sol_evaluation_notes',
        'sol_evaluated_at',
        'insurer_claim_id',
        'insurer_status',
        'insurer_filed_at',
        'insurer_filed_by',
        'settlement_amount',
        'settlement_date',
    ];

    protected $casts = [
        'assignment_start_date' => 'date',
        'incident_date' => 'date',
        'settlement_date' => 'date',
        'sol_evaluated_at' => 'datetime',
        'insurer_filed_at' => 'datetime',
        'reported_loss' => 'decimal:2',
        'policy_single_limit' => 'decimal:2',
        'policy_aggregate_limit' => 'decimal:2',
        'settlement_amount' => 'decimal:2',
    ];

    /**
     * Generate unique claim number
     */
    public static function generateClaimNumber(): string
    {
        $year = date('Y');
        $lastClaim = self::where('claim_number', 'like', "SOL-{$year}-%")
            ->orderBy('claim_number', 'desc')
            ->first();

        if ($lastClaim) {
            $lastNumber = (int) substr($lastClaim->claim_number, -3);
            $newNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '001';
        }

        return "SOL-{$year}-{$newNumber}";
    }

    /**
     * Relationships
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function solEvaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sol_evaluator_id');
    }

    public function insurerFiler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'insurer_filed_by');
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(ClaimEvidence::class, 'claim_id');
    }

    /**
     * Scopes
     */
    public function scopePendingAction($query)
    {
        return $query->whereIn('status', ['client_reported', 'sol_under_review']);
    }

    public function scopeActive($query)
    {
        return $query->where('status', '!=', 'insurer_settled');
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
