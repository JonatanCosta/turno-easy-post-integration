<?php

namespace Tests\Unit;

use App\Models\Plan;
use App\Models\User;
use App\Repositories\Contracts\ShippingLabelRepositoryInterface;
use App\Services\PlanLimitService;
use Mockery;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class PlanLimitServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_assert_within_limit_allows_when_under_cap(): void
    {
        $repo = Mockery::mock(ShippingLabelRepositoryInterface::class);
        $repo->shouldReceive('countForUserInCurrentMonth')->once()->with(1)->andReturn(3);

        $plan = new Plan(['monthly_label_limit' => 10]);
        $plan->id = 1;

        $user = new User;
        $user->id = 1;
        $user->setRelation('plan', $plan);

        $service = new PlanLimitService($repo);
        $service->assertWithinLimit($user);

        $this->assertTrue(true);
    }

    public function test_assert_within_limit_aborts_when_at_cap(): void
    {
        $this->expectException(HttpException::class);

        $repo = Mockery::mock(ShippingLabelRepositoryInterface::class);
        $repo->shouldReceive('countForUserInCurrentMonth')->once()->with(1)->andReturn(10);

        $plan = new Plan(['monthly_label_limit' => 10]);
        $plan->id = 1;

        $user = new User;
        $user->id = 1;
        $user->setRelation('plan', $plan);

        $service = new PlanLimitService($repo);
        $service->assertWithinLimit($user);
    }
}
