<?php

/**
 * Check Staff Data - Direct Database Query
 * Uses credentials from docker-compose.yml:
 * - Host: mysql (container name for internal Docker network)
 * - Database: hrm_database
 * - User: hrm_user
 * - Password: hrm_password
 */

// Direct database connection
$host = 'mysql'; // Use container name when running inside Docker
$port = '3306'; // Internal Docker port
$database = 'hrm_database';
$username = 'hrm_user';
$password = 'hrm_password';

try {
    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    echo "✓ Database connection successful!\n\n";
} catch (PDOException $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

echo "=== Staff Data Verification ===\n\n";

// Get recent staff (uploaded in bulk)
$stmt = $pdo->prepare("
    SELECT * FROM staff 
    WHERE client_id = 1 
    ORDER BY created_at DESC 
    LIMIT 5
");
$stmt->execute();
$recentStaff = $stmt->fetchAll();

echo "Checking " . count($recentStaff) . " most recent staff records:\n\n";

foreach ($recentStaff as $staff) {
    echo "====================================\n";
    echo "Staff: {$staff['staff_id']} - {$staff['first_name']} {$staff['last_name']}\n";
    echo "Employee Code: {$staff['employee_code']}\n";
    echo "Created: {$staff['created_at']}\n";
    echo "------------------------------------\n";
    
    $staffId = $staff['id'];
    
    // Check related records
    $banking = $pdo->query("SELECT * FROM staff_banking WHERE staff_id = {$staffId}")->fetch();
    $personalInfo = $pdo->query("SELECT * FROM staff_personal_info WHERE staff_id = {$staffId}")->fetch();
    $legalIds = $pdo->query("SELECT * FROM staff_legal_ids WHERE staff_id = {$staffId}")->fetch();
    $emergencyContact = $pdo->query("SELECT * FROM staff_emergency_contacts WHERE staff_id = {$staffId}")->fetch();
    $guarantor = $pdo->query("SELECT * FROM staff_guarantors WHERE staff_id = {$staffId}")->fetch();
    $education = $pdo->query("SELECT * FROM staff_education WHERE staff_id = {$staffId}")->fetch();
    $experience = $pdo->query("SELECT * FROM staff_experience WHERE staff_id = {$staffId}")->fetch();
    
    echo "Banking: " . ($banking ? "✓ Found (ID: {$banking['id']})" : "✗ Missing") . "\n";
    if ($banking) {
        echo "  - Payment Mode: {$banking['payment_mode']}\n";
        echo "  - Bank: {$banking['bank_name']}\n";
        echo "  - Account: {$banking['account_number']}\n";
    }
    
    echo "Personal Info: " . ($personalInfo ? "✓ Found (ID: {$personalInfo['id']})" : "✗ Missing") . "\n";
    if ($personalInfo) {
        echo "  - Marital Status: {$personalInfo['marital_status']}\n";
        echo "  - Nationality: {$personalInfo['nationality']}\n";
        echo "  - Address: {$personalInfo['current_address']}\n";
    }
    
    echo "Legal IDs: " . ($legalIds ? "✓ Found (ID: {$legalIds['id']})" : "✗ Missing") . "\n";
    if ($legalIds) {
        echo "  - National ID: {$legalIds['national_id_no']}\n";
        echo "  - Tax ID: {$legalIds['tax_id_no']}\n";
        echo "  - Pension PIN: {$legalIds['pension_pin']}\n";
    }
    
    echo "Emergency Contact: " . ($emergencyContact ? "✓ Found (ID: {$emergencyContact['id']})" : "✗ Missing") . "\n";
    if ($emergencyContact) {
        echo "  - Name: {$emergencyContact['name']}\n";
        echo "  - Phone: {$emergencyContact['phone_number']}\n";
    }
    
    echo "Guarantor: " . ($guarantor ? "✓ Found (ID: {$guarantor['id']})" : "✗ Missing") . "\n";
    if ($guarantor) {
        echo "  - Name: {$guarantor['name']}\n";
        echo "  - Phone: {$guarantor['phone_number']}\n";
    }
    
    echo "Education: " . ($education ? "✓ Found (ID: {$education['id']})" : "✗ Missing") . "\n";
    if ($education) {
        echo "  - Institution: {$education['institution_name']}\n";
        echo "  - Qualification: {$education['certificate_type']}\n";
    }
    
    echo "Experience: " . ($experience ? "✓ Found (ID: {$experience['id']})" : "✗ Missing") . "\n";
    if ($experience) {
        echo "  - Employer: {$experience['employer_name']}\n";
        echo "  - Position: {$experience['designation']}\n";
    }
    
    echo "\n";
}

// Check specific staff if ID provided
if (isset($argv[1])) {
    $staffIdSearch = $argv[1];
    echo "\n=== Detailed Check for Staff ID: {$staffIdSearch} ===\n\n";
    
    $stmt = $pdo->prepare("SELECT * FROM staff WHERE staff_id = ?");
    $stmt->execute([$staffIdSearch]);
    $staff = $stmt->fetch();
    
    if (!$staff) {
        echo "Staff not found!\n";
        exit(1);
    }
    
    $staffId = $staff['id'];
    
    echo "Staff Record:\n";
    echo json_encode($staff, JSON_PRETTY_PRINT) . "\n\n";
    
    $banking = $pdo->query("SELECT * FROM staff_banking WHERE staff_id = {$staffId}")->fetch();
    echo "Banking Record:\n";
    echo $banking ? json_encode($banking, JSON_PRETTY_PRINT) : "None";
    echo "\n\n";
    
    $personalInfo = $pdo->query("SELECT * FROM staff_personal_info WHERE staff_id = {$staffId}")->fetch();
    echo "Personal Info Record:\n";
    echo $personalInfo ? json_encode($personalInfo, JSON_PRETTY_PRINT) : "None";
    echo "\n\n";
    
    $legalIds = $pdo->query("SELECT * FROM staff_legal_ids WHERE staff_id = {$staffId}")->fetch();
    echo "Legal IDs Record:\n";
    echo $legalIds ? json_encode($legalIds, JSON_PRETTY_PRINT) : "None";
    echo "\n\n";
    
    $emergencyContact = $pdo->query("SELECT * FROM staff_emergency_contacts WHERE staff_id = {$staffId}")->fetch();
    echo "Emergency Contact Record:\n";
    echo $emergencyContact ? json_encode($emergencyContact, JSON_PRETTY_PRINT) : "None";
    echo "\n\n";
    
    $guarantor = $pdo->query("SELECT * FROM staff_guarantors WHERE staff_id = {$staffId}")->fetch();
    echo "Guarantor Record:\n";
    echo $guarantor ? json_encode($guarantor, JSON_PRETTY_PRINT) : "None";
    echo "\n\n";
    
    $education = $pdo->query("SELECT * FROM staff_education WHERE staff_id = {$staffId}")->fetch();
    echo "Education Record:\n";
    echo $education ? json_encode($education, JSON_PRETTY_PRINT) : "None";
    echo "\n\n";
    
    $experience = $pdo->query("SELECT * FROM staff_experience WHERE staff_id = {$staffId}")->fetch();
    echo "Experience Record:\n";
    echo $experience ? json_encode($experience, JSON_PRETTY_PRINT) : "None";
    echo "\n";
}

echo "\n=== Complete ===\n";
