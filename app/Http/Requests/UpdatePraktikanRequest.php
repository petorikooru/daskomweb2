<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePraktikanRequest extends FormRequest
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
        $praktikanId = $this->route('praktikan') ?? $this->route('id');

        return [
            'nama' => ['required', 'string', 'max:255'],
            'nim' => ['required', 'string', 'max:12', Rule::unique('praktikans', 'nim')->ignore($praktikanId)],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('praktikans', 'email')->ignore($praktikanId)],
            'nomor_telepon' => ['required', 'string', 'max:15'],
            'alamat' => ['required', 'string'],
            'kelas_id' => ['required', 'integer', 'exists:kelas,id'],
            'dk' => ['required', 'string', 'in:DK1,DK2'],
            'password' => ['nullable', 'string', 'min:8'],
        ];
    }
}
