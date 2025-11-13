<?php

namespace App\Contracts;

interface FormulaCalculatorInterface
{
    /**
     * Safely evaluate a formula with given variables
     */
    public function evaluate(string $formula, array $variables = []): float;

    /**
     * Validate that a formula can be safely compiled
     */
    public function validateFormula(string $formula, array $sampleVariables = []): array;

    /**
     * Get list of variables used in a formula
     */
    public function extractVariables(string $formula): array;

    /**
     * Convert old eval-based formula to safe expression
     */
    public function convertLegacyFormula(string $legacyFormula): string;

    /**
     * Test formula with sample data and return calculation steps
     */
    public function testFormula(string $formula, array $variables): array;
}
