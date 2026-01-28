<?php

namespace App\Models\Candidate;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\Recruitment\RecruitmentRequest;
use App\Models\Candidate;

class CandidateJobApplication extends Model
{
    use HasFactory;

    protected $fillable = [
        'candidate_id',
        'recruitment_request_id',
        'service_location_id', // NEW: Track which specific location candidate applied to
        'application_status',
        'cover_letter',
        'salary_expectations',
        'motivation',
        'availability',
        'meets_location_criteria',
        'meets_age_criteria',
        'meets_experience_criteria',
        'eligibility_score',
        'is_eligible',
        'applied_at',
        'last_status_change',
        'status_history',
    ];

    protected $casts = [
        'salary_expectations' => 'array',
        'availability' => 'array',
        'meets_location_criteria' => 'boolean',
        'meets_age_criteria' => 'boolean',
        'meets_experience_criteria' => 'boolean',
        'eligibility_score' => 'decimal:2',
        'applied_at' => 'datetime',
        'last_status_change' => 'datetime',
        'status_history' => 'array',
    ];

    // Relationships
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function recruitmentRequest(): BelongsTo
    {
        return $this->belongsTo(RecruitmentRequest::class);
    }

    // Eligibility checking methods
    public function checkLocationCriteria(): bool
    {
        if (!$this->candidate || !$this->recruitmentRequest) {
            return false;
        }

        // Check if candidate's location matches the job's location requirements
        $candidateLocation = $this->candidate->current_lga ?? $this->candidate->lga;
        $jobLocation = $this->recruitmentRequest->lga;

        if (!$candidateLocation || !$jobLocation) {
            return false;
        }

        $meets = strtolower($candidateLocation) === strtolower($jobLocation);
        $this->update(['meets_location_criteria' => $meets]);
        
        return $meets;
    }

    public function checkAgeCriteria(): bool
    {
        if (!$this->candidate || !$this->recruitmentRequest) {
            return false;
        }

        $candidateAge = $this->candidate->age;
        $minAge = $this->recruitmentRequest->age_limit_min;
        $maxAge = $this->recruitmentRequest->age_limit_max;

        if (!$candidateAge) {
            return false;
        }

        $meets = true;
        if ($minAge && $candidateAge < $minAge) {
            $meets = false;
        }
        if ($maxAge && $candidateAge > $maxAge) {
            $meets = false;
        }

        $this->update(['meets_age_criteria' => $meets]);
        
        return $meets;
    }

    public function checkExperienceCriteria(): bool
    {
        if (!$this->candidate || !$this->recruitmentRequest) {
            return false;
        }

        $candidateExperience = $this->candidate->years_of_experience ?? 0;
        $requiredExperience = $this->recruitmentRequest->experience_requirement ?? 0;

        $meets = $candidateExperience >= $requiredExperience;
        $this->update(['meets_experience_criteria' => $meets]);
        
        return $meets;
    }

    public function checkAllCriteria(): array
    {
        $location = $this->checkLocationCriteria();
        $age = $this->checkAgeCriteria();
        $experience = true; // Always pass experience criteria
        
        // Set experience criteria to true in database
        $this->update(['meets_experience_criteria' => true]);

        // Calculate eligibility score (out of 100) - only age and location matter
        $score = 0;
        if ($location) $score += 50; // Location gets 50%
        if ($age) $score += 50; // Age gets 50%

        $isEligible = $score >= 100; // Must meet both age and location criteria

        $this->update([
            'eligibility_score' => $score,
            'is_eligible' => $isEligible
        ]);

        return [
            'location' => $location,
            'age' => $age,
            'experience' => $experience,
            'score' => $score,
            'is_eligible' => $isEligible
        ];
    }

    public function checkAllCriteriaWithoutSaving(): array
    {
        $location = $this->checkLocationCriteriaWithoutSaving();
        $age = $this->checkAgeCriteriaWithoutSaving();
        $experience = true; // Always pass experience criteria

        // Calculate eligibility score (out of 100) - only age and location matter
        $score = 0;
        if ($location) $score += 50; // Location gets 50%
        if ($age) $score += 50; // Age gets 50%

        $isEligible = $score >= 100; // Must meet both age and location criteria

        return [
            'location' => $location,
            'age' => $age,
            'experience' => $experience,
            'score' => $score,
            'is_eligible' => $isEligible
        ];
    }

