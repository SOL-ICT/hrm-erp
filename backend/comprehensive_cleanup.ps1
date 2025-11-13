# HRM-ERP Comprehensive Cleanup Script
# Removes debug, test, analysis files while preserving production code

Write-Host "🧹 HRM-ERP COMPREHENSIVE CLEANUP" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

$rootPath = "C:\Projects\hrm-erp\backend"
$totalRemoved = 0

# Categories of files to clean up
Write-Host "`n📊 ANALYSIS FILES" -ForegroundColor Cyan
$analysisFiles = @(
    "analysis_sustainable_solution.php",
    "analyze_fiducia_complete.php", 
    "analyze_fiducia_complete_db.php",
    "analyze_fiducia_db.php",
    "analyze_fiducia_pdo.php",
    "analyze_fiducia_template.php",
    "analyze_individual_components.php",
    "analyze_invoice_structure.php",
    "analyze_invoice_tables.php",
    "analyze_original_qr.php",
    "analyze_template_structure.php",
    "comprehensive_analysis.php",
    "invoice_table_analysis.txt"
)

foreach ($file in $analysisFiles) {
    $fullPath = "$rootPath\$file"
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "   ✅ $file" -ForegroundColor Yellow
        $totalRemoved++
    }
}

Write-Host "`n🔍 DEBUG FILES" -ForegroundColor Cyan
$debugFiles = @(
    "debug_aggregate_formulas.php",
    "debug_annual_conversion.php", 
    "debug_api_controller.php",
    "debug_calculation_accuracy.php",
    "debug_calculation_structure.php",
    "debug_export_headers.php",
    "debug_frontend_qr_issue.php",
    "debug_invoice_40_data.php",
    "debug_invoice_gen.php",
    "debug_invoice_generation.php",
    "debug_invoice_qr.png",
    "debug_qr_comparison.php",
    "debug_qr_source.php",
    "debug_summary_data.php",
    "debug_template.php",
    "debug_template_lookup.php", 
    "debug_template_output.php",
    "debug_template_service.php",
    "debug_template_structure.php",
    "debug_tinker.php",
    "debug_working_qr.png"
)

foreach ($file in $debugFiles) {
    $fullPath = "$rootPath\$file"
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "   ✅ $file" -ForegroundColor Yellow
        $totalRemoved++
    }
}

Write-Host "`n🧪 TEST FILES" -ForegroundColor Cyan  
$testFiles = @(
    "complete_qr_test.php",
    "final_qr_test.php",
    "quick_fix_test.php",
    "simple_crypto_test.php",
    "simple_firs_test.php",
    "recreate_exact_working_qr.php",
    "recreate_working_qr.php", 
    "standalone_fix_verification.php",
    "pdf_test_artisan.php"
)

foreach ($file in $testFiles) {
    $fullPath = "$rootPath\$file"
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "   ✅ $file" -ForegroundColor Yellow
        $totalRemoved++
    }
}

Write-Host "`n🔧 FIX/UTILITY FILES" -ForegroundColor Cyan
$fixFiles = @(
    "fix_qr_with_working_data.php",
    "fix_template_amounts.php", 
    "fix_template_and_add_per_staff.php",
    "add_template_aggregates.php",
    "adjust_to_target.php",
    "careful_reverse_calc.php",
    "realistic_target.php"
)

foreach ($file in $fixFiles) {
    $fullPath = "$rootPath\$file"
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "   ✅ $file" -ForegroundColor Yellow
        $totalRemoved++
    }
}

Write-Host "`n📄 DOCUMENTATION/DATA FILES" -ForegroundColor Cyan
$docFiles = @(
    "LEGACY_APPLICATIONS_MIGRATION_PLAN.md",
    "APPLICATION_CONSOLIDATION_COMPLETE.md", 
    "TEMPLATE_ARCHITECTURE.md",
    "data.json",
    "php_data.json",
    "wsl_format_data.json",
    "temp_payload.json",
    "frontend_debug_qr.json"
)

foreach ($file in $docFiles) {
    $fullPath = "$rootPath\$file"
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "   ✅ $file" -ForegroundColor Yellow
        $totalRemoved++
    }
}

