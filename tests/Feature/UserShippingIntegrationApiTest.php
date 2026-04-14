<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\UserShippingIntegration;
use App\Services\EasyPostKeyValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class UserShippingIntegrationApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * @return array{0: string, 1: string} token, email
     */
    private function registerAndLogin(): array
    {
        $email = 'u'.uniqid('', true).'@example.com';
        $this->postJson('/api/auth/register', [
            'name' => 'Integrator',
            'email' => $email,
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $token = (string) $this->postJson('/api/auth/login', [
            'email' => $email,
            'password' => 'password123',
        ])->json('access_token');

        return [$token, $email];
    }

    public function test_put_easypost_requires_authentication(): void
    {
        $this->putJson('/api/integrations/shipping/easypost', [
            'api_key' => 'EZTK_test_1234567890',
        ])->assertUnauthorized();
    }

    public function test_put_easypost_validates_api_key_field(): void
    {
        [$token] = $this->registerAndLogin();

        $this->withToken($token)
            ->putJson('/api/integrations/shipping/easypost', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['api_key']);
    }

    public function test_put_easypost_persists_after_validator_succeeds(): void
    {
        $this->mock(EasyPostKeyValidator::class, function ($mock) {
            $mock->shouldReceive('validate')
                ->once()
                ->with(Mockery::type('string'));
        });

        [$token, $email] = $this->registerAndLogin();

        $this->withToken($token)
            ->putJson('/api/integrations/shipping/easypost', [
                'api_key' => 'EZTK_test_abcdefghij',
            ])
            ->assertOk()
            ->assertJsonPath('configured', true);

        $user = User::query()->where('email', $email)->firstOrFail();
        $this->assertDatabaseHas('user_shipping_integrations', [
            'user_id' => $user->id,
            'provider' => UserShippingIntegration::PROVIDER_EASYPOST,
        ]);
    }

    public function test_delete_easypost_removes_row(): void
    {
        $user = User::factory()->create();
        UserShippingIntegration::factory()->for($user)->create();

        $token = JWTAuth::fromUser($user);

        $this->withToken($token)
            ->deleteJson('/api/integrations/shipping/easypost')
            ->assertOk();

        $this->assertDatabaseMissing('user_shipping_integrations', [
            'user_id' => $user->id,
            'provider' => UserShippingIntegration::PROVIDER_EASYPOST,
        ]);
    }

    public function test_index_marks_easypost_configured(): void
    {
        $user = User::factory()->create();
        UserShippingIntegration::factory()->for($user)->create();
        $token = JWTAuth::fromUser($user);

        $this->withToken($token)
            ->getJson('/api/integrations/shipping')
            ->assertOk()
            ->assertJsonFragment([
                'key' => 'easypost',
                'configured' => true,
            ]);
    }
}
