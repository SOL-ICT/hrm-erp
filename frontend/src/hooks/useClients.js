"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = "http://localhost:8000/api";

export const useClients = (initialParams = {}) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [statistics, setStatistics] = useState({});

  // Get sanctumRequest from existing AuthContext
  const { sanctumRequest, isAuthenticated, hasRole } = useAuth();

  const fetchClients = async (params = initialParams) => {
    // Only fetch if user is authenticated and has admin role
    if (!isAuthenticated || !hasRole("admin")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        per_page: params.perPage || 15,
        search: params.search || "",
        filter: params.filter || "all",
        sort_by: params.sortBy || "created_at",
        sort_order: params.sortOrder || "desc",
        page: params.page || 1,
      });

      // FIXED: Use correct backend route
      const response = await sanctumRequest(
        `${API_BASE}/admin/clients?${queryParams}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          // Backend returns data directly, not in data.data structure
          setClients(Array.isArray(data.data) ? data.data : []);
          // Set basic pagination (backend doesn't return pagination info yet)
          setPagination({
            current_page: params.page || 1,
            last_page: 1,
            per_page: params.perPage || 15,
            total: Array.isArray(data.data) ? data.data.length : 0,
          });
        } else {
          setError(data.message || "Failed to fetch clients");
        }
      } else {
        setError("Failed to fetch clients");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    // Only fetch if user is authenticated and has admin role
    if (!isAuthenticated || !hasRole("admin")) {
      return;
    }

    try {
      // FIXED: Use correct backend route
      const response = await sanctumRequest(`${API_BASE}/admin/stats`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          setStatistics(data.data.stats || {});
        }
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  const createClient = async (clientData) => {
    if (!isAuthenticated || !hasRole("admin")) {
      throw new Error("Unauthorized");
    }

    setLoading(true);
    try {
      // FIXED: Use correct backend route
      const response = await sanctumRequest(`${API_BASE}/admin/clients`, {
        method: "POST",
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          await fetchClients(); // Refresh the list
          await fetchStatistics(); // Refresh statistics
          return data;
        } else {
          throw new Error(data.message || "Failed to create client");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create client");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateClient = async (id, clientData) => {
    if (!isAuthenticated || !hasRole("admin")) {
      throw new Error("Unauthorized");
    }

    setLoading(true);
    try {
      // FIXED: Use correct backend route (assuming it exists)
      const response = await sanctumRequest(`${API_BASE}/admin/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          await fetchClients(); // Refresh the list
          return data;
        } else {
          throw new Error(data.message || "Failed to update client");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update client");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (id) => {
    if (!isAuthenticated || !hasRole("admin")) {
      throw new Error("Unauthorized");
    }

    setLoading(true);
    try {
      // FIXED: Use correct backend route (assuming it exists)
      const response = await sanctumRequest(`${API_BASE}/admin/clients/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          await fetchClients(); // Refresh the list
          await fetchStatistics(); // Refresh statistics
          return data;
        } else {
          throw new Error(data.message || "Failed to delete client");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete client");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, status) => {
    if (!isAuthenticated || !hasRole("admin")) {
      throw new Error("Unauthorized");
    }

    try {
      const response = await sanctumRequest(`${API_BASE}/admin/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          await fetchClients(); // Refresh the list
          return data;
        } else {
          throw new Error(data.message || "Failed to update client status");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update client status");
      }
    } catch (err) {
      console.error("Error updating client status:", err);
      throw err;
    }
  };

  const uploadLogo = async (id, logoFile) => {
    if (!isAuthenticated || !hasRole("admin")) {
      throw new Error("Unauthorized");
    }

    try {
      const formData = new FormData();
      formData.append("logo", logoFile);

      const response = await fetch(`${API_BASE}/admin/clients/${id}/logo`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          await fetchClients(); // Refresh the list
          return data;
        } else {
          throw new Error(data.message || "Failed to upload logo");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload logo");
      }
    } catch (err) {
      console.error("Error uploading logo:", err);
      throw err;
    }
  };

  // Only fetch initial data if user has admin access
  useEffect(() => {
    if (isAuthenticated && hasRole("admin")) {
      fetchClients();
      fetchStatistics();
    }
  }, [isAuthenticated]);

  return {
    clients,
    loading,
    error,
    pagination,
    statistics,
    fetchClients,
    fetchStatistics,
    createClient,
    updateClient,
    deleteClient,
    toggleStatus,
    uploadLogo,
    refetch: () => {
      if (isAuthenticated && hasRole("admin")) {
        fetchClients();
        fetchStatistics();
      }
    },
  };
};

// Utility hooks for dropdown data
export const useUtilityData = () => {
  const [industryCategories, setIndustryCategories] = useState([]);
  const [clientCategories, setClientCategories] = useState([]);
  const [statesLgas, setStatesLgas] = useState([]);
  const [loading, setLoading] = useState(false);

  const { sanctumRequest, isAuthenticated } = useAuth();

  const fetchUtilityData = async () => {
    if (!isAuthenticated) {
      return;
    }

    setLoading(true);
    try {
      // Fetch all utility data in parallel
      const [industriesRes, categoriesRes, statesRes] = await Promise.all([
        sanctumRequest(`${API_BASE}/utilities/industry-categories`),
        sanctumRequest(`${API_BASE}/utilities/client-categories`),
        sanctumRequest(`${API_BASE}/states-lgas`),
      ]);

      // Process industry categories
      if (industriesRes.ok) {
        const data = await industriesRes.json();
        if (data.success) {
          setIndustryCategories(data.data || []);
        }
      }

      // Process client categories
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        if (data.success) {
          setClientCategories(data.data || []);
        }
      }

      // Process states/LGAs
      if (statesRes.ok) {
        const data = await statesRes.json();
        if (data.success) {
          setStatesLgas(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching utility data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUtilityData();
    }
  }, [isAuthenticated]);

  return {
    industryCategories,
    clientCategories,
    statesLgas,
    loading,
    refetch: fetchUtilityData,
  };
};

export default useClients;
