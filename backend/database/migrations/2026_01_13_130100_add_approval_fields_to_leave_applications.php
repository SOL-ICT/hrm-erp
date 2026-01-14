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
        Schema::table('leave_applications', function (Blueprint $table) {
            $table->unsignedBigInteger('supervisor_id')->nullable()->after('handover_staff_id');
            $table->string('approval_token', 64)->nullable()->unique()->after('supervisor_id');
            $table->timestamp('approval_token_expires_at')->nullable()->after('approval_token');
            $table->timestamp('approved_at')->nullable()->after('approval_token_expires_at');
            $table->text('approver_comments')->nullable()->after('comments');

            // Foreign key constraint
            $table->foreign('supervisor_id')->references('id')->on('staff_supervisors')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_applications', function (Blueprint $table) {
            $table->dropForeign(['supervisor_id']);
            $table->dropColumn(['supervisor_id', 'approval_token', 'approval_token_expires_at', 'approved_at', 'approver_comments']);
        });
    }
};
