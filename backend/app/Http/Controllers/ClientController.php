<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use App\Models\Client;
use App\Models\ClientContract;
use App\Services\CacheService;

class ClientController extends Controller
{
    /**
     * Display a listing of the clients with their contracts
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $status = $request->input('status');
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');

            $query = Client::with(['contracts' => function ($q) {
                $q->orderBy('contract_start_date', 'desc');
            }]);

            // Apply search filter
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('organisation_name', 'like', "%{$search}%")
                        ->orWhere('cac_registration_number', 'like', "%{$search}%");
                });
            }

            // Apply status filter
            if ($status) {
                $query->where('status', $status);
            }

            // Apply sorting
            $query->orderBy($sortBy, $sortOrder);

            // Get paginated results
            $clients = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $clients->items(),
                'pagination' => [
                    'current_page' => $clients->currentPage(),
                    'per_page' => $clients->perPage(),
                    'total' => $clients->total(),
                    'total_pages' => $clients->lastPage()
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('Client index error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve clients',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Store a new client with contracts
     */
    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'organisation_name' => 'required|string|max:255|unique:clients,organisation_name',
                'cac_registration_number' => 'nullable|string|max:50',
                'industry_category' => 'required|string|max:100',
                'client_category' => 'required|string|max:100',
                'phone' => 'nullable|string|max:20',
                'head_office_address' => 'nullable|string',
                'pay_calculation_basis' => 'required|in:working_days,calendar_days',
                'contracts' => 'array',
                'contracts.*.contract_type' => 'required|string|max:100',
                'contracts.*.contract_start_date' => 'required|date',
                'contracts.*.contract_end_date' => 'required|date|after_or_equal:contracts.*.contract_start_date',
                'contracts.*.status' => 'required|in:active,inactive,expired,terminated',
                'contracts.*.notes' => 'nullable|string'
            ]);

            DB::beginTransaction();

            // Generate slug from organisation name
            $slug = \Illuminate\Support\Str::slug($validatedData['organisation_name']);

            // Ensure unique slug
            $originalSlug = $slug;
            $counter = 1;
            while (Client::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $counter;
                $counter++;
            }

            // Create client
            $client = Client::create([
                'organisation_name' => $validatedData['organisation_name'],
                'slug' => $slug,
                'prefix' => strtoupper(substr($validatedData['organisation_name'], 0, 3)),
                'cac_registration_number' => $validatedData['cac_registration_number'],
                'industry_category' => $validatedData['industry_category'],
                'client_category' => $validatedData['client_category'],
                'phone' => $validatedData['phone'],
                'head_office_address' => $validatedData['head_office_address'],
                'pay_calculation_basis' => $validatedData['pay_calculation_basis'],
                'status' => 'active'
            ]);

            // Create contracts if provided
            if (!empty($validatedData['contracts'])) {
                foreach ($validatedData['contracts'] as $contractData) {
                    $contractCode = 'CTR-' . $client->id . '-' . now()->format('YmdHis') . '-' . rand(100, 999);

                    ClientContract::create([
                        'contract_code' => $contractCode,
                        'client_id' => $client->id,
                        'contract_type' => $contractData['contract_type'],
                        'contract_start_date' => $contractData['contract_start_date'],
                        'contract_end_date' => $contractData['contract_end_date'],
                        'status' => $contractData['status'],
                        'notes' => $contractData['notes'] ?? null,
                        'created_by' => Auth::id(),
                        'updated_by' => Auth::id()
                    ]);
                }
            }

            DB::commit();

            // Load the client with contracts
            $client->load('contracts');

            return response()->json([
                'success' => true,
                'data' => $client,
                'message' => 'Client created successfully'
            ], 201);
        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Client store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create client',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Display the specified client with contracts
     */
    public function show($id)
    {
        try {
            $client = Client::with('contracts')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $client
            ], 200);
        } catch (\Exception $e) {
            Log::error('Client show error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Client not found',
                'error' => config('app.debug') ? $e->getMessage() : 'Resource not found'
            ], 404);
        }
    }

    /**
     * Update the specified client and contracts
     */
    public function update(Request $request, $id)
    {
        try {
            $client = Client::findOrFail($id);

            $validatedData = $request->validate([
                'organisation_name' => 'required|string|max:255|unique:clients,organisation_name,' . $id,
                'cac_registration_number' => 'nullable|string|max:50',
                'industry_category' => 'required|string|max:100',
                'client_category' => 'required|string|max:100',
                'phone' => 'nullable|string|max:20',
                'head_office_address' => 'nullable|string',
                'pay_calculation_basis' => 'required|in:working_days,calendar_days',
                'status' => 'required|in:active,inactive',
                'contracts' => 'array',
                'contracts.*.id' => 'nullable|exists:client_contracts,id',
                'contracts.*.contract_type' => 'required|string|max:100',
                'contracts.*.contract_start_date' => 'required|date',
                'contracts.*.contract_end_date' => 'required|date|after_or_equal:contracts.*.contract_start_date',
                'contracts.*.status' => 'required|in:active,inactive,expired,terminated',
                'contracts.*.notes' => 'nullable|string'
            ]);

            DB::beginTransaction();

            // Update client
            $client->update([
                'organisation_name' => $validatedData['organisation_name'],
                'cac_registration_number' => $validatedData['cac_registration_number'],
                'industry_category' => $validatedData['industry_category'],
                'client_category' => $validatedData['client_category'],
                'phone' => $validatedData['phone'],
                'head_office_address' => $validatedData['head_office_address'],
                'pay_calculation_basis' => $validatedData['pay_calculation_basis'],
                'status' => $validatedData['status']
            ]);

            // Handle contracts
            if (isset($validatedData['contracts'])) {
                $existingContractIds = [];

                foreach ($validatedData['contracts'] as $contractData) {
                    if (isset($contractData['id'])) {
                        // Update existing contract
                        $contract = ClientContract::find($contractData['id']);
                        if ($contract && $contract->client_id == $client->id) {
                            $contract->update([
                                'contract_type' => $contractData['contract_type'],
                                'contract_start_date' => $contractData['contract_start_date'],
                                'contract_end_date' => $contractData['contract_end_date'],
                                'status' => $contractData['status'],
                                'notes' => $contractData['notes'] ?? null,
                                'updated_by' => Auth::id()
                            ]);
                            $existingContractIds[] = $contract->id;
                        }
                    } else {
                        // Create new contract
                        $contractCode = 'CTR-' . $client->id . '-' . now()->format('YmdHis') . '-' . rand(100, 999);

                        $contract = ClientContract::create([
                            'contract_code' => $contractCode,
                            'client_id' => $client->id,
                            'contract_type' => $contractData['contract_type'],
                            'contract_start_date' => $contractData['contract_start_date'],
                            'contract_end_date' => $contractData['contract_end_date'],
                            'status' => $contractData['status'],
                            'notes' => $contractData['notes'] ?? null,
                            'created_by' => Auth::id(),
                            'updated_by' => Auth::id()
                        ]);
                        $existingContractIds[] = $contract->id;
                    }
                }

                // Remove contracts not in the update list
                ClientContract::where('client_id', $client->id)
                    ->whereNotIn('id', $existingContractIds)
                    ->delete();
            }

            DB::commit();

            // Load the updated client with contracts
            $client->load('contracts');

            return response()->json([
                'success' => true,
                'data' => $client,
                'message' => 'Client updated successfully'
            ], 200);
        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Client update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update client',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Remove the specified client and contracts
     */
    public function destroy($id)
    {
        try {
            $client = Client::findOrFail($id);

            DB::beginTransaction();

            // Delete associated contracts
            ClientContract::where('client_id', $id)->delete();

            // Delete client
            $client->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Client deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Client destroy error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete client',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Add a new contract to existing client
     */
    public function addContract(Request $request, $clientId)
    {
        try {
            $client = Client::findOrFail($clientId);

            $validatedData = $request->validate([
                'contract_type' => 'required|string|max:100',
                'contract_start_date' => 'required|date',
                'contract_end_date' => 'required|date|after_or_equal:contract_start_date',
                'status' => 'required|in:active,inactive,expired,terminated',
                'notes' => 'nullable|string'
            ]);

            $contractCode = 'CTR-' . $clientId . '-' . now()->format('YmdHis') . '-' . rand(100, 999);

            $contract = ClientContract::create([
                'contract_code' => $contractCode,
                'client_id' => $clientId,
                'contract_type' => $validatedData['contract_type'],
                'contract_start_date' => $validatedData['contract_start_date'],
                'contract_end_date' => $validatedData['contract_end_date'],
                'status' => $validatedData['status'],
                'notes' => $validatedData['notes'] ?? null,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'data' => $contract,
                'message' => 'Contract added successfully'
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Add contract error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add contract',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Get clients dropdown data
     */
    public function dropdown()
    {
        try {
            $clients = Client::select('id', 'organisation_name')
                ->where('status', 'active')
                ->orderBy('organisation_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $clients
            ], 200);
        } catch (\Exception $e) {
            Log::error('Client dropdown error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve clients dropdown',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Get client statistics for dashboard
     */
    public function statistics()
    {
        try {
            $totalClients = Client::count();
            $activeClients = Client::where('status', 'active')->count();
            $totalContracts = ClientContract::count();
            $activeContracts = ClientContract::where('status', 'active')->count();

            $statistics = [
                'totalClients' => $totalClients,
                'activeClients' => $activeClients,
                'totalContracts' => $totalContracts,
                'activeContracts' => $activeContracts
            ];

            return response()->json([
                'success' => true,
                'data' => $statistics
            ], 200);
        } catch (\Exception $e) {
            Log::error('Client statistics error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve client statistics',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }
}
