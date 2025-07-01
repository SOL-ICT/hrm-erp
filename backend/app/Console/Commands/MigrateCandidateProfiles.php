<?php

/**
 * Create this file as: app/Console/Commands/MigrateCandidateProfiles.php
 * 
 * Then run: php artisan migrate:candidate-profiles
 */

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateCandidateProfiles extends Command
{
    protected $signature = 'migrate:candidate-profiles';
    protected $description = 'Migrate existing candidates to candidate_profiles table';

    public function handle()
    {
        $this->info('🚀 Starting migration of candidates to candidate_profiles...');

        try {
            // Test database connection first
            DB::connection()->getPdo();
            $this->info('✅ Database connection successful');

            // Get all candidates who don't have profiles yet
            $candidatesWithoutProfiles = DB::table('candidates')
                ->leftJoin('candidate_profiles', 'candidates.id', '=', 'candidate_profiles.candidate_id')
                ->whereNull('candidate_profiles.candidate_id')
                ->select('candidates.*')
                ->get();

            $this->info("📊 Found {$candidatesWithoutProfiles->count()} candidates without profiles");

            if ($candidatesWithoutProfiles->count() === 0) {
                $this->info('🎉 All candidates already have profiles!');
                return 0;
            }

            $bar = $this->output->createProgressBar($candidatesWithoutProfiles->count());
            $bar->start();

            $successCount = 0;
            $errorCount = 0;

            foreach ($candidatesWithoutProfiles as $candidate) {
                try {
                    // Extract names from candidate data
                    $firstName = $candidate->first_name ?? '';
                    $lastName = $candidate->last_name ?? '';

                    // Generate formal name
                    $formalName = '';
                    if ($firstName && $lastName) {
                        $formalName = "Mr./Ms. {$firstName} {$lastName}";
                    }

                    // Create profile data
                    $profileData = [
                        'candidate_id' => $candidate->id,
                        'first_name' => $firstName,
                        'middle_name' => '',
                        'last_name' => $lastName,
                        'formal_name' => $formalName,
                        'gender' => null, // Empty - user will fill
                        'date_of_birth' => $candidate->date_of_birth ?? null,
                        'marital_status' => null,
                        'nationality' => 'Nigeria', // Default
                        'state_of_origin' => '',
                        'local_government' => '',
                        'state_of_residence' => '',
                        'local_government_residence' => '',
                        'national_id_no' => '',
                        'phone_primary' => $candidate->phone ?? '',
                        'phone_secondary' => '',
                        'address_current' => '',
                        'address_permanent' => '',
                        'blood_group' => null,
                        'profile_picture' => null,
                        'created_at' => now(),
                        'updated_at' => now()
                    ];

                    // Insert the profile
                    DB::table('candidate_profiles')->insert($profileData);

                    $successCount++;
                } catch (\Exception $e) {
                    $errorCount++;
                    $this->error("Failed to create profile for candidate ID {$candidate->id}: " . $e->getMessage());
                }

                $bar->advance();
            }

            $bar->finish();
            $this->newLine();

            $this->info("🎉 Migration completed!");
            $this->info("✅ Success: {$successCount} profiles created");

            if ($errorCount > 0) {
                $this->error("❌ Errors: {$errorCount}");
            }

            // Show sample of created profiles
            $this->info("📋 Sample of created profiles:");
            $sampleProfiles = DB::table('candidate_profiles')
                ->join('candidates', 'candidate_profiles.candidate_id', '=', 'candidates.id')
                ->select(
                    'candidate_profiles.first_name',
                    'candidate_profiles.last_name',
                    'candidate_profiles.phone_primary',
                    'candidates.email'
                )
                ->limit(5)
                ->get();

            foreach ($sampleProfiles as $profile) {
                $this->line("- {$profile->first_name} {$profile->last_name} | {$profile->email} | {$profile->phone_primary}");
            }

            return 0;
        } catch (\Exception $e) {
            $this->error("💥 Migration failed: " . $e->getMessage());
            return 1;
        }
    }
}
