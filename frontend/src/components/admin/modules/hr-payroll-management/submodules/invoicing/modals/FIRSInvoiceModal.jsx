import React, { useState } from "react";
import {
  X,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader,
  Plus,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button, Alert, AlertDescription } from "@/components/ui";

/**
 * FIRS Invoice Modal Component
 * Simplified modal for FIRS e-invoicing submission
 */
const FIRSInvoiceModal = ({
  isOpen,
  onClose,
  uploadId,
  uploadData,
  onSubmit,
  loading,
  error,
}) => {
  const [step, setStep] = useState(1);
  const [invoiceType, setInvoiceType] = useState("with_schedule");
  
  // FIRS data state - simplified as per requirements
  const [firsData, setFirsData] = useState({
    payment_status: "",
    order_reference: "",
    billing_reference: [""], // Array for multiple billing references
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Update billing reference at specific index
  const updateBillingReference = (index, value) => {
    const newBillingRef = [...firsData.billing_reference];
    newBillingRef[index] = value;
    setFirsData({ ...firsData, billing_reference: newBillingRef });
  };

  // Add new billing reference
  const addBillingReference = () => {
    setFirsData({
      ...firsData,
      billing_reference: [...firsData.billing_reference, ""],
    });
  };

  // Remove billing reference
  const removeBillingReference = (index) => {
    if (firsData.billing_reference.length > 1) {
      const newBillingRef = firsData.billing_reference.filter((_, i) => i !== index);
      setFirsData({ ...firsData, billing_reference: newBillingRef });
    }
  };

  // Validate step 1 form
  const validateStep1 = () => {
    const newErrors = {};

    if (!firsData.payment_status) {
      newErrors["payment_status"] = "Payment status is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateStep1()) {
      // Filter out empty billing references
      const cleanedFirsData = {
        ...firsData,
        billing_reference: firsData.billing_reference.filter(ref => ref.trim() !== ""),
      };

      onSubmit({
        uploadId,
        invoiceType,
        ...cleanedFirsData,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Submit Invoice to FIRS
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step >= 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                1
              </div>
              <div
                className={`flex-1 h-1 mx-4 ${
                  step >= 2 ? "bg-blue-600" : "bg-gray-200"
                }`}
              ></div>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step >= 2
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                2
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-600">Invoice Details</span>
              <span className="text-sm text-gray-600">FIRS Submission</span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Step 1: Invoice Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-blue-900 mb-2">
                  Selected Upload Information
                </h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <strong>File:</strong> {uploadData?.file_name || "N/A"}
                  </p>
                  <p>
                    <strong>Client:</strong>{" "}
                    {uploadData?.client?.organisation_name || "N/A"}
                  </p>
                  <p>
                    <strong>Records:</strong> {uploadData?.total_records || 0}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Type
                </label>
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="with_schedule">With Schedule</option>
                  <option value="without_schedule">Summary Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status *
                </label>
                <select
                  value={firsData.payment_status}
                  onChange={(e) =>
                    setFirsData({ ...firsData, payment_status: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors["payment_status"]
                      ? "border-red-300"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Select payment status</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partially Paid</option>
                </select>
                {errors["payment_status"] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors["payment_status"]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Reference (SLA/PO)
                </label>
                <input
                  type="text"
                  value={firsData.order_reference}
                  onChange={(e) =>
                    setFirsData({ ...firsData, order_reference: e.target.value })
                  }
                  placeholder="Enter SLA or Purchase Order reference"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billing References
                </label>
                <div className="space-y-2">
                  {firsData.billing_reference.map((ref, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={ref}
                        onChange={(e) => updateBillingReference(index, e.target.value)}
                        placeholder="Enter billing reference"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {firsData.billing_reference.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBillingReference(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addBillingReference}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Another Reference
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: FIRS Submission Summary */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">
                  Ready for FIRS Submission
                </h3>
                <div className="text-sm text-green-800 space-y-2">
                  <p>
                    <strong>Payment Status:</strong> {firsData.payment_status}
                  </p>
                  {firsData.order_reference && (
                    <p>
                      <strong>Order Reference:</strong> {firsData.order_reference}
                    </p>
                  )}
                  {firsData.billing_reference.filter(ref => ref.trim() !== "").length > 0 && (
                    <div>
                      <strong>Billing References:</strong>
                      <ul className="list-disc list-inside ml-4">
                        {firsData.billing_reference
                          .filter(ref => ref.trim() !== "")
                          .map((ref, index) => (
                            <li key={index}>{ref}</li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  FIRS Submission Process
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• Invoice will be submitted to FIRS for approval</p>
                  <p>• You will receive a confirmation once processed</p>
                  <p>• QR code will be generated after FIRS approval</p>
                  <p>
                    • Final invoice with QR code will be available for download
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {step === 2 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              {step === 1 ? (
                <Button
                  onClick={() => {
                    if (validateStep1()) {
                      setStep(2);
                    }
                  }}
                  disabled={loading}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
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
    </div>
  );
};

export default FIRSInvoiceModal;