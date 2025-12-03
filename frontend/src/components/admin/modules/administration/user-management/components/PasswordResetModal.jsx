import React, { useState, useEffect } from "react";
import { X, Key, Loader, AlertCircle, CheckCircle, Mail } from "lucide-react";

const PasswordResetModal = ({ isOpen, onClose, user, onResetPassword }) => {
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSendEmail(true);
      setError(null);
      setSuccess(false);
      setNewPassword(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await onResetPassword(user.id, sendEmail);
      setSuccess(true);
      setNewPassword(result.data?.temporary_password);
      
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-orange-600" />
            Reset Password
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
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <Mail className="w-3 h-3" />
              <span>{user?.email}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-medium mb-1">This will:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Generate a new temporary password</li>
                {sendEmail && <li>Send password reset email to user</li>}
                <li>User will be required to change password on login</li>
              </ul>
            </div>
          </div>

          {/* Send Email Checkbox */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="sendEmail" className="text-sm font-medium text-gray-700 cursor-pointer">
              Send email notification to user
            </label>
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
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 text-sm mb-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">Password reset successfully!</span>
              </div>
              {newPassword && (
                <div className="mt-3 p-3 bg-white border border-green-300 rounded">
                  <p className="text-xs text-gray-600 mb-1">Temporary Password:</p>
                  <p className="font-mono text-sm font-bold text-gray-900">{newPassword}</p>
                  <p className="text-xs text-gray-500 mt-2">⚠️ Save this - it won't be shown again</p>
                </div>
              )}
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
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Reset Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetModal;
