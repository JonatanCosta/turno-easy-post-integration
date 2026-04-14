<?php

namespace App\Data;

class ShippingLabelPayload
{
    /**
     * @param  array<string, mixed>  $fromAddress
     * @param  array<string, mixed>  $toAddress
     * @param  array<string, mixed>  $parcel
     */
    public function __construct(
        public readonly ?int $userId,
        public readonly string $integrationKey,
        public readonly array $fromAddress,
        public readonly array $toAddress,
        public readonly array $parcel,
    ) {}
}
