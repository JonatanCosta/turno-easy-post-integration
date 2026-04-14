<?php

use Illuminate\Support\Facades\Route;

Route::view('/', 'app');

Route::fallback(function () {
    return view('app');
});
