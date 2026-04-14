<?php

namespace Tests\Support;

use App\Data\ShippingLabelPayload;
use App\Data\ShippingLabelQuoteResult;
use App\Data\ShippingLabelResult;
use App\Integrations\Shipping\Contracts\ShippingLabelIntegrationInterface;

class FakeShippingIntegration implements ShippingLabelIntegrationInterface
{
    public function key(): string
    {
        return 'easypost';
    }

    public function quote(ShippingLabelPayload $payload): ShippingLabelQuoteResult
    {
        $rates = [
            [
                'id' => 'rate_fake_priority',
                'carrier' => 'USPS',
                'service' => 'Priority',
                'rate' => '12.90',
                'currency' => 'USD',
                'retail_rate' => '16.20',
                'list_rate' => '14.56',
                'delivery_days' => 2,
                'est_delivery_days' => 2,
                'delivery_date' => null,
                'delivery_date_guaranteed' => false,
            ],
        ];

        return new ShippingLabelQuoteResult(
            externalShipmentId: 'shp_fake_quote',
            rates: $rates,
            messages: [],
            shipmentSnapshot: [
                'id' => 'shp_fake_quote',
                'object' => 'Shipment',
                'rates' => $rates,
            ],
        );
    }

    public function purchase(int $userId, string $externalShipmentId, string $rateId): ShippingLabelResult
    {
        return new ShippingLabelResult(
            externalShipmentId: $externalShipmentId,
            trackingCode: 'TRACKFAKE1',
            carrier: 'USPS',
            service: 'Priority',
            labelUrl: 'https://example.com/fake-label.pdf',
        );
    }
}
