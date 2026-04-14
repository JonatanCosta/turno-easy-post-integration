<?php

namespace App\Integrations\Shipping\Contracts;

use App\Data\ShippingLabelPayload;
use App\Data\ShippingLabelQuoteResult;
use App\Data\ShippingLabelResult;

interface ShippingLabelIntegrationInterface
{
    public function key(): string;

    public function quote(ShippingLabelPayload $payload): ShippingLabelQuoteResult;

    public function purchase(int $userId, string $externalShipmentId, string $rateId): ShippingLabelResult;
}
