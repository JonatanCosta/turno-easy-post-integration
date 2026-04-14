<?php

namespace App\Integrations\Shipping\EasyPost;

use App\Data\ShippingLabelPayload;
use App\Data\ShippingLabelQuoteResult;
use App\Data\ShippingLabelResult;
use App\Integrations\Shipping\Contracts\ShippingLabelIntegrationInterface;
use App\Models\ShippingLabel;
use App\Services\EasyPostClientFactory;
use App\Support\EasyPostAddressNormalizer;
use EasyPost\EasyPostClient;
use EasyPost\Shipment;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class EasyPostShippingIntegration implements ShippingLabelIntegrationInterface
{
    public function __construct(
        private EasyPostClientFactory $easyPostClients,
    ) {}

    public function key(): string
    {
        return 'easypost';
    }

    public function quote(ShippingLabelPayload $payload): ShippingLabelQuoteResult
    {
        if ($payload->userId === null) {
            throw new UnprocessableEntityHttpException('Missing user context for shipping integration.');
        }

        $client = $this->easyPostClients->forUser($payload->userId);

        [$from, $to] = $this->prepareAddresses($payload, $client);

        $shipment = $client->shipment->create([
            'from_address' => $from,
            'to_address' => $to,
            'parcel' => $payload->parcel,
        ]);

        $snapshot = $this->shipmentToArray($shipment);

        return new ShippingLabelQuoteResult(
            externalShipmentId: (string) $shipment->id,
            rates: $this->normalizeRatesForApi($snapshot['rates'] ?? []),
            messages: $this->normalizeMessagesForApi($snapshot['messages'] ?? []),
            shipmentSnapshot: $snapshot,
        );
    }

    public function purchase(int $userId, string $externalShipmentId, string $rateId): ShippingLabelResult
    {
        $client = $this->easyPostClients->forUser($userId);

        $bought = $client->shipment->buy($externalShipmentId, ['id' => $rateId]);

        $labelUrl = $bought->postage_label->label_url ?? null;

        return new ShippingLabelResult(
            externalShipmentId: (string) $bought->id,
            trackingCode: $bought->tracking_code ?? null,
            carrier: $bought->selected_rate->carrier ?? null,
            service: $bought->selected_rate->service ?? null,
            labelUrl: $labelUrl,
        );
    }

    /**
     * Called by ShippingLabelService after a successful quote. Public entry point; logic lives in private methods.
     */
    public function consolidateQuotedLabelAddresses(int $userId, ShippingLabel $label): void
    {
        $this->consolidateSavedAddressReferencesOnLabel($userId, $label);
    }

    private function consolidateSavedAddressReferencesOnLabel(int $userId, ShippingLabel $label): void
    {
        $from = $label->from_address;
        $to = $label->to_address;
        if (! is_array($from) || ! is_array($to)) {
            return;
        }

        if (! $this->isEasyPostAddressReference($from) && ! $this->isEasyPostAddressReference($to)) {
            return;
        }

        try {
            $client = $this->easyPostClients->forUser($userId);
        } catch (\Throwable $e) {
            Log::warning('EasyPostShippingIntegration: client unavailable for address consolidation', [
                'label_id' => $label->id,
                'message' => $e->getMessage(),
            ]);

            return;
        }

        if ($this->isEasyPostAddressReference($from)) {
            $from = $this->retrieveNormalizedAddressOrKeep($client, $from);
        }
        if ($this->isEasyPostAddressReference($to)) {
            $to = $this->retrieveNormalizedAddressOrKeep($client, $to);
        }

        $label->forceFill([
            'from_address' => $from,
            'to_address' => $to,
        ])->save();
    }

    /**
     * @param  array<string, mixed>  $reference
     * @return array<string, mixed>
     */
    private function retrieveNormalizedAddressOrKeep(EasyPostClient $client, array $reference): array
    {
        $id = $reference['id'] ?? '';
        if (! is_string($id) || $id === '') {
            return $reference;
        }

        try {
            $obj = $client->address->retrieve($id);
            $normalized = EasyPostAddressNormalizer::fromMixed($obj);

            return $normalized !== [] ? $normalized : $reference;
        } catch (\Throwable $e) {
            Log::warning('EasyPostShippingIntegration: could not retrieve address for consolidation', [
                'address_id' => $id,
                'message' => $e->getMessage(),
            ]);

            return $reference;
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function shipmentToArray(Shipment $shipment): array
    {
        return $shipment->__toArray(true);
    }

    /**
     * @param  array<int, mixed>  $rates
     * @return array<int, array<string, mixed>>
     */
    private function normalizeRatesForApi(array $rates): array
    {
        $out = [];
        foreach ($rates as $rate) {
            if (! is_array($rate)) {
                continue;
            }
            $out[] = [
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

        return $out;
    }

    /**
     * @param  array<int, mixed>  $messages
     * @return array<int, array<string, mixed>>
     */
    private function normalizeMessagesForApi(array $messages): array
    {
        $out = [];
        foreach ($messages as $message) {
            if (! is_array($message)) {
                continue;
            }
            $out[] = [
                'carrier' => $message['carrier'] ?? null,
                'carrier_account_id' => $message['carrier_account_id'] ?? null,
                'type' => $message['type'] ?? null,
                'message' => $message['message'] ?? null,
            ];
        }

        return $out;
    }

    /**
     * Reference-only addresses (`id` = adr_…) are passed through to the shipment as-is.
     * Full addresses optionally go through EasyPost verification when enabled.
     *
     * @see https://docs.easypost.com/docs/addresses
     *
     * @return array{0: array<string, mixed>, 1: array<string, mixed>}
     */
    private function prepareAddresses(ShippingLabelPayload $payload, EasyPostClient $client): array
    {
        return [
            $this->prepareSingleAddress($client, $payload->fromAddress, 'From address'),
            $this->prepareSingleAddress($client, $payload->toAddress, 'To address'),
        ];
    }

    /**
     * @param  array<string, mixed>  $address
     * @return array<string, mixed>
     */
    private function prepareSingleAddress(EasyPostClient $client, array $address, string $label): array
    {
        if ($this->isEasyPostAddressReference($address)) {
            return ['id' => $address['id']];
        }

        if (config('services.easypost.verify_addresses')) {
            return $this->verifyAndNormalizeAddress($client, $address, $label);
        }

        return $address;
    }

    /**
     * @param  array<string, mixed>  $address
     */
    private function isEasyPostAddressReference(array $address): bool
    {
        $id = $address['id'] ?? null;
        if (! is_string($id) || preg_match('/^adr_[A-Za-z0-9]+$/', $id) === 0) {
            return false;
        }

        return count($address) === 1;
    }

    /**
     * @param  array<string, mixed>  $address
     * @return array<string, mixed>
     */
    private function verifyAndNormalizeAddress(EasyPostClient $client, array $address, string $label): array
    {
        $params = array_merge($address, ['verify' => true]);

        $verified = $client->address->create($params);

        if (! $this->deliveryVerificationSucceeded($verified)) {
            $detail = $this->firstVerificationErrorMessage($verified) ?? 'Address could not be verified for delivery.';
            throw new UnprocessableEntityHttpException("{$label}: {$detail}");
        }

        return $this->addressToRequestArray($verified);
    }

    private function deliveryVerificationSucceeded(mixed $address): bool
    {
        $verifications = is_object($address) ? ($address->verifications ?? null) : null;
        if (! is_object($verifications)) {
            return false;
        }

        $delivery = $verifications->delivery ?? null;

        return is_object($delivery) && ($delivery->success ?? false) === true;
    }

    private function firstVerificationErrorMessage(mixed $address): ?string
    {
        $verifications = is_object($address) ? ($address->verifications ?? null) : null;
        if (! is_object($verifications)) {
            return null;
        }

        $delivery = $verifications->delivery ?? null;
        if (! is_object($delivery) || empty($delivery->errors)) {
            return null;
        }

        $first = $delivery->errors[0] ?? null;
        if (is_object($first)) {
            return (string) ($first->message ?? null);
        }
        if (is_array($first)) {
            return (string) ($first['message'] ?? null);
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function addressToRequestArray(mixed $address): array
    {
        $keys = ['name', 'company', 'street1', 'street2', 'city', 'state', 'zip', 'country', 'phone', 'email'];
        $out = [];
        foreach ($keys as $key) {
            if (! is_object($address)) {
                break;
            }
            $value = $address->$key ?? null;
            if ($value !== null && $value !== '') {
                $out[$key] = $value;
            }
        }

        return $out;
    }
}
