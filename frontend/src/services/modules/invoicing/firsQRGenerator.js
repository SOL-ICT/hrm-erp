import QRCode from "qrcode";

/**
 * FIRS-Compliant QR Code Generator
 * Frontend component for QR generation using backend-encrypted data
 * Backend handles RSA encryption, frontend generates QR codes
 */
class FIRSQRGenerator {
  /**
   * Generate FIRS-compliant QR code from backend-provided encrypted data
   * @param {Object} options - QR generation options
   * @returns {Promise<Object>} QR code result
   */
  async generateQRCode(options) {
    try {
      const {
        encryptedData, // Backend-provided encrypted payload
        size = 200,
        fgColor = "#000000",
        bgColor = "#FFFFFF",
      } = options;

      if (!encryptedData) {
        throw new Error(
          "Encrypted data from backend is required for FIRS QR generation"
        );
      }

      console.log("🔄 Generating QR code from backend-encrypted FIRS data");

      // Generate QR code with backend-encrypted data
      const qrDataUrl = await QRCode.toDataURL(encryptedData, {
        width: size,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        margin: 2,
        errorCorrectionLevel: "M",
      });

      // Generate buffer version for downloads
      const qrBuffer = await QRCode.toBuffer(encryptedData, {
        width: size,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        margin: 2,
        errorCorrectionLevel: "M",
      });

      return {
        success: true,
        qrCodeBuffer: qrBuffer,
        qrCodeDataUrl: qrDataUrl,
        encryptedData: encryptedData,
      };
    } catch (error) {
      console.error("❌ FIRS QR generation failed:", error);
      return {
        success: false,
        message: error.message,
        error: error,
      };
    }
  }

  /**
   * Generate simple QR code from IRN and certificate (fallback method)
   * @param {Object} options - QR generation options
   * @returns {Promise<Object>} QR code result
   */
  async generateSimpleQR(options) {
    try {
      const {
        irn,
        certificate,
        size = 200,
        fgColor = "#000000",
        bgColor = "#FFFFFF",
      } = options;

      if (!irn) {
        throw new Error("IRN is required for QR generation");
      }

      // Simple format for testing/fallback
      const qrData = certificate ? `${irn}|${certificate}` : irn;

      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: size,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        margin: 2,
        errorCorrectionLevel: "M",
      });

      return {
        success: true,
        qrCodeDataUrl: qrDataUrl,
        qrData: qrData,
      };
    } catch (error) {
      console.error("❌ Simple QR generation failed:", error);
      return {
        success: false,
        message: error.message,
        error: error,
      };
    }
  }

  /**
   * Validate FIRS QR data format
   * @param {Object} qrData - QR data to validate
   * @returns {boolean} Is valid
   */
  validateQRData(qrData) {
    return qrData && (qrData.irn || qrData.encryptedData);
  }
}

// Export singleton instance
export const firsQRGenerator = new FIRSQRGenerator();
export default firsQRGenerator;
