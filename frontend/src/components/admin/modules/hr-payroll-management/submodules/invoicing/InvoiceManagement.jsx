"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClients } from "@/hooks/useClients";
import {
  invoiceApiService,
  invoiceTemplateService,
} from "@/services/modules/invoicing";
import { salaryStructureAPI } from "@/services/modules/client-contract-management/salary-structure";

// Import modular tab components
import EnhancedUploadTab from "./tabs/EnhancedUploadTab";
import InvoiceGenerationTab from "./tabs/InvoiceGenerationTab";
import GeneratedInvoicesTab from "./tabs/GeneratedInvoicesTab";
import TemplateSetupTab from "./tabs/TemplateSetupTab";
import UpcomingFeaturesTab from "./tabs/UpcomingFeaturesTab";
import InvoiceViewModal from "./modals/InvoiceViewModal";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertDescription,
} from "@/components/ui";
import {
  FileSpreadsheet,
  Calculator,
  FileText,
  Settings,
  Rocket,
  Upload,
} from "lucide-react";

/**
 * Modular Invoice Management Component
 * Refactored from large monolithic component into manageable tab-based structure
 */
const InvoiceManagement = () => {
  const { user } = useAuth();
  const { clients, loading: clientsLoading } = useClients();

  // Tab state
  const [activeTab, setActiveTab] = useState("upload");

  // Shared state for all tabs
  const [attendanceUploads, setAttendanceUploads] = useState([]);
  const [generatedInvoices, setGeneratedInvoices] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // PDF Export Modal state
  const [showPdfExportModal, setShowPdfExportModal] = useState(false);
  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState(null);
  const [pdfIssueDate, setPdfIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  ); // Default to today

  // Template Setup state (restored from original component)
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateClient, setSelectedTemplateClient] = useState(null);
  const [clientJobStructures, setClientJobStructures] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [templateSettings, setTemplateSettings] = useState({
    statutory: {
      pension: {
        enabled: true,
        rate: 0,
        calculation_type: "percentage",
        components: [],
      },
      nhf: {
        enabled: true,
        rate: 0,
        calculation_type: "percentage",
        components: [],
      },
      nsitf: {
        enabled: true,
        rate: 0,
        calculation_type: "percentage",
        components: [],
      },
      itf: {
        enabled: true,
        rate: 0,
        calculation_type: "percentage",
        components: [],
      },
      tax: {
        enabled: true,
        rate: 0,
        calculation_type: "percentage",
        components: [],
      },
    },
    custom: [],
    payGradeTemplates: {},
  });

  // Template persistence state
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [clientTemplateCounts, setClientTemplateCounts] = useState({});
  const [collapsedJobStructures, setCollapsedJobStructures] = useState({});

  // Invoice Generation state
  const [selectedUpload, setSelectedUpload] = useState("");
  const [invoiceType, setInvoiceType] = useState("with_schedule");

  // Formula Builder state
  const [showFormulaBuilder, setShowFormulaBuilder] = useState(false);
  const [currentFormulaTarget, setCurrentFormulaTarget] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === "invoices") {
      loadGeneratedInvoices();
    }
  }, [activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        loadAttendanceUploads(),
        loadGeneratedInvoices(),
        loadTemplates(),
      ]);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setError("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceUploads = async () => {
    try {
      const response = await invoiceApiService.getAttendanceUploads();
      if (response.success) {
        const uploadsData = response.data || response.uploads || [];
        setAttendanceUploads(Array.isArray(uploadsData) ? uploadsData : []);
      } else {
        setAttendanceUploads([]);
      }
    } catch (error) {
      console.error("Error loading attendance uploads:", error);
      setAttendanceUploads([]);
    }
  };

  const loadGeneratedInvoices = async () => {
    try {
      const response = await invoiceApiService.getInvoices();

      if (response.success) {
        // Handle paginated response - invoices are in response.data.data
        const invoicesData =
          response.data?.data || response.data || response.invoices || [];
        setGeneratedInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      } else {
        setGeneratedInvoices([]);
      }
    } catch (error) {
      console.error("Error loading generated invoices:", error);
      setGeneratedInvoices([]);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await invoiceTemplateService.getTemplates();
      if (response.success) {
        const templatesData = response.data || response.templates || [];
        setTemplates(Array.isArray(templatesData) ? templatesData : []);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      setTemplates([]);
    }
  };

  // Tab configuration
  const tabs = [
    {
      id: "upload",
      label: "Upload Files",
      icon: Upload,
      description: "Upload and manage attendance files",
    },
    {
      id: "generate",
      label: "Generate Invoices",
      icon: Calculator,
      description: "Create invoices from attendance data",
    },
    {
      id: "invoices",
      label: "Generated Invoices",
      icon: FileText,
      description: "View and manage generated invoices",
    },
    {
      id: "templates",
      label: "Template Setup",
      icon: Settings,
      description: "Configure salary templates",
    },
    {
      id: "upcoming",
      label: "Upcoming Features",
      icon: Rocket,
      description: "Preview future enhancements",
    },
  ];

  // Handle successful upload (refresh data)
  const handleUploadSuccess = () => {
    loadAttendanceUploads();
  };

  // Handle successful invoice generation (refresh data)
  const handleInvoiceGenerated = () => {
    loadGeneratedInvoices();
  };

  // Handle invoice generation request
  const handleGenerateInvoice = async () => {
    if (!selectedUpload) {
      alert("Please select an attendance upload first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await invoiceApiService.generateInvoiceFromAttendance(
        selectedUpload,
        invoiceType
      );

      // Reset form and refresh data
      setSelectedUpload("");
      setInvoiceType("with_schedule");

      // Refresh the generated invoices list
      await loadGeneratedInvoices();

      // Show success message
      alert(`Invoice generated successfully! Invoice ID: ${result.invoice_id}`);

      // Switch to the invoices tab to show the result
      setActiveTab("invoices");
    } catch (error) {
      console.error("Error generating invoice:", error);
      setError(error.message || "Failed to generate invoice");
    } finally {
      setLoading(false);
    }
  };

  // Handle template updates (refresh data)
  const handleTemplateUpdate = () => {
    loadTemplates();
  };

  // Invoice view modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loadingInvoiceDetails, setLoadingInvoiceDetails] = useState(false);

  // Handle invoice view action
  const handleViewInvoice = async (invoiceId) => {
    try {
      console.log("Viewing invoice:", invoiceId);
      setLoadingInvoiceDetails(true);

      const response = await invoiceApiService.getInvoiceWithDetails(invoiceId);
      if (response.success) {
        setSelectedInvoice(response.data);
        setShowInvoiceModal(true);
      } else {
        alert(
          "Failed to load invoice details: " +
            (response.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error viewing invoice:", error);
      alert("Failed to view invoice. Please try again.");
    } finally {
      setLoadingInvoiceDetails(false);
    }
  };

  // Handle invoice export action
  const handleExportInvoice = async (invoiceId) => {
    try {
      console.log("Exporting invoice:", invoiceId);

      // For now, try Excel export
      const response = await invoiceApiService.exportInvoiceToExcel(invoiceId);
      if (response.success) {
        alert(`Invoice exported successfully: ${response.filename}`);
      } else {
        alert(
          "Export functionality is being implemented. Please check back soon."
        );
      }
    } catch (error) {
      console.error("Error exporting invoice:", error);
      // If the export method doesn't exist yet, show a helpful message
      alert(
        "Export functionality is being implemented. Please check back soon."
      );
    }
  };

  // Handle invoice PDF export action (Sheet 1 - Invoice Summary)
  const handleExportInvoicePDF = async (invoiceId) => {
    // Open the date picker modal
    setSelectedInvoiceForPdf(invoiceId);
    setShowPdfExportModal(true);
  };

  // Handle PDF export with selected date
  const handlePdfExportWithDate = async () => {
    if (!selectedInvoiceForPdf) return;

    try {
      console.log(
        "Exporting invoice to PDF:",
        selectedInvoiceForPdf,
        "with date:",
        pdfIssueDate
      );
      setLoading(true);

      // Call PDF export endpoint with issue date
      const response = await invoiceApiService.exportInvoiceToPDF(
        selectedInvoiceForPdf,
        pdfIssueDate
      );
      if (response.success) {
        alert(`Invoice PDF exported successfully: ${response.filename}`);
      } else {
        alert("PDF export completed successfully.");
      }

      // Close modal
      setShowPdfExportModal(false);
      setSelectedInvoiceForPdf(null);
    } catch (error) {
      console.error("Error exporting invoice to PDF:", error);
      alert("Error exporting PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle invoice Excel export action (Sheet 2 - Employee Breakdown)
  const handleExportInvoiceExcel = async (invoiceId) => {
    try {
      console.log("Exporting invoice to Excel:", invoiceId);

      // Export only employee breakdown sheet
      const response = await invoiceApiService.exportInvoiceToExcel(invoiceId);
      if (response.success) {
        alert(`Employee breakdown exported successfully: ${response.filename}`);
      } else {
        alert(
          "Excel export functionality is being implemented. Please check back soon."
        );
      }
    } catch (error) {
      console.error("Error exporting invoice to Excel:", error);
      alert(
        "Excel export functionality is being implemented. Please check back soon."
      );
    }
  };

  // Close invoice modal
  const handleCloseInvoiceModal = () => {
    setShowInvoiceModal(false);
    setSelectedInvoice(null);
  };

  // ===== FIRS INTEGRATION FUNCTIONS =====

  // Handle sending invoice to FIRS for approval
  const handleSendToFIRS = async (invoiceId) => {
    try {
      console.log("Sending generated invoice to FIRS:", invoiceId);
      setLoading(true);

      // Import and use the FIRS service
      const { default: firsService } = await import(
        "@/services/modules/invoicing/firsService"
      );

      const result = await firsService.submitGeneratedInvoiceToFIRS(invoiceId);

      if (result.success && result.approved) {
        alert("Invoice successfully submitted and approved by FIRS!");
        // Refresh the generated invoices to show updated FIRS status
        loadGeneratedInvoices();
      } else if (result.success && !result.approved) {
        alert(`Invoice submitted to FIRS but not approved: ${result.message}`);
        loadGeneratedInvoices();
      } else {
        alert(`FIRS submission failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Error sending to FIRS:", error);
      alert("Network error occurred while submitting to FIRS");
    } finally {
      setLoading(false);
    }
  };

  // Handle exporting FIRS-compliant PDF with QR code
  const handleExportFIRSPDF = async (invoiceId) => {
    try {
      console.log("Exporting FIRS-compliant PDF:", invoiceId);
      setLoading(true);

      const response = await invoiceApiService.exportFIRSCompliancePDF(
        invoiceId
      );

      if (response.success) {
        alert(`FIRS-compliant PDF exported successfully: ${response.filename}`);
      } else {
        alert(
          "FIRS PDF export failed. Please ensure the invoice is FIRS-approved."
        );
      }
    } catch (error) {
      console.error("Error exporting FIRS PDF:", error);
      alert("Error occurred while exporting FIRS-compliant PDF");
    } finally {
      setLoading(false);
    }
  };

  // ===== TEMPLATE SETUP FUNCTIONS (restored from original component) =====

  const getSalaryComponents = () => {
    const statutoryComponents = [
      { id: "basic_salary", name: "Basic Salary", category: "Salary" },
      {
        id: "housing_allowance",
        name: "Housing Allowance",
        category: "Allowance",
      },
      {
        id: "transport_allowance",
        name: "Transport Allowance",
        category: "Allowance",
      },
      { id: "meal_allowance", name: "Meal Allowance", category: "Allowance" },
      {
        id: "utility_allowance",
        name: "Utility Allowance",
        category: "Allowance",
      },
      { id: "gross_salary", name: "Gross Salary", category: "Calculation" },
    ];

    // Add allowance components from templateSettings
    const customComponents = templateSettings.custom.map((comp) => ({
      id: comp.id,
      name: comp.name,
      category: "Custom Allowance",
    }));

    return [
      ...statutoryComponents,
      ...customComponents,
      { id: "gross_salary", name: "Gross Salary", category: "Calculation" },
      ...templateSettings.custom
        .filter((comp) => comp.name)
        .map((comp) => ({
          id: comp.id,
          name: comp.name,
          category: "Allowance",
        })),
    ];
  };

  // Format currency utility function
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "₦0.00";
    }
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date utility function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleTemplateSetup = (client) => {
    setSelectedTemplateClient(client);
    setShowTemplateModal(true);
    setSelectedGrade(null);
    loadClientJobStructures(client.id, client);
  };

  const loadClientJobStructures = async (clientId, clientData) => {
    try {
      setLoading(true);
      console.log("=== Loading job structures for client ===");
      console.log("Client ID:", clientId);
      console.log("Client Data:", clientData);

      // Use the correct API method with client_id parameter
      const response = await salaryStructureAPI.jobStructures.getAll({
        client_id: clientId,
      });

      console.log("=== Job structures API response ===");
      console.log("Full response:", response);

      // Fix: The API service returns HTTP response, actual data is in response.data
      const apiData = response.data;
      console.log("API data:", apiData);
      console.log("API success:", apiData?.success);
      console.log("API data.data:", apiData?.data);

      if (apiData?.success && apiData?.data) {
        const structuresArray = Array.isArray(apiData.data)
          ? apiData.data
          : apiData.data.data
          ? apiData.data.data
          : [apiData.data];

        console.log("=== Processed job structures ===");
        console.log("Structures array:", structuresArray);
        console.log("Structures count:", structuresArray.length);

        // Log each job structure and its pay grades
        structuresArray.forEach((structure, index) => {
          console.log(`Structure ${index + 1}:`, structure);
          console.log(`- Job Title: ${structure.job_title}`);
          console.log(
            `- Pay Grades: ${
              structure.payGrades || structure.pay_grades || "undefined"
            }`
          );
          console.log(
            `- Pay Grades Count: ${
              structure.payGrades?.length || structure.pay_grades?.length || 0
            }`
          );
        });

        setClientJobStructures(structuresArray);

        // Load templates for all job structures
        if (structuresArray.length > 0) {
          await loadAllPayGradeTemplatesForStructures(
            structuresArray,
            clientData
          );
        }
      } else {
        console.warn("=== No job structures or API failed ===");
        console.warn("API Response:", apiData);
        setClientJobStructures([]);
      }
    } catch (error) {
      console.error("=== Error loading client job structures ===");
      console.error("Error:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      setClientJobStructures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSelection = (grade) => {
    setSelectedGrade(grade);
    const existingTemplate = templateSettings.payGradeTemplates[grade.id];
    if (existingTemplate) {
      setTemplateSettings((prev) => ({
        ...prev,
        statutory: existingTemplate.statutory,
        custom: existingTemplate.custom,
      }));
    } else {
      // Reset to defaults for new grade
      setTemplateSettings((prev) => ({
        ...prev,
        statutory: {
          pension: {
            enabled: true,
            rate: 0,
            calculation_type: "percentage",
            components: [],
          },
          nhf: {
            enabled: true,
            rate: 0,
            calculation_type: "percentage",
            components: [],
          },
          nsitf: {
            enabled: true,
            rate: 0,
            calculation_type: "percentage",
            components: [],
          },
          itf: {
            enabled: true,
            rate: 0,
            calculation_type: "percentage",
            components: [],
          },
          tax: {
            enabled: true,
            rate: 0,
            calculation_type: "percentage",
            components: [],
          },
        },
        custom: [],
      }));
    }
  };

  const handleCopyTemplate = (fromGrade, toGrade) => {
    const sourceTemplate = templateSettings.payGradeTemplates[fromGrade.id];
    if (sourceTemplate) {
      setTemplateSettings((prev) => ({
        ...prev,
        payGradeTemplates: {
          ...prev.payGradeTemplates,
          [toGrade.id]: { ...sourceTemplate },
        },
      }));

      // If copying to currently selected grade, update the active template
      if (selectedGrade && selectedGrade.id === toGrade.id) {
        setTemplateSettings((prev) => ({
          ...prev,
          statutory: sourceTemplate.statutory,
          custom: sourceTemplate.custom,
        }));
      }
      console.log(
        `Template copied from ${fromGrade.grade_name} to ${toGrade.grade_name}`
      );
    }
  };

  const handleClearTemplate = (grade) => {
    setTemplateSettings((prev) => {
      const newPayGradeTemplates = { ...prev.payGradeTemplates };
      delete newPayGradeTemplates[grade.id];

      return {
        ...prev,
        payGradeTemplates: newPayGradeTemplates,
        // If clearing the currently selected grade, also clear the active template
        ...(selectedGrade &&
          selectedGrade.id === grade.id && {
            statutory: {
              pension: {
                enabled: true,
                rate: 0,
                calculation_type: "percentage",
                components: [],
              },
              nhf: {
                enabled: true,
                rate: 0,
                calculation_type: "percentage",
                components: [],
              },
              nsitf: {
                enabled: true,
                rate: 0,
                calculation_type: "percentage",
                components: [],
              },
              itf: {
                enabled: true,
                rate: 0,
                calculation_type: "percentage",
                components: [],
              },
              tax: {
                enabled: true,
                rate: 0,
                calculation_type: "percentage",
                components: [],
              },
            },
            custom: [],
          }),
      };
    });
    console.log(`Template cleared for grade: ${grade.grade_name}`);
  };

  const loadClientTemplateCounts = async () => {
    if (!clients || clients.length === 0) return;

    try {
      const counts = {};

      // Get template counts for each client
      for (const client of clients) {
        try {
          const response = await invoiceTemplateService.getTemplates({
            client_id: client.id,
            active_only: true,
          });

          if (response.success) {
            const templatesArray = response.data?.data || response.data;
            counts[client.id] = Array.isArray(templatesArray)
              ? templatesArray.length
              : 0;
          } else {
            counts[client.id] = 0;
          }
        } catch (error) {
          console.error(
            `Error loading templates for client ${client.id}:`,
            error
          );
          counts[client.id] = 0;
        }
      }

      setClientTemplateCounts(counts);
    } catch (error) {
      console.error("Error loading client template counts:", error);
    }
  };

  const loadAvailableTemplates = async () => {
    if (!selectedTemplateClient || !selectedGrade) return;

    try {
      setTemplateLoading(true);

      const response = await invoiceTemplateService.getTemplates({
        client_id: selectedTemplateClient.id,
        pay_grade_structure_id: selectedGrade.id,
        active_only: true,
      });

      if (response.success) {
        const templatesArray = response.data?.data || response.data;
        setAvailableTemplates(
          Array.isArray(templatesArray) ? templatesArray : []
        );

        // Auto-load template if only one exists
        if (templatesArray && templatesArray.length === 1) {
          console.log("Auto-loading single template:", templatesArray[0].id);
          await loadExistingTemplate(templatesArray[0].id);
        }
      } else {
        console.error("Failed to load templates:", response.message);
      }
    } catch (error) {
      console.error("Error loading available templates:", error);
    } finally {
      setTemplateLoading(false);
    }
  };

  const loadAllPayGradeTemplatesForStructures = async (
    jobStructures,
    client
  ) => {
    if (!client) {
      console.log("No client provided, skipping template load");
      return;
    }

    try {
      const allPayGrades = jobStructures.flatMap(
        (js) => js.payGrades || js.pay_grades || []
      );

      console.log(
        "Loading templates for all pay grades:",
        allPayGrades.map((pg) => `${pg.id}:${pg.grade_name}`)
      );

      // Load templates for each pay grade
      const templatePromises = allPayGrades.map(async (grade) => {
        try {
          console.log(
            `[Template Load] Fetching templates for grade ${grade.id} (${grade.grade_name})`
          );
          const response = await invoiceTemplateService.getTemplates({
            client_id: client.id,
            pay_grade_structure_id: grade.id,
            active_only: true,
          });

          console.log(
            `[Template Load] Response for grade ${grade.id}:`,
            response
          );

          if (response.success) {
            const templatesArray = response.data?.data || response.data;
            console.log(
              `[Template Load] Templates array for grade ${grade.id}:`,
              templatesArray
            );
            if (templatesArray && templatesArray.length > 0) {
              // Load the first template for this grade
              console.log(
                `[Template Load] Loading template ${templatesArray[0].id} for grade ${grade.id}`
              );
              const templateResponse = await invoiceTemplateService.getTemplate(
                templatesArray[0].id
              );
              console.log(
                `[Template Load] Template response for grade ${grade.id}:`,
                templateResponse
              );
              if (templateResponse.success) {
                const actualTemplateData =
                  templateResponse.data?.data || templateResponse.data;
                const templateData =
                  invoiceTemplateService.parseTemplateData(actualTemplateData);
                console.log(
                  `[Template Load] Parsed template data for grade ${grade.id}:`,
                  templateData
                );
                return {
                  gradeId: grade.id,
                  template: templateData.templateSettings,
                };
              }
            } else {
              console.log(
                `[Template Load] No templates found for grade ${grade.id}`
              );
            }
          } else {
            console.log(
              `[Template Load] Failed response for grade ${grade.id}:`,
              response
            );
          }
        } catch (error) {
          console.error(
            `[Template Load] Error loading template for grade ${grade.id}:`,
            error
          );
        }
        return null;
      });

      console.log("[Template Load] Waiting for all template promises...");
      const results = await Promise.all(templatePromises);
      console.log("[Template Load] All templates loaded. Results:", results);

      // Update payGradeTemplates with loaded templates
      const newPayGradeTemplates = {};
      results.forEach((result) => {
        if (result) {
          newPayGradeTemplates[result.gradeId] = result.template;
        }
      });

      setTemplateSettings((prev) => ({
        ...prev,
        payGradeTemplates: {
          ...prev.payGradeTemplates,
          ...newPayGradeTemplates,
        },
      }));

      // Auto-select grade if there's only one and no templates were found
      if (
        allPayGrades.length === 1 &&
        Object.keys(newPayGradeTemplates).length === 0
      ) {
        console.log(
          "[Template Load] Auto-selecting single pay grade:",
          allPayGrades[0]
        );
        setSelectedGrade(allPayGrades[0]);
      }
    } catch (error) {
      console.error("Error loading all pay grade templates:", error);
    }
  };

  const loadExistingTemplate = async (templateId) => {
    try {
      setTemplateLoading(true);
      const response = await invoiceTemplateService.getTemplate(templateId);

      if (response.success) {
        const actualTemplateData = response.data?.data || response.data;
        const templateData =
          invoiceTemplateService.parseTemplateData(actualTemplateData);

        // Apply template settings to current state
        setTemplateSettings((prev) => {
          const newSettings = {
            ...prev,
            statutory: templateData.templateSettings.statutory,
            custom: templateData.templateSettings.custom,
          };
          return newSettings;
        });

        setCurrentTemplateId(templateId);
        console.log(
          "Template loaded successfully:",
          templateData.template_name
        );
      } else {
        console.error("Failed to load template:", response.message);
        alert("Failed to load template: " + response.message);
      }
    } catch (error) {
      console.error("Error loading template:", error);
      alert("Error loading template");
    } finally {
      setTemplateLoading(false);
    }
  };

  const saveTemplate = async (
    templateName,
    description = "",
    setAsDefault = false
  ) => {
    if (!selectedTemplateClient || !selectedGrade) {
      alert("Please select a client and pay grade first");
      return false;
    }

    try {
      setTemplateSaving(true);

      const templateData = invoiceTemplateService.formatTemplateData(
        templateSettings,
        {
          client_id: selectedTemplateClient.id,
          pay_grade_structure_id: selectedGrade.id,
          template_name: templateName,
          description: description,
          grade_name: selectedGrade.grade_name,
          use_credit_to_bank_model: true,
          set_as_default: setAsDefault,
        }
      );

      let response;
      if (currentTemplateId) {
        // Update existing template
        response = await invoiceTemplateService.updateTemplate(
          currentTemplateId,
          templateData
        );
      } else {
        // Create new template
        response = await invoiceTemplateService.createTemplate(templateData);
      }

      if (response.success) {
        setCurrentTemplateId(response.data.id);
        await loadAvailableTemplates(); // Refresh template list
        await loadClientTemplateCounts(); // Refresh client template counts
        console.log("Template saved successfully:", templateName);
        alert("Template saved successfully!");
        return true;
      } else {
        console.error("Failed to save template:", response.message);
        alert("Failed to save template: " + response.message);
        return false;
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Error saving template");
      return false;
    } finally {
      setTemplateSaving(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return false;
    }

    try {
      const response = await invoiceTemplateService.deleteTemplate(templateId);

      if (response.success) {
        if (currentTemplateId === templateId) {
          setCurrentTemplateId(null);
        }
        await loadAvailableTemplates(); // Refresh template list
        await loadClientTemplateCounts(); // Refresh client template counts
        console.log("Template deleted successfully");
        alert("Template deleted successfully!");
        return true;
      } else {
        console.error("Failed to delete template:", response.message);
        alert("Failed to delete template: " + response.message);
        return false;
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Error deleting template");
      return false;
    }
  };

  const cloneTemplate = async (
    sourceTemplateId,
    newName,
    newDescription = ""
  ) => {
    try {
      setTemplateSaving(true);

      const response = await invoiceTemplateService.cloneTemplate(
        sourceTemplateId,
        {
          template_name: newName,
          description: newDescription,
          is_default: false,
        }
      );

      if (response.success) {
        await loadAvailableTemplates(); // Refresh template list
        console.log("Template cloned successfully:", newName);
        alert("Template cloned successfully!");
        return true;
      } else {
        console.error("Failed to clone template:", response.message);
        alert("Failed to clone template: " + response.message);
        return false;
      }
    } catch (error) {
      console.error("Error cloning template:", error);
      alert("Error cloning template");
      return false;
    } finally {
      setTemplateSaving(false);
    }
  };

  // Component manipulation functions
  const addCustomComponent = () => {
    setTemplateSettings((prev) => ({
      ...prev,
      custom: [
        ...prev.custom,
        {
          id: `custom_${Date.now()}`,
          name: "",
          rate: 0,
          calculation_type: "fixed",
          enabled: true,
          formula: "",
          components: [],
        },
      ],
    }));
  };

  const removeCustomComponent = (id) => {
    setTemplateSettings((prev) => ({
      ...prev,
      custom: prev.custom.filter((comp) => comp.id !== id),
    }));
  };

  const updateCustomComponent = (id, field, value) => {
    setTemplateSettings((prev) => ({
      ...prev,
      custom: prev.custom.map((comp) =>
        comp.id === id ? { ...comp, [field]: value } : comp
      ),
    }));
  };

  const updateStatutoryComponent = (component, field, value) => {
    setTemplateSettings((prev) => ({
      ...prev,
      statutory: {
        ...prev.statutory,
        [component]: {
          ...prev.statutory[component],
          [field]: value,
        },
      },
    }));
  };

  // Formula Builder functions
  const openFormulaBuilder = (type, key, componentName) => {
    // Safety check for componentName
    if (!componentName) {
      console.error("openFormulaBuilder called with undefined componentName", {
        type,
        key,
        componentName,
      });
      return;
    }

    console.log("openFormulaBuilder called with:", {
      type,
      key,
      componentName,
    });

    const normalizedKey = componentName.toLowerCase().replace(/\s+/g, "_");

    // For statutory components, use the key directly instead of normalizedKey
    const targetKey = type === "statutory" ? key : normalizedKey;

    console.log("Setting currentFormulaTarget:", {
      type,
      key: targetKey,
      name: componentName,
    });

    setCurrentFormulaTarget({ type, key: targetKey, name: componentName });
    setShowFormulaBuilder(true);

    console.log("showFormulaBuilder should now be true");
  };

  const closeFormulaBuilder = () => {
    setShowFormulaBuilder(false);
    setCurrentFormulaTarget(null);
  };

  // Helper function to extract component names from a formula
  const extractComponentsFromFormula = (formula) => {
    const componentNames = [];

    // Get all available component names from templateSettings
    const availableComponents = [];

    // Add allowance components from custom array
    if (templateSettings?.custom) {
      templateSettings.custom.forEach((component) => {
        if (component.name) {
          const normalizedName = component.name.replace(/\s+/g, "_");
          availableComponents.push({
            name: normalizedName,
            originalName: component.name,
            id: component.id,
          });
        }
      });
    }

    // Add statutory components
    if (templateSettings?.statutory) {
      Object.entries(templateSettings.statutory).forEach(([key, component]) => {
        if (component.enabled) {
          availableComponents.push({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            originalName: key.replace("_", " ").toUpperCase(),
            id: key,
          });
        }
      });
    }

    // Add standard components
    const standardComponents = ["Basic_Salary", "Gross_Total"];
    standardComponents.forEach((name) => {
      availableComponents.push({
        name: name,
        originalName: name.replace("_", " "),
        id: name.toLowerCase(),
      });
    });

    // Find which components are used in the formula
    availableComponents.forEach((component) => {
      const regex = new RegExp(`\\b${component.name}\\b`, "g");
      if (formula.match(regex)) {
        componentNames.push({
          name: component.name,
          originalName: component.originalName,
          id: component.id,
        });
      }
    });

    return componentNames;
  };

  const applyFormula = (formula) => {
    if (!currentFormulaTarget) return;

    const { type, key } = currentFormulaTarget;
    console.log(
      "Applying formula:",
      formula,
      "to target:",
      currentFormulaTarget
    );

    // Extract components used in the formula
    const components = extractComponentsFromFormula(formula);
    console.log("Extracted components from formula:", components);

    if (type === "statutory" && templateSettings.statutory[key]) {
      setTemplateSettings((prev) => {
        const newStatutory = { ...prev.statutory };
        newStatutory[key] = {
          ...newStatutory[key],
          calculation_type: "formula",
          formula: formula,
          components: components, // Save the components used in formula
          rate: 0, // Reset rate when using formula
        };
        return {
          ...prev,
          statutory: newStatutory,
        };
      });
    } else if (type === "custom") {
      setTemplateSettings((prev) => {
        const newCustom = [...prev.custom];
        const componentIndex = newCustom.findIndex((comp) => comp.id === key);
        if (componentIndex !== -1) {
          newCustom[componentIndex] = {
            ...newCustom[componentIndex],
            calculation_type: "formula",
            formula: formula,
            components: components, // Save the components used in formula
            rate: 0, // Reset rate when using formula
          };
        }
        return {
          ...prev,
          custom: newCustom,
        };
      });
    }
  };

  const resetCalculationType = (type, key, newType) => {
    if (type === "statutory") {
      setTemplateSettings((prev) => ({
        ...prev,
        statutory: {
          ...prev.statutory,
          [key]: {
            ...prev.statutory[key],
            calculation_type: newType,
            formula: "",
            components: [],
          },
        },
      }));
    }
  };

  // Load templates when client or grade changes
  useEffect(() => {
    if (selectedTemplateClient && selectedGrade) {
      loadAvailableTemplates();
    }
  }, [selectedTemplateClient, selectedGrade]);

  // Load client template counts when clients change
  useEffect(() => {
    loadClientTemplateCounts();
  }, [clients]);

  if (clientsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Enhanced Invoicing System
                </h1>
                <p className="text-gray-600 mt-1">
                  Streamlined invoice management with Phase 1.3 enhancements
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                <span className="text-sm text-gray-500">
                  {clients.length} clients available
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Error Display */}
      {error && (
        <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-12 pt-6">
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Description */}
          <div className="px-6 py-3 bg-gray-50">
            <p className="text-sm text-gray-600">
              {tabs.find((tab) => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Upload Files Tab */}
          {activeTab === "upload" && (
            <EnhancedUploadTab
              attendanceUploads={attendanceUploads}
              onUploadSuccess={handleUploadSuccess}
              onProceedToGeneration={() => setActiveTab("generate")}
              clients={clients}
            />
          )}

          {/* Generate Invoices Tab */}
          {activeTab === "generate" && (
            <InvoiceGenerationTab
              clients={clients}
              attendanceUploads={attendanceUploads}
              selectedUpload={selectedUpload}
              setSelectedUpload={setSelectedUpload}
              invoiceType={invoiceType}
              setInvoiceType={setInvoiceType}
              loading={loading}
              error={error}
              handleGenerateInvoice={handleGenerateInvoice}
              formatCurrency={formatCurrency}
              onInvoiceGenerated={handleInvoiceGenerated}
            />
          )}

          {/* Generated Invoices Tab */}
          {activeTab === "invoices" && (
            <GeneratedInvoicesTab
              generatedInvoices={generatedInvoices}
              loading={loading}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onRefresh={loadGeneratedInvoices}
              handleViewInvoice={handleViewInvoice}
              handleExportInvoicePDF={handleExportInvoicePDF}
              handleExportInvoiceExcel={handleExportInvoiceExcel}
              handleSendToFIRS={handleSendToFIRS}
              handleExportFIRSPDF={handleExportFIRSPDF}
            />
          )}

          {/* Template Setup Tab */}
          {activeTab === "templates" && (
            <TemplateSetupTab
              // Client and structure data
              clients={clients}
              selectedTemplateClient={selectedTemplateClient}
              setSelectedTemplateClient={setSelectedTemplateClient}
              clientJobStructures={clientJobStructures}
              setClientJobStructures={setClientJobStructures}
              // Grade selection
              selectedGrade={selectedGrade}
              setSelectedGrade={setSelectedGrade}
              // Template settings
              templateSettings={templateSettings}
              setTemplateSettings={setTemplateSettings}
              // Template persistence
              currentTemplateId={currentTemplateId}
              setCurrentTemplateId={setCurrentTemplateId}
              availableTemplates={availableTemplates}
              setAvailableTemplates={setAvailableTemplates}
              templateSaving={templateSaving}
              setTemplateSaving={setTemplateSaving}
              templateLoading={templateLoading}
              setTemplateLoading={setTemplateLoading}
              // Formula builder
              showFormulaBuilder={showFormulaBuilder}
              setShowFormulaBuilder={setShowFormulaBuilder}
              currentFormulaTarget={currentFormulaTarget}
              setCurrentFormulaTarget={setCurrentFormulaTarget}
              // Template counts and UI state
              clientTemplateCounts={clientTemplateCounts}
              setClientTemplateCounts={setClientTemplateCounts}
              collapsedJobStructures={collapsedJobStructures}
              setCollapsedJobStructures={setCollapsedJobStructures}
              // Functions
              getSalaryComponents={getSalaryComponents}
              loadClientJobStructures={loadClientJobStructures}
              loadTemplatesForClient={loadClientTemplateCounts}
              saveTemplate={saveTemplate}
              deleteTemplate={deleteTemplate}
              loadTemplate={loadExistingTemplate}
              createNewTemplate={addCustomComponent}
              handleTemplateSetup={handleTemplateSetup}
              handleGradeSelection={handleGradeSelection}
              handleCopyTemplate={handleCopyTemplate}
              handleClearTemplate={handleClearTemplate}
              updateStatutoryComponent={updateStatutoryComponent}
              updateCustomComponent={updateCustomComponent}
              addCustomComponent={addCustomComponent}
              removeCustomComponent={removeCustomComponent}
              openFormulaBuilder={openFormulaBuilder}
              closeFormulaBuilder={closeFormulaBuilder}
              applyFormula={applyFormula}
              resetCalculationType={resetCalculationType}
              cloneTemplate={cloneTemplate}
              setActiveTab={setActiveTab}
              // Legacy props for compatibility
              templates={templates}
              onTemplateUpdate={handleTemplateUpdate}
            />
          )}

          {/* Upcoming Features Tab */}
          {activeTab === "upcoming" && <UpcomingFeaturesTab />}

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-sm text-gray-500">
          <p>Enhanced Invoicing System v1.3 - SOL ICT Solutions</p>
          <p className="mt-1">
            Phase 1.3: Enhanced Attendance Upload Process ✅ Complete
          </p>
        </div>
      </div>

      {/* Invoice View Modal */}
      <InvoiceViewModal
        isOpen={showInvoiceModal}
        onClose={handleCloseInvoiceModal}
        invoice={selectedInvoice}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onExport={handleExportInvoice}
      />

      {/* PDF Export Date Modal */}
      {showPdfExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Export Invoice to PDF
            </h3>

            <div className="mb-4">
              <label
                htmlFor="issue-date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Issue Date
              </label>
              <input
                id="issue-date"
                type="date"
                value={pdfIssueDate}
                onChange={(e) => setPdfIssueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This date will appear as the issue date on the PDF invoice
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPdfExportModal(false);
                  setSelectedInvoiceForPdf(null);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePdfExportWithDate}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Exporting...
                  </div>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Export PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManagement;
