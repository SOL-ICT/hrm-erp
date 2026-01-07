<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
            $table->integer('annual_allowance')->nullable();
            $table->timestamps();
        });

        // Seed initial data
        DB::table('leave_types')->insert([
            ['id' => 1, 'name' => 'Annual Leave Senior Staff Level', 'annual_allowance' => null, 'created_at' => '2025-08-19 07:41:31', 'updated_at' => '2025-08-19 07:41:31'],
            ['id' => 2, 'name' => 'Compassionate Leave', 'annual_allowance' => null, 'created_at' => '2025-08-19 07:41:31', 'updated_at' => '2025-08-19 07:41:31'],
            ['id' => 3, 'name' => 'Sick Leave', 'annual_allowance' => null, 'created_at' => '2025-08-19 07:41:31', 'updated_at' => '2025-08-19 07:41:31'],
            ['id' => 4, 'name' => 'Maternity Leave', 'annual_allowance' => null, 'created_at' => '2025-08-19 07:41:31', 'updated_at' => '2025-08-19 07:41:31'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_types');
    }
};