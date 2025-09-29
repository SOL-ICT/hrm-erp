import { lazy } from "react";

const SalaryStructure = lazy(() => import("./SalaryStructure"));
const JobStructureMaster = lazy(() => import("./JobStructureMaster"));
const PayDetailsMaster = lazy(() => import("./PayDetailsMaster"));
const JobStructureForm = lazy(() => import("./JobStructureForm"));
const PayGradeForm = lazy(() => import("./PayGradeForm"));

export {
  SalaryStructure,
  JobStructureMaster,
  PayDetailsMaster,
  JobStructureForm,
  PayGradeForm,
};

export default SalaryStructure;
