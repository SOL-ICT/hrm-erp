<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Exception;

/**
 * FIRS Cryptographic Service
 * Handles encryption of QR code data using FIRS cryptographic keys
 */
class FIRSCryptographicService
{
    private $cryptoKeysPath;
    private $publicKey;
    private $certificate;

    public function __construct()
    {
        // Handle different environments
        if (app()->runningInConsole() && file_exists('/var/www/FIRS_e-invoice-STRATEGIC OUTSOURCING LIMITED_cryptographic_key.txt')) {
            // Docker environment
            $this->cryptoKeysPath = '/var/www/FIRS_e-invoice-STRATEGIC OUTSOURCING LIMITED_cryptographic_key.txt';
        } else {
            // Local development environment
            $this->cryptoKeysPath = dirname(base_path()) . '/FIRS_e-invoice-STRATEGIC OUTSOURCING LIMITED_cryptographic_key.txt';
        }
    }

    /**
     * Load and parse FIRS cryptographic keys
     *
     * @return array
     * @throws Exception
     */
    public function loadCryptoKeys()
    {
        if (!file_exists($this->cryptoKeysPath)) {
            throw new Exception("FIRS crypto keys file not found at: {$this->cryptoKeysPath}");
        }

        $cryptoData = file_get_contents($this->cryptoKeysPath);
        $keys = json_decode($cryptoData, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Invalid JSON in FIRS crypto keys file: " . json_last_error_msg());
        }

        if (!isset($keys['public_key']) || !isset($keys['certificate'])) {
            throw new Exception("Missing public_key or certificate in FIRS crypto keys file");
        }

        // Decode the base64-encoded public key
        $publicKeyPem = base64_decode($keys['public_key']);
        if ($publicKeyPem === false) {
            throw new Exception("Failed to decode public key from base64");
        }

        $this->publicKey = $publicKeyPem;
        $this->certificate = $keys['certificate'];

        return [
            'public_key_pem' => $this->publicKey,
            'certificate' => $this->certificate
        ];
    }

