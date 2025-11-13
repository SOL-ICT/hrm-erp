import { useState } from "react";
import {
  Shield,
  Users,
  Settings,
  FileText,
  Building2,
  BarChart3,
  Eye,
  ArrowRight,
  Clock,
  CheckCircle,
} from "lucide-react";

const AdministrationDashboard = ({
  currentTheme,
  preferences,
  onModuleChange,
}) => {
  const [hoveredCard, setHoveredCard] = useState(null);

  // SOL Colors
  const SOL_BLUE = "#0066CC";
  const SOL_RED = "#DC3545";
  const MIDNIGHT_BLUE = "#191970";

  const administrationModules = [
    {
      id: "sol-master",
      name: "SOL Master",
      description:
        "Manage SOL offices, locations, and organizational structure",
      icon: Building2,
      color: SOL_BLUE,
      status: "active",
      stats: { offices: 12, states: 8, zones: 4 },
    },
    {
      id: "rbac-management",
      name: "Roles & Permissions",
      description: "Configure role-based access control and user permissions",
      icon: Shield,
      color: SOL_RED,
      status: "active",
      stats: { roles: 17, modules: 9, permissions: 84 },
    },
    {
      id: "user-management",
      name: "User Management",
      description: "Manage user accounts, profiles, and access rights",
      icon: Users,
      color: MIDNIGHT_BLUE,
      status: "coming-soon",
      stats: { users: 45, active: 42, pending: 3 },
    },
    {
      id: "system-settings",
      name: "System Settings",
      description: "Configure global system preferences and parameters",
      icon: Settings,
      color: "#6B7280",
      status: "coming-soon",
      stats: { configs: 23, active: 20, modified: 3 },
    },
    {
      id: "audit-logs",
      name: "Audit Logs",
      description: "View system activity logs and security audit trails",
      icon: FileText,
      color: "#059669",
      status: "coming-soon",
      stats: { logs: 1547, today: 89, alerts: 2 },
    },
  ];

  const handleModuleClick = (moduleId) => {
    // For now, provide instructions to use the sidebar navigation
    alert(
      `To access ${moduleId}, please use the Administration menu in the left sidebar and select the appropriate submodule.`
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        );
      case "coming-soon":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Coming Soon
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Settings className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
            <p className="text-gray-600">
              System administration and configuration
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900">17</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  System Modules
                </p>
                <p className="text-2xl font-bold text-gray-900">9</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-gray-900">42</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">SOL Offices</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <Building2 className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Administration Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {administrationModules.map((module) => {
          const IconComponent = module.icon;
          return (
            <div
              key={module.id}
              onClick={() => handleModuleClick(module.id)}
              onMouseEnter={() => setHoveredCard(module.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`bg-white rounded-xl border border-gray-200 p-6 cursor-pointer transition-all duration-200 ${
                module.status === "active"
                  ? "hover:shadow-lg hover:scale-105"
                  : "opacity-75 cursor-not-allowed"
              } ${
                hoveredCard === module.id
                  ? "ring-2 ring-blue-500 ring-opacity-50"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="p-3 rounded-xl"
                  style={{
                    backgroundColor: `${module.color}15`,
                  }}
                >
                  <IconComponent
                    className="w-6 h-6"
                    style={{ color: module.color }}
                  />
                </div>
                {getStatusBadge(module.status)}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {module.name}
              </h3>
              <p className="text-gray-600 text-sm mb-4">{module.description}</p>

              {/* Module Stats */}
              <div className="space-y-2">
                {Object.entries(module.stats).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-500 capitalize">{key}:</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>

              {module.status === "active" && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500 mb-2">
                    Use the Administration menu in the left sidebar →
                  </p>
                  <div className="flex items-center justify-center text-blue-600">
                    <span className="text-sm font-medium mr-1">Available</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h3>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                RBAC system initialized with 17 company roles
              </p>
              <p className="text-xs text-gray-500">2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                9 modules configured with permission structure
              </p>
              <p className="text-xs text-gray-500">5 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                84 granular permissions created successfully
              </p>
              <p className="text-xs text-gray-500">8 minutes ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdministrationDashboard;
