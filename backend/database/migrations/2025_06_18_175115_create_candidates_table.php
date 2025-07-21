<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidates', function (Blueprint $table) {
            $table->unsignedBigInteger('id'); // Use unsignedBigInteger to match the default user ID type
            // This is the primary key and foreign key to the users table
            $table->primary('id'); // Set the primary key to the user ID
            // This ensures that each candidate corresponds to a user
            $table->foreign('id')->references('id')->on('users')->onDelete('cascade');// Foreign key to the users table

            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');

            // Add these to match AuthController
            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone')->nullable();
            $table->date('date_of_birth')->nullable();
            
            $table->boolean('profile_completed')->default(false);
            $table->enum('status', ['pending', 'active', 'inactive'])->default('pending');
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidates');
    }
};
