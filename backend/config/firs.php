<?php

return [
    /*
    |--------------------------------------------------------------------------
    | FIRS E-Invoicing Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Federal Inland Revenue Service (FIRS) e-invoicing
    | integration. These credentials are provided by FIRS for API access.
    |
    */

    'api_url' => env('FIRS_API_URL', 'https://eivc-k6z6d.ondigitalocean.app/api/v1'),

    'api_key' => env('FIRS_API_KEY', '6cacd8f1-acb6-4ed9-938e-979f5373dbdc'),

    'client_secret' => env('FIRS_CLIENT_SECRET', 'MZL4etFocyJJDYSEbB8bhxGnDF28skqXPKTS7tQIAflSJbiR25vu6sQWpfeHcykvEox1shcaIJTyJt1mLjDaSeQrZcIkNuidZZAe'),

    'entity_id' => env('FIRS_ENTITY_ID', 'e0fd6fb7-064c-44f2-9e53-d326287cff8d'),

    'business_id' => env('FIRS_BUSINESS_ID', '49574f35-c1ea-4533-9618-30048df5aced'),

    'timeout' => env('FIRS_API_TIMEOUT', 30),

    'debug' => env('FIRS_DEBUG', false),

    'sandbox' => env('FIRS_SANDBOX', true), // Set to false in production

    // Business Rules for FIRS Compliance
    'minimum_invoice_amount' => env('FIRS_MINIMUM_INVOICE_AMOUNT', 50000), // Minimum amount requiring FIRS submission
    'require_firs_for_all' => env('FIRS_REQUIRE_FOR_ALL', false), // Force FIRS for all invoices

    // Strategic Outsourcing Limited Details
    'company' => [
        'name' => 'Strategic Outsourcing Limited',
        'tin' => '32506532-0001',
        'address' => [
            'street' => 'Plot 1665, Oyin Jolayemi Street',
            'city' => 'Lagos',
            'state' => 'Lagos State',
            'postal_code' => '101233',
            'country' => 'NG'
        ],
        'email' => 'info@strategicoutsourcing.com.ng',
        'phone' => '+234-803-123-4567'
    ],

    // FIRS Tax Configuration
    'tax_rates' => [
        'vat_rate' => 7.5, // 7.5% VAT
        'wht_rate' => 5.0, // 5% Withholding Tax (if applicable)
    ],

    // FIRS Document Types
    'document_types' => [
        'commercial_invoice' => '380',
        'credit_note' => '381',
        'debit_note' => '383'
    ],

    // PDF Export Settings
    'pdf_export' => [
        'require_approval_for_export' => env('FIRS_REQUIRE_APPROVAL_FOR_PDF', false),
        'include_qr_code' => true,
        'include_compliance_notice' => true,
        'qr_code_size' => '200x200'
    ],

    // QR Code Settings (for MBS 360 App Compliance)
    'use_encrypted_qr_codes' => env('FIRS_USE_ENCODED_QR', true),
    'qr_encoding_method' => 'base64', // FIRS uses base64 encoded JSON, not RSA encryption
];
