<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class BoardingTimeline extends Model
{
    use HasFactory;

    protected $table = 'boarding_timeline';

    protected $fillable = [
        'boarding_request_id',
        'action',
        'description',
        'details',
        'performed_by',
        'performed_at'
    ];

    protected $casts = [
        'details' => 'array',
        'performed_at' => 'datetime'
    ];

    // Relationships
    public function boardingRequest(): BelongsTo
    {
        return $this->belongsTo(BoardingRequest::class);
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    // Static methods for common timeline entries
    public static function logAction($boardingRequestId, $action, $description, $details = null, $performedBy = null)
    {
        return self::create([
            'boarding_request_id' => $boardingRequestId,
            'action' => $action,
            'description' => $description,
            'details' => $details,
            'performed_by' => $performedBy ?? Auth::id(),
            'performed_at' => now()
        ]);
    }
}
