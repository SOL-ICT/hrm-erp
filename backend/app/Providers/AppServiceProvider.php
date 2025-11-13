<?php

namespace App\Providers;

use App\Contracts\FormulaCalculatorInterface;
use App\Services\SafeFormulaCalculator;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind FormulaCalculatorInterface to SafeFormulaCalculator
        $this->app->bind(FormulaCalculatorInterface::class, SafeFormulaCalculator::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
