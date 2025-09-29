<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ClientContractIndexRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Handle authorization in middleware
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'per_page' => 'nullable|integer|min:1|max:100',
            'search' => 'nullable|string|max:255',
            'client_id' => 'nullable|integer|exists:clients,id',
            'status' => 'nullable|string|in:all,active,inactive,expiring,expired',
            'sort_by' => 'nullable|string|in:created_at,contract_code,contract_type,client_name,contract_start_date,contract_end_date',
            'sort_order' => 'nullable|string|in:asc,desc',
            'page' => 'nullable|integer|min:1'
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'per_page.max' => 'Cannot display more than 100 items per page.',
            'client_id.exists' => 'The selected client does not exist.',
            'status.in' => 'Invalid status filter value.',
            'sort_by.in' => 'Invalid sort field.',
            'sort_order.in' => 'Sort order must be either asc or desc.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        // Clean up any problematic values before validation
        $input = $this->all();

        // Remove empty strings and convert to null
        foreach ($input as $key => $value) {
            if ($value === '' || $value === 'undefined' || $value === 'null') {
                $input[$key] = null;
            }
        }

        $this->replace($input);
    }

    /**
     * Get validated and sanitized parameters with defaults
     */
    public function getCleanParams(): array
    {
        $validated = $this->validated();

        return [
            'per_page' => $validated['per_page'] ?? 15,
            'search' => $validated['search'] ?? null,
            'client_id' => $validated['client_id'] ?? null,
            'status' => $validated['status'] ?? 'all',
            'sort_by' => $validated['sort_by'] ?? 'created_at',
            'sort_order' => $validated['sort_order'] ?? 'desc',
            'page' => $validated['page'] ?? 1,
        ];
    }
}
