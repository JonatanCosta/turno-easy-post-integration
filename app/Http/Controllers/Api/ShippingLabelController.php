<?php

namespace App\Http\Controllers\Api;

use App\Data\ShippingLabelPayload;
use App\Http\Controllers\Controller;
use App\Http\Requests\PurchaseShippingLabelRequest;
use App\Http\Requests\StoreShippingLabelRequest;
use App\Models\ShippingLabel;
use App\Services\ShippingLabelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingLabelController extends Controller
{
    public function __construct(
        private ShippingLabelService $shippingLabels,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $labels = $this->shippingLabels->paginateForUser(
            $user->id,
            min(100, max(1, (int) $request->query('per_page', 15)))
        );

        return response()->json($labels);
    }

    public function show(Request $request, int $shippingLabel): JsonResponse
    {
        $user = $request->user();
        $label = $this->shippingLabels->findForUser($shippingLabel, $user);

        if ($label === null) {
            abort(404);
        }

        return response()->json($this->serializeLabel($label));
    }

    public function store(StoreShippingLabelRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $payload = new ShippingLabelPayload(
            userId: $user->id,
            integrationKey: $validated['integration_key'],
            fromAddress: $validated['from_address'],
            toAddress: $validated['to_address'],
            parcel: $validated['parcel'],
        );

        $label = $this->shippingLabels->createQuotedLabelForUser($user, $payload);
        $label->load('status');

        return response()->json($this->serializeLabel($label), 201);
    }

    public function purchase(PurchaseShippingLabelRequest $request, int $shippingLabel): JsonResponse
    {
        $user = $request->user();
        $rateId = $request->validated('rate_id');

        $label = $this->shippingLabels->purchaseLabel($user, $shippingLabel, $rateId);
        $label->load('status');

        return response()->json($this->serializeLabel($label));
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeLabel(ShippingLabel $label): array
    {
        $snapshot = $label->quote_snapshot;
        $rates = [];
        $messages = [];

        if (is_array($snapshot)) {
            foreach ($snapshot['rates'] ?? [] as $rate) {
                if (is_array($rate)) {
                    $rates[] = [
                        'id' => $rate['id'] ?? null,
                        'carrier' => $rate['carrier'] ?? null,
                        'service' => $rate['service'] ?? null,
                        'rate' => $rate['rate'] ?? null,
                        'currency' => $rate['currency'] ?? null,
                        'retail_rate' => $rate['retail_rate'] ?? null,
                        'list_rate' => $rate['list_rate'] ?? null,
                        'delivery_days' => $rate['delivery_days'] ?? null,
                        'est_delivery_days' => $rate['est_delivery_days'] ?? null,
                        'delivery_date' => $rate['delivery_date'] ?? null,
                        'delivery_date_guaranteed' => $rate['delivery_date_guaranteed'] ?? null,
                    ];
                }
            }
            foreach ($snapshot['messages'] ?? [] as $message) {
                if (is_array($message)) {
                    $messages[] = [
                        'carrier' => $message['carrier'] ?? null,
                        'carrier_account_id' => $message['carrier_account_id'] ?? null,
                        'type' => $message['type'] ?? null,
                        'message' => $message['message'] ?? null,
                    ];
                }
            }
        }

        return [
            'id' => $label->id,
            'integration_key' => $label->integration_key,
            'status' => [
                'slug' => $label->status->slug,
                'name' => $label->status->name,
            ],
            'from_address' => $label->from_address,
            'to_address' => $label->to_address,
            'parcel' => $label->parcel,
            'external_shipment_id' => $label->external_shipment_id,
            'rates' => $rates,
            'easypost_messages' => $messages,
            'tracking_code' => $label->tracking_code,
            'carrier' => $label->carrier,
            'service' => $label->service,
            'label_url' => $label->label_url,
            'last_error' => $label->last_error,
            'created_at' => $label->created_at?->toIso8601String(),
        ];
    }
}
