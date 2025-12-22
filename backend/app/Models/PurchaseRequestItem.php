<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseRequestItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_request_id',
        'inventory_item_id',
        'item_name',
        'item_category',
        'item_code',
        'quantity',
        'unit_price',
        'total',
        'justification',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    /**
     * Relationships
     */
    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function inventoryItem()
    {
        return $this->belongsTo(StoreInventory::class, 'inventory_item_id');
    }
}
