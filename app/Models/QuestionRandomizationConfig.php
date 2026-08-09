<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionRandomizationConfig extends Model
{
    protected $fillable = ['modul_id', 'category', 'easy_count', 'medium_count', 'hard_count', 'enabled'];
    protected $casts = ['enabled' => 'boolean', 'easy_count' => 'integer', 'medium_count' => 'integer', 'hard_count' => 'integer'];
}
