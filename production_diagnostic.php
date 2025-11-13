<?php
// HRM-ERP Production Server Diagnostic Script
// Upload this to hrm.mysol360.com/public/diagnostic.php to identify issues

echo "<h1>🔍 HRM-ERP Production Server Diagnostics</h1>";
echo "<pre>";

// 1. PHP Environment Check
echo "=== PHP ENVIRONMENT ===\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Script Path: " . __FILE__ . "\n";
echo "Current User: " . get_current_user() . "\n\n";

// 2. Required PHP Extensions
echo "=== REQUIRED PHP EXTENSIONS ===\n";
$required_extensions = [
    'pdo',
    'pdo_mysql',
    'mysqli',
    'mbstring',
    'tokenizer',
    'xml',
    'ctype',
    'json',
    'bcmath',
    'fileinfo',
    'openssl'
];

foreach ($required_extensions as $ext) {
    $status = extension_loaded($ext) ? "✅ LOADED" : "❌ MISSING";
    echo sprintf("%-15s: %s\n", $ext, $status);
}
echo "\n";

// 3. File System Check
echo "=== FILE SYSTEM CHECK ===\n";
$paths_to_check = [
    '../app' => 'Laravel Application Directory',
    '../app/.env' => 'Environment Configuration',
    '../app/vendor' => 'Composer Dependencies',
    '../app/storage' => 'Laravel Storage Directory',
    '../app/bootstrap/cache' => 'Laravel Cache Directory',
    '../app/public' => 'Laravel Public Directory'
];

foreach ($paths_to_check as $path => $description) {
    $full_path = realpath($path);
    if ($full_path) {
        $status = is_readable($path) ? "✅ ACCESSIBLE" : "⚠️ NOT READABLE";
        echo sprintf("%-30s: %s (%s)\n", $description, $status, $full_path);
    } else {
        echo sprintf("%-30s: ❌ NOT FOUND (%s)\n", $description, $path);
    }
}
echo "\n";

// 4. Database Connectivity Test
echo "=== DATABASE CONNECTIVITY ===\n";
if (file_exists('../app/.env')) {
    $env_content = file_get_contents('../app/.env');
    preg_match('/DB_HOST=(.*)/', $env_content, $host_matches);
    preg_match('/DB_DATABASE=(.*)/', $env_content, $db_matches);
    preg_match('/DB_USERNAME=(.*)/', $env_content, $user_matches);
    preg_match('/DB_PASSWORD=(.*)/', $env_content, $pass_matches);

    if (!empty($host_matches[1]) && !empty($db_matches[1])) {
        $host = trim($host_matches[1]);
        $database = trim($db_matches[1]);
        $username = trim($user_matches[1] ?? '');
        $password = trim($pass_matches[1] ?? '');

        echo "DB Host: $host\n";
        echo "DB Name: $database\n";
        echo "DB User: $username\n";

        try {
            $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
            echo "Database Connection: ✅ SUCCESS\n";

            $stmt = $pdo->query("SHOW TABLES");
            $table_count = $stmt->rowCount();
            echo "Tables Found: $table_count\n";
        } catch (PDOException $e) {
            echo "Database Connection: ❌ FAILED - " . $e->getMessage() . "\n";
        }
    } else {
        echo "Database Configuration: ❌ INCOMPLETE IN .ENV\n";
    }
} else {
    echo ".env File: ❌ NOT FOUND\n";
}
echo "\n";

// 5. Laravel Bootstrap Test
echo "=== LARAVEL BOOTSTRAP TEST ===\n";
if (file_exists('../app/vendor/autoload.php')) {
    try {
        require_once '../app/vendor/autoload.php';
        echo "Composer Autoloader: ✅ LOADED\n";

        if (file_exists('../app/bootstrap/app.php')) {
            $app = require_once '../app/bootstrap/app.php';
            echo "Laravel Bootstrap: ✅ SUCCESS\n";

            $kernel = $app->make('Illuminate\Contracts\Console\Kernel');
            $kernel->bootstrap();
            echo "Laravel Kernel: ✅ BOOTSTRAPPED\n";

            echo "Laravel Version: " . $app->version() . "\n";
            echo "Environment: " . $app->environment() . "\n";
        } else {
            echo "Laravel Bootstrap: ❌ bootstrap/app.php NOT FOUND\n";
        }
    } catch (Exception $e) {
        echo "Laravel Bootstrap: ❌ ERROR - " . $e->getMessage() . "\n";
    }
} else {
    echo "Composer Dependencies: ❌ vendor/autoload.php NOT FOUND\n";
}
echo "\n";

