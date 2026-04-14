<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            ['name' => 'Free', 'slug' => 'free', 'monthly_label_limit' => 10],
            ['name' => 'Pro', 'slug' => 'pro', 'monthly_label_limit' => 100],
            ['name' => 'Unlimited', 'slug' => 'unlimited', 'monthly_label_limit' => null],
        ];

        foreach ($plans as $plan) {
            Plan::query()->updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }
    }
}