Write-Host "`n🖼️ QR/PDF TEST FILES" -ForegroundColor Cyan
$mediaFiles = @(
    "ACTUAL_INVOICE_EXPORT_TEST.pdf",
    "ENCRYPTED_QR.png",
    "FIRS_Invoice_Complete_INV0002_064CC1EA_20251111.pdf",
    "FIRS_PDF_FINAL_WSL_METHOD.pdf",
    "FIRS_PDF_WITH_ENCRYPTED_QR.pdf", 
    "FIRS_PDF_WSL_COMPATIBLE.pdf",
    "JSON_QR.png",
    "qr_code.png",
    "SHORT_BASE64_QR.png",
    "SIMPLE_TEXT_QR.png",
    "WORKING_FIRS_QR_RECREATED.pdf",
    "WORKING_FIRS_QR_SCANNABLE_INV0002_064CC1EA_20251111.pdf",
    "Working_FIRS_QR_Test.pdf",
    "fixed_qr_image.png"
)

foreach ($file in $mediaFiles) {
    $fullPath = "$rootPath\$file"
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "   ✅ $file" -ForegroundColor Yellow
        $totalRemoved++
    }
}

Write-Host "`n📝 TEXT/DATA FILES" -ForegroundColor Cyan
$textFiles = @(
    "certificate.txt",
    "encrypted_data.bin",
    "encrypted_data.txt", 
    "FIRS_e-invoice-STRATEGIC OUTSOURCING LIMITED_cryptographic_key.txt",
    "firs_qr_test_results.txt",
    "fixed_qr_data.txt",
    "mbs360_test_qr.txt",
    "php_encrypted.bin",
    "php_manual_qr.txt",
    "php_public_key.pem",
    "public_key.pem",
    "public_key_base64.txt",
    "QR_Data_Only_INV0002_064CC1EA_20251111.txt",
    "REAL_FIRS_QR_INV0002_064CC1EA_20251111.txt",
    "wsl_base64.txt",
    "wsl_encrypted.bin", 
    "wsl_public_key.pem",
    "wsl_qr_output.txt"
)

foreach ($file in $textFiles) {
    $fullPath = "$rootPath\$file"
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "   ✅ $file" -ForegroundColor Yellow
        $totalRemoved++
    }
}

Write-Host "`n⚡ LARAVEL COMMANDS CLEANUP" -ForegroundColor Cyan
$commandsToRemove = @(
    "AnalyzeInvoiceTemplatesCommand.php",
    "DebugCalculationTemplate.php",
    "DebugClientTemplates.php", 
    "DebugExcelFile.php",
    "DebugInvoice40.php",
    "DebugValidation.php",
    "InspectTemplateData.php",
    "invoiceanalyze-templates.php",
    "TestAnnualTemplateCalculation.php",
    "TestAttendanceExport.php",
    "TestCachePerformanceCommand.php", 
    "TestCompleteWorkflow.php",
    "TestContractCrud.php",
    "TestEndToEndWorkflow.php",
    "TestExportGeneration.php",
    "TestFormulaCalculator.php",
    "TestInvoiceGeneration.php",
    "TestJSONExport.php",
    "TestJSONQR.php",
    "TestPhase0Implementation.php",
    "TestPhase13Implementation.php", 
    "TestRealEndToEndWorkflow.php",
    "TestSingleFormula.php",
    "ValidateTemplateAccuracy.php"
)

$commandsPath = "$rootPath\app\Console\Commands"
foreach ($file in $commandsToRemove) {
    $fullPath = "$commandsPath\$file"
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "   ✅ Commands/$file" -ForegroundColor Yellow
        $totalRemoved++
    }
}

Write-Host "`n🗂️ SCRIPTS/UTILITIES" -ForegroundColor Cyan
$scriptFiles = @(
    "qrgen.sh",
    "Nova.xlsx"
)

foreach ($file in $scriptFiles) {
    $fullPath = "$rootPath\$file"
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "   ✅ $file" -ForegroundColor Yellow
        $totalRemoved++
    }
}

Write-Host "`n📊 CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "Total files removed: $totalRemoved" -ForegroundColor White

Write-Host "`n✅ PRODUCTION FILES PRESERVED:" -ForegroundColor Green
Write-Host "   🔒 All Services/* files" -ForegroundColor White
Write-Host "   🔒 All Controllers/* files" -ForegroundColor White
Write-Host "   🔒 All Models/* files" -ForegroundColor White
Write-Host "   🔒 Essential Commands (non-test/debug)" -ForegroundColor White
Write-Host "   🔒 Configuration files" -ForegroundColor White
Write-Host "   🔒 Database migrations" -ForegroundColor White

Write-Host "`n🚀 READY FOR GITHUB PUSH!" -ForegroundColor Green