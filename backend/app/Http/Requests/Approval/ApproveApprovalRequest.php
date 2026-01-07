<?php

namespace App\Http\Requests\Approval;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Approval;
use App\Services\RecruitmentHierarchyService;
use Illuminate\Support\Facades\Auth;

class ApproveApprovalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $approval = Approval::find($this->route('id'));

        if (!$approval) {
            return false;
        }

        $userId = Auth::id();
        $user = Auth::user();
        
        // Check if user is the specific assigned approver
        if ($approval->current_approver_id === $userId) {
            return true;
        }

        // For role-based approvals (current_approver_id is null), check role permissions
        if ($approval->current_approver_id === null) {
            $hierarchyService = app(RecruitmentHierarchyService::class);
            $permissions = $hierarchyService->getUserPermissions($user);
            
            if (!$permissions) {
                return false;
            }
            
            $level = $approval->current_approval_level;
            
            // Level 1: Supervisors (HR, Regional Manager) and above can approve
            if ($level == 1 && $permissions->hierarchy_level <= 2 && $permissions->can_approve_boarding) {
                return true;
            }
            
            // Level 2: Control and Super Admin can approve
            if ($level == 2 && $permissions->hierarchy_level <= 1 && $permissions->can_approve_boarding) {
                return true;
            }
            
            // Control users (level 0) can approve any level
            if ($permissions->hierarchy_level === 0 && $permissions->can_approve_boarding) {
                return true;
            }
        }

        // TODO: Check delegation when fully implemented
        // if ($this->hasDelegationRights($approval, $userId)) {
        //     return true;
        // }

        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'comments' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'comments.string' => 'Comments must be text',
            'comments.max' => 'Comments cannot exceed 1000 characters',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'comments' => 'approval comments',
        ];
    }
}
