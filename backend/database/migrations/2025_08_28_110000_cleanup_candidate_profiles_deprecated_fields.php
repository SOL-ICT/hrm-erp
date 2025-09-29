<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            // Remove legacy fields that are now redundant due to state_lga_id approach
            
            // These text-based fields are replaced by state_lga_id (permanent) and current_address_state_lga_id (current)
            // Keeping them for now to maintain compatibility during transition
            // Remove these in a future version after data migration is complete
            
            /*
            $table->dropColumn([
                'state_of_residence',           // Legacy - replaced by current_address_state_lga_id
                'local_government_residence',   // Legacy - replaced by current_address_state_lga_id
                'state_of_residence_permanent', // Redundant - state info available via state_lga_id
                'local_government_residence_permanent', // Redundant - LGA info available via state_lga_id  
                'state_of_residence_current',   // Redundant - state info available via current_address_state_lga_id
                'local_government_residence_current', // Redundant - LGA info available via current_address_state_lga_id
            ]);
            */
            
            // For now, just add a comment to the table indicating these fields are deprecated
            // This will be a reminder for future cleanup
        });
    }

    public function down(): void
    {
        // No changes made in up() method, so nothing to rollback
    }
};
