"use client";

import React, { useState, useEffect } from "react";
import ClientSelector from "@/components/employee-management/ClientSelector";
import employeeManagementAPI from "@/services/employeeManagementAPI";

export default function BlacklistTab({ currentTheme, preferences }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [blacklistedStaff, setBlacklistedStaff] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (selectedClient) {
      fetchBlacklistedStaff();
    }
  }, [selectedClient]);

  const fetchBlacklistedStaff = async () => {
    try {
      setLoading(true);
      const response = await employeeManagementAPI.getBlacklistedStaff(
        selectedClient.id
      );
      setBlacklistedStaff(response.data || []);
    } catch (error) {
      console.error("Error fetching blacklisted staff:", error);
      setMessage({ type: "error", text: "Failed to load blacklisted staff" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromBlacklist = async (id) => {
    if (
      !confirm("Are you sure you want to remove this staff from blacklist?")
    ) {
      return;
    }

    try {
      setLoading(true);
      await employeeManagementAPI.removeFromBlacklist(id);
      setMessage({
        type: "success",
        text: "Staff removed from blacklist successfully",
      });
      fetchBlacklistedStaff();
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to remove staff from blacklist",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = blacklistedStaff.filter((record) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.staff?.staff_id?.toLowerCase().includes(searchLower) ||
      record.staff?.first_name?.toLowerCase().includes(searchLower) ||
      record.staff?.last_name?.toLowerCase().includes(searchLower) ||
      record.reason?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`p-3 rounded-lg text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-bold text-yellow-900 flex items-center gap-2 mb-2">
          <span>⚠️</span> Blacklist Information
        </h3>
        <p className="text-sm text-yellow-800">
          This tab displays staff who have been terminated and marked for
          blacklisting. Blacklisted staff are automatically created when a
          termination record has the "Add to Blacklist" checkbox selected. The
          blacklist record contains a JSON snapshot of the staff's data at the
          time of termination.
        </p>
      </div>

      {/* Client Selector */}
      <div className={`${currentTheme.card} ${currentTheme.border} rounded-lg p-3 shadow-sm`}>
        <ClientSelector
          value={selectedClient}
          onChange={setSelectedClient}
          label="Select Client"
          required
        />
      </div>

      {selectedClient && (
        <>
          {/* Blacklist Table */}
          <div className={`${currentTheme.card} ${currentTheme.border} rounded-lg shadow-sm`}>
            <div className={`px-4 py-3 ${currentTheme.headerGradient} border-b ${currentTheme.border} rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-bold ${currentTheme.text} flex items-center gap-2`}>
                  <span>🚫</span> Blacklisted Staff
                  <span className={`ml-2 px-2.5 py-1 ${currentTheme.badge} ${currentTheme.text} text-xs font-bold rounded-full`}>
                    {filteredStaff.length}{" "}
                    {filteredStaff.length === 1 ? "record" : "records"}
                  </span>
                </h3>
                <input
                  type="text"
                  placeholder="Search by staff ID, name, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors w-96"
                />
              </div>
            </div>

            <div className="p-4">
              {loading ? (
                <p className={`text-center text-sm ${currentTheme.mutedText} py-8`}>
                  ⏳ Loading...
                </p>
              ) : filteredStaff.length === 0 ? (
                <p className={`text-center text-sm ${currentTheme.mutedText} py-8 italic`}>
                  No blacklisted staff found. Staff are added to the blacklist
                  when terminated with the "Add to Blacklist" option.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`${currentTheme.tableHeader} border-b ${currentTheme.border}`}>
                      <tr>
                        <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme.text} uppercase tracking-wider`}>
                          Staff ID
                        </th>
                        <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme.text} uppercase tracking-wider`}>
                          Name
                        </th>
                        <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme.text} uppercase tracking-wider`}>
                          Blacklist Date
                        </th>
                        <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme.text} uppercase tracking-wider`}>
                          Reason
                        </th>
                        <th className={`text-left px-4 py-3 text-xs font-bold ${currentTheme.text} uppercase tracking-wider`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredStaff.map((record) => (
                        <tr
                          key={record.id}
                          className={`${currentTheme.rowHover} transition-colors`}
                        >
                          <td className={`px-4 py-3 text-sm font-medium ${currentTheme.text}`}>
                            {record.staff?.staff_id}
                          </td>
                          <td className={`px-4 py-3 text-sm ${currentTheme.text}`}>
                            {record.staff?.first_name} {record.staff?.last_name}
                          </td>
                          <td className={`px-4 py-3 text-sm ${currentTheme.text}`}>
                            {record.blacklist_date}
                          </td>
                          <td className={`px-4 py-3 text-sm ${currentTheme.text} max-w-xs truncate`}>
                            {record.reason}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedRecord(record)}
                                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md"
                              >
                                👁️ View Details
                              </button>
                              <button
                                onClick={() =>
                                  handleRemoveFromBlacklist(record.id)
                                }
                                className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-sm hover:shadow-md"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Details Modal */}
          {selectedRecord && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className={`${currentTheme.card} rounded-lg shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col`}>
                <div className={`px-6 py-4 ${currentTheme.headerGradient} border-b ${currentTheme.border} flex items-center justify-between`}>
                  <h3 className={`text-lg font-bold ${currentTheme.text} flex items-center gap-2`}>
                    <span>🔍</span> Blacklist Record Details
                  </h3>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className={`${currentTheme.tableHeader} ${currentTheme.border} rounded-lg p-4`}>
                    <h4 className={`text-sm font-bold ${currentTheme.text} uppercase tracking-wide mb-3`}>
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className={`font-semibold ${currentTheme.text}`}>
                          Staff ID:
                        </span>
                        <span className={`ml-2 ${currentTheme.text}`}>
                          {selectedRecord.staff?.staff_id}
                        </span>
                      </div>
                      <div>
                        <span className={`font-semibold ${currentTheme.text}`}>
                          Name:
                        </span>
                        <span className={`ml-2 ${currentTheme.text}`}>
                          {selectedRecord.staff?.first_name}{" "}
                          {selectedRecord.staff?.last_name}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className={`font-semibold ${currentTheme.text}`}>
                          Blacklist Date:
                        </span>
                        <span className={`ml-2 ${currentTheme.text}`}>
                          {selectedRecord.blacklist_date}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className={`font-semibold ${currentTheme.text}`}>
                          Reason:
                        </span>
                        <p className={`mt-1 ${currentTheme.text}`}>
                          {selectedRecord.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`${currentTheme.tableHeader} ${currentTheme.border} rounded-lg p-4`}>
                    <h4 className={`text-sm font-bold ${currentTheme.text} uppercase tracking-wide mb-3`}>
                      Staff Data Snapshot (JSON)
                    </h4>
                    <pre className="p-3 bg-gray-900 text-green-400 text-xs rounded-lg overflow-x-auto border border-gray-700">
                      {JSON.stringify(selectedRecord.staff_data, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className={`px-6 py-4 ${currentTheme.tableHeader} border-t ${currentTheme.border} flex justify-end`}>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-semibold rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-sm hover:shadow-md"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
