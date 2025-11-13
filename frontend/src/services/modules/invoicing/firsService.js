import firsAPI from "./firsAPI";
import { firsQRGenerator } from "./firsQRGenerator";

/**
 * FIRS E-Invoicing Service
 * Handles integration with Federal Inland Revenue Service e-invoicing system
 * Uses backend proxy for secure API calls and FIRS-compliant QR code generation with RSA encryption
 */
class FIRSEInvoicingService {
  constructor() {
    // No direct FIRS API client needed - using backend proxy
    this.backendUrl = process.env.NEXT_PUBLIC_API_URL || "";
  }

  /**
   * Submit invoice to FIRS via backend proxy (upload-based)
   * @param {string} uploadId - Attendance upload ID
   * @param {Object} invoiceData - Complete invoice data for FIRS submission
   * @returns {Promise<Object>} FIRS response with approval status
   */
  async submitInvoiceToFIRS(uploadId, invoiceData = {}) {
    try {
      console.log("📤 Submitting invoice to FIRS via backend:", {
        uploadId,
        invoiceData,
      });

      // First, get the invoice data if not provided
      let completeInvoiceData = invoiceData;
      if (!invoiceData.invoice_number) {
        console.log("🔄 Fetching invoice data for FIRS submission...");
        const previewResponse = await firsAPI.previewInvoice(uploadId);
        if (!previewResponse.success) {
          throw new Error(
            "Failed to fetch invoice data: " + previewResponse.message
          );
        }
        completeInvoiceData = previewResponse.data;
      }

      // Submit complete invoice data to backend
      const response = await firsAPI.submitInvoice(
        uploadId,
        completeInvoiceData
      );

      console.log("✅ FIRS backend response:", response);

      return {
        success: response.success,
        approved: response.approved,
        firsInvoiceNumber: response.data?.firs_invoice_number,
        firsReference: response.data?.firs_reference,
        approvalDate: response.data?.approval_date,
        qrData: response.data?.qr_data,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ FIRS backend submission error:", error);
      return {
        success: false,
        approved: false,
        message: error.message || "Failed to submit to FIRS via backend",
        error: error,
      };
    }
  }

  /**
   * Submit generated invoice to FIRS (invoice-based)
   * @param {string} invoiceId - Generated invoice ID or number
   * @param {Object} invoiceData - Additional invoice data for FIRS submission
   * @returns {Promise<Object>} FIRS response with approval status
   */
  async submitGeneratedInvoiceToFIRS(invoiceId, invoiceData = {}) {
    try {
      console.log("📤 Submitting generated invoice to FIRS via backend:", {
        invoiceId,
        invoiceData,
      });

      // First, preview the invoice data if not provided
      let completeInvoiceData = invoiceData;
      if (!invoiceData.invoice_number) {
        console.log("🔄 Fetching invoice data for FIRS submission...");
        const previewResponse = await firsAPI.previewGeneratedInvoice(
          invoiceId
        );
        if (!previewResponse.success) {
          throw new Error(
            "Failed to fetch invoice data: " + previewResponse.message
          );
        }
        completeInvoiceData = previewResponse.data;
      }

      // Submit complete invoice data to backend
      const response = await firsAPI.submitGeneratedInvoice(
        invoiceId,
        completeInvoiceData
      );

      console.log("✅ FIRS backend response:", response);

      return {
        success: response.success,
        approved: response.data?.firs_approved || false,
        firsInvoiceNumber: response.data?.firs_invoice_number,
        firsReference: response.data?.firs_reference,
        approvalDate: response.data?.firs_approved_at,
        qrData: response.data?.firs_qr_data,
        message: response.message,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ FIRS backend submission error:", error);
      return {
        success: false,
        approved: false,
        message: error.message || "Failed to submit to FIRS via backend",
        error: error,
      };
    }
  }

  /**
   * Generate QR code for FIRS approved invoice
   * @param {Object} qrData - QR code data from FIRS response
   * @returns {Promise<Object>} QR code generation result
   */
  async generateQRCode(qrData) {
    try {
      console.log("🔄 Generating FIRS-compliant QR code:", qrData);

      if (!qrData.irn || !qrData.certificate) {
        throw new Error(
          "Missing required QR data: IRN and certificate are required for FIRS compliance"
        );
      }

      // Check if backend provided encrypted data, otherwise use simple QR
      let qrResult;
      if (qrData.encryptedData) {
        // Use backend-encrypted data for FIRS compliance
        qrResult = await firsQRGenerator.generateQRCode({
          encryptedData: qrData.encryptedData,
          size: 200,
          fgColor: "#000000",
          bgColor: "#FFFFFF",
        });
      } else {
        // Fallback to simple QR for testing/development
        console.warn(
          "⚠️ No encrypted data from backend, using simple QR format"
        );
        qrResult = await firsQRGenerator.generateSimpleQR({
          irn: qrData.irn,
          certificate: qrData.certificate,
          size: 200,
          fgColor: "#000000",
          bgColor: "#FFFFFF",
        });
      }

      if (!qrResult.success) {
        throw new Error(qrResult.message || "FIRS QR generation failed");
      }

      console.log("✅ FIRS-compliant QR code generated successfully");

      return {
        success: true,
        qrCodeBuffer: qrResult.qrCodeBuffer,
        qrCodeDataUrl: qrResult.qrCodeDataUrl,
        encryptedBase64: qrResult.encryptedBase64,
        timestamp: qrResult.timestamp,
        irn: qrResult.irn,
      };
    } catch (error) {
      console.error("❌ FIRS QR code generation error:", error);
      return {
        success: false,
        message: error.message || "Failed to generate FIRS-compliant QR code",
        error: error,
      };
    }
  }

  /**
   * Complete FIRS workflow: Submit to FIRS and generate PDF
   * @param {string} uploadId - Attendance upload ID
   * @param {string} invoiceType - Invoice type (summary/detailed)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Complete workflow result
   */
  async generateInvoiceWithFIRS(
    uploadId,
    invoiceType = "detailed",
    options = {}
  ) {
    try {
      console.log("🚀 Starting complete FIRS workflow:", {
        uploadId,
        invoiceType,
      });

      // Step 1: Submit to FIRS via backend
      const firsResult = await this.submitInvoiceToFIRS(uploadId, invoiceType);

      if (!firsResult.success) {
        throw new Error(`FIRS submission failed: ${firsResult.message}`);
      }

      // Step 2: Generate QR code if approved and QR data available
      let qrCodeResult = null;
      if (firsResult.approved && firsResult.qrData) {
        qrCodeResult = await this.generateQRCode(firsResult.qrData);
      }

      // Step 3: Generate PDF with FIRS data (regardless of approval for audit)
      const pdfResult = await firsAPI.generateInvoice(uploadId, {
        invoice_type: invoiceType,
        include_qr: firsResult.approved && qrCodeResult?.success,
        qr_data_url: qrCodeResult?.qrCodeDataUrl,
      });

      return {
        success: true,
        approved: firsResult.approved,
        firsData: firsResult,
        qrCode: qrCodeResult,
        pdfGenerated: pdfResult.success,
        downloadUrl: pdfResult.download_url,
        message: firsResult.approved
          ? "Invoice approved by FIRS and PDF generated successfully"
          : "Invoice processed but not approved by FIRS",
      };
    } catch (error) {
      console.error("❌ FIRS workflow failed:", error);
      return {
        success: false,
        message: error.message,
        error: error,
      };
    }
  }

  /**
   * Check FIRS invoice status
   * @param {string} uploadId - Attendance upload ID
   * @returns {Promise<Object>} Status check result
   */
  async checkFIRSStatus(uploadId) {
    try {
      console.log("🔍 Checking FIRS status for upload:", uploadId);

      const response = await firsAPI.getInvoiceStatus(uploadId);

      console.log("✅ FIRS status retrieved:", response);

      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error) {
      console.error("❌ FIRS status check error:", error);
      return {
        success: false,
        message: error.message || "Failed to check FIRS status",
        error: error,
      };
    }
  }

  /**
   * Get FIRS service status from backend
   * @returns {Promise<Object>} Service status
   */
  async getFIRSServiceStatus() {
    try {
      const response = await firsAPI.getServiceStatus();
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("❌ Failed to get FIRS service status:", error);
      return {
        success: false,
        message: error.message || "Failed to get FIRS service status",
        error: error,
      };
    }
  }

  /**
   * Validate upload readiness for FIRS submission
   * @param {string} uploadId - Attendance upload ID
   * @returns {Promise<Object>} Validation result
   */
  async validateUploadForFIRS(uploadId) {
    try {
      // Check if upload exists and has required client data
      const previewResponse = await firsAPI.previewInvoice(uploadId);

      const errors = [];
      const warnings = [];

      // Validate client data
      if (!previewResponse.data?.customer?.tin) {
        errors.push("Customer TIN is required for FIRS submission");
      }

      if (!previewResponse.data?.customer?.name) {
        errors.push("Customer name is required");
      }

      if (
        !previewResponse.data?.total_amount ||
        previewResponse.data.total_amount <= 0
      ) {
        errors.push("Invoice must have a positive total amount");
      }

      // Check FIRS service availability
      const serviceStatus = await this.getFIRSServiceStatus();
      if (!serviceStatus.success || !serviceStatus.data?.enabled) {
        errors.push("FIRS service is not available or configured");
      }

      return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings,
        data: previewResponse.data,
      };
    } catch (error) {
      console.error("❌ FIRS validation error:", error);
      return {
        valid: false,
        errors: ["Failed to validate upload for FIRS: " + error.message],
        warnings: [],
      };
    }
  }
}

// Export singleton instance
export const firsService = new FIRSEInvoicingService();
export default firsService;
