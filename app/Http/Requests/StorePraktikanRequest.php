<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePraktikanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth('asisten')->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:255'],
            'nim' => ['required', 'string', 'max:12', 'unique:praktikans,nim'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:praktikans,email'],
            'nomor_telepon' => ['required', 'string', 'max:15'],
            'alamat' => ['required', 'string'],
            'kelas_id' => ['required', 'integer', 'exists:kelas,id'],
            'dk' => ['required', 'string', 'in:DK1,DK2'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }
}
