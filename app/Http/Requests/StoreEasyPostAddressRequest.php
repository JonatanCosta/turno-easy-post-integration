<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEasyPostAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $addr = $this->input('address');
        if (! is_array($addr)) {
            return;
        }
        $country = strtoupper((string) ($addr['country'] ?? ''));
        if (in_array($country, ['USA', 'UNITED STATES', 'UNITED STATES OF AMERICA'], true)) {
            $addr['country'] = 'US';
        }
        $this->merge(['address' => $addr]);
    }

    public function rules(): array
    {
        $countryRule = ['required', 'string', Rule::in(['US'])];
        $street = ['required', 'string', 'max:255'];
        $city = ['required', 'string', 'max:255'];
        $state = ['required', 'string', 'size:2'];
        $zip = ['required', 'string', 'max:10'];
        $addrLine = ['present', 'string', 'max:255'];

        return [
            'address' => ['required', 'array'],
            'address.name' => ['required', 'string', 'max:255'],
            'address.company' => ['required', 'string', 'max:255'],
            'address.street1' => $street,
            'address.street2' => $addrLine,
            'address.city' => $city,
            'address.state' => $state,
            'address.zip' => $zip,
            'address.country' => $countryRule,
            'address.phone' => ['required', 'string', 'max:32'],
            'address.email' => ['required', 'string', 'email', 'max:255'],
            'verify' => ['sometimes', 'boolean'],
        ];
    }
}
