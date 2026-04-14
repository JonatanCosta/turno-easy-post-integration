<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $connection = config('database.default');
        $database = config("database.connections.{$connection}.database");

        if ($connection !== 'sqlite' || $database !== ':memory:') {
            throw new RuntimeException(
                'Tests must use SQLite in-memory only. '
                ."Got connection [{$connection}] database [{$database}]. "
                .'If you use Docker, ensure phpunit.xml sets DB_CONNECTION and DB_DATABASE with force="true" '
                .'so compose env does not override them.'
            );
        }
    }
}