    /**
     * Encrypt QR data for FIRS compliance (Official FIRS Method)
     *
     * @param string $irn The Invoice Reference Number
     * @return string Base64 encoded encrypted data
     * @throws Exception
     */
    public function encryptQRData($irn)
    {
        try {
            // Load crypto keys
            $keys = $this->loadCryptoKeys();

            // Step 1: Create IRN with UNIX timestamp (FIRS requirement)
            $timestamp = time(); // UNIX timestamp
            $irnWithTimestamp = $irn . '.' . $timestamp;

            // Step 2: Create the JSON payload as per FIRS specification
            $qrPayload = [
                'irn' => $irnWithTimestamp,
                'certificate' => $this->certificate
            ];

            // Step 3: Create JSON using jq command (exactly matching WSL script)
            $tempCompactFile = tempnam(sys_get_temp_dir(), 'firs_compact_');
            $tempDataFile = tempnam(sys_get_temp_dir(), 'firs_data_');

            // First create compact JSON
            $compactJson = json_encode($qrPayload, JSON_UNESCAPED_SLASHES);
            file_put_contents($tempCompactFile, $compactJson);

            // Use jq to format exactly like WSL script: jq . file.json
            $jqCommand = sprintf(
                'jq . %s > %s',
                escapeshellarg($tempCompactFile),
                escapeshellarg($tempDataFile)
            );
            exec($jqCommand, $jqOutput, $jqReturn);

            if ($jqReturn !== 0 || !file_exists($tempDataFile)) {
                // Fallback to PHP pretty print if jq fails
                $dataPayload = json_encode($qrPayload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
                file_put_contents($tempDataFile, $dataPayload);
            }

            $dataPayload = file_get_contents($tempDataFile);

            Log::info('FIRS Encryption: Preparing data for encryption (WSL-Compatible Method)', [
                'original_irn' => $irn,
                'irn_with_timestamp' => $irnWithTimestamp,
                'timestamp' => $timestamp,
                'certificate_length' => strlen($this->certificate),
                'payload_length' => strlen($dataPayload),
                'payload_structure' => 'IRN+timestamp and certificate (jq formatted)',
                'jq_used' => $jqReturn === 0
            ]);

            // Step 4: Create a temporary file for the public key
            $tempKeyFile = tempnam(sys_get_temp_dir(), 'firs_key_');
            file_put_contents($tempKeyFile, $this->publicKey);

            // Step 5: Create a temporary file for the encrypted output
            $tempEncryptedFile = tempnam(sys_get_temp_dir(), 'firs_encrypted_');

            try {
                // Step 6: Encrypt using OpenSSL command
                $command = sprintf(
                    'openssl pkeyutl -encrypt -inkey %s -pubin -in %s -out %s 2>&1',
                    escapeshellarg($tempKeyFile),
                    escapeshellarg($tempDataFile),
                    escapeshellarg($tempEncryptedFile)
                );

                $output = [];
                $returnCode = 0;
                exec($command, $output, $returnCode);

                if ($returnCode !== 0) {
                    throw new Exception("OpenSSL encryption failed: " . implode("\n", $output));
                }

                // Step 7: Read the encrypted data and encode to base64 (matching WSL script format)
                if (!file_exists($tempEncryptedFile) || filesize($tempEncryptedFile) === 0) {
                    throw new Exception("Encrypted file was not created or is empty");
                }

                // Use base64 command exactly like WSL script format
                $command = sprintf('base64 %s', escapeshellarg($tempEncryptedFile));
                $base64Output = shell_exec($command);

                if ($base64Output === null) {
                    // Fallback to PHP base64_encode if command fails
                    $encryptedBinary = file_get_contents($tempEncryptedFile);
                    $encryptedBase64 = base64_encode($encryptedBinary);
                } else {
                    // Strip trailing newlines for QR code (but the content should match WSL)
                    $encryptedBase64 = rtrim($base64Output, "\n\r");
                }

                // Get binary size for logging
                $binarySize = file_exists($tempEncryptedFile) ? filesize($tempEncryptedFile) : 0;

                Log::info('FIRS Encryption: Successfully encrypted QR data', [
                    'irn' => $qrPayload['irn'],
                    'encrypted_size' => $binarySize,
                    'base64_size' => strlen($encryptedBase64),
                    'method' => 'WSL-compatible base64 command',
                    'success' => true
                ]);

                return $encryptedBase64;
            } finally {
                // Clean up temporary files
                @unlink($tempCompactFile);
                @unlink($tempDataFile);
                @unlink($tempKeyFile);
                @unlink($tempEncryptedFile);
            }
        } catch (Exception $e) {
            Log::error('FIRS Encryption: Failed to encrypt QR data', [
                'irn' => $firsData['irn'] ?? 'N/A',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            throw $e;
        }
    }

    /**
     * Check if OpenSSL is available
     *
     * @return bool
     */
    public function isOpenSSLAvailable()
    {
        $output = [];
        $returnCode = 0;
        exec('openssl version 2>&1', $output, $returnCode);
        return $returnCode === 0;
    }

    /**
     * Get crypto keys status
     *
     * @return array
     */
    public function getStatus()
    {
        $status = [
            'crypto_keys_file_exists' => file_exists($this->cryptoKeysPath),
            'openssl_available' => $this->isOpenSSLAvailable(),
            'crypto_keys_path' => $this->cryptoKeysPath
        ];

        if ($status['crypto_keys_file_exists']) {
            try {
                $keys = $this->loadCryptoKeys();
                $status['keys_loaded'] = true;
                $status['public_key_length'] = strlen($keys['public_key_pem']);
                $status['certificate_length'] = strlen($keys['certificate']);
            } catch (Exception $e) {
                $status['keys_loaded'] = false;
                $status['keys_error'] = $e->getMessage();
            }
        }

        return $status;
    }
}
