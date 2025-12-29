<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->string('upload_batch_id', 36)->nullable()->after('onboarding_method');
            $table->index('upload_batch_id');
        });
    }

    public function down()
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->dropIndex(['upload_batch_id']);
            $table->dropColumn('upload_batch_id');
        });
    }
};
