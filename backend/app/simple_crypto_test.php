<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Services\FIRSCryptographicService;

// Load Laravel app
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Simple FIRS Crypto Test ===\n\n";

try {
    $cryptoService = new FIRSCryptographicService();
    $status = $cryptoService->getStatus();
    
    echo "Crypto Status:\n";
    foreach ($status as $key => $value) {
        echo "  $key: " . (is_bool($value) ? ($value ? 'YES' : 'NO') : $value) . "\n";
    }
    
    if ($status['crypto_keys_file_exists'] && isset($status['keys_loaded']) && $status['keys_loaded']) {
        echo "\nTesting encryption:\n";
        $testData = 'TEST-IRN-' . time();
        echo "  Input: $testData\n";
        
        if ($status['openssl_available']) {
            $encrypted = $cryptoService->encryptQRData($testData);
            echo "  Encrypted Length: " . strlen($encrypted) . "\n";
            echo "  Success: YES\n";
        } else {
            echo "  OpenSSL not available - cannot encrypt\n";
        }
    }
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";