    private function checkLocationCriteriaWithoutSaving(): bool
    {
        if (!$this->candidate || !$this->recruitmentRequest) {
            return false;
        }

        // Get candidate's permanent residence state from candidate profile
        $candidateProfile = $this->candidate->profile;
        if (!$candidateProfile || !$candidateProfile->state_of_residence_permanent) {
            return false;
        }
        
        $candidateState = $candidateProfile->state_of_residence_permanent;
        
        // Get job location state from the service location
        $jobState = null;
        if ($this->recruitmentRequest->serviceLocation && $this->recruitmentRequest->serviceLocation->state) {
            $jobState = $this->recruitmentRequest->serviceLocation->state;
        }

        if (!$candidateState || !$jobState) {
            return false;
        }

        // Compare states (case-insensitive)
        return strtolower(trim($candidateState)) === strtolower(trim($jobState));
    }

    private function checkAgeCriteriaWithoutSaving(): bool
    {
        if (!$this->candidate || !$this->recruitmentRequest) {
            return false;
        }

        $candidateAge = $this->candidate->age;
        $minAge = $this->recruitmentRequest->age_limit_min;
        $maxAge = $this->recruitmentRequest->age_limit_max;

        if (!$candidateAge) {
            return false;
        }

        $meets = true;
        if ($minAge && $candidateAge < $minAge) {
            $meets = false;
        }
        if ($maxAge && $candidateAge > $maxAge) {
            $meets = false;
        }

        return $meets;
    }

    private function checkExperienceCriteriaWithoutSaving(): bool
    {
        if (!$this->candidate || !$this->recruitmentRequest) {
            return false;
        }

        $candidateExperience = $this->candidate->years_of_experience ?? 0;
        $requiredExperience = $this->recruitmentRequest->experience_requirement ?? 0;

        return $candidateExperience >= $requiredExperience;
    }

    // Status management
    public function updateStatus(string $status, string $reason = null): void
    {
        $oldStatus = $this->application_status;
        
        $this->update([
            'application_status' => $status,
            'last_status_change' => now(),
            'status_history' => array_merge($this->status_history ?? [], [
                [
                    'from' => $oldStatus,
                    'to' => $status,
                    'reason' => $reason,
                    'changed_at' => now()->toISOString(),
                    'changed_by' => Auth::id() ?? 'system'
                ]
            ])
        ]);
    }

    // Accessors
    public function getFormattedSalaryExpectationsAttribute(): string
    {
        if (!$this->salary_expectations) {
            return 'Not specified';
        }

        $amount = $this->salary_expectations['amount'] ?? 0;
        $currency = $this->salary_expectations['currency'] ?? 'NGN';

        return number_format($amount) . ' ' . $currency;
    }

    public function getIsEligibleAttribute(): bool
    {
        return (bool) ($this->attributes['is_eligible'] ?? false);
    }

    // Scopes
    public function scopeEligible($query)
    {
        return $query->where('is_eligible', true);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('application_status', $status);
    }

    public function scopeForRecruitmentRequest($query, int $recruitmentRequestId)
    {
        return $query->where('recruitment_request_id', $recruitmentRequestId);
    }

    public function scopeForCandidate($query, int $candidateId)
    {
        return $query->where('candidate_id', $candidateId);
    }

    // Constants for application status
    const STATUS_APPLIED = 'applied';
    const STATUS_UNDER_REVIEW = 'under_review';
    const STATUS_SHORTLISTED = 'shortlisted';
    const STATUS_INTERVIEWED = 'interviewed';
    const STATUS_OFFERED = 'offered';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_REJECTED = 'rejected';
    const STATUS_WITHDRAWN = 'withdrawn';

    public static function getStatuses(): array
    {
        return [
            self::STATUS_APPLIED => 'Applied',
            self::STATUS_UNDER_REVIEW => 'Under Review',
            self::STATUS_SHORTLISTED => 'Shortlisted',
            self::STATUS_INTERVIEWED => 'Interviewed',
            self::STATUS_OFFERED => 'Offered',
            self::STATUS_ACCEPTED => 'Accepted',
            self::STATUS_REJECTED => 'Rejected',
            self::STATUS_WITHDRAWN => 'Withdrawn',
        ];
    }
}
