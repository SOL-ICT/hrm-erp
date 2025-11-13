<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    protected $fillable = [
        'organisation_name',
        'slug',
        'prefix',
        'cac_registration_number',
        'industry_category',
        'client_category',
        'phone',
        'head_office_address',
        'payment_terms',
        'contact_person_name',
        'contact_person_position',
        'contact_person_address',
        'pay_calculation_basis',
        'status',
        // FIRS e-invoicing fields
        'tin',
        'business_description',
        'city',
        'postal_zone',
        'country',
        'contact_person_email',
        'contact_person_phone',
        // FIRS fields (matching frontend ClientMaster.jsx)
        'firs_tin',
        'firs_business_description',
        'firs_city',
        'firs_postal_zone',
        'firs_country',
        'firs_contact_telephone',
        'firs_contact_email'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function staff(): HasMany
    {
        return $this->hasMany(Staff::class);
    }

    public function serviceLocations(): HasMany
    {
        return $this->hasMany(ServiceLocation::class);
    }

    public function jobStructures(): HasMany
    {
        return $this->hasMany(JobStructure::class);
    }

    public function activeJobStructures(): HasMany
    {
        return $this->hasMany(JobStructure::class)->where('is_active', true);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(ClientContract::class);
    }

    public function activeContracts(): HasMany
    {
        return $this->hasMany(ClientContract::class)->where('status', 'active');
    }

    public function recruitmentRequests(): HasMany
    {
        return $this->hasMany(RecruitmentRequest::class);
    }
}
