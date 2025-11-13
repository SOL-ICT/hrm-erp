<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Exception;

/**
 * Lightweight FIRS QR Generator - Pure PHP Solution
 * 
 * Sustainable production implementation without WSL dependency
 * Optimized for XEON server deployment
 */
class ProductionFIRSQRService
{
    private $cryptoKeysPath;

    public function __construct()
    {
        $this->cryptoKeysPath = storage_path('app/firs_crypto_keys.txt');

        // Ensure crypto keys exist in production location
        $devKeysPath = base_path('FIRS_e-invoice-STRATEGIC OUTSOURCING LIMITED_cryptographic_key.txt');
        if (!file_exists($this->cryptoKeysPath) && file_exists($devKeysPath)) {
            copy($devKeysPath, $this->cryptoKeysPath);
        }
    }

    /**
     * Generate MBS 360 compatible QR code - Pure PHP implementation
     * 
     * @param string $irn
     * @return string|null
     */
    public function generateMBS360CompatibleQR(string $irn): ?string
    {
        try {
            Log::info('Production FIRS QR: Starting generation', ['irn' => $irn]);

            // Load crypto keys
            $keys = $this->loadCryptoKeys();

            // Create IRN with timestamp (exact format)
            $timestamp = time();
            $irnWithTimestamp = $irn . '.' . $timestamp;

            // Create JSON payload - try different formatting approaches
            $variants = $this->createJSONVariants($irnWithTimestamp, $keys['certificate']);

            foreach ($variants as $variant => $jsonPayload) {
                Log::info("Production FIRS QR: Trying variant {$variant}", [
                    'irn' => $irn,
                    'json_length' => strlen($jsonPayload),
                    'variant' => $variant
                ]);

                $result = $this->encryptWithVariant($jsonPayload, $keys['public_key_pem'], $variant);
                if ($result) {
                    Log::info("Production FIRS QR: Success with variant {$variant}", [
                        'irn' => $irn,
                        'result_length' => strlen($result),
                        'variant_used' => $variant
                    ]);
                    return $result;
                }
            }

            throw new Exception("All encryption variants failed");
        } catch (Exception $e) {
            Log::error('Production FIRS QR: Generation failed', [
                'irn' => $irn,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Create different JSON formatting variants to match MBS 360 expectations
     */
    private function createJSONVariants(string $irnWithTimestamp, string $certificate): array
    {
        $payload = [
            'irn' => $irnWithTimestamp,
            'certificate' => $certificate
        ];

        return [
            'compact' => json_encode($payload, JSON_UNESCAPED_SLASHES),
            'pretty' => json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
            'no_unicode' => json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            'minimal' => '{"irn":"' . $irnWithTimestamp . '","certificate":"' . $certificate . '"}',
        ];
    }

    /**
     * Try encryption with different OpenSSL parameters
     */
    private function encryptWithVariant(string $jsonPayload, string $publicKey, string $variant): ?string
    {
        $paddings = [
            OPENSSL_PKCS1_PADDING,
            OPENSSL_PKCS1_OAEP_PADDING,
        ];

        foreach ($paddings as $padding) {
            try {
                $encrypted = '';
                $success = openssl_public_encrypt($jsonPayload, $encrypted, $publicKey, $padding);

                if ($success && strlen($encrypted) === 256) { // WSL produces 256 bytes
                    $base64 = base64_encode($encrypted);

                    // Log successful encryption parameters
                    Log::info("Production FIRS QR: Encryption parameters found", [
                        'variant' => $variant,
                        'padding' => $padding === OPENSSL_PKCS1_PADDING ? 'PKCS1' : 'OAEP',
                        'binary_length' => strlen($encrypted),
                        'base64_length' => strlen($base64)
                    ]);

                    return $base64;
                }
            } catch (Exception $e) {
                // Continue to next variant
                continue;
            }
        }

        return null;
    }

    /**
     * Load crypto keys with proper error handling
     */
    private function loadCryptoKeys(): array
    {
        if (!file_exists($this->cryptoKeysPath)) {
            throw new Exception("FIRS crypto keys not found at: {$this->cryptoKeysPath}");
        }

        $content = file_get_contents($this->cryptoKeysPath);
        $keys = json_decode($content, true);

        if (!$keys || !isset($keys['public_key']) || !isset($keys['certificate'])) {
            throw new Exception("Invalid crypto keys format");
        }

        return [
            'public_key_pem' => base64_decode($keys['public_key']),
            'certificate' => $keys['certificate'] // Keep as base64
        ];
    }

    /**
     * Get service status for monitoring
     */
    public function getStatus(): array
    {
        return [
            'crypto_keys_exist' => file_exists($this->cryptoKeysPath),
            'openssl_available' => extension_loaded('openssl'),
            'memory_usage' => memory_get_usage(true),
            'service_type' => 'Pure PHP Production Service'
        ];
    }
}
