<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;


class CandidateEducationController extends Controller
{
    /**
     * Store a new primary education record (one per candidate).
     */
    public function storePrimary(Request $request, $candidate_id)
    {
        $validator = Validator::make($request->all(), [
            'primary_year' => 'required|integer|min:1950|max:' . (date('Y') + 10),
            'secondary_year' => 'required|integer|min:1950|max:' . (date('Y') + 10),
            'highest_level' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if primary education record already exists
            if (DB::table('candidate_primary_education')->where('candidate_id', $candidate_id)->exists()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Primary education record already exists for this candidate'
                ], 409);
            }

            $validated = $validator->validated();

            $educationId = DB::table('candidate_primary_education')->insertGetId(
                array_merge($validated, [
                    'candidate_id' => $candidate_id,
                    'created_at' => now(),
                    'updated_at' => now()
                ])
            );

            $education = DB::table('candidate_primary_education')->find($educationId);

            return response()->json([
                'status' => 'success',
                'message' => 'Primary education record created successfully',
                'education' => $education
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create primary education record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing primary education record.
     */
    public function updatePrimary(Request $request, $candidate_id)
    {
        $validator = Validator::make($request->all(), [
            'primary_year' => 'required|integer|min:1950|max:' . (date('Y') + 10),
            'secondary_year' => 'required|integer|min:1950|max:' . (date('Y') + 10),
            'highest_level' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $education = DB::table('candidate_primary_education')->where('candidate_id', $candidate_id)->first();
            if (!$education) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Primary education record not found'
                ], 404);
            }

            $validated = $validator->validated();

            DB::table('candidate_primary_education')
                ->where('candidate_id', $candidate_id)
                ->update(array_merge($validated, ['updated_at' => now()]));

            $updatedEducation = DB::table('candidate_primary_education')->where('candidate_id', $candidate_id)->first();

            return response()->json([
                'status' => 'success',
                'message' => 'Primary education record updated successfully',
                'education' => $updatedEducation
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update primary education record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a primary education record.
     */
    public function deletePrimary($candidate_id)
    {
        try {
            $education = DB::table('candidate_primary_education')->where('candidate_id', $candidate_id)->first();
            if (!$education) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Primary education record not found'
                ], 404);
            }

            DB::table('candidate_primary_education')->where('candidate_id', $candidate_id)->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Primary education record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete primary education record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new secondary education record.
     */
    public function storeSecondary(Request $request, $candidate_id)
    {
        $validator = Validator::make($request->all(), [
            'school_name' => 'required|string|max:255',
            'start_year' => 'required|integer|min:1950|max:' . (date('Y') + 10),
            'end_year' => 'nullable|integer|min:1950|max:' . (date('Y') + 10) . '|after_or_equal:start_year',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $validated = $validator->validated();

            $educationId = DB::table('candidate_secondary_education')->insertGetId(
                array_merge($validated, [
                    'candidate_id' => $candidate_id,
                    'created_at' => now(),
                    'updated_at' => now()
                ])
            );

            $education = DB::table('candidate_secondary_education')->find($educationId);

            return response()->json([
                'status' => 'success',
                'message' => 'Secondary education record created successfully',
                'education' => $education
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create secondary education record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing secondary education record.
     */
    public function updateSecondary(Request $request, $candidate_id, $id)

    {
        $validator = Validator::make($request->all(), [
            'school_name' => 'required|string|max:255',
            'start_year' => 'required|integer|min:1950|max:' . (date('Y') + 10),
            'end_year' => 'nullable|integer|min:1950|max:' . (date('Y') + 10) . '|after_or_equal:start_year',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $education = DB::table('candidate_secondary_education')->find($id);
            if (!$education) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Secondary education record not found'
                ], 404);
            }

            $validated = $validator->validated();

            DB::table('candidate_secondary_education')
                ->where('id', $id)
                ->update(array_merge($validated, ['updated_at' => now()]));

            $updatedEducation = DB::table('candidate_secondary_education')->find($id);

            return response()->json([
                'status' => 'success',
                'message' => 'Secondary education record updated successfully',
                'education' => $updatedEducation
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update secondary education record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a secondary education record.
     */
    public function deleteSecondary($candidate_id, $id)
    {
        try {
            $education = DB::table('candidate_secondary_education')->find($id);
            if (!$education) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Secondary education record not found'
                ], 404);
            }

            DB::table('candidate_secondary_education')->where('id', $id)->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Secondary education record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete secondary education record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new tertiary education record.
     */
    public function storeTertiary(Request $request, $candidate_id)
    {
        $validator = Validator::make($request->all(), [
            'institute_name' => 'required|string|max:255',
            'qualification_type' => 'required|string|max:255',
            'field_of_study' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $validated = $validator->validated();

            $educationId = DB::table('candidate_tertiary_education')->insertGetId(
                array_merge($validated, [
                    'candidate_id' => $candidate_id,
                    'created_at' => now(),
                    'updated_at' => now()
                ])
            );

            $education = DB::table('candidate_tertiary_education')->find($educationId);

            return response()->json([
                'status' => 'success',
                'message' => 'Tertiary education record created successfully',
                'education' => $education
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create tertiary education record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing tertiary education record.
     */
    public function updateTertiary(Request $request, $candidate_id, $id)
    {
        $validator = Validator::make($request->all(), [
            'institute_name' => 'required|string|max:255',
            'qualification_type' => 'required|string|max:255',
            'field_of_study' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $education = DB::table('candidate_tertiary_education')->find($id);
            if (!$education) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tertiary education record not found'
                ], 404);
            }

            $validated = $validator->validated();

            DB::table('candidate_tertiary_education')
                ->where('id', $id)
                ->update(array_merge($validated, ['updated_at' => now()]));

            $updatedEducation = DB::table('candidate_tertiary_education')->find($id);

            return response()->json([
                'status' => 'success',
                'message' => 'Tertiary education record updated successfully',
                'education' => $updatedEducation
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update tertiary education record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a tertiary education record.
     */
    public function deleteTertiary($candidate_id, $id)
    {
        try {
            $education = DB::table('candidate_tertiary_education')->find($id);
            if (!$education) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tertiary education record not found'
                ], 404);
            }

            DB::table('candidate_tertiary_education')->where('id', $id)->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Tertiary education record deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete tertiary education record: ' . $e->getMessage()
            ], 500);
        }
    }

    public function indexPrimary($candidate_id)
    {
        $primaryEducation = DB::table('candidate_primary_education')
            ->where('candidate_id', $candidate_id)
            ->first(); // Only one record expected

        return response()->json([
            'status' => 'success',
            'data' => $primaryEducation
        ]);
    }

    public function indexSecondary($candidate_id)
    {
        $secondaryEducation = DB::table('candidate_secondary_education')
            ->where('candidate_id', $candidate_id)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $secondaryEducation
        ]);
    }

    public function indexTertiary($candidate_id)
    {
        $tertiaryEducation = DB::table('candidate_tertiary_education')
            ->where('candidate_id', $candidate_id)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $tertiaryEducation
        ]);
    }
}

