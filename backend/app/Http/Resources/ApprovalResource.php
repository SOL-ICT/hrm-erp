<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApprovalResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'approvable_type' => $this->approvable_type,
            'approvable_id' => $this->approvable_id,
            'approval_type' => $this->approval_type,
            'module_name' => $this->module_name,
            
            // Status information
            'status' => $this->status,
            'priority' => $this->priority,
            'is_overdue' => $this->is_overdue,
            
            // Workflow information
            'current_approval_level' => $this->current_approval_level,
            'total_approval_levels' => $this->total_approval_levels,
            'workflow_progress' => [
                'current_level' => $this->current_approval_level,
                'total_levels' => $this->total_approval_levels,
                'percentage' => $this->total_approval_levels > 0 
                    ? round(($this->current_approval_level / $this->total_approval_levels) * 100) 
                    : 0,
            ],
            
            // Requester information
            'requester' => [
                'id' => $this->requester?->id,
                'name' => $this->requester ? $this->requester->first_name . ' ' . $this->requester->last_name : null,
                'email' => $this->requester?->email,
            ],
            
            // Current approver information
            'current_approver' => [
                'id' => $this->currentApprover?->id,
                'name' => $this->currentApprover ? $this->currentApprover->first_name . ' ' . $this->currentApprover->last_name : null,
                'email' => $this->currentApprover?->email,
            ],
            
            // Completed by (if applicable)
            'completed_by' => $this->when($this->completedBy, [
                'id' => $this->completedBy?->id,
                'name' => $this->completedBy ? $this->completedBy->first_name . ' ' . $this->completedBy->last_name : null,
                'email' => $this->completedBy?->email,
            ]),
            
            // Workflow details
            'workflow' => $this->when($this->workflow, [
                'id' => $this->workflow?->id,
                'name' => $this->workflow?->workflow_name,
                'code' => $this->workflow?->workflow_code,
                'type' => $this->workflow?->workflow_type,
                'total_levels' => $this->workflow?->total_levels,
            ]),
            
            // Timestamps
            'requested_at' => $this->requested_at?->toISOString(),
            'due_date' => $this->due_date?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            
            // Request data (if available)
            'request_data' => $this->when($this->request_data, $this->request_data),
            
            // Related entity (polymorphic)
            'approvable' => $this->when($this->approvable, $this->approvable),
            
            // Approval history (if loaded)
            'history' => $this->when($this->relationLoaded('history'), function () {
                return $this->history->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'action' => $item->action,
                        'action_by' => [
                            'id' => $item->actionBy?->id,
                            'name' => $item->actionBy ? $item->actionBy->first_name . ' ' . $item->actionBy->last_name : null,
                        ],
                        'action_at' => $item->action_at?->toISOString(),
                        'from_status' => $item->from_status,
                        'to_status' => $item->to_status,
                        'approval_level' => $item->approval_level,
                        'comments' => $item->comments,
                        'rejection_reason' => $item->rejection_reason,
                    ];
                });
            }),
            
            // Metadata
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
