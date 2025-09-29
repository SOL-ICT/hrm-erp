<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('recruitment_requests', function (Blueprint $table) {
            $table->enum('closure_reason', ['fulfilled', 'expired'])->nullable()->after('closed_reason');
            $table->text('closure_comments')->nullable()->after('closure_reason');
            $table->integer('staff_accepted_offer')->default(0)->after('closure_comments');
            $table->foreignId('closed_by')->nullable()->constrained('users')->onDelete('set null')->after('staff_accepted_offer');
            
            // Indexes
            $table->index(['closure_reason']);
        });
    }

    public function down()
    {
        Schema::table('recruitment_requests', function (Blueprint $table) {
            $table->dropForeign(['closed_by']);
            $table->dropIndex(['closure_reason']);
            $table->dropColumn(['closure_reason', 'closure_comments', 'staff_accepted_offer', 'closed_by']);
        });
    }
};