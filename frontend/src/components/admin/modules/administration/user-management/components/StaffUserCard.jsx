import React from "react";
import { User, Mail, BadgeCheck, Clock, Shield, Key, Eye } from "lucide-react";

const StaffUserCard = ({ user, onChangeRole, onResetPassword, onViewDetails }) => {
  const getStatusColor = (status) => {
    if (user.is_active) {
      return "bg-green-100 text-green-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const getRoleBadgeColor = (roleSlug) => {
    const colorMap = {
      'super-admin': 'bg-purple-100 text-purple-800',
      'global-admin': 'bg-purple-100 text-purple-800',
      'admin': 'bg-blue-100 text-blue-800',
      'hr': 'bg-pink-100 text-pink-800',
      'crb': 'bg-indigo-100 text-indigo-800',
      'accounts': 'bg-green-100 text-green-800',
      'control': 'bg-orange-100 text-orange-800',
      'recruitment': 'bg-cyan-100 text-cyan-800',
      'regional-manager': 'bg-violet-100 text-violet-800',
      'implant-manager': 'bg-teal-100 text-teal-800'
    };
    return colorMap[roleSlug] || 'bg-gray-100 text-gray-800';
  };

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Never';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {user.name || `${user.first_name} ${user.last_name}`}
            </h3>
            <p className="text-sm text-gray-500">{user.username || user.staff_code}</p>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {user.is_active ? '● Active' : '○ Inactive'}
        </span>
      </div>

      {/* Email */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
        <Mail className="w-4 h-4" />
        <span>{user.email}</span>
      </div>

      {/* Role & Last Login */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-gray-400" />
          {user.current_role ? (
            <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user.current_role.slug)}`}>
              {user.current_role.name}
            </span>
          ) : (
            <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
              No Role Assigned
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Last: {formatLastLogin(user.last_login_at)}</span>
        </div>
      </div>

      {/* Employee Code */}
      {user.employee_code && (
        <div className="text-xs text-gray-500 mb-4">
          <span className="font-medium">Employee Code:</span> {user.employee_code}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => onChangeRole(user)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Shield className="w-4 h-4" />
          Change Role
        </button>
        
        <button
          onClick={() => onResetPassword(user)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          title="Reset Password"
        >
          <Key className="w-4 h-4" />
        </button>

        {onViewDetails && (
          <button
            onClick={() => onViewDetails(user)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default StaffUserCard;
