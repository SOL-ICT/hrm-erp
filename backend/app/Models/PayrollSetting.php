<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'setting_key',
        'setting_value',
        'setting_type',
        'description',
        'unit',
        'is_active',
        'is_editable',
        'created_by',
        'updated_by',
        'last_modified_reason',
    ];

    protected $casts = [
        'setting_value' => 'array',
        'is_active' => 'boolean',
        'is_editable' => 'boolean',
    ];

    // Relationship to User who created the setting
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Relationship to User who last updated the setting
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
