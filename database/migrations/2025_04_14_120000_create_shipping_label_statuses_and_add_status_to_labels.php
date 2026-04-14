<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipping_label_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 32)->unique();
            $table->string('name', 64);
            $table->timestamps();
        });

        Schema::table('shipping_labels', function (Blueprint $table) {
            $table->foreignId('status_id')->nullable()->after('user_id')->constrained('shipping_label_statuses');
            $table->text('last_error')->nullable()->after('external_shipment_id');
        });
    }

    public function down(): void
    {
        Schema::table('shipping_labels', function (Blueprint $table) {
            $table->dropForeign(['status_id']);
            $table->dropColumn(['status_id', 'last_error']);
        });

        Schema::dropIfExists('shipping_label_statuses');
    }
};
