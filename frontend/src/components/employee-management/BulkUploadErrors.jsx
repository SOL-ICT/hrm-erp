// Bulk Upload Error Display Component
import React from "react";

export default function BulkUploadErrors({ errors }) {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-red-800 mb-3">
        Upload Errors ({errors.length})
      </h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {errors.map((error, index) => (
          <div
            key={index}
            className="bg-white border border-red-300 rounded-md p-3"
          >
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Row {error.row}: {error.staff_id}
                </div>

                <div className="space-y-1">
                  {Object.entries(error.errors).map(([field, messages]) => (
                    <div key={field} className="text-sm text-red-700">
                      <span className="font-semibold">{field}:</span>{" "}
                      {Array.isArray(messages) ? messages.join(", ") : messages}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
