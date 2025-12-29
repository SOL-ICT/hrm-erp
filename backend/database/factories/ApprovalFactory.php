<?php

namespace Database\Factories;

use App\Models\Approval;
use App\Models\User;
use App\Models\ApprovalWorkflow;
use Illuminate\Database\Eloquent\Factories\Factory;

class ApprovalFactory extends Factory
{
    protected $model = Approval::class;

    public function definition(): array
    {
        return [
            'approvable_type' => 'App\\Models\\Staff',
            'approvable_id' => $this->faker->numberBetween(1, 100),
            'approval_type' => $this->faker->randomElement(['staff_boarding', 'recruitment_request', 'ticket_assignment']),
            'module_name' => $this->faker->randomElement(['recruitment', 'contracts', 'claims']),
            'requested_by' => User::factory(),
            'requested_at' => now(),
            'current_approver_id' => User::factory(),
            'current_approval_level' => 1,
            'total_approval_levels' => $this->faker->numberBetween(1, 3),
            'status' => 'pending',
            'workflow_id' => ApprovalWorkflow::factory(),
            'priority' => $this->faker->randomElement(['low', 'medium', 'high', 'urgent']),
            'due_date' => now()->addDays($this->faker->numberBetween(1, 7)),
            'is_overdue' => false,
            'request_data' => [
                'test_data' => 'value',
                'timestamp' => now()->toISOString(),
            ],
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'completed_at' => now(),
            'completed_by' => User::factory(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'completed_at' => now(),
            'completed_by' => User::factory(),
        ]);
    }

    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'is_overdue' => true,
            'due_date' => now()->subDays(2),
        ]);
    }

    public function highPriority(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => 'high',
        ]);
    }
}
