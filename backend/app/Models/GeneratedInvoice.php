<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GeneratedInvoice extends Model
{
    protected $table = 'generated_invoices';

    protected $fillable = [
        'invoice_number',
        'client_id',
        'attendance_upload_id',
        'invoice_month',
        'invoice_type',
        'total_employees',
        'gross_payroll',
        'total_deductions',
        'net_payroll',
        'management_fee',
        'vat_amount',
        'wht_amount',
        'total_invoice_amount',
        'status',
        'excel_file_path',
        'calculation_breakdown',
        'export_line_items',
        'generated_by',
        'generated_at',
        // FIRS e-invoicing fields
        'firs_submitted',
        'firs_approved',
        'firs_status',
        'firs_invoice_number',
        'firs_reference',
        'firs_irn',
        'firs_certificate',
        'firs_qr_data',
        'firs_response_data',
        'firs_submitted_at',
        'firs_approved_at',
        'firs_last_checked_at',
        'firs_error_message',
        'firs_validation_errors',
        'firs_retry_count',
        'firs_vat_rate',
        'firs_tax_scheme',
        'firs_withholding_tax_applicable',
        // Legacy FIRS fields (for backward compatibility)
        'firs_qr_code',
        'firs_submission_payload',
        'firs_approval_date'
    ];

    protected $casts = [
        'invoice_month' => 'date',
        'gross_payroll' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_payroll' => 'decimal:2',
        'management_fee' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'wht_amount' => 'decimal:2',
        'total_invoice_amount' => 'decimal:2',
        'calculation_breakdown' => 'array',
        'export_line_items' => 'array',
        'generated_at' => 'datetime',
        // FIRS e-invoicing casts
        'firs_submitted' => 'boolean',
        'firs_approved' => 'boolean',
        'firs_response_data' => 'array',
        'firs_validation_errors' => 'array',
        'firs_submitted_at' => 'datetime',
        'firs_approved_at' => 'datetime',
        'firs_last_checked_at' => 'datetime',
        'firs_vat_rate' => 'decimal:2',
        'firs_withholding_tax_applicable' => 'boolean',
        // Legacy FIRS casts (for backward compatibility)
        'firs_submission_payload' => 'array',
        'firs_approval_date' => 'datetime'
    ];

    protected $appends = ['total_amount', 'invoice_period'];

    // Accessors for API consistency
    public function getTotalAmountAttribute()
    {
        return $this->total_invoice_amount;
    }

    public function getInvoicePeriodAttribute()
    {
        return $this->invoice_month ? \Carbon\Carbon::parse($this->invoice_month)->format('F Y') : null;
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function attendanceUpload(): BelongsTo
    {
        return $this->belongsTo(AttendanceUpload::class);
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(InvoiceLineItem::class);
    }
}
