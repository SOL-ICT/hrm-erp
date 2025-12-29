<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Purpose: Update job categories to industry-focused classification
     * 
     * OLD CATEGORIES (Job Function Based):
     * - Information Technology
     * - Finance & Accounting
     * - Human Resources
     * - Sales & Marketing
     * - Operations
     * - Customer Service
     * - Administration
     * - Security
     * 
     * NEW CATEGORIES (Industry Sector Based):
     * - Agriculture, Forestry & Fisheries
     * - Energy, Utilities & Extractive Industries
     * - Manufacturing & Industrial Production
     * - Construction & Real Estate
     * - Transportation, Logistics & Trade
     * - Technology & Professional Services (ICT, digital, consulting, legal, advisory)
     * - Financial Services & Insurance
     * - Healthcare, Education & Life Sciences
     * - Consumer Goods, Retail & Hospitality
     * - Others
     */
    public function up(): void
    {
        // Clear existing categories
        DB::table('job_categories')->truncate();

        // Insert new industry-based categories
        $categories = [
            [
                'name' => 'Agriculture, Forestry & Fisheries',
                'slug' => 'agriculture-forestry-fisheries',
                'description' => 'Agricultural production, forestry operations, fishing, aquaculture, and related services',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Energy, Utilities & Extractive Industries',
                'slug' => 'energy-utilities-extractive',
                'description' => 'Oil & gas, mining, power generation, water supply, renewable energy, and utilities',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Manufacturing & Industrial Production',
                'slug' => 'manufacturing-industrial',
                'description' => 'Manufacturing facilities, industrial production, processing plants, and factory operations',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Construction & Real Estate',
                'slug' => 'construction-real-estate',
                'description' => 'Construction services, real estate development, property management, and infrastructure projects',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Transportation, Logistics & Trade',
                'slug' => 'transportation-logistics-trade',
                'description' => 'Transportation services, logistics operations, supply chain, warehousing, import/export, and trade',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Technology & Professional Services',
                'slug' => 'technology-professional-services',
                'description' => 'ICT, software development, digital services, consulting, legal, accounting, advisory, and professional services',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Financial Services & Insurance',
                'slug' => 'financial-services-insurance',
                'description' => 'Banking, insurance, investment services, microfinance, and other financial institutions',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Healthcare, Education & Life Sciences',
                'slug' => 'healthcare-education-life-sciences',
                'description' => 'Healthcare facilities, hospitals, clinics, educational institutions, research, pharmaceuticals, and life sciences',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Consumer Goods, Retail & Hospitality',
                'slug' => 'consumer-goods-retail-hospitality',
                'description' => 'Retail stores, FMCG, hotels, restaurants, tourism, entertainment, and consumer services',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Others',
                'slug' => 'others',
                'description' => 'Industries and sectors not covered by other categories',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('job_categories')->insert($categories);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore original job function categories
        DB::table('job_categories')->truncate();

        $originalCategories = [
            [
                'name' => 'Information Technology',
                'slug' => 'information-technology',
                'description' => null,
                'is_active' => true,
                'created_at' => '2025-06-30 09:08:47',
                'updated_at' => '2025-06-30 09:08:47',
            ],
            [
                'name' => 'Finance & Accounting',
                'slug' => 'finance-accounting',
                'description' => null,
                'is_active' => true,
                'created_at' => '2025-06-30 09:08:47',
                'updated_at' => '2025-06-30 09:08:47',
            ],
            [
                'name' => 'Human Resources',
                'slug' => 'human-resources',
                'description' => null,
                'is_active' => true,
                'created_at' => '2025-06-30 09:08:47',
                'updated_at' => '2025-06-30 09:08:47',
            ],
            [
                'name' => 'Sales & Marketing',
                'slug' => 'sales-marketing',
                'description' => null,
                'is_active' => true,
                'created_at' => '2025-06-30 09:08:47',
                'updated_at' => '2025-06-30 09:08:47',
            ],
            [
                'name' => 'Operations',
                'slug' => 'operations',
                'description' => null,
                'is_active' => true,
                'created_at' => '2025-06-30 09:08:47',
                'updated_at' => '2025-06-30 09:08:47',
            ],
            [
                'name' => 'Customer Service',
                'slug' => 'customer-service',
                'description' => null,
                'is_active' => true,
                'created_at' => '2025-06-30 09:08:47',
                'updated_at' => '2025-06-30 09:08:47',
            ],
            [
                'name' => 'Administration',
                'slug' => 'administration',
                'description' => null,
                'is_active' => true,
                'created_at' => '2025-06-30 09:08:47',
                'updated_at' => '2025-06-30 09:08:47',
            ],
            [
                'name' => 'Security',
                'slug' => 'security',
                'description' => null,
                'is_active' => true,
                'created_at' => '2025-06-30 09:08:47',
                'updated_at' => '2025-06-30 09:08:47',
            ],
        ];

        DB::table('job_categories')->insert($originalCategories);
    }
};
