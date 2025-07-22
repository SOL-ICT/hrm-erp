"use client";

import { useState } from "react";
import {
  Users,
  FileText,
  Building2,
  TrendingUp,
  Package,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import ClientMaster from "./submodules/client-master/ClientMaster";
import ClientService from "./submodules/client-service/ClientService";
import ClientContract from "./submodules/client-contract/ClientContract";

const ClientContractDashboard = ({ currentTheme, preferences, onBack }) => {
  const [selectedModule, setSelectedModule] = useState(null);

  const modules = [
    {
      id: "client-master",
      title: "Client Master",
      description: "Manage client information and profiles",
      icon: Users,
      color: "bg-blue-500",
      stats: { label: "Active Clients", value: "156" },
      component: ClientMaster,
    },
    {
      id: "client-service",
      title: "Client Service",
      description: "Service locations and request management",
      icon: Package,
      color: "bg-emerald-500",
      stats: { label: "Service Locations", value: "432" },
      component: ClientService,
    },
    {
      id: "client-contract",
      title: "Client Contract",
      description: "Contract creation and management",
      icon: FileText,
      color: "bg-purple-500",
      stats: { label: "Active Contracts", value: "89" },
      component: ClientContract,
    },
    {
      id: "salary-structure",
      title: "Salary Structure",
      description: "Define and manage salary structures",
      icon: DollarSign,
      color: "bg-orange-500",
      stats: { label: "Salary Templates", value: "24" },
      component: null, // To be implemented
    },
  ];

  const handleModuleClick = (module) => {
    setSelectedModule(module);
  };

  const handleBackToDashboard = () => {
    setSelectedModule(null);
  };

  if (selectedModule && selectedModule.component) {
    const Component = selectedModule.component;
    return (
      <Component
        currentTheme={currentTheme}
        preferences={preferences}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.background}`}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div>
              <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
                Client Contract Management
              </h1>
              <p className={`${currentTheme.textSecondary} mt-1`}>
                Manage all client-related operations and contracts
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">156</p>
                <p className="text-xs text-green-600 mt-2">
                  +12% from last month
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Contracts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">89</p>
                <p className="text-xs text-green-600 mt-2">
                  +5% from last month
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Service Locations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">432</p>
                <p className="text-xs text-green-600 mt-2">
                  +18 new this month
                </p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-lg">
                <Building2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₦45.2M</p>
                <p className="text-xs text-green-600 mt-2">
                  +8% from last month
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module) => (
            <div
              key={module.id}
              onClick={() => handleModuleClick(module)}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`${module.color} p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <module.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {module.stats.value}
                    </p>
                    <p className="text-xs text-gray-600">
                      {module.stats.label}
                    </p>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {module.title}
                </h3>
                <p className="text-gray-600 text-sm">{module.description}</p>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">Click to manage</span>
                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClientContractDashboard;
