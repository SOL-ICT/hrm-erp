<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Purpose: 
     * 1. Change "Financial Services & Insurance" to "Financial Institution"
     * 2. Add new "Banking" category
     */
    public function up(): void
    {
        // Update "Financial Services & Insurance" to "Financial Institution"
        DB::table('job_categories')
            ->where('name', 'Financial Services & Insurance')
            ->update([
                'name' => 'Financial Institution',
                'slug' => 'financial-institution',
                'description' => 'Banking, insurance, investment, and other financial services',
                'updated_at' => now(),
            ]);

        // Add new "Banking" category
        DB::table('job_categories')->insert([
            'name' => 'Banking',
            'slug' => 'banking',
            'description' => 'Commercial banking, retail banking, corporate banking, and related financial services',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert "Financial Institution" back to "Financial Services & Insurance"
        DB::table('job_categories')
            ->where('name', 'Financial Institution')
            ->update([
                'name' => 'Financial Services & Insurance',
                'slug' => 'financial-services-insurance',
                'description' => 'Banking, insurance, investment, wealth management, and financial advisory services',
                'updated_at' => now(),
            ]);

        // Remove "Banking" category
        DB::table('job_categories')
            ->where('slug', 'banking')
            ->delete();
    }
};
