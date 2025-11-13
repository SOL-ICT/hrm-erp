<?php
// HRM-ERP Main Domain Diagnostic Script  
// Upload this to mysol360.com/diagnostic.php to identify deployment issues

echo "<h1>🔍 HRM-ERP Main Domain (mysol360.com) Diagnostics</h1>";
echo "<pre>";

// 1. Environment Check
echo "=== SERVER ENVIRONMENT ===\n";
echo "Domain: " . $_SERVER['HTTP_HOST'] . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n";
echo "Current Directory: " . getcwd() . "\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
echo "Current User: " . get_current_user() . "\n";
echo "Script Location: " . __FILE__ . "\n\n";

// 2. Laravel Application Check
echo "=== LARAVEL APPLICATION CHECK ===\n";
$laravel_paths = [
    '../app' => 'Main Laravel Directory',
    '../app/.env' => 'Environment Configuration',
    '../app/vendor' => 'Composer Dependencies',
    '../app/public/index.php' => 'Laravel Entry Point',
    '../app/storage' => 'Storage Directory',
    '../app/bootstrap/cache' => 'Bootstrap Cache',
    '../app/routes/api.php' => 'API Routes',
    '../app/app/Http/Controllers' => 'Controllers Directory'
];

foreach ($laravel_paths as $path => $description) {
    if (file_exists($path)) {
        $readable = is_readable($path) ? "✅ ACCESSIBLE" : "⚠️ NOT READABLE";
        $real_path = realpath($path);
        echo sprintf("%-25s: %s (%s)\n", $description, $readable, $real_path);
    } else {
        echo sprintf("%-25s: ❌ NOT FOUND (%s)\n", $description, $path);
    }
}
echo "\n";

// 3. Frontend Deployment Check
echo "=== FRONTEND DEPLOYMENT CHECK ===\n";
$frontend_files = [
    './index.html' => 'Frontend Entry Point',
    './_next' => 'Next.js Build Files',
    './assets' => 'Static Assets',
    './.htaccess' => 'Web Server Rules',
    './api_handler.php' => 'API Proxy Handler'
];

foreach ($frontend_files as $path => $description) {
    if (file_exists($path)) {
        $status = is_readable($path) ? "✅ DEPLOYED" : "⚠️ NOT READABLE";
        echo sprintf("%-25s: %s\n", $description, $status);
    } else {
        echo sprintf("%-25s: ❌ MISSING\n", $description);
    }
}
echo "\n";

// 4. PHP Extensions Check
echo "=== PHP EXTENSIONS CHECK ===\n";
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
    'openssl',
    'zip',
    'curl',
    'gd'
];

foreach ($required_extensions as $ext) {
    $status = extension_loaded($ext) ? "✅ LOADED" : "❌ MISSING";
    echo sprintf("%-15s: %s\n", $ext, $status);
}
echo "\n";

// 5. Environment Configuration Check
echo "=== ENVIRONMENT CONFIGURATION ===\n";
if (file_exists('../app/.env')) {
    echo ".env File: ✅ FOUND\n";

    $env_content = file_get_contents('../app/.env');
    $env_vars = [
        'APP_URL' => 'Application URL',
        'APP_ENV' => 'Environment',
        'APP_DEBUG' => 'Debug Mode',
        'DB_HOST' => 'Database Host',
        'DB_DATABASE' => 'Database Name',
        'DB_USERNAME' => 'Database User'
    ];

    foreach ($env_vars as $var => $description) {
        if (preg_match("/^$var=(.*)$/m", $env_content, $matches)) {
            $value = trim($matches[1]);
            if ($var === 'DB_PASSWORD') {
                $value = str_repeat('*', strlen($value)); // Hide password
            }
            echo sprintf("%-20s: %s\n", $description, $value ?: 'NOT SET');
        } else {
            echo sprintf("%-20s: ❌ NOT CONFIGURED\n", $description);
        }
    }
} else {
    echo ".env File: ❌ NOT FOUND\n";
}
echo "\n";

