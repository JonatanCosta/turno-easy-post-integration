<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShippingLabelStatus extends Model
{
    public const SLUG_PENDING = 'pending';

    public const SLUG_RATED = 'rated';

    public const SLUG_PROCESSING = 'processing';

    public const SLUG_COMPLETED = 'completed';

    public const SLUG_FAILED = 'failed';

    protected $fillable = [
        'slug',
        'name',
    ];

    public function shippingLabels(): HasMany
    {
        return $this->hasMany(ShippingLabel::class, 'status_id');
    }
}
