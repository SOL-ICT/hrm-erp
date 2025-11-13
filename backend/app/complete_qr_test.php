<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Services\FIRSQRCodeService;

// Load Laravel app
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== FIRS Encrypted QR Complete Test ===\n\n";

try {
    $qrService = new FIRSQRCodeService();
    
    echo "1. QR Service Status:\n";
    echo "   Encryption Available: " . ($qrService->isEncryptionAvailable() ? 'YES' : 'NO') . "\n";
    
    $status = $qrService->getEncryptionStatus();
    foreach ($status as $key => $value) {
        echo "   " . ucfirst(str_replace('_', ' ', $key)) . ": " . 
             (is_bool($value) ? ($value ? 'YES' : 'NO') : $value) . "\n";
    }
    echo "\n";

    echo "2. Testing QR Code Generation:\n";
    
    $approvalData = [
        'irn' => 'ENCRYPTED-TEST-IRN-' . time(),
        'validation_number' => 'FIRS-VAL-' . uniqid(),
        'approval_date' => date('Y-m-d H:i:s'),
        'invoice_reference' => 'INVOICE-REF-' . time()
    ];
    
    echo "   Input Data:\n";
    foreach ($approvalData as $key => $value) {
        echo "     $key: $value\n";
    }
    echo "\n";

    $qrResult = $qrService->generateQRCode($approvalData);
    
    echo "   QR Generation Results:\n";
    echo "     Success: " . ($qrResult['success'] ? 'YES' : 'NO') . "\n";
    
    if ($qrResult['success']) {
        echo "     Encryption Used: " . (($qrResult['encryption_used'] ?? false) ? 'YES' : 'NO') . "\n";
        
        if (isset($qrResult['qr_data_encrypted'])) {
            echo "     Encrypted Data Available: YES\n";
            echo "     Encrypted Data Length: " . strlen($qrResult['qr_data_encrypted']) . " characters\n";
            echo "     Encrypted Data Type: " . gettype($qrResult['qr_data_encrypted']) . "\n";
            echo "     Encrypted Data (first 100 chars): " . substr($qrResult['qr_data_encrypted'], 0, 100) . "...\n";
        }
        
        if (isset($qrResult['qr_data_plain'])) {
            echo "     Plain JSON Data: " . $qrResult['qr_data_plain'] . "\n";
        }
        
        if (isset($qrResult['message'])) {
            echo "     Message: " . $qrResult['message'] . "\n";
        }
    } else {
        echo "     Error: " . ($qrResult['message'] ?? 'Unknown error') . "\n";
    }
    
    echo "\n3. Testing PDF-Ready Data Format:\n";
    
    if ($qrResult['success']) {
        $pdfReadyData = $qrResult['qr_data_encrypted'] ?? $qrResult['qr_data_plain'] ?? null;
        
        echo "   PDF-Ready QR Data Available: " . ($pdfReadyData ? 'YES' : 'NO') . "\n";
        
        if ($pdfReadyData) {
            echo "   Data Length: " . strlen($pdfReadyData) . " characters\n";
            echo "   Data Type: " . gettype($pdfReadyData) . "\n";
            echo "   Ready for InvoicePDFExportService: YES\n";
            echo "   Format: " . (($qrResult['encryption_used'] ?? false) ? 'RSA Encrypted Base64' : 'Plain JSON') . "\n";
        }
    }
    
    echo "\n=== Test Complete ===\n";
    echo "Summary: " . ($qrResult['success'] ? 'FIRS encrypted QR generation is working!' : 'QR generation failed') . "\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}