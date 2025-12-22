<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PurchaseRequestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $currentYear = date('Y');

        // Get sample users
        $userIds = DB::table('users')->pluck('id')->take(10)->toArray();

        if (empty($userIds)) {
            $this->command->warn('No users found in database. Skipping PurchaseRequestSeeder.');
            return;
        }

        // Note: inventory_items table doesn't exist in procurement schema
        // Purchase request items are created independently

        $branches = ['Abuja', 'Lagos', 'Port Harcourt', 'Kano', 'Enugu', 'Ibadan'];
        $priorities = ['low', 'medium', 'high', 'urgent'];
        
        $itemTemplates = [
            ['name' => 'Office Chairs', 'category' => 'Furniture', 'price' => 25000],
            ['name' => 'Desktop Computers', 'category' => 'Electronics', 'price' => 150000],
            ['name' => 'Printer Toner Cartridges', 'category' => 'Office Supplies', 'price' => 8500],
            ['name' => 'A4 Paper (Box)', 'category' => 'Stationery', 'price' => 3500],
            ['name' => 'Network Cables', 'category' => 'IT Equipment', 'price' => 500],
            ['name' => 'Fire Extinguishers', 'category' => 'Safety Equipment', 'price' => 12000],
            ['name' => 'Desk Lamps', 'category' => 'Office Equipment', 'price' => 4500],
            ['name' => 'Filing Cabinets', 'category' => 'Furniture', 'price' => 45000],
            ['name' => 'Whiteboard Markers', 'category' => 'Stationery', 'price' => 1200],
            ['name' => 'Extension Cords', 'category' => 'Electrical', 'price' => 2500],
        ];

        $statuses = [
            'pending' => 20,
            'reviewed' => 15,
            'approved' => 15,
            'rejected' => 5,
            'completed' => 10,
            'cancelled' => 5
        ];

        $purchaseRequests = [];
        $purchaseRequestItems = [];
        $requestCounter = 1;

        foreach ($statuses as $status => $count) {
            for ($i = 0; $i < $count; $i++) {
                $requestedBy = $userIds[array_rand($userIds)];
                $reviewerId = $userIds[array_rand($userIds)];
                $approverId = $userIds[array_rand($userIds)];
                $createdAt = Carbon::now()->subDays(rand(1, 90));

                $itemCount = rand(2, 5);
                $totalAmount = 0;
                $items = [];

                // Generate items for this request
                for ($j = 0; $j < $itemCount; $j++) {
                    $template = $itemTemplates[array_rand($itemTemplates)];
                    $quantity = rand(5, 50);
                    $unitPrice = $template['price'] + rand(-1000, 1000);
                    $itemTotal = $quantity * $unitPrice;
                    $totalAmount += $itemTotal;

                    $items[] = [
                        'item_name' => $template['name'],
                        'item_category' => $template['category'],
                        'item_code' => 'ITM-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'total' => $itemTotal,
                        'justification' => 'Stock replenishment - current stock below minimum level',
                    ];
                }

                $request = [
                    'request_code' => 'PR-' . $currentYear . '-' . str_pad($requestCounter++, 4, '0', STR_PAD_LEFT),
                    'requested_by' => $requestedBy,
                    'branch' => $branches[array_rand($branches)],
                    'priority' => $priorities[array_rand($priorities)],
                    'status' => $status,
                    'admin_status' => 'pending',
                    'finance_status' => 'pending',
                    'justification' => 'Urgent restocking required to maintain operational efficiency and meet client service standards.',
                    'total_amount' => $totalAmount,
                    'required_date' => Carbon::now()->addDays(rand(7, 30)),
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];

                // Update status fields based on status
                if (in_array($status, ['reviewed', 'approved', 'completed'])) {
                    $reviewedAt = $createdAt->copy()->addDays(rand(1, 3));
                    $request['admin_status'] = 'reviewed';
                    $request['reviewed_by'] = $reviewerId;
                    $request['reviewed_at'] = $reviewedAt;
                    $request['review_comments'] = 'Request reviewed and verified';
                    $request['updated_at'] = $reviewedAt;
                }

                if (in_array($status, ['approved', 'completed'])) {
                    $approvedAt = $createdAt->copy()->addDays(rand(4, 7));
                    $request['admin_status'] = 'approved';
                    $request['finance_status'] = 'approved';
                    $request['approved_by'] = $approverId;
                    $request['approved_at'] = $approvedAt;
                    $request['approval_comments'] = 'Approved within budget allocation';
                    $request['updated_at'] = $approvedAt;
                }

                if ($status === 'rejected') {
                    $rejectedAt = $createdAt->copy()->addDays(rand(2, 5));
                    $request['admin_status'] = 'rejected';
                    $request['finance_status'] = 'rejected';
                    $request['rejected_by'] = $reviewerId;
                    $request['rejected_at'] = $rejectedAt;
                    $request['rejection_reason'] = 'Budget constraints or insufficient justification';
                    $request['updated_at'] = $rejectedAt;
                }

                if ($status === 'completed') {
                    $completedAt = $createdAt->copy()->addDays(rand(10, 20));
                    $request['completed_by'] = $requestedBy;
                    $request['completed_at'] = $completedAt;
                    $request['updated_at'] = $completedAt;
                }

                if ($status === 'cancelled') {
                    $request['updated_at'] = $createdAt->copy()->addDays(rand(1, 3));
                }

                $requestId = DB::table('purchase_requests')->insertGetId($request);

                // Insert items
                foreach ($items as $item) {
                    $item['purchase_request_id'] = $requestId;
                    $item['inventory_item_id'] = null; // Set to null for now, can be linked later if needed
                    $item['created_at'] = $createdAt;
                    $item['updated_at'] = $createdAt;
                    $purchaseRequestItems[] = $item;
                }
            }
        }

        DB::table('purchase_request_items')->insert($purchaseRequestItems);

        $this->command->info('✅ Created 70 purchase requests with various statuses');
        $this->command->info('   - 20 pending');
        $this->command->info('   - 15 reviewed');
        $this->command->info('   - 15 approved');
        $this->command->info('   - 5 rejected');
        $this->command->info('   - 10 completed');
        $this->command->info('   - 5 cancelled');
        $this->command->info('✅ Created ' . count($purchaseRequestItems) . ' purchase request items');
    }
}
