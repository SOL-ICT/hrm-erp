<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExportTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'name',
        'description',
        'version',
        'format',
        'column_mappings',
        'formatting_rules',
        'grouping_rules',
        'use_credit_to_bank_model',
        'service_fee_percentage',
        'fee_calculation_rules',
        'header_config',
        'footer_config',
        'styling_config',
        'is_active',
        'is_default',
        'created_by',
        'updated_by',
        'last_used_at',
    ];

    protected $casts = [
        'column_mappings' => 'array',
        'formatting_rules' => 'array',
        'grouping_rules' => 'array',
        'fee_calculation_rules' => 'array',
        'header_config' => 'array',
        'footer_config' => 'array',
        'styling_config' => 'array',
        'use_credit_to_bank_model' => 'boolean',
        'service_fee_percentage' => 'decimal:2',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'last_used_at' => 'datetime',
    ];

    /**
     * Get the client that owns this export template
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Get the invoice snapshots that use this export template
     */
    public function invoiceSnapshots(): HasMany
    {
        return $this->hasMany(InvoiceSnapshot::class);
    }

    /**
     * Scope to get active templates
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get default templates
     */
    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    /**
     * Scope to filter by client
     */
    public function scopeForClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    /**
     * Scope to filter by format
     */
    public function scopeByFormat($query, $format)
    {
        return $query->where('format', $format);
    }

    /**
     * Get header configuration with default fallbacks
     */
    public function getHeaderConfigWithDefaults(): array
    {
        $defaults = [
            'show_header' => true,
            'company_name' => $this->client->organisation_name ?? 'Company Name',
            'company_logo' => null,
            'title' => 'Payroll Invoice',
            'subtitle' => 'Monthly Salary Payment',
            'period' => date('F Y'),
            'generated_date' => date('Y-m-d'),
            'reference_number' => 'INV-' . date('Ymd') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT),
        ];

        return array_merge($defaults, $this->header_config ?? []);
    }

    /**
     * Get footer configuration with default fallbacks
     */
    public function getFooterConfigWithDefaults(): array
    {
        $defaults = [
            'show_footer' => true,
            'payment_instructions' => 'Please process payment within 24 hours of receipt.',
            'contact_info' => 'For queries, contact finance@company.com',
            'generated_by' => 'HRM-ERP System',
            'generation_timestamp' => now()->format('Y-m-d H:i:s'),
        ];

        return array_merge($defaults, $this->footer_config ?? []);
    }

    /**
     * Get export columns from column mappings
     */
    public function getExportColumns(): array
    {
        $columns = [];

        if (!empty($this->column_mappings)) {
            foreach ($this->column_mappings as $key => $mapping) {
                $columns[] = [
                    'key' => $key,
                    'source' => $key, // The source field in the data array
                    'label' => $mapping['label'] ?? ucwords(str_replace('_', ' ', $key)),
                    'type' => $mapping['type'] ?? 'text',
                    'format' => $mapping['format'] ?? 'text',
                    'width' => $mapping['width'] ?? 15,
                    'alignment' => $mapping['alignment'] ?? 'left'
                ];
            }
        }

        return $columns;
    }

    /**
     * Get formatting rules with default fallbacks
     */
    public function getFormattingRulesWithDefaults(): array
    {
        $defaults = [
            'currency_fields' => ['basic_salary', 'housing_allowance', 'transport_allowance', 'lunch_allowance', 'gross_salary', 'income_tax', 'pension', 'net_salary'],
            'date_fields' => ['payment_date', 'generated_at'],
            'number_fields' => ['employee_id'],
            'text_fields' => ['employee_name', 'designation', 'payment_reference', 'employee_bank'],
            'currency_symbol' => '₦',
            'currency_format' => '#,##0.00',
            'date_format' => 'Y-m-d',
            'decimal_places' => 2,
        ];

        return array_merge($defaults, $this->formatting_rules ?? []);
    }

    /**
     * Get styling configuration with default fallbacks
     */
    public function getStylingConfigWithDefaults(): array
    {
        $defaults = [
            'font_family' => 'Arial',
            'font_size' => 10,
            'header_font_size' => 14,
            'currency_format' => '₦#,##0.00',
            'date_format' => 'Y-m-d',
            'show_borders' => true,
            'zebra_stripes' => true,
            'highlight_totals' => true,
        ];

        return array_merge($defaults, $this->styling_config ?? []);
    }

    /**
     * Get export configuration as structured array
     */
    public function getExportConfiguration(): array
    {
        return [
            'format' => $this->format,
            'columns' => $this->column_mappings ?? [],
            'formatting' => $this->formatting_rules ?? [],
            'grouping' => $this->grouping_rules ?? [],
            'branding' => [
                'header' => $this->header_config ?? [],
                'footer' => $this->footer_config ?? [],
                'styling' => $this->styling_config ?? [],
            ],
        ];
    }

    /**
     * Get fee configuration
     */
    public function getFeeConfiguration(): array
    {
        return [
            'use_credit_to_bank' => $this->use_credit_to_bank_model,
            'service_fee_percentage' => $this->service_fee_percentage ?? 0.00,
            'calculation_rules' => $this->fee_calculation_rules ?? [],
        ];
    }

    /**
     * Set this template as the default for its client
     */
    public function setAsDefault(): void
    {
        // First, unset any existing default for this client
        static::where('client_id', $this->client_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        // Then set this template as default
        $this->update(['is_default' => true]);
    }

    /**
     * Mark template as used
     */
    public function markAsUsed(): void
    {
        $this->update(['last_used_at' => now()]);
    }

    /**
     * Create a new version of this template
     */
    public function createNewVersion(array $changes = []): self
    {
        $newVersion = $this->replicate(['last_used_at']);

        // Increment version
        $currentVersion = (float) $this->version;
        $newVersion->version = number_format($currentVersion + 0.1, 1);

        // Apply changes
        $newVersion->fill($changes);

        // Set as default and deactivate old version
        $newVersion->is_default = true;
        $this->update(['is_default' => false, 'is_active' => false]);

        $newVersion->save();

        return $newVersion;
    }

    /**
     * Get supported export formats
     */
    public static function getSupportedFormats(): array
    {
        return [
            'excel' => 'Microsoft Excel (.xlsx)',
            'pdf' => 'Portable Document Format (.pdf)',
            'csv' => 'Comma Separated Values (.csv)',
            'json' => 'JavaScript Object Notation (.json)',
        ];
    }

    /**
     * Validate column mappings structure
     */
    public function validateColumnMappings(array $mappings): bool
    {
        $requiredFields = [
            'employee_name',
            'employee_id',
            'gross_salary',
            'total_deductions',
            'net_salary'
        ];

        foreach ($requiredFields as $field) {
            if (!isset($mappings[$field])) {
                return false;
            }
        }

        return true;
    }
}
