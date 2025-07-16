"use client";

import { lazy } from "react";

// Only load working modules
const DashboardOverview = lazy(() => import("./modules/DashboardOverview"));
const ClientContractDashboard = lazy(() =>
  import("./modules/client-contract-management/ClientContractDashboard")
);
const SOLMaster = lazy(() => import("./modules/administration/SOLMaster"));

// Direct submodule imports
const ClientMaster = lazy(() =>
  import(
    "./modules/client-contract-management/submodules/client-master/ClientMaster"
  )
);
const ClientService = lazy(() =>
  import(
    "./modules/client-contract-management/submodules/client-service/ClientService"
  )
);

const AdminRouter = ({
  activeModule,
  activeSubmodule,
  currentTheme,
  preferences,
}) => {
  const renderModule = () => {
    const commonProps = {
      currentTheme,
      preferences,
      activeSubmodule,
    };

    // DIRECT SUBMODULE ROUTING - No intermediate dashboard
    if (activeSubmodule) {
      switch (activeSubmodule) {
        case "client-master":
          return (
            <ClientMaster
              {...commonProps}
              onClose={() => {
                // This will be handled by AdminLayout to reset activeSubmodule
                window.history.back();
              }}
            />
          );

        case "client-service":
          return (
            <ClientService
              {...commonProps}
              onBack={() => {
                window.history.back();
              }}
            />
          );
        case "sol-master":
          return (
            <SOLMaster
              {...commonProps}
              onBack={() => {
                window.history.back();
              }}
            />
          );
        case "client-contract":
        case "recruitment-request":
        case "vacancy-setup":
        case "salary-structure":
        case "client-week-off":
        case "claims-resolution":
        case "claims-resolution-list":
        case "recruitment-tracker-list":
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-3xl font-bold ${currentTheme.textPrimary}`}
                  >
                    {activeSubmodule
                      .split("-")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </h1>
                  <p className={`${currentTheme.textSecondary} mt-1`}>
                    This submodule is coming soon
                  </p>
                </div>
              </div>
              <div
                className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-12 backdrop-blur-md shadow-lg text-center`}
              >
                <div className="text-6xl mb-4">🚧</div>
                <h3
                  className={`text-xl font-semibold ${currentTheme.textPrimary} mb-2`}
                >
                  Submodule Under Development
                </h3>
                <p className={`${currentTheme.textSecondary} mb-6`}>
                  This feature will be available soon. Currently focusing on
                  Client Master.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Back to Module Overview
                </button>
              </div>
            </div>
          );

        default:
          // Fallback for unknown submodules
          return (
            <div className="space-y-6">
              <div className="text-center py-12">
                <h2
                  className={`text-2xl font-bold ${currentTheme.textPrimary} mb-4`}
                >
                  Submodule Not Found
                </h2>
                <p className={`${currentTheme.textSecondary} mb-6`}>
                  The requested submodule "{activeSubmodule}" could not be
                  found.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          );
      }
    }

    // MODULE LEVEL ROUTING
    switch (activeModule) {
      case "dashboard":
        return <DashboardOverview {...commonProps} />;

      case "client-contract-management":
        // When no submodule is selected, show the overview dashboard
        return <ClientContractDashboard {...commonProps} />;

      // Placeholder for other modules - show coming soon
      case "requisition-management":
      case "hr-payroll-management":
      case "procurement-management":
      case "billing-receivable-management":
      case "financial-accounting":
      case "fixed-assets-management":
      case "risk-control-management":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className={`text-3xl font-bold ${currentTheme.textPrimary}`}
                >
                  {activeModule
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </h1>
                <p className={`${currentTheme.textSecondary} mt-1`}>
                  This module is coming soon
                </p>
              </div>
            </div>
            <div
              className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-12 backdrop-blur-md shadow-lg text-center`}
            >
              <div className="text-6xl mb-4">🚧</div>
              <h3
                className={`text-xl font-semibold ${currentTheme.textPrimary} mb-2`}
              >
                Module Under Development
              </h3>
              <p className={`${currentTheme.textSecondary} mb-6`}>
                This business module will be available soon. Focus is currently
                on Client Contract Management.
              </p>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                Back to Dashboard
              </button>
            </div>
          </div>
        );

      default:
        return <DashboardOverview {...commonProps} />;
    }
  };

  return <div className="min-h-[calc(100vh-8rem)]">{renderModule()}</div>;
};

export default AdminRouter;
