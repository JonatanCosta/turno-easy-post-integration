<?php

namespace App\Services;

use App\Data\ShippingLabelPayload;
use App\Integrations\Shipping\EasyPost\EasyPostShippingIntegration;
use App\Integrations\Shipping\IntegrationResolver;
use App\Models\ShippingLabel;
use App\Models\ShippingLabelStatus;
use App\Models\User;
use App\Models\UserShippingIntegration;
use App\Repositories\Contracts\ShippingLabelRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class ShippingLabelService
{
    public function __construct(
        private PlanLimitService $planLimits,
        private IntegrationResolver $integrations,
        private ShippingLabelRepositoryInterface $shippingLabels,
    ) {}

    public function paginateForUser(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->shippingLabels->paginateForUser($userId, $perPage);
    }

    public function findForUser(int $labelId, User $user): ?ShippingLabel
    {
        return $this->shippingLabels->findForUser($labelId, $user->id);
    }

    public function createQuotedLabelForUser(User $user, ShippingLabelPayload $payload): ShippingLabel
    {
        if ($payload->integrationKey === UserShippingIntegration::PROVIDER_EASYPOST) {
            $hasKey = UserShippingIntegration::query()
                ->where('user_id', $user->id)
                ->where('provider', UserShippingIntegration::PROVIDER_EASYPOST)
                ->exists();
            if (! $hasKey) {
                abort(422, 'Configure your EasyPost integration before creating labels.');
            }
        }

        $this->planLimits->assertWithinLimit($user);

        $label = $this->shippingLabels->createPending($user, $payload);

        try {
            $integration = $this->integrations->resolve($payload->integrationKey);
            $quote = $integration->quote($payload);
            $this->shippingLabels->markRated($label, $quote->externalShipmentId, $quote->shipmentSnapshot);
            $label->refresh();
            if ($integration instanceof EasyPostShippingIntegration) {
                $integration->consolidateQuotedLabelAddresses($user->id, $label);
            }
        } catch (\Throwable $e) {
            $this->shippingLabels->markFailed($label, $e->getMessage());
            throw $e;
        }

        return $label->fresh(['status']);
    }

    public function purchaseLabel(User $user, int $labelId, string $rateId): ShippingLabel
    {
        $label = $this->shippingLabels->findForUser($labelId, $user->id);
        if ($label === null) {
            abort(404);
        }

        $label->load('status');
        if ($label->status->slug !== ShippingLabelStatus::SLUG_RATED) {
            abort(422, 'This label is not awaiting rate selection.');
        }

        if (! $this->rateIdBelongsToSnapshot($label, $rateId)) {
            throw new UnprocessableEntityHttpException('The selected rate is not valid for this shipment.');
        }

        $this->planLimits->assertWithinLimit($user);

        $this->shippingLabels->markProcessing($label);

        try {
            $integration = $this->integrations->resolve($label->integration_key);
            $result = $integration->purchase($user->id, (string) $label->external_shipment_id, $rateId);
            $label->refresh();
            $this->shippingLabels->markCompleted($label, $result);
        } catch (\Throwable $e) {
            $this->shippingLabels->markFailed($label, $e->getMessage());
            throw $e;
        }

        return $label->fresh(['status']);
    }

    public function markFailedById(int $shippingLabelId, string $message): void
    {
        $label = ShippingLabel::query()->findOrFail($shippingLabelId);
        $this->shippingLabels->markFailed($label, $message);
    }

    private function rateIdBelongsToSnapshot(ShippingLabel $label, string $rateId): bool
    {
        $snapshot = $label->quote_snapshot;
        if (! is_array($snapshot)) {
            return false;
        }

        foreach ($snapshot['rates'] ?? [] as $rate) {
            if (is_array($rate) && ($rate['id'] ?? null) === $rateId) {
                return true;
            }
        }

        return false;
    }
}
