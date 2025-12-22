<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\ClientContractIndexRequest;
use App\Models\ClientContract;
use Exception;

class ClientContractController extends Controller
{
    /**
     * Get all client contracts with pagination and filtering
     */
    public function index(ClientContractIndexRequest $request)
    {
        try {
            // Get validated and clean parameters
            $params = $request->getCleanParams();

            Log::info('=== CLIENT CONTRACTS REQUEST ===', [
                'user_authenticated' => Auth::check(),
                'user_id' => Auth::id(),
                'clean_params' => $params
            ]);

            $query = ClientContract::with(['client' => function($q) {
                $q->select('id', 'organisation_name', 'slug', 'prefix', 'status');
            }]);

            // Apply search filter
            if (!empty($params['search'])) {
                $search = $params['search'];
                $query->where(function ($q) use ($search) {
                    $q->where('contract_code', 'LIKE', "%{$search}%")
                        ->orWhere('service_type', 'LIKE', "%{$search}%")
                        ->orWhereHas('client', function($clientQuery) use ($search) {
                            $clientQuery->where('organisation_name', 'LIKE', "%{$search}%");
                        });
                });
            }

            // Apply client filter
            if (!empty($params['client_id'])) {
                $query->where('client_id', $params['client_id']);
            }

            // Apply status filter with proper validation
            if (!empty($params['status']) && $params['status'] !== 'all') {
                if (in_array($params['status'], ['active', 'inactive'])) {
                    $query->where('status', $params['status']);
                }
            }

            // Apply sorting
            $query->orderBy($params['sort_by'] ?? 'created_at', $params['sort_order'] ?? 'desc');

            // Paginate results
            $contracts = $query->paginate($params['per_page']);

            Log::info('=== CLIENT CONTRACTS RESPONSE ===', [
                'contracts_count' => $contracts->count(),
                'total' => $contracts->total(),
                'current_page' => $contracts->currentPage(),
                'per_page' => $contracts->perPage()
            ]);

            return response()->json([
                'success' => true,
                'data' => $contracts,
                'message' => 'Client contracts retrieved successfully'
            ]);
        } catch (Exception $e) {
            Log::error('Error retrieving client contracts', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error retrieving client contracts: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new client contract
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required|integer|exists:clients,id',
            'contract_type' => 'required|string|max:100',
            'contract_start_date' => 'required|date',
            'contract_end_date' => 'required|date|after:contract_start_date',
            'notes' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Get client for contract code generation
            $client = DB::table('clients')->where('id', $request->client_id)->first();
            if (!$client) {
                throw new Exception('Client not found');
            }

            // Generate contract code
            $contractCode = $this->generateContractCode($client->client_code);

            // Create contract
            $contractId = DB::table('client_contracts')->insertGetId([
                'contract_code' => $contractCode,
                'client_id' => $request->client_id,
                'contract_type' => $request->contract_type,
                'contract_start_date' => $request->contract_start_date,
                'contract_end_date' => $request->contract_end_date,
                'selected_particulars' => json_encode($request->selected_particulars ?? []),
                'status' => 'active',
                'notes' => $request->notes,
                'created_by' => Auth::check() ? Auth::user()->id : 1,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Client contract created successfully',
                'data' => ['id' => $contractId, 'contract_code' => $contractCode]
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error creating client contract: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show specific client contract
     */
    public function show($id)
    {
        try {
            $contract = DB::table('view_client_contracts_with_details')
                ->where('id', $id)
                ->first();

            if (!$contract) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client contract not found'
                ], 404);
            }

            // Decode selected particulars
            if ($contract->selected_particulars) {
                $contract->selected_particulars = json_decode($contract->selected_particulars, true);
            }

            return response()->json([
                'success' => true,
                'data' => $contract
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving client contract: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update client contract
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required|integer|exists:clients,id',
            'contract_type' => 'required|string|max:100',
            'contract_start_date' => 'required|date',
            'contract_end_date' => 'required|date|after:contract_start_date',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|in:active,inactive,expired,terminated'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if contract exists
            $existingContract = DB::table('client_contracts')->where('id', $id)->first();
            if (!$existingContract) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client contract not found'
                ], 404);
            }

            DB::beginTransaction();


            // Update contract
            DB::table('client_contracts')
                ->where('id', $id)
                ->update([
                    'client_id' => $request->client_id,
                    'contract_type' => $request->contract_type,
                    'contract_start_date' => $request->contract_start_date,
                    'contract_end_date' => $request->contract_end_date,
                    'selected_particulars' => json_encode($request->selected_particulars ?? []),
                    'status' => $request->status ?? $existingContract->status,
                    'notes' => $request->notes,
                    'updated_by' => Auth::check() ? Auth::user()->id : 1,
                    'updated_at' => now()
                ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Client contract updated successfully',
                'data' => ['id' => $id]
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error updating client contract: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete client contract
     */
    public function destroy($id)
    {
        try {
            $contract = DB::table('client_contracts')->where('id', $id)->first();

            if (!$contract) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client contract not found'
                ], 404);
            }

            DB::beginTransaction();

            // Delete contract
            DB::table('client_contracts')->where('id', $id)->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Client contract deleted successfully'
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error deleting client contract: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get contract particulars master data
     */
    public function getContractParticulars()
    {
        try {
            $particulars = DB::table('contract_particulars_master')
                ->where('is_active', true)
                ->orderBy('category')
                ->orderBy('display_order')
                ->get()
                ->groupBy('category');

            return response()->json([
                'success' => true,
                'data' => $particulars
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving contract particulars: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get contracts by client
     */
    public function getByClient($clientId)
    {
        try {
            $contracts = DB::table('view_client_contracts_with_details')
                ->where('client_id', $clientId)
                ->orderBy('created_at', 'desc')
                ->get();

            // Process selected_particulars for each contract
            $contracts->transform(function ($contract) {
                if ($contract->selected_particulars) {
                    $contract->selected_particulars = json_decode($contract->selected_particulars, true);
                }
                return $contract;
            });

            return response()->json([
                'success' => true,
                'data' => $contracts
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving client contracts: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle contract status
     */
    public function toggleStatus(Request $request, $id)
    {
        try {
            $contract = DB::table('client_contracts')->where('id', $id)->first();

            if (!$contract) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client contract not found'
                ], 404);
            }

            $newStatus = $contract->status === 'active' ? 'inactive' : 'active';

            DB::table('client_contracts')
                ->where('id', $id)
                ->update([
                    'status' => $newStatus,
                    'updated_by' => Auth::check() ? Auth::user()->id : 1,
                    'updated_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => "Contract status changed to {$newStatus}",
                'data' => ['status' => $newStatus]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating contract status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get expiring contracts
     */
    public function getExpiringSoon()
    {
        try {
            $contracts = DB::table('view_client_contracts_with_details')
                ->where('contract_status', 'Expiring Soon')
                ->orWhere('contract_status', 'Expired')
                ->orderBy('days_to_expiry')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $contracts
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving expiring contracts: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate contract code
     */
    private function generateContractCode($clientCode)
    {
        $year = date('Y');
        $lastContract = DB::table('client_contracts')
            ->where('contract_code', 'LIKE', "CNT-{$clientCode}-{$year}-%")
            ->orderBy('contract_code', 'desc')
            ->first();

        $sequence = 1;
        if ($lastContract) {
            $parts = explode('-', $lastContract->contract_code);
            if (count($parts) >= 4 && is_numeric(end($parts))) {
                $sequence = (int)end($parts) + 1;
            }
        }

        return sprintf('CNT-%s-%s-%03d', $clientCode, $year, $sequence);
    }
}
