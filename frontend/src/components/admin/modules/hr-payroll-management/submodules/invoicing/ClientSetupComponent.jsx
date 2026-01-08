import React, { useState, useEffect } from "react";
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
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { useAllActiveClients } from "@/hooks/useClients";
import {
  Settings,
  Calculator,
  Users,
  DollarSign,
  Save,
  Eye,
  AlertCircle,
  Plus,
} from "lucide-react";

const ClientSetupComponent = () => {
  const {
    clients,
    loading: clientsLoading,
  } = useAllActiveClients();
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    email: "",
    phone: "",
    address: "",
    contact_person: "",
    pay_calculation_basis: "working_days",
    management_fee_percentage: 7.0,
    vat_rate: 7.5,
    wht_rate: 0.0,
    status: "active",
    // FIRS e-invoicing fields
    firs_tin: "",
    firs_business_description: "",
    firs_city: "",
    firs_postal_zone: "",
    firs_country: "NG",
    firs_contact_telephone: "",
    firs_contact_email: "",
  });
  const [calculationPreview, setCalculationPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load selected client data into form
  useEffect(() => {
    if (selectedClient) {
      setFormData({
        client_name: selectedClient.client_name || "",
        email: selectedClient.email || "",
        phone: selectedClient.phone || "",
        address: selectedClient.address || "",
        contact_person: selectedClient.contact_person || "",
        pay_calculation_basis:
          selectedClient.pay_calculation_basis || "working_days",
        management_fee_percentage: parseFloat(
          selectedClient.management_fee_percentage || 7.0
        ),
        vat_rate: 7.5,
        wht_rate: 0.0,
        status: selectedClient.status || "active",
        // FIRS e-invoicing fields
        firs_tin: selectedClient.firs_tin || "",
        firs_business_description:
          selectedClient.firs_business_description || "",
        firs_city: selectedClient.firs_city || "",
        firs_postal_zone: selectedClient.firs_postal_zone || "",
        firs_country: selectedClient.firs_country || "NG",
        firs_contact_telephone: selectedClient.firs_contact_telephone || "",
        firs_contact_email: selectedClient.firs_contact_email || "",
      });
    }
  }, [selectedClient]);

  // Calculate preview when form changes
  useEffect(() => {
    if (formData.management_fee_percentage) {
      calculatePreview();
    }
  }, [
    formData.management_fee_percentage,
    formData.vat_rate,
    formData.wht_rate,
  ]);

  const calculatePreview = () => {
    // Sample calculation with ₦1,000,000 net payroll
    const sampleNetPayroll = 1000000;
    const managementFee =
      sampleNetPayroll * (formData.management_fee_percentage / 100);
    const vatAmount = managementFee * (formData.vat_rate / 100);
    const whtAmount =
      (sampleNetPayroll + managementFee) * (formData.wht_rate / 100);
    const totalInvoice =
      sampleNetPayroll + managementFee + vatAmount - whtAmount;

    setCalculationPreview({
      sampleNetPayroll,
      managementFee,
      vatAmount,
      whtAmount,
      totalInvoice,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (selectedClient) {
        await updateClient(selectedClient.id, formData);
      } else {
        await createClient(formData);
      }
      setIsEditing(false);
      // Refresh clients list would happen via the hook
    } catch (error) {
      console.error("Error saving client:", error);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Client Setup & Configuration
          </h2>
          <p className="text-gray-600">
            Configure client details and payroll calculation settings
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedClient(null);
            setFormData({
              client_name: "",
              email: "",
              phone: "",
              address: "",
              contact_person: "",
              pay_calculation_basis: "working_days",
              management_fee_percentage: 7.0,
              vat_rate: 7.5,
              wht_rate: 0.0,
              status: "active",
            });
            setIsEditing(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Client
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Select Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientsLoading ? (
              <div className="text-center py-4">Loading clients...</div>
            ) : (
              <div className="space-y-2">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClient(client);
                      setIsEditing(false);
                    }}
                    className={`w-full p-3 text-left border rounded-lg hover:bg-gray-50 ${
                      selectedClient?.id === client.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="font-medium">
                      {client.client_name || client.organisation_name}
                    </div>
                    <div className="text-sm text-gray-600">{client.email}</div>
                    <div className="text-xs text-gray-500">
                      Fee: {client.management_fee_percentage || 7}% |{" "}
                      {client.pay_calculation_basis}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Configuration Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                {selectedClient ? "Client Configuration" : "New Client Setup"}
              </CardTitle>
              {selectedClient && !isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedClient && !isEditing ? (
              <div className="text-center py-8 text-gray-500">
                Select a client from the list or create a new one to configure
                settings
              </div>
            ) : (
              <Tabs defaultValue="basic" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="payroll">Payroll Settings</TabsTrigger>
                  <TabsTrigger value="firs">FIRS Settings</TabsTrigger>
                  <TabsTrigger value="preview">Calculation Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Client Name *
                      </label>
                      <Input
                        value={formData.client_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            client_name: e.target.value,
                          }))
                        }
                        placeholder="Enter client name"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="client@company.com"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phone
                      </label>
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="+234-XXX-XXX-XXXX"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Contact Person
                      </label>
                      <Input
                        value={formData.contact_person}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            contact_person: e.target.value,
                          }))
                        }
                        placeholder="Primary contact name"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Address
                      </label>
                      <Input
                        value={formData.address}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        placeholder="Client address"
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="payroll" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Pay Calculation Basis
                      </label>
                      <Select
                        value={formData.pay_calculation_basis}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            pay_calculation_basis: value,
                          }))
                        }
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="working_days">
                            Working Days (22 days)
                          </SelectItem>
                          <SelectItem value="calendar_days">
                            Calendar Days (30 days)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-600 mt-1">
                        Basis for pro-rata calculations when employees work
                        partial months
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Management Fee (%)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={formData.management_fee_percentage}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            management_fee_percentage:
                              parseFloat(e.target.value) || 0,
                          }))
                        }
                        disabled={!isEditing}
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Percentage of net payroll charged as management fee
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        VAT Rate (%)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={formData.vat_rate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            vat_rate: parseFloat(e.target.value) || 0,
                          }))
                        }
                        disabled={!isEditing}
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        VAT applied to management fee (typically 7.5%)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Withholding Tax (%)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={formData.wht_rate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            wht_rate: parseFloat(e.target.value) || 0,
                          }))
                        }
                        disabled={!isEditing}
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        WHT deducted from total invoice (if applicable)
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="firs" className="space-y-4">
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="text-sm text-blue-700">
                          <p className="font-medium mb-1">
                            FIRS E-Invoicing Settings
                          </p>
                          <p>
                            Configure Federal Inland Revenue Service (FIRS)
                            e-invoicing compliance details for this client. TIN
                            is mandatory for FIRS integration.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Tax Identification Number (TIN) *
                        </label>
                        <Input
                          value={formData.firs_tin}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              firs_tin: e.target.value,
                            }))
                          }
                          placeholder="Enter TIN for FIRS compliance"
                          disabled={!isEditing}
                          className={
                            !formData.firs_tin && isEditing
                              ? "border-red-300"
                              : ""
                          }
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Required for FIRS e-invoicing submission
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Business Description
                        </label>
                        <Input
                          value={formData.firs_business_description}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              firs_business_description: e.target.value,
                            }))
                          }
                          placeholder="Brief description of business"
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          City
                        </label>
                        <Input
                          value={formData.firs_city}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              firs_city: e.target.value,
                            }))
                          }
                          placeholder="City"
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Postal Zone
                        </label>
                        <Input
                          value={formData.firs_postal_zone}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              firs_postal_zone: e.target.value,
                            }))
                          }
                          placeholder="Postal code or zone"
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Country
                        </label>
                        <Select
                          value={formData.firs_country}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              firs_country: value,
                            }))
                          }
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NG">Nigeria</SelectItem>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Contact Telephone
                        </label>
                        <Input
                          value={formData.firs_contact_telephone}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              firs_contact_telephone: e.target.value,
                            }))
                          }
                          placeholder="+234-XXX-XXX-XXXX"
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">
                          Contact Email
                        </label>
                        <Input
                          type="email"
                          value={formData.firs_contact_email}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              firs_contact_email: e.target.value,
                            }))
                          }
                          placeholder="contact@company.com"
                          disabled={!isEditing}
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Used for FIRS correspondence and notifications
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-700">
                        <p className="font-medium mb-2">
                          FIRS Integration Status
                        </p>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              formData.firs_tin ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></div>
                          <span
                            className={
                              formData.firs_tin
                                ? "text-green-700"
                                : "text-red-700"
                            }
                          >
                            {formData.firs_tin
                              ? "Ready for FIRS e-invoicing"
                              : "TIN required for FIRS integration"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview">
                  <CalculationPreview
                    preview={calculationPreview}
                    formData={formData}
                  />
                </TabsContent>
              </Tabs>
            )}

            {isEditing && (
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !formData.client_name}
                >
                  {saving
                    ? "Saving..."
                    : selectedClient
                    ? "Update Client"
                    : "Create Client"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Calculation Preview Component
const CalculationPreview = ({ preview, formData }) => {
  if (!preview) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Configure payroll settings to see calculation preview</p>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return `₦${amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This preview shows how invoice calculations will work with a sample
          ₦1,000,000 net payroll
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Invoice Calculation Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Net Payroll (Sample)</span>
              <span className="font-medium">
                {formatCurrency(preview.sampleNetPayroll)}
              </span>
            </div>
            <div className="flex justify-between items-center text-green-600">
              <span>
                + Management Fee ({formData.management_fee_percentage}%)
              </span>
              <span className="font-medium">
                +{formatCurrency(preview.managementFee)}
              </span>
            </div>
            <div className="flex justify-between items-center text-green-600">
              <span>+ VAT on Fee ({formData.vat_rate}%)</span>
              <span className="font-medium">
                +{formatCurrency(preview.vatAmount)}
              </span>
            </div>
            {preview.whtAmount > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span>- Withholding Tax ({formData.wht_rate}%)</span>
                <span className="font-medium">
                  -{formatCurrency(preview.whtAmount)}
                </span>
              </div>
            )}
            <hr className="border-gray-200" />
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Invoice Amount</span>
              <span>{formatCurrency(preview.totalInvoice)}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Tax Compliance Notes:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • PAYE, Pension (8%), and NSITF (1%) are automatically calculated
              </li>
              <li>
                • Management fee is applied to net payroll after all deductions
              </li>
              <li>
                • VAT is charged on management fees as per Nigerian tax law
              </li>
              <li>
                • Pay calculation basis affects pro-rata calculations for
                partial months
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientSetupComponent;
