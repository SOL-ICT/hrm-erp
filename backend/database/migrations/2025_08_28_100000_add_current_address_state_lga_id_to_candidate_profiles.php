<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            // Add current address state_lga_id field
            $table->unsignedBigInteger('current_address_state_lga_id')->nullable()->after('state_lga_id');
            $table->foreign('current_address_state_lga_id')->references('id')->on('states_lgas')->onDelete('set null');
            $table->index('current_address_state_lga_id');
        });
    }

    public function down(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->dropForeign(['current_address_state_lga_id']);
            $table->dropIndex(['current_address_state_lga_id']);
            $table->dropColumn('current_address_state_lga_id');
        });
    }
};
