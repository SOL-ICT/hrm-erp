<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Recruitment\RecruitmentRequest;
use App\Models\Candidate;
use App\Models\RecruitmentApplication;
use App\Models\User;

class RecruitmentApplicationSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Get some existing recruitment requests (active ones)
        $recruitmentRequests = RecruitmentRequest::where('status', 'active')->take(3)->get();

        if ($recruitmentRequests->isEmpty()) {
            $this->command->warn('No active recruitment requests found. Please create some recruitment requests first.');
            return;
        }

        // Get some existing candidates
        $candidates = Candidate::take(10)->get();

        if ($candidates->isEmpty()) {
            $this->command->warn('No candidates found. Please create some candidates first.');
            return;
        }

        // Sample application data
        $applicationStatuses = ['pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected'];
        $applicationSources = ['website', 'referral', 'agency', 'social_media'];

        foreach ($recruitmentRequests as $request) {
            // Create 1-3 applications per recruitment request based on available candidates
            $numApplications = min(rand(1, 3), $candidates->count());
            $selectedCandidates = $candidates->random($numApplications);

            foreach ($selectedCandidates as $candidate) {
                // Check if application already exists
                $existingApplication = RecruitmentApplication::where([
                    'recruitment_request_id' => $request->id,
                    'candidate_id' => $candidate->id
                ])->first();

                if ($existingApplication) {
                    continue; // Skip if already exists
                }

                RecruitmentApplication::create([
                    'recruitment_request_id' => $request->id,
                    'candidate_id' => $candidate->id,
                    'cover_letter' => $this->generateCoverLetter($candidate, $request),
                    'expected_salary' => rand(150000, 800000), // Random salary between 150k and 800k
                    'available_start_date' => now()->addDays(rand(7, 60))->format('Y-m-d'),
                    'status' => $applicationStatuses[array_rand($applicationStatuses)],
                    'application_source' => $applicationSources[array_rand($applicationSources)],
                    'applied_at' => now()->subDays(rand(1, 30)),
                    'notes' => rand(1, 3) == 1 ? 'Candidate has relevant experience in similar roles.' : null,
                ]);
            }
        }

        $this->command->info('Recruitment applications seeded successfully!');
    }

    /**
     * Generate a sample cover letter
     */
    private function generateCoverLetter($candidate, $request): string
    {
        return "Dear Hiring Manager,\n\n" .
            "I am writing to express my strong interest in the position advertised under ticket {$request->ticket_id}. " .
            "With my background and experience, I believe I would be a valuable addition to your team.\n\n" .
            "I am {$candidate->first_name} {$candidate->last_name}, and I have the skills and qualifications necessary for this role. " .
            "I am excited about the opportunity to contribute to your organization and would welcome the chance to discuss my application further.\n\n" .
            "Thank you for considering my application. I look forward to hearing from you.\n\n" .
            "Sincerely,\n{$candidate->first_name} {$candidate->last_name}";
    }
}
