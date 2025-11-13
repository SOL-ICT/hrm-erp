<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\FIRSQRCodeService;

class TestJSONQR extends Command
{
    protected $signature = 'test:json-qr';
    protected $description = 'Test JSON QR generation for MBS 360 compatibility';

    public function handle()
    {
        $this->info('=== JSON QR TEST FOR MBS 360 ===');
        
        $service = new FIRSQRCodeService();
        $jsonData = $service->generateJSONQRDataFromIRN('INV0002-064CC1EA-20251111');
        
        $this->info('JSON QR Data: ' . $jsonData);
        $this->info('Length: ' . strlen($jsonData) . ' characters');
        $this->info('Valid JSON: ' . (json_decode($jsonData) ? 'YES' : 'NO'));
        
        if ($jsonData) {
            $decoded = json_decode($jsonData, true);
            $this->info('IRN: ' . ($decoded['irn'] ?? 'N/A'));
            $this->info('Certificate: ' . ($decoded['certificate'] ?? 'N/A'));
            
            $this->info('');
            $this->info('🎯 This should match our working test QR format');
        }
        
        return 0;
    }
}