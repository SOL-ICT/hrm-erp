import React, { useState } from "react";
import leaveEngineAPI from "@/services/modules/leaveEngineAPI";
import { Eye, Edit2, Trash2 } from "lucide-react";

const LeaveSettingsTab = ({ entitlements = [], jobStructures = [], leaveTypes = [], selectedClientId, onEntitlementCreated }) => {
  const [jobStructureId, setJobStructureId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [entitledDays, setEntitledDays] = useState("");
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState("");
  const [maxCarryoverDays, setMaxCarryoverDays] = useState("");
  const [renewalFrequency, setRenewalFrequency] = useState("ANNUAL");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // View/Edit/Delete state
  const [viewingId, setViewingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientId) {
      setError("No client selected");
      return;
    }
    if (!jobStructureId || !leaveTypeId || !entitledDays || !effectiveFrom) {
      setError("Fill in required fields: Job Structure, Leave Type, Days, Effective From");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        client_id: selectedClientId,
        job_structure_id: Number(jobStructureId),
        leave_type_id: Number(leaveTypeId),
        entitled_days: Number(entitledDays),
        max_consecutive_days: maxConsecutiveDays ? Number(maxConsecutiveDays) : null,
        max_carryover_days: maxCarryoverDays ? Number(maxCarryoverDays) : 0,
        renewal_frequency: renewalFrequency,
        effective_from: effectiveFrom,
        effective_to: effectiveTo || null,
        notes: notes || null,
      };

      await leaveEngineAPI.createEntitlement(payload);
      
      // Reset form
      setJobStructureId("");
      setLeaveTypeId("");
      setEntitledDays("");
      setMaxConsecutiveDays("");
      setMaxCarryoverDays("");
      setRenewalFrequency("ANNUAL");
      setEffectiveFrom("");
      setEffectiveTo("");
      setNotes("");

      onEntitlementCreated?.();
    } catch (err) {
      setError(err.message || "Failed to create entitlement");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await leaveEngineAPI.deleteEntitlement(id);
      setDeletingId(null);
      onEntitlementCreated?.();
    } catch (err) {
      setError(err.message || "Failed to delete entitlement");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdate = async (id, payload) => {
    setEditLoading(true);
    try {
      await leaveEngineAPI.updateEntitlement(id, payload);
      setEditingId(null);
      onEntitlementCreated?.();
    } catch (err) {
      setError(err.message || "Failed to update entitlement");
    } finally {
      setEditLoading(false);
    }
  };

  const viewing = entitlements.find((e) => e.id === viewingId);
  const editing = entitlements.find((e) => e.id === editingId);

  return (
    <section className="leave-settings-tab space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-950">Create Entitlement</h3>
        <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 p-4 rounded-lg max-w-2xl">
          {error && <div className="p-2 text-sm bg-red-100 text-red-700 rounded">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-950 mb-1">Job Structure *</label>
              <select
                value={jobStructureId}
                onChange={(e) => setJobStructureId(e.target.value)}
                className="w-full p-2 border rounded text-gray-900"
                required
              >
                <option value="">-- Select job structure --</option>
                {jobStructures.map((js) => (
                  <option key={js.id} value={js.id}>
                    {js.job_code} - {js.job_title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-950 mb-1">Leave Type *</label>
              <select
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
                className="w-full p-2 border rounded text-gray-900"
                required
              >
                <option value="">-- Select leave type --</option>
                {leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-950 mb-1">Entitled Days *</label>
              <input
                type="number"
                step="1"
                value={entitledDays}
                onChange={(e) => setEntitledDays(e.target.value)}
                className="w-full p-2 border rounded text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-950 mb-1">Max Consecutive Days</label>
              <input
                type="number"
                value={maxConsecutiveDays}
                onChange={(e) => setMaxConsecutiveDays(e.target.value)}
                className="w-full p-2 border rounded text-gray-900"
                placeholder="e.g. 15"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-950 mb-1">Max Carryover Days</label>
              <input
                type="number"
                step="0.01"
                value={maxCarryoverDays}
                onChange={(e) => setMaxCarryoverDays(e.target.value)}
                className="w-full p-2 border rounded text-gray-900"
                placeholder="e.g. 2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-950 mb-1">Renewal Frequency</label>
              <select
                value={renewalFrequency}
                onChange={(e) => setRenewalFrequency(e.target.value)}
                className="w-full p-2 border rounded text-gray-900"
              >
                <option value="ANNUAL">Annual</option>
                <option value="BIANNUAL">Biannual</option>
                <option value="NONE">None</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-950 mb-1">Effective From *</label>
              <input
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                className="w-full p-2 border rounded text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-950 mb-1">Effective To (optional)</label>
              <input
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
                className="w-full p-2 border rounded text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-950 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded text-gray-900"
              rows={2}
              placeholder="e.g. Requires medical certificate"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Entitlement"}
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-950">Entitlements</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto border-collapse">
            <thead>
              <tr className="text-left text-gray-700 bg-gray-100">
                <th className="p-2">Staff Level</th>
                <th className="p-2">Leave Type</th>
                <th className="p-2">Days</th>
                <th className="p-2">Effective From</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entitlements.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="p-2 text-gray-900">{e.jobStructure?.job_code ?? e.job_structure?.job_code ?? e.job_structure_id}</td>
                  <td className="p-2 text-gray-900">{e.leaveType?.name ?? e.leave_type?.name ?? e.leave_type_id}</td>
                  <td className="p-2 text-gray-900">{e.entitled_days}</td>
                  <td className="p-2 text-gray-900">{e.effective_from}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => setViewingId(e.id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(e.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(e.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {entitlements.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-3 text-sm text-gray-500">
                    No entitlements yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h4 className="text-lg font-semibold text-gray-950">Entitlement Summary</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Staff Level:</span>
                <p className="text-gray-900">{viewing.jobStructure?.job_code ?? viewing.job_structure?.job_code ?? viewing.job_structure_id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Leave Type:</span>
                <p className="text-gray-900">{viewing.leaveType?.name ?? viewing.leave_type?.name ?? viewing.leave_type_id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Entitled Days:</span>
                <p className="text-gray-900">{viewing.entitled_days}</p>
              </div>
              {viewing.max_consecutive_days && (
                <div>
                  <span className="font-medium text-gray-700">Max Consecutive:</span>
                  <p className="text-gray-900">{viewing.max_consecutive_days}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Max Carryover:</span>
                <p className="text-gray-900">{viewing.max_carryover_days}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Renewal Frequency:</span>
                <p className="text-gray-900">{viewing.renewal_frequency}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Effective From:</span>
                <p className="text-gray-900">{viewing.effective_from}</p>
              </div>
              {viewing.effective_to && (
                <div>
                  <span className="font-medium text-gray-700">Effective To:</span>
                  <p className="text-gray-900">{viewing.effective_to}</p>
                </div>
              )}
              {viewing.notes && (
                <div>
                  <span className="font-medium text-gray-700">Notes:</span>
                  <p className="text-gray-900">{viewing.notes}</p>
                </div>
              )}
            </div>
            <button onClick={() => setViewingId(null)} className="w-full px-3 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-semibold text-gray-950">Edit Entitlement</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdate(editing.id, {
                  entitled_days: Number(entitledDays) || editing.entitled_days,
                  max_consecutive_days: maxConsecutiveDays ? Number(maxConsecutiveDays) : editing.max_consecutive_days,
                  max_carryover_days: Number(maxCarryoverDays) || editing.max_carryover_days,
                  renewal_frequency: renewalFrequency,
                  effective_from: effectiveFrom || editing.effective_from,
                  effective_to: effectiveTo || editing.effective_to,
                  notes: notes || editing.notes,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium text-gray-950 mb-1">Entitled Days</label>
                <input
                  type="number"
                  step="1"
                  defaultValue={editing.entitled_days}
                  onChange={(e) => setEntitledDays(e.target.value)}
                  className="w-full p-2 border rounded text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 mb-1">Max Consecutive Days</label>
                <input
                  type="number"
                  defaultValue={editing.max_consecutive_days || ""}
                  onChange={(e) => setMaxConsecutiveDays(e.target.value)}
                  className="w-full p-2 border rounded text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 mb-1">Max Carryover Days</label>
                <input
                  type="number"
                  step="0.01"
                  defaultValue={editing.max_carryover_days || ""}
                  onChange={(e) => setMaxCarryoverDays(e.target.value)}
                  className="w-full p-2 border rounded text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 mb-1">Renewal Frequency</label>
                <select
                  defaultValue={editing.renewal_frequency}
                  onChange={(e) => setRenewalFrequency(e.target.value)}
                  className="w-full p-2 border rounded text-gray-900"
                >
                  <option value="ANNUAL">Annual</option>
                  <option value="BIANNUAL">Biannual</option>
                  <option value="NONE">None</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 mb-1">Effective From</label>
                <input
                  type="date"
                  defaultValue={editing.effective_from}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full p-2 border rounded text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 mb-1">Effective To</label>
                <input
                  type="date"
                  defaultValue={editing.effective_to || ""}
                  onChange={(e) => setEffectiveTo(e.target.value)}
                  className="w-full p-2 border rounded text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 mb-1">Notes</label>
                <textarea
                  defaultValue={editing.notes || ""}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border rounded text-gray-900"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {editLoading ? "Updating..." : "Update"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 space-y-4">
            <h4 className="text-lg font-semibold text-gray-950">Confirm Delete</h4>
            <p className="text-gray-700">Are you sure you want to delete this entitlement? This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={deleteLoading}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LeaveSettingsTab;
