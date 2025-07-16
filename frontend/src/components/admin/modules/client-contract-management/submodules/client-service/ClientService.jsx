"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Building2,
  ArrowLeft,
  Users,
  Plus,
  Search,
  Filter,
  Globe,
  FileText,
  MoreHorizontal,
  Eye,
  Edit3,
  Trash2,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import LocationMasterForm from "./LocationMasterForm";
import ServiceRequestForm from "./ServiceRequestForm";
import {
  serviceLocationAPI,
  serviceRequestAPI,
} from "../../../../../../services/api";

const ClientService = ({ currentTheme, preferences, onBack }) => {
  const [activeTab, setActiveTab] = useState("location-master");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClient, setFilterClient] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Form states
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editingService, setEditingService] = useState(null);

  // Data states
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    per_page: 15,
    total: 0,
  });

  // Statistics
  const [stats, setStats] = useState({
    totalLocations: 0,
    activeLocations: 0,
    solRegions: 0,
    clientZones: 0,
  });

  // SOL Colors
  const MIDNIGHT_BLUE = "#191970";
  const SOL_BLUE = "#0066CC";
  const SOL_RED = "#DC3545";

  // Load data when component mounts or filters change
  useEffect(() => {
    if (activeTab === "location-master") {
      loadLocations();
    } else {
      loadServices();
    }
  }, [activeTab, searchTerm, filterStatus, filterClient, currentPage]);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: 15,
        search: searchTerm,
        status: filterStatus,
      };

      if (filterClient) {
        params.client_id = filterClient;
      }

      const response = await serviceLocationAPI.getAll(params);

      if (response.success) {
        setLocations(response.data || []);
        setPagination(
          response.pagination || {
            current_page: 1,
            total_pages: 1,
            per_page: 15,
            total: 0,
          }
        );

        // Update statistics
        updateLocationStats(response.data);
      }
    } catch (error) {
      console.error("Error loading locations:", error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const response = await serviceRequestAPI.getAll();

      if (response.success) {
        setServices(response.data || []);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error("Error loading services:", error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const updateLocationStats = (locationData) => {
    const activeCount = locationData.filter((loc) => loc.is_active).length;
    const uniqueRegions = new Set(
      locationData.map((loc) => loc.sol_region).filter(Boolean)
    );
    const uniqueZones = new Set(
      locationData.map((loc) => loc.client_zone).filter(Boolean)
    );

    setStats({
      totalLocations: pagination.total || locationData.length,
      activeLocations: activeCount,
      solRegions: uniqueRegions.size,
      clientZones: uniqueZones.size,
    });
  };

  // Form handlers
  const handleLocationSave = async (locationData) => {
    await loadLocations();
    setShowLocationForm(false);
    setEditingLocation(null);
  };

  const handleServiceSave = async (serviceData) => {
    await loadServices();
    setShowServiceForm(false);
    setEditingService(null);
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setShowLocationForm(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleDeleteLocation = async (locationId) => {
    if (confirm("Are you sure you want to delete this location?")) {
      try {
        const response = await serviceLocationAPI.delete(locationId);
        if (response.success) {
          alert("Location deleted successfully!");
          await loadLocations();
        }
      } catch (error) {
        console.error("Error deleting location:", error);
        alert("Error deleting location. Please try again.");
      }
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
        const response = await serviceRequestAPI.delete(serviceId);
        if (response.success) {
          alert("Service deleted successfully!");
          await loadServices();
        }
      } catch (error) {
        console.error("Error deleting service:", error);
        alert("Error deleting service. Please try again.");
      }
    }
  };

  const LocationMaster = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Service Location Master
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage client service locations and SOL office assignments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadLocations}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              setEditingLocation(null); // Add this line
              setShowLocationForm(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Locations",
            value: stats.totalLocations.toString(),
            change: "+8",
            changeType: "positive",
            icon: Building2,
            color: "blue",
            bgGradient: "from-blue-500 to-blue-600",
          },
          {
            label: "Active Locations",
            value: stats.activeLocations.toString(),
            change: "+12",
            changeType: "positive",
            icon: Globe,
            color: "emerald",
            bgGradient: "from-emerald-500 to-emerald-600",
          },
          {
            label: "SOL Regions",
            value: stats.solRegions.toString(),
            change: "0",
            changeType: "neutral",
            icon: MapPin,
            color: "purple",
            bgGradient: "from-purple-500 to-purple-600",
          },
          {
            label: "Client Zones",
            value: stats.clientZones.toString(),
            change: "+2",
            changeType: "positive",
            icon: Users,
            color: "orange",
            bgGradient: "from-orange-500 to-orange-600",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 bg-gradient-to-r ${stat.bgGradient} rounded-lg flex items-center justify-center shadow-lg`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div
                className={`flex items-center space-x-1 text-xs font-medium ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : stat.changeType === "negative"
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {stat.changeType === "positive" && (
                  <TrendingUp className="w-3 h-3" />
                )}
                <span>{stat.change}</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search locations by name, code, or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SOL Office
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No locations found
                  </td>
                </tr>
              ) : (
                locations.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {location.location_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Code: {location.location_code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {location.client_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {location.city || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {location.sol_office_name || "Not Assigned"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          location.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {location.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditLocation(location)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(location.id)}
                          className="text-red-600 hover:text-red-900"
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
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(pagination.total_pages, prev + 1)
                  )
                }
                disabled={currentPage === pagination.total_pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * pagination.per_page + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * pagination.per_page,
                      pagination.total
                    )}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(pagination.total_pages, prev + 1)
                      )
                    }
                    disabled={currentPage === pagination.total_pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const RequestMaster = () => (
    <div className="space-y-6">
      {/* Similar structure for Request Master */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Service Request Master
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage service types and categories
          </p>
        </div>
        <button
          onClick={() => {
            setEditingService(null); // Add this line
            setShowServiceForm(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </button>
      </div>

      {/* Service Requests Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {service.service_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Code: {service.service_code}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {service.category}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        service.is_active === 1 || service.is_active === true
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {service.is_active === 1 || service.is_active === true
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditService(service)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
              Client Service Management
            </h1>
            <p className={`${currentTheme.textSecondary} mt-1`}>
              Configure service locations and request types
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-2 mb-6 border border-gray-100">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("location-master")}
            className={`flex-1 flex items-center justify-center space-x-3 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "location-master"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Location Master</span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                activeTab === "location-master"
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {stats.totalLocations}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("request-master")}
            className={`flex-1 flex items-center justify-center space-x-3 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "request-master"
                ? "bg-blue-900 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Request Master</span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                activeTab === "request-master"
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {services.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "location-master" && <LocationMaster />}
        {activeTab === "request-master" && <RequestMaster />}
      </div>

      {/* Forms */}
      <LocationMasterForm
        isOpen={showLocationForm}
        onClose={() => {
          setShowLocationForm(false);
          setEditingLocation(null);
        }}
        editingLocation={editingLocation}
        onSave={handleLocationSave}
      />

      <ServiceRequestForm
        isOpen={showServiceForm}
        onClose={() => {
          setShowServiceForm(false);
          setEditingService(null);
        }}
        editingService={editingService}
        onSave={handleServiceSave}
      />
    </div>
  );
};

export default ClientService;
