<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RetirementItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'retirement_id',
        'description',
        'amount',
        'receipt_reference',
        'transaction_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date',
    ];

    /**
     * Relationships
     */
    public function retirement()
    {
        return $this->belongsTo(Retirement::class);
    }
}
