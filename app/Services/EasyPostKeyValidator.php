<?php

namespace App\Services;

use EasyPost\EasyPostClient;
use EasyPost\Exception\Api\ApiException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class EasyPostKeyValidator
{
    /**
     * @throws ValidationException
     */
    public function validate(string $apiKey): void
    {
        $key = trim($apiKey);
        if ($key === '') {
            throw ValidationException::withMessages([
                'api_key' => ['The API key is required.'],
            ]);
        }

        try {
            $client = new EasyPostClient($key);
            // EasyPost's Users API is production-only; test keys (EZTK_…) get 403 on user->retrieveMe().
            // Test vs live mode is determined solely by the key prefix — there is no client "mode" flag.
            // A lightweight read works for both environments (see EasyPost authentication docs).
            $client->address->all(['page_size' => 1]);
        } catch (ApiException $e) {
            Log::warning('EasyPost API key validation failed', [
                'exception' => $e::class,
                'http_status' => $e->getHttpStatus(),
                'api_code' => $e->code ?? null,
                'message' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'api_key' => [$this->userFacingMessage($e)],
            ]);
        } catch (\Throwable $e) {
            Log::error('EasyPost API key validation unexpected error', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'api_key' => ['Could not verify the API key. Please try again or contact support if the problem continues.'],
            ]);
        }
    }

    private function userFacingMessage(ApiException $exception): string
    {
        $status = $exception->getHttpStatus();
        $raw = trim($exception->getMessage());
        $lower = strtolower($raw);

        if ($this->looksLikeNetworkOrTlsFailure($lower, $status)) {
            return 'The server could not reach EasyPost (network, DNS, or TLS). If you use Docker or a restricted network, allow outbound HTTPS to api.easypost.com.';
        }

        return match ($status) {
            401 => 'EasyPost rejected this key (401 Unauthorized). Copy the key again from the EasyPost dashboard (test keys start with EZTK, production with EZAK).',
            403 => 'EasyPost denied access with this key (403). If you use a restricted API key, it must allow reading addresses (or paste the full account key from the EasyPost dashboard).',
            402 => 'EasyPost returned a billing error (402). Log in to EasyPost and check your wallet or payment method.',
            429 => 'EasyPost rate limit (429). Wait a moment and try again.',
            500, 502, 503, 504 => 'EasyPost returned a temporary server error. Try again in a few minutes.',
            default => $raw !== ''
                ? (string) Str::limit($raw, 220)
                : 'The EasyPost API key could not be verified.',
        };
    }

    /**
     * @param  non-empty-string  $lowerMessage
     */
    private function looksLikeNetworkOrTlsFailure(string $lowerMessage, ?int $status): bool
    {
        if ($status !== null && $status >= 500) {
            return false;
        }

        return str_contains($lowerMessage, 'communicating with easypost')
            || str_contains($lowerMessage, 'curl error')
            || str_contains($lowerMessage, 'connection timed out')
            || str_contains($lowerMessage, 'could not resolve host')
            || str_contains($lowerMessage, 'ssl')
            || str_contains($lowerMessage, 'certificate');
    }
}
