<?php

namespace App\Http\Controllers\EmployeeManagement;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\JobStructure;
use App\Models\PayGradeStructure;
use App\Models\Staff;
use App\Models\ServiceLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HelperController extends Controller
{
    /**
     * Get all clients for dropdown.
     */
    public function getClients()
    {
        $clients = Client::select('id', 'organisation_name', 'prefix', 'status')
            ->where('status', 'active')
            ->orderBy('organisation_name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $clients
        ]);
    }

    /**
     * Get job structures (job families) for a specific client.
     */
    public function getJobStructures(Request $request)
    {
        $query = JobStructure::select('id', 'client_id', 'job_code', 'job_title', 'description', 'is_active');

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        $query->where('is_active', 1);

        $jobStructures = $query->orderBy('job_title')->get();

        return response()->json([
            'success' => true,
            'data' => $jobStructures
        ]);
    }

    /**
     * Get pay grades for a specific job structure.
     */
    public function getPayGrades(Request $request)
    {
        $query = PayGradeStructure::select('id', 'job_structure_id', 'grade_name', 'grade_code', 'emoluments', 'total_compensation', 'is_active');

        if ($request->filled('job_structure_id')) {
            $query->where('job_structure_id', $request->job_structure_id);
        }

        if ($request->filled('client_id')) {
            $query->whereHas('jobStructure', function ($q) use ($request) {
                $q->where('client_id', $request->client_id);
            });
        }

        $query->where('is_active', 1);

        $payGrades = $query->orderBy('grade_name')->get();

        return response()->json([
            'success' => true,
            'data' => $payGrades
        ]);
    }

    /**
     * Get staff list with filters.
     */
    public function getStaff(Request $request)
    {
        $query = Staff::select(
            'id',
            'staff_id',
            'first_name',
            'last_name',
            'client_id',
            'pay_grade_structure_id',
            'department',
            'job_title',
            'service_location_id',
            'status'
        );

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->filled('job_structure_id')) {
            $query->whereHas('payGradeStructure', function ($q) use ($request) {
                $q->where('job_structure_id', $request->job_structure_id);
            });
        }

        if ($request->filled('pay_grade_structure_id')) {
            $query->where('pay_grade_structure_id', $request->pay_grade_structure_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        } else {
            // Default to active staff only
            $query->where('status', 'active');
        }

        $staff = $query->with(['client', 'payGradeStructure', 'serviceLocation'])
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $staff
        ]);
    }

    /**
     * Get distinct departments from staff table (for a client).
     */
    public function getDepartments(Request $request)
    {
        $query = Staff::select('department')
            ->distinct()
            ->whereNotNull('department');

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        $departments = $query->orderBy('department')->pluck('department');

        return response()->json([
            'success' => true,
            'data' => $departments
        ]);
    }

    /**
     * Get distinct designations (job titles) from staff table (for a client).
     */
    public function getDesignations(Request $request)
    {
        $query = Staff::select('job_title')
            ->distinct()
            ->whereNotNull('job_title');

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        $designations = $query->orderBy('job_title')->pluck('job_title');

        return response()->json([
            'success' => true,
            'data' => $designations
        ]);
    }

    /**
     * Get service locations (optionally filtered by client).
     */
    public function getServiceLocations(Request $request)
    {
        $query = ServiceLocation::select('id', 'location_name', 'location_code', 'address');

        if ($request->filled('client_id')) {
            // Assuming service_locations might have client_id, otherwise return all
            if (in_array('client_id', (new ServiceLocation())->getFillable())) {
                $query->where('client_id', $request->client_id);
            }
        }

        $locations = $query->orderBy('location_name')->get();

        return response()->json([
            'success' => true,
            'data' => $locations
        ]);
    }

    /**
     * Get termination types enum values.
     */
    public function getTerminationTypes()
    {
        return response()->json([
            'success' => true,
            'data' => ['terminated', 'death', 'resignation']
        ]);
    }

    /**
     * Get redeployment types enum values.
     */
    public function getRedeploymentTypes()
    {
        return response()->json([
            'success' => true,
            'data' => ['department', 'service_location', 'client']
        ]);
    }

    /**
     * Get warning levels enum values.
     */
    public function getWarningLevels()
    {
        return response()->json([
            'success' => true,
            'data' => ['first', 'second', 'final']
        ]);
    }
}
