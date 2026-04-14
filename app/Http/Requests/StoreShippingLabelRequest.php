<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreShippingLabelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach (['from_address', 'to_address'] as $key) {
            $addr = $this->input($key);
            if (! is_array($addr)) {
                continue;
            }
            $id = $addr['id'] ?? null;
            if (is_string($id) && preg_match('/^adr_[A-Za-z0-9]+$/', $id) === 1) {
                $this->merge([$key => ['id' => $id]]);

                continue;
            }
            $country = strtoupper((string) ($addr['country'] ?? ''));
            if (in_array($country, ['USA', 'UNITED STATES', 'UNITED STATES OF AMERICA'], true)) {
                $addr['country'] = 'US';
            }
            $this->merge([$key => $addr]);
        }
    }

    public function rules(): array
    {
        $countryRule = ['required', 'string', Rule::in(['US'])];
        $street = ['required', 'string', 'max:255'];
        $city = ['required', 'string', 'max:255'];
        $state = ['required', 'string', 'size:2'];
        $zip = ['required', 'string', 'max:10'];
        $addrLine = ['present', 'string', 'max:255'];

        $fullFrom = $this->isFullAddress($this->input('from_address'));
        $fullTo = $this->isFullAddress($this->input('to_address'));

        $rules = [
            'integration_key' => ['required', 'string', Rule::in(['easypost'])],
            'from_address' => ['required', 'array'],
            'to_address' => ['required', 'array'],
            'parcel' => ['required', 'array'],
            'parcel.length' => ['required', 'numeric', 'min:0.01'],
            'parcel.width' => ['required', 'numeric', 'min:0.01'],
            'parcel.height' => ['required', 'numeric', 'min:0.01'],
            'parcel.weight' => ['required', 'numeric', 'min:0.01'],
        ];

        if ($fullFrom) {
            $rules = array_merge($rules, [
                'from_address.name' => ['required', 'string', 'max:255'],
                'from_address.company' => ['required', 'string', 'max:255'],
                'from_address.street1' => $street,
                'from_address.street2' => $addrLine,
                'from_address.city' => $city,
                'from_address.state' => $state,
                'from_address.zip' => $zip,
                'from_address.country' => $countryRule,
                'from_address.phone' => ['required', 'string', 'max:32'],
                'from_address.email' => ['required', 'string', 'email', 'max:255'],
            ]);
        } else {
            $rules['from_address.id'] = ['required', 'string', 'regex:/^adr_[A-Za-z0-9]+$/'];
        }

        if ($fullTo) {
            $rules = array_merge($rules, [
                'to_address.name' => ['required', 'string', 'max:255'],
                'to_address.company' => ['required', 'string', 'max:255'],
                'to_address.street1' => $street,
                'to_address.street2' => $addrLine,
                'to_address.city' => $city,
                'to_address.state' => $state,
                'to_address.zip' => $zip,
                'to_address.country' => $countryRule,
                'to_address.phone' => ['required', 'string', 'max:32'],
                'to_address.email' => ['required', 'string', 'email', 'max:255'],
            ]);
        } else {
            $rules['to_address.id'] = ['required', 'string', 'regex:/^adr_[A-Za-z0-9]+$/'];
        }

        return $rules;
    }

    /**
     * @param  array<string, mixed>|null  $address
     */
    private function isFullAddress(?array $address): bool
    {
        if (! is_array($address)) {
            return false;
        }
        $id = $address['id'] ?? null;
        if (is_string($id) && preg_match('/^adr_[A-Za-z0-9]+$/', $id) === 1 && count($address) === 1) {
            return false;
        }

        return true;
    }
}
