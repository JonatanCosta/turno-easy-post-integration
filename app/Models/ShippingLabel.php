<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShippingLabel extends Model
{
    protected $fillable = [
        'user_id',
        'status_id',
        'integration_key',
        'from_address',
        'to_address',
        'parcel',
        'carrier',
        'service',
        'tracking_code',
        'label_url',
        'external_shipment_id',
        'quote_snapshot',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'from_address' => 'array',
            'to_address' => 'array',
            'parcel' => 'array',
            'quote_snapshot' => 'array',
        ];
    }

    protected $with = [
        'status',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'quote_snapshot',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(ShippingLabelStatus::class, 'status_id');
    }
}
