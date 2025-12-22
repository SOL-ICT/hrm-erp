<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Procurement\ProcurementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProcurementController extends Controller
{
    protected $procurementService;

    public function __construct(ProcurementService $procurementService)
    {
        $this->procurementService = $procurementService;
    }

    /**
     * Log procurement
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'purchase_request_id' => 'nullable|exists:purchase_requests,id',
                'inventory_item_id' => 'required|exists:store_inventory,id',
                'quantity' => 'required|integer|min:1',
                'unit_price' => 'required|numeric|min:0',
                'supplier_name' => 'required|string|max:200',
                'supplier_contact' => 'nullable|string|max:100',
                'invoice_number' => 'nullable|string|max:100',
                'purchase_date' => 'required|date',
                'delivery_date' => 'nullable|date|after_or_equal:purchase_date',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $procurementLog = $this->procurementService->logProcurement(
                $request->all(),
                auth()->id()
            );

            return response()->json([
                'success' => true,
                'message' => 'Procurement logged successfully',
                'data' => $procurementLog
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error logging procurement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get procurement history
     */
    public function index(Request $request)
    {
        try {
            $filters = [
                'inventory_item_id' => $request->inventory_item_id,
                'purchase_request_id' => $request->purchase_request_id,
                'supplier_name' => $request->supplier_name,
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
                'logged_by' => $request->logged_by,
                'per_page' => $request->per_page ?? 15,
            ];

            $procurements = $this->procurementService->getProcurementHistory($filters);

            return response()->json([
                'success' => true,
                'message' => 'Procurement history retrieved successfully',
                'data' => $procurements
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving procurement history: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get procurement statistics
     */
    public function statistics(Request $request)
    {
        try {
            $filters = [
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
            ];

            $statistics = $this->procurementService->getStatistics($filters);

            return response()->json([
                'success' => true,
                'message' => 'Procurement statistics retrieved successfully',
                'data' => $statistics
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving statistics: ' . $e->getMessage()
            ], 500);
        }
    }
}
