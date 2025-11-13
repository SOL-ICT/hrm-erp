# FIRS E-Invoicing Integration Setup Guide

## Overview

This document provides comprehensive setup instructions for the FIRS (Federal Inland Revenue Service) E-Invoicing integration in the HRM-ERP system.

## Prerequisites

- Laravel application with backend configured
- Next.js frontend application
- FIRS API credentials from the Federal Inland Revenue Service

## Environment Configuration

### 1. Backend Configuration (.env file)

Add the following FIRS configuration variables to your `.env` file:

```env
# FIRS E-Invoicing Configuration
FIRS_API_URL=https://api.firs.gov.ng/einvoicing
FIRS_API_KEY=6cacd8f1-acb6-4ed9-938e-979f5373dbdc
FIRS_CLIENT_SECRET=MZL4etFocyJJDYSEbB8bhxGnDF28skqXPKTS7tQIAflSJbiR25vu6sQWpfeHcykvEox1shcaIJTyJt1mLjDaSeQrZcIkNuidZZAe
FIRS_ENTITY_ID=e0fd6fb7-064c-44f2-9e53-d326287cff8d
FIRS_BUSINESS_ID=49574f35-c1ea-4533-9618-30048df5aced
FIRS_ENVIRONMENT=production
FIRS_TIMEOUT=30
FIRS_DEBUG=false
```

### 2. Configuration File

The system uses `config/firs.php` for centralized FIRS configuration management.

## Client Setup (Contract Management)

### Location: Contract Management → Client Master → Invoice & Payment Information

Required FIRS fields for each client:

- **TIN (Tax Identification Number)** - Mandatory for FIRS compliance
- **Business Description** - Client's business nature
- **Contact Person Address** - Street address
- **City** - Client city
- **Postal Zone** - Postal/ZIP code
- **Country** - Default: NG (Nigeria)
- **FIRS Status** - Active/Inactive

## Invoice Generation Workflow

### 1. FIRS Modal Process

- **Step 1**: Basic FIRS Information
  - Payment Status (Pending/Paid/Overdue)
  - Order Reference (Manual/PO Number)
  - PO Number (if applicable)
- **Step 2**: Billing References (Multiple entries allowed)
  - IRN (Invoice Reference Number)
  - Issue Date

### 2. API Integration

- Invoice Type Code: 380 (Standard Commercial Invoice)
- IRN Format: `INV{id}-064CC1EA-{YYYYMMDD}`
- Currency: NGN (Nigerian Naira)

## Enhanced PDF Content

### Standard Invoice Information

- Company logo and details
- Client information
- Invoice number and dates
- Service description
- Itemized costs breakdown
- Tax calculations
- Payment terms
- Signatures section

### FIRS Compliance Data

- **FIRS IRN**: Government-assigned invoice reference
- **Entity ID**: FIRS entity identifier
- **Business ID**: FIRS business identifier
- **Invoice Type**: 380 (Commercial Invoice)
- **Payment Status**: Current payment state
- **Service Period**: Invoice delivery period
- **QR Code**: FIRS-generated QR code for verification
- **Compliance Statement**: FIRS submission confirmation

### Additional FIRS Elements

- Government compliance disclaimer
- QR code positioning (bottom right)
- FIRS branding requirements
- Tax authority validation marks

## Database Schema

### Client Table (FIRS Fields)

```sql
-- FIRS E-Invoicing fields
firs_tin VARCHAR(50),
firs_business_description TEXT,
firs_contact_address TEXT,
firs_city VARCHAR(100),
firs_postal_zone VARCHAR(20),
firs_country VARCHAR(10) DEFAULT 'NG',
firs_status ENUM('active', 'inactive') DEFAULT 'active'
```

### AttendanceUpload Table (FIRS Tracking)

```sql
-- FIRS submission tracking
firs_submitted_at TIMESTAMP NULL,
firs_irn VARCHAR(100) NULL,
firs_reference VARCHAR(100) NULL,
firs_status ENUM('pending', 'submitted', 'approved', 'rejected') DEFAULT 'pending',
firs_qr_code LONGTEXT NULL,
firs_response_data JSON NULL
```

## API Endpoints

### FIRS Invoice Submission

- **POST** `/api/admin/firs-invoice/submit/{uploadId}`
- Submits invoice to FIRS API
- Returns FIRS response with IRN and QR code

### QR Code Generation

- **POST** `/api/admin/firs-invoice/{uploadId}/generate-qr`
- Generates FIRS QR code for approved invoices

### PDF Export with FIRS Data

- **GET** `/api/admin/invoices/{uploadId}/export-pdf`
- Exports PDF with complete FIRS compliance information

## Production Deployment

### Security Considerations

1. Store FIRS credentials in environment variables
2. Use HTTPS for all API communications
3. Implement proper error handling and logging
4. Regular credential rotation as per FIRS requirements

### Monitoring

- Log all FIRS API interactions
- Monitor submission success rates
- Track compliance status
- Alert on API failures

## Troubleshooting

### Common Issues

1. **Missing TIN**: Ensure client has valid TIN configured
2. **API Timeout**: Check FIRS service availability
3. **Invalid Credentials**: Verify API key and secret
4. **QR Code Generation**: Ensure invoice is FIRS-approved

### Support

- FIRS Technical Support: [FIRS Contact Information]
- System Administrator: [Internal Contact]

## Compliance Notes

- All commercial invoices require FIRS submission
- QR codes must be visible on printed invoices
- Maintain audit trail of all submissions
- Regular compliance reporting to FIRS

---

_Last Updated: January 2025_
_Version: 1.0_
