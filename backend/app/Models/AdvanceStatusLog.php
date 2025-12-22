<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdvanceStatusLog extends Model
{
    use HasFactory;

    protected $table = 'advance_status_log';

    public $timestamps = false;

    protected $fillable = [
        'advance_id',
        'from_status',
        'to_status',
        'changed_by',
        'comments',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Relationships
     */
    public function advance()
    {
        return $this->belongsTo(Advance::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
