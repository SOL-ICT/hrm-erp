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
            // Track how the leave was approved
            $table->enum('approval_method', ['email_link', 'admin_dashboard'])->nullable()->after('approver_comments');
            
            // Admin user ID who approved from dashboard (if applicable)
            $table->unsignedBigInteger('approved_by_admin_id')->nullable()->after('approval_method');
            $table->foreign('approved_by_admin_id')->references('id')->on('users')->onDelete('set null');
            
            // Device and network info for tracking
            $table->string('approval_ip_address')->nullable()->after('approved_by_admin_id');
            $table->text('approval_user_agent')->nullable()->after('approval_ip_address');
            
            // Email the approval link was sent to
            $table->string('supervisor_email_sent')->nullable()->after('approval_user_agent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_applications', function (Blueprint $table) {
            $table->dropForeign(['approved_by_admin_id']);
            $table->dropColumn([
                'approval_method',
                'approved_by_admin_id',
                'approval_ip_address',
                'approval_user_agent',
                'supervisor_email_sent'
            ]);
        });
    }
};
