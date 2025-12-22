<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Staff requisition items table.
     * Individual items within each requisition request.
     */
    public function up(): void
    {
        Schema::create('staff_requisition_items', function (Blueprint $table) {
            $table->id();
            
            // Relationships
            $table->foreignId('requisition_id')
                  ->constrained('staff_requisitions')
                  ->onDelete('cascade')
                  ->comment('Parent requisition');
            $table->foreignId('inventory_item_id')
                  ->constrained('store_inventory')
                  ->comment('Inventory item being requested');
            
            // Item details
            $table->integer('quantity')->comment('Quantity requested');
            $table->text('purpose')->comment('Why this item is needed');
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index('requisition_id');
            $table->index('inventory_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_requisition_items');
    }
};
