<?php

namespace App\Models;

use Database\Factories\UserShippingIntegrationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserShippingIntegration extends Model
{
    use HasFactory;

    public const PROVIDER_EASYPOST = 'easypost';

    protected $fillable = [
        'user_id',
        'provider',
        'api_key',
    ];

    protected function casts(): array
    {
        return [
            'api_key' => 'encrypted',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected static function newFactory(): UserShippingIntegrationFactory
    {
        return UserShippingIntegrationFactory::new();
    }
}
