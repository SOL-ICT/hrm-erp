"use client";

import { lazy } from "react";
import SmartRouteCache from "@/components/SmartRouteCache";

// Only load working modules
const DashboardOverview = lazy(() => import("./modules/DashboardOverview"));
const ClientContractDashboard = lazy(() =>
  import("./modules/client-contract-management/ClientContractDashboard")
);
const SOLMaster = lazy(() => import("./modules/administration/SOLMaster"));

//Recruitment Management
const RecruitmentDashboard = lazy(() =>
  import("./modules/recruitment-management/RecruitmentDashboard")
);

// HR & Payroll Management
const HRPayrollDashboard = lazy(() =>
  import("./modules/hr-payroll-management/HRPayrollDashboard")
);

// HR & Payroll Management Submodules
const EmployeeRecord = lazy(() =>
  import(
    "./modules/hr-payroll-management/submodules/employee-record/EmployeeRecord"
  )
);

// Invoicing Component
const InvoiceManagement = lazy(() => import("../invoicing/InvoiceManagement"));

// Direct submodule imports
const ClientMaster = lazy(() =>
  import(
    "./modules/client-contract-management/submodules/client-master/ClientMaster"
  )
);
const ClientServiceLocation = lazy(() =>
  import(
    "./modules/client-contract-management/submodules/client-service-location/ClientServiceLocation"
  )
);
const SalaryStructure = lazy(() =>
  import(
    "./modules/client-contract-management/submodules/salary-structure/SalaryStructure"
  )
);

// Recruitment Management Submodules
const RecruitmentRequest = lazy(() =>
  import(
    "./modules/recruitment-management/submodules/recruitment-request/RecruitmentRequest"
  )
);

// Check Blacklist
const CheckBlacklist = lazy(() =>
  import(
    "./modules/recruitment-management/submodules/check-blacklist/CheckBlacklist"
  )
);

// Applicants Profile (formerly Shortlisted Candidates)
const ApplicantsProfile = lazy(() =>
  import(
    "./modules/recruitment-management/submodules/applicants-profile/ApplicantsProfile"
  )
);

// Enhanced Current Vacancies (with integrated test scoring and interview scheduling)
const CurrentVacancies = lazy(() =>
  import(
    "./modules/recruitment-management/submodules/current-vacancies/CurrentVacancies"
  )
);

const InvitationToClientInterview = lazy(() =>
  import(
    "./modules/recruitment-management/submodules/interview/InvitationToClientInterview"
  )
);
const ClientInterviewFeedback = lazy(() =>
  import(
    "./modules/recruitment-management/submodules/interview/ClientInterviewFeedback"
  )
);

const Boarding = lazy(() =>
  import("./modules/recruitment-management/submodules/boarding/Boarding")
);

