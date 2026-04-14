<?php

namespace App\Services;

use App\Models\UserShippingIntegration;
use EasyPost\EasyPostClient;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class EasyPostClientFactory
{
    public function forUser(int $userId): EasyPostClient
    {
        $row = UserShippingIntegration::query()
            ->where('user_id', $userId)
            ->where('provider', UserShippingIntegration::PROVIDER_EASYPOST)
            ->first();

        if ($row === null) {
            throw new UnprocessableEntityHttpException('EasyPost is not configured for this account.');
        }

        $key = trim((string) $row->api_key);
        if ($key === '') {
            throw new UnprocessableEntityHttpException('EasyPost is not configured for this account.');
        }

        return new EasyPostClient($key);
    }
}
