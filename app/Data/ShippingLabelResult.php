<?php

namespace App\Data;

class ShippingLabelResult
{
    public function __construct(
        public readonly string $externalShipmentId,
        public readonly ?string $trackingCode,
        public readonly ?string $carrier,
        public readonly ?string $service,
        public readonly ?string $labelUrl,
    ) {}
}
