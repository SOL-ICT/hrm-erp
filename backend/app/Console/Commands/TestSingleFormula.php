<?php

namespace App\Console\Commands;

use App\Services\SafeFormulaCalculator;
use Illuminate\Console\Command;

class TestSingleFormula extends Command
{
    protected $signature = 'test:formula {formula} {--variables=}';
    protected $description = 'Test a single formula with the SafeFormulaCalculator';

    public function handle()
    {
        $formula = $this->argument('formula');

        try {
            $calculator = new SafeFormulaCalculator();

            $this->info("Testing formula: {$formula}");

            // Test with fixed variables
            $variables = [
                'annual_division_factor' => 12,
                'basic_salary' => 100000,
                'housing' => 4700,
                'transport_allowance' => 4700
            ];

            $this->info("Variables: " . json_encode($variables));

            $result = $calculator->evaluate($formula, $variables);

            $this->line("✅ Result: {$result}");
        } catch (\Exception $e) {
            $this->error("❌ Error: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
