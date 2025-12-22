/**
 * Requisition Management API Services
 * 
 * Central export point for all requisition-related API services
 */

import inventoryAPI from './inventoryAPI';
import requisitionAPI from './requisitionAPI';

export { inventoryAPI, requisitionAPI };

export default {
  inventory: inventoryAPI,
  requisition: requisitionAPI,
};
