<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use App\Models\EmolumentComponent;

// FIXED: Use PHPExcel imports (compatible with existing installation)
use PHPExcel;
use PHPExcel_Writer_Excel2007;
use PHPExcel_IOFactory;

class EmolumentComponentController extends Controller
{
    /**
     * Get authenticated user ID for audit trail
     */
    private function getAuthUserId()
    {
        $user = Auth::user();
        return $user ? $user->id : null;
    }

    /**
     * Get all emolument components with filtering and pagination
     */
    public function index(Request $request)
    {
        try {
            $query = EmolumentComponent::query();

            // Log the raw query before any filters
            Log::info('EmolumentComponent base query', [
                'total_count' => EmolumentComponent::count(),
                'active_count' => EmolumentComponent::where('is_active', true)->count()
            ]);

            // Apply search
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('component_name', 'like', "%{$search}%")
                        ->orWhere('component_code', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
                Log::info('Applied search filter', ['search' => $search]);
            }

            // Apply filters
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
                Log::info('Applied status filter', ['status' => $request->status]);
            }

            if ($request->has('type') && $request->type) {
                $query->where('type', $request->type);
                Log::info('Applied type filter', ['type' => $request->type]);
            }

            if ($request->has('class') && $request->class) {
                $query->where('class', $request->class);
                Log::info('Applied class filter', ['class' => $request->class]);
            }

            if ($request->has('category') && $request->category) {
                $query->where('category', $request->category);
                Log::info('Applied category filter', ['category' => $request->category]);
            }

            if ($request->has('active_status') && $request->active_status !== '' && $request->active_status !== null) {
                $query->where('is_active', $request->active_status == 'active');
                Log::info('Applied active_status filter', ['active_status' => $request->active_status]);
            }

            // Log the SQL query before execution
            Log::info('Final SQL query', [
                'sql' => $query->toSql(),
                'bindings' => $query->getBindings()
            ]);

            // Sorting
            $sortBy = $request->get('sort_by', 'display_order');
            $sortDirection = $request->get('sort_direction', 'asc');

            if (in_array($sortBy, ['component_name', 'component_code', 'status', 'type', 'class', 'display_order', 'created_at'])) {
                $query->orderBy($sortBy, $sortDirection);
            } else {
                $query->orderBy('display_order')->orderBy('component_name');
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $components = $query->paginate($perPage);

            Log::info('EmolumentComponent query executed', [
                'total_found' => $components->total(),
                'current_page' => $components->currentPage(),
                'per_page' => $components->perPage(),
                'last_page' => $components->lastPage(),
                'items_count' => $components->count()
            ]);

            return response()->json([
                'success' => true,
                'data' => $components,
                'message' => 'Emolument components retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching emolument components: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching emolument components',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics for emolument components
     */
    public function getStatistics()
    {
        try {
            // Cache statistics for 5 minutes to improve performance
            $stats = Cache::remember('emolument_component_statistics', 300, function () {
                return [
                    'total' => EmolumentComponent::count(),
                    'active' => EmolumentComponent::where('is_active', 1)->count(),
                    'benefit_status' => EmolumentComponent::where('status', 'benefit')->count(),
                    'regular_status' => EmolumentComponent::where('status', 'regular')->count(),
                    'cash_items' => EmolumentComponent::where('class', 'cash_item')->count(),
                    'non_cash_items' => EmolumentComponent::where('class', 'non_cash_item')->count(),
                    'by_category' => [
                        'basic' => EmolumentComponent::where('category', 'basic')->count(),
                        'allowance' => EmolumentComponent::where('category', 'allowance')->count(),
                        'deduction' => EmolumentComponent::where('category', 'deduction')->count(),
                        'benefit' => EmolumentComponent::where('category', 'benefit')->count()
                    ]
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Statistics retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show single emolument component
     */
    public function show($id)
    {
        try {
            $component = EmolumentComponent::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $component,
                'message' => 'Component retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching component: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching component',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new emolument component
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'component_code' => 'required|string|max:20|unique:emolument_components,component_code',
                'component_name' => 'required|string|max:255',
                'status' => 'required|in:benefit,regular',
                'type' => 'required|in:fixed_allowance,variable_allowance',
                'class' => 'required|in:cash_item,non_cash_item',
                'client_account' => 'required|string|max:100',
                'ledger_account_code' => 'required|string|max:20',
                'ledger_account_name' => 'required|string|max:255',
                'category' => 'required|in:basic,allowance,deduction,benefit',
                'is_taxable' => 'boolean',
                'calculation_method' => 'required|in:fixed,percentage,formula',
                'description' => 'nullable|string',
                'display_order' => 'integer|min:0',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $component = EmolumentComponent::create([
                'component_code' => strtoupper($request->component_code),
                'component_name' => $request->component_name,
                'status' => $request->status,
                'type' => $request->type,
                'class' => $request->class,
                'client_account' => $request->client_account,
                'ledger_account_code' => $request->ledger_account_code,
                'ledger_account_name' => $request->ledger_account_name,
                'category' => $request->category,
                'is_taxable' => $request->get('is_taxable', false),
                'calculation_method' => $request->calculation_method,
                'description' => $request->description,
                'display_order' => $request->get('display_order', 100),
                'is_active' => $request->get('is_active', true),
                'created_by' => $this->getAuthUserId()
            ]);

            DB::commit();

            // Clear statistics cache when data changes
            Cache::forget('emolument_component_statistics');

            return response()->json([
                'success' => true,
                'data' => $component,
                'message' => 'Component created successfully'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating component: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating component',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update emolument component
     */
    public function update(Request $request, $id)
    {
        try {
            $component = EmolumentComponent::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'component_code' => 'required|string|max:20|unique:emolument_components,component_code,' . $id,
                'component_name' => 'required|string|max:255',
                'status' => 'required|in:benefit,regular',
                'type' => 'required|in:fixed_allowance,variable_allowance',
                'class' => 'required|in:cash_item,non_cash_item',
                'client_account' => 'required|string|max:100',
                'ledger_account_code' => 'required|string|max:20',
                'ledger_account_name' => 'required|string|max:255',
                'category' => 'required|in:basic,allowance,deduction,benefit',
                'is_taxable' => 'boolean',
                'calculation_method' => 'required|in:fixed,percentage,formula',
                'description' => 'nullable|string',
                'display_order' => 'integer|min:0',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $component->update([
                'component_code' => strtoupper($request->component_code),
                'component_name' => $request->component_name,
                'status' => $request->status,
                'type' => $request->type,
                'class' => $request->class,
                'client_account' => $request->client_account,
                'ledger_account_code' => $request->ledger_account_code,
                'ledger_account_name' => $request->ledger_account_name,
                'category' => $request->category,
                'is_taxable' => $request->get('is_taxable', $component->is_taxable),
                'calculation_method' => $request->calculation_method,
                'description' => $request->description,
                'display_order' => $request->get('display_order', $component->display_order),
                'is_active' => $request->get('is_active', $component->is_active),
                'updated_by' => $this->getAuthUserId()
            ]);

            DB::commit();

            // Clear statistics cache when data changes
            Cache::forget('emolument_component_statistics');

            return response()->json([
                'success' => true,
                'data' => $component,
                'message' => 'Component updated successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating component: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating component',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete emolument component
     */
    public function destroy($id)
    {
        try {
            $component = EmolumentComponent::findOrFail($id);

            DB::beginTransaction();
            $component->delete();
            DB::commit();

            // Clear statistics cache when data changes
            Cache::forget('emolument_component_statistics');

            return response()->json([
                'success' => true,
                'message' => 'Component deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting component: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting component',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk actions on emolument components
     */
    public function bulkAction(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'action' => 'required|in:activate,deactivate,delete',
                'component_ids' => 'required|array|min:1',
                'component_ids.*' => 'required|integer|exists:emolument_components,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $componentIds = $request->component_ids;
            $action = $request->action;
            $affected = 0;

            switch ($action) {
                case 'activate':
                    $affected = EmolumentComponent::whereIn('id', $componentIds)
                        ->update(['is_active' => true, 'updated_by' => $this->getAuthUserId()]);
                    break;

                case 'deactivate':
                    $affected = EmolumentComponent::whereIn('id', $componentIds)
                        ->update(['is_active' => false, 'updated_by' => $this->getAuthUserId()]);
                    break;

                case 'delete':
                    $affected = EmolumentComponent::whereIn('id', $componentIds)->delete();
                    break;
            }

            DB::commit();

            // Clear statistics cache when data changes
            Cache::forget('emolument_component_statistics');

            return response()->json([
                'success' => true,
                'message' => "Bulk {$action} completed successfully. {$affected} components affected.",
                'affected_count' => $affected
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in bulk action: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error performing bulk action',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export components to Excel - FIXED
     */
    public function export()
    {
        try {
            $components = EmolumentComponent::orderBy('display_order')->orderBy('component_name')->get();

            $phpExcel = new PHPExcel();
            $sheet = $phpExcel->getActiveSheet();

            // Set headers
            $headers = [
                'Component Code',
                'Component Name',
                'Status',
                'Type',
                'Class',
                'Client Account',
                'Ledger Account Code',
                'Ledger Account Name',
                'Category',
                'Is Taxable',
                'Calculation Method',
                'Description',
                'Display Order',
                'Is Active'
            ];

            $column = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($column . '1', $header);
                $sheet->getStyle($column . '1')->getFont()->setBold(true);
                $sheet->getColumnDimension($column)->setAutoSize(true);
                $column++;
            }

            // Add data
            $row = 2;
            foreach ($components as $component) {
                $data = [
                    $component->component_code,
                    $component->component_name,
                    $component->status,
                    $component->type,
                    $component->class,
                    $component->client_account,
                    $component->ledger_account_code,
                    $component->ledger_account_name,
                    $component->category,
                    $component->is_taxable ? 'Yes' : 'No',
                    $component->calculation_method,
                    $component->description,
                    $component->display_order,
                    $component->is_active ? 'Yes' : 'No'
                ];

                $column = 'A';
                foreach ($data as $value) {
                    $sheet->setCellValue($column . $row, $value);
                    $column++;
                }
                $row++;
            }

            $writer = new PHPExcel_Writer_Excel2007($phpExcel);
            $fileName = 'emolument_components_export_' . date('Y-m-d_H-i-s') . '.xlsx';
            $tempFile = tempnam(sys_get_temp_dir(), $fileName);
            $writer->save($tempFile);

            return response()->download($tempFile, $fileName, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend();
        } catch (\Exception $e) {
            Log::error('Error exporting components: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error exporting components',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download Excel template - FIXED
     */
    public function downloadTemplate()
    {
        try {
            $phpExcel = new PHPExcel();
            $sheet = $phpExcel->getActiveSheet();

            // Set headers
            $headers = [
                'Component Code',
                'Component Name',
                'Status',
                'Type',
                'Class',
                'Client Account',
                'Ledger Account Code',
                'Ledger Account Name',
                'Category',
                'Is Taxable',
                'Calculation Method',
                'Description',
                'Display Order',
                'Is Active'
            ];

            $column = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($column . '1', $header);
                $sheet->getStyle($column . '1')->getFont()->setBold(true);
                $sheet->getColumnDimension($column)->setAutoSize(true);
                $column++;
            }

            // Add sample data
            $sampleData = [
                'SAMPLE_01',
                'Sample Allowance',
                'benefit',
                'fixed_allowance',
                'cash_item',
                'Salary and Emolument',
                '270001',
                'Client Account -Salary And Emolument',
                'allowance',
                'Yes',
                'fixed',
                'Sample description',
                '100',
                'Yes'
            ];

            $column = 'A';
            foreach ($sampleData as $value) {
                $sheet->setCellValue($column . '2', $value);
                $column++;
            }

            // Add instructions
            $sheet->setCellValue('A4', 'Instructions:');
            $sheet->getStyle('A4')->getFont()->setBold(true);
            $sheet->setCellValue('A5', '1. Fill in the data starting from row 2');
            $sheet->setCellValue('A6', '2. Component Code must be unique');
            $sheet->setCellValue('A7', '3. Status: benefit or regular');
            $sheet->setCellValue('A8', '4. Type: fixed_allowance or variable_allowance');
            $sheet->setCellValue('A9', '5. Class: cash_item or non_cash_item');
            $sheet->setCellValue('A10', '6. Category: basic, allowance, deduction, or benefit');
            $sheet->setCellValue('A11', '7. Is Taxable: Yes or No');
            $sheet->setCellValue('A12', '8. Calculation Method: fixed, percentage, or formula');
            $sheet->setCellValue('A13', '9. Is Active: Yes or No');

            $writer = new PHPExcel_Writer_Excel2007($phpExcel);
            $fileName = 'emolument_components_template_' . date('Y-m-d') . '.xlsx';
            $tempFile = tempnam(sys_get_temp_dir(), $fileName);
            $writer->save($tempFile);

            return response()->download($tempFile, $fileName, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend();
        } catch (\Exception $e) {
            Log::error('Error creating template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import components from Excel - FIXED
     */
    public function import(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|mimes:xlsx,xls|max:2048'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');
            $phpExcel = PHPExcel_IOFactory::load($file->getPathname());
            $sheet = $phpExcel->getActiveSheet();
            $rows = $sheet->toArray();

            // Remove header row
            array_shift($rows);

            $importedCount = 0;
            $errors = [];
            $skipCount = 0;

            DB::beginTransaction();

            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2; // +2 because we removed header and arrays are 0-indexed

                // Skip empty rows
                if (empty(array_filter($row))) {
                    $skipCount++;
                    continue;
                }

                try {
                    $data = [
                        'component_code' => strtoupper(trim($row[0] ?? '')),
                        'component_name' => trim($row[1] ?? ''),
                        'status' => strtolower(trim($row[2] ?? '')),
                        'type' => strtolower(trim($row[3] ?? '')),
                        'class' => strtolower(trim($row[4] ?? '')),
                        'client_account' => trim($row[5] ?? ''),
                        'ledger_account_code' => trim($row[6] ?? ''),
                        'ledger_account_name' => trim($row[7] ?? ''),
                        'category' => strtolower(trim($row[8] ?? '')),
                        'is_taxable' => strtolower(trim($row[9] ?? '')) === 'yes',
                        'calculation_method' => strtolower(trim($row[10] ?? '')),
                        'description' => trim($row[11] ?? ''),
                        'display_order' => is_numeric($row[12] ?? '') ? (int)$row[12] : 100,
                        'is_active' => strtolower(trim($row[13] ?? '')) !== 'no',
                        'created_by' => $this->getAuthUserId()
                    ];

                    // Validate required fields
                    if (empty($data['component_code']) || empty($data['component_name'])) {
                        $errors[] = "Row {$rowNumber}: Component code and name are required";
                        continue;
                    }

                    // Check if component code already exists
                    if (EmolumentComponent::where('component_code', $data['component_code'])->exists()) {
                        $errors[] = "Row {$rowNumber}: Component code '{$data['component_code']}' already exists";
                        continue;
                    }

                    EmolumentComponent::create($data);
                    $importedCount++;
                } catch (\Exception $e) {
                    $errors[] = "Row {$rowNumber}: " . $e->getMessage();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Import completed successfully. {$importedCount} components imported.",
                'imported_count' => $importedCount,
                'skip_count' => $skipCount,
                'errors' => $errors
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error importing components: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error importing components',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
