<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\PlanRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;

class RegistrationService
{
    public function __construct(
        private PlanRepositoryInterface $plans,
        private UserRepositoryInterface $users,
    ) {}

    public function register(array $data): User
    {
        $plan = $this->plans->findBySlug('free');
        if (! $plan) {
            abort(500, 'Default plan is not configured.');
        }

        return $this->users->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'plan_id' => $plan->id,
        ]);
    }
}
