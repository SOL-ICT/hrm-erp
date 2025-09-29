"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  UserCircle,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  FileText,
} from "lucide-react";
import StaffDetailView from "./StaffDetailView";
import employeeRecordAPI from "../../../../../../services/modules/hr-payroll-management/employeeRecordAPI";

const EmployeeRecord = ({ currentTheme, onBack }) => {
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [staff, setStaff] = useState([]);
  const [paginationData, setPaginationData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("list"); // 'list' or 'detail'

  // Load initial data
  useEffect(() => {
    loadClients();
  }, []);

  // Load locations when client changes
  useEffect(() => {
    if (selectedClient) {
      loadLocations();
      setSelectedLocation("all");
      setStaff([]);
    }
  }, [selectedClient]);

  // Load staff when client/location changes
  useEffect(() => {
    if (selectedClient && selectedLocation) {
      setCurrentPage(1); // Reset to first page
      loadStaff(1);
    }
  }, [selectedClient, selectedLocation, searchTerm]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await employeeRecordAPI.getClients();
      
      if (response.success) {
        setClients(response.data);
      } else {
        console.error("Failed to load clients:", response.message);
        setClients([]);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      if (!selectedClient) return;
      
      const response = await employeeRecordAPI.getLocationsByClient(selectedClient.id);
      
      if (response.success) {
        setLocations(response.data);
      } else {
        console.error("Failed to load locations:", response.message);
        setLocations([]);
      }
    } catch (error) {
      console.error("Error loading locations:", error);
      setLocations([]);
    }
  };

  const loadStaff = async (page = 1) => {
    try {
      if (!selectedClient) return;
      
      setLoading(true);
      const params = {
        client_id: selectedClient.id,
        search: searchTerm,
        page: page,
        per_page: 20 // Increase from default 15 to 20
      };

      // Add location filter if specific location is selected
      if (selectedLocation && selectedLocation !== "all") {
        params.service_location_id = selectedLocation;
      }

      const response = await employeeRecordAPI.getStaff(params);
      
      if (response.success) {
        setStaff(response.data.data || []);
        setPaginationData({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total,
          from: response.data.from,
          to: response.data.to
        });
        setCurrentPage(response.data.current_page || 1);
      } else {
        console.error("Failed to load staff:", response.message);
        setStaff([]);
        setPaginationData(null);
      }
    } catch (error) {
      console.error("Error loading staff:", error);
      setStaff([]);
      setPaginationData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStaff = (staffMember) => {
    setSelectedStaff(staffMember);
    setView("detail");
  };

  const handleBackToList = () => {
    setSelectedStaff(null);
    setView("list");
  };

  if (view === "detail" && selectedStaff) {
    return (
      <StaffDetailView
        staff={selectedStaff}
        onBack={handleBackToList}
        onSave={() => {
          // Refresh staff list after save
          loadStaff();
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="h-6 border-l border-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900">Employee Records</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (selectedClient) loadStaff();
                else loadClients();
              }}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-blue-600" />
              Search Filters
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Client Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Client
                </label>
                <select
                  value={selectedClient?.id || ""}
                  onChange={(e) => {
                    const clientId = e.target.value;
                    const client = clients.find(c => c.id == clientId);
                    setSelectedClient(client || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.organisation_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  disabled={!selectedClient}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="all">All Locations</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.location_name} ({location.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Staff
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name, code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={!selectedClient}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {!selectedClient ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a Client to View Employee Records
                </h3>
                <p className="text-gray-600">
                  Choose a client from the dropdown above to view their employee records
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading employee records...</p>
              </div>
            </div>
          ) : staff.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Employee Records Found
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? `No staff members found matching "${searchTerm}" for this client and location`
                    : `No staff members found for this client${selectedLocation !== 'all' ? ' and location' : ''}`
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Employee Records ({staff.length})
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {staff.map((staffMember) => (
                  <div key={staffMember.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <UserCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base font-medium text-gray-900 truncate">
                            {staffMember.first_name} {staffMember.last_name}
                          </h4>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Briefcase className="w-3 h-3 mr-1" />
                              {staffMember.job_title || 'N/A'}
                            </span>
                            <span className="flex items-center">
                              <UserCircle className="w-3 h-3 mr-1" />
                              {staffMember.gender || 'Not specified'}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(staffMember.entry_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {staffMember.employee_code}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              staffMember.status === 'active' 
                                ? 'bg-green-100 text-green-600'
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {staffMember.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewStaff(staffMember)}
                        className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination Controls */}
              {paginationData && paginationData.last_page > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {paginationData.from} to {paginationData.to} of {paginationData.total} staff
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => loadStaff(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, paginationData.last_page) }, (_, i) => {
                          let pageNum;
                          if (paginationData.last_page <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= paginationData.last_page - 2) {
                            pageNum = paginationData.last_page - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => loadStaff(pageNum)}
                              className={`px-3 py-1 rounded-lg text-sm ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => loadStaff(currentPage + 1)}
                        disabled={currentPage === paginationData.last_page}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          currentPage === paginationData.last_page
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeRecord;
