<?php

namespace App\Http\Requests\Approval;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Approval;
use Illuminate\Support\Facades\Auth;

class CommentApprovalRequest extends FormRequest
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

        // Any user involved in the approval can comment
        // - Requester
        // - Current approver
        // - Previous approvers (who acted on it)
        // - Workflow participants
        
        if ($approval->requested_by === $userId) {
            return true;
        }

        if ($approval->current_approver_id === $userId) {
            return true;
        }

        // Check if user has acted on this approval before
        $hasActed = $approval->history()
            ->where('action_by', $userId)
            ->exists();

        if ($hasActed) {
            return true;
        }

        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'comment' => 'required|string|max:1000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'comment.required' => 'Please provide a comment',
            'comment.string' => 'Comment must be text',
            'comment.max' => 'Comment cannot exceed 1000 characters',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'comment' => 'comment',
        ];
    }
}
