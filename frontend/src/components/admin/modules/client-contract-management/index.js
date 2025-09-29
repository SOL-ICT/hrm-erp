import { lazy } from "react";

// Lazy load all submodules for performance
const ClientContractDashboard = lazy(() => import("./ClientContractDashboard"));
const ClientMaster = lazy(() =>
  import("./submodules/client-master/ClientMaster")
);
const ClientServiceLocation = lazy(() =>
  import("./submodules/client-service-location/ClientServiceLocation")
);
const SalaryStructure = lazy(() =>
  import("./submodules/salary-structure/SalaryStructure")
);

// Module configuration
export const clientContractModule = {
  name: "Client Contract Management",
  icon: "📋",
  path: "/admin/modules/client-contract-management",
  dashboard: ClientContractDashboard,
  submodules: [
    {
      id: "client-master",
      name: "Client Master",
      icon: "👤",
      component: ClientMaster,
      path: "/client-master",
    },
    {
      id: "client-service-location",
      name: "Client Service Location",
      icon: "📍",
      component: ClientServiceLocation,
      path: "/client-service-location",
    },
    {
      id: "salary-structure",
      name: "Job Function Setup",
      icon: "💰",
      component: SalaryStructure,
      path: "/salary-structure",
      children: [
        {
          id: "salary-import",
          name: "Salary Structure Import",
          path: "/salary-import",
        },
        {
          id: "salary-change-import",
          name: "Salary Structure Change Import",
          path: "/salary-change-import",
        },
        {
          id: "salary-entry",
          name: "Salary Structure Entry",
          path: "/salary-entry",
        },
        {
          id: "salary-change-entry",
          name: "Salary Structure Change Entry",
          path: "/salary-change-entry",
        },
        {
          id: "specific-pay-element",
          name: "Specific Pay Element",
          path: "/specific-pay-element",
        },
        {
          id: "client-account",
          name: "Client Account",
          path: "/client-account",
        },
      ],
    },
  ],
};

export default clientContractModule;
