"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
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

const ClientServiceLocation = ({ currentTheme, preferences, onBack }) => {
  // Authentication
  const { isAuthenticated, hasRole } = useAuth();

  // Main state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClient, setFilterClient] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grouped"); // New: 'flat' or 'grouped'

  // Form states
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  // Data states
  const [locations, setLocations] = useState([]);
  const [groupedLocations, setGroupedLocations] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0,
  });

  // Dropdown data states
  const [clients, setClients] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Load initial data
  useEffect(() => {
    loadLocations();
    loadDropdownData();
  }, []);

  // Reload data when view mode changes
  useEffect(() => {
    loadLocations(1);
  }, [viewMode]);

  const loadDropdownData = async () => {
    // Implementation would be similar to original ClientService
    // Load clients, states, LGAs for dropdowns
  };

  const loadLocations = async (page = 1) => {
    // Only fetch if user is authenticated and has admin role
    if (!isAuthenticated || !hasRole("admin")) {
      return;
    }

    setLoading(true);
    try {
      if (viewMode === "grouped") {
        // Use grouped endpoint for grouped view
        const params = new URLSearchParams({
          search: searchTerm || "",
          status: filterStatus !== "all" ? filterStatus : "",
          client_id: filterClient || "",
        });

        const data = await apiService.makeRequest(
          `/service-locations/grouped-by-client?${params}`
        );

        if (data.success) {
          setGroupedLocations(data.data);
          // For grouped view, we don't need pagination
          setPagination({
            currentPage: 1,
            totalPages: 1,
            perPage: 10,
            total: Object.keys(data.data).length,
            hasNextPage: false,
            hasPrevPage: false,
          });
        }
      } else {
        // Use regular paginated endpoint for flat view
        const params = new URLSearchParams({
          page: page.toString(),
          search: searchTerm || "",
          status: filterStatus !== "all" ? filterStatus : "",
          client_id: filterClient || "",
          per_page: pagination.perPage?.toString() || "10",
        });

        const data = await apiService.makeRequest(
          `/service-locations?${params}`
        );

        if (data.success) {
          setLocations(data.data);
          // Handle cases where pagination might be undefined
          if (data.pagination) {
            setPagination(data.pagination);
          } else {
            // Fallback pagination structure
            setPagination({
              currentPage: 1,
              totalPages: 1,
              perPage: 10,
              total: data.data.length,
              hasNextPage: false,
              hasPrevPage: false,
            });
          }
        }
      }
    } catch (err) {
      setError(err.message);
      console.error("Error loading locations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async (locationData) => {
    try {
      const data = await apiService.makeRequest("/service-locations", {
        method: "POST",
        body: JSON.stringify(locationData),
      });

      if (data.success) {
        setShowLocationForm(false);
        loadLocations(currentPage);
        // Success notification would go here
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateLocation = async (id, locationData) => {
    try {
      const data = await apiService.makeRequest(`/service-locations/${id}`, {
        method: "PUT",
        body: JSON.stringify(locationData),
      });

      if (data.success) {
        setShowLocationForm(false);
        setEditingLocation(null);
        loadLocations(currentPage);
        // Success notification would go here
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteLocation = async (id) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      try {
        const data = await apiService.makeRequest(`/service-locations/${id}`, {
          method: "DELETE",
        });

        if (data.success) {
          loadLocations(currentPage);
          // Success notification would go here
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const toggleGroup = (groupName) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  // LocationMaster component (extracted from original)
  const LocationMaster = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
              Service Locations
            </h2>
            <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>
              Manage client service locations and geographic coverage
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadLocations(currentPage)}
              className={`px-4 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2`}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => {
                setEditingLocation(null);
                setShowLocationForm(true);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Location
            </button>
          </div>
        </div>

        {/* Filters */}
        <div
          className={`${currentTheme.cardBg} rounded-lg border ${currentTheme.border} p-4`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
              >
                Search Locations
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, city, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
              >
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
              >
                Client
              </label>
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                <option value="">All Clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.organisation_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
              >
                View Mode
              </label>
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  onClick={() => setViewMode("flat")}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === "flat"
                      ? "bg-purple-600 text-white"
                      : `${currentTheme.cardBg} ${currentTheme.textPrimary} hover:bg-gray-50 dark:hover:bg-gray-700`
                  }`}
                >
                  <List className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => setViewMode("grouped")}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === "grouped"
                      ? "bg-purple-600 text-white"
                      : `${currentTheme.cardBg} ${currentTheme.textPrimary} hover:bg-gray-50 dark:hover:bg-gray-700`
                  }`}
                >
                  <Grid3X3 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setCurrentPage(1);
                loadLocations(1);
              }}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <FileText className="w-5 h-5" />
              <span className="font-medium">Error loading locations</span>
            </div>
            <p className="text-red-700 dark:text-red-400 mt-1">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {viewMode === "flat" ? (
              <FlatLocationView />
            ) : (
              <GroupedLocationView />
            )}
          </>
        )}
      </div>
    );
  };

  const FlatLocationView = () => {
    return (
      <div
        className={`${currentTheme.cardBg} rounded-lg border ${currentTheme.border} overflow-hidden`}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${currentTheme.border} border-b`}>
              <tr>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}
                >
                  Location
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}
                >
                  Client
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}
                >
                  Address
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}
                >
                  Status
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium ${currentTheme.textSecondary} uppercase tracking-wider`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {locations.map((location) => (
                <tr
                  key={location.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-purple-600 mr-3" />
                      <div>
                        <div
                          className={`text-sm font-medium ${currentTheme.textPrimary}`}
                        >
                          {location.location_name}
                        </div>
                        <div
                          className={`text-sm ${currentTheme.textSecondary}`}
                        >
                          {location.city}, {location.lga}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${currentTheme.textPrimary}`}>
                      {location.client_name || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`text-sm ${currentTheme.textPrimary} max-w-xs truncate`}
                    >
                      {location.full_address || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        location.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                      }`}
                    >
                      {location.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingLocation(location);
                          setShowLocationForm(true);
                        }}
                        className={`p-2 rounded-lg ${currentTheme.cardBg} ${currentTheme.textPrimary} hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}
                        title="Edit Location"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete Location"
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className={`text-sm ${currentTheme.textSecondary}`}>
              Showing {(pagination.currentPage - 1) * pagination.perPage + 1} to{" "}
              {Math.min(
                pagination.currentPage * pagination.perPage,
                pagination.total
              )}{" "}
              of {pagination.total} locations
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage(pagination.currentPage - 1);
                  loadLocations(pagination.currentPage - 1);
                }}
                disabled={pagination.currentPage === 1}
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
              >
                Previous
              </button>
              <span className={`px-3 py-2 ${currentTheme.textPrimary}`}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => {
                  setCurrentPage(pagination.currentPage + 1);
                  loadLocations(pagination.currentPage + 1);
                }}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.cardBg} ${currentTheme.textPrimary} disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const GroupedLocationView = () => {
    return (
      <div className="space-y-4">
        {Object.entries(groupedLocations).map(
          ([clientName, clientLocations]) => (
            <div
              key={clientName}
              className={`${currentTheme.cardBg} rounded-lg border ${currentTheme.border}`}
            >
              <div
                className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => toggleGroup(clientName)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    <div>
                      <h3
                        className={`text-lg font-medium ${currentTheme.textPrimary}`}
                      >
                        {clientName}
                      </h3>
                      <p className={`text-sm ${currentTheme.textSecondary}`}>
                        {clientLocations.stats?.total_locations || 0} location
                        {(clientLocations.stats?.total_locations || 0) !== 1
                          ? "s"
                          : ""}
                      </p>
                    </div>
                  </div>
                  {expandedGroups.has(clientName) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {expandedGroups.has(clientName) && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {clientLocations.locations &&
                      clientLocations.locations.map((location) => (
                        <div
                          key={location.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-purple-600" />
                              <h4
                                className={`font-medium ${currentTheme.textPrimary}`}
                              >
                                {location.location_name}
                              </h4>
                            </div>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                location.is_active
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                              }`}
                            >
                              {location.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className={currentTheme.textSecondary}>
                              <span className="font-medium">City:</span>{" "}
                              {location.city}
                            </div>
                            <div className={currentTheme.textSecondary}>
                              <span className="font-medium">LGA:</span>{" "}
                              {location.lga}
                            </div>
                            {location.full_address && (
                              <div className={currentTheme.textSecondary}>
                                <span className="font-medium">Address:</span>
                                <div className="mt-1 text-xs">
                                  {location.full_address}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => {
                                setEditingLocation(location);
                                setShowLocationForm(true);
                              }}
                              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg ${currentTheme.cardBg} ${currentTheme.textPrimary} hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2`}
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteLocation(location.id)}
                              className="flex-1 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className={`p-2 rounded-lg ${currentTheme.cardBg} ${currentTheme.textPrimary} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
            Client Service Locations
          </h1>
          <p className={`text-lg ${currentTheme.textSecondary} mt-1`}>
            Manage client service locations and geographic coverage areas
          </p>
        </div>
      </div>

      {/* Main Content */}
      <LocationMaster />

      {/* Location Form Modal */}
      {showLocationForm && (
        <LocationMasterForm
          editingLocation={editingLocation}
          isOpen={showLocationForm}
          onClose={() => {
            setShowLocationForm(false);
            setEditingLocation(null);
          }}
          onSubmit={() => {
            // Form already makes the API call internally
            // Just refresh the list after successful creation/update
            setShowLocationForm(false);
            setEditingLocation(null);
            loadLocations(currentPage);
          }}
          clients={clients}
          states={states}
          lgas={lgas}
          currentTheme={currentTheme}
        />
      )}
    </div>
  );
};

export default ClientServiceLocation;
