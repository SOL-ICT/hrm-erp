<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffBanking extends Model
{
    use HasFactory;

    protected $table = 'staff_banking';

    protected $fillable = [
        'staff_id',
        'bank_name',
        'account_number',
        'account_name',
        'bvn',
        'sort_code'
    ];

    /**
     * Relationship with Staff
     */
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
