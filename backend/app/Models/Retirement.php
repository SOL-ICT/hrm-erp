<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Retirement extends Model
{
    use HasFactory;

    protected $fillable = [
        'advance_id',
        'retirement_code',
        'advance_amount',
        'total_spent',
        'balance',
        'receipt_documents',
        'supporting_documents',
        'retirement_summary',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_comments',
        'query_reason',
        'rejection_reason',
    ];

    protected $casts = [
        'advance_amount' => 'decimal:2',
        'total_spent' => 'decimal:2',
        'balance' => 'decimal:2',
        'receipt_documents' => 'array',
        'supporting_documents' => 'array',
        'reviewed_at' => 'datetime',
    ];

    /**
     * Relationships
     */
    public function advance()
    {
        return $this->belongsTo(Advance::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function items()
    {
        return $this->hasMany(RetirementItem::class);
    }

    /**
     * Scopes
     */
    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }

    public function scopeUnderReview($query)
    {
        return $query->where('status', 'under_review');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeQueried($query)
    {
        return $query->where('status', 'queried');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    /**
     * Helper methods
     */
    public function hasBalance()
    {
        return $this->balance != 0;
    }

    public function hasExcess()
    {
        return $this->balance < 0;
    }

    public function hasRefund()
    {
        return $this->balance > 0;
    }
}
