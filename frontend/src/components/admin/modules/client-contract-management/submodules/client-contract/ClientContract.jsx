import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Download,
  Upload,
  Calendar,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  ArrowLeft,
  Paperclip,
} from "lucide-react";
import { clientContractAPI, clientAPI } from "../../../../../../services/api";

const ClientContract = ({ currentTheme, onBack }) => {
  // Data states
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [contractParticulars, setContractParticulars] = useState({});
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    per_page: 15,
    total: 0,
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    contract_type: "",
    contract_start_date: "",
    contract_end_date: "",
    selected_particulars: [],
    attachment_1: null,
    attachment_2: null,
    attachment_3: null,
    notes: "",
  });

  // Statistics
  const [stats, setStats] = useState({
    totalContracts: 0,
    activeContracts: 0,
    expiringContracts: 0,
    expiredContracts: 0,
  });

  // Contract particulars structure based on requirements
  const defaultContractParticulars = {
    statutory: [
      { code: "ATTENDANCE", name: "ATTENDANCE", category: "statutory" },
      { code: "PAYE", name: "P.A.Y.E", category: "statutory" },
      { code: "PENSION", name: "PENSION", category: "statutory" },
      { code: "NHF", name: "NHF", category: "statutory" },
      { code: "ECA", name: "ECA", category: "statutory" },
      { code: "GLI", name: "GLI", category: "statutory" },
    ],
    outsourcing: [
      { code: "ITF", name: "ITF", category: "outsourcing" },
      { code: "HMO", name: "HMO", category: "outsourcing" },
      { code: "TRAINING", name: "TRAINING", category: "outsourcing" },
      { code: "WELFARE", name: "WELFARE", category: "outsourcing" },
      { code: "YELUTIDE", name: "YELUTIDE", category: "outsourcing" },
      {
        code: "FIDELITY_GUARANTY",
        name: "FIDELITY GUARANTY",
        category: "outsourcing",
      },
    ],
    others: [
      { code: "VAT_REMITTANCE", name: "VAT REMITTANCE", category: "others" },
    ],
  };

  // Load data on mount
  useEffect(() => {
    loadContracts();
    loadClients();
    loadContractParticulars();
  }, [currentPage, searchTerm, filterClient, filterStatus]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: pagination.per_page,
        search: searchTerm,
        client_id: filterClient,
        status: filterStatus,
      };

      const response = await clientContractAPI.getAll(params);
      if (response.success) {
        setContracts(response.data.data || []);
        setPagination(response.data.pagination || pagination);

        // Calculate statistics
        const stats = response.data.statistics || {
          totalContracts: response.data.data?.length || 0,
          activeContracts:
            response.data.data?.filter((c) => c.status === "active").length ||
            0,
          expiringContracts:
            response.data.data?.filter(
              (c) => c.contract_status === "Expiring Soon"
            ).length || 0,
          expiredContracts:
            response.data.data?.filter((c) => c.contract_status === "Expired")
              .length || 0,
        };
        setStats(stats);
      }
    } catch (error) {
      console.error("Error loading contracts:", error);
      alert("Error loading contracts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await clientAPI.getAll({ per_page: 1000 });
      if (response.success) {
        let clientsData = [];
        if (response.data.data && Array.isArray(response.data.data)) {
          clientsData = response.data.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          clientsData = response.data.items;
        } else if (Array.isArray(response.data)) {
          clientsData = response.data;
        }
        setClients(clientsData);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const loadContractParticulars = async () => {
    try {
      const response = await clientContractAPI.getContractParticulars();
      if (response.success && response.data) {
        setContractParticulars(response.data);
      } else {
        // Fallback to default structure
        setContractParticulars(defaultContractParticulars);
      }
    } catch (error) {
      console.error("Error loading contract particulars:", error);
      // Use default structure as fallback
      setContractParticulars(defaultContractParticulars);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const response = editingContract
        ? await clientContractAPI.update(editingContract.id, formData)
        : await clientContractAPI.create(formData);

      if (response.success) {
        alert(
          editingContract
            ? "Contract updated successfully!"
            : "Contract created successfully!"
        );
        resetForm();
        setShowForm(false);
        loadContracts();
      } else {
        alert(response.message || "Error saving contract");
      }
    } catch (error) {
      console.error("Error saving contract:", error);
      alert("Error saving contract. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (contract) => {
    setFormData({
      client_id: contract.client_id || "",
      contract_type: contract.contract_type || "",
      contract_start_date: contract.contract_start_date || "",
      contract_end_date: contract.contract_end_date || "",
      selected_particulars: contract.selected_particulars || [],
      attachment_1: null,
      attachment_2: null,
      attachment_3: null,
      notes: contract.notes || "",
    });
    setEditingContract(contract);
    setShowForm(true);
  };

  const handleDelete = async (contractId) => {
    if (window.confirm("Are you sure you want to delete this contract?")) {
      try {
        const response = await clientContractAPI.delete(contractId);
        if (response.success) {
          alert("Contract deleted successfully!");
          loadContracts();
        } else {
          alert(response.message || "Error deleting contract");
        }
      } catch (error) {
        console.error("Error deleting contract:", error);
        alert("Error deleting contract. Please try again.");
      }
    }
  };

  const handleStatusToggle = async (contractId) => {
    try {
      const response = await clientContractAPI.toggleStatus(contractId);
      if (response.success) {
        alert(response.message);
        loadContracts();
      } else {
        alert(response.message || "Error updating status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Error updating status. Please try again.");
    }
  };

  const handleParticularChange = (particularCode, isChecked) => {
    setFormData((prev) => ({
      ...prev,
      selected_particulars: isChecked
        ? [...prev.selected_particulars, particularCode]
        : prev.selected_particulars.filter((code) => code !== particularCode),
    }));
  };

  const handleFileChange = (e, attachmentNumber) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Only PDF, DOC, and DOCX files are allowed");
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [`attachment_${attachmentNumber}`]: file,
    }));
  };

  const resetForm = () => {
    setFormData({
      client_id: "",
      contract_type: "",
      contract_start_date: "",
      contract_end_date: "",
      selected_particulars: [],
      attachment_1: null,
      attachment_2: null,
      attachment_3: null,
      notes: "",
    });
    setEditingContract(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "inactive":
        return "text-gray-600 bg-gray-100";
      case "expired":
        return "text-red-600 bg-red-100";
      case "terminated":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getContractStatusColor = (contractStatus) => {
    switch (contractStatus) {
      case "Active":
        return "text-green-600 bg-green-100";
      case "Expiring Soon":
        return "text-yellow-600 bg-yellow-100";
      case "Expired":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Form component - Compact floating modal
  if (showForm) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                CLIENT CONTRACT - {editingContract ? "EDIT" : "ADD"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Contract Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contract Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.client_id}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          client_id: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.contract_type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          contract_type: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Outsourcing Services Contract"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract Start Date{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.contract_start_date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          contract_start_date: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contract End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.contract_end_date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          contract_end_date: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contract Particulars/Services */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contract Particulars/Services
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(contractParticulars).map(
                    ([category, particulars]) => (
                      <div key={category} className="space-y-3">
                        <h4 className="font-medium text-gray-900 uppercase text-sm border-b pb-2">
                          {category === "statutory" && "CONTRACT - STATUTORY"}
                          {category === "outsourcing" &&
                            "OTHER OUTSOURCING COST"}
                          {category === "others" && "OTHERS"}
                        </h4>
                        <div className="space-y-2">
                          {particulars.map((particular) => (
                            <label
                              key={particular.code}
                              className="flex items-center space-x-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={formData.selected_particulars.includes(
                                  particular.code
                                )}
                                onChange={(e) =>
                                  handleParticularChange(
                                    particular.code,
                                    e.target.checked
                                  )
                                }
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-gray-700">
                                {particular.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contract Attachments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((num) => (
                    <div key={num}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attachment {num}
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => handleFileChange(e, num)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <div className="mt-1 text-xs text-gray-500">
                          PDF, DOC, DOCX files only. Max 5MB
                        </div>
                      </div>
                      {formData[`attachment_${num}`] && (
                        <div className="mt-2 text-sm text-green-600 flex items-center">
                          <Paperclip className="w-4 h-4 mr-1" />
                          {formData[`attachment_${num}`].name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter any additional contract notes or terms..."
                />
              </div>
            </form>
          </div>

          {/* Modal Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={formLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {formLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <Save className="w-4 h-4" />
              <span>
                {editingContract ? "Update Contract" : "Create Contract"}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view component
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
              Client Contract Management
            </h1>
            <p className={`${currentTheme.textSecondary} mt-1`}>
              Manage client contracts, terms, and particulars
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Contract</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Contracts</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalContracts}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Contracts</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.activeContracts}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.expiringContracts}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Expired</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.expiredContracts}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm("");
              setFilterClient("");
              setFilterStatus("all");
              setCurrentPage(1);
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contract Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-gray-600">
                        Loading contracts...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No contracts found. Click "New Contract" to get started.
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {contract.contract_code}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-48">
                          {contract.contract_type}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {contract.client_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(contract.contract_start_date)} -{" "}
                        {formatDate(contract.contract_end_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            contract.status
                          )}`}
                        >
                          {contract.status?.charAt(0).toUpperCase() +
                            contract.status?.slice(1)}
                        </span>
                        {contract.contract_status && (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getContractStatusColor(
                              contract.contract_status
                            )}`}
                          >
                            {contract.contract_status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(contract)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit Contract"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusToggle(contract.id)}
                          className="text-yellow-600 hover:text-yellow-900 transition-colors"
                          title="Toggle Status"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(contract.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete Contract"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1}{" "}
              to{" "}
              {Math.min(
                pagination.current_page * pagination.per_page,
                pagination.total
              )}{" "}
              of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.total_pages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientContract;
