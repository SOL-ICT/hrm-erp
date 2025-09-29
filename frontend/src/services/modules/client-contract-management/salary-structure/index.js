// Modular salary structure API exports
export { dashboardAPI } from "./dashboardAPI";
export { jobStructuresAPI } from "./jobStructuresAPI";
export { payGradesAPI } from "./payGradesAPI";
export { utilitiesAPI } from "./utilitiesAPI";
export { offerLetterAPI } from "./offerLetterAPI";

// Backward compatibility - aggregate object (temporary)
import { dashboardAPI } from "./dashboardAPI";
import { jobStructuresAPI } from "./jobStructuresAPI";
import { payGradesAPI } from "./payGradesAPI";
import { utilitiesAPI } from "./utilitiesAPI";
import { offerLetterAPI } from "./offerLetterAPI";

export const salaryStructureAPI = {
  getDashboardStatistics: dashboardAPI.getStatistics,
  jobStructures: jobStructuresAPI,
  payGrades: payGradesAPI,
  utilities: utilitiesAPI,
  offerLetters: offerLetterAPI,
};

export default salaryStructureAPI;
