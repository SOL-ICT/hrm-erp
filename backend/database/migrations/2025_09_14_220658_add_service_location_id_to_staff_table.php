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
        Schema::table('staff', function (Blueprint $table) {
            $table->unsignedBigInteger('service_location_id')->nullable()->after('client_id');
            $table->foreign('service_location_id')->references('id')->on('service_locations')->onDelete('set null');
            $table->index('service_location_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->dropForeign(['service_location_id']);
            $table->dropColumn('service_location_id');
        });
    }
};
