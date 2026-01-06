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
            Log::error('Error adding contract for client: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to add contract for client'
            ], 500);
        }
    }

    /**
     * Get all active clients without pagination (for dropdowns)
     */
    public function getAllActive()
    {
        try {
            $clients = Client::select('id', 'organisation_name', 'prefix', 'status')
                ->where('status', 'active')
                ->orderBy('organisation_name', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $clients
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching all active clients: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch clients'
            ], 500);
        }
    }

    /**
     * Store invoice export template for a client
     */
    public function storeInvoiceExportTemplate(Request $request, $clientId)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'line_items' => 'required|array',
                'excel_settings' => 'nullable|array',
            ]);

            $template = \App\Models\ExportTemplate::create([
                'client_id' => $clientId,
                'name' => $request->name,
                'description' => $request->description,
                'format' => 'invoice_line_items', // Special format to distinguish from employee exports
                'column_mappings' => $request->line_items, // Store line items here
                'formatting_rules' => $request->excel_settings ?? [],
                'grouping_rules' => [],
                'use_credit_to_bank_model' => false,
                'service_fee_percentage' => 0,
                'fee_calculation_rules' => [],
                'header_config' => [],
                'footer_config' => [],
                'styling_config' => [],
                'is_active' => true,
                'created_by' => Auth::user()->name ?? 'system',
                'version' => '1.0',
            ]);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Invoice export template saved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error saving invoice export template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to save invoice export template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get invoice export templates for a client
     */
    public function getInvoiceExportTemplates($clientId)
    {
        try {
            $templates = \App\Models\ExportTemplate::where('client_id', $clientId)
                ->where('format', 'invoice_line_items')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $templates,
                'message' => 'Invoice export templates retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting invoice export templates: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get invoice export templates'
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
                'head_office_address' => 'nullable|string',
                'pay_calculation_basis' => 'required|in:working_days,calendar_days',
                'status' => 'required|in:active,inactive,pending',
                'contracts' => 'array',
                'contracts.*.service_type' => 'required|string|max:100',
                'contracts.*.contract_start_date' => 'required|date',
                'contracts.*.contract_end_date' => 'required|date|after_or_equal:contracts.*.contract_start_date',
                'contracts.*.status' => 'required|in:active,inactive,expired,terminated',
                'contracts.*.notes' => 'nullable|string',
                // Invoice & Payment Information validation rules
                'payment_terms' => 'nullable|string|max:500',
                'contact_person_name' => 'nullable|string|max:255',
                'contact_person_position' => 'nullable|string|max:255',
                'contact_person_address' => 'nullable|string',
                // FIRS e-invoicing validation rules
                'firs_tin' => 'nullable|string|max:20',
                'firs_business_description' => 'nullable|string|max:255',
                'firs_city' => 'nullable|string|max:100',
                'firs_postal_zone' => 'nullable|string|max:20',
                'firs_country' => 'nullable|string|max:2',
                'firs_contact_telephone' => 'nullable|string|max:20',
                'firs_contact_email' => 'nullable|email|max:255',
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
                'status' => $validatedData['status'],
                // Invoice & Payment Information fields
                'payment_terms' => $validatedData['payment_terms'] ?? null,
                'contact_person_name' => $validatedData['contact_person_name'] ?? null,
                'contact_person_position' => $validatedData['contact_person_position'] ?? null,
                'contact_person_address' => $validatedData['contact_person_address'] ?? null,
                // FIRS e-invoicing fields
                'firs_tin' => $validatedData['firs_tin'] ?? null,
                'firs_business_description' => $validatedData['firs_business_description'] ?? null,
                'firs_city' => $validatedData['firs_city'] ?? null,
                'firs_postal_zone' => $validatedData['firs_postal_zone'] ?? null,
                'firs_country' => $validatedData['firs_country'] ?? 'NG',
                'firs_contact_telephone' => $validatedData['firs_contact_telephone'] ?? null,
                'firs_contact_email' => $validatedData['firs_contact_email'] ?? null,
            ]);

            // Create contracts if provided
            if (!empty($validatedData['contracts'])) {
                foreach ($validatedData['contracts'] as $contractData) {
                    $contractCode = 'CTR-' . $client->id . '-' . now()->format('YmdHis') . '-' . rand(100, 999);

                    ClientContract::create([
                        'contract_code' => $contractCode,
                        'client_id' => $client->id,
                        'service_type' => $contractData['service_type'],
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
                'head_office_address' => 'nullable|string',
                'pay_calculation_basis' => 'required|in:working_days,calendar_days',
                'status' => 'required|in:active,inactive',
                'contracts' => 'array',
                'contracts.*.id' => 'nullable|exists:client_contracts,id',
                'contracts.*.service_type' => 'required|string|max:100',
                'contracts.*.contract_start_date' => 'required|date',
                'contracts.*.contract_end_date' => 'required|date|after_or_equal:contracts.*.contract_start_date',
                'contracts.*.status' => 'required|in:active,inactive,expired,terminated',
                'contracts.*.notes' => 'nullable|string',
                // Invoice & Payment Information validation rules
                'payment_terms' => 'nullable|string|max:500',
                'contact_person_name' => 'nullable|string|max:255',
                'contact_person_position' => 'nullable|string|max:255',
                'contact_person_address' => 'nullable|string',
                // FIRS e-invoicing validation rules
                'firs_tin' => 'nullable|string|max:20',
                'firs_business_description' => 'nullable|string|max:255',
                'firs_city' => 'nullable|string|max:100',
                'firs_postal_zone' => 'nullable|string|max:20',
                'firs_country' => 'nullable|string|max:2',
                'firs_contact_telephone' => 'nullable|string|max:20',
                'firs_contact_email' => 'nullable|email|max:255',
            ]);

            DB::beginTransaction();

            // Update client
            $client->update([
                'organisation_name' => $validatedData['organisation_name'],
                'cac_registration_number' => $validatedData['cac_registration_number'],
                'industry_category' => $validatedData['industry_category'],
                'client_category' => $validatedData['client_category'],
                'head_office_address' => $validatedData['head_office_address'],
                'pay_calculation_basis' => $validatedData['pay_calculation_basis'],
                'status' => $validatedData['status'],
                // Invoice & Payment Information fields
                'payment_terms' => $validatedData['payment_terms'] ?? null,
                'contact_person_name' => $validatedData['contact_person_name'] ?? null,
                'contact_person_position' => $validatedData['contact_person_position'] ?? null,
                'contact_person_address' => $validatedData['contact_person_address'] ?? null,
                // FIRS e-invoicing fields
                'firs_tin' => $validatedData['firs_tin'] ?? null,
                'firs_business_description' => $validatedData['firs_business_description'] ?? null,
                'firs_city' => $validatedData['firs_city'] ?? null,
                'firs_postal_zone' => $validatedData['firs_postal_zone'] ?? null,
                'firs_country' => $validatedData['firs_country'] ?? 'NG',
                'firs_contact_telephone' => $validatedData['firs_contact_telephone'] ?? null,
                'firs_contact_email' => $validatedData['firs_contact_email'] ?? null,
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
                                'service_type' => $contractData['service_type'],
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
                            'service_type' => $contractData['service_type'],
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
                'service_type' => 'required|string|max:100',
                'contract_start_date' => 'required|date',
                'contract_end_date' => 'required|date|after_or_equal:contract_start_date',
                'status' => 'required|in:active,inactive,expired,terminated',
                'notes' => 'nullable|string'
            ]);

            $contractCode = 'CTR-' . $clientId . '-' . now()->format('YmdHis') . '-' . rand(100, 999);

            $contract = ClientContract::create([
                'contract_code' => $contractCode,
                'client_id' => $clientId,
                'service_type' => $validatedData['service_type'],
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
