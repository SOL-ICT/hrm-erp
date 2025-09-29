"use client";

import { useState, useRef, useEffect } from "react";
import {
  Save,
  Eye,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Calendar,
  MapPin,
  Banknote,
  Calculator,
  Image,
  X,
  FileText,
} from "lucide-react";
import { offerLetterAPI } from "../../../../../../services/api";

const OfferLetterBuilder = ({
  currentTheme,
  selectedClient,
  selectedJobCategory,
  selectedPayGrade,
  onSave,
  onCancel,
  editingTemplate,
  isModal = false,
}) => {
  // Simplified template structure
  const [template, setTemplate] = useState(() => {
    const defaultTemplate = {
      id: null,
      name: `${selectedPayGrade?.grade_name || "New"} - Offer Letter Template`,
      client_id: selectedClient?.id,
      job_category_id: selectedJobCategory?.id,
      pay_grade_id: selectedPayGrade?.id,
      header: {
        logo: true,
        date: true,
      },
      content: editingTemplate?.content || `Date: {current_date}

{candidate_name}
{candidate_address}

Dear {candidate_name},

WELCOME TO SOL!

We are pleased to offer you the position of {job_title} with Strategic Outsourcing Limited (SOL). This offer is contingent upon your acceptance of the terms and conditions outlined in this letter.

Position Details:
- Job Title: {job_title}
- Start Date: {start_date}
- Reporting Location: {office_location}

Your compensation package includes:

{salary_components}

Your total monthly compensation will be ₦{net_salary}.

We look forward to welcoming you to our team.

Yours Sincerely,

For: Strategic Outsourcing Limited
Mrs Omolara Ajibola
Divisional Head, Human Resources Operations, Recruitment and Training`,
      footer: {
        candidate_signature: true,
        agent_declaration: true,
      },
      variables: [
        { key: "current_date", label: "Current Date", type: "date", value: "" },
        { key: "candidate_name", label: "Candidate Name", type: "text", value: "" },
        { key: "candidate_address", label: "Candidate Address", type: "textarea", value: "" },
        { key: "job_title", label: "Job Title", type: "text", value: "" },
        { key: "start_date", label: "Start Date", type: "date", value: "" },
        { key: "office_location", label: "Office Location", type: "text", value: "" },
        { key: "net_salary", label: "Net Salary", type: "currency", value: "0" },
      ]
    };

    return editingTemplate ? { ...editingTemplate, ...defaultTemplate } : defaultTemplate;
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gradeSalaryComponents, setGradeSalaryComponents] = useState([]);
  const [clientOffices, setClientOffices] = useState([]);
  const editorRef = useRef(null);

  // Load salary components from the selected pay grade
  useEffect(() => {
    if (selectedPayGrade?.id) {
      loadSalaryComponents();
    }
  }, [selectedPayGrade]);

  // Load client offices
  useEffect(() => {
    if (selectedClient?.id) {
      loadClientOffices();
    }
  }, [selectedClient]);

  const loadSalaryComponents = async () => {
    try {
      setIsLoading(true);
      const response = await offerLetterAPI.getSalaryComponents({
        pay_grade_id: selectedPayGrade.id,
      });

      if (response.success) {
        setGradeSalaryComponents(response.data);
      } else {
        // Fallback: extract from pay grade structure
        const components = [];
        const gradeData = selectedPayGrade;

        // Parse emoluments if it exists
        if (gradeData.emoluments) {
          const emoluments = typeof gradeData.emoluments === 'string' 
            ? JSON.parse(gradeData.emoluments) 
            : gradeData.emoluments;

          Object.entries(emoluments).forEach(([key, value]) => {
            if (value && value > 0) {
              components.push({
                component_name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                amount: value,
                variable_key: key,
              });
            }
          });
        }

        setGradeSalaryComponents(components);
      }
    } catch (error) {
      console.error("Error loading salary components:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClientOffices = async () => {
    try {
      // This would be replaced with actual API call
      const mockOffices = [
        { id: 1, name: "Head Office", address: "Victoria Island, Lagos", is_primary: true },
        { id: 2, name: "Abuja Branch", address: "Central Business District, Abuja" },
        { id: 3, name: "Port Harcourt Office", address: "GRA Phase II, Port Harcourt" },
      ];
      setClientOffices(mockOffices);
    } catch (error) {
      console.error("Error loading client offices:", error);
    }
  };
  // Text formatting functions
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertVariable = (variableKey, variableLabel) => {
    const editor = editorRef.current;
    if (editor) {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      
      // Create a styled variable placeholder
      const variableSpan = document.createElement('span');
      variableSpan.className = 'variable-placeholder';
      variableSpan.style.backgroundColor = '#e3f2fd';
      variableSpan.style.color = '#1976d2';
      variableSpan.style.padding = '2px 6px';
      variableSpan.style.borderRadius = '4px';
      variableSpan.style.fontWeight = 'bold';
      variableSpan.textContent = `{${variableKey}}`;
      variableSpan.setAttribute('data-variable', variableKey);
      
      range.deleteContents();
      range.insertNode(variableSpan);
      
      // Move cursor after the variable
      range.setStartAfter(variableSpan);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      
      updateTemplateContent();
    }
  };

  const insertSalaryComponents = () => {
    if (gradeSalaryComponents.length === 0) {
      alert('No salary components found for this pay grade. Please configure the pay grade first.');
      return;
    }

    let tableHTML = `
<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr style="background-color: #f5f5f5;">
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Component</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Amount (₦)</th>
    </tr>
  </thead>
  <tbody>`;

    gradeSalaryComponents.forEach(component => {
      tableHTML += `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${component.component_name}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">{${component.variable_key}}</td>
    </tr>`;
      
      // Add variable if it doesn't exist
      if (!template.variables.find(v => v.key === component.variable_key)) {
        setTemplate(prev => ({
          ...prev,
          variables: [...prev.variables, {
            key: component.variable_key,
            label: component.component_name,
            type: 'currency',
            value: component.amount.toString()
          }]
        }));
      }
    });

    tableHTML += `
  </tbody>
</table>`;

    insertHTML(tableHTML);
  };

  const insertOfficeLocation = () => {
    if (clientOffices.length === 0) {
      alert('No office locations found for this client.');
      return;
    }

    const officeOptions = clientOffices.map(office => 
      `${office.name} - ${office.address}`
    ).join(', ');

    const locationText = `Your reporting location will be {office_location}. The available locations are: ${officeOptions}`;
    
    insertHTML(locationText);

    // Add office location variable if it doesn't exist
    if (!template.variables.find(v => v.key === 'office_location')) {
      setTemplate(prev => ({
        ...prev,
        variables: [...prev.variables, {
          key: 'office_location',
          label: 'Office Location',
          type: 'select',
          options: clientOffices.map(office => ({ 
            value: office.name, 
            label: `${office.name} - ${office.address}` 
          })),
          value: clientOffices.find(office => office.is_primary)?.name || clientOffices[0]?.name || ''
        }]
      }));
    }
  };

  const insertNetSalary = () => {
    const totalAmount = gradeSalaryComponents.reduce((sum, component) => sum + component.amount, 0);
    
    const netSalaryText = `Your total monthly compensation will be ₦{net_salary}.`;
    insertHTML(netSalaryText);

    // Update net salary variable
    setTemplate(prev => ({
      ...prev,
      variables: prev.variables.map(variable => 
        variable.key === 'net_salary' 
          ? { ...variable, value: totalAmount.toString() }
          : variable
      )
    }));
  };

  const insertHTML = (html) => {
    const editor = editorRef.current;
    if (editor) {
      editor.focus();
      document.execCommand('insertHTML', false, html);
      updateTemplateContent();
    }
  };

  const updateTemplateContent = () => {
    if (editorRef.current) {
      setTemplate(prev => ({
        ...prev,
        content: editorRef.current.innerHTML
      }));
    }
  };

  const handleContentChange = () => {
    updateTemplateContent();
  };

  const generatePreview = () => {
    let previewContent = template.content;
    
    // Replace variables with their values or placeholders
    template.variables.forEach(variable => {
      const placeholder = `{${variable.key}}`;
      const value = variable.value || `[${variable.label}]`;
      previewContent = previewContent.replace(new RegExp(placeholder, 'g'), value);
    });

    return previewContent;
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      if (!template.name.trim()) {
        alert('Please enter a template name.');
        return;
      }

      const templateData = {
        ...template,
        content: editorRef.current?.innerHTML || template.content,
      };

      let response;
      if (template.id) {
        response = await offerLetterAPI.updateTemplate(template.id, templateData);
      } else {
        response = await offerLetterAPI.createTemplate(templateData);
      }

      if (response.success) {
        onSave(response.data);
      } else {
        alert('Error saving template: ' + response.message);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
        { key: "basic_salary", label: "Basic Salary", type: "naira" },
        { key: "housing_allowance", label: "Housing Allowance", type: "naira" },
        {
          key: "transport_allowance",
          label: "Transport Allowance",
          type: "naira",
        },
        { key: "utility_allowance", label: "Utility Allowance", type: "naira" },
        {
          key: "dressing_allowance",
          label: "Dressing Allowance",
          type: "naira",
        },
        {
          key: "entertainment_allowance",
          label: "Entertainment Allowance",
          type: "naira",
        },
        { key: "thirteenth_month", label: "13th Month", type: "naira" },
        { key: "leave_allowance", label: "Leave Allowance", type: "naira" },
      ],
      gross_salary: [
        {
          key: "gross_monthly_salary",
          label: "Gross Monthly Salary",
          type: "naira",
        },
      ],
      net_salary: [
        {
          key: "net_monthly_salary",
          label: "Net Monthly Salary",
          type: "naira",
        },
      ],
    };

    return variableGroups[elementType] || [];
  };

  // Remove section
  const removeSection = (sectionId) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== sectionId),
    }));
  };

  // Update section
  const updateSection = (sectionId, updates) => {
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    }));
  };

  // Move section up/down
  const moveSection = (sectionId, direction) => {
    setTemplate((prev) => {
      const sections = [...prev.sections];
      const index = sections.findIndex((s) => s.id === sectionId);

      if (direction === "up" && index > 0) {
        [sections[index], sections[index - 1]] = [
          sections[index - 1],
          sections[index],
        ];
      } else if (direction === "down" && index < sections.length - 1) {
        [sections[index], sections[index + 1]] = [
          sections[index + 1],
          sections[index],
        ];
      }

      return { ...prev, sections };
    });
  };

  // Format text
  const toggleFormat = (sectionId, formatType) => {
    const section = template.sections?.find((s) => s.id === sectionId);
    if (!section) return;

    updateSection(sectionId, {
      formatting: {
        ...section.formatting,
        [formatType]: !section.formatting[formatType],
      },
    });
  };

  // Insert variable into content
  const insertVariable = (sectionId, variable) => {
    const section = template.sections?.find((s) => s.id === sectionId);
    if (!section) return;

    updateSection(sectionId, {
      content: section.content + `{${variable.key}}`,
    });
  };

  return (
    <div
      className={`bg-white ${
        isModal ? "h-full flex flex-col overflow-hidden" : "min-h-screen"
      }`}
    >
      {/* Header */}
      <div
        className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white flex-shrink-0 ${
          isModal ? "p-4" : "p-6"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className={`${isModal ? "text-lg" : "text-2xl"} font-bold mb-2`}
            >
              {editingTemplate?.id
                ? "Edit Offer Letter Template"
                : "Create Offer Letter Template"}
            </h1>
            <div
              className={`flex items-center space-x-4 text-purple-100 ${
                isModal ? "text-xs" : "text-sm"
              }`}
            >
              <div className="flex items-center space-x-1">
                <Building2 className="w-4 h-4" />
                <span>{selectedClient?.organisation_name}</span>
              </div>
              <span>→</span>
              <div className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>{selectedJobCategory?.job_title}</span>
              </div>
              <span>→</span>
              <div className="flex items-center space-x-1">
                <FileCheck className="w-4 h-4" />
                <span>{selectedPayGrade?.pay_grade}</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowVariables(!showVariables)}
              className={`${
                isModal ? "px-3 py-1.5 text-sm" : "px-4 py-2"
              } bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2`}
            >
              <Square className="w-4 h-4" />
              <span>Variables</span>
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`${
                isModal ? "px-3 py-1.5 text-sm" : "px-4 py-2"
              } bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2`}
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => onSave(template)}
              className={`${
                isModal ? "px-3 py-1.5 text-sm" : "px-4 py-2"
              } bg-green-500 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2`}
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            {isModal && (
              <button
                onClick={onCancel}
                className="px-3 py-1.5 text-sm bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`flex flex-1 ${isModal ? "min-h-0" : "h-screen"}`}>
        {/* Builder Panel */}
        <div
          className={`${showPreview ? "w-1/2" : "w-full"} ${
            isModal ? "p-4" : "p-6"
          } overflow-y-auto border-r`}
        >
          {/* Template Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={template.name}
              onChange={(e) =>
                setTemplate((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Header Configuration */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Header Settings
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(template.header || {}).map(([key, value]) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setTemplate((prev) => ({
                        ...prev,
                        header: { ...prev.header, [key]: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm capitalize">
                    {key.replace("_", " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Add Section Buttons */}
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <Plus className="w-4 h-4 mr-2 text-green-600" />
              Add New Section
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {sectionTypes.map((sectionType) => (
                <button
                  key={sectionType.type}
                  onClick={() => addSection(sectionType)}
                  className="p-3 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors flex flex-col items-center space-y-1 group"
                >
                  <sectionType.icon className="w-5 h-5 text-green-500 group-hover:text-green-600" />
                  <span className="text-xs text-green-600 group-hover:text-green-700">
                    {sectionType.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Click to add a new section. Sections will appear in your template.
            </div>
          </div>

          {/* Add Elements (for sections) */}
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 mb-3">
              Add Elements to Active Section
            </h3>
            {activeSection ? (
              <div className="grid grid-cols-3 gap-2">
                {elementTypes.map((elementType) => (
                  <button
                    key={elementType.type}
                    onClick={() =>
                      addElementToSection(activeSection, elementType)
                    }
                    className="p-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center space-y-1"
                  >
                    <elementType.icon className="w-5 h-5 text-blue-500" />
                    <span className="text-xs text-blue-600">
                      {elementType.label}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                Select a section first to add elements like tables, lists, etc.
              </div>
            )}
          </div>

          {/* Smart Elements */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <Palette className="w-4 h-4 mr-2 text-blue-600" />
              Smart Elements
              <span className="ml-2 text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded-full">
                Auto-populated from system data
              </span>
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              These elements automatically pull data from your job category and
              grading system configurations
            </p>
            <div className="grid grid-cols-2 gap-3">
              {smartElements.map((smartElement) => (
                <button
                  key={smartElement.type}
                  onClick={() => addSmartElement(smartElement)}
                  className="p-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-start space-x-3 text-left"
                >
                  <smartElement.icon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 block">
                      {smartElement.label}
                    </span>
                    <span className="text-xs text-gray-600">
                      {smartElement.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {(template.sections || []).map((section, index) => (
              <SectionEditor
                key={section.id}
                section={section}
                index={index}
                isActive={activeSection === section.id}
                onActivate={() => setActiveSection(section.id)}
                onUpdate={(updates) => updateSection(section.id, updates)}
                onRemove={() => removeSection(section.id)}
                onMove={(direction) => moveSection(section.id, direction)}
                onToggleFormat={(formatType) =>
                  toggleFormat(section.id, formatType)
                }
                variables={template.variables || []}
                onInsertVariable={(variable) =>
                  insertVariable(section.id, variable)
                }
                totalSections={(template.sections || []).length}
              />
            ))}
          </div>

          {/* Footer Configuration */}
          <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Footer Settings
              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                Choose what appears at the bottom of your offer letter
              </span>
            </h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-3">
                Select which sections to include in your offer letter footer:
              </div>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(template.footer || {}).map(([key, value]) => {
                  const descriptions = {
                    signature_section:
                      "Adds signature lines for HR Manager and Employee",
                    acknowledgment_section:
                      "Includes acknowledgment text about reading terms",
                    acceptance_section:
                      "Adds acceptance checkbox and employee signature area",
                  };

                  return (
                    <label
                      key={key}
                      className="flex items-start space-x-3 p-3 bg-white rounded-lg border"
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) =>
                          setTemplate((prev) => ({
                            ...prev,
                            footer: { ...prev.footer, [key]: e.target.checked },
                          }))
                        }
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm capitalize text-gray-900">
                          {key.replace("_", " ")}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {descriptions[key]}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Variables Panel */}
        {showVariables && (
          <div
            className={`${
              isModal ? "w-72" : "w-80"
            } p-4 bg-gray-50 border-l overflow-y-auto`}
          >
            <h3 className="font-medium text-gray-900 mb-4 flex items-center">
              <Square className="w-4 h-4 mr-2" />
              Template Variables
            </h3>
            <div className="space-y-3">
              {(template.variables || []).map((variable) => (
                <div key={variable.key} className="bg-white rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {variable.label}
                    </span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {`{${variable.key}}`}
                    </code>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    Type: {variable.type}
                  </div>
                  <button
                    onClick={() => {
                      if (activeSection) {
                        insertVariable(activeSection, variable);
                      }
                    }}
                    disabled={!activeSection}
                    className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
                  >
                    Insert
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview Panel */}
        {showPreview && (
          <div
            className={`w-1/2 ${
              isModal ? "p-4" : "p-6"
            } bg-gray-100 overflow-y-auto`}
          >
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
              {/* Header */}
              {template.header?.logo && (
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-purple-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Strategic Outsourcing Limited
                  </h2>
                </div>
              )}

              {template.header?.date && (
                <div className="text-right mb-4">
                  <p className="text-gray-600">
                    Date: {new Date().toLocaleDateString()}
                  </p>
                </div>
              )}

              {template.header?.company_info && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    Victoria Island, Lagos, Nigeria
                    <br />
                    Phone: +234 xxx xxx xxxx
                    <br />
                    Email: hr@strategicoutsourcing.com.ng
                  </p>
                </div>
              )}

              {/* Sections */}
              {(template.sections || []).map((section) => (
                <div key={section.id} className="mb-6">
                  <div
                    className={`
                      ${section.formatting?.bold ? "font-bold" : ""}
                      ${section.formatting?.italic ? "italic" : ""}
                      ${section.formatting?.underline ? "underline" : ""}
                      text-${section.formatting?.align || "left"}
                    `}
                  >
                    {section.type === "title" && (
                      <h1 className="text-2xl font-bold mb-4 text-center">
                        {section.content}
                      </h1>
                    )}
                    {section.type === "greeting" && (
                      <p className="mb-4">{section.content}</p>
                    )}
                    {section.type === "paragraph" && (
                      <div className="mb-4">
                        <h3 className="font-semibold mb-2">{section.title}</h3>
                        <p className="text-justify leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    )}
                    {section.type === "subsection" && (
                      <div className="mb-4 ml-4">
                        <h4 className="font-medium mb-2">{section.title}</h4>
                        <p>{section.content}</p>
                      </div>
                    )}
                  </div>

                  {/* Render elements within section */}
                  {section.elements &&
                    section.elements.map((element) => (
                      <div key={element.id} className="ml-4 mb-3">
                        {element.type === "list" && (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: element.content
                                .split("\n")
                                .map((item) => `<p>${item}</p>`)
                                .join(""),
                            }}
                          />
                        )}
                        {element.type === "numbered" && (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: element.content
                                .split("\n")
                                .map((item) => `<p>${item}</p>`)
                                .join(""),
                            }}
                          />
                        )}
                        {element.type === "table" &&
                          element.content.headers && (
                            <table className="w-full border-collapse border border-gray-300 mb-4">
                              <thead>
                                <tr className="bg-gray-100">
                                  {element.content.headers.map((header, i) => (
                                    <th
                                      key={i}
                                      className="border border-gray-300 px-4 py-2 text-left"
                                    >
                                      {header}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {element.content.rows.map((row, i) => (
                                  <tr key={i}>
                                    {row.map((cell, j) => (
                                      <td
                                        key={j}
                                        className="border border-gray-300 px-4 py-2"
                                      >
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                      </div>
                    ))}
                </div>
              ))}

              {/* Footer */}
              {template.footer?.signature_section && (
                <div className="mt-12 pt-6 border-t border-gray-300">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="font-semibold">For the Company:</p>
                      <div className="mt-8">
                        <div className="border-b border-gray-400 w-48 mb-2"></div>
                        <p className="text-sm">HR Manager</p>
                        <p className="text-sm">Strategic Outsourcing Limited</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">Employee:</p>
                      <div className="mt-8">
                        <div className="border-b border-gray-400 w-48 mb-2"></div>
                        <p className="text-sm">{"{candidate_name}"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {template.footer?.acceptance_section && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    By signing below, I acknowledge that I have read,
                    understood, and agree to the terms and conditions of this
                    employment offer.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Smart Element Configuration Modal */}
      {showSmartElementConfig && selectedSmartElement && (
        <SmartElementConfigModal
          smartElement={selectedSmartElement}
          clientOffices={clientOffices}
          selectedClient={selectedClient}
          selectedPayGrade={selectedPayGrade}
          onSave={addConfiguredSmartElement}
          onCancel={() => {
            setShowSmartElementConfig(false);
            setSelectedSmartElement(null);
          }}
        />
      )}
    </div>
  );
};

// Section Editor Component
const SectionEditor = ({
  section,
  index,
  isActive,
  onActivate,
  onUpdate,
  onRemove,
  onMove,
  onToggleFormat,
  variables,
  onInsertVariable,
  totalSections,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(!section.collapsible);

  return (
    <div
      className={`border rounded-lg ${
        isActive ? "border-purple-500 shadow-lg" : "border-gray-200"
      } ${section.smart_element ? "border-blue-300 bg-blue-50/30" : ""}`}
    >
      {/* Section Header */}
      <div
        className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
        onClick={onActivate}
      >
        <div className="flex items-center space-x-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-sm">{section.title}</span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
            {section.type}
          </span>
          {section.smart_element && (
            <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded flex items-center">
              <Palette className="w-3 h-3 mr-1" />
              Smart
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove("up");
            }}
            disabled={index === 0}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove("down");
            }}
            disabled={index === totalSections - 1}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 hover:bg-red-100 text-red-600 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="p-4">
          {/* Title Input */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Section Title
            </label>
            <input
              type="text"
              value={section.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-50 rounded">
            <button
              onClick={() => onToggleFormat("bold")}
              className={`p-1 rounded ${
                section.formatting.bold
                  ? "bg-purple-100 text-purple-700"
                  : "hover:bg-gray-200"
              }`}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleFormat("italic")}
              className={`p-1 rounded ${
                section.formatting.italic
                  ? "bg-purple-100 text-purple-700"
                  : "hover:bg-gray-200"
              }`}
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleFormat("underline")}
              className={`p-1 rounded ${
                section.formatting.underline
                  ? "bg-purple-100 text-purple-700"
                  : "hover:bg-gray-200"
              }`}
            >
              <Underline className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-300 mx-2" />
            <button
              onClick={() =>
                onUpdate({
                  formatting: { ...section.formatting, align: "left" },
                })
              }
              className={`p-1 rounded ${
                section.formatting.align === "left"
                  ? "bg-purple-100 text-purple-700"
                  : "hover:bg-gray-200"
              }`}
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                onUpdate({
                  formatting: { ...section.formatting, align: "center" },
                })
              }
              className={`p-1 rounded ${
                section.formatting.align === "center"
                  ? "bg-purple-100 text-purple-700"
                  : "hover:bg-gray-200"
              }`}
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                onUpdate({
                  formatting: { ...section.formatting, align: "right" },
                })
              }
              className={`p-1 rounded ${
                section.formatting.align === "right"
                  ? "bg-purple-100 text-purple-700"
                  : "hover:bg-gray-200"
              }`}
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          {/* Content Editor */}
          {section.type === "table" ? (
            <TableEditor
              content={section.content}
              onChange={(content) => onUpdate({ content })}
            />
          ) : (
            <textarea
              value={typeof section.content === "string" ? section.content : ""}
              onChange={(e) => onUpdate({ content: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent resize-y"
              style={{
                fontWeight: section.formatting.bold ? "bold" : "normal",
                fontStyle: section.formatting.italic ? "italic" : "normal",
                textDecoration: section.formatting.underline
                  ? "underline"
                  : "none",
                textAlign: section.formatting.align,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Table Editor Component
const TableEditor = ({ content, onChange }) => {
  const [tableData, setTableData] = useState(
    typeof content === "object"
      ? content
      : { headers: ["Column 1"], rows: [["Data 1"]] }
  );

  useEffect(() => {
    onChange(tableData);
  }, [tableData]);

  const addColumn = () => {
    setTableData((prev) => ({
      headers: [...prev.headers, `Column ${prev.headers.length + 1}`],
      rows: prev.rows.map((row) => [...row, ""]),
    }));
  };

  const addRow = () => {
    setTableData((prev) => ({
      ...prev,
      rows: [...prev.rows, new Array(prev.headers.length).fill("")],
    }));
  };

  const updateHeader = (index, value) => {
    setTableData((prev) => ({
      ...prev,
      headers: prev.headers.map((header, i) => (i === index ? value : header)),
    }));
  };

  const updateCell = (rowIndex, cellIndex, value) => {
    setTableData((prev) => ({
      ...prev,
      rows: prev.rows.map((row, i) =>
        i === rowIndex
          ? row.map((cell, j) => (j === cellIndex ? value : cell))
          : row
      ),
    }));
  };

  return (
    <div className="border rounded">
      <table className="w-full">
        <thead>
          <tr>
            {tableData.headers.map((header, index) => (
              <th key={index} className="border p-2">
                <input
                  type="text"
                  value={header}
                  onChange={(e) => updateHeader(index, e.target.value)}
                  className="w-full text-sm font-medium"
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border p-2">
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) =>
                      updateCell(rowIndex, cellIndex, e.target.value)
                    }
                    className="w-full text-sm"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-2 bg-gray-50 flex space-x-2">
        <button
          onClick={addColumn}
          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Add Column
        </button>
        <button
          onClick={addRow}
          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
        >
          Add Row
        </button>
      </div>
    </div>
  );
};

// Offer Letter Preview Component
const OfferLetterPreview = ({ template }) => {
  const renderVariable = (text) => {
    if (typeof text !== "string") return text;

    // Sample data for preview with Nigerian Naira formatting
    const sampleData = {
      candidate_name: "Ibrahim Damilola Odusanya",
      candidate_address: "Nafrc charity bus stop oshodi Lagos",
      job_title: "Sales Executive",
      start_date: "2025-02-07",
      company_name: "Strategic Outsourcing Limited",
      basic_salary: "35,973.61",
      housing_allowance: "27,480.21",
      transport_allowance: "17,986.80",
      utility_allowance: "32,226.91",
      dressing_allowance: "20,480.21",
      entertainment_allowance: "20,480.21",
      thirteenth_month: "5,000.00",
      leave_allowance: "5,000.00",
      gross_monthly_salary: "164,627.95",
      net_monthly_salary: "120,614.96",
      office_location: "Victoria Island",
      office_address: "Plot 1234, Victoria Island, Lagos",
    };

    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return sampleData[key] || `[${key.replace(/_/g, " ").toUpperCase()}]`;
    });
  };

  const renderSection = (section) => {
    const style = {
      fontWeight: section.formatting.bold ? "bold" : "normal",
      fontStyle: section.formatting.italic ? "italic" : "normal",
      textDecoration: section.formatting.underline ? "underline" : "none",
      textAlign: section.formatting.align,
    };

    if (section.type === "table" && typeof section.content === "object") {
      return (
        <table className="w-full border-collapse border border-gray-300 my-4">
          <thead>
            <tr>
              {section.content.headers.map((header, index) => (
                <th
                  key={index}
                  className="border border-gray-300 p-2 bg-gray-50"
                >
                  {renderVariable(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.content.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border border-gray-300 p-2">
                    {renderVariable(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (section.type === "list") {
      return (
        <div style={style} className="my-4">
          {section.content.split("\n").map((item, index) => (
            <div key={index} className="ml-4">
              {renderVariable(item)}
            </div>
          ))}
        </div>
      );
    }

    if (section.type === "numbered") {
      return (
        <ol style={style} className="my-4 ml-4">
          {section.content.split("\n").map((item, index) => (
            <li key={index} className="mb-1">
              {renderVariable(item.replace(/^\d+\.\s*/, ""))}
            </li>
          ))}
        </ol>
      );
    }

    return (
      <div style={style} className="my-4 whitespace-pre-wrap">
        {renderVariable(section.content)}
      </div>
    );
  };

  return (
    <div className="bg-white p-8 shadow-lg max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview</h2>
        <div className="text-sm text-gray-600">{template.name}</div>
      </div>

      {/* Header */}
      {template.header.logo && (
        <div className="text-center mb-4">
          <div className="w-20 h-20 bg-gray-200 rounded mx-auto flex items-center justify-center">
            [LOGO]
          </div>
        </div>
      )}

      {template.header.date && (
        <div className="text-right mb-4">Date: [Current Date]</div>
      )}

      {template.header.company_info && (
        <div className="mb-6">
          <div>[Candidate Name]</div>
          <div>[Candidate Address]</div>
        </div>
      )}

      {/* Sections */}
      {(template.sections || []).map((section) => (
        <div key={section.id}>{renderSection(section)}</div>
      ))}

      {/* Footer */}
      {template.footer?.signature_section && (
        <div className="mt-8 pt-4">
          <p>Yours Sincerely,</p>
          <p className="mt-4">For: [Company Name]</p>
          <div className="mt-8">
            <div>_________________________</div>
            <div>[Signatory Name]</div>
            <div>[Signatory Title]</div>
          </div>
        </div>
      )}

      {template.footer?.acknowledgment_section && (
        <div className="mt-8 p-4 bg-gray-50 rounded">
          <h4 className="font-bold mb-2">ACKNOWLEDGEMENT</h4>
          <p className="text-sm">
            I acknowledge that if I do not sign and return the acknowledged copy
            within one (1) month but continue to work after receiving the first
            month's payment...
          </p>
        </div>
      )}

      {template.footer?.acceptance_section && (
        <div className="mt-6">
          <h4 className="font-bold mb-4">Acceptance of Offer</h4>
          <p className="mb-4">
            I, _________________________________, having read and understood the
            terms and conditions of this offer letter accept the terms and
            conditions of employment.
          </p>
          <div className="flex space-x-8">
            <div>Date: ___________________</div>
            <div>Signature: ___________________</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Smart Element Configuration Modal Component
const SmartElementConfigModal = ({
  smartElement,
  clientOffices,
  selectedClient,
  selectedPayGrade,
  onSave,
  onCancel,
}) => {
  const [config, setConfig] = useState({});

  const handleSave = () => {
    onSave(config);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium flex items-center">
            <smartElement.icon className="w-5 h-5 mr-2 text-blue-600" />
            Configure {smartElement.label}
          </h3>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded">
            ✕
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            {smartElement.description}
          </p>

          {smartElement.type === "office_location" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Office Location
              </label>
              <select
                value={config.office_id || ""}
                onChange={(e) =>
                  setConfig({ ...config, office_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose an office...</option>
                {clientOffices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.name} - {office.address}
                    {office.is_primary && " (Primary)"}
                  </option>
                ))}
              </select>

              {config.office_id && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Preview:</strong>
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    You will be deployed to{" "}
                    <strong>
                      {
                        clientOffices.find(
                          (o) => o.id === parseInt(config.office_id)
                        )?.name
                      }
                    </strong>{" "}
                    located at{" "}
                    <strong>
                      {
                        clientOffices.find(
                          (o) => o.id === parseInt(config.office_id)
                        )?.address
                      }
                    </strong>
                    .
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Available Variables:
                </h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>
                    <code>{"{office_location}"}</code> - Office name
                  </div>
                  <div>
                    <code>{"{office_address}"}</code> - Office address
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2 p-4 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              smartElement.type === "office_location" && !config.office_id
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Element
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferLetterBuilder;
