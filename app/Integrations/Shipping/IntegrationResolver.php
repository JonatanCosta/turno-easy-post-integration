<?php

namespace App\Integrations\Shipping;

use App\Integrations\Shipping\Contracts\ShippingLabelIntegrationInterface;
use InvalidArgumentException;

class IntegrationResolver
{
    /**
     * @param  array<string, ShippingLabelIntegrationInterface>  $integrations
     */
    public function __construct(
        private array $integrations,
    ) {}

    public function resolve(string $key): ShippingLabelIntegrationInterface
    {
        if (! isset($this->integrations[$key])) {
            throw new InvalidArgumentException('Unknown shipping integration: '.$key);
        }

        return $this->integrations[$key];
    }

    /**
     * @return list<array{key: string, name: string}>
     */
    public function metadata(): array
    {
        $out = [];
        foreach ($this->integrations as $integration) {
            $out[] = [
                'key' => $integration->key(),
                'name' => match ($integration->key()) {
                    'easypost' => 'EasyPost',
                    default => ucfirst($integration->key()),
                },
            ];
        }

        return $out;
    }
}
