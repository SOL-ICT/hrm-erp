<?php

namespace App\Services;

use App\Contracts\FormulaCalculatorInterface;
use Symfony\Component\ExpressionLanguage\ExpressionLanguage;
use Symfony\Component\ExpressionLanguage\SyntaxError;
use InvalidArgumentException;
use Exception;

class SafeFormulaCalculator implements FormulaCalculatorInterface
{
    private ExpressionLanguage $expressionLanguage;
    private array $allowedFunctions;
    private array $allowedVariables;

    public function __construct()
    {
        $this->expressionLanguage = new ExpressionLanguage();
        $this->initializeAllowedFunctions();
        $this->allowedVariables = [];
    }

    /**
     * Initialize safe mathematical functions
     */
    private function initializeAllowedFunctions(): void
    {
        $this->allowedFunctions = [
            'SUM',
            'AVERAGE',
            'MIN',
            'MAX',
            'ROUND',
            'FLOOR',
            'CEIL',
            'ABS',
            'SQRT',
            'POW',
            'LOG',
            'EXP'
        ];

        // Register SUM function
        $this->expressionLanguage->register('SUM', function ($values) {
            return sprintf('array_sum(%s)', $values);
        }, function ($arguments, $values) {
            if (!is_array($values)) {
                throw new InvalidArgumentException('SUM function requires an array of values');
            }
            return array_sum($values);
        });

        // Register AVERAGE function
        $this->expressionLanguage->register('AVERAGE', function ($values) {
            return sprintf('(array_sum(%s) / count(%s))', $values, $values);
        }, function ($arguments, $values) {
            if (!is_array($values) || empty($values)) {
                throw new InvalidArgumentException('AVERAGE function requires a non-empty array of values');
            }
            return array_sum($values) / count($values);
        });

        // Register MIN function
        $this->expressionLanguage->register('MIN', function ($values) {
            return sprintf('min(%s)', $values);
        }, function ($arguments, $values) {
            if (!is_array($values) || empty($values)) {
                throw new InvalidArgumentException('MIN function requires a non-empty array of values');
            }
            return min($values);
        });

        // Register MAX function
        $this->expressionLanguage->register('MAX', function ($values) {
            return sprintf('max(%s)', $values);
        }, function ($arguments, $values) {
            if (!is_array($values) || empty($values)) {
                throw new InvalidArgumentException('MAX function requires a non-empty array of values');
            }
            return max($values);
        });

        // Register ROUND function
        $this->expressionLanguage->register('ROUND', function ($value, $precision = '2') {
            return sprintf('round(%s, %s)', $value, $precision);
        }, function ($arguments, $value, $precision = 2) {
            return round($value, $precision);
        });

        // Register mathematical functions
        $this->registerMathFunctions();
    }

    /**
     * Register mathematical functions
     */
    private function registerMathFunctions(): void
    {
        // ABS function
        $this->expressionLanguage->register('ABS', function ($value) {
            return sprintf('abs(%s)', $value);
        }, function ($arguments, $value) {
            return abs($value);
        });

        // SQRT function
        $this->expressionLanguage->register('SQRT', function ($value) {
            return sprintf('sqrt(%s)', $value);
        }, function ($arguments, $value) {
            if ($value < 0) {
                throw new InvalidArgumentException('SQRT function requires non-negative value');
            }
            return sqrt($value);
        });

        // POW function
        $this->expressionLanguage->register('POW', function ($base, $exponent) {
            return sprintf('pow(%s, %s)', $base, $exponent);
        }, function ($arguments, $base, $exponent) {
            return pow($base, $exponent);
        });

        // FLOOR function
        $this->expressionLanguage->register('FLOOR', function ($value) {
            return sprintf('floor(%s)', $value);
        }, function ($arguments, $value) {
            return floor($value);
        });

        // CEIL function
        $this->expressionLanguage->register('CEIL', function ($value) {
            return sprintf('ceil(%s)', $value);
        }, function ($arguments, $value) {
            return ceil($value);
        });
    }

