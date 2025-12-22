<?php
// ===== app/Models/Staff.php =====
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    protected $table = 'staff';

    protected $fillable = [
        'candidate_id',
        'client_id',
        'service_location_id',
        'staff_type_id',
        'employee_code',
        'staff_id',
        'employee_id',
        'email',
        'first_name',
        'last_name',
        'middle_name',
        'gender',
        'entry_date',
        'end_date',
        'appointment_status',
        'employment_type',
        'status',
        'pay_grade_structure_id',
        'salary_effective_date',
        'salary_currency',
        'job_title',
        'department',
        'location',
        'state_lga_id',
        'supervisor_id',
        'leave_category_level',
        'appraisal_category',
        'tax_id_no',
        'pf_no',
        'pf_administrator',
        'pfa_code',
        'bv_no',
        'nhf_account_no',
        'client_assigned_code',
        'deployment_code',
        'onboarding_method',
        'onboarded_by',
        'custom_fields',
        'phone',
        'designation',
        'position',
        'hire_date',
        'salary',
        // Recruitment Boarding Enhancement
        'recruitment_request_id',
        'boarding_approval_status',
        'approved_by',
        'approved_at',
        'control_approved_by',
        'control_approved_at',
        'offer_letter_sent_at',
        'offer_already_accepted'
    ];

    protected $casts = [
        'hire_date' => 'date',
        'salary' => 'decimal:2',
        'salary_effective_date' => 'datetime', // Phase 3.1
        'approved_at' => 'datetime',
        'control_approved_at' => 'datetime',
        'offer_letter_sent_at' => 'datetime',
        'offer_already_accepted' => 'boolean'
    ];

    // Note to self - This can be expanded later
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function candidate()
    {
        return $this->belongsTo(Candidate::class);
    }

    public function serviceLocation()
    {
        return $this->belongsTo(ServiceLocation::class);
    }

    public function payGradeStructure()
    {
        return $this->belongsTo(PayGradeStructure::class);
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'staff_roles');
    }

    public function personalInfo()
    {
        return $this->hasOne(StaffPersonalInfo::class);
    }

    public function bankingInfo()
    {
        return $this->hasOne(StaffBanking::class);
    }

    public function legalIds()
    {
        return $this->hasOne(StaffLegalId::class);
    }

    public function education()
    {
        return $this->hasMany(StaffEducation::class);
    }

    public function experience()
    {
        return $this->hasMany(StaffExperience::class);
    }

    public function emergencyContacts()
    {
        return $this->hasMany(StaffEmergencyContact::class);
    }

    public function guarantors()
    {
        return $this->hasMany(StaffGuarantor::class);
    }

    public function references()
    {
        return $this->hasMany(StaffReference::class);
    }

    // Recruitment Boarding Enhancement Relationships
    public function recruitmentRequest()
    {
        return $this->belongsTo(RecruitmentRequest::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function controlApprovedBy()
    {
        return $this->belongsTo(User::class, 'control_approved_by');
    }

    /**
     * Get all offer acceptance logs for this staff member
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function offerLogs()
    {
        return $this->hasMany(StaffOfferAcceptanceLog::class, 'staff_id');
    }

    public function onboardedBy()
    {
        return $this->belongsTo(User::class, 'onboarded_by');
    }

    /**
     * Get the staff member's full name (Phase 3.1)
     */
    public function getFullNameAttribute()
    {
        return trim($this->first_name . ' ' . $this->last_name);
    }

    /**
     * Get the staff member's pay grade (Phase 3.1 - from PayGradeStructure)
     */
    public function getPayGradeAttribute()
    {
        return $this->payGradeStructure?->grade_name ?? $this->designation ?? 'Standard';
    }

    /**
     * Get basic salary for attendance calculations (Phase 3.1 - from PayGradeStructure)
     */
    public function getBasicSalaryAttribute()
    {
        // Get basic salary from pay grade structure emoluments
        $emoluments = $this->payGradeStructure?->emoluments ?? [];

        // Try different possible keys for basic salary
        return $emoluments['basic_salary']
            ?? $emoluments['MONTHLY_FEE']
            ?? $emoluments['monthly_fee']
            ?? $emoluments['Basic Salary']
            ?? $this->salary
            ?? 0;
    }

    /**
     * Get individual allowances from PayGradeStructure (Phase 3.1)
     */
    public function getAllowanceAttribute($allowanceType)
    {
        $emoluments = $this->payGradeStructure?->emoluments ?? [];
        return $emoluments[$allowanceType] ?? 0;
    }

    // Dynamic allowance accessors for AttendanceBasedPayrollService
    public function getHousingAllowanceAttribute()
    {
        return $this->getAllowanceAttribute('housing_allowance');
    }
    public function getTransportAllowanceAttribute()
    {
        return $this->getAllowanceAttribute('transport_allowance');
    }
    public function getMealAllowanceAttribute()
    {
        return $this->getAllowanceAttribute('meal_allowance');
    }
    public function getMedicalAllowanceAttribute()
    {
        return $this->getAllowanceAttribute('medical_allowance');
    }
    public function getUtilityAllowanceAttribute()
    {
        return $this->getAllowanceAttribute('utility_allowance');
    }
    public function getTelephoneAllowanceAttribute()
    {
        return $this->getAllowanceAttribute('telephone_allowance');
    }
    public function getEducationAllowanceAttribute()
    {
        return $this->getAllowanceAttribute('education_allowance');
    }
    public function getLeaveAllowanceAttribute()
    {
        return $this->getAllowanceAttribute('leave_allowance');
    }
    public function getOvertimeAllowanceAttribute()
    {
        return $this->getAllowanceAttribute('overtime_allowance');
    }
}
