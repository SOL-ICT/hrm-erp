<?php

namespace App\Console\Commands;

use App\Services\SafeFormulaCalculator;
use Illuminate\Console\Command;
use Exception;

class TestFormulaCalculator extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'formula:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the SafeFormulaCalculator service';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $calculator = new SafeFormulaCalculator();

        $this->info('🧮 Testing SafeFormulaCalculator');
        $this->info('================================');

        // Test 1: Basic arithmetic
        try {
            $result = $calculator->evaluate('5 + 3 * 2');
            $this->line("✅ Basic math (5 + 3 * 2): {$result}");
        } catch (Exception $e) {
            $this->error("❌ Basic math failed: {$e->getMessage()}");
        }

        // Test 2: Variables
        try {
            $result = $calculator->evaluate('BASIC_SALARY + HOUSING', [
                'BASIC_SALARY' => 100000,
                'HOUSING' => 50000
            ]);
            $this->line("✅ Variables (BASIC_SALARY + HOUSING): {$result}");
        } catch (Exception $e) {
            $this->error("❌ Variables test failed: {$e->getMessage()}");
        }

        // Test 3: Percentage
        try {
            $result = $calculator->evaluate('8% * SALARY', ['SALARY' => 100000]);
            $this->line("✅ Percentage (8% * SALARY): {$result}");
        } catch (Exception $e) {
            $this->error("❌ Percentage test failed: {$e->getMessage()}");
        }

        // Test 4: SUM function
        try {
            $result = $calculator->evaluate('SUM([10000, 20000, 30000])');
            $this->line("✅ SUM function: {$result}");
        } catch (Exception $e) {
            $this->error("❌ SUM function failed: {$e->getMessage()}");
        }

        // Test 5: Complex formula
        try {
            $result = $calculator->evaluate('ROUND((BASIC_SALARY + HOUSING) * 8% / 12, 2)', [
                'BASIC_SALARY' => 144000,
                'HOUSING' => 56400
            ]);
            $this->line("✅ Complex formula: {$result}");
        } catch (Exception $e) {
            $this->error("❌ Complex formula failed: {$e->getMessage()}");
        }

        // Test 6: Security validation
        try {
            $calculator->evaluate('eval("rm -rf /")');
            $this->error("❌ Security test failed: Dangerous code was allowed");
        } catch (\InvalidArgumentException $e) {
            $this->line("✅ Security validation: Blocked dangerous code");
        }

        // Test 7: Formula validation
        $validation = $calculator->validateFormula('BASIC_SALARY + HOUSING + INVALID_VAR', [
            'BASIC_SALARY' => 100000,
            'HOUSING' => 50000
        ]);

        if (empty($validation)) {
            $this->error("❌ Validation test failed: Should have caught missing variable");
        } else {
            $this->line("✅ Formula validation: Caught issues - " . implode(', ', $validation));
        }

        // Test 8: Variable extraction
        $variables = $calculator->extractVariables('BASIC_SALARY + HOUSING + TRANSPORT_ALLOWANCE * 8%');
        $this->line("✅ Variable extraction: " . implode(', ', $variables));

        $this->newLine();
        $this->info('🎉 SafeFormulaCalculator tests completed!');

        return 0;
    }
}
