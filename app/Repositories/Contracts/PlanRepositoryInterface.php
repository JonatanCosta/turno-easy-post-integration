<?php

namespace App\Repositories\Contracts;

use App\Models\Plan;

interface PlanRepositoryInterface
{
    public function findBySlug(string $slug): ?Plan;
}