    /**
     * Safely evaluate a formula with given variables
     */
    public function evaluate(string $formula, array $variables = []): float
    {
        try {
            // Validate formula syntax and content
            $this->validateFormulaSecurity($formula);

            // Sanitize and validate variables
            $sanitizedVariables = $this->sanitizeVariables($variables);

            // Convert percentage notation (e.g., "10%" to 0.10)
            $processedFormula = $this->processPercentages($formula);

            // Process range notation (e.g., "BASIC_SALARY:HOUSING" to array)
            $processedFormula = $this->processRanges($processedFormula, $sanitizedVariables);

            // Evaluate the expression
            $result = $this->expressionLanguage->evaluate($processedFormula, $sanitizedVariables);

            // Ensure result is numeric
            if (!is_numeric($result)) {
                throw new InvalidArgumentException('Formula evaluation must result in a numeric value');
            }

            return (float) $result;
        } catch (SyntaxError $e) {
            throw new InvalidArgumentException("Formula syntax error: {$e->getMessage()}");
        } catch (Exception $e) {
            throw new InvalidArgumentException("Formula evaluation error: {$e->getMessage()}");
        }
    }

    /**
     * Validate formula for security and syntax (private method)
     */
    private function validateFormulaSecurity(string $formula): void
    {
        // Check for dangerous patterns
        $dangerousPatterns = [
            '/\beval\b/i',
            '/\bexec\b/i',
            '/\bsystem\b/i',
            '/\bshell_exec\b/i',
            '/\bpassthru\b/i',
            '/\bfile_get_contents\b/i',
            '/\bfile_put_contents\b/i',
            '/\bfopen\b/i',
            '/\bunlink\b/i',
            '/\bmkdir\b/i',
            '/\brmdir\b/i',
            '/\b__\b/',
            '/\$_/i',
            '/\bglobal\b/i',
        ];

        foreach ($dangerousPatterns as $pattern) {
            if (preg_match($pattern, $formula)) {
                throw new InvalidArgumentException('Formula contains dangerous operations');
            }
        }

        // Check formula length
        if (strlen($formula) > 1000) {
            throw new InvalidArgumentException('Formula is too long (max 1000 characters)');
        }

        // Validate parentheses are balanced
        if (substr_count($formula, '(') !== substr_count($formula, ')')) {
            throw new InvalidArgumentException('Formula has unbalanced parentheses');
        }
    }

    /**
     * Sanitize and validate variables
     */
    private function sanitizeVariables(array $variables): array
    {
        $sanitized = [];

        foreach ($variables as $name => $value) {
            // Validate variable name
            if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $name)) {
                throw new InvalidArgumentException("Invalid variable name: {$name}");
            }

            // Ensure value is numeric
            if (!is_numeric($value)) {
                throw new InvalidArgumentException("Variable {$name} must be numeric, got: " . gettype($value));
            }

