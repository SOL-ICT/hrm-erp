<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;

class CreateSampleUploadTemplate extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'templates:create-sample-excel {output=sample_template_upload.xlsx}';

    /**
     * The console command description.
     */
    protected $description = 'Create a sample Excel template for bulk template upload testing';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $outputFile = $this->argument('output');

        $this->info("🎯 Creating sample Excel template for bulk upload...");

        try {
            $spreadsheet = $this->createSampleTemplate();

            // Save to file
            $writer = new Xlsx($spreadsheet);
            $outputPath = storage_path('app/' . $outputFile);
            $writer->save($outputPath);

            $this->info("✅ Sample template created successfully!");
            $this->info("📁 Location: {$outputPath}");
            $this->info("📊 Content: 3 sample calculation templates with components");

            $this->displayTemplateStructure();

            return 0;
        } catch (\Exception $e) {
            $this->error("❌ Failed to create sample template: " . $e->getMessage());
            return 1;
        }
    }

    private function createSampleTemplate(): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Template Upload');

        // Define headers
        $headers = [
            'A' => 'template_name',
            'B' => 'client_name',
            'C' => 'pay_grade_code',
            'D' => 'description',
            'E' => 'basic_salary',
            'F' => 'housing_allowance',
            'G' => 'transport_allowance',
            'H' => 'medical_allowance',
            'I' => 'education_allowance',
            'J' => 'leave_allowance',
            'K' => 'thirteenth_month',
            'L' => 'income_tax',
            'M' => 'pension_contribution',
            'N' => 'nhis_contribution'
        ];

        // Set headers
        foreach ($headers as $col => $header) {
            $sheet->setCellValue($col . '1', $header);
        }

        // Style headers
        $headerRange = 'A1:' . array_key_last($headers) . '1';
        $sheet->getStyle($headerRange)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4472C4']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]]
        ]);

        // Sample data
        $sampleData = [
            [
                'template_name' => 'Senior Manager Template',
                'client_name' => 'FIDUCIA BUREAU DE CHANGE LIMITED',
                'pay_grade_code' => 'SENIOR_MGR',
                'description' => 'Calculation template for Senior Manager level',
                'basic_salary' => 'input',
                'housing_allowance' => 'basic_salary * 0.20',
                'transport_allowance' => 'basic_salary * 0.10',
                'medical_allowance' => '5000',
                'education_allowance' => 'basic_salary * 0.05',
                'leave_allowance' => 'basic_salary / 12',
                'thirteenth_month' => 'basic_salary / 12',
                'income_tax' => '(basic_salary + housing_allowance + transport_allowance) * 0.05',
                'pension_contribution' => 'basic_salary * 0.08',
                'nhis_contribution' => 'basic_salary * 0.015'
            ],
            [
                'template_name' => 'Manager Template',
                'client_name' => 'SOL-ICT GLOBAL RESOURCES LIMITED',
                'pay_grade_code' => 'MANAGER',
                'description' => 'Calculation template for Manager level',
                'basic_salary' => 'input',
                'housing_allowance' => 'basic_salary * 0.15',
                'transport_allowance' => 'basic_salary * 0.08',
                'medical_allowance' => '3000',
                'education_allowance' => 'basic_salary * 0.03',
                'leave_allowance' => 'basic_salary / 12',
                'thirteenth_month' => 'basic_salary / 12',
                'income_tax' => '(basic_salary + housing_allowance + transport_allowance) * 0.05',
                'pension_contribution' => 'basic_salary * 0.08',
                'nhis_contribution' => 'basic_salary * 0.015'
            ],
            [
                'template_name' => 'Officer Template',
                'client_name' => 'TEST CLIENT LIMITED',
                'pay_grade_code' => 'OFFICER',
                'description' => 'Calculation template for Officer level',
                'basic_salary' => 'input',
                'housing_allowance' => 'basic_salary * 0.10',
                'transport_allowance' => 'basic_salary * 0.05',
                'medical_allowance' => '2000',
                'education_allowance' => 'basic_salary * 0.02',
                'leave_allowance' => 'basic_salary / 12',
                'thirteenth_month' => 'basic_salary / 12',
                'income_tax' => '(basic_salary + housing_allowance + transport_allowance) * 0.05',
                'pension_contribution' => 'basic_salary * 0.08',
                'nhis_contribution' => 'basic_salary * 0.015'
            ]
        ];

        // Add sample data
        $row = 2;
        foreach ($sampleData as $data) {
            $col = 'A';
            foreach ($data as $value) {
                $sheet->setCellValue($col . $row, $value);
                $col++;
            }
            $row++;
        }

        // Auto-size columns
        foreach (range('A', array_key_last($headers)) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Add instructions sheet
        $this->addInstructionsSheet($spreadsheet);

        // Set the Template Upload sheet as active (first sheet)
        $spreadsheet->setActiveSheetIndex(0);

        return $spreadsheet;
    }

    private function addInstructionsSheet(Spreadsheet $spreadsheet)
    {
        $instructionsSheet = $spreadsheet->createSheet();
        $instructionsSheet->setTitle('Instructions');

        $instructions = [
            ['🎯 BULK TEMPLATE UPLOAD INSTRUCTIONS'],
            [''],
            ['📋 Required Columns:'],
            ['  • template_name: Name of the calculation template'],
            ['  • client_name: Name of the client organization'],
            ['  • pay_grade_code: Unique code for the pay grade (e.g., SENIOR_MGR)'],
            ['  • description: Description of the template (optional)'],
            [''],
            ['💰 Component Columns:'],
            ['  • basic_salary: Always use "input" (this is the base salary input)'],
            ['  • Other components: Use formulas or fixed amounts'],
            [''],
            ['📝 Formula Examples:'],
            ['  • Fixed amount: 5000 (for medical allowance)'],
            ['  • Percentage: basic_salary * 0.20 (20% of basic salary)'],
            ['  • Complex: (basic_salary + housing_allowance) * 0.05'],
            [''],
            ['⚠️  Important Notes:'],
            ['  • Always include basic_salary as "input"'],
            ['  • Use valid mathematical expressions'],
            ['  • Reference other components by their column names'],
            ['  • Percentages should be in decimal form (0.20 for 20%)'],
            [''],
            ['🔧 Component Types:'],
            ['  • Allowances: housing_allowance, transport_allowance, etc.'],
            ['  • Deductions: income_tax, loan_deduction, etc.'],
            ['  • Contributions: pension_contribution, nhis_contribution, etc.'],
            [''],
            ['📤 Upload Process:'],
            ['  1. Fill in your template data'],
            ['  2. Save the Excel file'],
            ['  3. Use the bulk upload command:'],
            ['     php artisan templates:bulk-upload your_file.xlsx'],
            ['  4. Check the results and validation messages'],
        ];

        $row = 1;
        foreach ($instructions as $instruction) {
            $instructionsSheet->setCellValue('A' . $row, $instruction[0]);
            $row++;
        }

        // Style the instructions
        $instructionsSheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '2F5597']]
        ]);

        $instructionsSheet->getColumnDimension('A')->setWidth(80);
        $instructionsSheet->getStyle('A:A')->getAlignment()->setWrapText(true);
    }

    private function displayTemplateStructure()
    {
        $this->info("\n📊 Template Structure:");
        $this->line("=====================================");
        $this->line("🏢 3 Sample Templates Created:");
        $this->line("   • Senior Manager (FIDUCIA)");
        $this->line("   • Manager (SOL-ICT)");
        $this->line("   • Officer (TEST CLIENT)");
        $this->line("");
        $this->line("💰 Components Included:");
        $this->line("   • Basic Salary (input field)");
        $this->line("   • Housing Allowance (% of basic)");
        $this->line("   • Transport Allowance (% of basic)");
        $this->line("   • Medical Allowance (fixed amount)");
        $this->line("   • Education Allowance (% of basic)");
        $this->line("   • Leave Allowance (monthly)");
        $this->line("   • 13th Month Bonus (monthly)");
        $this->line("   • Income Tax (% of gross)");
        $this->line("   • Pension Contribution (8%)");
        $this->line("   • NHIS Contribution (1.5%)");
        $this->line("");
        $this->line("🧪 Test Command:");
        $this->line("   php artisan templates:bulk-upload sample_template_upload.xlsx");
        $this->line("");
        $this->line("🔍 Validation Command:");
        $this->line("   php artisan templates:bulk-upload sample_template_upload.xlsx --validate-only");
    }
}
