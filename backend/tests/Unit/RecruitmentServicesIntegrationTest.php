<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\RecruitmentHierarchyService;
use App\Services\StaffBoardingService;

/**
 * Integration tests for Recruitment services
 * These tests verify services instantiate and core methods exist
 */
class RecruitmentServicesIntegrationTest extends TestCase
{
    /** @test */
    public function recruitment_hierarchy_service_instantiates()
    {
        $service = new RecruitmentHierarchyService();
        $this->assertInstanceOf(RecruitmentHierarchyService::class, $service);
    }

    /** @test */
    public function recruitment_hierarchy_service_has_all_methods()
    {
        $service = new RecruitmentHierarchyService();

        // Permission checkers
        $this->assertTrue(method_exists($service, 'canCreateRequest'));
        $this->assertTrue(method_exists($service, 'canApproveRequest'));
        $this->assertTrue(method_exists($service, 'canAssignTicket'));
        $this->assertTrue(method_exists($service, 'canBoardWithoutApproval'));
        $this->assertTrue(method_exists($service, 'canApproveBoarding'));

        // Hierarchy methods
        $this->assertTrue(method_exists($service, 'getUserHierarchyLevel'));
        $this->assertTrue(method_exists($service, 'hasHigherAuthority'));

        // Cache management
        $this->assertTrue(method_exists($service, 'getUserPermissions'));
        $this->assertTrue(method_exists($service, 'clearUserCache'));
        $this->assertTrue(method_exists($service, 'clearRoleCache'));

        // Admin functions
        $this->assertTrue(method_exists($service, 'updateRolePermissions'));
        $this->assertTrue(method_exists($service, 'getAllHierarchyPermissions'));

        // Assignment
        $this->assertTrue(method_exists($service, 'getAssignableUsers'));

        // Helpers
        $this->assertTrue(method_exists($service, 'canPerformAction'));
        $this->assertTrue(method_exists($service, 'getUserPermissionSummary'));
    }

    /** @test */
    public function staff_boarding_service_instantiates()
    {
        $service = new StaffBoardingService();
        $this->assertInstanceOf(StaffBoardingService::class, $service);
    }

    /** @test */
    public function staff_boarding_service_has_all_public_methods()
    {
        $service = new StaffBoardingService();

        $this->assertTrue(method_exists($service, 'boardStaff'));
        $this->assertTrue(method_exists($service, 'approveBoarding'));
        $this->assertTrue(method_exists($service, 'rejectBoarding'));
        $this->assertTrue(method_exists($service, 'getPendingStaffForUser'));
    }

    /** @test */
    public function staff_boarding_service_has_all_private_methods()
    {
        $service = new StaffBoardingService();
        $reflection = new \ReflectionClass($service);

        $privateMethods = [];
        foreach ($reflection->getMethods(\ReflectionMethod::IS_PRIVATE) as $method) {
            $privateMethods[] = $method->getName();
        }

        $this->assertContains('sendOffer', $privateMethods);
        $this->assertContains('completeAutoApproval', $privateMethods);
        $this->assertContains('determineApprovalStatus', $privateMethods);
        $this->assertContains('canApproveStaff', $privateMethods);
    }

    /** @test */
    public function recruitment_hierarchy_service_returns_all_permissions()
    {
        $service = new RecruitmentHierarchyService();
        $permissions = $service->getAllHierarchyPermissions();

        $this->assertNotNull($permissions);
        $this->assertIsObject($permissions);
    }

    /** @test */
    public function user_permission_summary_returns_array()
    {
        $service = new RecruitmentHierarchyService();
        $user = \App\Models\User::first();

        if (!$user) {
            $this->markTestSkipped('No users found in database');
        }

        $summary = $service->getUserPermissionSummary($user);

        $this->assertIsArray($summary);
        $this->assertArrayHasKey('can_create_request', $summary);
        $this->assertArrayHasKey('can_approve_request', $summary);
        $this->assertArrayHasKey('can_assign_ticket', $summary);
        $this->assertArrayHasKey('can_board_without_approval', $summary);
        $this->assertArrayHasKey('can_approve_boarding', $summary);
        $this->assertArrayHasKey('hierarchy_level', $summary);
    }
}
