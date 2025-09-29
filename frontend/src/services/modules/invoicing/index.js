/**
 * Invoicing Module - API Services
 * Centralized exports for all invoicing-related API services
 */

// Import individual services
import { invoiceApiService } from "./invoiceService";
import { invoiceTemplateService } from "./invoiceTemplateService";

// Export services for easy importing
export { invoiceApiService, invoiceTemplateService };

// Default export for entire module
export default {
  invoiceApiService,
  invoiceTemplateService,
};