// 6. Web Server Configuration
echo "=== WEB SERVER CONFIGURATION ===\n";
echo "Request Method: " . $_SERVER['REQUEST_METHOD'] . "\n";
echo "Request URI: " . $_SERVER['REQUEST_URI'] . "\n";
echo "Query String: " . ($_SERVER['QUERY_STRING'] ?? 'None') . "\n";
echo "HTTPS: " . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'Yes' : 'No') . "\n";
echo "Host: " . $_SERVER['HTTP_HOST'] . "\n\n";

// 7. Permissions Check
echo "=== PERMISSIONS CHECK ===\n";
$permission_paths = [
    '../app/storage' => 'Storage Directory (needs 775)',
    '../app/bootstrap/cache' => 'Bootstrap Cache (needs 775)',
    '../app/.env' => 'Environment File (needs 644)'
];

foreach ($permission_paths as $path => $description) {
    if (file_exists($path)) {
        $perms = fileperms($path);
        $octal = substr(sprintf('%o', $perms), -4);
        $readable = is_readable($path) ? "R" : "-";
        $writable = is_writable($path) ? "W" : "-";
        echo sprintf("%-25s: %s (%s%s) - %s\n", $description, $octal, $readable, $writable, $path);
    } else {
        echo sprintf("%-25s: NOT FOUND - %s\n", $description, $path);
    }
}
echo "\n";

// 8. Error Log Check
echo "=== ERROR LOG CHECK ===\n";
$log_paths = [
    '../app/storage/logs/laravel.log' => 'Laravel Log',
    '/home/' . get_current_user() . '/logs/error_log' => 'cPanel Error Log',
    ini_get('error_log') => 'PHP Error Log'
];

foreach ($log_paths as $path => $description) {
    if (file_exists($path) && is_readable($path)) {
        $size = filesize($path);
        $modified = date('Y-m-d H:i:s', filemtime($path));
        echo "$description: EXISTS (Size: " . number_format($size) . " bytes, Modified: $modified)\n";

        // Show last 5 lines of log
        $lines = file($path);
        if (count($lines) > 0) {
            echo "  Last entries:\n";
            $last_lines = array_slice($lines, -3);
            foreach ($last_lines as $line) {
                echo "  " . trim($line) . "\n";
            }
        }
    } else {
        echo "$description: NOT ACCESSIBLE ($path)\n";
    }
}
echo "\n";

// 9. Test API Endpoint
echo "=== API ENDPOINT TEST ===\n";
if (file_exists('../app/routes/api.php')) {
    echo "API Routes File: ✅ EXISTS\n";

    // Try to make a simple API call
    $api_url = 'https://' . $_SERVER['HTTP_HOST'] . '/api/health';
    echo "Testing: $api_url\n";

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 10,
            'ignore_errors' => true
        ]
    ]);

    $result = @file_get_contents($api_url, false, $context);
    if ($result !== false) {
        echo "API Health Check: ✅ RESPONDED\n";
        echo "Response: " . substr($result, 0, 200) . "\n";
    } else {
        echo "API Health Check: ❌ NO RESPONSE\n";
    }
} else {
    echo "API Routes File: ❌ NOT FOUND\n";
}

echo "\n=== DIAGNOSTIC COMPLETE ===\n";
echo "Time: " . date('Y-m-d H:i:s') . "\n";
echo "Timezone: " . date_default_timezone_get() . "\n";

echo "</pre>";

// Generate fix suggestions
echo "<h2>🔧 SUGGESTED FIXES:</h2>";
echo "<ul>";

if (!extension_loaded('pdo_mysql')) {
    echo "<li><strong>Install PHP MySQL Extension:</strong> Contact hosting provider to enable php-mysql</li>";
}

if (!file_exists('../app')) {
    echo "<li><strong>Deploy Laravel Application:</strong> Upload backend files to /app/ directory</li>";
}

if (!file_exists('../app/.env')) {
    echo "<li><strong>Create Environment File:</strong> Copy .env.example to .env and configure</li>";
}

if (!is_writable('../app/storage')) {
    echo "<li><strong>Fix Permissions:</strong> chmod 775 /app/storage/ and /app/bootstrap/cache/</li>";
}

echo "<li><strong>Check cPanel Error Logs:</strong> Look for specific error messages</li>";
echo "<li><strong>Enable SSL:</strong> Force HTTPS redirect in cPanel SSL settings</li>";
echo "</ul>";

echo "<p><em>Upload this diagnostic script as diagnostic.php to your subdomain public folder and access via browser.</em></p>";
