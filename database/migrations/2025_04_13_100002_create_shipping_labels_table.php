<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipping_labels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('integration_key', 64);
            $table->json('from_address');
            $table->json('to_address');
            $table->json('parcel');
            $table->string('carrier')->nullable();
            $table->string('service')->nullable();
            $table->string('tracking_code')->nullable();
            $table->text('label_url')->nullable();
            $table->string('external_shipment_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipping_labels');
    }
};
