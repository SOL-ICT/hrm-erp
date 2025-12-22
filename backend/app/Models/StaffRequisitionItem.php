<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Staff Requisition Item Model
 * 
 * Represents individual items within a requisition request.
 */
class StaffRequisitionItem extends Model
{
    use HasFactory;

    protected $table = 'staff_requisition_items';

    protected $fillable = [
        'requisition_id',
        'inventory_item_id',
        'quantity',
        'purpose',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    /**
     * Relationships
     */

    /**
     * Get the parent requisition
     */
    public function requisition()
    {
        return $this->belongsTo(StaffRequisition::class, 'requisition_id');
    }

    /**
     * Get the inventory item
     */
    public function inventoryItem()
    {
        return $this->belongsTo(StoreInventory::class, 'inventory_item_id');
    }

    /**
     * Helper Methods
     */

    /**
     * Get item name from inventory
     */
    public function getItemNameAttribute()
    {
        return $this->inventoryItem?->name ?? 'Unknown Item';
    }

    /**
     * Get item code from inventory
     */
    public function getItemCodeAttribute()
    {
        return $this->inventoryItem?->code ?? 'N/A';
    }

    /**
     * Get unit price from inventory
     */
    public function getUnitPriceAttribute()
    {
        return $this->inventoryItem?->unit_price ?? 0;
    }

    /**
     * Calculate total value for this item
     */
    public function getTotalValueAttribute()
    {
        return $this->quantity * $this->unit_price;
    }

    /**
     * Check if inventory item has sufficient stock
     */
    public function hasSufficientStock()
    {
        return $this->inventoryItem && 
               $this->inventoryItem->hasAvailableQuantity($this->quantity);
    }
}
