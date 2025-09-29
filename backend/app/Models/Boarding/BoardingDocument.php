<?php

namespace App\Models\Boarding;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class BoardingDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'boarding_request_id',
        'document_type',
        'document_title',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
        'metadata',
        'is_signed',
        'signed_at',
        'uploaded_by'
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_signed' => 'boolean',
        'signed_at' => 'datetime'
    ];

    protected $dates = [
        'signed_at'
    ];

    // Relationships
    public function boardingRequest(): BelongsTo
    {
        return $this->belongsTo(BoardingRequest::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // Scopes
    public function scopeByType($query, $type)
    {
        return $query->where('document_type', $type);
    }

    public function scopeSigned($query)
    {
        return $query->where('is_signed', true);
    }

    public function scopeUnsigned($query)
    {
        return $query->where('is_signed', false);
    }

    // Helper methods
    public function getFileSizeHumanAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    public function getDocumentTypeDisplayAttribute(): string
    {
        return match($this->document_type) {
            'offer_letter' => 'Offer Letter',
            'contract' => 'Employment Contract',
            'terms_conditions' => 'Terms & Conditions',
            'acceptance_letter' => 'Acceptance Letter',
            'rejection_letter' => 'Rejection Letter',
            'onboarding_checklist' => 'Onboarding Checklist',
            'id_verification' => 'ID Verification',
            'bank_details' => 'Bank Details',
            'tax_forms' => 'Tax Forms',
            default => ucwords(str_replace('_', ' ', $this->document_type))
        };
    }

    public function getDocumentIconAttribute(): string
    {
        return match($this->document_type) {
            'offer_letter', 'acceptance_letter', 'rejection_letter' => '📄',
            'contract', 'terms_conditions' => '📋',
            'onboarding_checklist' => '✅',
            'id_verification' => '🆔',
            'bank_details' => '🏦',
            'tax_forms' => '📊',
            default => '📄'
        };
    }
}
