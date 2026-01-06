<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FidelityClaimDocument extends Model
{
    protected $fillable = [
        'claim_id',
        'document_name',
        'is_provided',
        'file_path',
    ];

    protected $casts = [
        'is_provided' => 'boolean',
    ];

    public function claim(): BelongsTo
    {
        return $this->belongsTo(FidelityClaim::class, 'claim_id');
    }
}
