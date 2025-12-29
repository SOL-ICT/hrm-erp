<?php

namespace App\Http\Requests\Approval;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Approval;
use Illuminate\Support\Facades\Auth;

class RejectApprovalRequest extends FormRequest
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

        // User must be the current approver or have delegation rights
        $userId = Auth::id();
        
        // Check if user is current approver
        if ($approval->current_approver_id === $userId) {
            return true;
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
            'rejection_reason' => 'required|string|max:1000',
            'comments' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'rejection_reason.required' => 'Please provide a reason for rejection',
            'rejection_reason.string' => 'Rejection reason must be text',
            'rejection_reason.max' => 'Rejection reason cannot exceed 1000 characters',
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
            'rejection_reason' => 'rejection reason',
            'comments' => 'additional comments',
        ];
    }
}
