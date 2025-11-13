import { useState } from "react";
import { Shield, ArrowLeft } from "lucide-react";

const RBACManagement = ({ currentTheme, preferences, onBack }) => {
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Administration</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Roles & Permissions Management
              </h1>
              <p className="text-gray-600">
                Configure role-based access control for the system
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              RBAC Management System
            </h2>
            <p className="text-gray-600 mb-4">
              The Role-Based Access Control system is being implemented.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  ✅ Completed:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 17 Company roles created</li>
                  <li>• 9 Modules with 21 submodules</li>
                  <li>• 84 Granular permissions configured</li>
                  <li>• Backend APIs implemented</li>
                  <li>• Database structure complete</li>
                </ul>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  🚧 In Progress:
                </h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Permission matrix interface</li>
                  <li>• Role assignment UI</li>
                  <li>• User permission overrides</li>
                  <li>• RBAC middleware integration</li>
                  <li>• Real-time permission checking</li>
                </ul>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">
                🎯 Next Steps:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-800">
                <div>
                  <h4 className="font-medium mb-1">1. Define Permissions</h4>
                  <p>
                    Assign specific permissions to each role based on department
                    functions
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">2. Implement Middleware</h4>
                  <p>Add permission checking to all routes and API endpoints</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">3. Role Assignment</h4>
                  <p>Update authentication to use the new role structure</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                📊 System Overview:
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">17</div>
                  <div className="text-xs text-gray-600">Company Roles</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">9</div>
                  <div className="text-xs text-gray-600">System Modules</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">21</div>
                  <div className="text-xs text-gray-600">Submodules</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">84</div>
                  <div className="text-xs text-gray-600">Permissions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RBACManagement;
