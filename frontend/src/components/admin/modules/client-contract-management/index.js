import { lazy } from "react";

// Lazy load all submodules for performance
const ClientContractDashboard = lazy(() => import("./ClientContractDashboard"));
const ClientMaster = lazy(() =>
  import("./submodules/client-master/ClientMaster")
);
const ClientService = lazy(() =>
  import("./submodules/client-service/ClientService")
);
const ClientContract = lazy(() =>
  import("./submodules/client-contract/ClientContract")
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
      id: "client-service",
      name: "Client Service",
      icon: "🌍",
      component: ClientService,
      path: "/client-service",
      children: [
        {
          id: "location-master",
          name: "Location Master",
          path: "/location-master",
        },
        {
          id: "region-zone-master",
          name: "Region and Zone Master",
          path: "/region-zone-master",
        },
        {
          id: "request-master",
          name: "Request Master",
          path: "/request-master",
        },
        {
          id: "state-master",
          name: "State Master",
          path: "/state-master",
        },
        {
          id: "lga-master",
          name: "Local Government Area Master",
          path: "/lga-master",
        },
        {
          id: "district-area-master",
          name: "District / Area Name Master",
          path: "/district-area-master",
        },
        {
          id: "street-zip-master",
          name: "Street Name / Zip Code Master",
          path: "/street-zip-master",
        },
      ],
    },
    {
      id: "client-contract",
      name: "Client Contract",
      icon: "📄",
      component: ClientContract,
      path: "/client-contract",
      children: [
        {
          id: "contract-details",
          name: "Contract Details",
          path: "/contract-details",
        },
        {
          id: "contract-revalidation",
          name: "Contract Revalidation",
          path: "/contract-revalidation",
        },
      ],
    },
    {
      id: "salary-structure",
      name: "Salary Structure",
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
