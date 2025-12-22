<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Store Inventory Model
 * 
 * Represents items available in the store for staff requisitions.
 * Tracks stock levels, pricing, and availability.
 */
class StoreInventory extends Model
{
    use HasFactory;

    protected $table = 'store_inventory';

    protected $fillable = [
        'code',
        'name',
        'category',
        'description',
        'total_stock',
        'available_stock',
        'reserved_stock',
        'unit_price',
        'location',
        'last_restocked',
        'is_active',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'last_restocked' => 'date',
        'is_active' => 'boolean',
        'total_stock' => 'integer',
        'available_stock' => 'integer',
        'reserved_stock' => 'integer',
    ];

    /**
     * Relationships
     */

    /**
     * Get requisition items that reference this inventory item
     */
    public function requisitionItems()
    {
        return $this->hasMany(StaffRequisitionItem::class, 'inventory_item_id');
    }

    /**
     * Query Scopes
     */

    /**
     * Scope to get only active items
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get items with available stock
     */
    public function scopeAvailable($query)
    {
        return $query->where('available_stock', '>', 0)
                     ->where('is_active', true);
    }

    /**
     * Scope to filter by category
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope to get low stock items (available stock < 10)
     */
    public function scopeLowStock($query)
    {
        return $query->where('available_stock', '<', 10)
                     ->where('is_active', true);
    }

    /**
     * Scope to search by name or code
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('code', 'like', "%{$search}%");
        });
    }

    /**
     * Helper Methods
     */

    /**
     * Check if sufficient quantity is available
     */
    public function hasAvailableQuantity($quantity)
    {
        return $this->available_stock >= $quantity && $this->is_active;
    }

    /**
     * Reserve stock for a requisition
     */
    public function reserveStock($quantity)
    {
        if (!$this->hasAvailableQuantity($quantity)) {
            return false;
        }

        $this->available_stock -= $quantity;
        $this->reserved_stock += $quantity;
        
        return $this->save();
    }

    /**
     * Release reserved stock (when requisition is rejected/cancelled)
     */
    public function releaseStock($quantity)
    {
        $this->available_stock += $quantity;
        $this->reserved_stock -= $quantity;
        
        return $this->save();
    }

    /**
     * Complete stock transaction (when items are collected)
     */
    public function completeTransaction($quantity)
    {
        $this->total_stock -= $quantity;
        $this->reserved_stock -= $quantity;
        
        return $this->save();
    }

    /**
     * Get stock status indicator
     */
    public function getStockStatusAttribute()
    {
        if ($this->available_stock <= 0) {
            return 'out_of_stock';
        } elseif ($this->available_stock < 10) {
            return 'low_stock';
        } else {
            return 'available';
        }
    }
}
