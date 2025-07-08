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
} from "lucide-react";
import LocationMasterForm from "./LocationMasterForm";
import ServiceRequestForm from "./ServiceRequestForm";

const ClientService = ({ currentTheme, preferences, onBack }) => {
  const [activeTab, setActiveTab] = useState("location-master");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form states
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editingService, setEditingService] = useState(null);

  // Data states
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // SOL Colors
  const MIDNIGHT_BLUE = "#191970";
  const SOL_BLUE = "#0066CC";
  const SOL_RED = "#DC3545";

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Sample data - replace with actual API calls
      setLocations([
        {
          id: 1,
          location_code: "ACC-VI-001",
          location_name: "Victoria Island Branch",
          address: "999C Danmole Street, Victoria Island",
          client_name: "Access Bank Hydrogen",
          sol_region: "South West",
          sol_zone: "Lagos Zone",
          client_region: "Lagos Region",
          client_zone: "Island Zone",
          status: "active",
        },
        {
          id: 2,
          location_code: "FBN-MAR-001",
          location_name: "Marina Head Office",
          address: "35 Marina, Lagos Island",
          client_name: "First Bank Nigeria",
          sol_region: "South West",
          sol_zone: "Lagos Zone",
          client_region: "Lagos Region",
          client_zone: "Marina Zone",
          status: "active",
        },
        {
          id: 3,
          location_code: "ZEN-ABJ-001",
          location_name: "Abuja Regional Office",
          address: "Plot 84, Ademola Adetokunbo Crescent, Wuse II",
          client_name: "Zenith Bank PLC",
          sol_region: "North Central",
          sol_zone: "FCT Zone",
          client_region: "FCT Region",
          client_zone: "Central Zone",
          status: "pending",
        },
      ]);

      setServices([
        {
          id: 1,
          service_code: "ACC001",
          service_name: "Account Officer",
          description: "Manage client accounts and financial records",
          category: "Finance",
          status: "active",
        },
        {
          id: 2,
          service_code: "ADM001",
          service_name: "Administrative Officer",
          description: "General administrative support and coordination",
          category: "Administration",
          status: "active",
        },
        {
          id: 3,
          service_code: "SEC001",
          service_name: "Security Officer",
          description: "Provide security services and surveillance",
          category: "Security",
          status: "active",
        },
        {
          id: 4,
          service_code: "CLN001",
          service_name: "Cleaning Services",
          description: "Professional cleaning and maintenance services",
          category: "Maintenance",
          status: "active",
        },
        {
          id: 5,
          service_code: "IT001",
          service_name: "IT Support",
          description: "Information technology support and maintenance",
          category: "Technology",
          status: "active",
        },
        {
          id: 6,
          service_code: "HR001",
          service_name: "HR Specialist",
          description: "Human resources management and recruitment",
          category: "Human Resources",
          status: "active",
        },
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const handleLocationSave = async (locationData) => {
    try {
      console.log("Saving location:", locationData);
      // API call would go here
      await loadData(); // Refresh data
      setShowLocationForm(false);
      setEditingLocation(null);
    } catch (error) {
      console.error("Error saving location:", error);
    }
  };

  const handleServiceSave = async (serviceData) => {
    try {
      console.log("Saving service:", serviceData);
      // API call
      await loadData(); // Refresh data
      setShowServiceForm(false);
      setEditingService(null);
    } catch (error) {
      console.error("Error saving service:", error);
    }
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
        console.log("Deleting location:", locationId);
        // API call would go here
        await loadData(); // Refresh data
      } catch (error) {
        console.error("Error deleting location:", error);
      }
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (confirm("Are you sure you want to delete this service?")) {
      try {
        console.log("Deleting service:", serviceId);
        // API call would go here
        await loadData(); // Refresh data
      } catch (error) {
        console.error("Error deleting service:", error);
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
            Manage client service locations and regional zone mapping
          </p>
        </div>
        <button
          onClick={() => setShowLocationForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </button>
      </div>

      {/* Stats Cards - Modern Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Total Locations",
            value: "245",
            change: "+8",
            changeType: "positive",
            icon: Building2,
            color: "blue",
            bgGradient: "from-blue-500 to-blue-600",
          },
          {
            label: "Active Locations",
            value: "238",
            change: "+12",
            changeType: "positive",
            icon: Globe,
            color: "emerald",
            bgGradient: "from-emerald-500 to-emerald-600",
          },
          {
            label: "SOL Regions",
            value: "6",
            change: "0",
            changeType: "neutral",
            icon: MapPin,
            color: "purple",
            bgGradient: "from-purple-500 to-purple-600",
          },
          {
            label: "Client Zones",
            value: "12",
            change: "+2",
            changeType: "positive",
            icon: Users,
            color: "orange",
            bgGradient: "from-orange-500 to-orange-600",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-12 h-12 bg-gradient-to-r ${stat.bgGradient} rounded-lg flex items-center justify-center shadow-sm`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1">
                  <TrendingUp
                    className={`w-3 h-3 ${
                      stat.changeType === "positive"
                        ? "text-green-500"
                        : stat.changeType === "negative"
                        ? "text-red-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : stat.changeType === "negative"
                        ? "text-red-600"
                        : "text-gray-500"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            <span>245 locations found</span>
          </div>
        </div>
      </div>

      {/* Modern Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">All Locations</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SOL Region/Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Region/Zone
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
              {locations.map((location, index) => (
                <tr
                  key={location.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {location.location_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {location.location_code}
                        </div>
                        <div className="text-xs text-gray-400">
                          {location.address}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {location.client_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {location.sol_region}
                    </div>
                    <div className="text-xs text-gray-500">
                      {location.sol_zone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {location.client_region}
                    </div>
                    <div className="text-xs text-gray-500">
                      {location.client_zone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        location.status === "active"
                          ? "bg-green-100 text-green-800"
                          : location.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {location.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditLocation(location)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
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

  const RequestMaster = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Service Request Master
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage service types and request categories for recruitment
          </p>
        </div>
        <button
          onClick={() => setShowServiceForm(true)}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service Type
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Service Types",
            value: "89",
            change: "+5",
            icon: FileText,
            bgGradient: "from-emerald-500 to-emerald-600",
          },
          {
            label: "Active Services",
            value: "84",
            change: "+3",
            icon: Globe,
            bgGradient: "from-blue-500 to-blue-600",
          },
          {
            label: "Categories",
            value: "12",
            change: "+1",
            icon: Building2,
            bgGradient: "from-purple-500 to-purple-600",
          },
          {
            label: "Avg SLA (Hours)",
            value: "48",
            change: "-6",
            icon: Users,
            bgGradient: "from-orange-500 to-orange-600",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-12 h-12 bg-gradient-to-r ${stat.bgGradient} rounded-lg flex items-center justify-center shadow-sm`}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs font-medium text-green-600">
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Service Types Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <div
            key={service.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
          >
            <div
              className={`h-2 bg-gradient-to-r ${
                service.category === "Finance"
                  ? "from-blue-500 to-blue-600"
                  : service.category === "Administration"
                  ? "from-purple-500 to-purple-600"
                  : service.category === "Security"
                  ? "from-red-500 to-red-600"
                  : service.category === "Maintenance"
                  ? "from-orange-500 to-orange-600"
                  : service.category === "Technology"
                  ? "from-emerald-500 to-emerald-600"
                  : "from-indigo-500 to-indigo-600"
              }`}
            ></div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    {service.service_name}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {service.service_code}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {service.category}
                    </span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    service.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {service.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {service.description}
              </p>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditService(service)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteService(service.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-gray-200"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Client Service Management
              </h1>
              <p className="text-gray-600 mt-1">
                Configure service locations and request types for client
                operations
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-500">2 modules configured</div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-gray-200 p-2 mb-8">
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
                245
              </span>
            </button>
            <button
              onClick={() => setActiveTab("request-master")}
              className={`flex-1 flex items-center justify-center space-x-3 py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "request-master"
                  ? "bg-emerald-600 text-white shadow-md"
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
                89
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
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
