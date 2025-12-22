"use client";

import { useState, useEffect } from "react";
import { Package, ShoppingCart, History, Search, Filter, X, Plus, Minus, FileText, AlertCircle } from "lucide-react";
import { inventoryAPI, requisitionAPI } from "@/services/modules/requisition-management";
import { InventoryItemCard, StockIndicator, RequisitionCard, StatusBadge } from "@/components/requisition";
import { useAuth } from "@/contexts/AuthContext";

/**
 * CreateRequisition Component
 * 
 * Staff interface for browsing inventory, creating requisitions, and tracking submissions
 * Used by Strategic Outsourcing Limited (Client 1) staff via Admin Dashboard
 */
export default function CreateRequisition({ currentTheme, preferences, onBack }) {
  const { user } = useAuth();
  
  // Tab management
  const [activeTab, setActiveTab] = useState("catalog"); // catalog, cart, my-requisitions

  // Catalog state
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Cart state
  const [cart, setCart] = useState([]);
  const [showCartSummary, setShowCartSummary] = useState(false);

  // Requisition form state
  const [purpose, setPurpose] = useState("");
  const [department, setDepartment] = useState(user?.profile_info?.department || "");
  const [submitting, setSubmitting] = useState(false);

  // My requisitions state
  const [myRequisitions, setMyRequisitions] = useState([]);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Error state
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInventory();
    loadCategories();
    if (activeTab === "my-requisitions") {
      loadMyRequisitions();
    }
  }, [activeTab]);

  // Load inventory
  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build params object, excluding null/empty values
      const params = {
        active: 1,
      };
      
      // Only add category if it's not "all"
      if (selectedCategory && selectedCategory !== "all") {
        params.category = selectedCategory;
      }
      
      // Only add search if it has a value
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      console.log("Loading inventory with params:", params);
      const data = await inventoryAPI.getAll(params);
      console.log("Inventory data received:", data);
      console.log("Is array?", Array.isArray(data));
      console.log("Data length:", data?.length);
      // Ensure data is always an array
      setInventory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load inventory:", err);
      setError("Failed to load inventory items");
      setInventory([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const data = await inventoryAPI.getCategories();
      // Ensure data is always an array
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setCategories([]); // Reset to empty array on error
    }
  };

  // Load my requisitions
  const loadMyRequisitions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requisitionAPI.getMyRequisitions();
      // Ensure data is always an array
      setMyRequisitions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load requisitions:", err);
      setError("Failed to load your requisitions");
      setMyRequisitions([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Filter inventory based on search and category
  useEffect(() => {
    loadInventory();
  }, [selectedCategory, searchQuery]);

  // Add to cart
  const addToCart = (item) => {
    const existingItem = cart.find((i) => i.id === item.id);
    if (existingItem) {
      setCart(
        cart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart([...cart, { ...item, quantity: 1, purpose: "" }]);
    }
    setShowCartSummary(true);
    setTimeout(() => setShowCartSummary(false), 2000);
  };

  // Update cart item quantity
  const updateCartQuantity = (itemId, delta) => {
    setCart(
      cart
        .map((i) => {
          if (i.id === itemId) {
            const newQuantity = i.quantity + delta;
            if (newQuantity <= 0) return null;
            if (newQuantity > i.available_stock) {
              alert(`Only ${i.available_stock} units available`);
              return i;
            }
            return { ...i, quantity: newQuantity };
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  // Update cart item purpose
  const updateCartPurpose = (itemId, newPurpose) => {
    setCart(
      cart.map((i) => (i.id === itemId ? { ...i, purpose: newPurpose } : i))
    );
  };

  // Remove from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter((i) => i.id !== itemId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setPurpose("");
  };

  // Submit requisition
  const submitRequisition = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    // Validate that all items have quantities
    const invalidItems = cart.filter(item => !item.quantity || item.quantity <= 0);
    if (invalidItems.length > 0) {
      alert("Please ensure all items have valid quantities");
      return;
    }

    // Validate required fields
    if (!department || !purpose) {
      alert("Please fill in Department and Purpose fields");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        department: department,
        branch: "Head Office", // Default to Head Office for SOL staff
        items: cart.map((item) => ({
          inventory_item_id: item.id,
          quantity: item.quantity,
          purpose: item.purpose || purpose,
        })),
        general_purpose: purpose,
      };

      console.log("Submitting requisition with payload:", payload);
      const response = await requisitionAPI.create(payload);
      console.log("Requisition created successfully:", response);
      
      alert("Requisition submitted successfully!");
      clearCart();
      setActiveTab("my-requisitions");
      loadMyRequisitions();
    } catch (err) {
      console.error("Failed to submit requisition - Full error:", err);
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);
      console.error("Error response:", err.response);
      console.error("Error request:", err.request);
      
      let errorMessage = "Failed to submit requisition";
      
      if (err.response) {
        // Server responded with error
        errorMessage = err.response?.data?.message || err.response?.data?.error || errorMessage;
      } else if (err.request) {
        // Request made but no response
        errorMessage = "No response from server. Please check your connection.";
      } else {
        // Error setting up request
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // View requisition details
  const viewRequisitionDetails = (requisition) => {
    setSelectedRequisition(requisition);
    setShowDetailsModal(true);
  };

  // Cancel requisition
  const cancelRequisition = async (requisition) => {
    if (!confirm(`Cancel requisition ${requisition.requisition_code}?`)) return;

    try {
      await requisitionAPI.cancel(requisition.id);
      alert("Requisition cancelled successfully");
      loadMyRequisitions();
    } catch (err) {
      console.error("Failed to cancel requisition:", err);
      alert(err.response?.data?.message || "Failed to cancel requisition");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Store Requisition</h1>
            <p className="text-gray-600 mt-1">Browse inventory and submit requisition requests</p>
          </div>
          {cart.length > 0 && (
            <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
              <ShoppingCart className="text-blue-600" size={24} />
              <div>
                <div className="font-bold text-blue-900">{cart.length} items in cart</div>
                <div className="text-sm text-blue-700">
                  Total qty: {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === "catalog"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Package size={20} />
              <span>Browse Catalog</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("cart")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === "cart"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} />
              <span>My Cart</span>
              {cart.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {cart.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("my-requisitions")}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === "my-requisitions"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <History size={20} />
              <span>My Requisitions</span>
            </div>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <div>
            <div className="font-semibold text-red-900">Error</div>
            <div className="text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search inventory by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="md:w-64">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
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
            </div>
          </div>

          {/* Inventory Table */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading inventory...</p>
            </div>
          ) : inventory.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Package className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Items Found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Available</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Price</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {inventory.map((item) => (
                      <tr 
                        key={item.id} 
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{item.code}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{item.name}</span>
                            {item.description && (
                              <span className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-semibold ${
                              item.available_stock <= 10 ? 'text-red-600' : 
                              item.available_stock <= 20 ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {item.available_stock}
                            </span>
                            <span className="text-xs text-gray-500">of {item.total_stock}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            ₦{parseFloat(item.unit_price).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => addToCart(item)}
                            disabled={item.available_stock <= 0}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                              item.available_stock <= 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'
                            }`}
                          >
                            <Plus size={16} />
                            Add to Cart
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "cart" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Cart Items</h2>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-2"
                  >
                    <X size={20} />
                    Clear Cart
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="mx-auto text-gray-400 mb-4" size={64} />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600 mb-4">Browse the catalog to add items</p>
                  <button
                    onClick={() => setActiveTab("catalog")}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-600">{item.code}</p>
                          <StockIndicator
                            availableStock={item.available_stock}
                            totalStock={item.total_stock}
                            variant="badge"
                          />
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-bold text-gray-900 w-12 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <span className="text-sm text-gray-600">
                          (Max: {item.available_stock})
                        </span>
                      </div>

                      {/* Purpose Input */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-2">
                          Purpose (Optional):
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., For department meeting"
                          value={item.purpose}
                          onChange={(e) => updateCartPurpose(item.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submission Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Requisition Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>Total Items:</span>
                  <span className="font-bold">{cart.length}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Total Quantity:</span>
                  <span className="font-bold">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </div>
              </div>

              {/* Department */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Department: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Your department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  readOnly={!!user?.profile_info?.department}
                  title={user?.profile_info?.department ? "Department prefilled from your profile" : ""}
                  required
                />
                {user?.profile_info?.department && (
                  <p className="text-xs text-gray-500 mt-1">Prefilled from your staff profile</p>
                )}
              </div>

              {/* General Purpose */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  General Purpose: <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Describe the general purpose of this requisition..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={submitRequisition}
                disabled={cart.length === 0 || submitting}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText size={20} />
                    Submit Requisition
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "my-requisitions" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">My Requisitions</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading requisitions...</p>
              </div>
            ) : myRequisitions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto text-gray-400 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Requisitions Yet</h3>
                <p className="text-gray-600 mb-4">You haven't submitted any requisitions</p>
                <button
                  onClick={() => setActiveTab("catalog")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Create First Requisition
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {myRequisitions.map((requisition) => (
                  <RequisitionCard
                    key={requisition.id}
                    requisition={requisition}
                    onViewDetails={viewRequisitionDetails}
                    onCancel={cancelRequisition}
                    userRole="staff"
                    variant="compact"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requisition Details Modal */}
      {showDetailsModal && selectedRequisition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Requisition Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <RequisitionCard
                requisition={selectedRequisition}
                userRole="staff"
                variant="detailed"
                onCancel={(req) => {
                  cancelRequisition(req);
                  setShowDetailsModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Cart Summary Notification */}
      {showCartSummary && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-bounce z-50">
          <ShoppingCart size={24} />
          <span className="font-semibold">Item added to cart!</span>
        </div>
      )}
    </div>
  );
}
