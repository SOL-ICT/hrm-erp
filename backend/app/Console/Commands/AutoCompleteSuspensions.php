<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\StaffSuspension;
use Carbon\Carbon;

class AutoCompleteSuspensions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'suspensions:auto-complete';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically complete active suspensions where the end date has elapsed';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::today()->toDateString();
        
        $updated = StaffSuspension::where('status', 'active')
            ->where('suspension_end_date', '<', $today)
            ->update(['status' => 'completed']);

        $this->info("Auto-completed {$updated} suspension(s).");
        
        return 0;
    }
}
