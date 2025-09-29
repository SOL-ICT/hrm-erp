<?php

namespace App\Models\Boarding;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use App\Models\Candidate;
use App\Models\Client;
use App\Models\JobStructure;
use App\Models\PayGradeStructure;
use App\Models\User;

class StaffProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'boarding_request_id',
        'candidate_id',
        'client_id',
        'employee_id',
        'sol_staff_id',
        'job_structure_id',
        'pay_grade_id',
        'current_salary',
        'start_date',
        'end_date',
        'employment_status',
        'contract_terms',
        'performance_history',
        'salary_history',
        'termination_reason',
        'terminated_at',
        'created_by'
    ];

    protected $casts = [
        'current_salary' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'performance_history' => 'array',
        'salary_history' => 'array',
        'terminated_at' => 'datetime'
    ];

    protected $dates = [
        'start_date',
        'end_date',
        'terminated_at'
    ];

    // Relationships
    public function boardingRequest(): BelongsTo
    {
        return $this->belongsTo(BoardingRequest::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function jobStructure(): BelongsTo
    {
        return $this->belongsTo(JobStructure::class);
    }

    public function payGrade(): BelongsTo
    {
        return $this->belongsTo(PayGradeStructure::class, 'pay_grade_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('employment_status', 'active');
    }

    public function scopeTerminated($query)
    {
        return $query->where('employment_status', 'terminated');
    }

    public function scopeByClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    // Helper methods
    public function isActive(): bool
    {
        return $this->employment_status === 'active';
    }

    public function isTerminated(): bool
    {
        return $this->employment_status === 'terminated';
    }

    public function getFullNameAttribute(): string
    {
        return $this->candidate->first_name . ' ' . 
               ($this->candidate->middle_name ? $this->candidate->middle_name . ' ' : '') . 
               $this->candidate->last_name;
    }

    public function getEmploymentDurationAttribute(): string
    {
        $start = Carbon::parse($this->start_date);
        $end = $this->end_date ? Carbon::parse($this->end_date) : now();
        
        $duration = $start->diffInMonths($end);
        
        if ($duration < 12) {
            return $duration . ' month' . ($duration !== 1 ? 's' : '');
        }
        
        $years = intval($duration / 12);
        $months = $duration % 12;
        
        $result = $years . ' year' . ($years !== 1 ? 's' : '');
        if ($months > 0) {
            $result .= ' ' . $months . ' month' . ($months !== 1 ? 's' : '');
        }
        
        return $result;
    }

    public function addPerformanceReview(array $review): void
    {
        $history = $this->performance_history ?? [];
        $history[] = array_merge($review, ['date' => now()->toISOString()]);
        $this->update(['performance_history' => $history]);
    }

    public function addSalaryChange(float $newSalary, string $reason): void
    {
        $history = $this->salary_history ?? [];
        $history[] = [
            'previous_salary' => $this->current_salary,
            'new_salary' => $newSalary,
            'reason' => $reason,
            'effective_date' => now()->toISOString(),
            'changed_by' => Auth::id()
        ];
        
        $this->update([
            'current_salary' => $newSalary,
            'salary_history' => $history
        ]);
    }
}
