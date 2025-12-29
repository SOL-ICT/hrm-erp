<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\Approval\ApprovalService;
use App\Services\Approval\ApprovalRulesService;
use App\Services\Approval\ApprovalNotificationService;
use App\Models\User;
use App\Models\Approval;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalWorkflowLevel;
use App\Models\ApprovalHistory;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ApprovalServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ApprovalService $approvalService;
    protected User $requester;
    protected User $approver;
    protected ApprovalWorkflow $workflow;

    protected function setUp(): void
    {
        parent::setUp();

        $this->requester = User::factory()->create();
        $this->approver = User::factory()->create();

        $this->workflow = ApprovalWorkflow::factory()->create([
            'workflow_code' => 'TEST_WORKFLOW',
            'total_levels' => 2,
            'is_active' => true,
        ]);

        ApprovalWorkflowLevel::factory()->create([
            'workflow_id' => $this->workflow->id,
            'level_number' => 1,
            'sla_hours' => 24,
        ]);

        ApprovalWorkflowLevel::factory()->create([
            'workflow_id' => $this->workflow->id,
            'level_number' => 2,
            'sla_hours' => 48,
        ]);

        $rulesService = app(ApprovalRulesService::class);
        $notificationService = app(ApprovalNotificationService::class);
        $this->approvalService = new ApprovalService($rulesService, $notificationService);
    }

    /** @test */
    public function it_can_create_approval_with_workflow()
    {
        $approvable = Staff::factory()->create();

        $approval = $this->approvalService->createApproval(
            $approvable,
            'staff_boarding',
            $this->requester->id,
            ['test' => 'data']
        );

        $this->assertInstanceOf(Approval::class, $approval);
        $this->assertEquals('staff_boarding', $approval->approval_type);
        $this->assertEquals($this->requester->id, $approval->requested_by);
        $this->assertEquals('pending', $approval->status);
        $this->assertNotNull($approval->due_date);
    }

    /** @test */
    public function it_submits_approval_for_processing()
    {
        $approval = Approval::factory()->create([
            'status' => 'pending',
            'current_approver_id' => null,
            'workflow_id' => $this->workflow->id,
        ]);

        $result = $this->approvalService->submitForApproval(
            $approval,
            $this->approver->id,
            ['note' => 'test']
        );

        $this->assertTrue($result);
        $approval->refresh();
        $this->assertEquals($this->approver->id, $approval->current_approver_id);

        // Check history was logged
        $this->assertDatabaseHas('approval_history', [
            'approval_id' => $approval->id,
            'action' => 'submitted',
        ]);
    }

    /** @test */
    public function it_approves_single_level_workflow()
    {
        $workflow = ApprovalWorkflow::factory()->create(['total_levels' => 1]);
        
        $approval = Approval::factory()->create([
            'status' => 'pending',
            'current_approver_id' => $this->approver->id,
            'current_approval_level' => 1,
            'total_approval_levels' => 1,
            'workflow_id' => $workflow->id,
        ]);

        $result = $this->approvalService->approveRequest(
            $approval,
            $this->approver->id,
            'Looks good'
        );

        $this->assertInstanceOf(Approval::class, $result);
        $approval->refresh();
        $this->assertEquals('approved', $approval->status);
        $this->assertEquals($this->approver->id, $approval->completed_by);
        $this->assertNotNull($approval->completed_at);

        // Check history
        $this->assertDatabaseHas('approval_history', [
            'approval_id' => $approval->id,
            'action' => 'approved',
            'action_by' => $this->approver->id,
        ]);
    }

    /** @test */
    public function it_advances_multi_level_workflow()
    {
        $approval = Approval::factory()->create([
            'status' => 'pending',
            'current_approver_id' => $this->approver->id,
            'current_approval_level' => 1,
            'total_approval_levels' => 2,
            'workflow_id' => $this->workflow->id,
        ]);

        $result = $this->approvalService->approveRequest(
            $approval,
            $this->approver->id,
            'Level 1 approved'
        );

        $approval->refresh();
        $this->assertEquals('pending', $approval->status); // Still pending for level 2
        $this->assertEquals(2, $approval->current_approval_level);

        // Check level completion history
        $this->assertDatabaseHas('approval_history', [
            'approval_id' => $approval->id,
            'action' => 'level_completed',
            'approval_level' => 1,
        ]);
    }

    /** @test */
    public function it_rejects_approval_with_reason()
    {
        $approval = Approval::factory()->create([
            'status' => 'pending',
            'current_approver_id' => $this->approver->id,
        ]);

        $result = $this->approvalService->rejectRequest(
            $approval,
            $this->approver->id,
            'Insufficient documentation',
            'Please provide more details'
        );

        $this->assertInstanceOf(Approval::class, $result);
        $approval->refresh();
        $this->assertEquals('rejected', $approval->status);

        // Check history
        $history = ApprovalHistory::where('approval_id', $approval->id)
            ->where('action', 'rejected')
            ->first();

        $this->assertNotNull($history);
        $this->assertEquals('Insufficient documentation', $history->rejection_reason);
        $this->assertEquals('Please provide more details', $history->comments);
    }

    /** @test */
    public function unauthorized_user_cannot_approve()
    {
        $approval = Approval::factory()->create([
            'status' => 'pending',
            'current_approver_id' => $this->approver->id,
        ]);

        $unauthorizedUser = User::factory()->create();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('You are not authorized to approve this request');

        $this->approvalService->approveRequest(
            $approval,
            $unauthorizedUser->id,
            'Trying to approve'
        );
    }

    /** @test */
    public function unauthorized_user_cannot_reject()
    {
        $approval = Approval::factory()->create([
            'status' => 'pending',
            'current_approver_id' => $this->approver->id,
        ]);

        $unauthorizedUser = User::factory()->create();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('You are not authorized to reject this request');

        $this->approvalService->rejectRequest(
            $approval,
            $unauthorizedUser->id,
            'Trying to reject'
        );
    }

    /** @test */
    public function it_retrieves_approval_history()
    {
        $approval = Approval::factory()->create();

        // Create some history
        ApprovalHistory::factory()->create([
            'approval_id' => $approval->id,
            'action' => 'submitted',
        ]);

        ApprovalHistory::factory()->create([
            'approval_id' => $approval->id,
            'action' => 'approved',
        ]);

        $history = $this->approvalService->getApprovalHistory($approval->id);

        $this->assertCount(2, $history);
        $this->assertEquals('submitted', $history[0]->action);
        $this->assertEquals('approved', $history[1]->action);
    }

    /** @test */
    public function it_calculates_correct_due_date_from_sla()
    {
        $approval = Approval::factory()->create([
            'workflow_id' => $this->workflow->id,
            'current_approval_level' => 1,
            'requested_at' => now(),
        ]);

        // Level 1 has 24 hours SLA
        $level = $this->workflow->levels()->where('level_number', 1)->first();
        $expectedDueDate = now()->addHours($level->sla_hours);

        $this->assertTrue(
            $approval->due_date->diffInMinutes($expectedDueDate) < 1
        );
    }

    /** @test */
    public function it_logs_history_with_ip_and_user_agent()
    {
        $approval = Approval::factory()->create();

        $this->approvalService->logHistory(
            $approval,
            'commented',
            $this->requester->id,
            'pending',
            'pending',
            'Test comment'
        );

        $history = ApprovalHistory::where('approval_id', $approval->id)->first();

        $this->assertNotNull($history);
        $this->assertNotNull($history->ip_address);
        $this->assertNotNull($history->user_agent);
        $this->assertEquals('Test comment', $history->comments);
    }

    /** @test */
    public function it_checks_if_workflow_is_complete()
    {
        $approval = Approval::factory()->create([
            'current_approval_level' => 2,
            'total_approval_levels' => 2,
        ]);

        $reflection = new \ReflectionClass($this->approvalService);
        $method = $reflection->getMethod('isWorkflowComplete');
        $method->setAccessible(true);

        $isComplete = $method->invoke($this->approvalService, $approval);

        $this->assertTrue($isComplete);
    }

    /** @test */
    public function it_detects_incomplete_workflow()
    {
        $approval = Approval::factory()->create([
            'current_approval_level' => 1,
            'total_approval_levels' => 2,
        ]);

        $reflection = new \ReflectionClass($this->approvalService);
        $method = $reflection->getMethod('isWorkflowComplete');
        $method->setAccessible(true);

        $isComplete = $method->invoke($this->approvalService, $approval);

        $this->assertFalse($isComplete);
    }

    /** @test */
    public function it_can_check_user_approval_authorization()
    {
        $approval = Approval::factory()->create([
            'current_approver_id' => $this->approver->id,
        ]);

        $reflection = new \ReflectionClass($this->approvalService);
        $method = $reflection->getMethod('canApprove');
        $method->setAccessible(true);

        // Approver should be authorized
        $canApprove = $method->invoke($this->approvalService, $approval, $this->approver->id);
        $this->assertTrue($canApprove);

        // Other user should not be authorized
        $otherUser = User::factory()->create();
        $canApprove = $method->invoke($this->approvalService, $approval, $otherUser->id);
        $this->assertFalse($canApprove);
    }
}
