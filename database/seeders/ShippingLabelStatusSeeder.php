<?php

namespace Database\Seeders;

use App\Models\ShippingLabel;
use App\Models\ShippingLabelStatus;
use Illuminate\Database\Seeder;

class ShippingLabelStatusSeeder extends Seeder
{
    public function run(): void
    {
        $definitions = [
            ShippingLabelStatus::SLUG_PENDING => 'Pending',
            ShippingLabelStatus::SLUG_RATED => 'Awaiting rate selection',
            ShippingLabelStatus::SLUG_PROCESSING => 'Processing',
            ShippingLabelStatus::SLUG_COMPLETED => 'Completed',
            ShippingLabelStatus::SLUG_FAILED => 'Failed',
        ];

        foreach ($definitions as $slug => $name) {
            ShippingLabelStatus::query()->updateOrCreate(
                ['slug' => $slug],
                ['name' => $name],
            );
        }

        $completedId = ShippingLabelStatus::query()
            ->where('slug', ShippingLabelStatus::SLUG_COMPLETED)
            ->value('id');

        if ($completedId !== null) {
            ShippingLabel::query()->whereNull('status_id')->update(['status_id' => $completedId]);
        }
    }
}
