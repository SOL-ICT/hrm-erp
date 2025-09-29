<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Models\Candidate\CandidateJobApplication;
use App\Models\Recruitment\RecruitmentRequest;
use App\Models\Candidate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CandidateJobApplicationController extends Controller
{
    /**
     * Get candidate ID from authenticated user or request
     */
    private function getCandidateId(Request $request): ?int
    {
        $user = Auth::user();
        
        if ($user && $user->user_type === 'candidate' && $user->profile_id) {
            return $user->profile_id;
        }
        
        return $request->candidate_id ?? null;
    }

    /**
     * Submit a job application for a recruitment request
     */
    public function submitApplication(Request $request): JsonResponse
    {
        try {
            Log::info('=== JOB APPLICATION SUBMISSION STARTED ===');
            Log::info('Request data: ', $request->all());
            
            // Get candidate ID from authenticated user or request
            $candidateId = $this->getCandidateId($request);
            Log::info('Candidate ID: ' . $candidateId);

            if (!$candidateId) {
                Log::error('No candidate ID found');
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate not found. Please complete your profile first.'
                ], 400);
            }

            // Verify that the candidate exists in the database
            $candidate = \App\Models\Candidate::find($candidateId);
            Log::info('Candidate found: ' . ($candidate ? 'YES' : 'NO'));
            if (!$candidate) {
                Log::error('Candidate not found in database: ' . $candidateId);
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate profile not found. Please contact support.'
                ], 400);
            }

            Log::info('Starting validation...');
            $validator = Validator::make($request->all(), [
                'candidate_id' => 'nullable|exists:candidates,id',
                'recruitment_request_id' => 'required|exists:recruitment_requests,id',
                'cover_letter' => 'nullable|string|max:5000',
                'expected_salary' => 'nullable|numeric|min:0',
                'available_start_date' => 'nullable|date', // Removed after:today to test
                'motivation' => 'nullable|string|max:2000',
            ]);

            Log::info('Validation completed. Has errors: ' . ($validator->fails() ? 'YES' : 'NO'));
            if ($validator->fails()) {
                Log::error('Validation errors: ', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            Log::info('Checking recruitment request status...');
            // Check if recruitment request is still active
            $recruitmentRequest = RecruitmentRequest::find($request->recruitment_request_id);
            Log::info('Recruitment request found: ' . ($recruitmentRequest ? 'YES' : 'NO'));
            if ($recruitmentRequest) {
                Log::info('Recruitment request status: ' . $recruitmentRequest->status);
            }
            
            if (!$recruitmentRequest || $recruitmentRequest->status !== 'active') {
                Log::error('Recruitment request not active or not found');
                return response()->json([
                    'success' => false,
                    'message' => 'This position is no longer accepting applications'
                ], 400);
            }

            Log::info('Checking for existing application...');
            // Check if already applied
            $existingApplication = CandidateJobApplication::where('candidate_id', $candidateId)
                ->where('recruitment_request_id', $request->recruitment_request_id)
                ->first();

            Log::info('Existing application found: ' . ($existingApplication ? 'YES' : 'NO'));
            if ($existingApplication) {
                Log::error('Candidate has already applied for this position');
                return response()->json([
                    'success' => false,
                    'message' => 'You have already applied for this position'
                ], 422);
            }

            Log::info('Creating temporary application for criteria checking...');
            // Check eligibility criteria BEFORE creating the application
            $tempApplication = new CandidateJobApplication([
                'candidate_id' => $candidateId,
                'recruitment_request_id' => $request->recruitment_request_id,
            ]);
            
            Log::info('Setting relationships...');
            // Load relationships for criteria checking
            $tempApplication->setRelation('candidate', $candidate);
            $tempApplication->setRelation('recruitmentRequest', $recruitmentRequest);
            
            Log::info('Checking all criteria...');
            // Check all criteria
            $criteriaResults = $tempApplication->checkAllCriteriaWithoutSaving();
            Log::info('Criteria results: ', $criteriaResults);
            
            Log::info('Preparing salary expectations...');
            // Prepare salary expectations
            $salaryExpectations = null;
            if ($request->has('salary_expectations')) {
                $salaryExpectations = $request->salary_expectations;
            } elseif ($request->expected_salary) {
                $salaryExpectations = [
                    'amount' => $request->expected_salary,
                    'currency' => 'NGN'
                ];
            }
            Log::info('Salary expectations prepared: ', $salaryExpectations ?: []);

            Log::info('Creating job application...');
            try {
                // Create job application with criteria already evaluated
                $applicationData = [
                    'candidate_id' => $candidateId,
                    'recruitment_request_id' => $request->recruitment_request_id,
                    'application_status' => 'applied',
                    'cover_letter' => $request->cover_letter,
                    'salary_expectations' => $salaryExpectations,
                    'motivation' => $request->motivation,
                    'availability' => $request->availability ?? [], // Ensure it's an array, not null
                    'applied_at' => now(),
                    // Set criteria values from pre-check
                    'meets_location_criteria' => $criteriaResults['location'],
                    'meets_age_criteria' => $criteriaResults['age'],
                    'meets_experience_criteria' => $criteriaResults['experience'],
                    'eligibility_score' => $criteriaResults['score'],
                    'is_eligible' => $criteriaResults['is_eligible'], // Now the column exists
                ];
                
                Log::info('Application data to be created: ', $applicationData);
                $application = CandidateJobApplication::create($applicationData);
                Log::info('Job application created successfully with ID: ' . $application->id);
            } catch (\Exception $e) {
                Log::error('Failed to create job application: ' . $e->getMessage());
                Log::error('Application data was: ', $applicationData ?? []);
                throw $e;
            }
            Log::info('Job application created successfully with ID: ' . $application->id);

            // Load relationships for response
            $application->load(['candidate', 'recruitmentRequest.jobStructure']);

            return response()->json([
                'success' => true,
                'message' => 'Job application submitted successfully',
                'data' => [
                    'application_id' => $application->id,
                    'status' => $application->application_status,
                    'eligibility_score' => $application->eligibility_score,
                    'is_eligible' => $application->is_eligible,
                    'applied_at' => $application->applied_at,
                    'position' => $application->recruitmentRequest->jobStructure->job_title ?? 'N/A',
                    'ticket_id' => $application->recruitmentRequest->ticket_id,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit job application',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get available job positions for candidates with application status
     */
    public function getAvailableJobs(Request $request): JsonResponse
    {
        try {
            $candidateId = $this->getCandidateId($request);

            if (!$candidateId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate not found'
                ], 400);
            }

            // Get all active recruitment requests with application status
            $jobs = RecruitmentRequest::with([
                'client:id,organisation_name,client_name',
                'jobStructure:id,job_title',
                'serviceLocation:id,name'
            ])
            ->where('status', 'active')
            ->orderBy('created_at', 'desc')
            ->get();

            // Transform jobs with application status
            $transformedJobs = $jobs->map(function ($job) use ($candidateId) {
                // Check if candidate has applied
                $application = CandidateJobApplication::where('candidate_id', $candidateId)
                    ->where('recruitment_request_id', $job->id)
                    ->first();

                return [
                    'id' => $job->id,
                    'ticket_id' => $job->ticket_id,
                    'title' => $job->jobStructure->job_title ?? 'N/A',
                    'company' => $job->client->organisation_name ?? $job->client->client_name ?? 'N/A',
                    'location' => $job->serviceLocation->name ?? 'N/A',
                    'number_of_vacancies' => $job->number_of_vacancies,
                    'priority_level' => $job->priority_level,
                    'recruitment_period_end' => $job->recruitment_period_end,
                    'description' => $job->description,
                    'created_at' => $job->created_at,
                    // Application status information
                    'has_applied' => !is_null($application),
                    'application_status' => $application ? $application->application_status : null,
                    'applied_at' => $application ? $application->applied_at : null,
                    'application_id' => $application ? $application->id : null,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $transformedJobs,
                'message' => 'Available jobs retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve available jobs',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get candidate's job applications
     */
    public function getMyApplications(Request $request): JsonResponse
    {
        try {
            $candidateId = $this->getCandidateId($request);

            if (!$candidateId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Candidate not found'
                ], 400);
            }

            $applications = CandidateJobApplication::with([
                    'recruitmentRequest.jobStructure',
                    'recruitmentRequest.client'
                ])
                ->where('candidate_id', $candidateId)
                ->orderBy('applied_at', 'desc')
                ->get();

            $transformedApplications = $applications->map(function ($app) {
                return [
                    'id' => $app->id,
                    'position_title' => $app->recruitmentRequest->jobStructure->job_title ?? 'N/A',
                    'company' => $app->recruitmentRequest->client->organisation_name ?? 'N/A',
                    'ticket_id' => $app->recruitmentRequest->ticket_id,
                    'status' => $app->application_status,
                    'eligibility_score' => $app->eligibility_score,
                    'is_eligible' => $app->is_eligible,
                    'applied_at' => $app->applied_at,
                    'last_status_change' => $app->last_status_change,
                    'salary_expectations' => $app->formatted_salary_expectations,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $transformedApplications
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch applications',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get a specific job application details
     */
    public function getApplication(Request $request, $applicationId): JsonResponse
    {
        try {
            $candidateId = $this->getCandidateId($request);

            $application = CandidateJobApplication::with([
                    'recruitmentRequest.jobStructure',
                    'recruitmentRequest.client'
                ])
                ->where('id', $applicationId)
                ->where('candidate_id', $candidateId)
                ->first();

            if (!$application) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $application->id,
                    'position_title' => $application->recruitmentRequest->jobStructure->job_title ?? 'N/A',
                    'company' => $application->recruitmentRequest->client->organisation_name ?? 'N/A',
                    'ticket_id' => $application->recruitmentRequest->ticket_id,
                    'status' => $application->application_status,
                    'cover_letter' => $application->cover_letter,
                    'motivation' => $application->motivation,
                    'salary_expectations' => $application->salary_expectations,
                    'availability' => $application->availability,
                    'eligibility_score' => $application->eligibility_score,
                    'is_eligible' => $application->is_eligible,
                    'meets_location_criteria' => $application->meets_location_criteria,
                    'meets_age_criteria' => $application->meets_age_criteria,
                    'meets_experience_criteria' => $application->meets_experience_criteria,
                    'applied_at' => $application->applied_at,
                    'last_status_change' => $application->last_status_change,
                    'status_history' => $application->status_history,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch application details',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Withdraw a job application
     */
    public function withdrawApplication(Request $request, $applicationId): JsonResponse
    {
        try {
            $candidateId = $this->getCandidateId($request);

            $application = CandidateJobApplication::where('id', $applicationId)
                ->where('candidate_id', $candidateId)
                ->first();

            if (!$application) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application not found'
                ], 404);
            }

            // Check if application can be withdrawn
            if (in_array($application->application_status, ['accepted', 'rejected'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot withdraw application that has been finalized'
                ], 400);
            }

            $application->updateStatus('withdrawn', 'Withdrawn by candidate');

            return response()->json([
                'success' => true,
                'message' => 'Application withdrawn successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to withdraw application',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
