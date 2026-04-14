<?php

namespace App\Repositories\Eloquent;

use App\Data\ShippingLabelPayload;
use App\Data\ShippingLabelResult;
use App\Models\ShippingLabel;
use App\Models\ShippingLabelStatus;
use App\Models\User;
use App\Repositories\Contracts\ShippingLabelRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class ShippingLabelRepository implements ShippingLabelRepositoryInterface
{
    public function countForUserInCurrentMonth(int $userId): int
    {
        $completedId = ShippingLabelStatus::query()
            ->where('slug', ShippingLabelStatus::SLUG_COMPLETED)
            ->value('id');

        if ($completedId === null) {
            return 0;
        }

        return ShippingLabel::query()
            ->where('user_id', $userId)
            ->where('status_id', $completedId)
            ->whereBetween('created_at', [
                now()->startOfMonth(),
                now()->endOfMonth(),
            ])
            ->count();
    }

    public function createPending(User $user, ShippingLabelPayload $payload): ShippingLabel
    {
        $pendingId = ShippingLabelStatus::query()
            ->where('slug', ShippingLabelStatus::SLUG_PENDING)
            ->firstOrFail()
            ->id;

        return ShippingLabel::query()->create([
            'user_id' => $user->id,
            'status_id' => $pendingId,
            'integration_key' => $payload->integrationKey,
            'from_address' => $payload->fromAddress,
            'to_address' => $payload->toAddress,
            'parcel' => $payload->parcel,
            'carrier' => null,
            'service' => null,
            'tracking_code' => null,
            'label_url' => null,
            'external_shipment_id' => null,
            'last_error' => null,
        ]);
    }

    public function markRated(ShippingLabel $label, string $externalShipmentId, array $snapshot): void
    {
        $ratedId = ShippingLabelStatus::query()
            ->where('slug', ShippingLabelStatus::SLUG_RATED)
            ->firstOrFail()
            ->id;

        $label->forceFill([
            'status_id' => $ratedId,
            'external_shipment_id' => $externalShipmentId,
            'quote_snapshot' => $snapshot,
            'last_error' => null,
        ])->save();
    }

    public function markProcessing(ShippingLabel $label): void
    {
        $processingId = ShippingLabelStatus::query()
            ->where('slug', ShippingLabelStatus::SLUG_PROCESSING)
            ->firstOrFail()
            ->id;

        $label->forceFill([
            'status_id' => $processingId,
            'last_error' => null,
        ])->save();
    }

    public function markCompleted(ShippingLabel $label, ShippingLabelResult $result): void
    {
        $completedId = ShippingLabelStatus::query()
            ->where('slug', ShippingLabelStatus::SLUG_COMPLETED)
            ->firstOrFail()
            ->id;

        $label->forceFill([
            'status_id' => $completedId,
            'carrier' => $result->carrier,
            'service' => $result->service,
            'tracking_code' => $result->trackingCode,
            'label_url' => $result->labelUrl,
            'external_shipment_id' => $result->externalShipmentId,
            'last_error' => null,
        ])->save();
    }

    public function markFailed(ShippingLabel $label, string $message): void
    {
        $failedId = ShippingLabelStatus::query()
            ->where('slug', ShippingLabelStatus::SLUG_FAILED)
            ->firstOrFail()
            ->id;

        $label->forceFill([
            'status_id' => $failedId,
            'last_error' => Str::limit($message, 2000),
        ])->save();
    }

    public function paginateForUser(int $userId, int $perPage = 15): LengthAwarePaginator
    {
        return ShippingLabel::query()
            ->where('user_id', $userId)
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function findForUser(int $labelId, int $userId): ?ShippingLabel
    {
        return ShippingLabel::query()
            ->where('id', $labelId)
            ->where('user_id', $userId)
            ->first();
    }
}
