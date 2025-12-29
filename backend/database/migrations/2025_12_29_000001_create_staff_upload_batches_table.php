<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStaffUploadBatchesTable extends Migration
{
    public function up()
    {
        Schema::create('staff_upload_batches', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('uploaded_by');
            $table->timestamp('upload_time')->useCurrent();
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->unsignedBigInteger('approval_id')->nullable();
            $table->timestamps();

            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('approval_id')->references('id')->on('approvals')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('staff_upload_batches');
    }
}
