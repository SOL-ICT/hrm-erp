<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientPolicy extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'policy_aggregate_limit',
        'policy_single_limit',
        'policy_start_date',
        'policy_end_date',
        'policy_number',
        'insurer_name',
        'status',
        'notes',
    ];

    protected $casts = [
        'policy_start_date' => 'date',
        'policy_end_date' => 'date',
        'policy_aggregate_limit' => 'decimal:2',
        'policy_single_limit' => 'decimal:2',
    ];

    /**
     * Get the client that owns the policy
     */
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Check if policy is currently active
     */
    public function isActive()
    {
        return $this->status === 'active' 
            && (!$this->policy_end_date || $this->policy_end_date >= now());
    }
}
