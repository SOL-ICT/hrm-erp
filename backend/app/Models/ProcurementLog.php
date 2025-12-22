<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProcurementLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'vendor_id',
        'purchase_request_id',
        'inventory_item_id',
        'quantity',
        'unit_price',
        'total_amount',
        'supplier_name',
        'supplier_contact',
        'invoice_number',
        'purchase_date',
        'delivery_date',
        'logged_by',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'purchase_date' => 'date',
        'delivery_date' => 'date',
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

    public function logger()
    {
        return $this->belongsTo(User::class, 'logged_by');
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }
}