            $sanitized[$name] = (float) $value;
        }

        return $sanitized;
    }

    /**
     * Convert percentage notation to decimal
     */
    private function processPercentages(string $formula): string
    {
        // Convert "10%" to "0.10", "7.5%" to "0.075", etc.
        return preg_replace_callback('/(\d+(?:\.\d+)?)%/', function ($matches) {
            return (string) ((float) $matches[1] / 100);
        }, $formula);
    }

    /**
     * Process range notation like "BASIC_SALARY:HOUSING"
     */
    private function processRanges(string $formula, array $variables): string
    {
        return preg_replace_callback('/([A-Z_]+):([A-Z_]+)/', function ($matches) use ($variables) {
            $startVar = $matches[1];
            $endVar = $matches[2];

            // Get all variables and find the range
            $varNames = array_keys($variables);
            $startIndex = array_search($startVar, $varNames);
            $endIndex = array_search($endVar, $varNames);

            if ($startIndex === false || $endIndex === false) {
                throw new InvalidArgumentException("Range variables {$startVar}:{$endVar} not found");
            }

            // Ensure proper order
            if ($startIndex > $endIndex) {
                [$startIndex, $endIndex] = [$endIndex, $startIndex];
            }

            // Extract range values
            $rangeVars = array_slice($varNames, $startIndex, $endIndex - $startIndex + 1);
            $rangeValues = array_map(function ($var) use ($variables) {
                return $variables[$var];
            }, $rangeVars);

            // Return as array notation for SUM function
            return '[' . implode(', ', $rangeValues) . ']';
        }, $formula);
    }

    /**
     * Validate that a formula can be safely compiled
     */
    public function validateFormula(string $formula, array $sampleVariables = []): array
    {
        $issues = [];

        try {
            // Try to compile the formula
            $this->expressionLanguage->compile($formula, array_keys($sampleVariables));

            // Try to evaluate with sample data
            if (!empty($sampleVariables)) {
                $this->evaluate($formula, $sampleVariables);
            }
        } catch (Exception $e) {
            $issues[] = $e->getMessage();
        }

        return $issues;
    }

    /**
     * Validate formula (throws exception if invalid)
     */
    public function validate(string $formula): void
    {
        // Validate formula syntax and security
        $this->validateFormulaSecurity($formula);

        try {
            // Try to compile the formula to check syntax
            $this->expressionLanguage->compile($formula, []);
        } catch (\Symfony\Component\ExpressionLanguage\SyntaxError $e) {
            throw new InvalidArgumentException("Formula syntax error: {$e->getMessage()}");
        } catch (Exception $e) {
            throw new InvalidArgumentException("Formula validation error: {$e->getMessage()}");
        }
    }

    /**
     * Get list of variables used in a formula
     */
    public function extractVariables(string $formula): array
    {
        // Extract variable names from formula
        preg_match_all('/\b[A-Z_][A-Z0-9_]*\b/', $formula, $matches);

        // Filter out function names
        $variables = array_diff($matches[0], $this->allowedFunctions);

        return array_unique($variables);
    }

    /**
     * Convert old eval-based formula to safe expression
     */
    public function convertLegacyFormula(string $legacyFormula): string
    {
        // Convert common patterns from old system
        $conversions = [
            // Convert SUM(A1:A10) style to SUM([...])
            '/SUM\(([A-Z_]+):([A-Z_]+)\)/' => 'SUM($1:$2)',

            // Convert percentage multiplications
            '/(\d+(?:\.\d+)?)%\s*\*\s*([A-Z_]+)/' => '($1/100) * $2',

            // Convert B32 style references to variable names
            '/\bB(\d+)\b/' => 'CELL_B$1',
            '/\bA(\d+)\b/' => 'CELL_A$1',

            // Convert basic math operators (already safe)
            // No conversion needed for +, -, *, /, ()
        ];

        $converted = $legacyFormula;
        foreach ($conversions as $pattern => $replacement) {
            $converted = preg_replace($pattern, $replacement, $converted);
        }

        return $converted;
    }

    /**
     * Test formula with sample data and return calculation steps
     */
    public function testFormula(string $formula, array $variables): array
    {
        $steps = [];

        try {
            $steps[] = [
                'step' => 'original_formula',
                'value' => $formula,
                'description' => 'Original formula'
            ];

            $processedFormula = $this->processPercentages($formula);
            if ($processedFormula !== $formula) {
                $steps[] = [
                    'step' => 'percentage_conversion',
                    'value' => $processedFormula,
                    'description' => 'After converting percentages'
                ];
            }

            $processedFormula = $this->processRanges($processedFormula, $variables);
            $steps[] = [
                'step' => 'range_processing',
                'value' => $processedFormula,
                'description' => 'After processing ranges'
            ];

            $result = $this->expressionLanguage->evaluate($processedFormula, $variables);
            $steps[] = [
                'step' => 'final_result',
                'value' => $result,
                'description' => 'Final calculated result'
            ];

            return [
                'success' => true,
                'result' => (float) $result,
                'steps' => $steps
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'steps' => $steps
            ];
        }
    }
}
