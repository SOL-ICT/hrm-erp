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
        Schema::create('procurement_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_request_id')->nullable()->constrained('purchase_requests')->nullOnDelete();
            $table->foreignId('inventory_item_id')->constrained('store_inventory')->restrictOnDelete();
            
            $table->integer('quantity');
            $table->decimal('unit_price', 15, 2);
            $table->decimal('total_amount', 15, 2);
            
            // Supplier details
            $table->string('supplier_name', 200);
            $table->string('supplier_contact', 100)->nullable();
            $table->string('invoice_number', 100)->nullable();
            
            // Dates
            $table->date('purchase_date');
            $table->date('delivery_date')->nullable();
            
            // User tracking
            $table->foreignId('logged_by')->constrained('users')->restrictOnDelete();
            
            // Additional details
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('purchase_request_id');
            $table->index('inventory_item_id');
            $table->index('purchase_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('procurement_logs');
    }
};
