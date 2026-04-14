<?php

namespace App\Data;

class ShippingLabelQuoteResult
{
    /**
     * @param  array<int, array<string, mixed>>  $rates
     * @param  array<int, array<string, mixed>>  $messages
     * @param  array<string, mixed>  $shipmentSnapshot
     */
    public function __construct(
        public readonly string $externalShipmentId,
        public readonly array $rates,
        public readonly array $messages,
        public readonly array $shipmentSnapshot,
    ) {}
}
