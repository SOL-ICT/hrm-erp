"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react";
import { inventoryAPI } from "@/services/modules/requisition-management";
import { InventoryItemCard, StockIndicator } from "@/components/requisition";

/**
 * InventoryManagement Component
 * 
 * Admin/Store Keeper interface for managing store inventory
 */
export default function InventoryManagement({ currentTheme }) {
  // Data state
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  // Modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockingItem, setRestockingItem] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "",
    description: "",
    total_stock: 0,
    unit_price: 0,
    location: "",
    is_active: true,
  });

  const [restockData, setRestockData] = useState({
    quantity: 0,
    unit_price: 0,
  });

  const [processing, setProcessing] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadInventory();
    loadCategories();
    loadStatistics();
    loadLowStockItems();
  }, [selectedCategory, searchQuery, showOnlyLowStock]);

  // Load inventory
  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build params object, excluding null/empty values
      const params = {
        active: 1, // Use 'active' not 'is_active'
      };
      
      // Only add category if it's not "all"
      if (selectedCategory && selectedCategory !== "all") {
        params.category = selectedCategory;
      }
      
      // Only add search if it has a value
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      // Only add stock_status if low stock filter is enabled
      if (showOnlyLowStock) {
        params.stock_status = "low";
      }
      
      const data = await inventoryAPI.getAll(params);
      
      // Ensure data is always an array
      const inventoryArray = Array.isArray(data) ? data : [];
      setInventory(inventoryArray);
      
      console.log('Loaded inventory:', inventoryArray.length, 'items');
    } catch (err) {
      console.error("Failed to load inventory:", err);
      setError("Failed to load inventory");
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const data = await inventoryAPI.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const stats = await inventoryAPI.getStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error("Failed to load statistics:", err);
    }
  };

  // Load low stock items
  const loadLowStockItems = async () => {
    try {
      const items = await inventoryAPI.getLowStock();
      setLowStockItems(items);
    } catch (err) {
      console.error("Failed to load low stock items:", err);
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      code: "",
      name: "",
      category: "",
      description: "",
      total_stock: 0,
      unit_price: 0,
      location: "",
      is_active: true,
    });
    setShowItemModal(true);
  };

  // Open edit modal
  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      category: item.category,
      description: item.description || "",
      total_stock: item.total_stock,
      unit_price: item.unit_price,
      location: item.location || "",
      is_active: item.is_active,
    });
    setShowItemModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      if (editingItem) {
        await inventoryAPI.update(editingItem.id, formData);
        alert("Item updated successfully!");
      } else {
        await inventoryAPI.create(formData);
        alert("Item created successfully!");
      }
      setShowItemModal(false);
      loadInventory();
      loadStatistics();
    } catch (err) {
      console.error("Failed to save item:", err);
      alert(err.response?.data?.message || "Failed to save item");
    } finally {
      setProcessing(false);
    }
  };

  // Delete item
  const deleteItem = async (item) => {
    if (!confirm(`Delete ${item.name}? This action cannot be undone.`)) return;

    try {
      await inventoryAPI.delete(item.id);
      alert("Item deleted successfully!");
      loadInventory();
      loadStatistics();
    } catch (err) {
      console.error("Failed to delete item:", err);
      alert(err.response?.data?.message || "Failed to delete item");
    }
  };

  // Open restock modal
  const openRestockModal = (item) => {
    setRestockingItem(item);
    setRestockData({
      quantity: 0,
      unit_price: item.unit_price,
    });
    setShowRestockModal(true);
  };

  // Handle restock
  const handleRestock = async (e) => {
    e.preventDefault();
    if (restockData.quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    setProcessing(true);
    try {
      await inventoryAPI.restock(restockingItem.id, restockData);
      alert("Item restocked successfully!");
      setShowRestockModal(false);
      loadInventory();
      loadStatistics();
      loadLowStockItems();
    } catch (err) {
      console.error("Failed to restock item:", err);
      alert(err.response?.data?.message || "Failed to restock item");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className={`${currentTheme.cardBg} rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
              Inventory Management
            </h1>
            <p className={`${currentTheme.textSecondary} mt-1`}>
              Manage store inventory items and stock levels
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
          >
            <Plus size={20} />
            Add New Item
          </button>
        </div>

        {/* Statistics Cards - Compact */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`${currentTheme.cardBg} p-3 rounded-lg border ${currentTheme.border}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${currentTheme.textSecondary}`}>Total Items</p>
                  <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                    {statistics.total_items || 0}
                  </p>
                </div>
                <Package className="text-blue-500" size={24} />
              </div>
            </div>

            <div className={`${currentTheme.cardBg} p-3 rounded-lg border ${currentTheme.border}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${currentTheme.textSecondary}`}>Total Stock</p>
                  <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                    {statistics.total_stock || 0}
                  </p>
                </div>
                <TrendingUp className="text-green-500" size={24} />
              </div>
            </div>

            <div className={`${currentTheme.cardBg} p-3 rounded-lg border ${currentTheme.border}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${currentTheme.textSecondary}`}>Low Stock</p>
                  <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                    {statistics.low_stock_count || 0}
                  </p>
                </div>
                <AlertTriangle className="text-amber-500" size={24} />
              </div>
            </div>

            <div className={`${currentTheme.cardBg} p-3 rounded-lg border ${currentTheme.border}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs ${currentTheme.textSecondary}`}>Active</p>
                  <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                    {statistics.active_items || 0}
                  </p>
                </div>
                <CheckCircle className="text-purple-500" size={24} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters - Compact */}
      <div className={`${currentTheme.cardBg} rounded-xl p-4`}>
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          {/* Category Filter */}
          <div className="md:w-48">
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none`}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Low Stock Toggle */}
          <div className="flex items-center gap-2 px-3">
            <input
              type="checkbox"
              id="lowStockToggle"
              checked={showOnlyLowStock}
              onChange={(e) => setShowOnlyLowStock(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="lowStockToggle" className={`text-sm font-medium ${currentTheme.textPrimary} whitespace-nowrap`}>
              Low Stock Only
            </label>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-600" size={24} />
          <div>
            <div className="font-semibold text-red-900 dark:text-red-200">Error</div>
            <div className="text-red-700 dark:text-red-300">{error}</div>
          </div>
        </div>
      )}

      {/* Inventory Grid */}
      <div className={`${currentTheme.cardBg} rounded-xl p-6`}>
        <h2 className={`text-lg font-bold ${currentTheme.textPrimary} mb-6`}>
          Inventory Items ({inventory.length})
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`${currentTheme.textSecondary} mt-4`}>Loading inventory...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className={`text-xl font-bold ${currentTheme.textPrimary} mb-2`}>
              No Items Found
            </h3>
            <p className={`${currentTheme.textSecondary} mb-4`}>
              {searchQuery || selectedCategory !== "all" || showOnlyLowStock
                ? "Try adjusting your filters"
                : "Add your first inventory item to get started"}
            </p>
            {!searchQuery && selectedCategory === "all" && !showOnlyLowStock && (
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Add First Item
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {inventory.map((item) => (
              <div key={item.id} className="relative">
                <InventoryItemCard item={item} variant="compact" showActions={false} />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => openRestockModal(item)}
                    className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Restock"
                  >
                    <TrendingUp size={14} />
                  </button>
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => deleteItem(item)}
                    className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Modal (Create/Edit) */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${currentTheme.cardBg} rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`sticky top-0 ${currentTheme.cardBg} border-b ${currentTheme.border} p-6 flex items-center justify-between`}>
              <h2 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                {editingItem ? "Edit Item" : "Add New Item"}
              </h2>
              <button
                onClick={() => setShowItemModal(false)}
                className={`p-2 ${currentTheme.hover} rounded-lg transition-colors`}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-semibold ${currentTheme.textPrimary} block mb-2`}>
                    Item Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className={`text-sm font-semibold ${currentTheme.textPrimary} block mb-2`}>
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-semibold ${currentTheme.textPrimary} block mb-2`}>
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className={`text-sm font-semibold ${currentTheme.textPrimary} block mb-2`}>
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-sm font-semibold ${currentTheme.textPrimary} block mb-2`}>
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-semibold ${currentTheme.textPrimary} block mb-2`}>
                    Initial Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.total_stock}
                    onChange={(e) => setFormData({ ...formData, total_stock: parseInt(e.target.value) })}
                    className={`w-full px-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>

                <div>
                  <label className={`text-sm font-semibold ${currentTheme.textPrimary} block mb-2`}>
                    Unit Price (₦) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })}
                    className={`w-full px-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className={`font-semibold ${currentTheme.textPrimary}`}>
                  Active (available for requisition)
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-300 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  disabled={processing}
                  className={`flex-1 py-3 px-4 rounded-lg border ${currentTheme.border} ${currentTheme.hover} transition-colors font-semibold disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 py-3 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>{editingItem ? "Update Item" : "Create Item"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && restockingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${currentTheme.cardBg} rounded-xl shadow-2xl max-w-md w-full`}>
            <div className={`border-b ${currentTheme.border} p-6 flex items-center justify-between`}>
              <h2 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                Restock Item
              </h2>
              <button
                onClick={() => setShowRestockModal(false)}
                className={`p-2 ${currentTheme.hover} rounded-lg transition-colors`}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleRestock} className="p-6 space-y-4">
              <div className={`p-4 rounded-lg border ${currentTheme.border}`}>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Item</p>
                <p className={`font-bold ${currentTheme.textPrimary}`}>{restockingItem.name}</p>
                <p className={`text-sm ${currentTheme.textSecondary} mt-2`}>Code: {restockingItem.code}</p>
                <div className="mt-3">
                  <StockIndicator
                    availableStock={restockingItem.available_stock}
                    totalStock={restockingItem.total_stock}
                    variant="progress"
                  />
                </div>
              </div>

              <div>
                <label className={`text-sm font-semibold ${currentTheme.textPrimary} block mb-2`}>
                  Quantity to Add <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={restockData.quantity}
                  onChange={(e) => setRestockData({ ...restockData, quantity: parseInt(e.target.value) })}
                  className={`w-full px-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label className={`text-sm font-semibold ${currentTheme.textPrimary} block mb-2`}>
                  Unit Price (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={restockData.unit_price}
                  onChange={(e) => setRestockData({ ...restockData, unit_price: parseFloat(e.target.value) })}
                  className={`w-full px-4 py-3 rounded-lg ${currentTheme.cardBg} border ${currentTheme.border} ${currentTheme.textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-300 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  disabled={processing}
                  className={`flex-1 py-3 px-4 rounded-lg border ${currentTheme.border} ${currentTheme.hover} transition-colors font-semibold disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 py-3 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={20} />
                      Restock Item
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
