<?php

namespace Tests\Feature\Api;

use Tests\TestCase;
use App\Models\User;
use App\Models\Approval;
use App\Models\ApprovalWorkflow;
use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Laravel\Sanctum\Sanctum;

class ApprovalControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $requester;
    protected User $approver;
    protected User $otherUser;
    protected ApprovalWorkflow $workflow;
    protected Approval $approval;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test users
        $this->requester = User::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Requester',
            'email' => 'requester@test.com',
        ]);

        $this->approver = User::factory()->create([
            'first_name' => 'Jane',
            'last_name' => 'Approver',
            'email' => 'approver@test.com',
        ]);

        $this->otherUser = User::factory()->create([
            'first_name' => 'Bob',
            'last_name' => 'Other',
            'email' => 'other@test.com',
        ]);

        // Create test workflow
        $this->workflow = ApprovalWorkflow::factory()->create([
            'workflow_name' => 'Test Workflow',
            'workflow_code' => 'TEST_WORKFLOW',
            'module_name' => 'recruitment',
            'approval_type' => 'test_approval',
            'workflow_type' => 'sequential',
            'total_levels' => 1,
            'is_active' => true,
        ]);

        // Create test approval
        $this->approval = Approval::factory()->create([
            'approvable_type' => Staff::class,
            'approvable_id' => 1,
            'approval_type' => 'test_approval',
            'module_name' => 'recruitment',
            'requested_by' => $this->requester->id,
            'current_approver_id' => $this->approver->id,
            'current_approval_level' => 1,
            'total_approval_levels' => 1,
            'status' => 'pending',
            'workflow_id' => $this->workflow->id,
            'priority' => 'medium',
            'due_date' => now()->addDays(3),
        ]);
    }

    /** @test */
    public function unauthenticated_users_cannot_access_approvals()
    {
        $response = $this->getJson('/api/admin/approvals');
        $response->assertStatus(401);
    }

    /** @test */
    public function authenticated_user_can_get_all_approvals()
    {
        Sanctum::actingAs($this->requester);

        $response = $this->getJson('/api/admin/approvals');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => [
                            'id',
                            'status',
                            'approval_type',
                            'module_name',
                            'priority',
                        ]
                    ]
                ]
            ]);
    }

    /** @test */
    public function user_can_filter_approvals_by_module()
    {
        Sanctum::actingAs($this->requester);

        $response = $this->getJson('/api/admin/approvals?module_name=recruitment');

        $response->assertStatus(200);
        $data = $response->json('data.data');
        $this->assertTrue(count($data) > 0);
        $this->assertEquals('recruitment', $data[0]['module_name']);
    }

    /** @test */
    public function user_can_filter_approvals_by_status()
    {
        Sanctum::actingAs($this->requester);

        $response = $this->getJson('/api/admin/approvals?status=pending');

        $response->assertStatus(200);
        $data = $response->json('data.data');
        $this->assertTrue(count($data) > 0);
        $this->assertEquals('pending', $data[0]['status']);
    }

    /** @test */
    public function approver_can_get_pending_approvals()
    {
        Sanctum::actingAs($this->approver);

        $response = $this->getJson('/api/admin/approvals/pending');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => [
                            'id',
                            'status',
                            'current_approver_id',
                        ]
                    ]
                ],
                'summary' => [
                    'total_pending',
                    'overdue_count',
                    'high_priority_count',
                ]
            ]);

        $data = $response->json('data.data');
        $this->assertTrue(count($data) > 0);
        $this->assertEquals($this->approver->id, $data[0]['current_approver_id']);
    }

    /** @test */
    public function requester_can_get_submitted_approvals()
    {
        Sanctum::actingAs($this->requester);

        $response = $this->getJson('/api/admin/approvals/submitted');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => [
                            'id',
                            'status',
                            'requested_by',
                        ]
                    ]
                ],
                'summary' => [
                    'total_submitted',
                    'pending_count',
                    'approved_count',
                    'rejected_count',
                ]
            ]);

        $data = $response->json('data.data');
        $this->assertTrue(count($data) > 0);
        $this->assertEquals($this->requester->id, $data[0]['requested_by']);
    }

    /** @test */
    public function user_can_get_single_approval_details()
    {
        Sanctum::actingAs($this->requester);

        $response = $this->getJson("/api/admin/approvals/{$this->approval->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'status',
                    'approval_type',
                    'module_name',
                    'requester',
                    'current_approver',
                    'workflow',
                ]
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $this->approval->id,
                    'status' => 'pending',
                ]
            ]);
    }

    /** @test */
    public function user_can_get_approval_history()
    {
        Sanctum::actingAs($this->requester);

        $response = $this->getJson("/api/admin/approvals/{$this->approval->id}/history");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data'
            ]);
    }

    /** @test */
    public function approver_can_approve_request()
    {
        Sanctum::actingAs($this->approver);

        $response = $this->postJson("/api/admin/approvals/{$this->approval->id}/approve", [
            'comments' => 'Approved - looks good'
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Approval processed successfully'
            ]);

        $this->approval->refresh();
        $this->assertEquals('approved', $this->approval->status);
    }

    /** @test */
    public function non_approver_cannot_approve_request()
    {
        Sanctum::actingAs($this->otherUser);

        $response = $this->postJson("/api/admin/approvals/{$this->approval->id}/approve", [
            'comments' => 'Trying to approve'
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function approver_can_reject_request()
    {
        Sanctum::actingAs($this->approver);

        $response = $this->postJson("/api/admin/approvals/{$this->approval->id}/reject", [
            'rejection_reason' => 'Insufficient documentation',
            'comments' => 'Please provide more details'
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Request rejected successfully'
            ]);

        $this->approval->refresh();
        $this->assertEquals('rejected', $this->approval->status);
    }

    /** @test */
    public function rejection_requires_reason()
    {
        Sanctum::actingAs($this->approver);

        $response = $this->postJson("/api/admin/approvals/{$this->approval->id}/reject", [
            'comments' => 'No reason provided'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rejection_reason']);
    }

    /** @test */
    public function approver_can_add_comment()
    {
        Sanctum::actingAs($this->approver);

        $response = $this->postJson("/api/admin/approvals/{$this->approval->id}/comment", [
            'comment' => 'Need more information about this request'
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Comment added successfully'
            ]);
    }

    /** @test */
    public function requester_can_add_comment()
    {
        Sanctum::actingAs($this->requester);

        $response = $this->postJson("/api/admin/approvals/{$this->approval->id}/comment", [
            'comment' => 'Here is additional information'
        ]);

        $response->assertStatus(200);
    }

    /** @test */
    public function comment_is_required()
    {
        Sanctum::actingAs($this->approver);

        $response = $this->postJson("/api/admin/approvals/{$this->approval->id}/comment", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['comment']);
    }

    /** @test */
    public function approver_can_escalate_approval()
    {
        $escalationTarget = User::factory()->create();
        Sanctum::actingAs($this->approver);

        $response = $this->postJson("/api/admin/approvals/{$this->approval->id}/escalate", [
            'escalate_to' => $escalationTarget->id,
            'reason' => 'Requires higher authority decision'
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Approval escalated successfully'
            ]);

        $this->approval->refresh();
        $this->assertEquals('escalated', $this->approval->status);
        $this->assertEquals($escalationTarget->id, $this->approval->current_approver_id);
    }

    /** @test */
    public function non_approver_cannot_escalate()
    {
        $escalationTarget = User::factory()->create();
        Sanctum::actingAs($this->otherUser);

        $response = $this->postJson("/api/admin/approvals/{$this->approval->id}/escalate", [
            'escalate_to' => $escalationTarget->id,
            'reason' => 'Trying to escalate'
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function requester_can_cancel_pending_approval()
    {
        Sanctum::actingAs($this->requester);

        $response = $this->deleteJson("/api/admin/approvals/{$this->approval->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Approval cancelled successfully'
            ]);

        $this->approval->refresh();
        $this->assertEquals('cancelled', $this->approval->status);
    }

    /** @test */
    public function non_requester_cannot_cancel_approval()
    {
        Sanctum::actingAs($this->otherUser);

        $response = $this->deleteJson("/api/admin/approvals/{$this->approval->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function cannot_cancel_already_approved_approval()
    {
        $this->approval->update(['status' => 'approved']);
        Sanctum::actingAs($this->requester);

        $response = $this->deleteJson("/api/admin/approvals/{$this->approval->id}");

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Only pending approvals can be cancelled'
            ]);
    }

    /** @test */
    public function user_can_get_approval_statistics()
    {
        Sanctum::actingAs($this->approver);

        $response = $this->getJson('/api/admin/approvals/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'pending_approvals',
                    'my_pending_submissions',
                    'overdue_approvals',
                    'high_priority_approvals',
                    'module_breakdown',
                    'recent_activity',
                ]
            ]);
    }

    /** @test */
    public function user_can_get_overdue_approvals()
    {
        // Create overdue approval
        $overdueApproval = Approval::factory()->create([
            'current_approver_id' => $this->approver->id,
            'status' => 'pending',
            'is_overdue' => true,
            'due_date' => now()->subDays(2),
        ]);

        Sanctum::actingAs($this->approver);

        $response = $this->getJson('/api/admin/approvals/overdue');

        $response->assertStatus(200);
        $data = $response->json('data.data');
        $this->assertTrue(count($data) > 0);
        $this->assertTrue($data[0]['is_overdue']);
    }

    /** @test */
    public function approval_comments_max_length_validation()
    {
        Sanctum::actingAs($this->approver);

        $longComment = str_repeat('a', 1001);

        $response = $this->postJson("/api/admin/approvals/{$this->approval->id}/approve", [
            'comments' => $longComment
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['comments']);
    }

    /** @test */
    public function escalation_requires_valid_user()
    {
        Sanctum::actingAs($this->approver);

        $response = $this->postJson("/api/admin/approvals/{$this->approval->id}/escalate", [
            'escalate_to' => 99999, // Non-existent user
            'reason' => 'Requires escalation'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['escalate_to']);
    }
}