const AdminRouter = ({
  activeModule,
  activeSubmodule,
  activeSubSubmodule,
  currentTheme,
  preferences,
}) => {
  const renderModule = () => {
    const commonProps = {
      currentTheme,
      preferences,
      activeSubmodule,
      activeSubSubmodule,
    };

    // HANDLE SUB-SUBMODULES FIRST (for nested navigation like Screening Management)
    if (activeSubSubmodule) {
      switch (activeSubSubmodule) {
        case "shortlisted-candidates":
          return (
            <ApplicantsProfile
              {...commonProps}
              onBack={() => {
                window.history.back();
              }}
            />
          );

        case "current-vacancy-invite":
          return (
            <CurrentVacancies
              {...commonProps}
              onBack={() => {
                window.history.back();
              }}
            />
          );

        case "invitation-to-client-interview":
          return (
            <InvitationToClientInterview
              {...commonProps}
              onBack={() => {
                window.history.back();
              }}
            />
          );

        case "client-interview-feedback":
          return (
            <ClientInterviewFeedback
              {...commonProps}
              onBack={() => {
                window.history.back();
              }}
            />
          );

        default:
          break;
      }
    }

    // DIRECT SUBMODULE ROUTING - No intermediate dashboard
    if (activeSubmodule) {
      switch (activeSubmodule) {
        // CLIENT CONTRACT MANAGEMENT SUBMODULES
        case "client-master":
          return (
            <SmartRouteCache routeKey="client-master">
              <ClientMaster
                {...commonProps}
                onClose={() => {
                  // This will be handled by AdminLayout to reset activeSubmodule
                  window.history.back();
                }}
              />
            </SmartRouteCache>
          );

        case "client-service-location":
          return (
            <SmartRouteCache routeKey="client-service-location">
              <ClientServiceLocation
                {...commonProps}
                onBack={() => {
                  window.history.back();
                }}
              />
            </SmartRouteCache>
          );
        case "salary-structure":
          return (
            <SmartRouteCache routeKey="salary-structure">
              <SalaryStructure
                {...commonProps}
                onBack={() => {
                  window.history.back();
                }}
              />
            </SmartRouteCache>
          );

        // RECRUITMENT MANAGEMENT SUBMODULES
        case "recruitment-request":
          return (
            <SmartRouteCache routeKey="recruitment-request">
              <RecruitmentRequest
                {...commonProps}
                onBack={() => {
                  window.history.back();
                }}
              />
            </SmartRouteCache>
          );

        case "check-blacklist":
          return (
            <CheckBlacklist
              {...commonProps}
              onBack={() => {
                window.history.back();
              }}
            />
          );

        // Enhanced Current Vacancies - separate from current-vacancy-invite (which is under screening-management)
        case "current-vacancy":
        case "current-vacancies":
          return (
            <CurrentVacancies
              {...commonProps}
              onBack={() => {
                window.history.back();
              }}
            />
          );

        case "boarding":
          return (
            <Boarding
              {...commonProps}
              onBack={() => {
                window.history.back();
              }}
            />
          );

        // Placeholder for other recruitment submodules
        case "interview":
        case "reports":
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
                  This recruitment submodule will be available soon. Currently
                  implementing: {activeSubmodule}.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Back to Recruitment Management
                </button>
              </div>
            </div>
          );

        // Special case: screening-management parent - show its sub-submodules
        case "screening-management":
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-3xl font-bold ${currentTheme.textPrimary}`}
                  >
                    Screening Management
                  </h1>
                  <p className={`${currentTheme.textSecondary} mt-1`}>
                    Please select a screening tool from the navigation
                  </p>
                </div>
              </div>
              <div
                className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-12 backdrop-blur-md shadow-lg text-center`}
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3
                  className={`text-xl font-semibold ${currentTheme.textPrimary} mb-2`}
                >
                  Screening Management Tools
                </h3>
                <p className={`${currentTheme.textSecondary} mb-6`}>
                  Select "Applicants Profile" or "Current Vacancy Invites" from
                  the navigation menu to access screening tools.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Back to Recruitment Management
                </button>
              </div>
            </div>
          );
        case "interview":
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-3xl font-bold ${currentTheme.textPrimary}`}
                  >
                    Interview Management
                  </h1>
                  <p className={`${currentTheme.textSecondary} mt-1`}>
                    Please select an interview tool from the navigation
                  </p>
                </div>
              </div>
              <div
                className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-12 backdrop-blur-md shadow-lg text-center`}
              >
                <div className="text-6xl mb-4">🤝</div>
                <h3
                  className={`text-xl font-semibold ${currentTheme.textPrimary} mb-2`}
                >
                  Interview Management Tools
                </h3>
                <p className={`${currentTheme.textSecondary} mb-6`}>
                  Select "Invitation To Client Interview" or "Client Interview
                  Feedback" from the navigation menu.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Back to Recruitment Management
                </button>
              </div>
            </div>
          );

        // ADMINISTRATION SUBMODULES
        case "sol-master":
          return (
            <SOLMaster
              {...commonProps}
              onBack={() => {
                window.history.back();
              }}
            />
          );

        // HR & PAYROLL MANAGEMENT SUBMODULES
        case "employee-record":
          return (
            <EmployeeRecord
              {...commonProps}
              onBack={() => {
                window.history.back();
              }}
            />
          );

        case "invoicing":
          return (
            <InvoiceManagement
              {...commonProps}
              onBack={() => {
                window.history.back();
              }}
            />
          );

        // SOL MASTER handling
        default:
          if (activeSubmodule?.includes("sol")) {
            return (
              <SOLMaster
                {...commonProps}
                onBack={() => {
                  window.history.back();
                }}
              />
            );
          }

          // Handle unknown submodules
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className={`text-3xl font-bold ${currentTheme.textPrimary}`}
                  >
                    {activeSubmodule || "Unknown Module"}
                  </h1>
                  <p className={`${currentTheme.textSecondary} mt-1`}>
                    This submodule is not yet implemented
                  </p>
                </div>
              </div>
              <div
                className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl p-12 backdrop-blur-md shadow-lg text-center`}
              >
                <div className="text-6xl mb-4">❓</div>
                <h3
                  className={`text-xl font-semibold ${currentTheme.textPrimary} mb-2`}
                >
                  Submodule Not Found
                </h3>
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
        return (
          <SmartRouteCache routeKey="dashboard">
            <DashboardOverview {...commonProps} />
          </SmartRouteCache>
        );

      case "client-contract-management":
        // When no submodule is selected, show the overview dashboard
        return <ClientContractDashboard {...commonProps} />;

      case "recruitment-management":
        // NEW: Show Recruitment Dashboard when no submodule is selected
        return <RecruitmentDashboard {...commonProps} />;

      case "hr-payroll-management":
        // Show HR & Payroll Management Dashboard
        return <HRPayrollDashboard {...commonProps} />;

      // Placeholder for other modules - show coming soon
      case "claims":
      case "requisition-management":
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
                on Client Contract Management and Recruitment Management.
              </p>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                Back to Dashboard
              </button>
            </div>
          </div>
        );

      case "administration":
        return <SOLMaster {...commonProps} />;

      default:
        return <DashboardOverview {...commonProps} />;
    }
  };

  return <div className="min-h-[calc(100vh-8rem)]">{renderModule()}</div>;
};

export default AdminRouter;
