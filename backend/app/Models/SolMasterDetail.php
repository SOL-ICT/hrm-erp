<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SolMasterDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'purpose',
        'bank_name',
        'account_name',
        'account_number',
        'sort_code',
        'vat_registration_number',
        'tin',
        'compensation_officer',
        'company_accountant',
        'address',
        'phone',
        'email',
        'is_active',
        // FIRS e-invoicing fields
        'business_description',
        'city',
        'postal_zone',
        'country',
        'business_id'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get active master details for a specific purpose
     *
     * @param string $purpose 'invoice' or 'reimbursement'
     * @return SolMasterDetail|null
     */
    public static function getActiveMasterDetails($purpose = 'invoice')
    {
        return self::where('purpose', $purpose)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Get company information for invoices
     *
     * @return array
     */
    public static function getCompanyInfo()
    {
        $masterDetail = self::getActiveMasterDetails('invoice');

        if (!$masterDetail) {
            // Fallback to default values if no master details exist
            return [
                'name' => 'SOL ICT LIMITED',
                'address' => 'Please configure company address in SOL Master Details',
                'phone' => 'Please configure phone in SOL Master Details',
                'email' => 'Please configure email in SOL Master Details',
                'logo_path' => public_path('images/SOL Logo.png'),
            ];
        }

        return [
            'name' => 'SOL ICT LIMITED',
            'address' => $masterDetail->address ?? 'Please configure address',
            'phone' => $masterDetail->phone ?? 'Please configure phone',
            'email' => $masterDetail->email ?? 'Please configure email',
            'logo_path' => public_path('images/SOL Logo.png'),
            'vat_registration_number' => $masterDetail->vat_registration_number,
            'tin' => $masterDetail->tin,
        ];
    }

    /**
     * Get banking details for invoices
     *
     * @return array
     */
    public static function getBankingDetails()
    {
        $masterDetail = self::getActiveMasterDetails('invoice');

        if (!$masterDetail) {
            // Fallback to placeholder values if no master details exist
            return [
                'bank_name' => 'Please configure banking details in SOL Master Details',
                'account_name' => 'SOL ICT LIMITED',
                'account_number' => 'Please configure account number',
                'sort_code' => 'Please configure sort code',
            ];
        }

        return [
            'bank_name' => $masterDetail->bank_name,
            'account_name' => $masterDetail->account_name,
            'account_number' => $masterDetail->account_number,
            'sort_code' => $masterDetail->sort_code,
        ];
    }

    /**
     * Get signature details for invoices
     *
     * @return array
     */
    public static function getSignatureDetails()
    {
        $masterDetail = self::getActiveMasterDetails('invoice');

        if (!$masterDetail) {
            return [
                'compensation_officer' => 'Compensation Officer',
                'company_accountant' => 'Company Accountant',
            ];
        }

        return [
            'compensation_officer' => $masterDetail->compensation_officer ?? 'Compensation Officer',
            'company_accountant' => $masterDetail->company_accountant ?? 'Company Accountant',
        ];
    }

    /**
     * Get FIRS e-invoicing supplier details
     *
     * @return array
     */
    public static function getFIRSSupplierDetails()
    {
        $masterDetail = self::getActiveMasterDetails('invoice');

        if (!$masterDetail) {
            return [
                'party_name' => 'Strategic Outsourcing Limited',
                'tin' => 'Please configure TIN in SOL Master Details',
                'email' => 'Please configure email in SOL Master Details',
                'telephone' => 'Please configure phone in SOL Master Details',
                'business_description' => 'Human Resources Outsourcing Services',
                'business_id' => 'Please configure FIRS business ID',
                'postal_address' => [
                    'street_name' => 'Please configure address in SOL Master Details',
                    'city_name' => 'Please configure city',
                    'postal_zone' => '',
                    'country' => 'NG'
                ]
            ];
        }

        return [
            'party_name' => 'Strategic Outsourcing Limited',
            'tin' => $masterDetail->tin,
            'email' => $masterDetail->email,
            'telephone' => $masterDetail->phone,
            'business_description' => $masterDetail->business_description ?? 'Human Resources Outsourcing Services',
            'business_id' => $masterDetail->business_id,
            'postal_address' => [
                'street_name' => $masterDetail->address,
                'city_name' => $masterDetail->city,
                'postal_zone' => $masterDetail->postal_zone ?? '',
                'country' => $masterDetail->country ?? 'NG'
            ]
        ];
    }
}
