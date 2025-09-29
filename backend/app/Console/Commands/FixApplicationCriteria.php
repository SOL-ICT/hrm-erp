<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Candidate\CandidateJobApplication;

class FixApplicationCriteria extends Command
{
    protected $signature = 'applications:fix-criteria';
    protected $description = 'Fix criteria evaluation for existing job applications';

    public function handle()
    {
        $this->info('Fixing criteria for existing job applications...');

        $applications = CandidateJobApplication::with(['candidate', 'recruitmentRequest'])->get();
        $fixed = 0;

        foreach ($applications as $application) {
            $this->info("Processing application ID: {$application->id}");
            
            try {
                // Re-evaluate all criteria
                $results = $application->checkAllCriteria();
                
                $this->info("  - Location criteria: " . ($results['location'] ? 'PASS' : 'FAIL'));
                $this->info("  - Age criteria: " . ($results['age'] ? 'PASS' : 'FAIL'));
                $this->info("  - Experience criteria: " . ($results['experience'] ? 'PASS' : 'FAIL'));
                $this->info("  - Eligibility score: {$results['score']}%");
                
                $fixed++;
            } catch (\Exception $e) {
                $this->error("  - Error processing application {$application->id}: " . $e->getMessage());
            }
        }

        $this->info("Fixed {$fixed} applications.");
        
        return 0;
    }
}
