<?php

namespace Database\Factories;

use App\Models\ApprovalWorkflow;
use Illuminate\Database\Eloquent\Factories\Factory;

class ApprovalWorkflowFactory extends Factory
{
    protected $model = ApprovalWorkflow::class;

    public function definition(): array
    {
        return [
            'workflow_name' => $this->faker->words(3, true) . ' Workflow',
            'workflow_code' => strtoupper($this->faker->bothify('??##_WORKFLOW')),
            'module_name' => $this->faker->randomElement(['recruitment', 'contracts', 'claims', 'payroll']),
            'approval_type' => $this->faker->randomElement(['staff_boarding', 'recruitment_request', 'contract_approval']),
            'workflow_type' => $this->faker->randomElement(['sequential', 'parallel', 'conditional']),
            'total_levels' => $this->faker->numberBetween(1, 3),
            'activation_conditions' => [
                'requires_approval' => true,
            ],
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function sequential(): static
    {
        return $this->state(fn (array $attributes) => [
            'workflow_type' => 'sequential',
        ]);
    }

    public function parallel(): static
    {
        return $this->state(fn (array $attributes) => [
            'workflow_type' => 'parallel',
        ]);
    }
}
