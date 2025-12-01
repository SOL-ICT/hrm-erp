<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Staff;
use App\Models\RecruitmentRequest;
use App\Models\RecruitmentHierarchy;
use App\Services\StaffBoardingService;
use App\Services\RecruitmentHierarchyService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class StaffBoardingServiceTest extends TestCase
{
    use RefreshDatabase;

    private StaffBoardingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new StaffBoardingService();
        $this->seedHierarchyData();
    }

    /**
     * Seed test hierarchy data
     */
    private function seedHierarchyData(): void
    {
        RecruitmentHierarchy::insert([
            ['role_id' => 17, 'can_create_request' => true, 'can_approve_request' => true, 'can_assign_ticket' => true, 'can_board_without_approval' => true, 'can_approve_boarding' => true, 'hierarchy_level' => 1],
            ['role_id' => 7, 'can_create_request' => true, 'can_approve_request' => false, 'can_assign_ticket' => true, 'can_board_without_approval' => true, 'can_approve_boarding' => false, 'hierarchy_level' => 2],
            ['role_id' => 3, 'can_create_request' => false, 'can_approve_request' => false, 'can_assign_ticket' => false, 'can_board_without_approval' => false, 'can_approve_boarding' => true, 'hierarchy_level' => 3],
            ['role_id' => 10, 'can_create_request' => false, 'can_approve_request' => false, 'can_assign_ticket' => false, 'can_board_without_approval' => false, 'can_approve_boarding' => false, 'hierarchy_level' => 5],
        ]);
    }

    /** @test */
    public function auto_approves_for_user_with_board_without_approval_permission()
    {
        $recruitmentUser = User::factory()->create(['role' => 7]); // can_board_without_approval = true
        $ticket = RecruitmentRequest::factory()->create([
            'created_by' => User::factory()->create()->id,
            'requires_approval' => true,
        ]);

        $staff = $this->service->boardStaff([
            'surname' => 'Test',
            'othername' => 'User',
            'email' => 'test@example.com',
            'client_id' => 1,
            'pay_grade' => 1,
            'offer_already_accepted' => false,
        ], $recruitmentUser, $ticket);

        // NEW: Auto-approved users now go to pending_control_approval
        $this->assertEquals('pending_control_approval', $staff->boarding_approval_status);
        $this->assertEquals('sent', $staff->offer_acceptance_status);
        $this->assertNotNull($staff->offer_sent_at);
        $this->assertNotNull($staff->offer_expires_at);
        $this->assertEquals('inactive', $staff->status); // Inactive until Control approves
    }

    /** @test */
    public function auto_approves_for_ticket_creator()
    {
        $creator = User::factory()->create(['role' => 10]); // No permissions
        $ticket = RecruitmentRequest::factory()->create([
            'created_by' => $creator->id,
            'requires_approval' => true,
        ]);

        $staff = $this->service->boardStaff([
            'surname' => 'Test',
            'othername' => 'User',
            'email' => 'test2@example.com',
            'client_id' => 1,
            'pay_grade' => 1,
            'offer_already_accepted' => false,
        ], $creator, $ticket);

        // NEW: Ticket creator auto-approves, goes to Control
        $this->assertEquals('pending_control_approval', $staff->boarding_approval_status);
    }

    /** @test */
    public function auto_approves_when_ticket_does_not_require_approval()
    {
        $user = User::factory()->create(['role' => 10]); // No permissions
        $ticket = RecruitmentRequest::factory()->create([
            'created_by' => User::factory()->create()->id,
            'requires_approval' => false,
        ]);

        $staff = $this->service->boardStaff([
            'surname' => 'Test',
            'othername' => 'User',
            'email' => 'test3@example.com',
            'client_id' => 1,
            'pay_grade' => 1,
            'offer_already_accepted' => false,
        ], $user, $ticket);

        // NEW: Goes to Control approval
        $this->assertEquals('pending_control_approval', $staff->boarding_approval_status);
    }

    /** @test */
    public function sets_pending_for_assigned_user_with_approval_required()
    {
        $assignedUser = User::factory()->create(['role' => 10]);
        $ticket = RecruitmentRequest::factory()->create([
            'created_by' => User::factory()->create()->id,
            'assigned_to' => $assignedUser->id,
            'requires_approval' => true,
        ]);

        $staff = $this->service->boardStaff([
            'surname' => 'Test',
            'othername' => 'User',
            'email' => 'test4@example.com',
            'client_id' => 1,
            'pay_grade' => 1,
            'offer_already_accepted' => false,
        ], $assignedUser, $ticket);

        $this->assertEquals('pending', $staff->boarding_approval_status);
        $this->assertEquals('pending', $staff->offer_acceptance_status);
        $this->assertNull($staff->offer_sent_at);
    }

    /** @test */
    public function sets_offer_accepted_but_still_needs_control_approval()
    {
        $recruitmentUser = User::factory()->create(['role' => 7]);
        $ticket = RecruitmentRequest::factory()->create([
            'created_by' => User::factory()->create()->id,
            'requires_approval' => true,
        ]);

        $staff = $this->service->boardStaff([
            'surname' => 'Test',
            'othername' => 'User',
            'email' => 'test5@example.com',
            'client_id' => 1,
            'pay_grade' => 1,
            'offer_already_accepted' => true,
        ], $recruitmentUser, $ticket);

        // NEW: Even with offer accepted, needs Control approval
        $this->assertEquals('pending_control_approval', $staff->boarding_approval_status);
        $this->assertEquals('accepted', $staff->offer_acceptance_status);
        $this->assertEquals('inactive', $staff->status); // Inactive until Control approves
        $this->assertNull($staff->offer_sent_at);
    }

    /** @test */
    public function approves_boarding_and_sends_offer_for_new_staff()
    {
        $creator = User::factory()->create(['role' => 7]);
        $approvingUser = User::factory()->create(['role' => 3]); // HR can approve

        $ticket = RecruitmentRequest::factory()->create([
            'created_by' => $creator->id,
            'staff_accepted_offer' => 0,
        ]);

        $staff = Staff::factory()->create([
            'recruitment_request_id' => $ticket->id,
            'boarding_approval_status' => 'pending',
            'offer_acceptance_status' => 'pending',
            'offer_already_accepted' => false,
            'status' => 'inactive',
        ]);

        $approved = $this->service->approveBoarding($staff, $approvingUser, 'Approved for boarding');

        $this->assertNotNull($approved);
        // NEW: Supervisor approval moves to Control approval stage
        $this->assertEquals('pending_control_approval', $approved->boarding_approval_status);
        $this->assertEquals('sent', $approved->offer_acceptance_status);
        $this->assertNotNull($approved->offer_sent_at);
        $this->assertNotNull($approved->offer_expires_at);
        $this->assertEquals('Approved for boarding', $approved->boarding_approval_notes);

        // Check ticket counter incremented
        $ticket->refresh();
        $this->assertEquals(1, $ticket->staff_accepted_offer);
    }

    /** @test */
    public function approves_boarding_sends_to_control_for_existing_staff()
    {
        $creator = User::factory()->create(['role' => 7]);
        $approvingUser = User::factory()->create(['role' => 3]);

        $ticket = RecruitmentRequest::factory()->create([
            'created_by' => $creator->id,
            'staff_accepted_offer' => 0,
        ]);

        $staff = Staff::factory()->create([
            'recruitment_request_id' => $ticket->id,
            'boarding_approval_status' => 'pending',
            'offer_acceptance_status' => 'pending',
            'offer_already_accepted' => true,
            'status' => 'inactive',
        ]);

        $approved = $this->service->approveBoarding($staff, $approvingUser);

        // NEW: Goes to Control, not active yet
        $this->assertEquals('pending_control_approval', $approved->boarding_approval_status);
        $this->assertEquals('accepted', $approved->offer_acceptance_status);
        $this->assertEquals('inactive', $approved->status); // Inactive until Control approves
        $this->assertNull($approved->offer_sent_at); // No offer sent for existing staff
    }

    /** @test */
    public function ticket_creator_can_approve_boarding()
    {
        $creator = User::factory()->create(['role' => 10]); // No permissions

        $ticket = RecruitmentRequest::factory()->create([
            'created_by' => $creator->id,
            'staff_accepted_offer' => 0,
        ]);

        $staff = Staff::factory()->create([
            'recruitment_request_id' => $ticket->id,
            'boarding_approval_status' => 'pending',
            'offer_already_accepted' => false,
        ]);

        $approved = $this->service->approveBoarding($staff, $creator);

        $this->assertNotNull($approved);
        // NEW: Ticket creator approval moves to Control
        $this->assertEquals('pending_control_approval', $approved->boarding_approval_status);
    }

    /** @test */
    public function rejects_boarding_with_reason()
    {
        $rejectingUser = User::factory()->create(['role' => 3]); // HR

        $ticket = RecruitmentRequest::factory()->create();

        $staff = Staff::factory()->create([
            'recruitment_request_id' => $ticket->id,
            'boarding_approval_status' => 'pending',
            'status' => 'inactive',
        ]);

        $rejected = $this->service->rejectBoarding($staff, $rejectingUser, 'Failed background check');

        $this->assertEquals('rejected', $rejected->boarding_approval_status);
        $this->assertEquals('Failed background check', $rejected->rejection_reason);
        $this->assertEquals('inactive', $rejected->status);
        $this->assertNotNull($rejected->boarding_approved_at);
    }

    /** @test */
    public function gets_pending_staff_for_ticket_creator()
    {
        $creator = User::factory()->create(['role' => 7]);

        $ticket1 = RecruitmentRequest::factory()->create(['created_by' => $creator->id]);
        $ticket2 = RecruitmentRequest::factory()->create(['created_by' => User::factory()->create()->id]);

        $staff1 = Staff::factory()->create([
            'recruitment_request_id' => $ticket1->id,
            'boarding_approval_status' => 'pending',
        ]);

        $staff2 = Staff::factory()->create([
            'recruitment_request_id' => $ticket2->id,
            'boarding_approval_status' => 'pending',
        ]);

        $pending = $this->service->getPendingStaffForUser($creator);

        $this->assertCount(1, $pending);
        $this->assertTrue($pending->contains($staff1));
        $this->assertFalse($pending->contains($staff2));
    }

    /** @test */
    public function gets_all_pending_staff_for_user_with_approve_permission()
    {
        $hrUser = User::factory()->create(['role' => 3]); // can_approve_boarding = true

        $ticket1 = RecruitmentRequest::factory()->create();
        $ticket2 = RecruitmentRequest::factory()->create();

        $staff1 = Staff::factory()->create([
            'recruitment_request_id' => $ticket1->id,
            'boarding_approval_status' => 'pending',
        ]);

        $staff2 = Staff::factory()->create([
            'recruitment_request_id' => $ticket2->id,
            'boarding_approval_status' => 'pending',
        ]);

        $staff3 = Staff::factory()->create([
            'recruitment_request_id' => $ticket1->id,
            'boarding_approval_status' => 'approved',
        ]);

        $pending = $this->service->getPendingStaffForUser($hrUser);

        $this->assertCount(2, $pending);
        $this->assertTrue($pending->contains($staff1));
        $this->assertTrue($pending->contains($staff2));
        $this->assertFalse($pending->contains($staff3));
    }

    /** @test */
    public function offer_expires_in_30_days()
    {
        $user = User::factory()->create(['role' => 7]);
        $ticket = RecruitmentRequest::factory()->create();

        $staff = $this->service->boardStaff([
            'surname' => 'Test',
            'othername' => 'User',
            'email' => 'test6@example.com',
            'client_id' => 1,
            'pay_grade' => 1,
            'offer_already_accepted' => false,
        ], $user, $ticket);

        $this->assertNotNull($staff->offer_sent_at);
        $this->assertNotNull($staff->offer_expires_at);

        $expectedExpiry = now()->addDays(30)->toDateString();
        $actualExpiry = $staff->offer_expires_at->toDateString();

        $this->assertEquals($expectedExpiry, $actualExpiry);
    }

    /** @test */
    public function control_approves_boarding_and_activates_staff()
    {
        $controlUser = User::factory()->create(['role' => 6]); // Control Department

        $ticket = RecruitmentRequest::factory()->create([
            'staff_accepted_offer' => 0,
        ]);

        // Staff is pending Control approval
        $staff = Staff::factory()->create([
            'recruitment_request_id' => $ticket->id,
            'boarding_approval_status' => 'pending_control_approval',
            'offer_acceptance_status' => 'accepted',
            'offer_already_accepted' => true,
            'status' => 'inactive',
        ]);

        $approved = $this->service->controlApprove($staff, $controlUser, 'Compliance approved');

        $this->assertEquals('control_approved', $approved->boarding_approval_status);
        $this->assertEquals('active', $approved->status);
        $this->assertEquals('Compliance approved', $approved->control_approval_notes);
        $this->assertEquals($controlUser->id, $approved->control_approved_by);
        $this->assertNotNull($approved->control_approved_at);

        // Check ticket counter incremented
        $ticket->refresh();
        $this->assertEquals(1, $ticket->staff_accepted_offer);
    }

    /** @test */
    public function control_rejects_boarding_keeps_inactive()
    {
        $controlUser = User::factory()->create(['role' => 6]);

        $ticket = RecruitmentRequest::factory()->create();

        $staff = Staff::factory()->create([
            'recruitment_request_id' => $ticket->id,
            'boarding_approval_status' => 'pending_control_approval',
            'status' => 'inactive',
        ]);

        $rejected = $this->service->controlReject($staff, $controlUser, 'Failed compliance review');

        $this->assertEquals('control_rejected', $rejected->boarding_approval_status);
        $this->assertEquals('Failed compliance review', $rejected->control_rejection_reason);
        $this->assertEquals($controlUser->id, $rejected->control_rejected_by);
        $this->assertNotNull($rejected->control_rejected_at);
        $this->assertEquals('inactive', $rejected->status);
    }

    /** @test */
    public function control_approval_increments_ticket_counter_for_new_staff()
    {
        $controlUser = User::factory()->create(['role' => 6]);

        $ticket = RecruitmentRequest::factory()->create([
            'staff_accepted_offer' => 2,
        ]);

        // New staff with offer sent
        $staff = Staff::factory()->create([
            'recruitment_request_id' => $ticket->id,
            'boarding_approval_status' => 'pending_control_approval',
            'offer_acceptance_status' => 'sent',
            'offer_already_accepted' => false,
            'status' => 'inactive',
        ]);

        $approved = $this->service->controlApprove($staff, $controlUser);

        // Counter should increment for new staff with sent offer
        $ticket->refresh();
        $this->assertEquals(3, $ticket->staff_accepted_offer);
    }
}
