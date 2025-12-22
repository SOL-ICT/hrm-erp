import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, TextArea, Select } from '@/components/ui';
import { Building2 } from 'lucide-react';

/**
 * Vendor Form Modal Component
 * For creating and editing vendors
 */
export const VendorFormModal = ({ isOpen, onClose, vendor, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    vendor_name: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    category: '',
    status: 'active',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  const isEditMode = !!vendor;

  useEffect(() => {
    if (vendor) {
      setFormData({
        vendor_name: vendor.vendor_name || '',
        contact_person: vendor.contact_person || '',
        contact_phone: vendor.contact_phone || '',
        contact_email: vendor.contact_email || '',
        address: vendor.address || '',
        category: vendor.category || '',
        status: vendor.status || 'active',
        notes: vendor.notes || ''
      });
    } else {
      // Reset form for new vendor
      setFormData({
        vendor_name: '',
        contact_person: '',
        contact_phone: '',
        contact_email: '',
        address: '',
        category: '',
        status: 'active',
        notes: ''
      });
    }
    setErrors({});
  }, [vendor, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vendor_name.trim()) {
      newErrors.vendor_name = 'Vendor name is required';
    } else if (formData.vendor_name.length > 200) {
      newErrors.vendor_name = 'Vendor name must not exceed 200 characters';
    }

    if (!formData.contact_person.trim()) {
      newErrors.contact_person = 'Contact person is required';
    }

    if (!formData.contact_phone.trim()) {
      newErrors.contact_phone = 'Contact phone is required';
    } else if (formData.contact_phone.length > 20) {
      newErrors.contact_phone = 'Phone must not exceed 20 characters';
    }

    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }

    return newErrors;
  };

  const handleSubmit = () => {
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData, vendor?.id);
  };

  const handleClose = () => {
    setFormData({
      vendor_name: '',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      address: '',
      category: '',
      status: 'active',
      notes: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={isEditMode ? 'Edit Vendor' : 'Add New Vendor'}
    >
      <div className="space-y-4">
        {/* Vendor Name */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Vendor Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.vendor_name}
            onChange={(e) => handleChange('vendor_name', e.target.value)}
            placeholder="Enter vendor name"
            className={errors.vendor_name ? 'border-red-500' : ''}
          />
          {errors.vendor_name && (
            <p className="text-red-500 text-sm mt-1">{errors.vendor_name}</p>
          )}
        </div>

        {/* Contact Person */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Contact Person <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.contact_person}
            onChange={(e) => handleChange('contact_person', e.target.value)}
            placeholder="Enter contact person name"
            className={errors.contact_person ? 'border-red-500' : ''}
          />
          {errors.contact_person && (
            <p className="text-red-500 text-sm mt-1">{errors.contact_person}</p>
          )}
        </div>

        {/* Contact Phone & Email (2 columns) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Contact Phone <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.contact_phone}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              placeholder="e.g., 08012345678"
              className={errors.contact_phone ? 'border-red-500' : ''}
            />
            {errors.contact_phone && (
              <p className="text-red-500 text-sm mt-1">{errors.contact_phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Contact Email
            </label>
            <Input
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              placeholder="vendor@example.com"
              className={errors.contact_email ? 'border-red-500' : ''}
            />
            {errors.contact_email && (
              <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Address
          </label>
          <TextArea
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Enter vendor address"
            rows={2}
          />
        </div>

        {/* Category & Status (2 columns) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Category
            </label>
            <Input
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="e.g., Electronics, Office Supplies"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Status
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </Select>
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
            placeholder="Any additional information about this vendor..."
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
            <Building2 className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Vendor' : 'Add Vendor'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VendorFormModal;
