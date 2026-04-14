<?php

declare(strict_types=1);

/*
| PHPUnit applies phpunit.xml <env> to putenv/$_ENV but not to $_SERVER. Docker Compose
| injects DB_* into the PHP process, so $_SERVER['DB_CONNECTION'] can stay "pgsql" while
| getenv() is "sqlite" — Laravel's Env layer may still resolve the real database and
| RefreshDatabase would wipe it. Pin the same values on all three stores before autoload.
*/
$testingEnv = [
    'APP_ENV' => 'testing',
    'DB_CONNECTION' => 'sqlite',
    'DB_DATABASE' => ':memory:',
    'DB_URL' => '',
    'CACHE_STORE' => 'array',
    'SESSION_DRIVER' => 'array',
    'QUEUE_CONNECTION' => 'sync',
];

foreach ($testingEnv as $key => $value) {
    putenv("{$key}={$value}");
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
}

require dirname(__DIR__).'/vendor/autoload.php';
