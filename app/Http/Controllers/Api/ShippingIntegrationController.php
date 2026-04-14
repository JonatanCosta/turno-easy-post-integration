<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateEasyPostIntegrationRequest;
use App\Integrations\Shipping\IntegrationResolver;
use App\Models\UserShippingIntegration;
use App\Services\EasyPostKeyValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ShippingIntegrationController extends Controller
{
    public function __construct(
        private IntegrationResolver $integrations,
        private EasyPostKeyValidator $easyPostKeys,
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $configuredKeys = UserShippingIntegration::query()
                ->where('user_id', $user->id)
                ->pluck('provider')
                ->all();

            $data = [];
            foreach ($this->integrations->metadata() as $row) {
                $data[] = [
                    'key' => $row['key'],
                    'name' => $row['name'],
                    'configured' => in_array($row['key'], $configuredKeys, true),
                ];
            }

            return response()->json([
                'data' => $data,
            ]);
        } catch (\Throwable $e) {
            Log::error('ShippingIntegrationController: index failed', [
                'user_id' => $request->user()?->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Could not load integrations.',
            ], 500);
        }
    }

    public function updateEasyPost(UpdateEasyPostIntegrationRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            $apiKey = $request->validated('api_key');
            $this->easyPostKeys->validate($apiKey);

            UserShippingIntegration::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'provider' => UserShippingIntegration::PROVIDER_EASYPOST,
                ],
                [
                    'api_key' => $apiKey,
                ],
            );

            return response()->json([
                'message' => 'EasyPost integration saved.',
                'configured' => true,
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('ShippingIntegrationController: updateEasyPost failed', [
                'user_id' => $request->user()?->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Could not save the EasyPost integration.',
            ], 500);
        }
    }

    public function destroyEasyPost(Request $request): JsonResponse
    {
        try {
            UserShippingIntegration::query()
                ->where('user_id', $request->user()->id)
                ->where('provider', UserShippingIntegration::PROVIDER_EASYPOST)
                ->delete();

            return response()->json([
                'message' => 'EasyPost integration removed.',
            ]);
        } catch (\Throwable $e) {
            Log::error('ShippingIntegrationController: destroyEasyPost failed', [
                'user_id' => $request->user()?->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Could not remove the EasyPost integration.',
            ], 500);
        }
    }
}
