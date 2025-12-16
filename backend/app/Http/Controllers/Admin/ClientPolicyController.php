<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientPolicy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ClientPolicyController extends Controller
{
    /**
     * Get all policies for a client
     */
    public function index($clientId)
    {
        try {
            $client = Client::findOrFail($clientId);
            $policies = $client->policies()->latest()->get();

            return response()->json([
                'success' => true,
                'client' => [
                    'id' => $client->id,
                    'name' => $client->organisation_name,
                ],
                'policies' => $policies,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch policies',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create or update policy for a client
     */
    public function store(Request $request, $clientId)
    {
        $validator = Validator::make($request->all(), [
            'policy_aggregate_limit' => 'required|numeric|min:0',
            'policy_single_limit' => 'required|numeric|min:0',
            'policy_start_date' => 'nullable|date',
            'policy_end_date' => 'nullable|date|after:policy_start_date',
            'policy_number' => 'nullable|string|max:255',
            'insurer_name' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $client = Client::findOrFail($clientId);

            // If creating a new active policy, deactivate old ones
            if ($request->status === 'active' || !$request->has('status')) {
                ClientPolicy::where('client_id', $clientId)
                    ->where('status', 'active')
                    ->update(['status' => 'expired']);
            }

            $policy = ClientPolicy::create([
                'client_id' => $clientId,
                'policy_aggregate_limit' => $request->policy_aggregate_limit,
                'policy_single_limit' => $request->policy_single_limit,
                'policy_start_date' => $request->policy_start_date,
                'policy_end_date' => $request->policy_end_date,
                'policy_number' => $request->policy_number,
                'insurer_name' => $request->insurer_name,
                'notes' => $request->notes,
                'status' => $request->status ?? 'active',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Policy created successfully',
                'policy' => $policy,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create policy',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update existing policy
     */
    public function update(Request $request, $clientId, $policyId)
    {
        $validator = Validator::make($request->all(), [
            'policy_aggregate_limit' => 'sometimes|numeric|min:0',
            'policy_single_limit' => 'sometimes|numeric|min:0',
            'policy_start_date' => 'nullable|date',
            'policy_end_date' => 'nullable|date|after:policy_start_date',
            'policy_number' => 'nullable|string|max:255',
            'insurer_name' => 'nullable|string|max:255',
            'status' => 'sometimes|in:active,expired,suspended',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $policy = ClientPolicy::where('client_id', $clientId)
                ->where('id', $policyId)
                ->firstOrFail();

            // If activating this policy, deactivate others
            if ($request->status === 'active' && $policy->status !== 'active') {
                ClientPolicy::where('client_id', $clientId)
                    ->where('id', '!=', $policyId)
                    ->where('status', 'active')
                    ->update(['status' => 'expired']);
            }

            $policy->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Policy updated successfully',
                'policy' => $policy->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update policy',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get active policy for a client
     */
    public function getActive($clientId)
    {
        try {
            $client = Client::with('activePolicy')->findOrFail($clientId);
            $policy = $client->activePolicy;

            if (!$policy) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active policy found for this client',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'policy' => $policy,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch active policy',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a policy
     */
    public function destroy($clientId, $policyId)
    {
        try {
            $policy = ClientPolicy::where('client_id', $clientId)
                ->where('id', $policyId)
                ->firstOrFail();

            $policy->delete();

            return response()->json([
                'success' => true,
                'message' => 'Policy deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete policy',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
