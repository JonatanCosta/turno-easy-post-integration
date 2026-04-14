<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\ShippingLabel;
use App\Models\ShippingLabelStatus;
use App\Models\User;
use App\Models\UserShippingIntegration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class ShippingLabelApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    private function authHeaders(): array
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Shipper',
            'email' => 'shipper@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $user = User::query()->where('email', 'shipper@example.com')->firstOrFail();
        UserShippingIntegration::factory()->for($user)->create();

        $token = $this->postJson('/api/auth/login', [
            'email' => 'shipper@example.com',
            'password' => 'password123',
        ])->json('access_token');

        return ['Authorization' => 'Bearer '.$token];
    }

    /**
     * @return array<string, mixed>
     */
    private function validLabelPayload(): array
    {
        return [
            'integration_key' => 'easypost',
            'from_address' => [
                'name' => 'Sender Name',
                'company' => 'From Co',
                'street1' => '118 2nd St',
                'street2' => '—',
                'city' => 'San Francisco',
                'state' => 'CA',
                'zip' => '94105',
                'country' => 'US',
                'phone' => '4155550100',
                'email' => 'from@example.com',
            ],
            'to_address' => [
                'name' => 'Dr. Who',
                'company' => 'To LLC',
                'street1' => '179 N Harbor Dr',
                'street2' => '—',
                'city' => 'Redondo Beach',
                'state' => 'CA',
                'zip' => '90277',
                'country' => 'US',
                'phone' => '3105550100',
                'email' => 'to@example.com',
            ],
            'parcel' => [
                'length' => 10,
                'width' => 8,
                'height' => 4,
                'weight' => 16,
            ],
        ];
    }

    public function test_list_shipping_labels_returns_only_own_labels(): void
    {
        $plan = Plan::query()->where('slug', 'free')->firstOrFail();
        $userA = User::factory()->create(['plan_id' => $plan->id]);
        $userB = User::factory()->create(['plan_id' => $plan->id]);

        $completedId = ShippingLabelStatus::query()->where('slug', ShippingLabelStatus::SLUG_COMPLETED)->value('id');

        ShippingLabel::query()->create([
            'user_id' => $userA->id,
            'status_id' => $completedId,
            'integration_key' => 'easypost',
            'from_address' => [],
            'to_address' => [],
            'parcel' => [],
            'carrier' => 'USPS',
            'service' => 'Priority',
            'tracking_code' => 'A1',
            'label_url' => 'https://example.com/a.pdf',
            'external_shipment_id' => 'shp_a',
        ]);

        ShippingLabel::query()->create([
            'user_id' => $userB->id,
            'status_id' => $completedId,
            'integration_key' => 'easypost',
            'from_address' => [],
            'to_address' => [],
            'parcel' => [],
            'carrier' => 'USPS',
            'service' => 'Priority',
            'tracking_code' => 'B1',
            'label_url' => 'https://example.com/b.pdf',
            'external_shipment_id' => 'shp_b',
        ]);

        $token = JWTAuth::fromUser($userA);

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/shipping-labels');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertSame('A1', $data[0]['tracking_code']);
    }

    public function test_store_without_easypost_integration_returns_422(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'No Ep',
            'email' => 'noep@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $token = $this->postJson('/api/auth/login', [
            'email' => 'noep@example.com',
            'password' => 'password123',
        ])->json('access_token');

        $payload = $this->validLabelPayload();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/shipping-labels', $payload)
            ->assertStatus(422);
    }

    public function test_store_creates_rated_label_with_rates(): void
    {
        $headers = $this->authHeaders();

        $response = $this->withHeaders($headers)->postJson('/api/shipping-labels', $this->validLabelPayload());

        $response->assertCreated()
            ->assertJsonPath('integration_key', 'easypost')
            ->assertJsonPath('status.slug', ShippingLabelStatus::SLUG_RATED)
            ->assertJsonPath('external_shipment_id', 'shp_fake_quote');

        $rates = $response->json('rates');
        $this->assertIsArray($rates);
        $this->assertNotEmpty($rates);
        $this->assertSame('rate_fake_priority', $rates[0]['id']);

        $this->assertDatabaseHas('shipping_labels', [
            'id' => $response->json('id'),
            'integration_key' => 'easypost',
            'external_shipment_id' => 'shp_fake_quote',
        ]);
    }

    public function test_purchase_completes_label(): void
    {
        $headers = $this->authHeaders();

        $create = $this->withHeaders($headers)->postJson('/api/shipping-labels', $this->validLabelPayload());
        $create->assertCreated();
        $labelId = $create->json('id');

        $purchase = $this->withHeaders($headers)->postJson("/api/shipping-labels/{$labelId}/purchase", [
            'rate_id' => 'rate_fake_priority',
        ]);

        $purchase->assertOk()
            ->assertJsonPath('status.slug', ShippingLabelStatus::SLUG_COMPLETED)
            ->assertJsonPath('tracking_code', 'TRACKFAKE1');

        $this->assertDatabaseHas('shipping_labels', [
            'id' => $labelId,
            'tracking_code' => 'TRACKFAKE1',
        ]);
    }

    public function test_store_accepts_reference_from_address_and_full_to_address(): void
    {
        $headers = $this->authHeaders();

        $payload = [
            'integration_key' => 'easypost',
            'from_address' => [
                'id' => 'adr_savedfrom1',
            ],
            'to_address' => [
                'name' => 'Dr. Who',
                'company' => 'To LLC',
                'street1' => '179 N Harbor Dr',
                'street2' => '—',
                'city' => 'Redondo Beach',
                'state' => 'CA',
                'zip' => '90277',
                'country' => 'US',
                'phone' => '3105550100',
                'email' => 'to@example.com',
            ],
            'parcel' => [
                'length' => 10,
                'width' => 8,
                'height' => 4,
                'weight' => 16,
            ],
        ];

        $response = $this->withHeaders($headers)->postJson('/api/shipping-labels', $payload);

        $response->assertCreated()
            ->assertJsonPath('status.slug', ShippingLabelStatus::SLUG_RATED);
    }
}
