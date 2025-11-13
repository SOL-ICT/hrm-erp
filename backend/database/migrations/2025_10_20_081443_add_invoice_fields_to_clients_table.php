<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->text('payment_terms')->nullable()->after('prefix');
            $table->string('contact_person_name')->nullable()->after('payment_terms');
            $table->string('contact_person_position')->nullable()->after('contact_person_name');
            $table->text('contact_person_address')->nullable()->after('contact_person_position');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn([
                'payment_terms',
                'contact_person_name',
                'contact_person_position',
                'contact_person_address'
            ]);
        });
    }
};
