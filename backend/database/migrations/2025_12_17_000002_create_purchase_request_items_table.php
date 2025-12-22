<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchase_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_request_id')->constrained('purchase_requests')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->nullable()->constrained('store_inventory')->nullOnDelete();
            
            // Item details (in case item doesn't exist in inventory)
            $table->string('item_name', 200);
            $table->string('item_category', 100)->nullable();
            $table->string('item_code', 50)->nullable();
            
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('total', 15, 2);
            $table->text('justification')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('purchase_request_id');
            $table->index('inventory_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_request_items');
    }
};
