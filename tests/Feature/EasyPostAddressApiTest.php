<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EasyPostAddressApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_get_addresses_without_easypost_integration_returns_422(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'No Ep',
            'email' => 'noaddr@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => 'noaddr@example.com',
            'password' => 'password123',
        ])->json('access_token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/integrations/shipping/easypost/addresses')
            ->assertStatus(422);
    }

    public function test_get_addresses_requires_authentication(): void
    {
        $this->getJson('/api/integrations/shipping/easypost/addresses')
            ->assertUnauthorized();
    }

    public function test_post_address_without_easypost_integration_returns_422(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'No Ep',
            'email' => 'noaddr2@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => 'noaddr2@example.com',
            'password' => 'password123',
        ])->json('access_token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/integrations/shipping/easypost/addresses', [
                'address' => [
                    'name' => 'A',
                    'company' => 'B',
                    'street1' => '1 St',
                    'street2' => '',
                    'city' => 'SF',
                    'state' => 'CA',
                    'zip' => '94105',
                    'country' => 'US',
                    'phone' => '4155550100',
                    'email' => 'a@example.com',
                ],
            ])
            ->assertStatus(422);
    }
}
