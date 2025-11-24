// Unmatched Staff Modal Component
import React, { useState } from "react";
import Modal from "@/components/common/Modal";

export default function UnmatchedStaffModal({
  unmatchedRows,
  onClose,
  onManualLink,
}) {
  const [selectedStaff, setSelectedStaff] = useState({});

  const handleStaffSelection = (rowIndex, staffId) => {
    setSelectedStaff((prev) => ({
      ...prev,
      [rowIndex]: staffId,
    }));
  };

  const handleSubmit = () => {
    // Pass manual links back to parent
    onManualLink(selectedStaff);
  };

  return (
    <Modal onClose={onClose}>
      <div className="max-h-[80vh] overflow-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Unmatched Staff Found
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          The following rows from your Excel file could not be automatically
          matched to staff records. Please manually select the correct staff
          member for each row, or skip to exclude them.
        </p>

        <div className="space-y-4">
          {unmatchedRows.map((row, index) => (
            <div
              key={index}
              className="border border-gray-300 rounded-lg p-4 bg-gray-50"
            >
              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div>
                  <span className="font-semibold">Row:</span> {row._row_number}
                </div>
                <div>
                  <span className="font-semibold">Staff ID:</span>{" "}
                  {row.staff_id || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">First Name:</span>{" "}
                  {row.first_name || "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Last Name:</span>{" "}
                  {row.last_name || "N/A"}
                </div>
              </div>

              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manual Staff Selection:
                </label>
                <input
                  type="text"
                  placeholder="Search and select staff (Feature: Implement staff search)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => handleStaffSelection(index, e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Note: Manual staff linking requires additional implementation
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Link & Retry Upload
          </button>
        </div>
      </div>
    </Modal>
  );
}
