<?php

/**
 * Database Structure Explorer
 * Direct connection to examine current database schema
 */

// Database connection parameters from docker-compose.yml
$host = 'localhost';
$port = '3306';
$database = 'hrm_database';
$username = 'hrm_user';
$password = 'hrm_password';

try {
    // Create PDO connection
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

    echo "✅ Successfully connected to database: $database\n\n";

    // Get all tables in the database
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "📋 CURRENT DATABASE TABLES (" . count($tables) . " tables found):\n";
    echo str_repeat("=", 60) . "\n";

    foreach ($tables as $table) {
        echo "📊 Table: $table\n";

        // Get table structure
        $stmt = $pdo->query("DESCRIBE $table");
        $columns = $stmt->fetchAll();

        foreach ($columns as $column) {
            $null = $column['Null'] === 'YES' ? 'NULL' : 'NOT NULL';
            $key = $column['Key'] ? "({$column['Key']})" : '';
            $extra = $column['Extra'] ? "[{$column['Extra']}]" : '';

            echo "  ├─ {$column['Field']}: {$column['Type']} $null $key $extra\n";
        }

        // Get row count
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM $table");
            $count = $stmt->fetch()['count'];
            echo "  └─ Records: $count\n";
        } catch (Exception $e) {
            echo "  └─ Records: Unable to count\n";
        }

        echo "\n";
    }

    echo "\n📊 SUMMARY FOR INVOICING SUBMODULE PLANNING:\n";
    echo str_repeat("=", 60) . "\n";

    // Check for key tables we'll need to integrate with
    $requiredTables = ['users', 'clients', 'staff', 'roles'];
    $existingTables = [];
    $missingTables = [];

    foreach ($requiredTables as $required) {
        if (in_array($required, $tables)) {
            $existingTables[] = $required;
        } else {
            $missingTables[] = $required;
        }
    }

    echo "✅ Existing tables we can integrate with:\n";
    foreach ($existingTables as $table) {
        echo "  - $table\n";
    }

    if (!empty($missingTables)) {
        echo "\n❌ Missing required tables:\n";
        foreach ($missingTables as $table) {
            echo "  - $table\n";
        }
    }

    echo "\n🎯 INVOICING TABLES NEEDED (estimated):\n";
    $invoicingTables = [
        'pay_structures' => 'Working days vs calendar days config per client',
        'emolument_rates' => 'Fixed rates per client/role/grade',
        'statutory_formulas' => 'PAYE, NHF, NSITF calculation formulas',
        'attendance_uploads' => 'Monthly attendance upload tracking',
        'attendance_records' => 'Individual staff attendance entries',
        'payroll_calculations' => 'Calculated payroll data per period',
        'generated_invoices' => 'Invoice records and metadata',
        'invoice_line_items' => 'Detailed invoice breakdowns'
    ];

    foreach ($invoicingTables as $table => $description) {
        $status = in_array($table, $tables) ? '✅ EXISTS' : '➕ TO CREATE';
        echo "  $status $table - $description\n";
    }
} catch (PDOException $e) {
    echo "❌ Connection failed: " . $e->getMessage() . "\n";
    echo "\n🔧 Try these alternatives:\n";
    echo "1. phpMyAdmin: http://localhost:8080\n";
    echo "2. Check if containers are running: docker-compose ps\n";
    echo "3. Restart containers: docker-compose restart mysql\n";
}
