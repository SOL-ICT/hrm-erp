<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\ChangeRequest;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class MiscChangeRequestController extends Controller
{
    /**
     * Nigerian banks for validation
     */
    private const NIGERIAN_BANKS = [
        'Access Bank', 'Citibank', 'Ecobank', 'Fidelity Bank', 'First Bank of Nigeria',
        'First City Monument Bank', 'Guaranty Trust Bank', 'Heritage Bank', 'Keystone Bank',
        'Polaris Bank', 'Stanbic IBTC Bank', 'Standard Chartered Bank', 'Sterling Bank',
        'Union Bank of Nigeria', 'United Bank for Africa', 'Unity Bank', 'Wema Bank', 'Zenith Bank'
    ];

    /**
     * Nigerian states for validation
     */
    private const NIGERIAN_STATES = [
        'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
        'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
        'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
        'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
        'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
    ];

    public function store(Request $request)
    {
        try {
            // 1. Validate file uploads first
            $this->validateFileUploads($request);

            // 2. Get and validate field data
            $allowedFields = ChangeRequest::getAllowedFields();
            $inputData = $request->all();
            $fieldsToChange = array_intersect(array_keys($inputData), $allowedFields);

            if (empty($fieldsToChange)) {
                return response()->json([
                    'message' => 'No valid fields provided',
                    'allowed_fields' => $allowedFields
                ], 422);
            }

            // 3. Validate field values with Nigerian-specific rules
            $validationErrors = $this->validateNigerianFields($request, $fieldsToChange);
            if (!empty($validationErrors)) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validationErrors
                ], 422);
            }

            // 4. Process the change request
            return DB::transaction(function () use ($request, $fieldsToChange) {
                $newValues = [];
                $proofDocuments = [];
                $staffId = auth()->id();

                foreach ($fieldsToChange as $fieldId) {
                    // Store text value
                    $newValues[$fieldId] = $request->input($fieldId);

                    // Handle file uploads for this field
                    $fieldFiles = $this->handleFileUploads($request, $fieldId, $staffId);
                    if (!empty($fieldFiles)) {
                        $proofDocuments[$fieldId] = $fieldFiles;
                    }

                    // Validate proof requirement
                    if (in_array($fieldId, ChangeRequest::getFieldsRequiringProof()) && empty($fieldFiles)) {
                        throw new \Exception("Proof document required for field: {$fieldId}");
                    }
                }

                $changeRequest = ChangeRequest::create([
                    'staff_id' => $staffId,
                    'fields_to_change' => array_values($fieldsToChange),
                    'new_values' => $newValues,
                    'proof_documents' => $proofDocuments,
                    'status' => 'pending',
                    'submitted_at' => now(),
                ]);

                return response()->json([
                    'message' => 'Change request submitted successfully',
                    'id' => $changeRequest->id,
                    'fields_updated' => count($fieldsToChange),
                    'documents_uploaded' => count($proofDocuments)
                ], 201);
            });

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error processing request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get change request history for the authenticated user
     */
    public function getHistory()
    {
        try {
            $staffId = auth()->id();
            
            $requests = ChangeRequest::byStaff($staffId)
                ->orderBy('submitted_at', 'desc')
                ->get()
                ->map(function($item) {
                    return [
                        'id' => $item->id,
                        'date' => $item->submitted_at->format('Y-m-d H:i'),
                        'field' => implode(', ', $item->fields_to_change),
                        'status' => ucfirst($item->status),
                        'submitted_at' => $item->submitted_at->toISOString(),
                        'reviewed_at' => $item->reviewed_at?->toISOString(),
                        'rejection_reason' => $item->rejection_reason
                    ];
                });

            return response()->json($requests);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current field values for the authenticated user (mock endpoint for now)
     */
    public function getCurrentValues()
    {
        // This is the mock endpoint that will return empty response
        // When the real endpoint is implemented, it should return current values from staff profile
        return response()->json([], 404);
    }

    /**
     * Validate file uploads
     */
    private function validateFileUploads(Request $request): void
    {
        $allKeys = array_keys($request->all());
        $fileRules = [];
        
        foreach ($allKeys as $key) {
            if (str_contains($key, '_proof_')) {
                $fileRules[$key] = 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'; // 5MB
            }
        }
        
        $request->validate($fileRules);
    }

    /**
     * Validate Nigerian-specific field requirements
     */
    private function validateNigerianFields(Request $request, array $fields): array
    {
        $errors = [];

        foreach ($fields as $field) {
            $value = $request->input($field);
            
            if (empty($value)) {
                $errors[$field][] = "This field is required";
                continue;
            }

            switch ($field) {
                case 'bvn':
                    if (!preg_match('/^\d{11}$/', $value)) {
                        $errors[$field][] = 'BVN must be exactly 11 digits';
                    }
                    break;

                case 'nin':
                    if (!preg_match('/^\d{11}$/', $value)) {
                        $errors[$field][] = 'NIN must be exactly 11 digits';
                    }
                    break;

                case 'tin':
                    if (!preg_match('/^\d{10,12}$/', $value)) {
                        $errors[$field][] = 'TIN must be 10-12 digits';
                    }
                    break;

                case 'accountNumber':
                    if (!preg_match('/^\d{10}$/', $value)) {
                        $errors[$field][] = 'Nigerian account numbers must be exactly 10 digits';
                    }
                    break;

                case 'rsaNumber':
                    if (!preg_match('/^\d{15}$/', $value)) {
                        $errors[$field][] = 'RSA number must be exactly 15 digits';
                    }
                    break;

                case 'mobileNumber':
                case 'alternativeNumber':
                case 'nokPhone':
                case 'nokAlternativePhone':
                case 'guarantorPhone':
                    $cleanPhone = str_replace(' ', '', $value);
                    if (!preg_match('/^(080|081|090|091|070|071)\d{8}$/', $cleanPhone)) {
                        $errors[$field][] = 'Nigerian phone numbers must follow the format 080xxxxxxxx, 081xxxxxxxx, 090xxxxxxxx, 091xxxxxxxx, 070xxxxxxxx, or 071xxxxxxxx';
                    }
                    break;

                case 'emailAddress':
                case 'nokEmail':
                case 'guarantorEmail':
                    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $errors[$field][] = 'Please enter a valid email address';
                    }
                    break;

                case 'bankName':
                    if (!in_array($value, self::NIGERIAN_BANKS)) {
                        $errors[$field][] = 'Please select a valid Nigerian bank';
                    }
                    break;

                case 'stateOfResidence':
                    if (!in_array($value, self::NIGERIAN_STATES)) {
                        $errors[$field][] = 'Please select a valid Nigerian state';
                    }
                    break;

                case 'nokDateOfBirth':
                    $birthDate = \Carbon\Carbon::parse($value);
                    $eighteenYearsAgo = now()->subYears(18);
                    if ($birthDate->gt($eighteenYearsAgo)) {
                        $errors[$field][] = 'Next of kin must be at least 18 years old';
                    }
                    break;

                case 'guarantorIncome':
                    if (!is_numeric($value) || floatval($value) <= 0) {
                        $errors[$field][] = 'Please enter a valid monthly income amount';
                    }
                    break;
            }
        }

        return $errors;
    }

    /**
     * Handle file uploads for a specific field
     */
    private function handleFileUploads(Request $request, string $fieldId, int $staffId): array
    {
        $fieldFiles = [];
        $fileIndex = 0;

        while ($request->hasFile("{$fieldId}_proof_{$fileIndex}")) {
            $file = $request->file("{$fieldId}_proof_{$fileIndex}");
            
            // Generate secure filename with timestamp
            $timestamp = now()->format('Y-m-d_H-i-s');
            $extension = $file->getClientOriginalExtension();
            $filename = "{$fieldId}_{$timestamp}_{$fileIndex}.{$extension}";
            
            // Store in organized folder structure
            $path = $file->storeAs("staff_proofs/{$staffId}/{$fieldId}", $filename, 'public');
            
            $fieldFiles[] = [
                'name' => $file->getClientOriginalName(),
                'path' => $path,
                'filename' => $filename,
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'uploaded_at' => now()->toISOString()
            ];
            
            $fileIndex++;
        }

        return $fieldFiles;
    }
}