<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('staff_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
            $table->integer('annual_leave_allowance');
            $table->integer('max_transferable_days')->default(2);
            $table->timestamps();
        });

        // Seed default categories
        DB::table('staff_categories')->insert([
            [
                'name' => 'Senior Staff',
                'annual_leave_allowance' => 21,
                'max_transferable_days' => 2,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Mid-Level Staff',
                'annual_leave_allowance' => 18,
                'max_transferable_days' => 2,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Junior Staff',
                'annual_leave_allowance' => 10,
                'max_transferable_days' => 2,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Associate',
                'annual_leave_allowance' => 15,
                'max_transferable_days' => 2,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Intern',
                'annual_leave_allowance' => 5,
                'max_transferable_days' => 2,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_categories');
    }
};
