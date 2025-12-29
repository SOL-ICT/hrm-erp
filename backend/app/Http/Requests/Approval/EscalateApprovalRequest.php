<?php

namespace App\Http\Requests\Approval;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Approval;
use Illuminate\Support\Facades\Auth;

class EscalateApprovalRequest extends FormRequest
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

        // User must be the current approver to escalate
        $userId = Auth::id();
        
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
            'escalate_to' => 'required|integer|exists:users,id',
            'reason' => 'required|string|max:1000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'escalate_to.required' => 'Please select a user to escalate to',
            'escalate_to.integer' => 'Invalid user selected',
            'escalate_to.exists' => 'Selected user does not exist',
            'reason.required' => 'Please provide a reason for escalation',
            'reason.string' => 'Reason must be text',
            'reason.max' => 'Reason cannot exceed 1000 characters',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'escalate_to' => 'escalation target',
            'reason' => 'escalation reason',
        ];
    }
}
