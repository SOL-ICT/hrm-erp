<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Procurement\VendorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VendorController extends Controller
{
    protected $vendorService;

    public function __construct(VendorService $vendorService)
    {
        $this->vendorService = $vendorService;
    }

    /**
     * Get all vendors
     */
    public function index(Request $request)
    {
        try {
            $filters = [
                'status' => $request->status,
                'category' => $request->category,
                'search' => $request->search,
                'per_page' => $request->per_page ?? 15,
            ];

            $vendors = $this->vendorService->getVendors($filters);

            return response()->json([
                'success' => true,
                'message' => 'Vendors retrieved successfully',
                'data' => $vendors
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving vendors: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single vendor with procurement history
     */
    public function show($id)
    {
        try {
            $vendor = $this->vendorService->getVendorWithHistory($id);

            return response()->json([
                'success' => true,
                'message' => 'Vendor retrieved successfully',
                'data' => $vendor
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving vendor: ' . $e->getMessage()
            ], 404);
        }
    }

    /**
     * Create vendor
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'vendor_name' => 'required|string|max:200',
                'contact_person' => 'nullable|string|max:200',
                'contact_phone' => 'required|string|max:20',
                'contact_email' => 'nullable|email|max:200',
                'address' => 'nullable|string',
                'category' => 'nullable|string|max:100',
                'status' => 'nullable|in:active,inactive,blacklisted',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $vendor = $this->vendorService->createVendor(
                $request->all(),
                auth()->id()
            );

            return response()->json([
                'success' => true,
                'message' => 'Vendor created successfully',
                'data' => $vendor
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating vendor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update vendor
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'vendor_name' => 'sometimes|required|string|max:200',
                'contact_person' => 'nullable|string|max:200',
                'contact_phone' => 'sometimes|required|string|max:20',
                'contact_email' => 'nullable|email|max:200',
                'address' => 'nullable|string',
                'category' => 'nullable|string|max:100',
                'status' => 'nullable|in:active,inactive,blacklisted',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $vendor = $this->vendorService->updateVendor($id, $request->all());

            return response()->json([
                'success' => true,
                'message' => 'Vendor updated successfully',
                'data' => $vendor
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating vendor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete vendor (soft delete)
     */
    public function destroy($id)
    {
        try {
            $this->vendorService->deleteVendor($id);

            return response()->json([
                'success' => true,
                'message' => 'Vendor deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting vendor: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get vendor statistics
     */
    public function statistics(Request $request)
    {
        try {
            $stats = $this->vendorService->getStatistics();

            return response()->json([
                'success' => true,
                'message' => 'Vendor statistics retrieved successfully',
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error retrieving statistics: ' . $e->getMessage()
            ], 500);
        }
    }
}
