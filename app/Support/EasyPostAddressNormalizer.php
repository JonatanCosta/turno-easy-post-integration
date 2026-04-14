<?php

namespace App\Support;

/**
 * Maps EasyPost Address objects/arrays to a stable JSON shape for API responses.
 */
class EasyPostAddressNormalizer
{
    /**
     * @param  array<string, mixed>  $arr
     * @return array<string, mixed>
     */
    public static function fromArray(array $arr): array
    {
        $keys = [
            'id', 'name', 'company', 'street1', 'street2', 'city', 'state', 'zip',
            'country', 'phone', 'email', 'residential', 'carrier_facility',
        ];
        $out = [];
        foreach ($keys as $k) {
            if (array_key_exists($k, $arr) && $arr[$k] !== null) {
                $out[$k] = $arr[$k];
            }
        }

        return $out;
    }

    /**
     * @return array<string, mixed>
     */
    public static function fromMixed(mixed $addr): array
    {
        if (is_object($addr) && method_exists($addr, '__toArray')) {
            /** @var array<string, mixed> $arr */
            $arr = $addr->__toArray(true);

            return self::fromArray($arr);
        }

        if (is_array($addr)) {
            return self::fromArray($addr);
        }

        return [];
    }
}
