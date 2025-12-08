<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StaffOfferAcceptanceLog extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'staff_offer_acceptance_log';

    /**
     * Indicates if the model should be timestamped.
     * Table only has created_at, no updated_at
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'staff_id',
        'action',
        'notes',
        'actioned_by',
        'metadata',
    ];

    /**
     * Valid action types for offer acceptance workflow
     */
    const ACTION_SENT = 'sent';
    const ACTION_ACCEPTED = 'accepted';
    const ACTION_REJECTED = 'rejected';
    const ACTION_SUSPENDED = 'suspended';
    const ACTION_TERMINATED = 'terminated';
    const ACTION_REMINDED = 'reminded';

    /**
     * Get the staff member this log entry belongs to
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function staff()
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    /**
     * Get the user who performed this action
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function actionedBy()
    {
        return $this->belongsTo(User::class, 'actioned_by');
    }

    /**
     * Scope to filter by action type
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $action
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope to get logs for a specific staff member
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $staffId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForStaff($query, $staffId)
    {
        return $query->where('staff_id', $staffId);
    }

    /**
     * Create a log entry for offer sent
     *
     * @param int $staffId
     * @param int|null $actionedBy
     * @param string|null $notes
     * @param array|null $metadata
     * @return StaffOfferAcceptanceLog
     */
    public static function logOfferSent($staffId, $actionedBy = null, $notes = null, $metadata = null)
    {
        return self::create([
            'staff_id' => $staffId,
            'action' => self::ACTION_SENT,
            'actioned_by' => $actionedBy,
            'notes' => $notes,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Create a log entry for offer accepted
     *
     * @param int $staffId
     * @param int|null $actionedBy
     * @param string|null $notes
     * @param array|null $metadata
     * @return StaffOfferAcceptanceLog
     */
    public static function logOfferAccepted($staffId, $actionedBy = null, $notes = null, $metadata = null)
    {
        return self::create([
            'staff_id' => $staffId,
            'action' => self::ACTION_ACCEPTED,
            'actioned_by' => $actionedBy,
            'notes' => $notes,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Create a log entry for offer rejected
     *
     * @param int $staffId
     * @param int|null $actionedBy
     * @param string|null $notes
     * @param array|null $metadata
     * @return StaffOfferAcceptanceLog
     */
    public static function logOfferRejected($staffId, $actionedBy = null, $notes = null, $metadata = null)
    {
        return self::create([
            'staff_id' => $staffId,
            'action' => self::ACTION_REJECTED,
            'actioned_by' => $actionedBy,
            'notes' => $notes,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Create a log entry for staff suspended
     *
     * @param int $staffId
     * @param string|null $notes
     * @param array|null $metadata
     * @return StaffOfferAcceptanceLog
     */
    public static function logSuspended($staffId, $notes = null, $metadata = null)
    {
        return self::create([
            'staff_id' => $staffId,
            'action' => self::ACTION_SUSPENDED,
            'notes' => $notes,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Create a log entry for staff terminated
     *
     * @param int $staffId
     * @param string|null $notes
     * @param array|null $metadata
     * @return StaffOfferAcceptanceLog
     */
    public static function logTerminated($staffId, $notes = null, $metadata = null)
    {
        return self::create([
            'staff_id' => $staffId,
            'action' => self::ACTION_TERMINATED,
            'notes' => $notes,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Create a log entry for reminder sent
     *
     * @param int $staffId
     * @param string|null $notes
     * @param array|null $metadata
     * @return StaffOfferAcceptanceLog
     */
    public static function logReminded($staffId, $notes = null, $metadata = null)
    {
        return self::create([
            'staff_id' => $staffId,
            'action' => self::ACTION_REMINDED,
            'notes' => $notes,
            'metadata' => $metadata,
        ]);
    }
}
