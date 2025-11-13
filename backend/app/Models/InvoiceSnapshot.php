<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'calculation_template_id',
        'export_template_id',
        'invoice_number',
        'invoice_period',
        'employee_calculations',
        'template_snapshot',
        'calculation_metadata',
        'total_gross_salary',
        'total_deductions',
        'total_net_salary',
        'total_service_fees',
        'employee_count',
        'export_metadata',
        'export_file_paths',
        'status',
        'generated_at',
        'sent_at',
        'paid_at',
        'calculation_hash',
        'is_validated',
        'validated_at',
        'validated_by',
        'created_by',
        'updated_by',
        'notes',
    ];

    protected $casts = [
        'employee_calculations' => 'array',
        'template_snapshot' => 'array',
        'calculation_metadata' => 'array',
        'export_metadata' => 'array',
        'export_file_paths' => 'array',
        'total_gross_salary' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'total_net_salary' => 'decimal:2',
        'total_service_fees' => 'decimal:2',
        'is_validated' => 'boolean',
        'generated_at' => 'datetime',
        'sent_at' => 'datetime',
        'paid_at' => 'datetime',
        'validated_at' => 'datetime',
    ];

    /**
     * Get the client this invoice belongs to
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the calculation template used for this invoice
     */
    public function calculationTemplate(): BelongsTo
    {
        return $this->belongsTo(CalculationTemplate::class);
    }

    /**
     * Get the export template used for this invoice
     */
    public function exportTemplate(): BelongsTo
    {
        return $this->belongsTo(ExportTemplate::class);
    }

    /**
     * Scope to filter by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter by client
     */
    public function scopeForClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    /**
     * Scope to filter by period
     */
    public function scopeForPeriod($query, $period)
    {
        return $query->where('invoice_period', $period);
    }

    /**
     * Scope to get validated invoices
     */
    public function scopeValidated($query)
    {
        return $query->where('is_validated', true);
    }

    /**
     * Generate unique invoice number
     */
    public static function generateInvoiceNumber($clientId, $period): string
    {
        $client = Client::find($clientId);
        $prefix = $client ? strtoupper($client->prefix ?? 'INV') : 'INV';
        $timestamp = now()->format('Ymd');
        $sequence = static::where('client_id', $clientId)
            ->where('invoice_period', $period)
            ->count() + 1;

        return sprintf('%s-%s-%s-%03d', $prefix, $period, $timestamp, $sequence);
    }

    /**
     * Calculate and generate hash for integrity checking
     */
    public function generateCalculationHash(): string
    {
        $data = [
            'employee_calculations' => $this->employee_calculations,
            'template_snapshot' => $this->template_snapshot,
            'calculation_metadata' => $this->calculation_metadata,
        ];

        return hash('sha256', json_encode($data, 64)); // JSON_SORT_KEYS = 64
    }

    /**
     * Mark invoice as generated
     */
    public function markAsGenerated(): void
    {
        $this->update([
            'status' => 'generated',
            'generated_at' => now(),
            'calculation_hash' => $this->generateCalculationHash(),
        ]);
    }

    /**
     * Mark invoice as validated
     */
    public function markAsValidated(string $validatedBy): void
    {
        $this->update([
            'is_validated' => true,
            'validated_at' => now(),
            'validated_by' => $validatedBy,
        ]);
    }

    /**
     * Get invoice summary
     */
    public function getSummary(): array
    {
        return [
            'invoice_number' => $this->invoice_number,
            'client' => $this->client->organisation_name ?? 'Unknown Client',
            'period' => $this->invoice_period,
            'employee_count' => $this->employee_count,
            'totals' => [
                'gross_salary' => $this->total_gross_salary,
                'deductions' => $this->total_deductions,
                'net_salary' => $this->total_net_salary,
                'service_fees' => $this->total_service_fees,
            ],
            'status' => $this->status,
            'generated_at' => $this->generated_at,
            'is_validated' => $this->is_validated,
        ];
    }

    /**
     * Recalculate totals from employee calculations
     */
    public function recalculateTotals(): void
    {
        $calculations = $this->employee_calculations ?? [];

        $totals = [
            'gross_salary' => 0,
            'deductions' => 0,
            'net_salary' => 0,
            'service_fees' => 0,
        ];

        foreach ($calculations as $employee) {
            $totals['gross_salary'] += $employee['gross_salary'] ?? 0;
            $totals['deductions'] += $employee['total_deductions'] ?? 0;
            $totals['net_salary'] += $employee['net_salary'] ?? 0;
            $totals['service_fees'] += $employee['service_fees'] ?? 0;
        }

        $this->update([
            'total_gross_salary' => $totals['gross_salary'],
            'total_deductions' => $totals['deductions'],
            'total_net_salary' => $totals['net_salary'],
            'total_service_fees' => $totals['service_fees'],
            'employee_count' => count($calculations),
        ]);
    }
}
