<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffLegalId extends Model
{
    use HasFactory;

    protected $table = 'staff_legal_ids';

    protected $fillable = [
        'staff_id',
        'national_id_no',
        'tax_id_no',
        'pension_pin',
        'pfa_name',
        'bank_verification_no',
        'nhf_account_no'
    ];

    /**
     * Relationship with Staff
     */
    public function staff()
    {
        return $this->belongsTo(Staff::class);
    }
}
