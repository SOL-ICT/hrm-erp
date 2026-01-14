import React, { useState } from "react";
import leaveEngineAPI from "@/services/modules/leaveEngineAPI";
import { Edit2, Trash2 } from "lucide-react";

const LeavePoliciesTab = ({ leaveTypes = [], jobStructures = [], onCreateLeaveType, onCreateJobStructure, selectedClientId, onRefreshLeaveTypes, onRefreshJobStructures }) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [levelName, setLevelName] = useState("");
  const [levelOrder, setLevelOrder] = useState(0);
  const [levelLoading, setLevelLoading] = useState(false);

  // Edit/Delete state for leave types
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [deletingTypeId, setDeletingTypeId] = useState(null);
  const [editTypeName, setEditTypeName] = useState("");
  const [editTypeCode, setEditTypeCode] = useState("");
  const [editTypeLoading, setEditTypeLoading] = useState(false);
  const [deleteTypeLoading, setDeleteTypeLoading] = useState(false);

  // Edit/Delete state for job structures
  const [editingLevelId, setEditingLevelId] = useState(null);
  const [deletingLevelId, setDeletingLevelId] = useState(null);
  const [editLevelName, setEditLevelName] = useState("");
  const [editLevelOrder, setEditLevelOrder] = useState(0);
  const [editLevelLoading, setEditLevelLoading] = useState(false);
  const [deleteLevelLoading, setDeleteLevelLoading] = useState(false);

  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreateLeaveType({ name, code });
      setName("");
      setCode("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const submitLevel = async (e) => {
    e.preventDefault();
    if (!selectedClientId) return alert('Select a client first');
    setLevelLoading(true);
    try {
      await onCreateJobStructure({ client_id: selectedClientId, name: levelName, level_order: levelOrder });
      setLevelName("");
      setLevelOrder(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLevelLoading(false);
    }
  };

  const handleEditType = async (id) => {
    setEditTypeLoading(true);
    try {
      await leaveEngineAPI.updateLeaveType(id, { name: editTypeName, code: editTypeCode });
      setEditingTypeId(null);
      onRefreshLeaveTypes?.();
    } catch (err) {
      setError(err.message || "Failed to update leave type");
      setEditTypeLoading(false);
    }
  };

  const handleDeleteType = async (id) => {
    setDeleteTypeLoading(true);
    try {
      await leaveEngineAPI.deleteLeaveType(id);
      setDeletingTypeId(null);
      onRefreshLeaveTypes?.();
    } catch (err) {
      setError(err.message || "Failed to delete leave type");
      setDeleteTypeLoading(false);
    }
  };

  const handleEditLevel = async (id) => {
    setEditLevelLoading(true);
    try {
      await leaveEngineAPI.updateStaffLevel(id, { name: editLevelName, level_order: editLevelOrder });
      setEditingLevelId(null);
      onRefreshJobStructures?.();
    } catch (err) {
      setError(err.message || "Failed to update job structure");
      setEditLevelLoading(false);
    }
  };

  const handleDeleteLevel = async (id) => {
    setDeleteLevelLoading(true);
    try {
      await leaveEngineAPI.deleteStaffLevel(id);
      setDeletingLevelId(null);
      onRefreshJobStructures?.();
    } catch (err) {
      setError(err.message || "Failed to delete job structure");
      setDeleteLevelLoading(false);
    }
  };

  const editingType = leaveTypes.find((t) => t.id === editingTypeId);
  const editingLevel = jobStructures.find((l) => l.id === editingLevelId);

  return (
    <section className="leave-policies-tab">
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-950">Leave Types (Global)</h3>
          <ul className="space-y-2">
            {leaveTypes.map((t) => (
              <li key={t.id} className="p-2 rounded border text-gray-900 flex justify-between items-center">
                <span>{t.name} {t.code ? `(${t.code})` : ""}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditTypeName(t.name);
                      setEditTypeCode(t.code || "");
                      setEditingTypeId(t.id);
                    }}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingTypeId(t.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
            {leaveTypes.length === 0 && <li className="text-sm text-gray-500">No leave types yet</li>}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-950">Create Leave Type</h3>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-950">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded text-gray-900" />
            </div>

            <div>
              <label className="block text-sm text-gray-950">Code (optional)</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-3 py-2 border rounded text-gray-900" />
            </div>

            <div>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
                {loading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-950">Job Structures (for selected client)</h3>
          <ul className="space-y-2 mb-4">
            {jobStructures.map((js) => (
              <li key={js.id} className="p-2 rounded border text-gray-900">
                <span>{js.job_code} - {js.job_title}</span>
              </li>
            ))}
            {jobStructures.length === 0 && <li className="text-sm text-gray-500">No job structures for this client</li>}
          </ul>

          <h4 className="text-sm font-medium mb-2 text-gray-950">Job Structures are managed in the organization settings</h4>
          <p className="text-sm text-gray-600 mb-4">Job structures are pre-defined in your organization. Select them when creating entitlements above.</p>
        </div>
      </div>

      {/* Edit Leave Type Modal */}
      {editingType && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 space-y-4">
            <h4 className="text-lg font-semibold text-gray-950">Edit Leave Type</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditType(editingType.id);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium text-gray-950 mb-1">Name</label>
                <input
                  type="text"
                  value={editTypeName}
                  onChange={(e) => setEditTypeName(e.target.value)}
                  className="w-full p-2 border rounded text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 mb-1">Code</label>
                <input
                  type="text"
                  value={editTypeCode}
                  onChange={(e) => setEditTypeCode(e.target.value)}
                  className="w-full p-2 border rounded text-gray-900"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={editTypeLoading}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {editTypeLoading ? "Updating..." : "Update"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTypeId(null)}
                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Leave Type Confirmation */}
      {deletingTypeId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 space-y-4">
            <h4 className="text-lg font-semibold text-gray-950">Confirm Delete</h4>
            <p className="text-gray-700">Are you sure you want to delete this leave type? This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeleteType(deletingTypeId)}
                disabled={deleteTypeLoading}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleteTypeLoading ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setDeletingTypeId(null)}
                className="flex-1 px-3 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Level Modal */}
      {editingLevel && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 space-y-4">
            <h4 className="text-lg font-semibold text-gray-950">Edit Staff Level</h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditLevel(editingLevel.id);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium text-gray-950 mb-1">Name</label>
                <input
                  type="text"
                  value={editLevelName}
                  onChange={(e) => setEditLevelName(e.target.value)}
                  className="w-full p-2 border rounded text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-950 mb-1">Level Order</label>
                <input
                  type="number"
                  value={editLevelOrder}
                  onChange={(e) => setEditLevelOrder(Number(e.target.value))}
                  className="w-full p-2 border rounded text-gray-900"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={editLevelLoading}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {editLevelLoading ? "Updating..." : "Update"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingLevelId(null)}
                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Staff Level Confirmation */}
      {deletingLevelId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 space-y-4">
            <h4 className="text-lg font-semibold text-gray-950">Confirm Delete</h4>
            <p className="text-gray-700">Are you sure you want to delete this staff level? This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeleteLevel(deletingLevelId)}
                disabled={deleteLevelLoading}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLevelLoading ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setDeletingLevelId(null)}
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

export default LeavePoliciesTab;
