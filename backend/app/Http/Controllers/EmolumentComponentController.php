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
    
    // ========================================================================
    // PAYROLL PROCESSING MODULE - NEW METHODS
    // Added: November 21, 2025
    // Purpose: Support client-specific custom components and universal template
    // Documentation: PAYROLL_PROCESSING_TECHNICAL_SPEC.md section 6.2
    // ========================================================================

    /**
     * Get all available components for a client (universal + client-specific)
     * 
     * Query Parameters:
     * - client_id: Required - Get universal + this client's custom components
     * - payroll_only: true/false - Filter components with payroll_category
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllAvailableForClient(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'client_id' => 'required|exists:clients,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            $clientId = $request->client_id;

            $query = EmolumentComponent::where(function ($q) use ($clientId) {
                $q->where('is_universal_template', true)->whereNull('client_id') // Universal
                    ->orWhere('client_id', $clientId); // Client-specific
            });

            // Filter for payroll components only
            if ($request->boolean('payroll_only')) {
                $query->whereNotNull('payroll_category');
            }

            $query->where('is_active', true)
                ->orderBy('display_order')
                ->orderBy('component_name');

            $components = $query->get();

            return response()->json([
                'success' => true,
                'data' => $components,
                'total' => $components->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching components for client: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching components',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get universal template components (11 standard payroll components)
     * 
     * Returns the 11 universal components for payroll:
     * - BASIC_SALARY, HOUSING, TRANSPORT (pensionable)
     * - OTHER_ALLOWANCES, MEAL_ALLOWANCE
     * - LEAVE_ALLOWANCE, THIRTEENTH_MONTH (deductions)
     * - OTJ_TELEPHONE, OTJ_TRANSPORT, UNIFORM, CLIENT_OP_FUND (reimbursables)
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUniversalTemplate()
    {
        try {
            $components = EmolumentComponent::where('is_universal_template', true)
                ->whereNull('client_id')
                ->where('is_active', true)
                ->orderBy('display_order')
                ->orderBy('component_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $components,
                'total' => $components->count(),
                'message' => 'Universal template components retrieved successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching universal template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching universal template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new CLIENT-SPECIFIC custom emolument component
     * 
     * Validation:
     * - component_code: Unique within client scope (checks universal + client's components)
     * - payroll_category: Required for payroll components
     * - is_pensionable: Only valid for salary/allowance categories
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function storeCustomComponent(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'client_id' => 'required|exists:clients,id',
                'component_code' => [
                    'required',
                    'max:40',
                    'regex:/^[A-Z0-9_]+$/', // Uppercase alphanumeric + underscore
                ],
                'component_name' => 'required|max:255',
                'description' => 'nullable|string',
                'category' => 'required|in:basic,allowance,deduction,benefit',
                'payroll_category' => 'required|in:salary,allowance,reimbursable,deduction,statutory',
                'is_pensionable' => 'boolean',
                'is_taxable' => 'boolean',
                'display_order' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Check uniqueness within client scope (universal + client-specific)
            $componentCode = strtoupper($request->component_code);
            $exists = EmolumentComponent::where('component_code', $componentCode)
                ->where(function ($q) use ($request) {
                    $q->whereNull('client_id') // Universal
                        ->orWhere('client_id', $request->client_id); // Client-specific
                })
                ->exists();

            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Component code already exists for this client or as a universal component',
                ], 422);
            }

            // Validate pensionable logic
            if ($request->boolean('is_pensionable')) {
                if (!in_array($request->payroll_category, ['salary', 'allowance'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Only salary and allowance components can be marked as pensionable',
                    ], 422);
                }
            }

            // Create component
            $component = EmolumentComponent::create([
                'client_id' => $request->client_id,
                'component_code' => $componentCode,
                'component_name' => $request->component_name,
                'description' => $request->description,
                'category' => $request->category,
                'payroll_category' => $request->payroll_category,
                'is_universal_template' => false,
                'is_pensionable' => $request->boolean('is_pensionable', false),
                'is_taxable' => $request->boolean('is_taxable', true),
                'is_active' => true,
                'display_order' => $request->display_order ?? 999,
                'calculation_method' => 'fixed',
                'status' => 'regular',
                'type' => 'fixed_allowance',
                'class' => 'cash_item',
            ]);

            return response()->json([
                'success' => true,
                'data' => $component,
                'message' => 'Custom emolument component created successfully',
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating custom component: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating custom component',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a CLIENT-SPECIFIC custom component
     * 
     * Note: Universal components cannot be updated via API
     * 
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateCustomComponent(Request $request, $id)
    {
        try {
            $component = EmolumentComponent::find($id);

            if (!$component) {
                return response()->json([
                    'success' => false,
                    'message' => 'Component not found',
                ], 404);
            }

            // Prevent updating universal components
            if ($component->is_universal_template || $component->client_id === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Universal components cannot be updated. Only client-specific components can be modified.',
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'component_name' => 'sometimes|required|max:255',
                'description' => 'nullable|string',
                'payroll_category' => 'sometimes|required|in:salary,allowance,reimbursable,deduction,statutory',
                'is_pensionable' => 'boolean',
                'is_taxable' => 'boolean',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Validate pensionable logic
            $payrollCategory = $request->payroll_category ?? $component->payroll_category;
            if ($request->boolean('is_pensionable')) {
                if (!in_array($payrollCategory, ['salary', 'allowance'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Only salary and allowance components can be marked as pensionable',
                    ], 422);
                }
            }

            // Update component
            $component->update($request->only([
                'component_name',
                'description',
                'payroll_category',
                'is_pensionable',
                'is_taxable',
                'is_active'
            ]));

            return response()->json([
                'success' => true,
                'data' => $component->fresh(),
                'message' => 'Custom component updated successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating custom component: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating custom component',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete (soft delete) a CLIENT-SPECIFIC custom component
     * 
     * Note: Universal components cannot be deleted
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroyCustomComponent($id)
    {
        try {
            $component = EmolumentComponent::find($id);

            if (!$component) {
                return response()->json([
                    'success' => false,
                    'message' => 'Component not found',
                ], 404);
            }

            // Prevent deleting universal components
            if ($component->is_universal_template || $component->client_id === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Universal components cannot be deleted. Only client-specific components can be removed.',
                ], 403);
            }

            // Soft delete
            $component->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Custom component deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting custom component: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting custom component',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
