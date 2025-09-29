import React, { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Progress,
} from "../ui";
import {
  CreditCard,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  Receipt,
} from "lucide-react";

const PaymentStatusTracker = ({ invoice }) => {
  const [payments, setPayments] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, [invoice]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      // Simulate payment data - in production, this would come from API
      const simulatedPayments = [
        {
          id: 1,
          amount: invoice.total_invoice_amount * 0.6, // 60% paid
          payment_date: "2025-09-15",
          payment_method: "Bank Transfer",
          reference: "TXN001234567",
          status: "completed",
          notes: "Partial payment - 60% of invoice amount",
        },
      ];

      const simulatedHistory = [
        {
          id: 1,
          date: "2025-09-28",
          action: "Invoice Generated",
          status: "generated",
          user: "System",
          notes: "Invoice automatically generated from payroll data",
        },
        {
          id: 2,
          date: "2025-09-28",
          action: "Invoice Sent",
          status: "sent",
          user: "John Admin",
          notes: "Invoice sent to client via email",
        },
        {
          id: 3,
          date: "2025-09-15",
          action: "Partial Payment Received",
          status: "partial",
          user: "Jane Finance",
          notes: "60% payment received via bank transfer",
        },
      ];

      setPayments(simulatedPayments);
      setPaymentHistory(simulatedHistory);
    } catch (error) {
      console.error("Error loading payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: {
        variant: "default",
        icon: CheckCircle,
        text: "Completed",
        color: "bg-green-100 text-green-800",
      },
      pending: {
        variant: "secondary",
        icon: Clock,
        text: "Pending",
        color: "bg-yellow-100 text-yellow-800",
      },
      failed: {
        variant: "destructive",
        icon: XCircle,
        text: "Failed",
        color: "bg-red-100 text-red-800",
      },
      partial: {
        variant: "default",
        icon: AlertTriangle,
        text: "Partial",
        color: "bg-blue-100 text-blue-800",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge
        className={`${config.color} flex items-center space-x-1 px-2 py-1`}
      >
        <Icon className="h-3 w-3" />
        <span>{config.text}</span>
      </Badge>
    );
  };

  // Calculate payment statistics
  const totalPaid = payments.reduce(
    (sum, payment) =>
      sum + (payment.status === "completed" ? payment.amount : 0),
    0
  );
  const remainingAmount = invoice.total_invoice_amount - totalPaid;
  const paymentPercentage = (totalPaid / invoice.total_invoice_amount) * 100;

  // Determine overall payment status
  const getOverallStatus = () => {
    if (totalPaid === 0) return "unpaid";
    if (remainingAmount <= 0) return "paid";
    if (totalPaid > 0 && remainingAmount > 0) return "partial";
    return "unpaid";
  };

  const overallStatus = getOverallStatus();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading payment information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Invoice Amount
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(invoice.total_invoice_amount)}
                </p>
              </div>
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Amount Paid</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(remainingAmount)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <div className="mt-1">{getStatusBadge(overallStatus)}</div>
              </div>
              <CreditCard className="h-6 w-6 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {paymentPercentage.toFixed(1)}% Paid
              </span>
              <span className="text-sm text-gray-600">
                {formatCurrency(totalPaid)} of{" "}
                {formatCurrency(invoice.total_invoice_amount)}
              </span>
            </div>
            <Progress value={paymentPercentage} className="h-3" />
            {remainingAmount > 0 && (
              <div className="text-sm text-gray-600">
                Outstanding: {formatCurrency(remainingAmount)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment Records</CardTitle>
            <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record New Payment</DialogTitle>
                  <DialogDescription>
                    Add a new payment record for this invoice.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="text-center text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Payment recording form would be here</p>
                    <p className="text-sm">
                      This feature allows recording new payments
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {payment.reference}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No payments recorded yet</p>
              <p className="text-sm">Payments will appear here once recorded</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History & Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentHistory.map((entry, index) => (
              <div key={entry.id} className="flex items-start space-x-4">
                {/* Timeline Dot */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  {index < paymentHistory.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-300 mt-2"></div>
                  )}
                </div>

                {/* Timeline Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{entry.action}</span>
                      {getStatusBadge(entry.status)}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    By {entry.user} • {entry.notes}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Outstanding Amount Alert */}
      {remainingAmount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Outstanding Payment:</strong>{" "}
            {formatCurrency(remainingAmount)} remaining on this invoice.
            {paymentPercentage < 50 && (
              <span className="block mt-1 text-sm">
                Consider following up with the client for payment.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Fully Paid Celebration */}
      {remainingAmount <= 0 && totalPaid > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Payment Complete!</strong> This invoice has been fully paid.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PaymentStatusTracker;
