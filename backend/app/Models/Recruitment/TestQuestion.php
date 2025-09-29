<?php

namespace App\Models\Recruitment;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TestQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'test_id',
        'question',
        'type',
        'options',
        'correct_answers',
        'points',
        'order_number',
        'required',
    ];

    protected $casts = [
        'options' => 'array',
        'correct_answers' => 'array',
        'required' => 'boolean',
        'points' => 'decimal:2',
    ];

    /**
     * Get the test that owns this question
     */
    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }

    /**
     * Check if given answer is correct
     */
    public function isCorrectAnswer($answer)
    {
        if ($this->question_type === 'multiple_choice') {
            return strtoupper($answer) === strtoupper($this->correct_answer);
        }
        
        if ($this->question_type === 'true_false') {
            return strtolower($answer) === strtolower($this->correct_answer);
        }
        
        // For text answers, you might want to implement fuzzy matching
        return strtolower(trim($answer)) === strtolower(trim($this->correct_answer));
    }

    /**
     * Get formatted options for display
     */
    public function getFormattedOptionsAttribute()
    {
        if ($this->question_type === 'multiple_choice' && is_array($this->options)) {
            return collect($this->options)->map(function ($option, $index) {
                return [
                    'key' => chr(65 + $index), // A, B, C, D
                    'value' => $option,
                    'is_correct' => $this->correct_answer === chr(65 + $index)
                ];
            })->toArray();
        }
        
        return $this->options;
    }

    /**
     * Scope for questions by type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('question_type', $type);
    }

    /**
     * Scope for required questions
     */
    public function scopeRequired($query)
    {
        return $query->where('is_required', true);
    }

    /**
     * Scope for ordered questions
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order_number');
    }
}
