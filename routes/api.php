<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EasyPostAddressController;
use App\Http\Controllers\Api\ShippingIntegrationController;
use App\Http\Controllers\Api\ShippingLabelController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:api')->group(function (): void {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/integrations/shipping', [ShippingIntegrationController::class, 'index']);
    Route::put('/integrations/shipping/easypost', [ShippingIntegrationController::class, 'updateEasyPost']);
    Route::delete('/integrations/shipping/easypost', [ShippingIntegrationController::class, 'destroyEasyPost']);
    Route::get('/integrations/shipping/easypost/addresses', [EasyPostAddressController::class, 'index']);
    Route::get('/integrations/shipping/easypost/addresses/{addressId}', [EasyPostAddressController::class, 'show']);
    Route::post('/integrations/shipping/easypost/addresses', [EasyPostAddressController::class, 'store']);
    Route::get('/shipping-labels', [ShippingLabelController::class, 'index']);
    Route::get('/shipping-labels/{shippingLabel}', [ShippingLabelController::class, 'show']);
    Route::post('/shipping-labels', [ShippingLabelController::class, 'store']);
    Route::post('/shipping-labels/{shippingLabel}/purchase', [ShippingLabelController::class, 'purchase']);
});
