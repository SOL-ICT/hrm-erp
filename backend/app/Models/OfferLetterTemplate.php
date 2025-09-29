<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OfferLetterTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'client_id',
        'job_structure_id',
        'pay_grade_structure_id',
        'header_config',
        'content',
        'sections',
        'footer_config',
        'variables',
        'status',
        'description',
        'smart_elements',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'header_config' => 'array',
        'content' => 'string',
        'sections' => 'array',
        'footer_config' => 'array',
        'variables' => 'array',
        'smart_elements' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Default header configuration
     */
    public static function getDefaultHeaderConfig(): array
    {
        return [
            'logo' => true,
            'date' => true,
            'company_info' => true
        ];
    }

    /**
     * Default footer configuration with detailed content
     */
    public static function getDefaultFooterConfig(): array
    {
        return [
            'signature_section' => [
                'enabled' => true,
                'content' => [
                    'closing' => 'Yours Sincerely,',
                    'company_line' => 'For: Strategic Outsourcing Limited',
                    'signature_space' => true,
                    'signatory_name' => '[HR Manager Name]',
                    'signatory_title' => 'Human Resources Manager'
                ]
            ],
            'acknowledgment_section' => [
                'enabled' => true,
                'content' => [
                    'title' => 'ACKNOWLEDGEMENT',
                    'text' => 'I acknowledge that if I do not sign and return the acknowledged copy within one (1) month but continue to work after receiving the first month\'s payment, I shall be deemed to have accepted all the terms and conditions contained herein and this letter shall constitute a binding contract of employment between Strategic Outsourcing Limited and myself.'
                ]
            ],
            'acceptance_section' => [
                'enabled' => true,
                'content' => [
                    'title' => 'Acceptance of Offer',
                    'acceptance_text' => 'I, _________________________________, having read and understood the terms and conditions of this offer letter accept the terms and conditions of employment.',
                    'signature_fields' => [
                        'employee_signature' => 'Employee Signature',
                        'date_signed' => 'Date',
                        'witness_signature' => 'Witness Signature'
                    ]
                ]
            ]
        ];
    }

    /**
     * Default template sections
     */
    public static function getDefaultSections(): array
    {
        return [
            [
                'id' => 1,
                'type' => 'greeting',
                'title' => 'Greeting',
                'content' => 'Dear {candidate_name},',
                'formatting' => [
                    'bold' => false,
                    'italic' => false,
                    'underline' => false,
                    'align' => 'left'
                ],
                'collapsible' => false,
                'elements' => []
            ],
            [
                'id' => 2,
                'type' => 'title',
                'title' => 'Letter Title',
                'content' => 'CONTRACT OF EMPLOYMENT',
                'formatting' => [
                    'bold' => true,
                    'italic' => false,
                    'underline' => true,
                    'align' => 'center'
                ],
                'collapsible' => false,
                'elements' => []
            ]
        ];
    }

    /**
     * Default template variables
     */
    public static function getDefaultVariables(): array
    {
        return [
            ['key' => 'candidate_name', 'label' => 'Candidate Name', 'type' => 'text'],
            ['key' => 'job_title', 'label' => 'Job Title', 'type' => 'text'],
            ['key' => 'start_date', 'label' => 'Start Date', 'type' => 'date'],
            ['key' => 'basic_salary', 'label' => 'Basic Salary', 'type' => 'naira']
        ];
    }

    // Relationships
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function jobStructure(): BelongsTo
    {
        return $this->belongsTo(JobStructure::class, 'job_structure_id');
    }

    public function payGradeStructure(): BelongsTo
    {
        return $this->belongsTo(PayGradeStructure::class, 'pay_grade_structure_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForGrade($query, $clientId, $jobStructureId, $payGradeStructureId)
    {
        return $query->where('client_id', $clientId)
            ->where('job_structure_id', $jobStructureId)
            ->where('pay_grade_structure_id', $payGradeStructureId);
    }

    // Helper methods
    public function getSectionsCount(): int
    {
        return is_array($this->sections) ? count($this->sections) : 0;
    }

    public function getVariablesCount(): int
    {
        return is_array($this->variables) ? count($this->variables) : 0;
    }

    /**
     * Generate variables from pay grade salary components
     */
    public function generateVariablesFromPayGrade(): array
    {
        $variables = $this->getDefaultVariables();

        if ($this->payGrade) {
            // Add salary component variables based on pay grade
            $salaryFields = [
                'basic_salary' => 'Basic Salary',
                'housing_allowance' => 'Housing Allowance',
                'transport_allowance' => 'Transport Allowance',
                'medical_allowance' => 'Medical Allowance'
            ];

            foreach ($salaryFields as $field => $label) {
                if ($this->payGrade->$field && $this->payGrade->$field > 0) {
                    $variables[] = [
                        'key' => $field,
                        'label' => $label,
                        'type' => 'naira',
                        'default_value' => $this->payGrade->$field
                    ];
                }
            }
        }

        return $variables;
    }
}
