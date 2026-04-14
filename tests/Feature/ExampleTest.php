<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_health_endpoint_returns_successful_response(): void
    {
        $response = $this->get('/up');

        $response->assertSuccessful();
    }

    public function test_root_serves_spa_shell(): void
    {
        $response = $this->get('/');

        $response->assertSuccessful();
        $response->assertSee('id="app"', false);
    }
}
