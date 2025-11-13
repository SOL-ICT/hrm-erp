<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Exception;

/**
 * WSL FIRS QR Generator - Direct wrapper for working WSL script
 * 
 * This service calls the exact WSL script that works with MBS 360
 * instead of trying to replicate the encryption in PHP
 */
class WSLFIRSQRService
{
    private $wslScriptPath;
    private $cryptoKeysPath;

    public function __construct()
    {
        // Path to your working WSL script
        $this->wslScriptPath = base_path('qrgen.sh');
        $this->cryptoKeysPath = base_path('FIRS_e-invoice-STRATEGIC OUTSOURCING LIMITED_cryptographic_key.txt');
    }

    /**
     * Generate QR code using the exact WSL script that works with MBS 360
     * 
     * @param string $irn
     * @return string|null The exact QR data that works with MBS 360
     */
    public function generateWorkingQRCode(string $irn): ?string
    {
        try {
            Log::info('WSL FIRS QR: Starting generation with working script', [
                'irn' => $irn,
                'script_path' => $this->wslScriptPath,
                'keys_path' => $this->cryptoKeysPath
            ]);

            // Create temporary directory for WSL script output
            $tempDir = sys_get_temp_dir() . '/firs_wsl_' . uniqid();
            if (!mkdir($tempDir, 0755, true)) {
                throw new Exception("Failed to create temp directory: {$tempDir}");
            }

            // Copy required files to temp directory
            $tempScriptPath = $tempDir . '/qrgen.sh';
            $tempKeysPath = $tempDir . '/crypto_keys.txt';

            if (!copy($this->wslScriptPath, $tempScriptPath)) {
                throw new Exception("Failed to copy WSL script");
            }

            if (!copy($this->cryptoKeysPath, $tempKeysPath)) {
                throw new Exception("Failed to copy crypto keys");
            }

            // Make script executable
            chmod($tempScriptPath, 0755);

            // Execute the exact WSL script that works with MBS 360
            $command = sprintf(
                'cd %s && bash ./qrgen.sh %s %s 2>&1',
                escapeshellarg($tempDir),
                escapeshellarg('crypto_keys.txt'),
                escapeshellarg($irn)
            );

            Log::info('WSL FIRS QR: Executing working script', [
                'command' => $command,
                'working_directory' => $tempDir
            ]);

            $output = [];
            $returnCode = 0;
            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                throw new Exception("WSL script failed: " . implode("\n", $output));
            }

            // Read the encrypted_data.txt file that the script generates
            $qrDataFile = $tempDir . '/encrypted_data.txt';
            if (!file_exists($qrDataFile)) {
                throw new Exception("WSL script did not generate encrypted_data.txt");
            }

            $qrData = file_get_contents($qrDataFile);
            if ($qrData === false) {
                throw new Exception("Failed to read QR data from WSL script output");
            }

            // The WSL script includes a newline, but for QR codes we should trim it
            $qrData = trim($qrData);

            Log::info('WSL FIRS QR: Successfully generated with working script', [
                'irn' => $irn,
                'qr_length' => strlen($qrData),
                'output_files' => glob($tempDir . '/*'),
                'script_output' => $output
            ]);

            // Clean up temp directory
            $this->cleanupTempDir($tempDir);

            return $qrData;
        } catch (Exception $e) {
            Log::error('WSL FIRS QR: Failed to generate with working script', [
                'irn' => $irn,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            // Clean up temp directory on error
            if (isset($tempDir)) {
                $this->cleanupTempDir($tempDir);
            }

            return null;
        }
    }

    /**
     * Check if the WSL environment and script are available
     * 
     * @return array Status information
     */
    public function getStatus(): array
    {
        return [
            'wsl_script_exists' => file_exists($this->wslScriptPath),
            'crypto_keys_exist' => file_exists($this->cryptoKeysPath),
            'jq_available' => $this->commandExists('jq'),
            'qrencode_available' => $this->commandExists('qrencode'),
            'openssl_available' => $this->commandExists('openssl'),
            'wsl_script_path' => $this->wslScriptPath,
            'crypto_keys_path' => $this->cryptoKeysPath
        ];
    }

    /**
     * Clean up temporary directory and files
     * 
     * @param string $dir
     */
    private function cleanupTempDir(string $dir): void
    {
        try {
            if (is_dir($dir)) {
                $files = glob($dir . '/*');
                foreach ($files as $file) {
                    if (is_file($file)) {
                        unlink($file);
                    }
                }
                rmdir($dir);
            }
        } catch (Exception $e) {
            Log::warning('WSL FIRS QR: Failed to cleanup temp directory', [
                'dir' => $dir,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Check if a command exists in the system
     * 
     * @param string $command
     * @return bool
     */
    private function commandExists(string $command): bool
    {
        $result = shell_exec("which {$command} 2>/dev/null");
        return !empty($result);
    }
}
