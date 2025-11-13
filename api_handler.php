<?php
// API Handler for Main Domain mysol360.com
// This file routes API requests to the Laravel application

// Get the requested route
$route = $_GET['route'] ?? '';
$request_method = $_SERVER['REQUEST_METHOD'];

// Set up proper request URI for Laravel
$_SERVER['REQUEST_URI'] = '/api/' . $route . ($_SERVER['QUERY_STRING'] ? '?' . $_SERVER['QUERY_STRING'] : '');
$_SERVER['SCRIPT_NAME'] = '/index.php';

// Path to Laravel application (one level up from public_html)  
$laravel_path = dirname(__DIR__) . '/app';
$laravel_public = $laravel_path . '/public';

// Detailed error reporting for debugging
if (!file_exists($laravel_path)) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Laravel application directory not found',
        'expected_path' => $laravel_path,
        'current_dir' => __DIR__,
        'message' => 'Upload backend files to /app/ directory'
    ]);
    exit;
}

if (!file_exists($laravel_public . '/index.php')) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Laravel entry point not found',
        'expected_file' => $laravel_public . '/index.php',
        'message' => 'Deploy complete Laravel application'
    ]);
    exit;
}

if (!file_exists($laravel_path . '/.env')) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Laravel environment not configured',
        'expected_file' => $laravel_path . '/.env',
        'message' => 'Create production .env file'
    ]);
    exit;
}

// Set Laravel-specific environment variables
putenv('APP_RUNNING_IN_CONSOLE=false');

// Change working directory to Laravel public
$original_cwd = getcwd();
chdir($laravel_public);

// Capture any output for debugging
ob_start();

try {
    // Include Laravel application
    require_once $laravel_public . '/index.php';
} catch (Exception $e) {
    // Restore working directory
    chdir($original_cwd);

    // Clear any output
    ob_clean();

    // Return error response
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Laravel application error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'route' => $route,
        'method' => $request_method
    ]);
} finally {
    // Restore working directory
    chdir($original_cwd);
}
