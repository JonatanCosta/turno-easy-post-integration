<?php

namespace App\Repositories\Contracts;

use App\Data\ShippingLabelPayload;
use App\Data\ShippingLabelResult;
use App\Models\ShippingLabel;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ShippingLabelRepositoryInterface
{
    /**
     * Labels that count toward the monthly plan cap (successful purchases only).
     */
    public function countForUserInCurrentMonth(int $userId): int;

    public function createPending(User $user, ShippingLabelPayload $payload): ShippingLabel;

    /**
     * @param  array<string, mixed>  $snapshot
     */
    public function markRated(ShippingLabel $label, string $externalShipmentId, array $snapshot): void;

    public function markProcessing(ShippingLabel $label): void;

    public function markCompleted(ShippingLabel $label, ShippingLabelResult $result): void;

    public function markFailed(ShippingLabel $label, string $message): void;

    public function paginateForUser(int $userId, int $perPage = 15): LengthAwarePaginator;

    public function findForUser(int $labelId, int $userId): ?ShippingLabel;
}
