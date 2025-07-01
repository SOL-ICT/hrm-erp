// components/admin/AdminRouter.jsx
// Clean router - only working modules

"use client";

import { lazy } from "react";

// Only load working modules
const DashboardOverview = lazy(() => import("./modules/DashboardOverview"));
const ClientContractManagement = lazy(() =>
  import("./modules/client-contract-management/ClientContractDashboard")
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

    switch (activeModule) {
      case "dashboard":
        return <DashboardOverview {...commonProps} />;

      case "client-contract-management":
        return <ClientContractManagement {...commonProps} />;

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
