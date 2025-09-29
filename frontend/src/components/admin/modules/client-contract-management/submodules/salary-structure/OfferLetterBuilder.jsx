"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { salaryStructureAPI } from '../../../../../../services/modules/client-contract-management/salary-structure';
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
  Table,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Type,
  Palette,
  MoreHorizontal,
  Hash,
  Quote,
  Minus,
  Plus,
  Download,
  Upload,
  Settings,
  Building2,
} from "lucide-react";

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
  console.log("🔍 OfferLetterBuilder Props:", {
    selectedClient: selectedClient?.id,
    selectedJobCategory: selectedJobCategory?.id, 
    selectedPayGrade: selectedPayGrade?.id,
    editingTemplate
  });
  
  // Import the API service instead of using AuthContext
  const [template, setTemplate] = useState(() => {
    const defaultTemplate = {
      id: null,
      name: `${selectedPayGrade?.grade_name || "New"} - Offer Letter Template`,
      client_id: selectedClient?.id,
      job_structure_id: selectedJobCategory?.id,
      pay_grade_structure_id: selectedPayGrade?.id,
      header: {
        logo: true,
        date: true,
        company_address: true,
        letterhead_style: "formal",
      },
      content: editingTemplate?.content || `
<div style="font-family: 'Times New Roman', serif; line-height: 1.6; color: #000;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2c3e50; font-size: 24px; margin: 0;">STRATEGIC OUTSOURCING LIMITED</h1>
    <p style="margin: 5px 0; font-size: 14px;">RC: 123456 | Tax ID: 12345678-001</p>
    <p style="margin: 5px 0; font-size: 14px;">Plot 123, Victoria Island, Lagos | Tel: +234-1-234-5678</p>
    <hr style="border: 1px solid #2c3e50; margin: 20px 0;">
  </div>

  <div style="margin-bottom: 20px;">
    <p><strong>Date:</strong> {current_date}</p>
  </div>

  <div style="margin-bottom: 20px;">
    <p>{candidate_name}<br>
    {candidate_address}</p>
  </div>

  <p><strong>Dear {candidate_name},</strong></p>

  <h2 style="color: #2c3e50; font-size: 18px; margin: 20px 0 10px 0;">LETTER OF EMPLOYMENT OFFER</h2>

  <p>Following your successful interview process, we are pleased to offer you employment with <strong>Strategic Outsourcing Limited (SOL)</strong> in the position of <strong>{job_title}</strong>.</p>

  <h3 style="color: #2c3e50; font-size: 16px; margin: 20px 0 10px 0;">EMPLOYMENT DETAILS</h3>
  <ul style="margin-left: 20px;">
    <li><strong>Position:</strong> {job_title}</li>
    <li><strong>Department:</strong> {department}</li>
    <li><strong>Start Date:</strong> {start_date}</li>
    <li><strong>Reporting Location:</strong> {office_location}</li>
    <li><strong>Reporting To:</strong> {supervisor_name}</li>
    <li><strong>Employment Type:</strong> Full-time</li>
  </ul>

  <h3 style="color: #2c3e50; font-size: 16px; margin: 20px 0 10px 0;">COMPENSATION PACKAGE</h3>
  <p>Your monthly compensation package comprises the following:</p>

  {salary_components}

  <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #2c3e50;">
    <p><strong>Total Monthly Compensation: ₦{net_salary}</strong></p>
  </div>

  <h3 style="color: #2c3e50; font-size: 16px; margin: 20px 0 10px 0;">TERMS AND CONDITIONS</h3>
  <ol style="margin-left: 20px;">
    <li>This offer is subject to satisfactory background and reference checks.</li>
    <li>You will be required to sign our standard employment contract and confidentiality agreement.</li>
    <li>Your employment will be subject to a probationary period of 6 months.</li>
    <li>You are entitled to 21 working days annual leave after 12 months of service.</li>
    <li>Medical coverage will be provided through our group health insurance plan.</li>
  </ol>

  <p style="margin-top: 30px;">Please confirm your acceptance of this offer by signing and returning this letter by <strong>{response_deadline}</strong>. We look forward to welcoming you to our team.</p>

  <div style="margin-top: 50px;">
    <p>Yours sincerely,</p>
    <div style="margin: 40px 0;">
      <p><strong>Mrs. Omolara Ajibola</strong><br>
      Divisional Head, Human Resources<br>
      Strategic Outsourcing Limited</p>
    </div>
  </div>

  <hr style="border: 1px solid #ddd; margin: 40px 0;">

  <div style="margin-top: 30px;">
    <h3 style="color: #2c3e50; font-size: 16px;">CANDIDATE ACCEPTANCE</h3>
    <p>I, <strong>{candidate_name}</strong>, accept the terms and conditions of employment as outlined in this letter.</p>
    
    <div style="display: flex; justify-content: space-between; margin-top: 40px;">
      <div>
        <p>Signature: _____________________</p>
      </div>
      <div>
        <p>Date: _____________________</p>
      </div>
    </div>
  </div>
</div>`,
      footer: {
        candidate_signature: true,
        agent_declaration: true,
        company_seal: true,
        page_numbering: true,
      },
      variables: [
        { key: "current_date", label: "Current Date", type: "date", value: "" },
        { key: "candidate_name", label: "Candidate Name", type: "text", value: "" },
        { key: "candidate_address", label: "Candidate Address", type: "textarea", value: "" },
        { key: "job_title", label: "Job Title", type: "text", value: "" },
        { key: "department", label: "Department", type: "text", value: "" },
        { key: "start_date", label: "Start Date", type: "date", value: "" },
        { key: "office_location", label: "Office Location", type: "select", value: "" },
        { key: "supervisor_name", label: "Supervisor Name", type: "text", value: "" },
        { key: "response_deadline", label: "Response Deadline", type: "date", value: "" },
        { key: "net_salary", label: "Net Salary", type: "currency", value: "0" },
      ],
      styles: {
        fontFamily: "'Times New Roman', serif",
        fontSize: "12pt",
        lineHeight: "1.6",
        marginTop: "1in",
        marginBottom: "1in",
        marginLeft: "1in",
        marginRight: "1in",
      }
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

  // Update template when editingTemplate changes (for edit mode)
  useEffect(() => {
    if (editingTemplate) {
      console.log("🔄 Setting template for editing:", editingTemplate);
      
      // Normalize the backend structure to frontend structure
      const normalizedTemplate = {
        ...editingTemplate,
        // Map backend fields to frontend expected structure
        header: editingTemplate.header_config || editingTemplate.header || {
          logo: true,
          date: true,
          company_address: true,
          letterhead_style: "formal",
        },
        footer: editingTemplate.footer_config || editingTemplate.footer || {
          candidate_signature: true,
          agent_declaration: true,
        },
        // Ensure other fields are properly mapped
        sections: editingTemplate.sections || [],
        variables: editingTemplate.variables || [],
      };
      
      setTemplate(normalizedTemplate);
    }
  }, [editingTemplate]);

  // Load client offices
  useEffect(() => {
    if (selectedClient?.id) {
      loadClientOffices();
    }
  }, [selectedClient]);

  const loadSalaryComponents = async () => {
    try {
      setIsLoading(true);
      
      // Use salary structure API service  
      const response = await salaryStructureAPI.offerLetters.getSalaryComponents({
        pay_grade_id: selectedPayGrade.id
      });

      if (response.success) {
        setGradeSalaryComponents(response.data);
      } else {
        console.log("API response failed, using fallback data extraction");
        // Fallback: extract from pay grade structure
        const components = [];
        const gradeData = selectedPayGrade;

        // Parse emoluments if it exists
        if (gradeData.emoluments) {
          let emoluments;
          try {
            emoluments = typeof gradeData.emoluments === 'string' 
              ? JSON.parse(gradeData.emoluments) 
              : gradeData.emoluments;
          } catch (e) {
            console.warn("Could not parse emoluments JSON:", e);
            emoluments = {};
          }

          Object.entries(emoluments).forEach(([key, value]) => {
            if (value && value > 0) {
              components.push({
                component_name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                amount: parseFloat(value),
                variable_key: key,
              });
            }
          });
        } else {
          // If no emoluments, create basic salary structure from grade data
          const basicFields = [
            { key: 'basic_salary', label: 'Basic Salary', value: gradeData.basic_salary || 0 },
            { key: 'housing_allowance', label: 'Housing Allowance', value: gradeData.housing_allowance || 0 },
            { key: 'transport_allowance', label: 'Transport Allowance', value: gradeData.transport_allowance || 0 },
            { key: 'medical_allowance', label: 'Medical Allowance', value: gradeData.medical_allowance || 0 },
            { key: 'utility_allowance', label: 'Utility Allowance', value: gradeData.utility_allowance || 0 },
            { key: 'performance_bonus', label: 'Performance Bonus', value: gradeData.performance_bonus || 0 },
          ];

          basicFields.forEach(field => {
            if (field.value && field.value > 0) {
              components.push({
                component_name: field.label,
                amount: parseFloat(field.value),
                variable_key: field.key,
              });
            }
          });
        }

        // If still no components, add sample data for demonstration
        if (components.length === 0) {
          components.push(
            { component_name: 'Basic Salary', amount: 200000, variable_key: 'basic_salary' },
            { component_name: 'Housing Allowance', amount: 100000, variable_key: 'housing_allowance' },
            { component_name: 'Transport Allowance', amount: 50000, variable_key: 'transport_allowance' },
          );
        }

        setGradeSalaryComponents(components);
      }
    } catch (error) {
      console.error("Error loading salary components:", error);
      
      // Ultimate fallback with sample data
      setGradeSalaryComponents([
        { component_name: 'Basic Salary', amount: 200000, variable_key: 'basic_salary' },
        { component_name: 'Housing Allowance', amount: 100000, variable_key: 'housing_allowance' },
        { component_name: 'Transport Allowance', amount: 50000, variable_key: 'transport_allowance' },
        { component_name: 'Medical Allowance', amount: 25000, variable_key: 'medical_allowance' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClientOffices = async () => {
    try {
      // For now, use mock data since we don't have a specific client offices API
      // TODO: Replace with actual API call when available
      const mockOffices = [
        { 
          id: 1, 
          name: "Head Office", 
          address: "Plot 123, Victoria Island, Lagos State", 
          is_primary: true,
          phone: "+234-1-234-5678",
          email: "headoffice@sol-ict.com"
        },
        { 
          id: 2, 
          name: "Abuja Branch", 
          address: "Suite 45, Central Business District, Abuja",
          phone: "+234-9-876-5432",
          email: "abuja@sol-ict.com"
        },
        { 
          id: 3, 
          name: "Port Harcourt Office", 
          address: "15 GRA Phase II, Port Harcourt, Rivers State",
          phone: "+234-84-123-456",
          email: "portharcourt@sol-ict.com"
        },
        { 
          id: 4, 
          name: "Kano Office", 
          address: "Plot 78, Nassarawa GRA, Kano State",
          phone: "+234-64-789-123",
          email: "kano@sol-ict.com"
        },
      ];

      // Filter by client if needed (future enhancement)
      const clientOffices = mockOffices.filter(office => 
        selectedClient ? true : office.is_primary // For now, show all offices
      );

      setClientOffices(clientOffices);
    } catch (error) {
      console.error("Error loading client offices:", error);
      // Fallback to at least one office
      setClientOffices([
        { 
          id: 1, 
          name: "Head Office", 
          address: "Victoria Island, Lagos", 
          is_primary: true 
        }
      ]);
    }
  };

  // Enhanced text formatting functions
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateTemplateContent();
  };

  // Advanced formatting functions
  const insertTable = () => {
    const rows = prompt("Number of rows:", "3");
    const cols = prompt("Number of columns:", "2");
    
    if (rows && cols) {
      let tableHTML = `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #ddd;">`;
      tableHTML += `<thead><tr style="background-color: #f5f5f5;">`;
      
      for (let i = 0; i < parseInt(cols); i++) {
        tableHTML += `<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Header ${i + 1}</th>`;
      }
      tableHTML += `</tr></thead><tbody>`;
      
      for (let i = 0; i < parseInt(rows); i++) {
        tableHTML += `<tr>`;
        for (let j = 0; j < parseInt(cols); j++) {
          tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">&nbsp;</td>`;
        }
        tableHTML += `</tr>`;
      }
      tableHTML += `</tbody></table>`;
      
      insertHTML(tableHTML);
    }
  };

  const insertBulletList = () => {
    formatText('insertUnorderedList');
  };

  const insertNumberedList = () => {
    formatText('insertOrderedList');
  };

  const indentText = () => {
    formatText('indent');
  };

  const outdentText = () => {
    formatText('outdent');
  };

  const insertHorizontalRule = () => {
    insertHTML('<hr style="border: 1px solid #ddd; margin: 20px 0;">');
  };

  const insertPageBreak = () => {
    insertHTML('<div style="page-break-after: always;"></div>');
  };

  const changeFontSize = (size) => {
    formatText('fontSize', size);
  };

  const changeFontColor = (color) => {
    formatText('foreColor', color);
  };

  const changeBackgroundColor = (color) => {
    formatText('backColor', color);
  };

  const insertImage = () => {
    const imageUrl = prompt("Enter image URL:", "");
    if (imageUrl) {
      const imageHTML = `<img src="${imageUrl}" style="max-width: 100%; height: auto; margin: 10px 0;" alt="Insert Image">`;
      insertHTML(imageHTML);
    }
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
<div style="margin: 20px 0;">
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #2c3e50;">
    <thead>
      <tr style="background-color: #2c3e50; color: white;">
        <th style="border: 1px solid #2c3e50; padding: 12px; text-align: left; font-weight: bold;">Salary Component</th>
        <th style="border: 1px solid #2c3e50; padding: 12px; text-align: right; font-weight: bold;">Monthly Amount (₦)</th>
      </tr>
    </thead>
    <tbody>`;

    gradeSalaryComponents.forEach((component, index) => {
      const bgColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
      tableHTML += `
      <tr style="background-color: ${bgColor};">
        <td style="border: 1px solid #ddd; padding: 10px; font-weight: 500;">${component.component_name}</td>
        <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-family: 'Courier New', monospace;">{${component.variable_key}}</td>
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

    // Calculate and add total row
    const totalAmount = gradeSalaryComponents.reduce((sum, component) => sum + component.amount, 0);
    tableHTML += `
      <tr style="background-color: #2c3e50; color: white; font-weight: bold;">
        <td style="border: 1px solid #2c3e50; padding: 12px;">TOTAL MONTHLY COMPENSATION</td>
        <td style="border: 1px solid #2c3e50; padding: 12px; text-align: right; font-family: 'Courier New', monospace;">₦{net_salary}</td>
      </tr>`;

    tableHTML += `
    </tbody>
  </table>
</div>`;

    insertHTML(tableHTML);

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

  const insertOfficeLocation = () => {
    if (clientOffices.length === 0) {
      // Load mock data for demo
      const mockOffices = [
        { id: 1, name: "Head Office", address: "Plot 123, Victoria Island, Lagos", is_primary: true },
        { id: 2, name: "Abuja Branch", address: "Suite 45, Central Business District, Abuja" },
        { id: 3, name: "Port Harcourt Office", address: "15 GRA Phase II, Port Harcourt" },
      ];
      setClientOffices(mockOffices);
    }

    // Create a professional office location insertion
    const locationHTML = `
<div style="margin: 10px 0;">
  <p><strong>Reporting Location:</strong> {office_location}</p>
  <p style="font-size: 11px; color: #666; margin-top: 5px;"><em>Other available locations: ${clientOffices.map(office => office.name).join(', ')}</em></p>
</div>`;
    
    insertHTML(locationHTML);

    // Add office location variable if it doesn't exist
    if (!template.variables.find(v => v.key === 'office_location')) {
      setTemplate(prev => ({
        ...prev,
        variables: [...prev.variables, {
          key: 'office_location',
          label: 'Office Location',
          type: 'select',
          options: clientOffices.map(office => ({ 
            value: `${office.name} - ${office.address}`, 
            label: `${office.name} - ${office.address}` 
          })),
          value: clientOffices.find(office => office.is_primary)?.name + ' - ' + 
                  clientOffices.find(office => office.is_primary)?.address || 
                  clientOffices[0]?.name + ' - ' + clientOffices[0]?.address || 'Head Office - Victoria Island, Lagos'
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

  // Enhanced content change handler with cursor preservation
  const handleContentChange = useCallback((e) => {
    // Store cursor position before state update
    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    let cursorOffset = 0;
    
    if (range && editorRef.current) {
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editorRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      cursorOffset = preCaretRange.toString().length;
    }

    // Update template content
    const newContent = e.target.innerHTML;
    setTemplate(prev => ({
      ...prev,
      content: newContent
    }));

    // Store cursor position to restore after re-render
    setCursorPosition(cursorOffset);
  }, []);

  // Helper function to restore cursor position
  const restoreCursor = useCallback((offset) => {
    if (!editorRef.current || offset === null) return;

    try {
      const selection = window.getSelection();
      const range = document.createRange();
      
      let currentOffset = 0;
      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let textNode = walker.nextNode();
      while (textNode) {
        const nodeLength = textNode.textContent.length;
        
        if (currentOffset + nodeLength >= offset) {
          const relativeOffset = offset - currentOffset;
          range.setStart(textNode, Math.min(relativeOffset, nodeLength));
          range.setEnd(textNode, Math.min(relativeOffset, nodeLength));
          selection.removeAllRanges();
          selection.addRange(range);
          break;
        }
        
        currentOffset += nodeLength;
        textNode = walker.nextNode();
      }
    } catch (error) {
      // Fallback: just focus the editor
      editorRef.current.focus();
    }
  }, []);

  // State to track cursor position
  const [cursorPosition, setCursorPosition] = useState(null);

  // Restore cursor after content changes
  useEffect(() => {
    if (cursorPosition !== null) {
      requestAnimationFrame(() => {
        restoreCursor(cursorPosition);
        setCursorPosition(null);
      });
    }
  }, [template.content, cursorPosition, restoreCursor]);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== template.content) {
      editorRef.current.innerHTML = template.content;
    }
  }, [editingTemplate]); // Only run when editingTemplate changes

  const generatePreview = () => {
    let previewContent = template.content;
    
    // Replace variables with their values or professional sample data
    template.variables.forEach(variable => {
      const placeholder = `{${variable.key}}`;
      let value = variable.value || `[${variable.label}]`;
      
      // Generate professional sample values for preview
      switch (variable.key) {
        case 'current_date':
          value = new Date().toLocaleDateString('en-NG', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          break;
        case 'candidate_name':
          value = 'John Adebayo Adebisi';
          break;
        case 'candidate_address':
          value = `15 Admiralty Way, Lekki Phase 1<br>Lagos State, Nigeria<br>+234 802 123 4567<br>john.adebisi@email.com`;
          break;
        case 'job_title':
          value = selectedJobCategory?.job_title || 'Senior Software Developer';
          break;
        case 'department':
          value = selectedJobCategory?.department || 'Information Technology';
          break;
        case 'start_date':
          const startDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
          value = startDate.toLocaleDateString('en-NG', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          break;
        case 'response_deadline':
          const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          value = deadline.toLocaleDateString('en-NG', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          break;
        case 'office_location':
          value = 'Head Office - Victoria Island, Lagos';
          break;
        case 'supervisor_name':
          value = 'Mrs. Sarah Olumide';
          break;
        case 'net_salary':
          const total = gradeSalaryComponents.reduce((sum, comp) => sum + comp.amount, 0);
          value = total > 0 ? total.toLocaleString('en-NG') : '350,000.00';
          break;
        default:
          if (variable.key.includes('salary') || variable.key.includes('allowance') || variable.key.includes('benefit')) {
            const component = gradeSalaryComponents.find(c => c.variable_key === variable.key);
            value = component ? component.amount.toLocaleString('en-NG') : '75,000.00';
          }
      }
      
      previewContent = previewContent.replace(new RegExp(placeholder, 'g'), value);
    });

    // Add professional document styling for preview
    const styledContent = `
      <div style="max-width: 8.5in; margin: 0 auto; background: white; padding: 1in; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <style>
          @media print {
            body { margin: 0; }
            .print-page { page-break-after: always; }
          }
          table { border-collapse: collapse !important; }
          .variable-placeholder { background-color: #e3f2fd !important; }
        </style>
        ${previewContent}
        
        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 10px; color: #666;">
          <p><strong>Document Information:</strong></p>
          <p>Template: ${template.name}</p>
          <p>Generated: ${new Date().toLocaleString('en-NG')}</p>
          <p>Client: ${selectedClient?.organisation_name || 'Strategic Outsourcing Limited'}</p>
          <p>Grade: ${selectedPayGrade?.grade_name || 'Senior Level'}</p>
        </div>
      </div>
    `;

    return styledContent;
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
        // Map frontend structure to backend expected structure
        header_config: template.header,
        footer_config: template.footer,
        content: editorRef.current?.innerHTML || template.content,
      };
      
      // Remove frontend-only fields that backend doesn't expect
      delete templateData.header;
      delete templateData.footer;

      // For new templates, add required metadata
      if (!template.id) {
        templateData.name = `${selectedPayGrade?.pay_grade} Offer Letter`;
        templateData.client_id = selectedClient?.id;
        templateData.job_structure_id = selectedJobCategory?.id;
        templateData.pay_grade_structure_id = selectedPayGrade?.id;
      }

      console.log("📤 Sending template data:", templateData);

      let response;
      if (template.id) {
        // Update existing template
        response = await salaryStructureAPI.offerLetters.update(template.id, templateData);
      } else {
        // Create new template
        response = await salaryStructureAPI.offerLetters.create(templateData);
      }

      if (response.success) {
        // Update the template state with the saved data (including ID for future updates)
        setTemplate(prevTemplate => ({
          ...prevTemplate,
          ...response.data,
          id: response.data.id
        }));
        onSave(response.data);
      } else {
        alert('Error saving template: ' + response.message);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      
      // Handle specific error cases
      if (error.message && error.message.includes('already exists')) {
        alert('A template already exists for this pay grade. Please edit the existing template instead.');
        // Reload to show the existing template
        window.location.reload();
      } else {
        alert('Error saving template. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-b px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {editingTemplate ? 'Edit' : 'Create'} Offer Letter Template
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {selectedClient?.organisation_name} → {selectedJobCategory?.job_title} → {selectedPayGrade?.grade_name}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center px-3 py-2 rounded-md ${
                showPreview
                  ? 'bg-blue-600 text-white'
                  : currentTheme === 'dark' 
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } transition-colors`}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className={`flex-1 flex flex-col ${showPreview ? 'w-1/2' : 'w-full'}`}>
          {/* Template Name */}
          <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} px-6 py-4 border-b`}>
            <label className="block text-sm font-medium mb-2">Template Name</label>
            <input
              type="text"
              value={template.name}
              onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md ${
                currentTheme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              placeholder="Enter template name..."
            />
          </div>

          {/* Enhanced Header Settings */}
          <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} px-6 py-4 border-b`}>
            <label className="block text-sm font-medium mb-3">Header Configuration</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={template.header.logo}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      header: { ...prev.header, logo: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <Image className="w-4 h-4 mr-1" />
                  Company Logo
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={template.header.date}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      header: { ...prev.header, date: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <Calendar className="w-4 h-4 mr-1" />
                  Date Header
                </label>
              </div>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={template.header.company_address}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      header: { ...prev.header, company_address: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <Building2 className="w-4 h-4 mr-1" />
                  Company Address
                </label>
                <div className="flex items-center space-x-2">
                  <label className="text-sm">Letterhead Style:</label>
                  <select
                    value={template.header.letterhead_style}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      header: { ...prev.header, letterhead_style: e.target.value }
                    }))}
                    className={`px-2 py-1 text-sm border rounded ${
                      currentTheme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="formal">Formal</option>
                    <option value="modern">Modern</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Toolbar */}
          <div className={`${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} px-6 py-3 border-b`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Row 1: Basic Formatting */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => formatText('bold')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText('italic')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText('underline')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Underline"
                >
                  <Underline className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                {/* Font Size */}
                <select
                  onChange={(e) => changeFontSize(e.target.value)}
                  className="px-2 py-1 text-sm border rounded"
                  defaultValue="3"
                >
                  <option value="1">8pt</option>
                  <option value="2">10pt</option>
                  <option value="3">12pt</option>
                  <option value="4">14pt</option>
                  <option value="5">18pt</option>
                  <option value="6">24pt</option>
                  <option value="7">36pt</option>
                </select>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                
                {/* Alignment */}
                <button
                  onClick={() => formatText('justifyLeft')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText('justifyCenter')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText('justifyRight')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText('justifyFull')}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Justify"
                >
                  <AlignJustify className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                {/* Lists and Indentation */}
                <button
                  onClick={insertBulletList}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={insertNumberedList}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  onClick={outdentText}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Decrease Indent"
                >
                  <Outdent className="w-4 h-4" />
                </button>
                <button
                  onClick={indentText}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Increase Indent"
                >
                  <Indent className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                {/* Advanced Tools */}
                <button
                  onClick={insertTable}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Insert Table"
                >
                  <Table className="w-4 h-4" />
                </button>
                <button
                  onClick={insertImage}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Insert Image"
                >
                  <Image className="w-4 h-4" />
                </button>
                <button
                  onClick={insertHorizontalRule}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Insert Horizontal Line"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={insertPageBreak}
                  className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Insert Page Break"
                >
                  <Hash className="w-4 h-4" />
                </button>
              </div>

              {/* Row 2: Smart Variable Buttons */}
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={insertSalaryComponents}
                  disabled={gradeSalaryComponents.length === 0}
                  className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  title="Insert Professional Salary Components Table"
                >
                  <Banknote className="w-4 h-4 mr-1" />
                  Salary Table
                </button>
                <button
                  onClick={insertOfficeLocation}
                  className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  title="Insert Office Location with Options"
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Office Location
                </button>
                <button
                  onClick={insertNetSalary}
                  disabled={gradeSalaryComponents.length === 0}
                  className="flex items-center px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  title="Insert Calculated Net Salary"
                >
                  <Calculator className="w-4 h-4 mr-1" />
                  Net Salary
                </button>

                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                {/* Quick Variables */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => insertVariable('candidate_name', 'Candidate Name')}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Name
                  </button>
                  <button
                    onClick={() => insertVariable('job_title', 'Job Title')}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Job Title
                  </button>
                  <button
                    onClick={() => insertVariable('start_date', 'Start Date')}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Start Date
                  </button>
                  <button
                    onClick={() => insertVariable('current_date', 'Current Date')}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Date
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Editor */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              <div
                ref={editorRef}
                contentEditable
                onInput={handleContentChange}
                suppressContentEditableWarning={true}
                className={`min-h-[700px] p-8 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  currentTheme === 'dark' 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 shadow-sm'
                }`}
                style={{
                  lineHeight: '1.8',
                  fontFamily: "'Times New Roman', serif",
                  fontSize: '12pt',
                  minHeight: '11in',
                  width: '8.5in',
                  margin: '0 auto',
                  boxShadow: currentTheme === 'dark' ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
                data-placeholder="Start typing your offer letter content here..."
              />
              
              {/* Editor Status */}
              <div className="mt-4 text-sm text-gray-500 text-center">
                <p>Word count: <span className="font-medium">{editorRef.current?.innerText?.split(/\s+/).length || 0}</span> words</p>
                <p>Variables: <span className="font-medium">{template.variables.length}</span> defined</p>
              </div>
            </div>
          </div>

          {/* Enhanced Footer Settings */}
          <div className={`${currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} px-6 py-4 border-t`}>
            <label className="block text-sm font-medium mb-3">Footer Configuration</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={template.footer.candidate_signature}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      footer: { ...prev.footer, candidate_signature: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <FileText className="w-4 h-4 mr-1" />
                  <div>
                    <span>Candidate Acceptance Section</span>
                    <p className="text-xs text-gray-500 ml-5">Legal acceptance area where candidate signs to accept offer terms</p>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={template.footer.agent_declaration}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      footer: { ...prev.footer, agent_declaration: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <FileText className="w-4 h-4 mr-1" />
                  <div>
                    <span>HR Agent Declaration</span>
                    <p className="text-xs text-gray-500 ml-5">HR representative signature and authorization section</p>
                  </div>
                </label>
              </div>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={template.footer.company_seal}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      footer: { ...prev.footer, company_seal: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <Settings className="w-4 h-4 mr-1" />
                  <div>
                    <span>Company Seal</span>
                    <p className="text-xs text-gray-500 ml-5">Official company stamp/seal for document authentication</p>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={template.footer.page_numbering}
                    onChange={(e) => setTemplate(prev => ({
                      ...prev,
                      footer: { ...prev.footer, page_numbering: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <Hash className="w-4 h-4 mr-1" />
                  <div>
                    <span>Page Numbering</span>
                    <p className="text-xs text-gray-500 ml-5">Automatic page numbers (Page X of Y) for multi-page documents</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Preview Panel */}
        {showPreview && (
          <div className={`w-1/2 border-l ${currentTheme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Live Preview</h3>
                    <p className="text-sm text-gray-500">Professional offer letter preview</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      title="Print Preview"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Print
                    </button>
                    <button
                      onClick={() => {
                        const content = generatePreview();
                        const blob = new Blob([content], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${template.name.replace(/\s+/g, '_')}_preview.html`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      title="Download Preview"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-auto">
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                  <div 
                    className="h-full"
                    dangerouslySetInnerHTML={{ __html: generatePreview() }}
                    style={{
                      minHeight: '11in',
                      backgroundColor: 'white',
                      color: '#000',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferLetterBuilder;