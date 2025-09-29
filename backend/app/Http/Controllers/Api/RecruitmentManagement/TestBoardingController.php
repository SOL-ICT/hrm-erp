<?php

namespace App\Http\Controllers\Api\RecruitmentManagement;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class TestBoardingController extends Controller
{
    /**
     * Simple test method
     */
    public function test(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Test controller working!',
            'timestamp' => now()
        ]);
    }
}