// 6. Database Connectivity Test
echo "=== DATABASE CONNECTIVITY ===\n";
if (file_exists('../app/.env')) {
    $env_content = file_get_contents('../app/.env');

    // Extract database configuration
    preg_match('/DB_HOST=(.*)/', $env_content, $host_match);
    preg_match('/DB_DATABASE=(.*)/', $env_content, $db_match);
    preg_match('/DB_USERNAME=(.*)/', $env_content, $user_match);
    preg_match('/DB_PASSWORD=(.*)/', $env_content, $pass_match);

    if (!empty($host_match[1]) && !empty($db_match[1])) {
        $host = trim($host_match[1]);
        $database = trim($db_match[1]);
        $username = trim($user_match[1] ?? '');
        $password = trim($pass_match[1] ?? '');

        echo "Database Host: $host\n";
        echo "Database Name: $database\n";
        echo "Database User: $username\n";

        try {
            $dsn = "mysql:host=$host;dbname=$database;charset=utf8mb4";
            $pdo = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);

            echo "Connection: ✅ SUCCESS\n";

            // Check for key tables
            $tables = ['users', 'clients', 'invoices', 'attendance_uploads'];
            foreach ($tables as $table) {
                $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
                $stmt->execute([$table]);
                $exists = $stmt->fetch() ? "✅" : "❌";
                echo "Table '$table': $exists\n";
            }
        } catch (PDOException $e) {
            echo "Connection: ❌ FAILED\n";
            echo "Error: " . $e->getMessage() . "\n";
        }
    } else {
        echo "Database Config: ❌ INCOMPLETE\n";
    }
} else {
    echo ".env File: ❌ NOT FOUND\n";
}
echo "\n";

// 7. Laravel Bootstrap Test
echo "=== LARAVEL BOOTSTRAP TEST ===\n";
if (file_exists('../app/vendor/autoload.php') && file_exists('../app/bootstrap/app.php')) {
    try {
        // Change to Laravel directory
        $original_cwd = getcwd();
        chdir('../app');

        require_once 'vendor/autoload.php';
        echo "Composer Autoloader: ✅ LOADED\n";

        $app = require_once 'bootstrap/app.php';
        echo "Laravel Application: ✅ CREATED\n";

        $kernel = $app->make('Illuminate\Contracts\Console\Kernel');
        $kernel->bootstrap();
        echo "Kernel Bootstrap: ✅ SUCCESS\n";

        echo "Laravel Version: " . $app->version() . "\n";
        echo "Environment: " . $app->environment() . "\n";

        // Test database connection via Laravel
        try {
            $pdo = $app->make('db')->connection()->getPdo();
            echo "Laravel DB Connection: ✅ SUCCESS\n";
        } catch (Exception $e) {
            echo "Laravel DB Connection: ❌ FAILED - " . $e->getMessage() . "\n";
        }

        // Restore original directory
        chdir($original_cwd);
    } catch (Exception $e) {
        echo "Laravel Bootstrap: ❌ ERROR\n";
        echo "Error: " . $e->getMessage() . "\n";
        if (isset($original_cwd)) {
            chdir($original_cwd);
        }
    }
} else {
    echo "Laravel Files: ❌ MISSING (vendor/autoload.php or bootstrap/app.php)\n";
}
echo "\n";

// 8. API Handler Test
echo "=== API HANDLER TEST ===\n";
if (file_exists('./api_handler.php')) {
    echo "API Handler File: ✅ EXISTS\n";

    // Test API handler functionality
    $test_url = 'https://' . $_SERVER['HTTP_HOST'] . '/api_handler.php?route=health';
    echo "Testing: $test_url\n";

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 10,
            'ignore_errors' => true,
            'header' => 'User-Agent: HRM-Diagnostic-Script'
        ]
    ]);

    $response = @file_get_contents($test_url, false, $context);
    if ($response !== false) {
        echo "API Handler Response: ✅ WORKING\n";
        echo "Response Preview: " . substr($response, 0, 100) . "...\n";
    } else {
        echo "API Handler Response: ❌ NO RESPONSE\n";
    }
} else {
    echo "API Handler File: ❌ NOT FOUND\n";
}
echo "\n";

