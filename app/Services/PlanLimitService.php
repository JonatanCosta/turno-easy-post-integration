<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\ShippingLabelRepositoryInterface;

class PlanLimitService
{
    public function __construct(
        private ShippingLabelRepositoryInterface $shippingLabels,
    ) {}

    public function assertWithinLimit(User $user): void
    {
        $user->loadMissing('plan');
        $plan = $user->plan;
        if (! $plan || $plan->monthly_label_limit === null) {
            return;
        }

        $used = $this->shippingLabels->countForUserInCurrentMonth($user->id);
        if ($used >= $plan->monthly_label_limit) {
            abort(422, 'You have reached the monthly label limit for your plan.');
        }
    }
}
