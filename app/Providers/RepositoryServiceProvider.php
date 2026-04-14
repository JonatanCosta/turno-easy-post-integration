<?php

namespace App\Providers;

use App\Repositories\Contracts\PlanRepositoryInterface;
use App\Repositories\Contracts\ShippingLabelRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\PlanRepository;
use App\Repositories\Eloquent\ShippingLabelRepository;
use App\Repositories\Eloquent\UserRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PlanRepositoryInterface::class, PlanRepository::class);
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(ShippingLabelRepositoryInterface::class, ShippingLabelRepository::class);
    }
}
