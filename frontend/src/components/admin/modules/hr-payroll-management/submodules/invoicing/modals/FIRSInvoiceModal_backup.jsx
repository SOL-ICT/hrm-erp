import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader,
  Plus,
  Trash2,
} from "lucide-react";

/**
 * Simplified FIRS Invoice Modal Component
 * Collects minimal FIRS-specific information before invoice generation
 * Most data comes from Client/SOL master setup
 */
const FIRSInvoiceModal = ({
  isOpen,
  onClose,
  onSubmit,
  selectedUpload,
  invoiceType,
  loading = false,
}) => {
  const [firsData, setFirsData] = useState({
    // Required fields
    payment_status: 'Pending', // Dropdown: 'Paid', 'Pending', 'Proforma'
    order_reference: 'SLA', // Dropdown: 'SLA' or 'PO'
    po_number: '', // Only if PO is selected
    
    // Optional billing references (multiple entries)
    billing_reference: [
      { irn: '', issue_date: '' }
    ]
  });

  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFirsData({
        payment_status: 'Pending',
        order_reference: 'SLA',
        po_number: '',
        billing_reference: [{ irn: '', issue_date: '' }]
      });
      setErrors({});
    }
  }, [isOpen]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFirsData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle billing reference changes
  const handleBillingReferenceChange = (index, field, value) => {
    setFirsData(prev => {
      const newBillingReference = [...prev.billing_reference];
      newBillingReference[index] = {
        ...newBillingReference[index],
        [field]: value
      };
      return {
        ...prev,
        billing_reference: newBillingReference
      };
    });
  };

  // Add new billing reference
  const addBillingReference = () => {
    setFirsData(prev => ({
      ...prev,
      billing_reference: [
        ...prev.billing_reference,
        { irn: '', issue_date: '' }
      ]
    }));
  };

  // Remove billing reference
  const removeBillingReference = (index) => {
    if (firsData.billing_reference.length > 1) {
      setFirsData(prev => ({
        ...prev,
        billing_reference: prev.billing_reference.filter((_, i) => i !== index)
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    // PO number validation
    if (firsData.order_reference === 'PO' && !firsData.po_number.trim()) {
      newErrors['po_number'] = 'PO number is required when PO is selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      // Filter out empty billing references
      const filteredBillingReference = firsData.billing_reference.filter(
        ref => ref.irn.trim() || ref.issue_date.trim()
      );

      onSubmit({
        uploadId: selectedUpload.id,
        invoiceType,
        firsData: {
          ...firsData,
          billing_reference: filteredBillingReference
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                FIRS E-Invoice Submission
              </h2>
              <p className="text-sm text-gray-500">
                Configure FIRS-specific invoice settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Selected Upload
            </h3>
            <p className="text-sm text-blue-700">
              {selectedUpload?.file_name} - {selectedUpload?.client?.organisation_name}
            </p>
            <p className="text-xs text-blue-600">
              {selectedUpload?.total_records} records, Type: {invoiceType}
            </p>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <p className="text-sm text-amber-700">
              <strong>Note:</strong> Customer and supplier details will be automatically populated from Client Master Setup and SOL Master Details.
            </p>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status *
            </label>
            <select
              value={firsData.payment_status}
              onChange={(e) => handleInputChange('payment_status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Proforma">Proforma</option>
            </select>
          </div>

          {/* Order Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Reference *
            </label>
            <div className="space-y-3">
              <select
                value={firsData.order_reference}
                onChange={(e) => handleInputChange('order_reference', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SLA">SLA (Service Level Agreement)</option>
                <option value="PO">PO (Purchase Order)</option>
              </select>
              
              {firsData.order_reference === 'PO' && (
                <div>
                  <input
                    type="text"
                    placeholder="Enter PO Number"
                    value={firsData.po_number}
                    onChange={(e) => handleInputChange('po_number', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors['po_number'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors['po_number'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['po_number']}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Billing Reference */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Billing Reference (Optional)
              </label>
              <button
                type="button"
                onClick={addBillingReference}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Reference
              </button>
            </div>
            
            <div className="space-y-3">
              {firsData.billing_reference.map((ref, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="IRN (e.g., ITW001-E9E0C0D3-20240619)"
                      value={ref.irn}
                      onChange={(e) => handleBillingReferenceChange(index, 'irn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="date"
                      placeholder="Issue Date"
                      value={ref.issue_date}
                      onChange={(e) => handleBillingReferenceChange(index, 'issue_date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {firsData.billing_reference.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBillingReference(index)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            Invoice Type: {invoiceType} | Invoice Type Code: 380
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Submitting to FIRS...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit to FIRS
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FIRSInvoiceModal;
    if (!firsData.customer.address.trim()) {
      newErrors["customer.address"] = "Customer address is required";
    }

    // Supplier validation
    if (!firsData.supplier.tin.trim()) {
      newErrors["supplier.tin"] = "Supplier TIN is required";
    }
    if (!firsData.supplier.address.trim()) {
      newErrors["supplier.address"] = "Supplier address is required";
    }

    // Due date validation
    if (!firsData.dueDate) {
      newErrors["dueDate"] = "Due date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        uploadId: selectedUpload.id,
        invoiceType,
        firsData,
      });
    }
  };

  // Handle step navigation
  const handleNext = () => {
    if (step === 1 && validateForm()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                FIRS E-Invoice Generation
              </h2>
              <p className="text-sm text-gray-500">
                Step {step} of 2:{" "}
                {step === 1 ? "Customer Information" : "Review & Submit"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            // Step 1: Customer Information
            <div className="space-y-6">
              {/* Upload Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  Selected Upload
                </h3>
                <p className="text-sm text-blue-700">
                  {selectedUpload?.file_name} -{" "}
                  {selectedUpload?.client?.organisation_name}
                </p>
                <p className="text-xs text-blue-600">
                  {selectedUpload?.total_records} records, Type: {invoiceType}
                </p>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer TIN *
                    </label>
                    <input
                      type="text"
                      value={firsData.customer.tin}
                      onChange={(e) =>
                        handleInputChange("customer", "tin", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors["customer.tin"]
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter customer TIN"
                    />
                    {errors["customer.tin"] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors["customer.tin"]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={firsData.customer.name}
                      onChange={(e) =>
                        handleInputChange("customer", "name", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors["customer.name"]
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter customer name"
                    />
                    {errors["customer.name"] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors["customer.name"]}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Address *
                    </label>
                    <textarea
                      value={firsData.customer.address}
                      onChange={(e) =>
                        handleInputChange("customer", "address", e.target.value)
                      }
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors["customer.address"]
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter customer address"
                    />
                    {errors["customer.address"] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors["customer.address"]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Email
                    </label>
                    <input
                      type="email"
                      value={firsData.customer.email}
                      onChange={(e) =>
                        handleInputChange("customer", "email", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter customer email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Phone
                    </label>
                    <input
                      type="tel"
                      value={firsData.customer.phone}
                      onChange={(e) =>
                        handleInputChange("customer", "phone", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter customer phone"
                    />
                  </div>
                </div>
              </div>

              {/* Supplier Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Supplier Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier TIN *
                    </label>
                    <input
                      type="text"
                      value={firsData.supplier.tin}
                      onChange={(e) =>
                        handleInputChange("supplier", "tin", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors["supplier.tin"]
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter SOL TIN"
                    />
                    {errors["supplier.tin"] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors["supplier.tin"]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      value={firsData.supplier.name}
                      onChange={(e) =>
                        handleInputChange("supplier", "name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Strategic Outsourcing Limited"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Address *
                    </label>
                    <textarea
                      value={firsData.supplier.address}
                      onChange={(e) =>
                        handleInputChange("supplier", "address", e.target.value)
                      }
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors["supplier.address"]
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter SOL address"
                    />
                    {errors["supplier.address"] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors["supplier.address"]}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Invoice Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={firsData.dueDate}
                      onChange={(e) =>
                        handleInputChange("", "dueDate", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors["dueDate"] ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    {errors["dueDate"] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors["dueDate"]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Terms
                    </label>
                    <select
                      value={firsData.paymentTerms}
                      onChange={(e) =>
                        handleInputChange("", "paymentTerms", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="30 days">30 days</option>
                      <option value="15 days">15 days</option>
                      <option value="45 days">45 days</option>
                      <option value="60 days">60 days</option>
                      <option value="Due on receipt">Due on receipt</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={firsData.notes}
                      onChange={(e) =>
                        handleInputChange("", "notes", e.target.value)
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Additional notes for the invoice"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Step 2: Review & Submit
            <div className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please review the information below. Once submitted, this
                  invoice will be sent to FIRS for approval.
                </AlertDescription>
              </Alert>

              {/* Review Summary */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Customer</h4>
                  <p className="text-sm text-gray-600">
                    {firsData.customer.name} (TIN: {firsData.customer.tin})
                  </p>
                  <p className="text-sm text-gray-600">
                    {firsData.customer.address}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Invoice Details
                  </h4>
                  <p className="text-sm text-gray-600">
                    Due Date: {firsData.dueDate}
                  </p>
                  <p className="text-sm text-gray-600">
                    Payment Terms: {firsData.paymentTerms}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center space-x-2">
            {step === 2 && (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>

            {step === 1 ? (
              <Button onClick={handleNext} disabled={loading}>
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Submitting to FIRS...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit to FIRS
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FIRSInvoiceModal;
