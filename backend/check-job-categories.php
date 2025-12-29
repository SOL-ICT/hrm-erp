<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$categories = DB::table('job_categories')->get();

echo "Current Job Categories in Database:\n";
echo "====================================\n\n";

if ($categories->isEmpty()) {
    echo "No categories found in database.\n";
} else {
    foreach ($categories as $category) {
        echo "ID: {$category->id}\n";
        echo "Name: {$category->name}\n";
        echo "Slug: {$category->slug}\n";
        echo "Active: " . ($category->is_active ? 'Yes' : 'No') . "\n";
        echo "Created: {$category->created_at}\n";
        echo "---\n";
    }
    echo "\nTotal: " . $categories->count() . " categories\n";
}
