import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui";
import { useInvoices } from "../../hooks/useInvoices";
import { useClients } from "../../hooks/useClients";
import ClientSetupComponent from "./ClientSetupComponent";
import AttendanceUploadComponent from "./AttendanceUploadComponent";
import InvoiceDetailView from "./InvoiceDetailView";
import FilePreviewComponent from "./FilePreviewComponent";
import BatchUploadComponent from "./BatchUploadComponent";
import TemplateDownloadComponent from "./TemplateDownloadComponent";
import { InvoiceListSkeleton, LoadingSpinner } from "../common/LoadingAnimations";
import ErrorBoundaryComponent from "../common/ErrorBoundaryComponent";
import UserGuidanceComponent from "../common/UserGuidanceComponent";
import {
  FileText,
  Download,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Eye,
  Trash2,
  RefreshCw,
  HelpCircle,
  Upload,
  Settings,
} from "lucide-react";

const InvoiceDashboard = () => {
  const {
    invoices,
    statistics,
    availableAttendance,
    pagination,
    filters,
    loading,
    loadingStats,
    error,
    generateInvoice,
    exportToExcel,
    deleteInvoice,
    updateFilters,
    goToPage,
    clearFilters,
    refresh,
    formatCurrency,
    formatDate,
  } = useInvoices();

  const { clients } = useClients();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserGuide, setShowUserGuide] = useState(false);

  // Handle invoice generation
  const handleGenerateInvoice = async (formData) => {
    try {
      setGeneratingInvoice(true);
      await generateInvoice(
        formData.attendanceUploadId,
        formData.invoiceType,
        formData.invoicePeriod
      );
      setShowGenerateModal(false);
      setSelectedAttendance(null);
    } catch (error) {
      console.error("Error generating invoice:", error);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  // Handle Excel export
  const handleExportToExcel = async (invoiceId) => {
    try {
      await exportToExcel(invoiceId);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // Handle invoice deletion
  const handleDeleteInvoice = async (invoiceId) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await deleteInvoice(invoiceId);
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  // Handle view invoice details
  const handleViewInvoice = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setCurrentView('detail');
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    setSelectedInvoiceId(null);
    setCurrentView('dashboard');
  };

  // Get status badge variant
  const getStatusBadge = (invoice) => {
    return (
      <Badge
        variant={invoice.invoice_type === "detailed" ? "default" : "secondary"}
      >
        {invoice.invoice_type.charAt(0).toUpperCase() +
          invoice.invoice_type.slice(1)}
      </Badge>
    );
  };

  // If viewing invoice detail
  if (currentView === 'detail' && selectedInvoiceId) {
    return (
      <InvoiceDetailView
        invoiceId={selectedInvoiceId}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            HRM Invoice System
          </h1>
          <p className="text-gray-600 mt-1">
            Professional invoice generation and management platform
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setShowUserGuide(true)} 
            variant="outline" 
            size="sm"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <GenerateInvoiceModal
                availableAttendance={availableAttendance}
                onGenerate={handleGenerateInvoice}
                loading={generatingInvoice}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">
            <FileText className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="batch">
            <Users className="h-4 w-4 mr-2" />
            Batch Upload
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Download className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="clients">
            <Settings className="h-4 w-4 mr-2" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="help">
            <HelpCircle className="h-4 w-4 mr-2" />
            Guide
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Error Handling */}
          {error && (
            <ErrorBoundaryComponent 
              error={{ message: error, name: 'Error' }}
              onRetry={refresh}
              onGoHome={() => setActiveTab('dashboard')}
            />
          )}

          {/* Dashboard Content */}
          {!error && (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  title="Total Invoices"
                  value={statistics?.total_invoices || 0}
                  icon={<FileText className="h-4 w-4" />}
                  loading={loadingStats}
                />
                <StatCard
                  title="Total Amount"
                  value={formatCurrency(statistics?.total_amount || 0)}
                  icon={<DollarSign className="h-4 w-4" />}
                  loading={loadingStats}
                />
                <StatCard
                  title="This Month"
                  value={statistics?.this_month_invoices || 0}
                  icon={<Calendar className="h-4 w-4" />}
                  loading={loadingStats}
                />
                <StatCard
                  title="Month Amount"
                  value={formatCurrency(statistics?.this_month_amount || 0)}
                  icon={<TrendingUp className="h-4 w-4" />}
                  loading={loadingStats}
                />
              </div>

              {/* Invoices Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <InvoiceListSkeleton count={5} />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice Number</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.length > 0 ? (
                          invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">
                                {invoice.invoice_number}
                              </TableCell>
                              <TableCell>{invoice.client?.client_name}</TableCell>
                              <TableCell>{invoice.invoice_period}</TableCell>
                              <TableCell>{getStatusBadge(invoice)}</TableCell>
                              <TableCell>
                                {formatCurrency(invoice.total_amount)}
                              </TableCell>
                              <TableCell>{formatDate(invoice.created_at)}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewInvoice(invoice.id)}
                                    title="View Invoice Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleExportToExcel(invoice.id)}
                                    title="Export to Excel"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteInvoice(invoice.id)}
                                    title="Delete Invoice"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-8 text-gray-500"
                            >
                              No invoices found. Upload attendance data to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Other Tab Contents */}
        <TabsContent value="upload">
          <AttendanceUploadComponent />
        </TabsContent>

        <TabsContent value="batch">
          <BatchUploadComponent />
        </TabsContent>

        <TabsContent value="templates">
          <TemplateDownloadComponent />
        </TabsContent>

        <TabsContent value="clients">
          <ClientSetupComponent />
        </TabsContent>

        <TabsContent value="help">
          <UserGuidanceComponent />
        </TabsContent>
      </Tabs>

      {/* User Guide Dialog */}
      <Dialog open={showUserGuide} onOpenChange={setShowUserGuide}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>User Guide & Help</DialogTitle>
          </DialogHeader>
          <UserGuidanceComponent />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Statistics Card Component
const StatCard = ({ title, value, icon, loading }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold">
            {loading ? <LoadingSpinner size="small" /> : value}
          </p>
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
    </CardContent>
  </Card>
);

// Generate Invoice Modal Component
const GenerateInvoiceModal = ({ availableAttendance, onGenerate, loading }) => {
  const [formData, setFormData] = useState({
    attendanceUploadId: "",
    invoiceType: "detailed",
    invoicePeriod: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.attendanceUploadId && formData.invoicePeriod) {
      onGenerate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Generate New Invoice</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Attendance Upload
          </label>
          <Select
            value={formData.attendanceUploadId}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, attendanceUploadId: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select attendance upload" />
            </SelectTrigger>
            <SelectContent>
              {availableAttendance.map((upload) => (
                <SelectItem key={upload.id} value={upload.id.toString()}>
                  {upload.client?.client_name} - {upload.upload_month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Invoice Type</label>
          <Select
            value={formData.invoiceType}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, invoiceType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="detailed">Detailed Invoice</SelectItem>
              <SelectItem value="summary">Summary Invoice</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Invoice Period
          </label>
          <Input
            value={formData.invoicePeriod}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                invoicePeriod: e.target.value,
              }))
            }
            placeholder="e.g., September 2025"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="submit"
            disabled={
              loading || !formData.attendanceUploadId || !formData.invoicePeriod
            }
          >
            {loading ? "Generating..." : "Generate Invoice"}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default InvoiceDashboard;