<?php

namespace App\Providers;

use App\Integrations\Shipping\EasyPost\EasyPostShippingIntegration;
use App\Integrations\Shipping\IntegrationResolver;
use Illuminate\Support\ServiceProvider;
use Tests\Support\FakeShippingIntegration;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(IntegrationResolver::class, function ($app) {
            if ($app->environment('testing')) {
                return new IntegrationResolver([
                    'easypost' => new FakeShippingIntegration,
                ]);
            }

            return new IntegrationResolver([
                'easypost' => $app->make(EasyPostShippingIntegration::class),
            ]);
        });
    }

    public function boot(): void
    {
        //
    }
}
