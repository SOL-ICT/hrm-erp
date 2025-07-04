<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ClientController extends Controller
{
    /**
     * Get all clients with pagination and filtering
     */
    public function index(Request $request)
    {
        try {
            $perPage = $request->get('per_page', 15);
            $search = $request->get('search');
            $filter = $request->get('filter', 'all');
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');

            $query = DB::table('clients')->select([
                'id',
                'client_code',
                'name',
                'slug',
                'prefix',
                'address',
                'state_lga_id',
                'sla_details',
                'configuration',
                'status',
                'contract_start_date',
                'contract_end_date',
                'created_at',
                'updated_at'
            ]);

            // Apply search filter
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                        ->orWhere('client_code', 'LIKE', "%{$search}%")
                        ->orWhere('prefix', 'LIKE', "%{$search}%");
                });
            }

            // Apply status filter
            if ($filter !== 'all') {
                if ($filter === 'active') {
                    $query->where('status', 'active');
                } elseif ($filter === 'inactive') {
                    $query->where('status', 'inactive');
                } elseif ($filter === 'suspended') {
                    $query->where('status', 'suspended');
                }
            }

            // Apply sorting
            $query->orderBy($sortBy, $sortOrder);

            $clients = $query->paginate($perPage);

            // Add additional calculated fields
            $clients->getCollection()->transform(function ($client) {
                // Parse JSON fields
                $client->sla_details = $client->sla_details ? json_decode($client->sla_details, true) : null;
                $client->configuration = $client->configuration ? json_decode($client->configuration, true) : null;

                // Calculate contract status
                if ($client->contract_end_date) {
                    $endDate = new \DateTime($client->contract_end_date);
                    $today = new \DateTime();
                    $interval = $today->diff($endDate);

                    if ($endDate < $today) {
                        $client->contract_status = 'expired';
                        $client->days_to_expiry = -$interval->days;
                    } elseif ($interval->days <= 30) {
                        $client->contract_status = 'expiring_soon';
                        $client->days_to_expiry = $interval->days;
                    } else {
                        $client->contract_status = 'active';
                        $client->days_to_expiry = $interval->days;
                    }
                } else {
                    $client->contract_status = 'no_contract';
                    $client->days_to_expiry = null;
                }

                return $client;
            });

            return response()->json([
                'success' => true,
                'data' => $clients,
                'message' => 'Clients retrieved successfully'
            ]);
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
     * Store a new client
     */
    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'client_code' => 'required|string|max:20|unique:clients,client_code',
                'name' => 'required|string|max:255|unique:clients,name',
                'alias' => 'nullable|string|max:255',
                'prefix' => 'required|string|max:10|unique:clients,prefix',
                'address' => 'nullable|string',
                'state_lga_id' => 'nullable|exists:states_lgas,id',
                'contact_person' => 'required|string|max:255',
                'industry_category' => 'required|string|max:100',
                'client_category' => 'required|string|max:100',
                'pay_structure' => 'boolean',
                'client_status' => 'required|in:Client,Sundry Customer',
                'opening_balance' => 'nullable|numeric',
                'currency' => 'required|in:Dr,Cr',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
                'is_active' => 'boolean',
                'contract_start_date' => 'nullable|date',
                'contract_end_date' => 'nullable|date|after:contract_start_date',
            ]);

            DB::beginTransaction();

            // Generate slug
            $slug = Str::slug($validatedData['name']);
            $originalSlug = $slug;
            $counter = 1;

            while (DB::table('clients')->where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $counter;
                $counter++;
            }

            // Handle logo upload
            $logoPath = null;
            if ($request->hasFile('logo')) {
                $logo = $request->file('logo');
                $logoName = time() . '_' . $validatedData['client_code'] . '.' . $logo->getClientOriginalExtension();
                $logoPath = $logo->storeAs('clients/logos', $logoName, 'public');
            }

            // Prepare configuration data
            $configuration = [
                'contact_person' => $validatedData['contact_person'],
                'industry_category' => $validatedData['industry_category'],
                'client_category' => $validatedData['client_category'],
                'pay_structure' => $validatedData['pay_structure'] ?? false,
                'client_status' => $validatedData['client_status'],
                'opening_balance' => $validatedData['opening_balance'] ?? 0,
                'currency' => $validatedData['currency'],
                'logo_path' => $logoPath,
            ];

            // Create client record
            $clientId = DB::table('clients')->insertGetId([
                'client_code' => strtoupper($validatedData['client_code']),
                'name' => $validatedData['name'],
                'slug' => $slug,
                'prefix' => strtoupper($validatedData['prefix']),
                'address' => $validatedData['address'],
                'state_lga_id' => $validatedData['state_lga_id'],
                'configuration' => json_encode($configuration),
                'status' => ($validatedData['is_active'] ?? true) ? 'active' : 'inactive',
                'contract_start_date' => $validatedData['contract_start_date'],
                'contract_end_date' => $validatedData['contract_end_date'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Log audit trail
            $this->logAudit('created', 'clients', $clientId, null, $configuration);

            DB::commit();

            // Retrieve the created client
            $client = DB::table('clients')->where('id', $clientId)->first();
            $client->configuration = json_decode($client->configuration, true);

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
     * Display the specified client
     */
    public function show($id)
    {
        try {
            $client = DB::table('clients')->where('id', $id)->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }

            // Parse JSON fields
            $client->sla_details = $client->sla_details ? json_decode($client->sla_details, true) : null;
            $client->configuration = $client->configuration ? json_decode($client->configuration, true) : null;

            // Get related data
            $client->contracts_count = DB::table('client_contracts')
                ->where('client_id', $id)
                ->count();

            $client->active_staff_count = DB::table('staff')
                ->where('client_id', $id)
                ->where('status', 'active')
                ->count();

            $client->locations_count = DB::table('service_locations')
                ->where('client_id', $id)
                ->where('is_active', true)
                ->count();

            return response()->json([
                'success' => true,
                'data' => $client,
                'message' => 'Client retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Client show error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve client',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Update the specified client
     */
    public function update(Request $request, $id)
    {
        try {
            $client = DB::table('clients')->where('id', $id)->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }

            $validatedData = $request->validate([
                'client_code' => 'required|string|max:20|unique:clients,client_code,' . $id,
                'name' => 'required|string|max:255|unique:clients,name,' . $id,
                'alias' => 'nullable|string|max:255',
                'prefix' => 'required|string|max:10|unique:clients,prefix,' . $id,
                'address' => 'nullable|string',
                'state_lga_id' => 'nullable|exists:states_lgas,id',
                'contact_person' => 'required|string|max:255',
                'industry_category' => 'required|string|max:100',
                'client_category' => 'required|string|max:100',
                'pay_structure' => 'boolean',
                'client_status' => 'required|in:Client,Sundry Customer',
                'opening_balance' => 'nullable|numeric',
                'currency' => 'required|in:Dr,Cr',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
                'is_active' => 'boolean',
                'contract_start_date' => 'nullable|date',
                'contract_end_date' => 'nullable|date|after:contract_start_date',
            ]);

            DB::beginTransaction();

            // Store old values for audit
            $oldConfiguration = $client->configuration ? json_decode($client->configuration, true) : [];

            // Generate new slug if name changed
            $slug = $client->slug;
            if ($validatedData['name'] !== $client->name) {
                $slug = Str::slug($validatedData['name']);
                $originalSlug = $slug;
                $counter = 1;

                while (DB::table('clients')->where('slug', $slug)->where('id', '!=', $id)->exists()) {
                    $slug = $originalSlug . '-' . $counter;
                    $counter++;
                }
            }

            // Handle logo upload
            $logoPath = $oldConfiguration['logo_path'] ?? null;
            if ($request->hasFile('logo')) {
                // Delete old logo
                if ($logoPath && Storage::disk('public')->exists($logoPath)) {
                    Storage::disk('public')->delete($logoPath);
                }

                $logo = $request->file('logo');
                $logoName = time() . '_' . $validatedData['client_code'] . '.' . $logo->getClientOriginalExtension();
                $logoPath = $logo->storeAs('clients/logos', $logoName, 'public');
            }

            // Prepare configuration data
            $configuration = [
                'contact_person' => $validatedData['contact_person'],
                'industry_category' => $validatedData['industry_category'],
                'client_category' => $validatedData['client_category'],
                'pay_structure' => $validatedData['pay_structure'] ?? false,
                'client_status' => $validatedData['client_status'],
                'opening_balance' => $validatedData['opening_balance'] ?? 0,
                'currency' => $validatedData['currency'],
                'logo_path' => $logoPath,
            ];

            // Update client record
            DB::table('clients')->where('id', $id)->update([
                'client_code' => strtoupper($validatedData['client_code']),
                'name' => $validatedData['name'],
                'slug' => $slug,
                'prefix' => strtoupper($validatedData['prefix']),
                'address' => $validatedData['address'],
                'state_lga_id' => $validatedData['state_lga_id'],
                'configuration' => json_encode($configuration),
                'status' => ($validatedData['is_active'] ?? true) ? 'active' : 'inactive',
                'contract_start_date' => $validatedData['contract_start_date'],
                'contract_end_date' => $validatedData['contract_end_date'],
                'updated_at' => now(),
            ]);

            // Log audit trail
            $this->logAudit('updated', 'clients', $id, $oldConfiguration, $configuration);

            DB::commit();

            // Retrieve the updated client
            $updatedClient = DB::table('clients')->where('id', $id)->first();
            $updatedClient->configuration = json_decode($updatedClient->configuration, true);

            return response()->json([
                'success' => true,
                'data' => $updatedClient,
                'message' => 'Client updated successfully'
            ]);
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
     * Remove the specified client
     */
    public function destroy($id)
    {
        try {
            $client = DB::table('clients')->where('id', $id)->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }

            // Check if client has active staff or contracts
            $activeStaffCount = DB::table('staff')
                ->where('client_id', $id)
                ->where('status', 'active')
                ->count();

            $activeContractsCount = DB::table('client_contracts')
                ->where('client_id', $id)
                ->where('status', 'active')
                ->count();

            if ($activeStaffCount > 0 || $activeContractsCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete client with active staff or contracts',
                    'details' => [
                        'active_staff' => $activeStaffCount,
                        'active_contracts' => $activeContractsCount
                    ]
                ], 422);
            }

            DB::beginTransaction();

            // Store client data for audit
            $clientData = json_decode($client->configuration, true) ?? [];
            $clientData['deleted_name'] = $client->name;
            $clientData['deleted_code'] = $client->client_code;

            // Delete logo file
            if (!empty($clientData['logo_path']) && Storage::disk('public')->exists($clientData['logo_path'])) {
                Storage::disk('public')->delete($clientData['logo_path']);
            }

            // Delete client
            DB::table('clients')->where('id', $id)->delete();

            // Log audit trail
            $this->logAudit('deleted', 'clients', $id, $clientData, null);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Client deleted successfully'
            ]);
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
     * Get client statistics
     */
    public function statistics()
    {
        try {
            $stats = [
                'total_clients' => DB::table('clients')->count(),
                'active_clients' => DB::table('clients')->where('status', 'active')->count(),
                'inactive_clients' => DB::table('clients')->where('status', 'inactive')->count(),
                'suspended_clients' => DB::table('clients')->where('status', 'suspended')->count(),
                'clients_by_category' => DB::table('clients')
                    ->select(DB::raw('JSON_UNQUOTE(JSON_EXTRACT(configuration, "$.client_category")) as category'), DB::raw('COUNT(*) as count'))
                    ->whereNotNull('configuration')
                    ->groupBy('category')
                    ->get(),
                'clients_by_industry' => DB::table('clients')
                    ->select(DB::raw('JSON_UNQUOTE(JSON_EXTRACT(configuration, "$.industry_category")) as industry'), DB::raw('COUNT(*) as count'))
                    ->whereNotNull('configuration')
                    ->groupBy('industry')
                    ->get(),
                'contracts_expiring_soon' => DB::table('clients')
                    ->where('contract_end_date', '>=', now())
                    ->where('contract_end_date', '<=', now()->addDays(30))
                    ->count(),
                'expired_contracts' => DB::table('clients')
                    ->where('contract_end_date', '<', now())
                    ->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Client statistics error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Toggle client status
     */
    public function toggleStatus(Request $request, $id)
    {
        try {
            $client = DB::table('clients')->where('id', $id)->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }

            $newStatus = $request->input(
                'status',
                $client->status === 'active' ? 'inactive' : 'active'
            );

            if (!in_array($newStatus, ['active', 'inactive', 'suspended'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid status value'
                ], 422);
            }

            DB::beginTransaction();

            // Update status
            DB::table('clients')->where('id', $id)->update([
                'status' => $newStatus,
                'updated_at' => now(),
            ]);

            // Log audit trail
            $this->logAudit(
                'status_changed',
                'clients',
                $id,
                ['status' => $client->status],
                ['status' => $newStatus]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => ['status' => $newStatus],
                'message' => 'Client status updated successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Client toggle status error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to update client status',
                'error' => config('app.debug') ? $e->getMessage() : 'Server error'
            ], 500);
        }
    }

    /**
     * Log audit trail
     */
    private function logAudit($action, $table, $recordId, $oldValues, $newValues)
    {
        try {
            $user = Auth::user();

            DB::table('audit_logs')->insert([
                'user_id' => $user ? $user->id : null,
                'user_name' => $user ? $user->name : 'System',
                'action' => $action,
                'table_name' => $table,
                'record_id' => $recordId,
                'old_values' => $oldValues ? json_encode($oldValues) : null,
                'new_values' => $newValues ? json_encode($newValues) : null,
                'description' => "Client {$action}",
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'module' => 'client_management',
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error('Audit log error: ' . $e->getMessage());
            // Don't throw exception for audit logging failures
        }
    }
}
