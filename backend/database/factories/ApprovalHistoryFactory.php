<?php

namespace Database\Factories;

use App\Models\ApprovalHistory;
use App\Models\Approval;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ApprovalHistoryFactory extends Factory
{
    protected $model = ApprovalHistory::class;

    public function definition(): array
    {
        $actions = ['submitted', 'assigned', 'approved', 'rejected', 'escalated', 'cancelled', 'commented', 'delegated', 'level_completed'];
        $action = $this->faker->randomElement($actions);
        
        return [
            'approval_id' => Approval::factory(),
            'action' => $action,
            'action_by' => User::factory(),
            'action_at' => now(),
            'from_status' => 'pending',
            'to_status' => $this->getToStatus($action),
            'approval_level' => $this->faker->numberBetween(1, 3),
            'comments' => $this->faker->optional()->sentence(),
            'rejection_reason' => $action === 'rejected' ? $this->faker->sentence() : null,
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->userAgent(),
        ];
    }

    private function getToStatus(string $action): string
    {
        return match($action) {
            'approved' => 'approved',
            'rejected' => 'rejected',
            'cancelled' => 'cancelled',
            'escalated' => 'escalated',
            default => 'pending',
        };
    }
}
