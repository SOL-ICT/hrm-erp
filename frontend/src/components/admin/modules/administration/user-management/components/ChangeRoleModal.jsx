import React, { useState, useEffect } from "react";
import { X, Shield, Loader, AlertCircle, CheckCircle } from "lucide-react";

const ChangeRoleModal = ({ isOpen, onClose, user, roles, onChangeRole, loading }) => {
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedRoleId("");
      setReason("");
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRoleId) {
      setError("Please select a role");
      return;
    }

    if (user.current_role && parseInt(selectedRoleId) === user.current_role.id) {
      setError("User already has this role");
      return;
    }

    try {
      setError(null);
      await onChangeRole(user.id, selectedRoleId, reason);
      setSuccess(true);
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to change role");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Change Role
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700">User:</p>
            <p className="text-lg font-semibold text-gray-900">{user?.name || `${user?.first_name} ${user?.last_name}`}</p>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>

          {/* Current Role */}
          {user?.current_role && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Role:
              </label>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">{user.current_role.name}</span>
              </div>
            </div>
          )}

          {/* New Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              New Role: <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
              required
            >
              <option value="">Select new role...</option>
              {roles.map((role) => (
                <option 
                  key={role.id} 
                  value={role.id}
                  disabled={user?.current_role?.id === role.id}
                >
                  {role.name} {user?.current_role?.id === role.id ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Reason (Optional) */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason (optional):
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Promotion to department manager"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Role changed successfully!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Change Role
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeRoleModal;
