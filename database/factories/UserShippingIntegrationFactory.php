<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserShippingIntegration;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserShippingIntegration>
 */
class UserShippingIntegrationFactory extends Factory
{
    protected $model = UserShippingIntegration::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'provider' => UserShippingIntegration::PROVIDER_EASYPOST,
            'api_key' => 'test_easypost_key',
        ];
    }
}