// 9. Web Server Configuration
echo "=== WEB SERVER CONFIGURATION ===\n";
echo "Request Method: " . $_SERVER['REQUEST_METHOD'] . "\n";
echo "Request URI: " . $_SERVER['REQUEST_URI'] . "\n";
echo "HTTPS Enabled: " . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'Yes' : 'No') . "\n";
echo "Host Header: " . $_SERVER['HTTP_HOST'] . "\n";

// Check .htaccess  
if (file_exists('./.htaccess')) {
    echo ".htaccess File: ✅ EXISTS\n";
    $htaccess_size = filesize('./.htaccess');
    echo ".htaccess Size: " . number_format($htaccess_size) . " bytes\n";
} else {
    echo ".htaccess File: ❌ MISSING\n";
}
echo "\n";

// 10. Permissions Check
echo "=== PERMISSIONS CHECK ===\n";
$check_paths = [
    '../app/storage' => 'Laravel Storage (needs 775)',
    '../app/bootstrap/cache' => 'Bootstrap Cache (needs 775)',
    '../app/.env' => 'Environment File (needs 644)',
    './.htaccess' => 'Web Server Rules (needs 644)'
];

foreach ($check_paths as $path => $description) {
    if (file_exists($path)) {
        $perms = fileperms($path);
        $octal = substr(sprintf('%o', $perms), -4);
        $readable = is_readable($path) ? "R" : "-";
        $writable = is_writable($path) ? "W" : "-";
        echo sprintf("%-30s: %s (%s%s)\n", $description, $octal, $readable, $writable);
    } else {
        echo sprintf("%-30s: ❌ NOT FOUND\n", $description);
    }
}

echo "\n=== DIAGNOSTIC COMPLETE ===\n";
echo "Timestamp: " . date('Y-m-d H:i:s T') . "\n";
echo "Server Timezone: " . date_default_timezone_get() . "\n";
echo "</pre>";

// Generate actionable recommendations
echo "<h2>🔧 DEPLOYMENT RECOMMENDATIONS:</h2>";
echo "<ol>";

if (!file_exists('../app')) {
    echo "<li><strong>CRITICAL:</strong> Deploy Laravel backend to /app/ directory (above document root)</li>";
}

if (!file_exists('../app/.env')) {
    echo "<li><strong>CRITICAL:</strong> Create production .env file with database credentials</li>";
}

if (!file_exists('./api_handler.php')) {
    echo "<li><strong>CRITICAL:</strong> Create api_handler.php in document root for API routing</li>";
}

if (!file_exists('./.htaccess')) {
    echo "<li><strong>CRITICAL:</strong> Create .htaccess file for URL routing and CORS</li>";
}

if (!extension_loaded('pdo_mysql')) {
    echo "<li><strong>HIGH:</strong> Enable PHP MySQL extension in cPanel</li>";
}

echo "<li><strong>MEDIUM:</strong> Enable SSL and force HTTPS redirects in cPanel</li>";
echo "<li><strong>MEDIUM:</strong> Set proper file permissions (775 for storage, 644 for config files)</li>";
echo "<li><strong>LOW:</strong> Run Laravel optimization commands after deployment</li>";

echo "</ol>";

echo "<h3>🚀 Quick Test Commands:</h3>";
echo "<ul>";
echo "<li>Frontend: <a href='https://mysol360.com/' target='_blank'>https://mysol360.com/</a></li>";
echo "<li>API Handler: <a href='https://mysol360.com/api_handler.php' target='_blank'>https://mysol360.com/api_handler.php</a></li>";
echo "<li>API Health: <a href='https://mysol360.com/api/health' target='_blank'>https://mysol360.com/api/health</a></li>";
echo "</ul>";

echo "<p><em>Save this diagnostic output and run again after making changes to track progress.</em></p>";
