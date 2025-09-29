<?php

namespace App\Models\Recruitment;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class Test extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'instructions',
        'time_limit_minutes',
        'total_questions',
        'pass_score_percentage',
        'recruitment_request_id',
        'created_by',
        'is_active',
        'difficulty_level',
        'test_type',
        'randomize_questions',
        'show_results_immediately',
        'allow_review',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'randomize_questions' => 'boolean',
        'show_results_immediately' => 'boolean',
        'allow_review' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the recruitment request that owns the test
     */
    public function recruitmentRequest(): BelongsTo
    {
        return $this->belongsTo(RecruitmentRequest::class);
    }

    /**
     * Get the user who created the test
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all questions for this test
     */
    public function questions(): HasMany
    {
        return $this->hasMany(TestQuestion::class)->orderBy('order_number');
    }

    /**
     * Get all assignments for this test
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(TestAssignment::class);
    }

    /**
     * Get all results for this test
     */
    public function results(): HasMany
    {
        return $this->hasMany(TestResult::class);
    }

    /**
     * Get active assignments
     */
    public function activeAssignments(): HasMany
    {
        return $this->hasMany(TestAssignment::class)->whereIn('status', ['pending', 'in_progress']);
    }

    /**
     * Get completed assignments
     */
    public function completedAssignments(): HasMany
    {
        return $this->hasMany(TestAssignment::class)->where('status', 'completed');
    }

    /**
     * Calculate average score for this test
     */
    public function getAverageScoreAttribute()
    {
        return $this->results()->avg('score_percentage') ?? 0;
    }

    /**
     * Calculate pass rate for this test
     */
    public function getPassRateAttribute()
    {
        $total = $this->results()->count();
        if ($total === 0) return 0;
        
        $passed = $this->results()->where('result_status', 'passed')->count();
        return round(($passed / $total) * 100, 2);
    }

    /**
     * Get total questions count
     */
    public function getTotalQuestionsAttribute()
    {
        return $this->questions()->count();
    }

    /**
     * Scope for active tests
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for tests by difficulty level
     */
    public function scopeByDifficulty($query, $level)
    {
        return $query->where('difficulty_level', $level);
    }

    /**
     * Get test statistics
     */
    public function getStatisticsAttribute()
    {
        $totalAssigned = $this->assignments()->count();
        $totalCompleted = $this->results()->count();
        $totalPassed = $this->results()->where('passed', true)->count();
        
        return [
            'total_assigned' => $totalAssigned,
            'total_completed' => $totalCompleted,
            'total_passed' => $totalPassed,
            'completion_rate' => $totalAssigned > 0 ? round(($totalCompleted / $totalAssigned) * 100, 2) : 0,
            'pass_rate' => $totalCompleted > 0 ? round(($totalPassed / $totalCompleted) * 100, 2) : 0,
        ];
    }
}
