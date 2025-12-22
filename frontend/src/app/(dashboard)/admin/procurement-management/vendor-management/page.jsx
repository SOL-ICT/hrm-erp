'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Building2, Plus, Pencil, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Vendor Management Page
 * Manage supplier database and performance tracking
 */

export default function VendorManagementPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorData, setVendorData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    rating: 5,
    notes: '',
  });

  // Mock data for now (replace with API call later)
  const loadVendors = () => {
    setVendors([
      {
        id: 1,
        name: 'ABC Office Supplies Ltd',
        contact_person: 'John Doe',
        email: 'john@abcsupplies.com',
        phone: '+234 801 234 5678',
        address: 'Lagos, Nigeria',
        category: 'Office Supplies',
        rating: 5,
        total_orders: 15,
        notes: 'Reliable supplier, fast delivery',
      },
      {
        id: 2,
        name: 'Tech Solutions Nigeria',
        contact_person: 'Jane Smith',
        email: 'jane@techsolutions.ng',
        phone: '+234 802 345 6789',
        address: 'Abuja, Nigeria',
        category: 'IT Equipment',
        rating: 4,
        total_orders: 8,
        notes: 'Good quality electronics',
      },
    ]);
  };

  useEffect(() => {
    loadVendors();
  }, []);

  // Reset form
  const resetForm = () => {
    setVendorData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      category: '',
      rating: 5,
      notes: '',
    });
  };

  // Handle add vendor
  const handleAddVendor = () => {
    if (!vendorData.name.trim() || !vendorData.contact_person.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    // Mock implementation
    const newVendor = {
      id: vendors.length + 1,
      ...vendorData,
      total_orders: 0,
    };
    setVendors([...vendors, newVendor]);
    toast.success('Vendor added successfully');
    setShowAddDialog(false);
    resetForm();
  };

  // Handle edit vendor
  const handleEditVendor = () => {
    if (!vendorData.name.trim() || !vendorData.contact_person.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    // Mock implementation
    setVendors(vendors.map(v => 
      v.id === selectedVendor.id ? { ...v, ...vendorData } : v
    ));
    toast.success('Vendor updated successfully');
    setShowEditDialog(false);
    setSelectedVendor(null);
    resetForm();
  };

  // Handle delete vendor
  const handleDeleteVendor = (id) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      setVendors(vendors.filter(v => v.id !== id));
      toast.success('Vendor deleted successfully');
    }
  };

  // Star rating display
  const StarRating = ({ rating }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? 'text-yellow-500' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-500 mt-1">
            Manage supplier database and track performance
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {vendors.length}
            </div>
            <p className="text-sm text-gray-500">Total Vendors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {vendors.filter(v => v.rating >= 4).length}
            </div>
            <p className="text-sm text-gray-500">Top Rated (4+)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {vendors.reduce((sum, v) => sum + v.total_orders, 0)}
            </div>
            <p className="text-sm text-gray-500">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {new Set(vendors.map(v => v.category)).size}
            </div>
            <p className="text-sm text-gray-500">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Vendors List */}
      {vendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No vendors found</p>
            <p className="text-gray-400 text-sm mt-2">
              Add vendors to manage your supplier database
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {vendors.map((vendor) => (
            <Card key={vendor.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-8 h-8 text-blue-600 mt-1" />
                    <div>
                      <CardTitle className="text-lg">{vendor.name}</CardTitle>
                      <p className="text-sm text-gray-500">{vendor.category}</p>
                      <StarRating rating={vendor.rating} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setSelectedVendor(vendor);
                        setVendorData(vendor);
                        setShowEditDialog(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteVendor(vendor.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{vendor.contact_person} - {vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{vendor.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{vendor.address}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Orders:</span>
                    <span className="font-semibold">{vendor.total_orders}</span>
                  </div>
                </div>

                {vendor.notes && (
                  <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 italic">
                    {vendor.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setShowEditDialog(false);
          setSelectedVendor(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {showAddDialog ? 'Add New Vendor' : 'Edit Vendor'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Vendor Name *
                </label>
                <Input
                  value={vendorData.name}
                  onChange={(e) => setVendorData({ ...vendorData, name: e.target.value })}
                  placeholder="ABC Suppliers Ltd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <Input
                  value={vendorData.category}
                  onChange={(e) => setVendorData({ ...vendorData, category: e.target.value })}
                  placeholder="Office Supplies, IT Equipment, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Contact Person *
                </label>
                <Input
                  value={vendorData.contact_person}
                  onChange={(e) => setVendorData({ ...vendorData, contact_person: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone
                </label>
                <Input
                  value={vendorData.phone}
                  onChange={(e) => setVendorData({ ...vendorData, phone: e.target.value })}
                  placeholder="+234 801 234 5678"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={vendorData.email}
                  onChange={(e) => setVendorData({ ...vendorData, email: e.target.value })}
                  placeholder="contact@vendor.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Rating
                </label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={vendorData.rating}
                  onChange={(e) => setVendorData({ ...vendorData, rating: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Address
              </label>
              <Input
                value={vendorData.address}
                onChange={(e) => setVendorData({ ...vendorData, address: e.target.value })}
                placeholder="City, State, Country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Notes
              </label>
              <Textarea
                value={vendorData.notes}
                onChange={(e) => setVendorData({ ...vendorData, notes: e.target.value })}
                placeholder="Performance notes, delivery reliability, quality, etc."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setShowEditDialog(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={showAddDialog ? handleAddVendor : handleEditVendor}>
              <Building2 className="w-4 h-4 mr-2" />
              {showAddDialog ? 'Add Vendor' : 'Update Vendor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
