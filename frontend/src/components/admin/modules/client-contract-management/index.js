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
const RecruitmentRequest = lazy(() =>
  import("./submodules/recruitment-request/RecruitmentRequest")
);
const VacancySetup = lazy(() =>
  import("./submodules/vacancy-setup/VacancySetup")
);
const SalaryStructure = lazy(() =>
  import("./submodules/salary-structure/SalaryStructure")
);
const ClientWeekOff = lazy(() =>
  import("./submodules/client-week-off/ClientWeekOff")
);
const ClaimsResolution = lazy(() =>
  import("./submodules/claims-resolution/ClaimsResolution")
);
const RecruitmentTracker = lazy(() =>
  import("./submodules/recruitment-tracker/RecruitmentTracker")
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
      children: [
        {
          id: "excel-import",
          name: "Excel Import",
          path: "/excel-import",
        },
        {
          id: "manual-entry",
          name: "Manual Entry",
          path: "/manual-entry",
        },
      ],
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
      id: "recruitment-request",
      name: "Recruitment Request",
      icon: "👥",
      component: RecruitmentRequest,
      path: "/recruitment-request",
    },
    {
      id: "vacancy-setup",
      name: "Vacancy Setup",
      icon: "📊",
      component: VacancySetup,
      path: "/vacancy-setup",
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
    {
      id: "client-week-off",
      name: "Client Week Off",
      icon: "🏖️",
      component: ClientWeekOff,
      path: "/client-week-off",
    },
    {
      id: "claims-resolution",
      name: "Claims Resolution",
      icon: "⚖️",
      component: ClaimsResolution,
      path: "/claims-resolution",
      children: [
        {
          id: "defalcation-incidence",
          name: "Defalcation Incidence",
          path: "/defalcation-incidence",
        },
        {
          id: "case-documentation",
          name: "Defalcation Incidence (Case Documentation by PMS)",
          path: "/case-documentation",
        },
        {
          id: "case-review",
          name: "Defalcation Incidence (Case Review by CRT)",
          path: "/case-review",
        },
        {
          id: "correspondence-closure",
          name: "Defalcation Incidence (Correspondence & Closure)",
          path: "/correspondence-closure",
        },
      ],
    },
    {
      id: "claims-resolution-list",
      name: "Claims Resolution List",
      icon: "📋",
      component: lazy(() =>
        import("./submodules/claims-resolution-list/ClaimsResolutionList")
      ),
      path: "/claims-resolution-list",
    },
    {
      id: "recruitment-tracker-list",
      name: "Recruitment Tracker List",
      icon: "📈",
      component: RecruitmentTracker,
      path: "/recruitment-tracker-list",
    },
  ],
};

export default clientContractModule;
