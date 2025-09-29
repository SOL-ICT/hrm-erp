<?php

namespace App\Models\Recruitment;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;
use App\Models\Candidate;

class TestResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'test_assignment_id',
        'test_id',
        'candidate_id',
        'answers',
        'score',
        'total_questions',
        'correct_answers',
        'score_percentage',
        'passed',
        'time_taken', // Match database field name
        'started_at', // Add missing field
        'completed_at', // Add missing field  
        'auto_submitted',
        'review_data',
        'result_status',
        'question_results',
    ];

    protected $casts = [
        'answers' => 'array',
        'review_data' => 'array',
        'question_results' => 'array',
        'passed' => 'boolean',
        'auto_submitted' => 'boolean',
        'score_percentage' => 'decimal:2',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Get the test assignment for this result
     */
    public function assignment(): BelongsTo
    {
        return $this->belongsTo(TestAssignment::class, 'test_assignment_id');
    }

    /**
     * Get the candidate for this result
     */
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    /**
     * Get the test for this result
     */
    public function test(): BelongsTo
    {
        return $this->belongsTo(Test::class);
    }

    /**
     * Check if the candidate passed the test
     */
    public function getPassedAttribute(): bool
    {
        return $this->result_status === 'passed';
    }

    /**
     * Check if the candidate failed the test
     */
    public function getFailedAttribute(): bool
    {
        return $this->result_status === 'failed';
    }

    /**
     * Get formatted time taken
     */
    public function getFormattedTimeTakenAttribute(): string
    {
        if (!$this->time_taken) return 'N/A';
        
        $hours = floor($this->time_taken / 60);
        $minutes = $this->time_taken % 60;
        
        if ($hours > 0) {
            return "{$hours}h {$minutes}m";
        }
        
        return "{$minutes}m";
    }

    /**
     * Get accuracy rate
     */
    public function getAccuracyAttribute(): float
    {
        if ($this->total_questions === 0) return 0;
        
        return round(($this->correct_answers / $this->total_questions) * 100, 2);
    }

    /**
     * Get grade letter based on score
     */
    public function getGradeAttribute(): string
    {
        $score = $this->score_percentage;
        
        if ($score >= 90) return 'A+';
        if ($score >= 85) return 'A';
        if ($score >= 80) return 'A-';
        if ($score >= 75) return 'B+';
        if ($score >= 70) return 'B';
        if ($score >= 65) return 'B-';
        if ($score >= 60) return 'C+';
        if ($score >= 55) return 'C';
        if ($score >= 50) return 'C-';
        if ($score >= 45) return 'D+';
        if ($score >= 40) return 'D';
        
        return 'F';
    }

    /**
     * Calculate and set the result status based on pass score
     */
    public function calculateResultStatus(): void
    {
        $passScore = $this->test->pass_score;
        $this->result_status = $this->score_percentage >= $passScore ? 'passed' : 'failed';
        $this->save();
    }

    /**
     * Scope for passed results
     */
    public function scopePassed($query)
    {
        return $query->where('result_status', 'passed');
    }

    /**
     * Scope for failed results
     */
    public function scopeFailed($query)
    {
        return $query->where('result_status', 'failed');
    }

    /**
     * Scope for results above certain score
     */
    public function scopeAboveScore($query, $score)
    {
        return $query->where('score_percentage', '>=', $score);
    }

    /**
     * Scope for recent results
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('completed_at', '>=', now()->subDays($days));
    }

    /**
     * Calculate and update the test scores based on answers
     */
    public function calculateScores()
    {
        try {
            if (!$this->test_assignment_id || !$this->answers) {
                Log::warning("TestResult {$this->id}: No assignment ID or answers");
                return false;
            }

            // Load the test assignment with questions
            $assignment = $this->assignment()->with('test.questions')->first();
            if (!$assignment || !$assignment->test) {
                Log::warning("TestResult {$this->id}: No assignment or test found");
                return false;
            }

            $questions = $assignment->test->questions;
            $candidateAnswers = $this->answers;
            
            if ($questions->isEmpty()) {
                Log::warning("TestResult {$this->id}: No questions found");
                return false;
            }
            
            $totalQuestions = $questions->count();
            $correctAnswers = 0;
            $questionResults = [];

            foreach ($questions as $question) {
                $questionId = (string)$question->id;
                $candidateAnswer = $candidateAnswers[$questionId] ?? null;
                
                // Parse correct answers (could be stored as JSON string or array)
                $correctAnswersData = $question->correct_answers;
                if (is_string($correctAnswersData)) {
                    $correctAnswersData = json_decode($correctAnswersData, true);
                }
                
                if (!is_array($correctAnswersData) || empty($correctAnswersData)) {
                    Log::warning("TestResult {$this->id}: Invalid correct answers for question {$questionId}");
                    continue;
                }

                $isCorrect = false;
                
                // Handle hybrid format: Admin stores letters (A,B,C,D), frontend submits numbers (0,1,2,3)
                if ($candidateAnswer !== null) {
                    // Convert candidate's numeric answer to letter format for comparison
                    $candidateLetterAnswer = null;
                    if (is_numeric($candidateAnswer)) {
                        $candidateLetterAnswer = chr(65 + intval($candidateAnswer)); // 0->A, 1->B, 2->C, 3->D
                    }
                    
                    foreach ($correctAnswersData as $correctAnswer) {
                        // Check against letter format (A, B, C, D) - standard admin input
                        if (is_string($correctAnswer) && $candidateLetterAnswer === $correctAnswer) {
                            $isCorrect = true;
                            break;
                        }
                        // Check against numeric format (0, 1, 2, 3) - converted format
                        if (is_numeric($correctAnswer) && intval($candidateAnswer) === intval($correctAnswer)) {
                            $isCorrect = true;
                            break;
                        }
                        // Direct match for any other format
                        if ($candidateAnswer == $correctAnswer) {
                            $isCorrect = true;
                            break;
                        }
                    }
                }

                if ($isCorrect) {
                    $correctAnswers++;
                }

                // Store detailed question result for debugging
                $questionResults[] = [
                    'question_id' => $question->id,
                    'candidate_answer' => $candidateAnswer,
                    'candidate_letter' => isset($candidateLetterAnswer) ? $candidateLetterAnswer : null,
                    'correct_answers' => $correctAnswersData,
                    'is_correct' => $isCorrect,
                    'points' => $isCorrect ? ($question->points ?? 1) : 0
                ];
            }

            // Calculate percentage
            $scorePercentage = $totalQuestions > 0 ? ($correctAnswers / $totalQuestions) * 100 : 0;
            
            // Determine pass/fail based on test's pass score
            $passScore = $assignment->test->pass_score ?? 70;
            $resultStatus = $scorePercentage >= $passScore ? 'passed' : 'failed';

            // Update the result
            $this->update([
                'total_questions' => $totalQuestions,
                'correct_answers' => $correctAnswers,
                'score_percentage' => round($scorePercentage, 2),
                'result_status' => $resultStatus,
                'question_results' => $questionResults
            ]);

            Log::info("TestResult {$this->id}: Score calculated - {$correctAnswers}/{$totalQuestions} ({$scorePercentage}%)");
            
            return true;

        } catch (\Exception $e) {
            Log::error("TestResult {$this->id}: Error calculating scores - " . $e->getMessage());
            return false;
        }
    }
}
