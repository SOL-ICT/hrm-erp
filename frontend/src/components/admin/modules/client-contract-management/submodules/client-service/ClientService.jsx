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
  CheckCircle,
  ChevronDown,
  ChevronRight,
  List,
  Grid3X3,
} from "lucide-react";
import LocationMasterForm from "./LocationMasterForm";
import { serviceLocationsAPI } from "../../../../../../services/api";

const ClientService = ({ currentTheme, preferences, onBack }) => {
  // Main state
  const [activeTab, setActiveTab] = useState("location-master");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClient, setFilterClient] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grouped"); // New: 'flat' or 'grouped'

  // Form states
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editingService, setEditingService] = useState(null);

  // Data states
  const [locations, setLocations] = useState([]);
  const [groupedLocations, setGroupedLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [groupedServices, setGroupedServices] = useState({});
  const [expandedClient, setExpandedClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);
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
    totalClients: 0,
    totalServiceTypes: 0,
    activeServices: 0,
    totalServices: 0,
  });

  // Load data on mount and tab change
  useEffect(() => {
    if (activeTab === "location-master") {
      loadLocations();
    } else if (activeTab === "request-master") {
      loadServices();
    }
  }, [
    activeTab,
    currentPage,
    searchTerm,
    filterStatus,
    filterClient,
    viewMode,
  ]);

  // Load locations function
  const loadLocations = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        per_page: pagination.per_page,
        search: searchTerm,
        status: filterStatus,
        client: filterClient,
      };

      // Choose API based on view mode
      const response =
        viewMode === "grouped"
          ? await serviceLocationsAPI.getGroupedByClient(params)
          : await serviceLocationsAPI.getAll(params);

      if (response.success) {
        if (viewMode === "grouped") {
          setGroupedLocations(response.data || []);
          // For grouped view, flatten for stats calculation
          const allLocations = response.data.reduce((acc, client) => {
            return acc.concat(client.locations || []);
          }, []);
          updateLocationStats(allLocations);
        } else {
          const locationData = response.data || [];
          setLocations(locationData);
          setPagination(response.pagination || pagination);
          updateLocationStats(locationData);
        }
      } else {
        setLocations([]);
        setGroupedLocations([]);
      }
    } catch (error) {
      console.error("Error loading locations:", error);
      setLocations([]);
      setGroupedLocations([]);
    } finally {
      setLoading(false);
    }
  };

  // Load services function
  const loadServices = async () => {
    try {
      setServiceLoading(true);
      const response = await serviceRequestsAPI.getAll();
      if (response.success) {
        const servicesData = response.data || [];
        setServices(servicesData);

        // Group services by client name
        const grouped = servicesData.reduce((acc, service) => {
          const clientName = service.client_name || "Unknown Client";
          if (!acc[clientName]) {
            acc[clientName] = [];
          }
          acc[clientName].push(service);
          return acc;
        }, {});

        setGroupedServices(grouped);

        // Update statistics
        const uniqueClients = Object.keys(grouped).length;
        const totalServiceTypes = servicesData.length;
        const activeServices = servicesData.filter((s) => s.is_active).length;

        setStats((prevStats) => ({
          ...prevStats,
          totalClients: uniqueClients,
          totalServiceTypes: totalServiceTypes,
          activeServices: activeServices,
          totalServices: totalServiceTypes,
        }));
      } else {
        setServices([]);
        setGroupedServices({});
      }
    } catch (error) {
      console.error("Error loading services:", error);
      setServices([]);
      setGroupedServices({});
    } finally {
      setServiceLoading(false);
    }
  };

  // Update location stats
  const updateLocationStats = (locationData) => {
    const activeCount = locationData.filter((loc) => loc.is_active).length;
    const uniqueRegions = new Set(
      locationData.map((loc) => loc.sol_region).filter(Boolean)
    );
    const uniqueZones = new Set(
      locationData.map((loc) => loc.client_zone).filter(Boolean)
    );

    setStats((prevStats) => ({
      ...prevStats,
      totalLocations: pagination.total || locationData.length,
      activeLocations: activeCount,
      solRegions: uniqueRegions.size,
      clientZones: uniqueZones.size,
    }));
  };

  // Toggle client group (accordion behavior)
  const toggleClientGroup = (clientName) => {
    setExpandedClient(expandedClient === clientName ? null : clientName);
  };

  // Form handlers
  const handleLocationSave = async () => {
    await loadLocations();
    setShowLocationForm(false);
    setEditingLocation(null);
  };

  const handleServiceSave = async () => {
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
    if (window.confirm("Are you sure you want to delete this location?")) {
      try {
        const response = await serviceLocationsAPI.delete(locationId);
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
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        const response = await serviceRequestsAPI.delete(serviceId);
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

  // Location Master Component
  const LocationMaster = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Service Location Master
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage client service locations and assignments
          </p>
        </div>
        <button
          onClick={() => {
            setEditingLocation(null);
            setShowLocationForm(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </button>
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

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">View:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grouped")}
              className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === "grouped"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Grid3X3 className="w-4 h-4 mr-1" />
              Grouped by Client
            </button>
            <button
              onClick={() => setViewMode("flat")}
              className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === "flat"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <List className="w-4 h-4 mr-1" />
              Flat List
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingLocation(null);
            setShowLocationForm(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </button>
      </div>

      {/* Locations Display */}
      {viewMode === "grouped" ? (
        <GroupedLocationsView />
      ) : (
        <FlatLocationsTable />
      )}
    </div>
  );

  // Grouped Locations View Component
  const GroupedLocationsView = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : groupedLocations.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No locations found
          </h3>
          <p className="text-gray-500">
            No service locations match your current filters.
          </p>
        </div>
      ) : (
        groupedLocations.map((clientGroup) => (
          <div
            key={clientGroup.client_id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            {/* Client Header */}
            <div
              className="bg-gray-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleClientGroup(clientGroup.client_name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center text-gray-600">
                    {expandedClient === clientGroup.client_name ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {clientGroup.client_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Code: {clientGroup.client_code} •{" "}
                      {clientGroup.stats.total_locations} location
                      {clientGroup.stats.total_locations !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Client Stats */}
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {clientGroup.stats.active_locations} Active
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {clientGroup.stats.assigned_to_sol} Assigned
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                      {clientGroup.stats.cities.length} Cities
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Locations - Collapsible */}
            {expandedClient === clientGroup.client_name && (
              <div className="px-6 py-4">
                <div className="grid gap-3">
                  {clientGroup.locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-900">
                                {location.location_name}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({location.location_code})
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-600">
                              {location.city} • SOL:{" "}
                              {location.sol_office_name || "Not Assigned"}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                location.is_active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {location.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEditLocation(location)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Location"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(location.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Location"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  // Flat Locations Table Component
  const FlatLocationsTable = () => (
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
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
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
    </div>
  );

  // Request Master Component with Collapsible Groups
  const RequestMaster = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Service Request Master
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage client service types and categories - Grouped by Client
          </p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setShowServiceForm(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          disabled={serviceLoading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service Type
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Clients with Services</p>
              <p className="text-2xl font-bold text-blue-600">
                {Object.keys(groupedServices).length}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Service Types</p>
              <p className="text-2xl font-bold text-emerald-600">
                {stats.totalServiceTypes}
              </p>
            </div>
            <FileText className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Services</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.activeServices}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Services/Client</p>
              <p className="text-2xl font-bold text-purple-600">
                {Object.keys(groupedServices).length > 0
                  ? Math.round(
                      (stats.totalServiceTypes /
                        Object.keys(groupedServices).length) *
                        10
                    ) / 10
                  : 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Collapsible Client Groups */}
      <div className="space-y-4">
        {serviceLoading ? (
          // Loading State
          <div className="space-y-4">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div>
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16"></div>
                  </div>
                </div>
              </div>
            ))}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">
                  Loading service types...
                </span>
              </div>
            </div>
          </div>
        ) : Object.keys(groupedServices).length === 0 ? (
          // Empty State
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12">
            <div className="text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">
                No service types found
              </h3>
              <p className="text-sm mb-4">
                Click "Add Service Type" to get started.
              </p>
              <button
                onClick={() => {
                  setEditingService(null);
                  setShowServiceForm(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Service Type
              </button>
            </div>
          </div>
        ) : (
          // Client Groups
          Object.entries(groupedServices).map(
            ([clientName, clientServices]) => {
              const isExpanded = expandedClient === clientName;

              return (
                <div
                  key={clientName}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Clickable Client Header */}
                  <div
                    className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-colors"
                    onClick={() => toggleClientGroup(clientName)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {clientName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {clientServices[0]?.client_code} •{" "}
                            {clientServices.length} service type
                            {clientServices.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {clientServices.filter((s) => s.is_active).length}{" "}
                          Active
                        </span>
                        {clientServices.filter((s) => !s.is_active).length >
                          0 && (
                          <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            {clientServices.filter((s) => !s.is_active).length}{" "}
                            Inactive
                          </span>
                        )}
                        <ChevronDown
                          className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Service Types Grid */}
                  {isExpanded && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clientServices.map((service) => (
                          <div
                            key={service.id}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                              service.is_active
                                ? "border-green-200 bg-green-50 hover:border-green-300"
                                : "border-gray-200 bg-gray-50 hover:border-gray-300"
                            }`}
                          >
                            {/* Service Type Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900 text-sm mb-1">
                                  {service.service_type}
                                </h5>
                                <p className="text-xs text-gray-600 mb-2">
                                  {service.service_name}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditService(service);
                                  }}
                                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Edit Service"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteService(service.id);
                                  }}
                                  className="p-1 text-red-600 hover:text-red-800 transition-colors"
                                  title="Delete Service"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Service Code */}
                            <div className="mb-3">
                              <div className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono text-gray-700">
                                <FileText className="w-3 h-3 mr-1" />
                                {service.service_code}
                              </div>
                            </div>

                            {/* Description */}
                            {service.description && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {service.description}
                                </p>
                              </div>
                            )}

                            {/* Status Badge */}
                            <div className="flex items-center justify-between">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  service.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {service.is_active ? "Active" : "Inactive"}
                              </span>
                              <div className="text-xs text-gray-500">
                                {new Date(
                                  service.created_at
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          )
        )}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={loadServices}
          disabled={serviceLoading}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${serviceLoading ? "animate-spin" : ""}`}
          />
          {serviceLoading ? "Refreshing..." : "Refresh Services"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
                Client Service Management
              </h1>
              <p className={`${currentTheme.textSecondary} mt-1`}>
                Manage service locations and request types for clients
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("location-master")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "location-master"
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Location Master</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("request-master")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "request-master"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Request Master</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "location-master" && <LocationMaster />}
            {activeTab === "request-master" && <RequestMaster />}
          </div>
        </div>
      </div>

      {/* Forms */}
      <LocationMasterForm
        isOpen={showLocationForm}
        onClose={() => setShowLocationForm(false)}
        editingLocation={editingLocation}
        onSave={handleLocationSave}
      />

      <ServiceRequestForm
        isOpen={showServiceForm}
        onClose={() => setShowServiceForm(false)}
        editingService={editingService}
        onSave={handleServiceSave}
      />
    </div>
  );
};

export default ClientService;
