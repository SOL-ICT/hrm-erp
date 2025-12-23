<?php
/**
 * Create Test Candidates for Boarding Method Testing
 * 
 * Creates candidates with applications linked to active recruitment requests for testing from_candidate boarding
 * Usage: docker exec hrm-laravel-api php create-test-candidates.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Candidate;
use App\Models\RecruitmentRequest;
use App\Models\Candidate\CandidateJobApplication;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

try {
    echo "Starting test candidate creation...\n\n";

    // Get active recruitment requests
    $tickets = RecruitmentRequest::where('status', 'active')
        ->whereIn('id', [2, 4, 5, 6, 7])
        ->get();

    if ($tickets->isEmpty()) {
        echo "No active recruitment tickets found!\n";
        exit(1);
    }

    $created = 0;
    $skipped = 0;
    
    // Get max candidate ID to generate new ones
    $maxCandidateId = DB::table('candidates')->max('id') ?? 0;
    $maxApplicationId = DB::table('candidate_job_applications')->max('id') ?? 0;

    foreach ($tickets as $ticket) {
        // Check if application already exists for this ticket with accepted status
        $existingApp = CandidateJobApplication::where('recruitment_request_id', $ticket->id)
            ->where('application_status', 'accepted')
            ->first();
            
        if ($existingApp) {
            $candidate = Candidate::find($existingApp->candidate_id);
            echo "Ticket {$ticket->ticket_id}: Application already exists for candidate '{$candidate->first_name} {$candidate->last_name}' (Candidate ID: {$candidate->id})\n";
            $skipped++;
            continue;
        }

        // Increment IDs for new records
        $maxCandidateId++;
        $maxApplicationId++;

        // Insert candidate directly with ID
        $candidateId = DB::table('candidates')->insertGetId([
            'id' => $maxCandidateId,
            'first_name' => 'Test',
            'last_name' => "Candidate{$ticket->id}",
            'email' => "testcandidate{$ticket->id}@solcentfield.com",
            'phone' => sprintf('080%08d', $ticket->id),
            'date_of_birth' => now()->subYears(25 + $ticket->id)->format('Y-m-d'),
            'password' => Hash::make('12345678'),
            'email_verified_at' => now(),
            'profile_completed' => true,
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Insert application directly with ID
        DB::table('candidate_job_applications')->insert([
            'id' => $maxApplicationId,
            'candidate_id' => $candidateId,
            'recruitment_request_id' => $ticket->id,
            'application_status' => 'accepted',
            'meets_location_criteria' => true,
            'meets_age_criteria' => true,
            'meets_experience_criteria' => true,
            'eligibility_score' => 100.00,
            'is_eligible' => true,
            'applied_at' => now(),
            'last_status_change' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        echo "Ticket {$ticket->ticket_id}: Created candidate 'Test Candidate{$ticket->id}'\n";
        echo "  Candidate ID: {$candidateId}\n";
        echo "  Email: testcandidate{$ticket->id}@solcentfield.com\n";
        echo "  Phone: " . sprintf('080%08d', $ticket->id) . "\n";
        echo "  Date of Birth: " . now()->subYears(25 + $ticket->id)->format('Y-m-d') . "\n";
        echo "  Application ID: {$maxApplicationId}\n";
        echo "  Status: accepted (Ready for boarding)\n\n";
        
        $created++;
    }

    echo "\n========================================\n";
    echo "Summary:\n";
    echo "  Created: {$created} candidates\n";
    echo "  Skipped: {$skipped} (already exist)\n";
    echo "  Total Tickets: " . count($tickets) . "\n";
    echo "========================================\n\n";

    if ($created > 0) {
        echo "✓ Test candidates created successfully!\n";
        echo "You can now test from_candidate boarding in the UI.\n";
        echo "Look for tickets: " . $tickets->pluck('ticket_id')->join(', ') . "\n";
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
