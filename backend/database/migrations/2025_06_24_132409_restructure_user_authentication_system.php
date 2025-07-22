<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Add missing fields to users table for unified authentication
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'user_type')) {
                $table->enum('user_type', ['candidate', 'staff', 'admin', 'client'])->after('role');
            }
            if (!Schema::hasColumn('users', 'profile_id')) {
                $table->unsignedBigInteger('profile_id')->nullable()->after('user_type');
            }
            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('profile_id');
            }
            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable()->unique()->after('email');
            }
        });

        // Step 2: Add missing authentication fields to candidates table
        Schema::table('candidates', function (Blueprint $table) {
            if (!Schema::hasColumn('candidates', 'first_name')) {
                $table->string('first_name')->nullable()->after('email');
            }
            if (!Schema::hasColumn('candidates', 'last_name')) {
                $table->string('last_name')->nullable()->after('first_name');
            }
            if (!Schema::hasColumn('candidates', 'phone')) {
                $table->string('phone')->nullable()->after('last_name');
            }
            if (!Schema::hasColumn('candidates', 'date_of_birth')) {
                $table->date('date_of_birth')->nullable()->after('phone');
            }
        });

        // Step 3: Add authentication fields to staff table (if needed)
        Schema::table('staff', function (Blueprint $table) {
            if (!Schema::hasColumn('staff', 'email')) {
                $table->string('email')->nullable()->unique()->after('staff_id');
            }
            if (!Schema::hasColumn('staff', 'first_name')) {
                $table->string('first_name')->nullable()->after('email');
            }
            if (!Schema::hasColumn('staff', 'last_name')) {
                $table->string('last_name')->nullable()->after('first_name');
            }
        });

        // Step 4: Create some test users for each type
        $this->createTestUsers();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['user_type', 'profile_id', 'is_active', 'username']);
        });

        Schema::table('candidates', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name', 'phone', 'date_of_birth']);
        });

        Schema::table('staff', function (Blueprint $table) {
            $table->dropColumn(['email', 'first_name', 'last_name']);
        });
    }

    /**
     * Create test users for development
     */


    private function createTestUsers()
    {

        // Create the user first
        $userId = DB::table('users')->insertGetId([
            'name' => 'John Candidate',
            'email' => 'candidate@test.com',
            'username' => 'john.candidate',
            'password' => Hash::make('password123'),
            'role' => 'candidate',
            'user_type' => 'candidate',
            'profile_id' => null,
            'is_active' => true,
            'preferences' => json_encode([
                'theme' => 'light',
                'language' => 'en',
                'primary_color' => '#6366f1'
            ]),
            'created_at' => now(),
            'updated_at' => now(),
]);


        // Create the candidate with the same ID
        DB::table('candidates')->insert([
            'id' => $userId, //shared pk
            'email' => 'candidate@test.com',
            'password' => Hash::make('password123'),
            'first_name' => 'John',
            'last_name' => 'Candidate',
            'phone' => '+234801234567',
            'profile_completed' => false,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('users')->where('id', $userId)->update(['profile_id' => $userId]);

        // Create default client
        $clientId = DB::table('clients')->insertGetId([
            'client_code' => 'CLT001',
            'name' => 'Test Client',
            'slug' => 'test-client',
            'prefix' => 'TST',
            'address' => 'Lagos, Nigeria',
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $staffTypeId = DB::table('client_staff_types')->insertGetId([
            'client_id' => $clientId,
            'type_code' => 'DEFAULT',
            'title' => 'Default Staff Type',
            'description' => 'This is a default staff type for testing purposes.',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        // Test Staff Member  
        $staffId = DB::table('staff')->insertGetId([
            'candidate_id' => null, // Staff created directly, not from candidate
            'client_id' => $clientId, // Use the created client ID
            'staff_type_id' => $staffTypeId, // Use the created staff type ID
            'employee_code' => 'EMP001',
            'staff_id' => 'STF001',
            'email' => 'staff@test.com',
            'first_name' => 'Jane',
            'last_name' => 'Staff',
            'entry_date' => now()->toDateString(),
            'appointment_status' => 'confirmed',
            'employment_type' => 'full_time',
            'status' => 'active',
            'job_title' => 'HR Officer',
            'department' => 'Human Resources',
            'onboarding_method' => 'manual_entry',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('users')->insert([
            'name' => 'Jane Staff',
            'email' => 'staff@test.com',
            'username' => 'jane.staff',
            'password' => Hash::make('password123'),
            'role' => 'staff',
            'user_type' => 'staff',
            'profile_id' => $staffId,
            'is_active' => true,
            'preferences' => json_encode([
                'theme' => 'light',
                'language' => 'en',
                'primary_color' => '#6366f1'
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Test Admin
        DB::table('users')->insert([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'username' => 'admin',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'user_type' => 'admin',
            'profile_id' => null, // Admins might not need profile records
            'is_active' => true,
            'preferences' => json_encode([
                'theme' => 'dark',
                'language' => 'en',
                'primary_color' => '#8b5cf6'
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
};
