<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ServiceLocation;
use App\Models\Staff;
use App\Models\StaffPersonalInfo;
use App\Models\StaffBanking;
use App\Models\StaffEducation;
use App\Models\StaffExperience;
use App\Models\StaffEmergencyContact;
use App\Models\StaffGuarantor;
use App\Models\StaffLegalId;
use App\Models\StaffReference;
use App\Models\ClientStaffType;
use App\Models\StaffRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;

class EmployeeRecordController extends Controller
{
    /**
     * Get all active clients for employee record filtering
     */
    public function getClients(): JsonResponse
    {
        try {
            $clients = Client::where('status', 'active')
                ->select('id', 'organisation_name as client_name', 'client_code')
                ->orderBy('organisation_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $clients
            ]);
        } catch (\Exception $e) {
            $clients = Client::where('status', 'active')
                ->select('id', 'organisation_name', 'prefix')
                ->orderBy('organisation_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $clients
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching clients for employee record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching clients'
            ], 500);
        }
    }

    /**
     * Get locations for a specific client
     */
    public function getLocationsByClient($clientId): JsonResponse
    {
        try {
            $locations = ServiceLocation::where('client_id', $clientId)
                ->where('is_active', 1)
                ->select('id', 'location_name', 'location_code', 'city', 'state')
                ->orderBy('location_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $locations
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching locations for client: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching locations'
            ], 500);
        }
    }

    /**
     * Get staff with filtering options
     */
    public function getStaff(Request $request): JsonResponse
    {
        try {
            $query = Staff::with([
                'client:id,organisation_name', 
                'serviceLocation:id,location_name'
            ])
                ->select('staff.*');

            // Apply filters
            if ($request->has('client_id') && $request->client_id) {
                $query->where('client_id', $request->client_id);
            }

            if ($request->has('service_location_id') && $request->service_location_id) {
                $query->where('service_location_id', $request->service_location_id);
            }

            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            } else {
                // Default to active staff only
                $query->where('status', 'active');
            }

            if ($request->has('search') && $request->search) {
                $searchTerm = '%' . $request->search . '%';
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('first_name', 'like', $searchTerm)
                      ->orWhere('last_name', 'like', $searchTerm)
                      ->orWhere('employee_code', 'like', $searchTerm)
                      ->orWhere('staff_id', 'like', $searchTerm)
                      ->orWhere('email', 'like', $searchTerm);
                });
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $staff = $query->orderBy('first_name')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $staff
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching staff: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching staff data'
            ], 500);
        }
    }

    /**
     * Get comprehensive staff details with all related information
     */
    public function getStaffDetails($staffId): JsonResponse
    {
        try {
            $staff = Staff::with([
                'client:id,client_name',
                'serviceLocation:id,location_name',
                'personalInfo',
                'bankingInfo',
                'education',
                'experience',
                'emergencyContacts',
                'guarantors',
                'legalIds',
                'references'
            ])->find($staffId);

            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff member not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $staff
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching staff details: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching staff details'
            ], 500);
        }
    }

    /**
     * Update staff basic information
     */
    public function updateStaffBasic(Request $request, $staffId): JsonResponse
    {
        try {
            $staff = Staff::find($staffId);
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff member not found'
                ], 404);
            }

            $validatedData = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'email' => 'required|email|unique:staff,email,' . $staffId,
                'phone' => 'required|string|max:20',
                'employee_id' => 'nullable|string|max:50|unique:staff,employee_id,' . $staffId,
                'position' => 'nullable|string|max:255',
                'department' => 'nullable|string|max:255',
                'hire_date' => 'nullable|date',
                'salary' => 'nullable|numeric|min:0',
                'status' => 'required|in:active,inactive,suspended,terminated'
            ]);

            $staff->update($validatedData);

            return response()->json([
                'success' => true,
                'message' => 'Staff basic information updated successfully',
                'data' => $staff->fresh()
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating staff basic info: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating staff information'
            ], 500);
        }
    }

    /**
     * Update staff personal information
     */
    public function updateStaffPersonal(Request $request, $staffId): JsonResponse
    {
        try {
            $staff = Staff::find($staffId);
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff member not found'
                ], 404);
            }

            $validatedData = $request->validate([
                'date_of_birth' => 'nullable|date',
                'gender' => 'nullable|in:male,female,other',
                'marital_status' => 'nullable|in:single,married,divorced,widowed',
                'nationality' => 'nullable|string|max:100',
                'state_of_origin' => 'nullable|string|max:100',
                'lga_of_origin' => 'nullable|string|max:100',
                'residential_address' => 'nullable|string',
                'permanent_address' => 'nullable|string',
                'next_of_kin_name' => 'nullable|string|max:255',
                'next_of_kin_phone' => 'nullable|string|max:20',
                'next_of_kin_relationship' => 'nullable|string|max:100',
                'emergency_contact_name' => 'nullable|string|max:255',
                'emergency_contact_phone' => 'nullable|string|max:20',
                'blood_group' => 'nullable|string|max:10',
                'genotype' => 'nullable|string|max:10'
            ]);

            StaffPersonalInfo::updateOrCreate(
                ['staff_id' => $staffId],
                $validatedData
            );

            return response()->json([
                'success' => true,
                'message' => 'Staff personal information updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating staff personal info: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating personal information'
            ], 500);
        }
    }

    /**
     * Update staff banking information
     */
    public function updateStaffBanking(Request $request, $staffId): JsonResponse
    {
        try {
            $staff = Staff::find($staffId);
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff member not found'
                ], 404);
            }

            $validatedData = $request->validate([
                'bank_name' => 'nullable|string|max:255',
                'account_number' => 'nullable|string|max:20',
                'account_name' => 'nullable|string|max:255',
                'bvn' => 'nullable|string|max:11',
                'sort_code' => 'nullable|string|max:10'
            ]);

            StaffBanking::updateOrCreate(
                ['staff_id' => $staffId],
                $validatedData
            );

            return response()->json([
                'success' => true,
                'message' => 'Staff banking information updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating staff banking info: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating banking information'
            ], 500);
        }
    }

    /**
     * Update staff education records
     */
    public function updateStaffEducation(Request $request, $staffId): JsonResponse
    {
        try {
            $staff = Staff::find($staffId);
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff member not found'
                ], 404);
            }

            $education = $request->validate([
                'education' => 'required|array',
                'education.*.id' => 'nullable|integer',
                'education.*.institution' => 'required|string|max:255',
                'education.*.qualification' => 'required|string|max:255',
                'education.*.field_of_study' => 'nullable|string|max:255',
                'education.*.start_year' => 'nullable|integer|min:1950|max:' . date('Y'),
                'education.*.end_year' => 'nullable|integer|min:1950|max:' . (date('Y') + 10),
                'education.*.grade' => 'nullable|string|max:50'
            ]);

            DB::transaction(function () use ($staffId, $education) {
                // Delete existing education records
                StaffEducation::where('staff_id', $staffId)->delete();

                // Add new education records
                foreach ($education['education'] as $edu) {
                    unset($edu['id']); // Remove id to prevent conflicts
                    StaffEducation::create(array_merge($edu, ['staff_id' => $staffId]));
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Staff education updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating staff education: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating education information'
            ], 500);
        }
    }

    /**
     * Update staff experience records
     */
    public function updateStaffExperience(Request $request, $staffId): JsonResponse
    {
        try {
            $staff = Staff::find($staffId);
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff member not found'
                ], 404);
            }

            $experience = $request->validate([
                'experience' => 'required|array',
                'experience.*.id' => 'nullable|integer',
                'experience.*.company_name' => 'required|string|max:255',
                'experience.*.position' => 'required|string|max:255',
                'experience.*.start_date' => 'nullable|date',
                'experience.*.end_date' => 'nullable|date',
                'experience.*.is_current' => 'boolean',
                'experience.*.job_description' => 'nullable|string',
                'experience.*.salary' => 'nullable|numeric|min:0',
                'experience.*.reason_for_leaving' => 'nullable|string'
            ]);

            DB::transaction(function () use ($staffId, $experience) {
                // Delete existing experience records
                StaffExperience::where('staff_id', $staffId)->delete();

                // Add new experience records
                foreach ($experience['experience'] as $exp) {
                    unset($exp['id']); // Remove id to prevent conflicts
                    StaffExperience::create(array_merge($exp, ['staff_id' => $staffId]));
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Staff experience updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating staff experience: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating experience information'
            ], 500);
        }
    }

    /**
     * Update staff emergency contacts
     */
    public function updateStaffEmergencyContacts(Request $request, $staffId): JsonResponse
    {
        try {
            $staff = Staff::find($staffId);
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff member not found'
                ], 404);
            }

            $contacts = $request->validate([
                'contacts' => 'required|array',
                'contacts.*.id' => 'nullable|integer',
                'contacts.*.name' => 'required|string|max:255',
                'contacts.*.phone' => 'required|string|max:20',
                'contacts.*.relationship' => 'required|string|max:100',
                'contacts.*.address' => 'nullable|string',
                'contacts.*.is_primary' => 'boolean'
            ]);

            DB::transaction(function () use ($staffId, $contacts) {
                // Delete existing emergency contacts
                StaffEmergencyContact::where('staff_id', $staffId)->delete();

                // Add new emergency contacts
                foreach ($contacts['contacts'] as $contact) {
                    unset($contact['id']); // Remove id to prevent conflicts
                    StaffEmergencyContact::create(array_merge($contact, ['staff_id' => $staffId]));
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Emergency contacts updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating emergency contacts: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating emergency contacts'
            ], 500);
        }
    }

    /**
     * Update staff guarantors
     */
    public function updateStaffGuarantors(Request $request, $staffId): JsonResponse
    {
        try {
            $staff = Staff::find($staffId);
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff member not found'
                ], 404);
            }

            $guarantors = $request->validate([
                'guarantors' => 'required|array',
                'guarantors.*.id' => 'nullable|integer',
                'guarantors.*.name' => 'required|string|max:255',
                'guarantors.*.phone' => 'required|string|max:20',
                'guarantors.*.email' => 'nullable|email|max:255',
                'guarantors.*.address' => 'nullable|string',
                'guarantors.*.occupation' => 'nullable|string|max:255',
                'guarantors.*.relationship' => 'nullable|string|max:100'
            ]);

            DB::transaction(function () use ($staffId, $guarantors) {
                // Delete existing guarantors
                StaffGuarantor::where('staff_id', $staffId)->delete();

                // Add new guarantors
                foreach ($guarantors['guarantors'] as $guarantor) {
                    unset($guarantor['id']); // Remove id to prevent conflicts
                    StaffGuarantor::create(array_merge($guarantor, ['staff_id' => $staffId]));
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Guarantors updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating guarantors: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating guarantors'
            ], 500);
        }
    }

    /**
     * Update staff legal IDs
     */
    public function updateStaffLegalIds(Request $request, $staffId): JsonResponse
    {
        try {
            $staff = Staff::find($staffId);
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff member not found'
                ], 404);
            }

            $validatedData = $request->validate([
                'nin' => 'nullable|string|max:11',
                'drivers_license' => 'nullable|string|max:20',
                'international_passport' => 'nullable|string|max:20',
                'voters_card' => 'nullable|string|max:20',
                'other_id_type' => 'nullable|string|max:100',
                'other_id_number' => 'nullable|string|max:50'
            ]);

            StaffLegalId::updateOrCreate(
                ['staff_id' => $staffId],
                $validatedData
            );

            return response()->json([
                'success' => true,
                'message' => 'Legal IDs updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating legal IDs: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating legal IDs'
            ], 500);
        }
    }

    /**
     * Update staff references
     */
    public function updateStaffReferences(Request $request, $staffId): JsonResponse
    {
        try {
            $staff = Staff::find($staffId);
            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff member not found'
                ], 404);
            }

            $references = $request->validate([
                'references' => 'required|array',
                'references.*.id' => 'nullable|integer',
                'references.*.name' => 'required|string|max:255',
                'references.*.phone' => 'required|string|max:20',
                'references.*.email' => 'nullable|email|max:255',
                'references.*.company' => 'nullable|string|max:255',
                'references.*.position' => 'nullable|string|max:255',
                'references.*.relationship' => 'nullable|string|max:100'
            ]);

            DB::transaction(function () use ($staffId, $references) {
                // Delete existing references
                StaffReference::where('staff_id', $staffId)->delete();

                // Add new references
                foreach ($references['references'] as $reference) {
                    unset($reference['id']); // Remove id to prevent conflicts
                    StaffReference::create(array_merge($reference, ['staff_id' => $staffId]));
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'References updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating references: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating references'
            ], 500);
        }
    }

    /**
     * Get staff statistics for dashboard
     */
    public function getStaffStatistics(Request $request): JsonResponse
    {
        try {
            $clientId = $request->get('client_id');
            $locationId = $request->get('service_location_id');

            $query = Staff::query();

            if ($clientId) {
                $query->where('client_id', $clientId);
            }

            if ($locationId) {
                $query->where('service_location_id', $locationId);
            }

            $statistics = [
                'total_staff' => $query->count(),
                'active_staff' => (clone $query)->where('status', 'active')->count(),
                'inactive_staff' => (clone $query)->where('status', 'inactive')->count(),
                'suspended_staff' => (clone $query)->where('status', 'suspended')->count(),
                'terminated_staff' => (clone $query)->where('status', 'terminated')->count(),
                'recent_hires' => (clone $query)
                    ->where('entry_date', '>=', now()->subDays(30))
                    ->count(),
                'department_breakdown' => (clone $query)
                    ->selectRaw('department, COUNT(*) as count')
                    ->whereNotNull('department')
                    ->groupBy('department')
                    ->get(),
            ];

            return response()->json([
                'success' => true,
                'data' => $statistics
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching staff statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching statistics'
            ], 500);
        }
    }
}
