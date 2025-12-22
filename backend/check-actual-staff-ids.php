<?php

require __DIR__ . '/vendor/autoload.php';
use App\Models\Staff;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Check Actual Staff IDs ===\n\n";

$staffIds = Staff::pluck('id')->toArray();
echo "Existing staff IDs: " . implode(', ', $staffIds) . "\n";
echo "Total count: " . count($staffIds) . "\n";

// Check if IDs 18-65 exist
$rangeIds = range(18, 65);
$existingFromRange = array_intersect($rangeIds, $staffIds);
echo "\nFrom range 18-65, these IDs exist: " . implode(', ', $existingFromRange) . "\n";
echo "Count from range: " . count($existingFromRange) . "\n";

echo "\nMissing from range 18-65: " . implode(', ', array_diff($rangeIds, $staffIds)) . "\n";