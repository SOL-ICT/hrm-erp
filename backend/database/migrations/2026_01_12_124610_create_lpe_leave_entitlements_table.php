<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lpe_leave_entitlements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('client_id')->constrained('clients')->onDelete('cascade')->onUpdate('cascade');
            $table->foreignId('staff_level_id')->constrained('lpe_staff_levels')->onDelete('cascade')->onUpdate('cascade');
            $table->foreignId('leave_type_id')->constrained('lpe_leave_types')->onDelete('restrict')->onUpdate('cascade');
            $table->decimal('entitled_days', 5, 2);
            $table->integer('max_consecutive_days')->nullable();
            $table->decimal('max_carryover_days', 5, 2)->default(0.00);
            $table->enum('renewal_frequency', ['ANNUAL', 'BIANNUAL', 'NONE'])->default('ANNUAL');
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['client_id', 'staff_level_id', 'leave_type_id', 'effective_from'], 'uk_entitlement');
            $table->index('client_id', 'idx_lpe_entitlements_client');
            $table->index('staff_level_id', 'idx_lpe_entitlements_level');
            $table->index('leave_type_id', 'idx_lpe_entitlements_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lpe_leave_entitlements');
    }
};