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
        'payment_mode',
        'bank_name',
        'account_number',
        'wages_type',
        'weekday_ot_rate',
        'holiday_ot_rate',
        'entitled_to_ot',
        'pension_deduction'
    ];

    /**
     * Relationship with Staff
     */
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
