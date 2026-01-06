<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FidelityClaim;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Claims Resolution List Controller
 * 
 * Handles comprehensive claims listing with advanced filtering,
 * search, sorting, and export capabilities
 */
class ClaimResolutionListController extends Controller
{
    /**
     * Get all claims with advanced filtering and pagination
     * 
     * Filters:
     * - status
     * - client_id
     * - date_from / date_to
     * - amount_min / amount_max
     * - search (claim number, client name, staff name)
     */
    public function index(Request $request)
    {
        try {
            $query = FidelityClaim::with(['client', 'staff', 'solEvaluator', 'evidence']);

            // Filter by status
            if ($request->has('status') && $request->status !== '') {
                $query->where('status', $request->status);
            }

            // Filter by client
            if ($request->has('client_id') && $request->client_id !== '') {
                $query->where('client_id', $request->client_id);
            }

            // Filter by date range (claim creation date)
            if ($request->has('date_from') && $request->date_from !== '') {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->has('date_to') && $request->date_to !== '') {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Filter by amount range
            if ($request->has('amount_min') && $request->amount_min !== '') {
                $query->where('reported_loss', '>=', $request->amount_min);
            }
            if ($request->has('amount_max') && $request->amount_max !== '') {
                $query->where('reported_loss', '<=', $request->amount_max);
            }

            // Search across multiple fields
            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('claim_number', 'like', "%{$search}%")
                        ->orWhere('client_contact_name', 'like', "%{$search}%")
                        ->orWhere('incident_description', 'like', "%{$search}%")
                        ->orWhereHas('client', function ($clientQuery) use ($search) {
                            $clientQuery->where('organisation_name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('staff', function ($staffQuery) use ($search) {
                            $staffQuery->where(DB::raw("CONCAT(first_name, ' ', middle_name, ' ', last_name)"), 'like', "%{$search}%");
                        });
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            $allowedSorts = ['created_at', 'reported_loss', 'status', 'claim_number'];
            if (in_array($sortBy, $allowedSorts)) {
                $query->orderBy($sortBy, $sortOrder);
            } else {
                $query->orderBy('created_at', 'desc');
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $claims = $query->paginate($perPage);

            // Transform data
            $claims->getCollection()->transform(function ($claim) {
                return [
                    'id' => $claim->id,
                    'claim_number' => $claim->claim_number,
                    'client_name' => $claim->client->organisation_name,
                    'client_contact' => $claim->client_contact_name,
                    'staff_name' => trim("{$claim->staff->first_name} {$claim->staff->middle_name} {$claim->staff->last_name}"),
                    'staff_position' => $claim->staff_position,
                    'reported_loss' => $claim->reported_loss,
                    'status' => $claim->status,
                    'sol_evaluation_status' => $claim->sol_evaluation_status,
                    'insurer_claim_id' => $claim->insurer_claim_id,
                    'settlement_amount' => $claim->settlement_amount,
                    'evidence_count' => $claim->evidence->count(),
                    'created_at' => $claim->created_at->format('Y-m-d H:i'),
                ];
            });

            return response()->json($claims);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch claims list',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get single claim details
     */
    public function show($id)
    {
        try {
            $claim = FidelityClaim::with([
                'client',
                'staff',
                'solEvaluator',
                'insurerFiler',
                'evidence.uploader',
                'documents'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'claim' => [
                    'id' => $claim->id,
                    'claim_number' => $claim->claim_number,
                    
                    // Client info
                    'client_id' => $claim->client_id,
                    'client_name' => $claim->client->organisation_name,
                    'client_contact_person' => $claim->client_contact_name,
                    'client_contact_email' => $claim->client_contact_email,
                    
                    // Staff info
                    'staff_id' => $claim->staff_id,
                    'staff_name' => trim("{$claim->staff->first_name} {$claim->staff->middle_name} {$claim->staff->last_name}"),
                    'staff_position' => $claim->staff_position,
                    'assignment_start_date' => $claim->assignment_start_date->format('Y-m-d'),
                    
                    // Incident details
                    'incident_description' => $claim->incident_description,
                    'reported_loss' => $claim->reported_loss,
                    
                    // Policy info
                    'policy_single_limit' => $claim->policy_single_limit,
                    'policy_aggregate_limit' => $claim->policy_aggregate_limit,
                    
                    // Status
                    'status' => $claim->status,
                    'sol_evaluation_status' => $claim->sol_evaluation_status,
                    'sol_notes' => $claim->sol_notes,
                    'evaluated_by_name' => $claim->solEvaluator ? $claim->solEvaluator->name : null,
                    'evaluated_at' => $claim->sol_evaluated_at ? $claim->sol_evaluated_at->format('Y-m-d H:i') : null,
                    
                    // Insurer info
                    'insurer_claim_id' => $claim->insurer_claim_id,
                    'insurer_status' => $claim->insurer_status,
                    'settlement_amount' => $claim->settlement_amount,
                    'settlement_date' => $claim->settlement_date ? $claim->settlement_date->format('Y-m-d') : null,
                    'filed_by_name' => $claim->insurerFiler ? $claim->insurerFiler->name : null,
                    'filed_at' => $claim->insurer_filed_at ? $claim->insurer_filed_at->format('Y-m-d H:i') : null,
                    
                    // Evidence
                    'evidence' => $claim->evidence->map(function ($file) {
                        return [
                            'id' => $file->id,
                            'file_name' => $file->file_name,
                            'file_type' => $file->file_type,
                            'file_size' => $file->formatted_size,
                            'uploaded_by' => $file->uploader->name,
                            'uploaded_at' => $file->created_at->format('Y-m-d H:i'),
                        ];
                    }),
                    
                    // Documents
                    'documents' => $claim->documents->map(function ($doc) {
                        return [
                            'id' => $doc->id,
                            'document_name' => $doc->document_name,
                            'is_provided' => (bool) $doc->is_provided,
                            'file_path' => $doc->file_path,
                        ];
                    }),
                    
                    // Timestamps
                    'created_at' => $claim->created_at->format('Y-m-d H:i'),
                    'updated_at' => $claim->updated_at->format('Y-m-d H:i'),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Claim not found',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Get filter options (for dropdown filters)
     */
    public function getFilterOptions()
    {
        try {
            $statuses = [
                ['value' => 'client_reported', 'label' => 'Client Reported'],
                ['value' => 'sol_under_review', 'label' => 'SOL Under Review'],
                ['value' => 'sol_accepted', 'label' => 'SOL Accepted'],
                ['value' => 'sol_declined', 'label' => 'SOL Declined'],
                ['value' => 'insurer_processing', 'label' => 'Insurer Processing'],
                ['value' => 'insurer_settled', 'label' => 'Insurer Settled'],
            ];

            $clients = DB::table('clients')
                ->select('id', 'organisation_name as name')
                ->where('status', 'active')
                ->get();

            return response()->json([
                'success' => true,
                'filters' => [
                    'statuses' => $statuses,
                    'clients' => $clients,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch filter options',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export claims data (CSV/Excel)
     */
    public function export(Request $request)
    {
        // TODO: Implement export functionality using Laravel Excel
        // For now, return all data without pagination for frontend to handle
        try {
            $query = FidelityClaim::with(['client', 'staff']);

            // Apply same filters as index
            if ($request->has('status') && $request->status !== '') {
                $query->where('status', $request->status);
            }
            if ($request->has('client_id') && $request->client_id !== '') {
                $query->where('client_id', $request->client_id);
            }
            if ($request->has('date_from') && $request->date_from !== '') {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            if ($request->has('date_to') && $request->date_to !== '') {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            $claims = $query->orderBy('created_at', 'desc')->get();

            $exportData = $claims->map(function ($claim) {
                return [
                    'Claim Number' => $claim->claim_number,
                    'Client' => $claim->client->organisation_name,
                    'Staff Member' => trim("{$claim->staff->first_name} {$claim->staff->middle_name} {$claim->staff->last_name}"),
                    'Position' => $claim->staff_position,
                    'Reported Loss' => $claim->reported_loss,
                    'Status' => $claim->status,
                    'SOL Evaluation' => $claim->sol_evaluation_status,
                    'Insurer Claim ID' => $claim->insurer_claim_id ?? 'N/A',
                    'Settlement Amount' => $claim->settlement_amount ?? 'N/A',
                    'Created At' => $claim->created_at->format('Y-m-d H:i'),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $exportData,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Export failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
