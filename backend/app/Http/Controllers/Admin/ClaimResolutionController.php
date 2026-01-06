<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FidelityClaim;
use App\Models\ClaimEvidence;
use App\Models\Client;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

/**
 * Claims Resolution Controller
 * 
 * Handles active claims management, dashboard statistics, and claim actions
 * (accept, decline, file with insurer)
 */
class ClaimResolutionController extends Controller
{
    /**
     * Get dashboard statistics and active claims
     * 
     * Returns:
     * - Statistics cards (total, pending, exposure, settled)
     * - Claims requiring action (client_reported + sol_under_review)
     * - Recent activity
     */
    public function index(Request $request)
    {
        try {
            // Get statistics
            $stats = [
                'total_claims' => FidelityClaim::count(),
                'client_reported' => FidelityClaim::where('status', 'client_reported')->count(),
                'sol_under_review' => FidelityClaim::where('status', 'sol_under_review')->count(),
                'sol_accepted' => FidelityClaim::where('status', 'sol_accepted')->count(),
                'sol_declined' => FidelityClaim::where('status', 'sol_declined')->count(),
                'insurer_processing' => FidelityClaim::where('status', 'insurer_processing')->count(),
                'insurer_settled' => FidelityClaim::where('status', 'insurer_settled')->count(),
                'total_exposure' => FidelityClaim::sum('reported_loss'),
                'settled_amount' => FidelityClaim::whereNotNull('settlement_amount')->sum('settlement_amount'),
                'pending_review' => FidelityClaim::whereIn('status', ['client_reported', 'sol_under_review'])->count(),
            ];

            // Get active claims (not settled)
            $activeClaims = FidelityClaim::with(['client', 'staff', 'solEvaluator', 'evidence'])
                ->active()
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($claim) {
                    return [
                        'id' => $claim->id,
                        'claim_number' => $claim->claim_number,
                        'client_id' => $claim->client_id,
                        'client_name' => $claim->client->organisation_name,
                        'client_contact' => $claim->client_contact_name,
                        'client_email' => $claim->client_contact_email,
                        'staff_id' => $claim->staff_id,
                        'staff_name' => trim("{$claim->staff->first_name} {$claim->staff->middle_name} {$claim->staff->last_name}"),
                        'staff_position' => $claim->staff_position,
                        'assignment_start_date' => $claim->assignment_start_date->format('Y-m-d'),
                        'incident_description' => $claim->incident_description,
                        'reported_loss' => $claim->reported_loss,
                        'policy_single_limit' => $claim->policy_single_limit,
                        'policy_aggregate_limit' => $claim->policy_aggregate_limit,
                        'status' => $claim->status,
                        'sol_evaluation_status' => $claim->sol_evaluation_status,
                        'sol_notes' => $claim->sol_notes,
                        'insurer_claim_id' => $claim->insurer_claim_id,
                        'insurer_status' => $claim->insurer_status,
                        'settlement_amount' => $claim->settlement_amount,
                        'evidence_count' => $claim->evidence->count(),
                        'created_at' => $claim->created_at->toISOString(),
                    ];
                });

            return response()->json([
                'success' => true,
                'stats' => $stats,
                'active_claims' => $activeClaims,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch claims dashboard',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get clients with policy information for claim creation
     */
    public function getClients()
    {
        try {
            \Log::info('ClaimResolution: Fetching clients');
            $clients = Client::with('activePolicy')
                ->where('status', 'active')
                ->get()
                ->map(function ($client) {
                    $policy = $client->activePolicy;
                    return [
                        'id' => $client->id,
                        'name' => $client->organisation_name,
                        'policy_aggregate_limit' => $policy->policy_aggregate_limit ?? 0,
                        'policy_single_limit' => $policy->policy_single_limit ?? 0,
                    ];
                });

            \Log::info('ClaimResolution: Clients fetched', ['count' => $clients->count()]);
            return response()->json([
                'success' => true,
                'clients' => $clients,
            ]);
        } catch (\Exception $e) {
            \Log::error('ClaimResolution: Failed to fetch clients', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch clients',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get staff members for a specific client
     */
    public function getClientStaff($clientId)
    {
        try {
            $staff = Staff::where('client_id', $clientId)
                ->where('status', 'active')
                ->select('id', 'first_name', 'middle_name', 'last_name', 'job_title')
                ->get()
                ->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'name' => trim("{$s->first_name} {$s->middle_name} {$s->last_name}"),
                        'position' => $s->job_title ?? 'N/A',
                    ];
                });

            return response()->json([
                'success' => true,
                'staff' => $staff,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch staff',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get SOL (Strategic Outsourcing Limited) staff for "Notified To" dropdown
     */
    public function getSolStaff()
    {
        try {
            // Client ID 1 is Strategic Outsourcing Limited
            $solStaff = Staff::where('client_id', 1)
                ->where('status', 'active')
                ->select('id', 'first_name', 'middle_name', 'last_name', 'job_title')
                ->get()
                ->map(function ($s) {
                    return [
                        'id' => $s->id,
                        'name' => trim("{$s->first_name} {$s->middle_name} {$s->last_name}"),
                        'position' => $s->job_title ?? 'N/A',
                    ];
                });

            return response()->json([
                'success' => true,
                'staff' => $solStaff,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch SOL staff',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update claim document status and file path
     */
    public function updateClaimDocuments(Request $request, $claimId)
    {
        $validator = Validator::make($request->all(), [
            'documents' => 'required|array',
            'documents.*.id' => 'required|exists:fidelity_claim_documents,id',
            'documents.*.is_provided' => 'required|boolean',
            'documents.*.file_path' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            foreach ($request->documents as $docData) {
                DB::table('fidelity_claim_documents')
                    ->where('id', $docData['id'])
                    ->where('claim_id', $claimId)
                    ->update([
                        'is_provided' => $docData['is_provided'],
                        'file_path' => $docData['file_path'] ?? null,
                        'updated_at' => now(),
                    ]);
            }

            DB::commit();

            $claim = FidelityClaim::with('documents')->findOrFail($claimId);

            return response()->json([
                'success' => true,
                'message' => 'Documents updated successfully',
                'documents' => $claim->documents,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update documents',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create new fidelity claim
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required|exists:clients,id',
            'client_contact_person' => 'required|string|max:255',
            'client_contact_email' => 'required|email|max:255',
            'staff_id' => 'required|exists:staff,id',
            'staff_position' => 'required|string|max:255',
            'assignment_start_date' => 'required|date',
            'report_time' => 'required|date_format:H:i',
            'notified_to_staff_id' => 'required|exists:staff,id',
            'incident_description' => 'required|string',
            'reported_loss_status' => 'required|in:known,not_provided',
            'reported_loss' => 'required_if:reported_loss_status,known|nullable|numeric|min:0',
            'policy_single_limit' => 'required|numeric|min:0',
            'policy_aggregate_limit' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            $claim = FidelityClaim::create([
                'claim_number' => FidelityClaim::generateClaimNumber(),
                'client_id' => $request->client_id,
                'client_contact_name' => $request->client_contact_person,
                'client_contact_email' => $request->client_contact_email,
                'staff_id' => $request->staff_id,
                'staff_position' => $request->staff_position,
                'assignment_start_date' => $request->assignment_start_date,
                'report_time' => $request->report_time,
                'notified_to_staff_id' => $request->notified_to_staff_id,
                'incident_description' => $request->incident_description,
                'reported_loss_status' => $request->reported_loss_status,
                'reported_loss' => $request->reported_loss_status === 'known' ? $request->reported_loss : null,
                'policy_single_limit' => $request->policy_single_limit,
                'policy_aggregate_limit' => $request->policy_aggregate_limit,
                'status' => 'client_reported',
                'sol_evaluation_status' => 'pending',
            ]);

            // Seed default document checklist (22 required documents)
            $defaultDocuments = [
                'Duly completed claim form (Blank form attached)',
                'Detailed incident report',
                'Letter of termination of the employees following the incident',
                'Details of the unpaid salary due to the employees',
                'Recovery made by the employee and their guarantors till date',
                'Copy of 2 Character Reference form submitted by the employees at the time of employment',
                'Copy of query issued to the employees and response to same',
                'Instrument used in perpetuating fraud',
                'Detailed Internal investigation report',
                'Statement of Account of the affected customers',
                'Police investigation report',
                'Copy of last payslip of Defaulter',
                'Evidence of customer complaints',
                'Detailed claim estimate',
                'Terminal benefits',
                'Signed Agreement/Terms of recovery',
                'Copy of Last Pay slips of the Defaulters (3 months\' pay slip)',
                'Letter of employment',
                'Letter of confirmation',
                'Disclaimer notice',
                'Employees\' ID cards',
                'Guarantor form/satisfactory character reference forms obtained from Employee prior to employment',
            ];

            foreach ($defaultDocuments as $docName) {
                $claim->documents()->create([
                    'document_name' => $docName,
                    'is_provided' => false,
                    'file_path' => null,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Claim created successfully',
                'claim' => $claim->load(['client', 'staff', 'notifiedTo', 'documents']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create claim',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Accept a claim
     */
    public function accept(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $claim = FidelityClaim::findOrFail($id);

            if (!in_array($claim->status, ['client_reported', 'sol_under_review'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'This claim cannot be accepted at its current status',
                ], 400);
            }

            $claim->update([
                'status' => 'sol_accepted',
                'sol_evaluation_status' => 'accepted',
                'sol_notes' => $request->notes,
                'evaluated_by' => Auth::id(),
                'evaluated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Claim declined successfully',
                'claim' => $claim->fresh()->load(['client', 'staff', 'solEvaluator']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to accept claim',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Decline a claim
     */
    public function decline(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $claim = FidelityClaim::findOrFail($id);

            if (!in_array($claim->status, ['client_reported', 'sol_under_review'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'This claim cannot be declined at its current status',
                ], 400);
            }

            $claim->update([
                'status' => 'sol_declined',
                'sol_evaluation_status' => 'declined',
                'sol_notes' => $request->notes,
                'evaluated_by' => Auth::id(),
                'evaluated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Claim declined',
                'claim' => $claim->fresh()->load(['client', 'staff', 'solEvaluator']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to decline claim',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * File claim with insurer
     */
    public function fileWithInsurer(Request $request, $id)
    {
        try {
            $claim = FidelityClaim::findOrFail($id);

            if ($claim->status !== 'sol_accepted') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only accepted claims can be filed with insurer',
                ], 400);
            }

            // Generate insurer claim ID
            $insurerClaimId = 'INS-' . date('Y') . '-' . str_pad(rand(100, 999), 3, '0', STR_PAD_LEFT);

            $claim->update([
                'status' => 'insurer_processing',
                'insurer_claim_id' => $insurerClaimId,
                'insurer_status' => 'processing',
                'filed_by' => Auth::id(),
                'filed_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Claim filed with insurer successfully',
                'claim' => $claim->fresh()->load(['client', 'staff', 'insurerFiler']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to file claim with insurer',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload evidence for a claim
     */
    public function uploadEvidence(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'files' => 'required|array',
            'files.*' => 'file|max:10240', // 10MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $claim = FidelityClaim::findOrFail($id);
            $uploadedFiles = [];

            foreach ($request->file('files') as $file) {
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('claim_evidence/' . $claim->id, $fileName, 'public');

                $evidence = ClaimEvidence::create([
                    'fidelity_claim_id' => $claim->id,
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $filePath,
                    'file_type' => $this->getFileType($file->getMimeType()),
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                    'uploaded_by' => Auth::id(),
                ]);

                $uploadedFiles[] = $evidence;
            }

            return response()->json([
                'success' => true,
                'message' => count($uploadedFiles) . ' file(s) uploaded successfully',
                'files' => $uploadedFiles,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload evidence',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get evidence files for a claim
     */
    public function getEvidence($id)
    {
        try {
            $evidence = ClaimEvidence::where('fidelity_claim_id', $id)
                ->with('uploader:id,name')
                ->get()
                ->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'file_name' => $file->file_name,
                        'file_type' => $file->file_type,
                        'file_size' => $file->formatted_size,
                        'uploaded_by' => $file->uploader->name,
                        'uploaded_at' => $file->created_at->format('Y-m-d H:i'),
                        'download_url' => Storage::url($file->file_path),
                    ];
                });

            return response()->json([
                'success' => true,
                'evidence' => $evidence,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch evidence',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete evidence file
     */
    public function deleteEvidence($id, $evidenceId)
    {
        try {
            $evidence = ClaimEvidence::where('fidelity_claim_id', $id)
                ->where('id', $evidenceId)
                ->firstOrFail();

            Storage::disk('public')->delete($evidence->file_path);
            $evidence->delete();

            return response()->json([
                'success' => true,
                'message' => 'Evidence deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete evidence',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark claim as settled by insurer
     */
    public function markAsSettled(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'settlement_amount' => 'required|numeric|min:0',
            'settlement_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $claim = FidelityClaim::findOrFail($id);

            if ($claim->status !== 'insurer_processing') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only claims with insurer can be marked as settled',
                ], 400);
            }

            $claim->update([
                'status' => 'insurer_settled',
                'insurer_status' => 'settled',
                'settlement_amount' => $request->settlement_amount,
                'settlement_notes' => $request->settlement_notes,
                'settled_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Claim marked as settled successfully',
                'claim' => $claim->fresh()->load(['client', 'staff']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark claim as settled',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Helper: Determine file type from mime type
     */
    private function getFileType($mimeType)
    {
        if (str_starts_with($mimeType, 'image/')) return 'image';
        if (str_starts_with($mimeType, 'video/')) return 'video';
        if ($mimeType === 'application/pdf') return 'pdf';
        if (in_array($mimeType, [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv'
        ])) return 'spreadsheet';
        return 'document';
    }
}
