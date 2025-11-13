import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { manualBoardingAPI } from "@/services/modules/recruitment-management/manualBoardingAPI";
import {
  FORM_FIELDS,
  VALIDATION_RULES,
  STAFF_GENDER,
  STAFF_APPOINTMENT_STATUS,
  STAFF_EMPLOYMENT_TYPE,
  STAFF_ONBOARDING_METHOD,
} from "@/constants/databaseFields";

const ManualBoardingModal = ({ isOpen, onClose, onSuccess, currentTheme }) => {
  // Form state
  const [formData, setFormData] = useState({
    [FORM_FIELDS.MANUAL_BOARDING.CLIENT_ID]: "",
    [FORM_FIELDS.MANUAL_BOARDING.RECRUITMENT_REQUEST_ID]: "",
    [FORM_FIELDS.MANUAL_BOARDING.FIRST_NAME]: "",
    [FORM_FIELDS.MANUAL_BOARDING.MIDDLE_NAME]: "",
    [FORM_FIELDS.MANUAL_BOARDING.LAST_NAME]: "",
    [FORM_FIELDS.MANUAL_BOARDING.EMAIL]: "",
    [FORM_FIELDS.MANUAL_BOARDING.GENDER]: "",
    [FORM_FIELDS.MANUAL_BOARDING.ENTRY_DATE]: new Date()
      .toISOString()
      .split("T")[0],
    [FORM_FIELDS.MANUAL_BOARDING.APPOINTMENT_STATUS]:
      STAFF_APPOINTMENT_STATUS.PROBATION,
    [FORM_FIELDS.MANUAL_BOARDING.EMPLOYMENT_TYPE]:
      STAFF_EMPLOYMENT_TYPE.FULL_TIME,
    [FORM_FIELDS.MANUAL_BOARDING.PAY_GRADE_STRUCTURE_ID]: "",
    [FORM_FIELDS.MANUAL_BOARDING.PHONE]: "",
    [FORM_FIELDS.MANUAL_BOARDING.LOCATION]: "",
    [FORM_FIELDS.MANUAL_BOARDING.TAX_ID_NO]: "",
    [FORM_FIELDS.MANUAL_BOARDING.PF_NO]: "",
    [FORM_FIELDS.MANUAL_BOARDING.NOTES]: "",
  });

  // Dropdown data
  const [clients, setClients] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [payGrades, setPayGrades] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingPayGrades, setLoadingPayGrades] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1); // 1: Client/Ticket, 2: Staff Info, 3: Pay Grade
  const [successMessage, setSuccessMessage] = useState("");

  // Load clients when modal opens
  useEffect(() => {
    if (isOpen) {
      loadClients();
      resetForm();
    }
  }, [isOpen]);

  // Load tickets when client changes
  useEffect(() => {
    if (formData[FORM_FIELDS.MANUAL_BOARDING.CLIENT_ID]) {
      loadTickets();
    } else {
      setTickets([]);
      setFormData((prev) => ({
        ...prev,
        [FORM_FIELDS.MANUAL_BOARDING.RECRUITMENT_REQUEST_ID]: "",
      }));
    }
  }, [formData[FORM_FIELDS.MANUAL_BOARDING.CLIENT_ID]]);

  // Load pay grades when ticket changes
  useEffect(() => {
    if (formData[FORM_FIELDS.MANUAL_BOARDING.RECRUITMENT_REQUEST_ID]) {
      loadPayGrades();
    } else {
      setPayGrades([]);
      setFormData((prev) => ({
        ...prev,
        [FORM_FIELDS.MANUAL_BOARDING.PAY_GRADE_STRUCTURE_ID]: "",
      }));
    }
  }, [formData[FORM_FIELDS.MANUAL_BOARDING.RECRUITMENT_REQUEST_ID]]);

  const resetForm = () => {
    setFormData({
      [FORM_FIELDS.MANUAL_BOARDING.CLIENT_ID]: "",
      [FORM_FIELDS.MANUAL_BOARDING.RECRUITMENT_REQUEST_ID]: "",
      [FORM_FIELDS.MANUAL_BOARDING.FIRST_NAME]: "",
      [FORM_FIELDS.MANUAL_BOARDING.MIDDLE_NAME]: "",
      [FORM_FIELDS.MANUAL_BOARDING.LAST_NAME]: "",
      [FORM_FIELDS.MANUAL_BOARDING.EMAIL]: "",
      [FORM_FIELDS.MANUAL_BOARDING.GENDER]: "",
      [FORM_FIELDS.MANUAL_BOARDING.ENTRY_DATE]: new Date()
        .toISOString()
        .split("T")[0],
      [FORM_FIELDS.MANUAL_BOARDING.APPOINTMENT_STATUS]:
        STAFF_APPOINTMENT_STATUS.PROBATION,
      [FORM_FIELDS.MANUAL_BOARDING.EMPLOYMENT_TYPE]:
        STAFF_EMPLOYMENT_TYPE.FULL_TIME,
      [FORM_FIELDS.MANUAL_BOARDING.PAY_GRADE_STRUCTURE_ID]: "",
      [FORM_FIELDS.MANUAL_BOARDING.PHONE]: "",
      [FORM_FIELDS.MANUAL_BOARDING.LOCATION]: "",
      [FORM_FIELDS.MANUAL_BOARDING.TAX_ID_NO]: "",
      [FORM_FIELDS.MANUAL_BOARDING.PF_NO]: "",
      [FORM_FIELDS.MANUAL_BOARDING.NOTES]: "",
    });
    setErrors({});
    setStep(1);
    setSuccessMessage("");
  };

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await manualBoardingAPI.getClients();

      if (response.success) {
        setClients(response.data || []);
      } else {
        setErrors({ general: "Failed to load clients" });
      }
    } catch (error) {
      console.error("Error loading clients:", error);
      setErrors({ general: "Error loading clients" });
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    const clientId = formData[FORM_FIELDS.MANUAL_BOARDING.CLIENT_ID];
    if (!clientId) return;

    try {
      setLoadingTickets(true);
      const response = await manualBoardingAPI.getTicketsByClient(clientId);

      if (response.success) {
        setTickets(response.data || []);
      } else {
        setErrors({ tickets: "Failed to load recruitment tickets" });
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
      setErrors({ tickets: "Error loading recruitment tickets" });
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadPayGrades = async () => {
    const ticketId =
      formData[FORM_FIELDS.MANUAL_BOARDING.RECRUITMENT_REQUEST_ID];
    if (!ticketId) return;

    try {
      setLoadingPayGrades(true);
      const response = await manualBoardingAPI.getPayGradesByTicket(ticketId);

      if (response.success) {
        setPayGrades(response.data || []);
      } else {
        setErrors({ payGrades: "Failed to load pay grades" });
      }
    } catch (error) {
      console.error("Error loading pay grades:", error);
      setErrors({ payGrades: "Error loading pay grades" });
    } finally {
      setLoadingPayGrades(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};

    if (stepNumber === 1) {
      // Validate client and ticket selection
      if (!formData[FORM_FIELDS.MANUAL_BOARDING.CLIENT_ID]) {
        newErrors.client_id = "Please select a client";
      }
      if (!formData[FORM_FIELDS.MANUAL_BOARDING.RECRUITMENT_REQUEST_ID]) {
        newErrors.recruitment_request_id = "Please select a recruitment ticket";
      }
    } else if (stepNumber === 2) {
      // Validate staff information
      VALIDATION_RULES.REQUIRED_FIELDS.forEach((field) => {
        if (
          field === FORM_FIELDS.MANUAL_BOARDING.CLIENT_ID ||
          field === FORM_FIELDS.MANUAL_BOARDING.RECRUITMENT_REQUEST_ID ||
          field === FORM_FIELDS.MANUAL_BOARDING.PAY_GRADE_STRUCTURE_ID
        ) {
          return; // Skip fields validated in other steps
        }

        if (!formData[field] || formData[field].trim() === "") {
          const fieldName = field
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          newErrors[field] = `${fieldName} is required`;
        }
      });

      // Email validation
      if (
        formData[FORM_FIELDS.MANUAL_BOARDING.EMAIL] &&
        !VALIDATION_RULES.EMAIL_PATTERN.test(
          formData[FORM_FIELDS.MANUAL_BOARDING.EMAIL]
        )
      ) {
        newErrors[FORM_FIELDS.MANUAL_BOARDING.EMAIL] =
          "Please enter a valid email address";
      }

      // Phone validation (if provided)
      if (
        formData[FORM_FIELDS.MANUAL_BOARDING.PHONE] &&
        !VALIDATION_RULES.PHONE_PATTERN.test(
          formData[FORM_FIELDS.MANUAL_BOARDING.PHONE]
        )
      ) {
        newErrors[FORM_FIELDS.MANUAL_BOARDING.PHONE] =
          "Please enter a valid phone number";
      }
    } else if (stepNumber === 3) {
      // Validate pay grade selection
      if (!formData[FORM_FIELDS.MANUAL_BOARDING.PAY_GRADE_STRUCTURE_ID]) {
        newErrors.pay_grade_structure_id = "Please select a pay grade";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    try {
      setLoading(true);

      // Prepare submission data
      const submissionData = {
        ...formData,
        [FORM_FIELDS.MANUAL_BOARDING.ONBOARDING_METHOD]:
          STAFF_ONBOARDING_METHOD.MANUAL_ENTRY,
      };

      const response = await manualBoardingAPI.createStaff(submissionData);

      if (response.success) {
        setSuccessMessage(
          `Staff member successfully created! Employee Code: ${response.data.employee_code}`
        );

        // Notify parent component
        if (onSuccess) {
          onSuccess(response.data);
        }

        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setErrors({
          general: response.message || "Failed to create staff member",
        });
      }
    } catch (error) {
      console.error("Error creating staff:", error);
      setErrors({ general: "Error creating staff member. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(
    (c) => c.id === parseInt(formData[FORM_FIELDS.MANUAL_BOARDING.CLIENT_ID])
  );
  const selectedTicket = tickets.find(
    (t) =>
      t.id ===
      parseInt(formData[FORM_FIELDS.MANUAL_BOARDING.RECRUITMENT_REQUEST_ID])
  );
  const selectedPayGrade = payGrades.find(
    (pg) =>
      pg.id ===
      parseInt(formData[FORM_FIELDS.MANUAL_BOARDING.PAY_GRADE_STRUCTURE_ID])
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden ${
          currentTheme === "dark" ? "bg-gray-800 text-white" : ""
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            currentTheme === "dark" ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="flex items-center space-x-3">
            <User className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Manual Staff Boarding</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              currentTheme === "dark"
                ? "hover:bg-gray-700 text-gray-400 hover:text-white"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div
          className={`px-6 py-3 border-b ${
            currentTheme === "dark"
              ? "border-gray-700 bg-gray-750"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step >= stepNumber
                      ? "bg-blue-600 text-white"
                      : currentTheme === "dark"
                      ? "bg-gray-600 text-gray-300"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {step > stepNumber ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    step >= stepNumber
                      ? "text-blue-600 font-medium"
                      : currentTheme === "dark"
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  {stepNumber === 1 && "Client & Ticket"}
                  {stepNumber === 2 && "Staff Information"}
                  {stepNumber === 3 && "Pay Grade"}
                </span>
                {stepNumber < 3 && (
                  <div
                    className={`w-12 h-0.5 mx-4 ${
                      step > stepNumber
                        ? "bg-blue-600"
                        : currentTheme === "dark"
                        ? "bg-gray-600"
                        : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {successMessage ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  Success!
                </h3>
                <p className="text-green-600">{successMessage}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Client and Ticket Selection */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-medium">
                      Select Client and Recruitment Ticket
                    </h3>
                  </div>

                  {/* Client Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Client Organization *
                    </label>
                    <select
                      value={formData[FORM_FIELDS.MANUAL_BOARDING.CLIENT_ID]}
                      onChange={(e) =>
                        handleInputChange(
                          FORM_FIELDS.MANUAL_BOARDING.CLIENT_ID,
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.client_id
                          ? "border-red-500"
                          : currentTheme === "dark"
                          ? "border-gray-600 bg-gray-700"
                          : "border-gray-300"
                      }`}
                      disabled={loading}
                    >
                      <option value="">Select a client...</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.client_name} ({client.prefix})
                        </option>
                      ))}
                    </select>
                    {errors.client_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.client_id}
                      </p>
                    )}
                  </div>

                  {/* Selected Client Info */}
                  {selectedClient && (
                    <div
                      className={`p-4 rounded-lg ${
                        currentTheme === "dark" ? "bg-gray-700" : "bg-blue-50"
                      }`}
                    >
                      <h4 className="font-medium text-blue-800 mb-2">
                        Selected Client
                      </h4>
                      <p className="text-sm text-blue-600">
                        <span className="font-medium">
                          {selectedClient.client_name}
                        </span>
                        <span className="ml-2">
                          ({selectedClient.active_tickets} active tickets)
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Ticket Selection */}
                  {formData[FORM_FIELDS.MANUAL_BOARDING.CLIENT_ID] && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Recruitment Ticket *
                      </label>
                      <select
                        value={
                          formData[
                            FORM_FIELDS.MANUAL_BOARDING.RECRUITMENT_REQUEST_ID
                          ]
                        }
                        onChange={(e) =>
                          handleInputChange(
                            FORM_FIELDS.MANUAL_BOARDING.RECRUITMENT_REQUEST_ID,
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.recruitment_request_id
                            ? "border-red-500"
                            : currentTheme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-300"
                        }`}
                        disabled={loadingTickets}
                      >
                        <option value="">
                          {loadingTickets
                            ? "Loading tickets..."
                            : "Select a recruitment ticket..."}
                        </option>
                        {tickets.map((ticket) => (
                          <option key={ticket.id} value={ticket.id}>
                            {ticket.ticket_code} - {ticket.job_title}
                            (Available: {ticket.available_slots})
                          </option>
                        ))}
                      </select>
                      {errors.recruitment_request_id && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.recruitment_request_id}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Selected Ticket Info */}
                  {selectedTicket && (
                    <div
                      className={`p-4 rounded-lg ${
                        currentTheme === "dark" ? "bg-gray-700" : "bg-green-50"
                      }`}
                    >
                      <h4 className="font-medium text-green-800 mb-2">
                        Selected Ticket
                      </h4>
                      <div className="text-sm text-green-600 space-y-1">
                        <p>
                          <span className="font-medium">Position:</span>{" "}
                          {selectedTicket.job_title}
                        </p>
                        <p>
                          <span className="font-medium">Department:</span>{" "}
                          {selectedTicket.department}
                        </p>
                        <p>
                          <span className="font-medium">
                            Available Positions:
                          </span>{" "}
                          {selectedTicket.available_slots}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Staff Information */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-medium">Staff Information</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData[FORM_FIELDS.MANUAL_BOARDING.FIRST_NAME]}
                        onChange={(e) =>
                          handleInputChange(
                            FORM_FIELDS.MANUAL_BOARDING.FIRST_NAME,
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors[FORM_FIELDS.MANUAL_BOARDING.FIRST_NAME]
                            ? "border-red-500"
                            : currentTheme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter first name"
                      />
                      {errors[FORM_FIELDS.MANUAL_BOARDING.FIRST_NAME] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors[FORM_FIELDS.MANUAL_BOARDING.FIRST_NAME]}
                        </p>
                      )}
                    </div>

                    {/* Middle Name */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        value={
                          formData[FORM_FIELDS.MANUAL_BOARDING.MIDDLE_NAME]
                        }
                        onChange={(e) =>
                          handleInputChange(
                            FORM_FIELDS.MANUAL_BOARDING.MIDDLE_NAME,
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          currentTheme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter middle name (optional)"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData[FORM_FIELDS.MANUAL_BOARDING.LAST_NAME]}
                        onChange={(e) =>
                          handleInputChange(
                            FORM_FIELDS.MANUAL_BOARDING.LAST_NAME,
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors[FORM_FIELDS.MANUAL_BOARDING.LAST_NAME]
                            ? "border-red-500"
                            : currentTheme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter last name"
                      />
                      {errors[FORM_FIELDS.MANUAL_BOARDING.LAST_NAME] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors[FORM_FIELDS.MANUAL_BOARDING.LAST_NAME]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData[FORM_FIELDS.MANUAL_BOARDING.EMAIL]}
                        onChange={(e) =>
                          handleInputChange(
                            FORM_FIELDS.MANUAL_BOARDING.EMAIL,
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors[FORM_FIELDS.MANUAL_BOARDING.EMAIL]
                            ? "border-red-500"
                            : currentTheme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter email address"
                      />
                      {errors[FORM_FIELDS.MANUAL_BOARDING.EMAIL] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors[FORM_FIELDS.MANUAL_BOARDING.EMAIL]}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData[FORM_FIELDS.MANUAL_BOARDING.PHONE]}
                        onChange={(e) =>
                          handleInputChange(
                            FORM_FIELDS.MANUAL_BOARDING.PHONE,
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors[FORM_FIELDS.MANUAL_BOARDING.PHONE]
                            ? "border-red-500"
                            : currentTheme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-300"
                        }`}
                        placeholder="Enter phone number"
                      />
                      {errors[FORM_FIELDS.MANUAL_BOARDING.PHONE] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors[FORM_FIELDS.MANUAL_BOARDING.PHONE]}
                        </p>
                      )}
                    </div>

                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Gender *
                      </label>
                      <select
                        value={formData[FORM_FIELDS.MANUAL_BOARDING.GENDER]}
                        onChange={(e) =>
                          handleInputChange(
                            FORM_FIELDS.MANUAL_BOARDING.GENDER,
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors[FORM_FIELDS.MANUAL_BOARDING.GENDER]
                            ? "border-red-500"
                            : currentTheme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Select gender...</option>
                        <option value={STAFF_GENDER.MALE}>Male</option>
                        <option value={STAFF_GENDER.FEMALE}>Female</option>
                        <option value={STAFF_GENDER.OTHER}>Other</option>
                      </select>
                      {errors[FORM_FIELDS.MANUAL_BOARDING.GENDER] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors[FORM_FIELDS.MANUAL_BOARDING.GENDER]}
                        </p>
                      )}
                    </div>

                    {/* Entry Date */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Entry Date *
                      </label>
                      <input
                        type="date"
                        value={formData[FORM_FIELDS.MANUAL_BOARDING.ENTRY_DATE]}
                        onChange={(e) =>
                          handleInputChange(
                            FORM_FIELDS.MANUAL_BOARDING.ENTRY_DATE,
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors[FORM_FIELDS.MANUAL_BOARDING.ENTRY_DATE]
                            ? "border-red-500"
                            : currentTheme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-300"
                        }`}
                      />
                      {errors[FORM_FIELDS.MANUAL_BOARDING.ENTRY_DATE] && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors[FORM_FIELDS.MANUAL_BOARDING.ENTRY_DATE]}
                        </p>
                      )}
                    </div>

                    {/* Appointment Status */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Appointment Status
                      </label>
                      <select
                        value={
                          formData[
                            FORM_FIELDS.MANUAL_BOARDING.APPOINTMENT_STATUS
                          ]
                        }
                        onChange={(e) =>
                          handleInputChange(
                            FORM_FIELDS.MANUAL_BOARDING.APPOINTMENT_STATUS,
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          currentTheme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-300"
                        }`}
                      >
                        <option value={STAFF_APPOINTMENT_STATUS.PROBATION}>
                          Probation
                        </option>
                        <option value={STAFF_APPOINTMENT_STATUS.CONFIRMED}>
                          Confirmed
                        </option>
                        <option value={STAFF_APPOINTMENT_STATUS.CONTRACT}>
                          Contract
                        </option>
                        <option value={STAFF_APPOINTMENT_STATUS.TEMPORARY}>
                          Temporary
                        </option>
                      </select>
                    </div>

                    {/* Employment Type */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Employment Type
                      </label>
                      <select
                        value={
                          formData[FORM_FIELDS.MANUAL_BOARDING.EMPLOYMENT_TYPE]
                        }
                        onChange={(e) =>
                          handleInputChange(
                            FORM_FIELDS.MANUAL_BOARDING.EMPLOYMENT_TYPE,
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          currentTheme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-300"
                        }`}
                      >
                        <option value={STAFF_EMPLOYMENT_TYPE.FULL_TIME}>
                          Full Time
                        </option>
                        <option value={STAFF_EMPLOYMENT_TYPE.PART_TIME}>
                          Part Time
                        </option>
                        <option value={STAFF_EMPLOYMENT_TYPE.CONTRACT}>
                          Contract
                        </option>
                        <option value={STAFF_EMPLOYMENT_TYPE.TEMPORARY}>
                          Temporary
                        </option>
                        <option value={STAFF_EMPLOYMENT_TYPE.INTERNSHIP}>
                          Internship
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-700">
                      Optional Information
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={formData[FORM_FIELDS.MANUAL_BOARDING.LOCATION]}
                          onChange={(e) =>
                            handleInputChange(
                              FORM_FIELDS.MANUAL_BOARDING.LOCATION,
                              e.target.value
                            )
                          }
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            currentTheme === "dark"
                              ? "border-gray-600 bg-gray-700"
                              : "border-gray-300"
                          }`}
                          placeholder="Work location"
                        />
                      </div>

                      {/* Tax ID */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Tax ID Number
                        </label>
                        <input
                          type="text"
                          value={
                            formData[FORM_FIELDS.MANUAL_BOARDING.TAX_ID_NO]
                          }
                          onChange={(e) =>
                            handleInputChange(
                              FORM_FIELDS.MANUAL_BOARDING.TAX_ID_NO,
                              e.target.value
                            )
                          }
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            currentTheme === "dark"
                              ? "border-gray-600 bg-gray-700"
                              : "border-gray-300"
                          }`}
                          placeholder="Tax identification number"
                        />
                      </div>

                      {/* PF Number */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Pension Fund Number
                        </label>
                        <input
                          type="text"
                          value={formData[FORM_FIELDS.MANUAL_BOARDING.PF_NO]}
                          onChange={(e) =>
                            handleInputChange(
                              FORM_FIELDS.MANUAL_BOARDING.PF_NO,
                              e.target.value
                            )
                          }
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            currentTheme === "dark"
                              ? "border-gray-600 bg-gray-700"
                              : "border-gray-300"
                          }`}
                          placeholder="Pension fund number"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Notes
                      </label>
                      <textarea
                        value={formData[FORM_FIELDS.MANUAL_BOARDING.NOTES]}
                        onChange={(e) =>
                          handleInputChange(
                            FORM_FIELDS.MANUAL_BOARDING.NOTES,
                            e.target.value
                          )
                        }
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          currentTheme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-300"
                        }`}
                        placeholder="Additional notes or comments..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Pay Grade Selection */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-medium">Pay Grade Selection</h3>
                  </div>

                  {/* Pay Grade Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Pay Grade Structure *
                    </label>
                    <select
                      value={
                        formData[
                          FORM_FIELDS.MANUAL_BOARDING.PAY_GRADE_STRUCTURE_ID
                        ]
                      }
                      onChange={(e) =>
                        handleInputChange(
                          FORM_FIELDS.MANUAL_BOARDING.PAY_GRADE_STRUCTURE_ID,
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.pay_grade_structure_id
                          ? "border-red-500"
                          : currentTheme === "dark"
                          ? "border-gray-600 bg-gray-700"
                          : "border-gray-300"
                      }`}
                      disabled={loadingPayGrades}
                    >
                      <option value="">
                        {loadingPayGrades
                          ? "Loading pay grades..."
                          : "Select a pay grade..."}
                      </option>
                      {payGrades.map((payGrade) => (
                        <option key={payGrade.id} value={payGrade.id}>
                          {payGrade.grade_name} - {payGrade.grade_code}
                          (₦{payGrade.total_compensation?.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    {errors.pay_grade_structure_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.pay_grade_structure_id}
                      </p>
                    )}
                  </div>

                  {/* Selected Pay Grade Details */}
                  {selectedPayGrade && (
                    <div
                      className={`p-4 rounded-lg ${
                        currentTheme === "dark" ? "bg-gray-700" : "bg-blue-50"
                      }`}
                    >
                      <h4 className="font-medium text-blue-800 mb-3">
                        Pay Grade Details
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-blue-600">
                            Grade:
                          </span>
                          <p>
                            {selectedPayGrade.grade_name} (
                            {selectedPayGrade.grade_code})
                          </p>
                        </div>

                        {/* Dynamically display all emolument fields */}
                        {selectedPayGrade.emoluments &&
                          Object.entries(selectedPayGrade.emoluments).map(
                            ([key, value]) => (
                              <div key={key}>
                                <span className="font-medium text-blue-600">
                                  {key
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                  :
                                </span>
                                <p>
                                  ₦{parseFloat(value || 0).toLocaleString()}
                                </p>
                              </div>
                            )
                          )}

                        <div className="col-span-2 border-t pt-2">
                          <span className="font-medium text-blue-600">
                            Total Compensation:
                          </span>
                          <p className="text-lg font-bold">
                            ₦
                            {selectedPayGrade.total_compensation?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div
                    className={`p-4 rounded-lg ${
                      currentTheme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <h4 className="font-medium mb-3">Boarding Summary</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Client:</span>{" "}
                        {selectedClient?.client_name}
                      </p>
                      <p>
                        <span className="font-medium">Position:</span>{" "}
                        {selectedTicket?.job_title}
                      </p>
                      <p>
                        <span className="font-medium">Staff Name:</span>{" "}
                        {formData[FORM_FIELDS.MANUAL_BOARDING.FIRST_NAME]}{" "}
                        {formData[FORM_FIELDS.MANUAL_BOARDING.LAST_NAME]}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {formData[FORM_FIELDS.MANUAL_BOARDING.EMAIL]}
                      </p>
                      <p>
                        <span className="font-medium">Entry Date:</span>{" "}
                        {formData[FORM_FIELDS.MANUAL_BOARDING.ENTRY_DATE]}
                      </p>
                      {selectedPayGrade && (
                        <p>
                          <span className="font-medium">Pay Grade:</span>{" "}
                          {selectedPayGrade.grade_name} (₦
                          {selectedPayGrade.total_compensation?.toLocaleString()}
                          )
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Messages */}
              {errors.general && (
                <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700">{errors.general}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!successMessage && (
          <div
            className={`px-6 py-4 border-t flex items-center justify-between ${
              currentTheme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="flex space-x-3">
              {step > 1 && (
                <button
                  onClick={handlePrevious}
                  className={`px-4 py-2 border rounded-lg transition-colors ${
                    currentTheme === "dark"
                      ? "border-gray-600 hover:bg-gray-700"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className={`px-4 py-2 border rounded-lg transition-colors ${
                  currentTheme === "dark"
                    ? "border-gray-600 hover:bg-gray-700"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                Cancel
              </button>

              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{loading ? "Creating..." : "Create Staff"}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualBoardingModal;
