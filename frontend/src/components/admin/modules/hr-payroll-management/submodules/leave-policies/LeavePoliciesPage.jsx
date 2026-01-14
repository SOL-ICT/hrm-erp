import React, { useEffect, useState } from "react";
import { Users, ClipboardList, Settings } from "lucide-react";
import LeaveOverviewTab from "./tabs/LeaveOverviewTab";
import LeavePoliciesTab from "./tabs/LeavePoliciesTab";
import LeaveSettingsTab from "./tabs/LeaveSettingsTab";
import leaveEngineAPI from "@/services/modules/leaveEngineAPI";
import { useAllActiveClients } from "@/hooks/useClients";

export default function LeavePoliciesPage({ currentTheme, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [jobStructures, setJobStructures] = useState([]);
  const [entitlements, setEntitlements] = useState([]);
  const [error, setError] = useState(null);
  const { clients, loading: clientsLoading, error: clientsError } = useAllActiveClients();
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: "overview", name: "Overview", icon: Users },
    { id: "policies", name: "Policies", icon: ClipboardList },
    { id: "settings", name: "Settings", icon: Settings },
  ];

  async function loadGlobalData() {
    try {
      const typesRes = await leaveEngineAPI.getLeaveTypes();
      setLeaveTypes(typesRes.data ?? typesRes);
    } catch (err) {
      console.error(err);
      setError("Failed to load leave types");
    }
  }

  async function loadAll() {
    await loadGlobalData();
    if (selectedClientId) {
      await loadClientData(selectedClientId);
    }
  }

  async function loadClientData(clientId) {
    // Clear current client-scoped data immediately so UI doesn't flash previous client's rows
    if (!clientId) {
      setJobStructures([]);
      setEntitlements([]);
      setLoading(false);
      return;
    }

    setJobStructures([]);
    setEntitlements([]);
    setLoading(true);
    try {
      const [structuresRes, entRes] = await Promise.all([
        leaveEngineAPI.getJobStructures({ client_id: clientId }),
        leaveEngineAPI.getEntitlements({ client_id: clientId }),
      ]);

      console.log("DEBUG loadClientData: structuresRes=", structuresRes, "entRes=", entRes);
      
      // Handle pagination: if response has 'data' key (paginated), use it; otherwise use the whole response
      const structuresData = structuresRes?.data ?? structuresRes;
      const entData = entRes?.data ?? entRes;
      
      console.log("DEBUG after extraction: structuresData=", structuresData, "entData=", entData);
      
      setJobStructures(Array.isArray(structuresData) ? structuresData : []);
      setEntitlements(Array.isArray(entData) ? entData : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load client-specific leave data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGlobalData();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadClientData(selectedClientId);
    }
  }, [selectedClientId]);

  const handleCreateLeaveType = async (payload) => {
    try {
      await leaveEngineAPI.createLeaveType(payload);
      await loadAll();
      setActiveTab("policies");
    } catch (err) {
      setError(err.message || "Failed to create leave type");
    }
  };

  const handleCreateStaffLevel = async (payload) => {
    try {
      await leaveEngineAPI.createStaffLevel(payload);
      await loadClientData(payload.client_id || selectedClientId);
      setActiveTab("policies");
    } catch (err) {
      setError(err.message || "Failed to create job structure");
    }
  };

  const refreshLeaveTypes = async () => {
    await loadGlobalData();
  };

  const refreshJobStructures = async () => {
    if (selectedClientId) {
      await loadClientData(selectedClientId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold ${currentTheme?.textPrimary || ""}`}>
            Leave Policies
          </h1>
          <p className={`${currentTheme?.textSecondary || ""} mt-1`}>Manage leave types, staff levels and entitlements</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            ← Back
          </button>
        )}
      </div>

      {error && <div className="p-3 rounded bg-red-50 text-red-700">{error}</div>}

      <div className={`${currentTheme?.cardBg || ""} ${currentTheme?.border || ""} rounded-xl backdrop-blur-md shadow-lg overflow-hidden`}>
        <div className="p-4 border-b">
          <label className="block text-sm font-medium mb-2 text-gray-950">Select Client</label>
          <div className="max-w-sm">
            <select
              value={selectedClientId || ""}
              onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}
              className="w-full p-2 border rounded text-gray-900"
            >
              <option value="">-- Select client --</option>
              {(clients || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.organisation_name || c.name}
                </option>
              ))}
            </select>
            {clientsLoading && <div className="text-xs text-gray-500 mt-1">Loading clients...</div>}
            {clientsError && <div className="text-xs text-red-500 mt-1">Failed to load clients</div>}
          </div>
        </div>
        <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${
                  isActive ? "bg-blue-600 text-white border-b-2 border-blue-400" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {activeTab === "overview" && (
            <LeaveOverviewTab
              leaveTypes={leaveTypes}
              jobStructures={jobStructures}
              entitlements={entitlements}
              selectedClientId={selectedClientId}
              onAction={(action) => {
                if (action === "create-job-structure") setActiveTab("policies");
                if (action === "create-leave-type") setActiveTab("policies");
                if (action === "open-entitlements") setActiveTab("settings");
              }}
            />
          )}

          {activeTab === "policies" && (
            <LeavePoliciesTab
              leaveTypes={leaveTypes}
              jobStructures={jobStructures}
              selectedClientId={selectedClientId}
              onCreateLeaveType={handleCreateLeaveType}
              onCreateJobStructure={handleCreateStaffLevel}
              onRefreshLeaveTypes={refreshLeaveTypes}
              onRefreshJobStructures={refreshJobStructures}
            />
          )}

          {activeTab === "settings" && (
            <LeaveSettingsTab
              entitlements={entitlements}
              jobStructures={jobStructures}
              leaveTypes={leaveTypes}
              selectedClientId={selectedClientId}
              onEntitlementCreated={() => loadClientData(selectedClientId)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
