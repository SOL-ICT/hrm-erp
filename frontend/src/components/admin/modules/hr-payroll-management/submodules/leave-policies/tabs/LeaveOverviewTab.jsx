import React from "react";

const LeaveOverviewTab = ({ leaveTypes = [], jobStructures = [], entitlements = [], selectedClientId, onAction }) => {
  return (
    <section className="leave-overview-tab space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-950">Overview</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="text-sm text-gray-600">Leave Types (Global)</div>
            <div className="text-2xl font-bold text-gray-950">{leaveTypes.length}</div>
          </div>

          <div className="p-4 rounded-lg bg-gray-50">
            <div className="text-sm text-gray-600">Job Structures</div>
            <div className="text-2xl font-bold text-gray-950">{jobStructures.length}</div>
          </div>

          <div className="p-4 rounded-lg bg-gray-50">
            <div className="text-sm text-gray-600">Entitlements</div>
            <div className="text-2xl font-bold text-gray-950">{entitlements.length}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-3">
          <button onClick={() => onAction?.('create-job-structure')} disabled={!selectedClientId} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            View Job Structures
          </button>

          <button onClick={() => onAction?.('create-leave-type')} className="px-3 py-2 bg-green-600 text-white rounded">
            Create Leave Type
          </button>

          <button onClick={() => onAction?.('open-entitlements')} disabled={!selectedClientId} className="px-3 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">
            Configure Entitlements
          </button>
        </div>
      </div>

      {selectedClientId && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-950">Entitlements for Selected Client</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto border-collapse">
              <thead>
                <tr className="text-left text-gray-700 bg-gray-100">
                  <th className="p-2">Job Code</th>
                  <th className="p-2">Leave Type</th>
                  <th className="p-2">Days</th>
                  <th className="p-2">Carryover</th>
                  <th className="p-2">Max Consecutive</th>
                  <th className="p-2">Effective From</th>
                </tr>
              </thead>
              <tbody>
                {entitlements.length > 0 ? (
                  entitlements.map((e) => (
                    <tr key={e.id} className="border-t hover:bg-gray-50">
                      <td className="p-2 text-gray-900">{e.jobStructure?.job_code ?? e.job_structure?.job_code ?? e.job_structure_id}</td>
                      <td className="p-2 text-gray-900">{e.leaveType?.name ?? e.leave_type?.name ?? e.leave_type_id}</td>
                      <td className="p-2 text-gray-900 font-medium">{e.entitled_days}</td>
                      <td className="p-2 text-gray-900">{e.max_carryover_days}</td>
                      <td className="p-2 text-gray-900">{e.max_consecutive_days || "-"}</td>
                      <td className="p-2 text-gray-900">{e.effective_from}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-sm text-gray-500">
                      No entitlements configured for this client
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};

export default LeaveOverviewTab;
