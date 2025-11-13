import React from "react";
import { Button, Badge } from "@/components/ui";
import {
  FileSpreadsheet,
  Download,
  Eye,
  FileText,
  DollarSign,
  Send,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

/**
 * Generated Invoices Tab Component
 * Displays and manages generated invoices
 */
const GeneratedInvoicesTab = ({
  generatedInvoices = [],
  loading,
  formatCurrency,
  formatDate,
  onRefresh,
  handleExportInvoicePDF,
  handleExportInvoiceExcel,
  handleViewInvoice,
  handleSendToFIRS,
  handleExportFIRSPDF,
}) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: "bg-gray-100 text-gray-800", label: "Draft" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      sent: { color: "bg-blue-100 text-blue-800", label: "Sent" },
      paid: { color: "bg-green-100 text-green-800", label: "Paid" },
      overdue: { color: "bg-red-100 text-red-800", label: "Overdue" },
    };

    const config = statusConfig[status] || statusConfig["draft"];

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getFIRSStatusBadge = (invoice) => {
    if (!invoice.firs_submitted) {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          <Clock className="w-3 h-3 mr-1" />
          Not Submitted
        </Badge>
      );
    }

    if (invoice.firs_approved) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          FIRS Approved
        </Badge>
      );
    }

    if (invoice.firs_status === "simulated") {
      return (
        <Badge className="bg-orange-100 text-orange-800">
          <XCircle className="w-3 h-3 mr-1" />
          Simulated (API Failed)
        </Badge>
      );
    }

    return (
      <Badge className="bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending FIRS
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Generated Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Generated Invoices
            </h3>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Invoice Archive
              </span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FIRS Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!Array.isArray(generatedInvoices) ||
              generatedInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                        Loading invoices...
                      </div>
                    ) : (
                      "No invoices generated yet"
                    )}
                  </td>
                </tr>
              ) : (
                generatedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.client?.organisation_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.invoice_period
                        ? formatDate(invoice.invoice_period)
                        : "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.invoice_type === "with_schedule"
                        ? "With Schedule"
                        : "Summary Only"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getFIRSStatusBadge(invoice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.created_at
                        ? formatDate(invoice.created_at)
                        : "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleViewInvoice && handleViewInvoice(invoice.id)
                          }
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>

                        {/* Regular PDF Export */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleExportInvoicePDF &&
                            handleExportInvoicePDF(invoice.id)
                          }
                          className="text-red-600 hover:text-red-900"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          PDF
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleExportInvoiceExcel &&
                            handleExportInvoiceExcel(invoice.id)
                          }
                          className="text-green-600 hover:text-green-900"
                        >
                          <FileSpreadsheet className="w-3 h-3 mr-1" />
                          Excel
                        </Button>

                        {/* FIRS Integration Buttons */}
                        {!invoice.firs_submitted ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleSendToFIRS && handleSendToFIRS(invoice.id)
                            }
                            className="text-purple-600 hover:text-purple-900"
                            title="Submit to FIRS for e-invoicing approval"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            FIRS
                          </Button>
                        ) : invoice.firs_approved ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleExportFIRSPDF &&
                              handleExportFIRSPDF(invoice.id)
                            }
                            className="text-green-600 hover:text-green-900"
                            title="Export FIRS-compliant PDF with QR code"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            FIRS PDF
                          </Button>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Statistics Summary */}
      {generatedInvoices.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Invoice Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {generatedInvoices.length}
                </div>
                <div className="text-sm text-gray-500">Total Invoices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    generatedInvoices.reduce(
                      (sum, inv) => sum + (parseFloat(inv.total_amount) || 0),
                      0
                    )
                  )}
                </div>
                <div className="text-sm text-gray-500">Total Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {
                    generatedInvoices.filter((inv) => inv.status === "pending")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {
                    generatedInvoices.filter((inv) => inv.status === "paid")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-500">Paid</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratedInvoicesTab;
