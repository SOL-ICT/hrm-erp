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
        'generated_by',
        'generated_at'
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
        'generated_at' => 'datetime'
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
