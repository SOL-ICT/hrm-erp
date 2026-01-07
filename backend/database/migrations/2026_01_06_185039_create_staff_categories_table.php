<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
            $table->integer('annual_leave_allowance');
            $table->integer('max_transferable_days')->default(2);
            $table->timestamps();
        });

        // Seed initial data
        DB::table('staff_categories')->insert([
            ['id' => 1, 'name' => 'Senior Staff', 'annual_leave_allowance' => 21, 'max_transferable_days' => 2, 'created_at' => '2025-11-24 09:50:00', 'updated_at' => '2025-11-24 09:50:00'],
            ['id' => 2, 'name' => 'Mid-Level Staff', 'annual_leave_allowance' => 18, 'max_transferable_days' => 2, 'created_at' => '2025-11-24 09:50:00', 'updated_at' => '2025-11-24 09:50:00'],
            ['id' => 3, 'name' => 'Junior Staff', 'annual_leave_allowance' => 10, 'max_transferable_days' => 2, 'created_at' => '2025-11-24 09:50:00', 'updated_at' => '2025-11-24 09:50:00'],
            ['id' => 4, 'name' => 'Intern', 'annual_leave_allowance' => 5, 'max_transferable_days' => 2, 'created_at' => '2025-11-24 09:50:00', 'updated_at' => '2025-11-24 09:50:00'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_categories');
    }
};