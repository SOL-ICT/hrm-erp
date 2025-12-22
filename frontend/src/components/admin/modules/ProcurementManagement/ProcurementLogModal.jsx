import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, TextArea, Select } from '@/components/ui';
import { Package } from 'lucide-react';

/**
 * Procurement Log Modal Component
 * For creating and editing procurement logs
 */
export const ProcurementLogModal = ({ 
  isOpen, 
  onClose, 
  procurementLog, 
  onSubmit, 
  isSubmitting,
  vendors = [],
  purchaseRequests = [],
  inventoryItems = []
}) => {
  const [formData, setFormData] = useState({
    vendor_id: '',
    purchase_request_id: '',
    inventory_item_id: '',
    quantity: '',
    unit_price: '',
    invoice_number: '',
    purchase_date: '',
    delivery_date: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  const isEditMode = !!procurementLog;

  useEffect(() => {
    if (procurementLog) {
      setFormData({
        vendor_id: procurementLog.vendor_id || '',
        purchase_request_id: procurementLog.purchase_request_id || '',
        inventory_item_id: procurementLog.inventory_item_id || '',
        quantity: procurementLog.quantity || '',
        unit_price: procurementLog.unit_price || '',
        invoice_number: procurementLog.invoice_number || '',
        purchase_date: procurementLog.purchase_date || '',
        delivery_date: procurementLog.delivery_date || '',
        notes: procurementLog.notes || ''
      });
    } else {
      // Reset form for new log
      setFormData({
        vendor_id: '',
        purchase_request_id: '',
        inventory_item_id: '',
        quantity: '',
        unit_price: '',
        invoice_number: '',
        purchase_date: '',
        delivery_date: '',
        notes: ''
      });
    }
    setErrors({});
  }, [procurementLog, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vendor_id) {
      newErrors.vendor_id = 'Vendor is required';
    }

    if (!formData.inventory_item_id) {
      newErrors.inventory_item_id = 'Inventory item is required';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.unit_price || formData.unit_price < 0) {
      newErrors.unit_price = 'Unit price must be 0 or greater';
    }

    if (!formData.purchase_date) {
      newErrors.purchase_date = 'Purchase date is required';
    }

    return newErrors;
  };

  const handleSubmit = () => {
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData, procurementLog?.id);
  };

  const handleClose = () => {
    setFormData({
      vendor_id: '',
      purchase_request_id: '',
      inventory_item_id: '',
      quantity: '',
      unit_price: '',
      invoice_number: '',
      purchase_date: '',
      delivery_date: '',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  const totalAmount = (parseFloat(formData.quantity) || 0) * (parseFloat(formData.unit_price) || 0);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={isEditMode ? 'Edit Procurement Log' : 'Add New Procurement Log'}
    >
      <div className="space-y-4">
        {/* Vendor Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Vendor <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.vendor_id}
            onValueChange={(value) => handleChange('vendor_id', value)}
            className={errors.vendor_id ? 'border-red-500' : ''}
          >
            <option value="">Select a vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.vendor_name}
              </option>
            ))}
          </Select>
          {errors.vendor_id && (
            <p className="text-red-500 text-sm mt-1">{errors.vendor_id}</p>
          )}
        </div>

        {/* Purchase Request (Optional) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Purchase Request (Optional)
          </label>
          <Select
            value={formData.purchase_request_id}
            onValueChange={(value) => handleChange('purchase_request_id', value)}
          >
            <option value="">No purchase request</option>
            {purchaseRequests.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.request_code}
              </option>
            ))}
          </Select>
        </div>

        {/* Inventory Item */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Inventory Item <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.inventory_item_id}
            onValueChange={(value) => handleChange('inventory_item_id', value)}
            className={errors.inventory_item_id ? 'border-red-500' : ''}
          >
            <option value="">Select an item</option>
            {inventoryItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.item_name}
              </option>
            ))}
          </Select>
          {errors.inventory_item_id && (
            <p className="text-red-500 text-sm mt-1">{errors.inventory_item_id}</p>
          )}
        </div>

        {/* Quantity & Unit Price (2 columns) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Quantity <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              placeholder="0"
              min="1"
              className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Unit Price (₦) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.unit_price}
              onChange={(e) => handleChange('unit_price', e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={errors.unit_price ? 'border-red-500' : ''}
            />
            {errors.unit_price && (
              <p className="text-red-500 text-sm mt-1">{errors.unit_price}</p>
            )}
          </div>
        </div>

        {/* Total Amount (Calculated) */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Amount:</span>
            <span className="text-lg font-bold">
              ₦{totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Invoice Number */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Invoice Number
          </label>
          <Input
            value={formData.invoice_number}
            onChange={(e) => handleChange('invoice_number', e.target.value)}
            placeholder="INV-2025-001"
          />
        </div>

        {/* Purchase & Delivery Dates (2 columns) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Purchase Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              value={formData.purchase_date}
              onChange={(e) => handleChange('purchase_date', e.target.value)}
              className={errors.purchase_date ? 'border-red-500' : ''}
            />
            {errors.purchase_date && (
              <p className="text-red-500 text-sm mt-1">{errors.purchase_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Delivery Date
            </label>
            <Input
              type="date"
              value={formData.delivery_date}
              onChange={(e) => handleChange('delivery_date', e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Notes
          </label>
          <TextArea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any additional information about this procurement..."
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="default" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            <Package className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Log' : 'Add Log'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProcurementLogModal;
