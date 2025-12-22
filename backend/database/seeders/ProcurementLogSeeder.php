<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProcurementLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get completed purchase requests
        $completedRequests = DB::table('purchase_requests')
            ->where('status', 'completed')
            ->get();

        if ($completedRequests->isEmpty()) {
            $this->command->warn('No completed purchase requests found. Run PurchaseRequestSeeder first.');
            return;
        }

        // Get sample inventory items from store_inventory
        $inventoryItems = DB::table('store_inventory')->pluck('id')->toArray();
        
        if (empty($inventoryItems)) {
            $this->command->warn('No inventory items found in store_inventory. Cannot create procurement logs.');
            return;
        }

        $suppliers = [
            ['name' => 'ABC Office Supplies Ltd', 'contact' => '080-1234-5678'],
            ['name' => 'Tech Solutions Nigeria', 'contact' => '081-9876-5432'],
            ['name' => 'Prime Furniture Co.', 'contact' => '070-5555-1234'],
            ['name' => 'Express Stationery Mart', 'contact' => '090-7777-8888'],
            ['name' => 'Global IT Equipment', 'contact' => '081-2222-3333'],
            ['name' => 'Quality Office Furniture', 'contact' => '080-9999-0000'],
            ['name' => 'Swift Procurement Services', 'contact' => '070-4444-5555'],
            ['name' => 'Elite Business Supplies', 'contact' => '090-6666-7777']
        ];

        $procurementLogs = [];
        $logCount = 0;

        foreach ($completedRequests as $request) {
            $completedAt = Carbon::parse($request->completed_at);
            $supplier = $suppliers[array_rand($suppliers)];
            $invoiceNumber = 'INV-' . date('Y') . '-' . str_pad(rand(10000, 99999), 5, '0', STR_PAD_LEFT);
            
            // Get items for this request
            $items = DB::table('purchase_request_items')
                ->where('purchase_request_id', $request->id)
                ->get();

            // Create procurement log for each item
            foreach ($items as $item) {
                $purchaseDate = $completedAt->copy()->subDays(rand(1, 5));
                $deliveryDate = rand(0, 1) ? $purchaseDate->copy()->addDays(rand(1, 7))->format('Y-m-d') : null;

                $procurementLogs[] = [
                    'purchase_request_id' => $request->id,
                    'inventory_item_id' => $inventoryItems[array_rand($inventoryItems)], // Link to actual inventory item
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total_amount' => $item->total,
                    'supplier_name' => $supplier['name'],
                    'supplier_contact' => $supplier['contact'],
                    'invoice_number' => $invoiceNumber,
                    'purchase_date' => $purchaseDate->format('Y-m-d'),
                    'delivery_date' => $deliveryDate,
                    'logged_by' => $request->completed_by,
                    'notes' => 'Item: ' . $item->item_name . ' - ' . $item->item_category . '. Procurement completed and verified.',
                    'created_at' => $completedAt,
                    'updated_at' => $completedAt,
                ];
                $logCount++;
            }
        }

        DB::table('procurement_logs')->insert($procurementLogs);

        $this->command->info('✅ Created ' . $logCount . ' procurement logs for ' . count($completedRequests) . ' completed purchase requests');
    }
}
