import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui";
import { invoiceApiService } from "../../services/modules/invoicing";
import InvoiceLineItemsTable from "./InvoiceLineItemsTable";
import PaymentStatusTracker from "./PaymentStatusTracker";
import {
  FileText,
  Download,
  Edit,
  Eye,
  Calendar,
  Users,
  Calculator,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
} from "lucide-react";

const InvoiceDetailView = () => {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (id) {
      loadInvoiceDetails();
    }
  }, [id]);

  const loadInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await invoiceApiService.getInvoice(id);
      setInvoice(response.data);
    } catch (error) {
      setError("Failed to load invoice details: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      await invoiceApiService.exportInvoiceToExcel(id);
    } catch (error) {
      alert("Export failed: " + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      generated: {
        variant: "default",
        icon: FileText,
        text: "Generated",
        color: "bg-blue-100 text-blue-800",
      },
      sent: {
        variant: "default",
        icon: CheckCircle,
        text: "Sent",
        color: "bg-green-100 text-green-800",
      },
      paid: {
        variant: "default",
        icon: CheckCircle,
        text: "Paid",
        color: "bg-green-100 text-green-800",
      },
      overdue: {
        variant: "destructive",
        icon: XCircle,
        text: "Overdue",
        color: "bg-red-100 text-red-800",
      },
      draft: {
        variant: "secondary",
        icon: Clock,
        text: "Draft",
        color: "bg-gray-100 text-gray-800",
      },
    };

    const config = statusConfig[status] || statusConfig.generated;
    const Icon = config.icon;

    return (
      <Badge
        className={`${config.color} flex items-center space-x-1 px-3 py-1`}
      >
        <Icon className="h-3 w-3" />
        <span>{config.text}</span>
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading invoice details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!invoice) {
    return (
      <Alert>
        <AlertDescription>Invoice not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {invoice.invoice_number}
            </h1>
            <p className="text-gray-600">
              {invoice.client?.organisation_name || invoice.client?.client_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(invoice.status)}
          <Button onClick={handleExportExcel} className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Invoice Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(invoice.total_invoice_amount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Employees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoice.total_employees}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Invoice Period
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {invoice.invoice_period || formatDate(invoice.invoice_month)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Payroll</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(invoice.net_payroll)}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Calculation Breakdown</TabsTrigger>
          <TabsTrigger value="employees">Employee Details</TabsTrigger>
          <TabsTrigger value="payments">Payment Tracking</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Organization:</span>
                  <span>{invoice.client?.organisation_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Address:</span>
                  <span>{invoice.client?.head_office_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Phone:</span>
                  <span>{invoice.client?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Industry:</span>
                  <span>{invoice.client?.industry_category}</span>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Gross Payroll:</span>
                  <span>{formatCurrency(invoice.gross_payroll)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Deductions:</span>
                  <span className="text-red-600">
                    -{formatCurrency(invoice.total_deductions)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Net Payroll:</span>
                  <span>{formatCurrency(invoice.net_payroll)}</span>
                </div>
                <hr />
                <div className="flex justify-between">
                  <span className="font-medium">Management Fee:</span>
                  <span>{formatCurrency(invoice.management_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">VAT (7.5%):</span>
                  <span>{formatCurrency(invoice.vat_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">WHT:</span>
                  <span className="text-red-600">
                    -{formatCurrency(invoice.wht_amount)}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Invoice Amount:</span>
                  <span>{formatCurrency(invoice.total_invoice_amount)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Calculation Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Calculation Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.calculation_breakdown ? (
                <div className="space-y-6">
                  {/* Payroll Summary */}
                  <div>
                    <h4 className="font-semibold text-lg mb-3">
                      Payroll Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Gross Payroll:</span>
                          <span>
                            {formatCurrency(
                              invoice.calculation_breakdown.payroll_summary
                                ?.gross_payroll || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>PAYE Tax:</span>
                          <span className="text-red-600">
                            -
                            {formatCurrency(
                              invoice.calculation_breakdown.payroll_summary
                                ?.total_paye || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>NHF Deduction:</span>
                          <span className="text-red-600">
                            -
                            {formatCurrency(
                              invoice.calculation_breakdown.payroll_summary
                                ?.total_nhf || 0
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>NSITF Deduction:</span>
                          <span className="text-red-600">
                            -
                            {formatCurrency(
                              invoice.calculation_breakdown.payroll_summary
                                ?.total_nsitf || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Other Deductions:</span>
                          <span className="text-red-600">
                            -
                            {formatCurrency(
                              invoice.calculation_breakdown.payroll_summary
                                ?.total_other_deductions || 0
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Net Payroll:</span>
                          <span>
                            {formatCurrency(
                              invoice.calculation_breakdown.payroll_summary
                                ?.net_payroll || 0
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fees and Taxes */}
                  <div>
                    <h4 className="font-semibold text-lg mb-3">
                      Fees and Taxes
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>
                          Management Fee (
                          {
                            invoice.calculation_breakdown.fees_and_taxes
                              ?.management_fee?.rate
                          }
                          ):
                        </span>
                        <span>
                          {formatCurrency(
                            invoice.calculation_breakdown.fees_and_taxes
                              ?.management_fee?.amount || 0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          VAT (
                          {
                            invoice.calculation_breakdown.fees_and_taxes?.vat
                              ?.rate
                          }
                          ):
                        </span>
                        <span>
                          {formatCurrency(
                            invoice.calculation_breakdown.fees_and_taxes?.vat
                              ?.amount || 0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>WHT:</span>
                        <span className="text-red-600">
                          -
                          {formatCurrency(
                            invoice.calculation_breakdown.fees_and_taxes?.wht
                              ?.amount || 0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No detailed breakdown available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee Details Tab */}
        <TabsContent value="employees" className="space-y-6">
          <InvoiceLineItemsTable invoiceId={id} />
        </TabsContent>

        {/* Payment Tracking Tab */}
        <TabsContent value="payments" className="space-y-6">
          <PaymentStatusTracker invoice={invoice} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvoiceDetailView;
