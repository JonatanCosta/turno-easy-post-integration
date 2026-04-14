<?php

namespace Tests\Unit;

use App\Data\ShippingLabelPayload;
use App\Data\ShippingLabelQuoteResult;
use App\Data\ShippingLabelResult;
use App\Integrations\Shipping\Contracts\ShippingLabelIntegrationInterface;
use App\Integrations\Shipping\IntegrationResolver;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use Tests\Support\FakeShippingIntegration;

class IntegrationResolverTest extends TestCase
{
    public function test_resolve_returns_integration_for_known_key(): void
    {
        $fake = new FakeShippingIntegration;
        $resolver = new IntegrationResolver(['easypost' => $fake]);

        $this->assertSame($fake, $resolver->resolve('easypost'));
    }

    public function test_resolve_throws_for_unknown_key(): void
    {
        $resolver = new IntegrationResolver(['easypost' => new FakeShippingIntegration]);

        $this->expectException(InvalidArgumentException::class);
        $resolver->resolve('unknown');
    }

    public function test_metadata_lists_integrations(): void
    {
        $integration = new class implements ShippingLabelIntegrationInterface
        {
            public function key(): string
            {
                return 'easypost';
            }

            public function quote(ShippingLabelPayload $payload): ShippingLabelQuoteResult
            {
                throw new \RuntimeException('not used');
            }

            public function purchase(int $userId, string $externalShipmentId, string $rateId): ShippingLabelResult
            {
                throw new \RuntimeException('not used');
            }
        };

        $resolver = new IntegrationResolver(['easypost' => $integration]);
        $meta = $resolver->metadata();

        $this->assertSame('easypost', $meta[0]['key']);
        $this->assertSame('EasyPost', $meta[0]['name']);
    }
}
