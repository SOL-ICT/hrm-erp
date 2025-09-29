// File: frontend/src/components/admin/modules/recruitment-management/submodules/recruitment-request/RecruitmentRequest.jsx

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  X,
  Save,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import recruitmentRequestAPI from "@/services/modules/recruitment-management/recruitmentRequestAPI";
import clientMasterAPI from "@/services/modules/client-contract-management/clientMasterAPI";

const RecruitmentRequest = ({ currentTheme, preferences, onBack }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard"); // "dashboard" | "form"
  const [recruitmentRequests, setRecruitmentRequests] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    overdue: 0,
  });

  // AbortController for cancelling requests when component unmounts
  const [abortController, setAbortController] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    // Section 1: Client & Service Information
    client_id: "",
    job_structure_id: "",

    // Section 2: Job Requirements & Location
    gender_requirement: "any",
    religion_requirement: "any",
    age_limit_min: "",
    age_limit_max: "",
    experience_requirement: "",
    qualifications: [{ name: "", class: "" }],

    // Section 3: Service Details & Requirements
    service_location_id: "",
    number_of_vacancies: 1,
    compensation: "",
    sol_service_type: "RS",
    recruitment_period_start: "",
    recruitment_period_end: "",

    // Additional fields
    description: "",
    special_requirements: "",
    priority_level: "medium",
  });

  // Data state
  const [clients, setClients] = useState([]);
  const [jobStructures, setJobStructures] = useState([]);
  const [serviceLocations, setServiceLocations] = useState([]);
  const [autoPopulatedData, setAutoPopulatedData] = useState({
    lga: "",
    zone: "",
    sol_office_name: "",
    sol_office_code: "",
  });

  // UI state
  const [nextTicketId, setNextTicketId] = useState("");
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("form");
  const [editingRequest, setEditingRequest] = useState(null);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [customCloseReason, setCustomCloseReason] = useState("");
  const [requestToClose, setRequestToClose] = useState(null);
  
  // Reopen functionality states
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [customReopenReason, setCustomReopenReason] = useState("");
  const [requestToReopen, setRequestToReopen] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ========================================
  // LIFECYCLE & DATA FETCHING
  // ========================================

  useEffect(() => {
    fetchInitialData();
    fetchNextTicketId();
    fetchDashboardData();
    fetchRecruitmentRequests();

    // Cleanup function to cancel pending requests
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (formData.client_id) {
      fetchJobStructures(formData.client_id);
      fetchServiceLocations(formData.client_id);
    }
  }, [formData.client_id]);

  // Handle escape key to cancel form safely
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && currentView === "form") {
        handleCancel();
      }
    };

    if (currentView === "form") {
      document.addEventListener("keydown", handleEscapeKey);
      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [currentView]);

  useEffect(() => {
    if (formData.service_location_id) {
      handleServiceLocationChange(formData.service_location_id);
    }
  }, [formData.service_location_id]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const response = await clientMasterAPI.getAll();

      // Handle different response structures
      let clientsData = [];
      if (response.success) {
        if (response.data?.data && Array.isArray(response.data.data)) {
          clientsData = response.data.data;
        } else if (response.data?.items && Array.isArray(response.data.items)) {
          clientsData = response.data.items;
        } else if (Array.isArray(response.data)) {
          clientsData = response.data;
        }
      }

      setClients(clientsData);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      setClients([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchNextTicketId = async () => {
    try {
      const response = await recruitmentRequestAPI.getNextTicketId();
      if (response.success && response.data?.ticket_id) {
        setNextTicketId(response.data.ticket_id);
      } else {
        setNextTicketId(recruitmentRequestAPI.generateTicketPreview());
      }
    } catch (error) {
      console.error("Failed to fetch next ticket ID:", error);
      setNextTicketId(recruitmentRequestAPI.generateTicketPreview());
    }
  };

  const fetchJobStructures = async (clientId) => {
    try {
      const response = await recruitmentRequestAPI.getJobStructuresByClient(
        clientId
      );

      let jobStructuresData = [];
      if (response.success && Array.isArray(response.data)) {
        jobStructuresData = response.data;
      }

      setJobStructures(jobStructuresData);
    } catch (error) {
      console.error("Failed to fetch job structures:", error);
      setJobStructures([]);
    }
  };

  const fetchServiceLocations = async (clientId) => {
    try {
      const response = await recruitmentRequestAPI.getServiceLocationsByClient(
        clientId
      );

      let serviceLocationsData = [];
      if (response.success && Array.isArray(response.data)) {
        serviceLocationsData = response.data;
      }

      setServiceLocations(serviceLocationsData);
    } catch (error) {
      console.error("Failed to fetch service locations:", error);
      setServiceLocations([]);
    }
  };

  // ========================================
  // DASHBOARD DATA FETCHING
  // ========================================

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await recruitmentRequestAPI.getDashboard({
        year: new Date().getFullYear(),
        _t: Date.now() // Cache buster
      });

      if (response.success && response.data?.stats) {
        setDashboardStats({
          total: response.data.stats.total || 0,
          active: response.data.stats.active || 0,
          closed: response.data.stats.closed || 0,
          overdue: response.data.stats.overdue || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecruitmentRequests = async () => {
    try {
      const response = await recruitmentRequestAPI.getAll({
        limit: 10,
        sort: "created_at",
        order: "desc",
        _t: Date.now() // Cache buster
      });

      if (response.success && response.data) {
        // Handle different response structures
        let requestsData = [];
        if (Array.isArray(response.data.data)) {
          requestsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          requestsData = response.data;
        }
        setRecruitmentRequests(requestsData);
      }
    } catch (error) {
      console.error("Failed to fetch recruitment requests:", error);
      setRecruitmentRequests([]);
    }
  };

  // ========================================
  // EVENT HANDLERS
  // ========================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleServiceLocationChange = (locationId) => {
    const selectedLocation = serviceLocations.find(
      (loc) => loc.id == locationId
    );
    if (selectedLocation) {
      setAutoPopulatedData({
        lga: selectedLocation.lga || "",
        zone: selectedLocation.sol_zone || "",
        sol_office_name: selectedLocation.sol_office?.office_name || "",
        sol_office_code: selectedLocation.sol_office?.office_code || "",
      });
    }
  };

  const handleQualificationChange = (index, field, value) => {
    const updatedQualifications = [...formData.qualifications];
    updatedQualifications[index][field] = value;
    setFormData((prev) => ({ ...prev, qualifications: updatedQualifications }));
  };

  const addQualification = () => {
    setFormData((prev) => ({
      ...prev,
      qualifications: [...prev.qualifications, { name: "", class: "" }],
    }));
  };

  const removeQualification = (index) => {
    if (formData.qualifications.length > 1) {
      const updatedQualifications = formData.qualifications.filter(
        (_, i) => i !== index
      );
      setFormData((prev) => ({
        ...prev,
        qualifications: updatedQualifications,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    const validation =
      recruitmentRequestAPI.validateRecruitmentRequest(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitLoading(true);
      setErrors({});

      // Cancel any existing request
      if (abortController) {
        abortController.abort();
      }

      // Create new abort controller for this request
      const controller = new AbortController();
      setAbortController(controller);

      let response;
      const isEditing = editingRequest !== null;

      // Debug: Log the data being sent
      console.log("Submitting recruitment request:", {
        isEditing,
        editingRequest,
        editingRequestId: editingRequest?.id,
        formData,
      });

      if (isEditing) {
        console.log(`Making UPDATE request to ID: ${editingRequest.id}`);
        // Update existing request
        response = await recruitmentRequestAPI.update(
          editingRequest.id,
          formData
        );
      } else {
        console.log("Making CREATE request");
        // Create new request
        response = await recruitmentRequestAPI.create(formData);
      }

      // Only proceed if request wasn't aborted
      if (!controller.signal.aborted && response.success) {
        // Success feedback
        alert(
          isEditing
            ? "Recruitment request updated successfully!"
            : `Recruitment request created successfully!\nTicket ID: ${
                response.ticket_id || response.data?.ticket_id || "Generated"
              }`
        );

        // Reset form
        setFormData({
          client_id: "",
          job_structure_id: "",
          gender_requirement: "any",
          religion_requirement: "any",
          age_limit_min: "",
          age_limit_max: "",
          experience_requirement: "",
          qualifications: [{ name: "", class: "" }],
          service_location_id: "",
          number_of_vacancies: 1,
          compensation: "",
          sol_service_type: "RS",
          recruitment_period_start: "",
          recruitment_period_end: "",
          description: "",
          special_requirements: "",
          priority_level: "medium",
        });

        // Clear editing state
        setEditingRequest(null);

        // Fetch new ticket ID (only for new requests)
        if (!isEditing) {
          fetchNextTicketId();
        }

        // Switch back to dashboard view
        setTimeout(() => {
          setCurrentView("dashboard");
          fetchDashboardData();
          fetchRecruitmentRequests();
        }, 1000);
      } else if (!controller.signal.aborted) {
        throw new Error(
          response.message ||
            `Failed to ${isEditing ? "update" : "create"} recruitment request`
        );
      }
    } catch (error) {
      // Only handle error if it's not an aborted request
      if (error.name !== "AbortError") {
        console.error(
          `Failed to ${
            editingRequest ? "update" : "create"
          } recruitment request:`,
          error
        );
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
        } else {
          alert(
            `Failed to ${
              editingRequest ? "update" : "create"
            } recruitment request. Please try again.`
          );
        }
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Safe cancel function that cancels pending requests
  const handleCancel = () => {
    // Cancel any pending requests
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }

    // Clear any loading states
    setSubmitLoading(false);
    setLoading(false);

    // Clear editing state
    setEditingRequest(null);

    // Reset form to default values
    setFormData({
      client_id: "",
      job_structure_id: "",
      gender_requirement: "any",
      religion_requirement: "any",
      age_limit_min: "",
      age_limit_max: "",
      experience_requirement: "",
      qualifications: [{ name: "", class: "" }],
      service_location_id: "",
      number_of_vacancies: 1,
      compensation: "",
      sol_service_type: "RS",
      recruitment_period_start: "",
      recruitment_period_end: "",
      description: "",
      special_requirements: "",
      priority_level: "medium",
    });

    // Navigate back to dashboard view first
    setCurrentView("dashboard");

    // Call the onBack function only if it's explicitly provided and needed
    // We don't want the cancel button to trigger logout
    if (onBack && typeof onBack === "function") {
      // Only call onBack if we're in a modal context, not if it triggers logout
      // onBack();
    }
  };

  // Handle edit request
  const handleEditRequest = (request) => {
    setEditingRequest(request);
    // Populate form with request data
    setFormData({
      client_id: request.client_id || "",
      job_structure_id: request.job_structure_id || "",
      gender_requirement: request.gender_requirement || "any",
      religion_requirement: request.religion_requirement || "any",
      age_limit_min: request.age_limit_min || "",
      age_limit_max: request.age_limit_max || "",
      experience_requirement: request.experience_requirement || "",
      qualifications: request.qualifications || [{ name: "", class: "" }],
      service_location_id: request.service_location_id || "",
      number_of_vacancies: request.number_of_vacancies || 1,
      compensation: request.compensation || "",
      sol_service_type: request.sol_service_type || "RS",
      recruitment_period_start: request.recruitment_period_start
        ? request.recruitment_period_start.split("T")[0]
        : "",
      recruitment_period_end: request.recruitment_period_end
        ? request.recruitment_period_end.split("T")[0]
        : "",
      description: request.description || "",
      special_requirements: request.special_requirements || "",
      priority_level: request.priority_level || "medium",
    });
    setCurrentView("form");
  };

  // Handle close request
  const handleCloseRequest = async (request) => {
    console.log("🔴 handleCloseRequest called with:", request);
    
    // If called from the close button in dashboard, show modal
    if (request) {
      setRequestToClose(request);
      setCloseModalOpen(true);
      return;
    }
    
    // If called from the modal confirm button, actually close the request
    if (!requestToClose || !closeReason.trim()) {
      console.log("Validation failed:", { requestToClose, closeReason });
      alert("Please provide a reason for closing this request.");
      return;
    }

    console.log("About to close request:", {
      requestToClose: requestToClose,
      closeReason: closeReason,
      customCloseReason: customCloseReason
    });

    try {
      setActionLoading(true);
      const finalReason = closeReason === "other" ? customCloseReason : closeReason;
      
      console.log("Sending close request with data:", {
        id: requestToClose.id,
        reason: finalReason
      });
      
      const response = await recruitmentRequestAPI.close(
        requestToClose.id,
        finalReason
      );

      console.log("Close response:", response);

      if (response.success) {
        alert("Recruitment request closed successfully!");
        setCloseModalOpen(false);
        setRequestToClose(null);
        setCloseReason("");
        setCustomCloseReason("");
        
        // Force refresh the data  
        console.log("Refreshing data after close...");
        await fetchRecruitmentRequests(); // Refresh the list
        await fetchDashboardData(); // Refresh stats
        console.log("Data refreshed after close");
      } else {
        alert(
          "Failed to close recruitment request: " +
            (response.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error closing request:", error);
      alert("Error closing recruitment request: " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reopen request
  const handleReopenRequest = async (request) => {
    // If called from the reopen button in dashboard, show modal
    if (request) {
      setRequestToReopen(request);
      setReopenModalOpen(true);
      return;
    }
    
    // If called from the modal confirm button, actually reopen the request
    if (!requestToReopen || !reopenReason.trim()) {
      alert("Please provide a reason for reopening this request.");
      return;
    }

    try {
      setActionLoading(true);
      const finalReason = reopenReason === "other" ? customReopenReason : reopenReason;
      
      const response = await recruitmentRequestAPI.reopen(
        requestToReopen.id,
        finalReason
      );

      console.log("Reopen response:", response);

      if (response.success) {
        alert("Recruitment request reopened successfully!");
        setReopenModalOpen(false);
        setRequestToReopen(null);
        setReopenReason("");
        setCustomReopenReason("");
        
        // Force refresh the data
        console.log("Refreshing data after reopen...");
        try {
          await fetchRecruitmentRequests(); // Refresh the list
          await fetchDashboardData(); // Refresh stats  
          console.log("Data refreshed successfully after reopen");
        } catch (refreshError) {
          console.error("Error refreshing data after reopen:", refreshError);
        }
      } else {
        alert(
          "Failed to reopen recruitment request: " +
            (response.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error reopening request:", error);
      alert("Error reopening recruitment request: " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ========================================
  // RENDER HELPERS
  // ========================================

  const renderFormSection1 = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
        Section 1: Client & Job Category Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client <span className="text-red-500">*</span>
          </label>
          <select
            name="client_id"
            value={formData.client_id}
            onChange={handleInputChange}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.client_id ? "border-red-500" : "border-gray-300"
            }`}
            disabled={loading}
          >
            <option value="">Select Client</option>
            {Array.isArray(clients) &&
              clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.organisation_name}
                </option>
              ))}
          </select>
          {errors.client_id && (
            <p className="text-red-500 text-sm mt-1">{errors.client_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Category <span className="text-red-500">*</span>
          </label>
          <select
            name="job_structure_id"
            value={formData.job_structure_id}
            onChange={handleInputChange}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.job_structure_id ? "border-red-500" : "border-gray-300"
            }`}
            disabled={!formData.client_id || loading}
          >
            <option value="">Select Job Category</option>
            {Array.isArray(jobStructures) &&
              jobStructures.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.job_title} ({job.job_code}) - {job.contract_type}
                </option>
              ))}
          </select>
          {errors.job_structure_id && (
            <p className="text-red-500 text-sm mt-1">{errors.job_structure_id}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderFormSection2 = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
        Section 2: Job Requirements & Location
      </h3>

      {/* Requirements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            name="gender_requirement"
            value={formData.gender_requirement}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="any">Any Gender</option>
            <option value="male">Male Only</option>
            <option value="female">Female Only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Religion
          </label>
          <select
            name="religion_requirement"
            value={formData.religion_requirement}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="any">Any Religion</option>
            <option value="christianity">Christianity</option>
            <option value="islam">Islam</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority Level
          </label>
          <select
            name="priority_level"
            value={formData.priority_level}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Age Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Age
          </label>
          <input
            type="number"
            name="age_limit_min"
            value={formData.age_limit_min}
            onChange={handleInputChange}
            min="16"
            max="65"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 18"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Age
          </label>
          <input
            type="number"
            name="age_limit_max"
            value={formData.age_limit_max}
            onChange={handleInputChange}
            min="16"
            max="65"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.age_limit_max ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., 45"
          />
          {errors.age_limit_max && (
            <p className="text-red-500 text-sm mt-1">{errors.age_limit_max}</p>
          )}
        </div>
      </div>

      {/* Experience Requirement */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Experience Requirement
        </label>
        <textarea
          name="experience_requirement"
          value={formData.experience_requirement}
          onChange={handleInputChange}
          rows="3"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe the required experience, skills, and qualifications..."
        />
      </div>

      {/* Qualifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Qualifications & Class of Degree
        </label>
        {formData.qualifications.map((qualification, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Qualification (e.g., BSc Computer Science)"
              value={qualification.name}
              onChange={(e) =>
                handleQualificationChange(index, "name", e.target.value)
              }
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Class (e.g., Second Class Upper)"
              value={qualification.class}
              onChange={(e) =>
                handleQualificationChange(index, "class", e.target.value)
              }
              className="w-1/3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => removeQualification(index)}
              disabled={formData.qualifications.length === 1}
              className="px-3 py-2 text-red-600 hover:text-red-800 disabled:text-gray-400"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addQualification}
          className="mt-2 px-4 py-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + Add Qualification
        </button>
      </div>
    </div>
  );

  const renderFormSection3 = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
        Section 3: Service Details & Requirements
      </h3>

      {/* Service Location */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available Service Location <span className="text-red-500">*</span>
        </label>
        <select
          name="service_location_id"
          value={formData.service_location_id}
          onChange={handleInputChange}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.service_location_id ? "border-red-500" : "border-gray-300"
          }`}
          disabled={!formData.client_id || loading}
        >
          <option value="">Select Service Location</option>
          {Array.isArray(serviceLocations) &&
            serviceLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.location_name} ({location.city})
              </option>
            ))}
        </select>
        {errors.service_location_id && (
          <p className="text-red-500 text-sm mt-1">
            {errors.service_location_id}
          </p>
        )}
      </div>

      {/* Auto-populated Location Data */}
      {autoPopulatedData.lga && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LGA
            </label>
            <input
              type="text"
              value={autoPopulatedData.lga}
              disabled
              className="w-full p-2 bg-gray-100 border border-gray-300 rounded text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zone
            </label>
            <input
              type="text"
              value={autoPopulatedData.zone}
              disabled
              className="w-full p-2 bg-gray-100 border border-gray-300 rounded text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SOL Office
            </label>
            <input
              type="text"
              value={`${autoPopulatedData.sol_office_name} (${autoPopulatedData.sol_office_code})`}
              disabled
              className="w-full p-2 bg-gray-100 border border-gray-300 rounded text-gray-600"
            />
          </div>
        </div>
      )}

      {/* Number of Vacancies */}
      <div className="mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Vacancies <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="number_of_vacancies"
            value={formData.number_of_vacancies}
            onChange={handleInputChange}
            min="1"
            max="1000"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.number_of_vacancies ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.number_of_vacancies && (
            <p className="text-red-500 text-sm mt-1">
              {errors.number_of_vacancies}
            </p>
          )}
        </div>
      </div>

      {/* Compensation */}
      <div className="mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Compensation (₦)
          </label>
          <input
            type="number"
            name="compensation"
            value={formData.compensation}
            onChange={handleInputChange}
            min="0"
            step="1000"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 100000"
          />
        </div>
      </div>

      {/* SOL Service Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SOL Service <span className="text-red-500">*</span>
        </label>
        <select
          name="sol_service_type"
          value={formData.sol_service_type}
          onChange={handleInputChange}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.sol_service_type ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="MSS">Managed Staff Service (MSS)</option>
          <option value="RS">Recruitment Service (RS)</option>
          <option value="DSS">Domestic Staff Service (DSS)</option>
        </select>
        {errors.sol_service_type && (
          <p className="text-red-500 text-sm mt-1">{errors.sol_service_type}</p>
        )}
      </div>

      {/* Recruitment Period */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recruitment Period Start
          </label>
          <input
            type="date"
            name="recruitment_period_start"
            value={formData.recruitment_period_start}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recruitment Period End
          </label>
          <input
            type="date"
            name="recruitment_period_end"
            value={formData.recruitment_period_end}
            onChange={handleInputChange}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.recruitment_period_end
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />
          {errors.recruitment_period_end && (
            <p className="text-red-500 text-sm mt-1">
              {errors.recruitment_period_end}
            </p>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Brief description of the recruitment request..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Requirements
          </label>
          <textarea
            name="special_requirements"
            value={formData.special_requirements}
            onChange={handleInputChange}
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any special requirements or notes..."
          />
        </div>
      </div>
    </div>
  );

  // ========================================
  // RENDER DASHBOARD VIEW
  // ========================================

  const renderDashboardView = () => (
    <div className={`min-h-screen ${currentTheme.bg}`}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className={`p-2 ${currentTheme.hover} rounded-lg transition-colors ${currentTheme.textSecondary}`}
              >
                <ArrowLeft
                  className={`w-5 h-5 ${currentTheme.textSecondary}`}
                />
              </button>
            )}
            <div className="flex-1">
              <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
                Recruitment Requests
              </h1>
              <p className={`${currentTheme.textSecondary} mt-1`}>
                Manage recruitment requests and track hiring progress
              </p>
            </div>
            <button
              onClick={() => setCurrentView("form")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Request</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div
            className={`${currentTheme.cardBg} rounded-xl shadow-sm p-6 ${currentTheme.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  Total Requests
                </p>
                <p
                  className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}
                >
                  {loading ? "..." : dashboardStats.total}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div
            className={`${currentTheme.cardBg} rounded-xl shadow-sm p-6 ${currentTheme.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  Active
                </p>
                <p
                  className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}
                >
                  {loading ? "..." : dashboardStats.active}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div
            className={`${currentTheme.cardBg} rounded-xl shadow-sm p-6 ${currentTheme.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  Completed
                </p>
                <p
                  className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}
                >
                  {loading ? "..." : dashboardStats.closed}
                </p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div
            className={`${currentTheme.cardBg} rounded-xl shadow-sm p-6 ${currentTheme.border}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  Overdue
                </p>
                <p
                  className={`text-2xl font-bold ${currentTheme.textPrimary} mt-1`}
                >
                  {loading ? "..." : dashboardStats.overdue}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Requests Table */}
        <div
          className={`${currentTheme.cardBg} rounded-xl shadow-sm ${currentTheme.border}`}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2
                className={`text-xl font-semibold ${currentTheme.textPrimary}`}
              >
                Recent Requests
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  className={`p-2 ${currentTheme.hover} rounded-lg ${currentTheme.textSecondary}`}
                >
                  <Search className="w-5 h-5" />
                </button>
                <button
                  className={`p-2 ${currentTheme.hover} rounded-lg ${currentTheme.textSecondary}`}
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className={`mt-2 ${currentTheme.textSecondary}`}>
                  Loading requests...
                </p>
              </div>
            ) : recruitmentRequests.length === 0 ? (
              <div className="text-center py-8">
                <FileText
                  className={`w-12 h-12 ${currentTheme.textMuted} mx-auto mb-4`}
                />
                <p className={`${currentTheme.textSecondary} mb-4`}>
                  No recruitment requests found
                </p>
                <button
                  onClick={() => setCurrentView("form")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Create Your First Request
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${currentTheme.border}`}>
                      <th
                        className={`text-left py-3 px-4 font-medium ${currentTheme.textSecondary}`}
                      >
                        Request ID
                      </th>
                      <th
                        className={`text-left py-3 px-4 font-medium ${currentTheme.textSecondary}`}
                      >
                        Client
                      </th>
                      <th
                        className={`text-left py-3 px-4 font-medium ${currentTheme.textSecondary}`}
                      >
                        Position
                      </th>
                      <th
                        className={`text-left py-3 px-4 font-medium ${currentTheme.textSecondary}`}
                      >
                        Vacancies
                      </th>
                      <th
                        className={`text-left py-3 px-4 font-medium ${currentTheme.textSecondary}`}
                      >
                        Status
                      </th>
                      <th
                        className={`text-left py-3 px-4 font-medium ${currentTheme.textSecondary}`}
                      >
                        Created
                      </th>
                      <th
                        className={`text-left py-3 px-4 font-medium ${currentTheme.textSecondary}`}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recruitmentRequests.map((request) => (
                      <tr
                        key={request.id}
                        className={`border-b ${currentTheme.border} hover:${currentTheme.hover}`}
                      >
                        <td
                          className={`py-3 px-4 ${currentTheme.textPrimary} font-mono text-sm`}
                        >
                          {request.ticket_id || `RR-${request.id}`}
                        </td>
                        <td className={`py-3 px-4 ${currentTheme.textPrimary}`}>
                          {request.client?.organisation_name || "N/A"}
                        </td>
                        <td className={`py-3 px-4 ${currentTheme.textPrimary}`}>
                          {request.job_structure?.job_title || "N/A"}
                        </td>
                        <td className={`py-3 px-4 ${currentTheme.textPrimary}`}>
                          {request.number_of_vacancies || 1}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === "active"
                                ? "bg-green-100 text-green-800"
                                : request.status === "closed"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {request.status || "pending"}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 ${currentTheme.textSecondary} text-sm`}
                        >
                          {request.created_at
                            ? new Date(request.created_at).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditRequest(request);
                              }}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                              title="Edit Request"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {request.status === "active" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCloseRequest(request);
                                }}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                title="Close Request"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            {request.status === "closed" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReopenRequest(request);
                                }}
                                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                                title="Reopen Request"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ========================================
  // CLOSE MODAL COMPONENT
  // ========================================
  
  const renderCloseModal = () => {
    if (!closeModalOpen) {
      return null;
    }
    
    const closeReasons = [
      { value: "expired", label: "Expired recruitment period" },
      { value: "fulfilled", label: "Position fulfilled" },
      { value: "cancelled", label: "Recruitment cancelled" },
      { value: "budget_constraints", label: "Budget constraints" },
      { value: "other", label: "Other (specify below)" }
    ];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Close Recruitment Request
            </h3>
            <button
              onClick={() => {
                setCloseModalOpen(false);
                setCloseReason("");
                setCustomCloseReason("");
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Are you sure you want to close this recruitment request?
            </p>
            
            {requestToClose && (
              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <p className="text-sm font-medium text-gray-900">
                  Request: {requestToClose.position_title || requestToClose.job_structure?.job_title || "Unknown Position"}
                </p>
                <p className="text-sm text-gray-600">
                  Ticket ID: {requestToClose.ticket_id || (requestToClose.id ? `RR-${requestToClose.id}` : "Unknown")}
                </p>
              </div>
            )}
            
            {/* Close Reason Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for closing <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {closeReasons.map((reason) => (
                  <label key={reason.value} className="flex items-center">
                    <input
                      type="radio"
                      name="closeReason"
                      value={reason.value}
                      checked={closeReason === reason.value}
                      onChange={(e) => setCloseReason(e.target.value)}
                      className="mr-2 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{reason.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Custom Reason Input */}
            {closeReason === "other" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please specify the reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={customCloseReason}
                  onChange={(e) => setCustomCloseReason(e.target.value)}
                  placeholder="Enter the reason for closing this request..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>
            )}
            
            <p className="text-sm text-red-600">
              This action will close the request but it can be reopened later if needed.
            </p>
          </div>
          
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => {
                setCloseModalOpen(false);
                setCloseReason("");
                setCustomCloseReason("");
              }}
              disabled={actionLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleCloseRequest()}
              disabled={actionLoading || !closeReason || (closeReason === "other" && !customCloseReason.trim())}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {actionLoading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{actionLoading ? "Closing..." : "Close Request"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // REOPEN MODAL COMPONENT
  // ========================================
  
  const renderReopenModal = () => {
    if (!reopenModalOpen) {
      return null;
    }
    
    const reopenReasons = [
      { value: "additional_positions", label: "Additional positions needed" },
      { value: "candidate_declined", label: "Selected candidate declined" },
      { value: "candidate_unsuitable", label: "Selected candidate proved unsuitable" },
      { value: "business_expansion", label: "Business expansion requirements" },
      { value: "urgent_requirement", label: "Urgent business requirement" },
      { value: "other", label: "Other (specify below)" }
    ];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Reopen Recruitment Request
            </h3>
            <button
              onClick={() => {
                setReopenModalOpen(false);
                setReopenReason("");
                setCustomReopenReason("");
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Are you sure you want to reopen this recruitment request?
            </p>
            
            {requestToReopen && (
              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <p className="text-sm font-medium text-gray-900">
                  Request: {requestToReopen.position_title || requestToReopen.job_structure?.job_title || "Unknown Position"}
                </p>
                <p className="text-sm text-gray-600">
                  Ticket ID: {requestToReopen.ticket_id || (requestToReopen.id ? `RR-${requestToReopen.id}` : "Unknown")}
                </p>
                <p className="text-sm text-red-600">
                  Current Status: Closed
                </p>
              </div>
            )}
            
            {/* Reopen Reason Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for reopening <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {reopenReasons.map((reason) => (
                  <label key={reason.value} className="flex items-center">
                    <input
                      type="radio"
                      name="reopenReason"
                      value={reason.value}
                      checked={reopenReason === reason.value}
                      onChange={(e) => setReopenReason(e.target.value)}
                      className="mr-2 text-green-600"
                    />
                    <span className="text-sm text-gray-700">{reason.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Custom Reason Input */}
            {reopenReason === "other" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please specify the reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={customReopenReason}
                  onChange={(e) => setCustomReopenReason(e.target.value)}
                  placeholder="Enter the reason for reopening this request..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows="3"
                />
              </div>
            )}
            
            <p className="text-sm text-green-600">
              This will reactivate the recruitment request and make it available for new applications.
            </p>
          </div>
          
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => {
                setReopenModalOpen(false);
                setReopenReason("");
                setCustomReopenReason("");
              }}
              disabled={actionLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleReopenRequest()}
              disabled={actionLoading || !reopenReason || (reopenReason === "other" && !customReopenReason.trim())}
              className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {actionLoading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{actionLoading ? "Reopening..." : "Reopen Request"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // MAIN RENDER
  // ========================================

  return (
    <>
      {/* Dashboard View */}
      {currentView === "dashboard" && renderDashboardView()}
      
      {/* Form View */}
      {currentView === "form" && (
        <div className={`p-6 ${currentTheme.bg} min-h-screen`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancel}
                className={`p-2 ${currentTheme.hover} rounded-lg transition-colors ${currentTheme.textSecondary}`}
              >
                <ArrowLeft className={`w-5 h-5 ${currentTheme.textSecondary}`} />
              </button>
              <div>
                <h1 className={`text-2xl font-bold ${currentTheme.textPrimary}`}>
                  {editingRequest
                    ? "Edit Recruitment Request"
                    : "Create Recruitment Request"}
                </h1>
                {editingRequest ? (
                  <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>
                    Editing Ticket:{" "}
                    <span className="font-mono text-blue-600">
                      {editingRequest.ticket_id || `RR-${editingRequest.id}`}
                    </span>
                  </p>
                ) : (
                  nextTicketId && (
                    <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>
                      Next Ticket ID:{" "}
                      <span className="font-mono text-blue-600">
                        {nextTicketId}
                      </span>
                    </p>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
            {renderFormSection1()}
            {renderFormSection2()}
            {renderFormSection3()}

            {/* Submit Button */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-end space-x-4">
                {onBack && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitLoading && (
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  <span>
                    {submitLoading
                      ? editingRequest
                        ? "Updating..."
                        : "Creating..."
                      : editingRequest
                      ? "Update Recruitment Request"
                      : "Create Recruitment Request"}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Close Modal - Always render regardless of view */}
      {renderCloseModal()}
      
      {/* Reopen Modal - Always render regardless of view */}
      {renderReopenModal()}
    </>
  );
};

export default RecruitmentRequest;
