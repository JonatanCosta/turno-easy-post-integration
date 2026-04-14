<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEasyPostAddressRequest;
use App\Models\UserShippingIntegration;
use App\Services\EasyPostClientFactory;
use App\Support\EasyPostAddressNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class EasyPostAddressController extends Controller
{
    public function __construct(
        private EasyPostClientFactory $easyPostClients,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->assertEasyPostConfigured($request);

        $pageSize = min(100, max(1, (int) $request->query('page_size', 20)));
        $params = ['page_size' => $pageSize];
        if ($request->filled('before_id')) {
            $params['before_id'] = (string) $request->query('before_id');
        }
        if ($request->filled('after_id')) {
            $params['after_id'] = (string) $request->query('after_id');
        }

        $user = $request->user();
        $client = $this->easyPostClients->forUser($user->id);
        $collection = $client->address->all($params);

        $rawList = is_object($collection) && isset($collection->addresses)
            ? $collection->addresses
            : (is_array($collection) ? ($collection['addresses'] ?? []) : []);

        $addresses = [];
        foreach ($rawList as $addr) {
            $addresses[] = EasyPostAddressNormalizer::fromMixed($addr);
        }

        $hasMore = false;
        if (is_object($collection) && isset($collection->has_more)) {
            $hasMore = (bool) $collection->has_more;
        } elseif (is_array($collection) && array_key_exists('has_more', $collection)) {
            $hasMore = (bool) $collection['has_more'];
        }

        return response()->json([
            'data' => $addresses,
            'has_more' => $hasMore,
        ]);
    }

    public function store(StoreEasyPostAddressRequest $request): JsonResponse
    {
        $this->assertEasyPostConfigured($request);

        $validated = $request->validated();
        $addressInput = $validated['address'];
        $verify = array_key_exists('verify', $validated)
            ? (bool) $validated['verify']
            : (bool) config('services.easypost.verify_addresses');

        $params = $addressInput;
        if ($verify) {
            $params['verify'] = true;
        }

        $user = $request->user();
        $client = $this->easyPostClients->forUser($user->id);
        $created = $client->address->create($params);

        return response()->json([
            'data' => EasyPostAddressNormalizer::fromMixed($created),
        ], 201);
    }

    public function show(Request $request, string $addressId): JsonResponse
    {
        $this->assertEasyPostConfigured($request);

        if (preg_match('/^adr_[A-Za-z0-9]+$/', $addressId) !== 1) {
            abort(404);
        }

        $user = $request->user();
        $client = $this->easyPostClients->forUser($user->id);

        try {
            $retrieved = $client->address->retrieve($addressId);
        } catch (\Throwable) {
            abort(404);
        }

        return response()->json([
            'data' => EasyPostAddressNormalizer::fromMixed($retrieved),
        ]);
    }

    private function assertEasyPostConfigured(Request $request): void
    {
        $user = $request->user();
        $hasKey = UserShippingIntegration::query()
            ->where('user_id', $user->id)
            ->where('provider', UserShippingIntegration::PROVIDER_EASYPOST)
            ->exists();
        if (! $hasKey) {
            throw new UnprocessableEntityHttpException('Configure your EasyPost integration before using addresses.');
        }
    }
}
