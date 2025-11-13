import React from "react";
import { Modal, Button } from "@/components/ui";
import { X, Download, FileText, Calendar, DollarSign } from "lucide-react";

/**
 * Invoice View Modal Component
 * Displays detailed invoice information with line items
 */
const InvoiceViewModal = ({
  isOpen,
  onClose,
  invoice,
  formatCurrency,
  formatDate,
  onExport,
}) => {
  if (!invoice) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Invoice Details
            </h2>
            <p className="text-gray-600">{invoice.invoice_number}</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport && onExport(invoice.id)}
              className="text-green-600 hover:text-green-900"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Invoice Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Invoice Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Number:</span>
                <span className="font-medium">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Client:</span>
                <span className="font-medium">
                  {invoice.client?.organisation_name || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">
                  {invoice.invoice_type === "with_schedule"
                    ? "With Schedule"
                    : "Summary Only"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-medium ${
                    invoice.status === "draft"
                      ? "text-gray-600"
                      : invoice.status === "pending"
                      ? "text-yellow-600"
                      : invoice.status === "sent"
                      ? "text-blue-600"
                      : invoice.status === "paid"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {invoice.status?.toUpperCase() || "DRAFT"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-600" />
              Period Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Period:</span>
                <span className="font-medium">
                  {invoice.invoice_period
                    ? formatDate(invoice.invoice_period)
                    : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Generated:</span>
                <span className="font-medium">
                  {invoice.created_at
                    ? formatDate(invoice.created_at)
                    : "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Employees:</span>
                <span className="font-medium">
                  {invoice.total_employees || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
            Financial Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(invoice.gross_payroll || 0)}
              </div>
              <div className="text-gray-600">Gross Payroll</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(invoice.total_deductions || 0)}
              </div>
              <div className="text-gray-600">Total Deductions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(invoice.net_payroll || 0)}
              </div>
              <div className="text-gray-600">Net Payroll</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(
                  invoice.total_amount || invoice.total_invoice_amount || 0
                )}
              </div>
              <div className="text-gray-600">Total Invoice</div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        {invoice.line_items && invoice.line_items.length > 0 && (
          <div className="bg-white border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Employee Details
              </h3>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">
                      Days Worked
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900">
                      Basic Salary
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900">
                      Gross Pay
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900">
                      Deductions
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900">
                      Net Pay
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.line_items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.employee_name}
                          </div>
                          <div className="text-gray-500">
                            {item.designation}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {item.days_worked}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {formatCurrency(item.basic_salary || 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(item.gross_pay || 0)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        {formatCurrency(item.total_deductions || 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">
                        {formatCurrency(item.net_pay || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => onExport && onExport(invoice.id)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Invoice
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceViewModal;
