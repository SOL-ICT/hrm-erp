<?php

namespace App\Services\Procurement;

use App\Models\Vendor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VendorService
{
    /**
     * Get vendors with filters
     */
    public function getVendors(array $filters = [])
    {
        $query = Vendor::with(['creator', 'procurementLogs']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['search'])) {
            $query->where(function($q) use ($filters) {
                $q->where('vendor_name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('contact_person', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('contact_phone', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('vendor_code', 'like', '%' . $filters['search'] . '%');
            });
        }

        $perPage = $filters['per_page'] ?? 15;
        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Get vendor with procurement history
     */
    public function getVendorWithHistory($id)
    {
        return Vendor::with([
            'procurementLogs.purchaseRequest',
            'procurementLogs.inventoryItem',
            'procurementLogs.logger',
            'creator'
        ])->findOrFail($id);
    }

    /**
     * Create vendor
     */
    public function createVendor(array $data, int $userId): Vendor
    {
        try {
            DB::beginTransaction();

            $vendorCode = $this->generateVendorCode();

            $vendor = Vendor::create([
                'vendor_code' => $vendorCode,
                'vendor_name' => $data['vendor_name'],
                'contact_person' => $data['contact_person'] ?? null,
                'contact_phone' => $data['contact_phone'],
                'contact_email' => $data['contact_email'] ?? null,
                'address' => $data['address'] ?? null,
                'category' => $data['category'] ?? null,
                'status' => $data['status'] ?? 'active',
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
            ]);

            DB::commit();

            Log::info('Vendor created', [
                'vendor_code' => $vendorCode,
                'vendor_name' => $data['vendor_name'],
                'user_id' => $userId
            ]);

            return $vendor->load('creator');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating vendor: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Update vendor
     */
    public function updateVendor($id, array $data): Vendor
    {
        try {
            $vendor = Vendor::findOrFail($id);
            $vendor->update($data);

            Log::info('Vendor updated', [
                'vendor_id' => $id,
                'vendor_name' => $vendor->vendor_name
            ]);

            return $vendor->fresh()->load('creator');

        } catch (\Exception $e) {
            Log::error('Error updating vendor: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Delete vendor (soft delete)
     */
    public function deleteVendor($id): bool
    {
        try {
            $vendor = Vendor::findOrFail($id);
            $vendor->delete();

            Log::info('Vendor deleted', [
                'vendor_id' => $id,
                'vendor_name' => $vendor->vendor_name
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Error deleting vendor: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Generate unique vendor code
     */
    private function generateVendorCode(): string
    {
        $date = now()->format('Ymd');
        $lastVendor = Vendor::whereDate('created_at', today())->latest()->first();
        $sequence = $lastVendor ? (intval(substr($lastVendor->vendor_code, -4)) + 1) : 1;
        
        return 'VEN-' . $date . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get vendor statistics
     */
    public function getStatistics(): array
    {
        return [
            'total_vendors' => Vendor::count(),
            'active_vendors' => Vendor::where('status', 'active')->count(),
            'inactive_vendors' => Vendor::where('status', 'inactive')->count(),
            'blacklisted_vendors' => Vendor::where('status', 'blacklisted')->count(),
            'total_transaction_value' => Vendor::sum('total_transactions'),
        ];
    }

    /**
     * Update vendor transaction totals
     */
    public function updateVendorTransactionTotals($vendorId): void
    {
        $vendor = Vendor::findOrFail($vendorId);
        
        $totalAmount = $vendor->procurementLogs()->sum('total_amount');
        $transactionCount = $vendor->procurementLogs()->count();
        $lastTransaction = $vendor->procurementLogs()->latest('purchase_date')->first();

        $vendor->update([
            'total_transactions' => $totalAmount,
            'transaction_count' => $transactionCount,
            'last_transaction_date' => $lastTransaction ? $lastTransaction->purchase_date : null,
        ]);
    }
}
