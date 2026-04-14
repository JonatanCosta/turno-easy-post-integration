<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipping_labels', function (Blueprint $table) {
            $table->json('quote_snapshot')->nullable()->after('external_shipment_id');
        });
    }

    public function down(): void
    {
        Schema::table('shipping_labels', function (Blueprint $table) {
            $table->dropColumn('quote_snapshot');
        });
    }
};
