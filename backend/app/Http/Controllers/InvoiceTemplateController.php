<?php

namespace App\Http\Controllers;

use App\Models\InvoiceTemplate;
use App\Models\Client;
use App\Models\PayGradeStructure;
use App\Services\ExcelTemplateImporter;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InvoiceTemplateController extends Controller
{
    /**
     * Display a listing of invoice templates
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = InvoiceTemplate::with(['client', 'payGradeStructure']);

            // Filter by client if provided
            if ($request->has('client_id')) {
                $query->where('client_id', $request->client_id);
            }

            // Filter by pay grade if provided
            if ($request->has('pay_grade_structure_id')) {
                $query->where('pay_grade_structure_id', $request->pay_grade_structure_id);
            }

            // Filter by active status
            if ($request->has('active_only') && $request->boolean('active_only')) {
                $query->active();
            }

            // Filter by default templates
            if ($request->has('default_only') && $request->boolean('default_only')) {
                $query->default();
            }

            $templates = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $templates,
                'message' => 'Invoice templates retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching invoice templates: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch invoice templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created invoice template
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'client_id' => 'required|exists:clients,id',
                'pay_grade_structure_id' => 'required|exists:pay_grade_structures,id',
                'template_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'custom_components' => 'required|array',
                'statutory_components' => 'required|array',
                'calculation_rules' => 'nullable|array',
                'use_credit_to_bank_model' => 'boolean',
                'service_fee_percentage' => 'nullable|numeric|min:0|max:100',
                'attendance_calculation_method' => [
                    'required',
                    Rule::in(['working_days', 'calendar_days'])
                ],
                'prorate_salary' => 'boolean',
                'minimum_attendance_factor' => 'nullable|numeric|min:0|max:1',
                'is_active' => 'boolean',
                'is_default' => 'boolean',
            ]);

            // Add creator information
            $validatedData['created_by'] = Auth::user()->email ?? 'system';

            // If setting as default, unset existing defaults for this client-grade combination
            if ($validatedData['is_default'] ?? false) {
                InvoiceTemplate::where('client_id', $validatedData['client_id'])
                    ->where('pay_grade_structure_id', $validatedData['pay_grade_structure_id'])
                    ->update(['is_default' => false]);
            }

            $template = InvoiceTemplate::create($validatedData);
            $template->load(['client', 'payGradeStructure']);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Invoice template created successfully'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating invoice template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create invoice template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified invoice template
     */
    public function show(string $id): JsonResponse
    {
        try {
            $template = InvoiceTemplate::with(['client', 'payGradeStructure'])->findOrFail($id);

            // Enhance response with annual and monthly component data
            $enhancedTemplate = $template->toArray();
            $enhancedTemplate['monthly_custom_components'] = $template->getMonthlyCustomComponents();
            $enhancedTemplate['monthly_statutory_components'] = $template->getMonthlyStatutoryComponents();
            $enhancedTemplate['annual_components'] = $template->getAnnualComponents();

            return response()->json([
                'success' => true,
                'data' => $enhancedTemplate,
                'message' => 'Invoice template retrieved successfully'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice template not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error fetching invoice template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch invoice template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified invoice template
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $template = InvoiceTemplate::findOrFail($id);

            $validatedData = $request->validate([
                'template_name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'custom_components' => 'sometimes|required|array',
                'statutory_components' => 'sometimes|required|array',
                'calculation_rules' => 'nullable|array',
                'use_credit_to_bank_model' => 'boolean',
                'service_fee_percentage' => 'nullable|numeric|min:0|max:100',
                'attendance_calculation_method' => [
                    'sometimes',
                    'required',
                    Rule::in(['working_days', 'calendar_days'])
                ],
                'prorate_salary' => 'boolean',
                'minimum_attendance_factor' => 'nullable|numeric|min:0|max:1',
                'is_active' => 'boolean',
                'is_default' => 'boolean',
            ]);

            // Add updater information
            $validatedData['updated_by'] = Auth::user()->email ?? 'system';

            // If setting as default, unset existing defaults for this client-grade combination
            if (isset($validatedData['is_default']) && $validatedData['is_default']) {
                InvoiceTemplate::where('client_id', $template->client_id)
                    ->where('pay_grade_structure_id', $template->pay_grade_structure_id)
                    ->where('id', '!=', $template->id)
                    ->update(['is_default' => false]);
            }

            $template->update($validatedData);
            $template->load(['client', 'payGradeStructure']);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Invoice template updated successfully'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice template not found'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating invoice template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update invoice template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified invoice template
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $template = InvoiceTemplate::findOrFail($id);
            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'Invoice template deleted successfully'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice template not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error deleting invoice template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete invoice template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get default template for specific client and pay grade
     */
    public function getDefaultTemplate(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'client_id' => 'required|exists:clients,id',
                'pay_grade_structure_id' => 'required|exists:pay_grade_structures,id',
            ]);

            $template = InvoiceTemplate::with(['client', 'payGradeStructure'])
                ->forClientAndGrade($request->client_id, $request->pay_grade_structure_id)
                ->default()
                ->active()
                ->first();

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'No default template found for the specified client and pay grade'
                ], 404);
            }

            // Mark as used
            $template->markAsUsed();

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Default template retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching default template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch default template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clone an existing template
     */
    public function clone(string $id, Request $request): JsonResponse
    {
        try {
            $originalTemplate = InvoiceTemplate::findOrFail($id);

            $validatedData = $request->validate([
                'template_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'is_default' => 'boolean',
            ]);

            // Create new template with cloned data
            $clonedData = $originalTemplate->toArray();
            unset($clonedData['id'], $clonedData['created_at'], $clonedData['updated_at'], $clonedData['last_used_at']);

            $clonedData = array_merge($clonedData, $validatedData);
            $clonedData['created_by'] = Auth::user()->email ?? 'system';
            $clonedData['is_default'] = $validatedData['is_default'] ?? false;

            // If setting as default, unset existing defaults
            if ($clonedData['is_default']) {
                InvoiceTemplate::where('client_id', $clonedData['client_id'])
                    ->where('pay_grade_structure_id', $clonedData['pay_grade_structure_id'])
                    ->update(['is_default' => false]);
            }

            $clonedTemplate = InvoiceTemplate::create($clonedData);
            $clonedTemplate->load(['client', 'payGradeStructure']);

            return response()->json([
                'success' => true,
                'data' => $clonedTemplate,
                'message' => 'Invoice template cloned successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error cloning invoice template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to clone invoice template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import invoice template from Excel file
     */
    public function importFromExcel(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'excel_file' => 'required|file|mimes:xlsx,xls,csv|max:5120', // 5MB max
                'client_id' => 'required|exists:clients,id',
                'pay_grade_structure_id' => 'required|exists:pay_grade_structures,id',
                'template_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'set_as_default' => 'boolean',
            ]);

            $importer = new ExcelTemplateImporter();
            $result = $importer->importFromExcel(
                $request->file('excel_file'),
                $validatedData['client_id'],
                $validatedData['pay_grade_structure_id'],
                $validatedData['template_name'],
                $validatedData['description'] ?? null,
                $validatedData['set_as_default'] ?? false
            );

            if ($result['success']) {
                $template = $result['template'];
                $template->load(['client', 'payGradeStructure']);

                return response()->json([
                    'success' => true,
                    'data' => $template,
                    'warnings' => $result['warnings'] ?? [],
                    'extracted_data' => $result['extracted_data'] ?? [],
                    'message' => $result['message']
                ], 201);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                    'errors' => $result['errors'] ?? [],
                    'warnings' => $result['warnings'] ?? []
                ], 422);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error importing Excel template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to import Excel template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Preview Excel template before importing
     */
    public function previewExcelTemplate(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'excel_file' => 'required|file|mimes:xlsx,xls,csv|max:5120', // 5MB max
            ]);

            $importer = new ExcelTemplateImporter();
            $result = $importer->previewExcelTemplate($request->file('excel_file'));

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'preview_data' => $result['preview_data'],
                    'validation_errors' => $result['validation_errors'] ?? [],
                    'validation_warnings' => $result['validation_warnings'] ?? [],
                    'structure_analysis' => $result['structure_analysis'] ?? [],
                    'message' => 'Excel template preview generated successfully'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                    'errors' => $result['errors'] ?? []
                ], 422);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error previewing Excel template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to preview Excel template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download sample Excel template
     */
    public function downloadSampleTemplate()
    {
        try {
            $importer = new ExcelTemplateImporter();
            $spreadsheet = $importer->generateSampleTemplate();

            $writer = new Xlsx($spreadsheet);
            $filename = 'SOL_ICT_Payroll_Template_' . date('Y-m-d') . '.xlsx';

            // Prepare response
            $response = response()->stream(
                function () use ($writer) {
                    $writer->save('php://output');
                },
                200,
                [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                    'Cache-Control' => 'max-age=0',
                ]
            );

            Log::info('Sample template downloaded', ['filename' => $filename]);

            return $response;
        } catch (\Exception $e) {
            Log::error('Error generating sample template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate sample template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export existing template to Excel format
     */
    public function exportToExcel(string $id)
    {
        try {
            $template = InvoiceTemplate::with(['client', 'payGradeStructure'])->findOrFail($id);

            $importer = new ExcelTemplateImporter();
            $spreadsheet = $this->convertTemplateToExcel($template);

            $writer = new Xlsx($spreadsheet);
            $filename = 'Template_' . str_replace(' ', '_', $template->template_name) . '_' . date('Y-m-d') . '.xlsx';

            // Prepare response
            $response = response()->stream(
                function () use ($writer) {
                    $writer->save('php://output');
                },
                200,
                [
                    'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                    'Cache-Control' => 'max-age=0',
                ]
            );

            Log::info('Template exported to Excel', [
                'template_id' => $id,
                'filename' => $filename
            ]);

            return $response;
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice template not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error exporting template to Excel: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to export template to Excel',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Convert InvoiceTemplate to Excel Spreadsheet
     */
    private function convertTemplateToExcel(InvoiceTemplate $template): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Payroll Template');

        // Header information
        $sheet->setCellValue('A1', 'SOL-ICT PAYROLL TEMPLATE');
        $sheet->mergeCells('A1:D1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);

        $sheet->setCellValue('A2', 'Template: ' . $template->template_name);
        $sheet->setCellValue('A3', 'Client: ' . $template->client->name ?? 'N/A');
        $sheet->setCellValue('A4', 'Pay Grade: ' . $template->payGradeStructure->name ?? 'N/A');
        $sheet->setCellValue('A5', 'Generated: ' . date('Y-m-d H:i:s'));

        $row = 7;

        // Custom Components (Allowances)
        if (!empty($template->custom_components)) {
            $sheet->setCellValue("A{$row}", 'ALLOWANCES & EARNINGS');
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $row++;

            foreach ($template->custom_components as $component) {
                $sheet->setCellValue("A{$row}", $component['name'] ?? $component['description'] ?? 'Unknown');

                if (isset($component['amount'])) {
                    $sheet->setCellValue("B{$row}", $component['amount']);
                } elseif (isset($component['rate'])) {
                    $sheet->setCellValue("B{$row}", ($component['rate'] ?? 0) . '%');
                } elseif (isset($component['formula'])) {
                    $sheet->setCellValue("B{$row}", '=' . $component['formula']);
                }

                $row++;
            }
            $row++;
        }

        // Statutory Components
        if (!empty($template->statutory_components)) {
            $sheet->setCellValue("A{$row}", 'STATUTORY DEDUCTIONS');
            $sheet->getStyle("A{$row}")->getFont()->setBold(true);
            $row++;

            foreach ($template->statutory_components as $component) {
                $sheet->setCellValue("A{$row}", $component['name'] ?? $component['description'] ?? 'Unknown');

                if (isset($component['amount'])) {
                    $sheet->setCellValue("B{$row}", $component['amount']);
                } elseif (isset($component['rate'])) {
                    $sheet->setCellValue("B{$row}", ($component['rate'] ?? 0) . '%');
                } elseif (isset($component['formula'])) {
                    $sheet->setCellValue("B{$row}", '=' . $component['formula']);
                }

                $row++;
            }
        }

        // Format columns
        $sheet->getColumnDimension('A')->setWidth(25);
        $sheet->getColumnDimension('B')->setWidth(15);

        return $spreadsheet;
    }

    /*
    |--------------------------------------------------------------------------
    | Invoice Export Template Methods (Line Items for Invoice Generation)
    |--------------------------------------------------------------------------
    */

    /**
     * Store invoice export template (line items for invoice generation)
     */
    public function storeExportTemplate(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'client_id' => 'required|exists:clients,id',
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'line_items' => 'required|array',
                'excel_settings' => 'nullable|array',
            ]);

            // Use ExportTemplate model with special format to distinguish from employee exports
            $template = \App\Models\ExportTemplate::create([
                'client_id' => $request->client_id,
                'name' => $request->name,
                'description' => $request->description,
                'format' => 'invoice_line_items', // Special format identifier
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
    public function getExportTemplates(Request $request): JsonResponse
    {
        try {
            $query = \App\Models\ExportTemplate::where('format', 'invoice_line_items');

            if ($request->has('client_id')) {
                $query->where('client_id', $request->client_id);
            }

            $templates = $query->with('client')->get();

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
     * Show specific invoice export template
     */
    public function showExportTemplate($id): JsonResponse
    {
        try {
            $template = \App\Models\ExportTemplate::where('format', 'invoice_line_items')
                ->with('client')
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Invoice export template retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error showing invoice export template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Invoice export template not found'
            ], 404);
        }
    }

    /**
     * Update invoice export template
     */
    public function updateExportTemplate(Request $request, $id): JsonResponse
    {
        try {
            $template = \App\Models\ExportTemplate::where('format', 'invoice_line_items')
                ->findOrFail($id);

            $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'line_items' => 'sometimes|required|array',
                'excel_settings' => 'nullable|array',
            ]);

            $template->update([
                'name' => $request->name ?? $template->name,
                'description' => $request->description ?? $template->description,
                'column_mappings' => $request->line_items ?? $template->column_mappings,
                'formatting_rules' => $request->excel_settings ?? $template->formatting_rules,
            ]);

            return response()->json([
                'success' => true,
                'data' => $template->fresh('client'),
                'message' => 'Invoice export template updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating invoice export template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update invoice export template'
            ], 500);
        }
    }

    /**
     * Delete invoice export template
     */
    public function destroyExportTemplate($id): JsonResponse
    {
        try {
            $template = \App\Models\ExportTemplate::where('format', 'invoice_line_items')
                ->findOrFail($id);

            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'Invoice export template deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting invoice export template: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete invoice export template'
            ], 500);
        }
    }
}
