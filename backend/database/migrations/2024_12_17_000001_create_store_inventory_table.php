<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Store inventory table for requisition management system.
     * Tracks all items available in the store for staff requisitions.
     */
    public function up(): void
    {
        Schema::create('store_inventory', function (Blueprint $table) {
            $table->id();
            
            // Item identification
            $table->string('code', 50)->unique()->comment('Unique item code (e.g., OFF-001)');
            $table->string('name')->comment('Item name');
            $table->string('category', 100)->comment('Category (Office Supplies, IT Equipment, Facilities)');
            $table->text('description')->nullable()->comment('Detailed item description');
            
            // Stock management
            $table->integer('total_stock')->default(0)->comment('Total quantity in stock');
            $table->integer('available_stock')->default(0)->comment('Available for requisition (total - reserved)');
            $table->integer('reserved_stock')->default(0)->comment('Reserved for approved requisitions');
            
            // Pricing and location
            $table->decimal('unit_price', 10, 2)->comment('Price per unit in Naira');
            $table->string('location', 100)->nullable()->comment('Physical storage location (e.g., Shelf A-3)');
            
            // Tracking
            $table->date('last_restocked')->nullable()->comment('Date of last restock');
            $table->boolean('is_active')->default(true)->comment('Is item active/available');
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index('category');
            $table->index('is_active');
            $table->index(['available_stock', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_inventory');
    }
};
