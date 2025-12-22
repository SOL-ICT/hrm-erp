<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vendor extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'vendor_code',
        'vendor_name',
        'contact_person',
        'contact_phone',
        'contact_email',
        'address',
        'category',
        'status',
        'notes',
        'total_transactions',
        'transaction_count',
        'last_transaction_date',
        'created_by',
    ];

    protected $casts = [
        'total_transactions' => 'decimal:2',
        'transaction_count' => 'integer',
        'last_transaction_date' => 'datetime',
    ];

    /**
     * Relationships
     */
    public function procurementLogs()
    {
        return $this->hasMany(ProcurementLog::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    public function scopeBlacklisted($query)
    {
        return $query->where('status', 'blacklisted');
    }
}
