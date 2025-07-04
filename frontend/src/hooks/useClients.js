// File Path: frontend/src/hooks/useClients.js
// Using existing sanctumRequest from AuthContext

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
  const { sanctumRequest } = useAuth();

  const fetchClients = async (params = initialParams) => {
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

      const response = await sanctumRequest(
        `${API_BASE}/clients?${queryParams}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setClients(data.data.data || []);
          setPagination({
            current_page: data.data.current_page,
            last_page: data.data.last_page,
            per_page: data.data.per_page,
            total: data.data.total,
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
    try {
      const response = await sanctumRequest(`${API_BASE}/clients/statistics`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStatistics(data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
    }
  };

  const createClient = async (clientData) => {
    setLoading(true);
    try {
      const response = await sanctumRequest(`${API_BASE}/clients`, {
        method: "POST",
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
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
    setLoading(true);
    try {
      const response = await sanctumRequest(`${API_BASE}/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
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
    setLoading(true);
    try {
      const response = await sanctumRequest(`${API_BASE}/clients/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
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
    try {
      const response = await sanctumRequest(
        `${API_BASE}/clients/${id}/toggle-status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchClients(); // Refresh the list
          return data;
        } else {
          throw new Error(data.message || "Failed to toggle status");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to toggle status");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const uploadLogo = async (file, clientId) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");
      if (clientId) formData.append("client_id", clientId);

      const response = await sanctumRequest(
        `${API_BASE}/utilities/upload-file`,
        {
          method: "POST",
          body: formData,
          // Don't set Content-Type header for FormData - let the browser set it
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
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

  // Fetch initial data
  useEffect(() => {
    fetchClients();
    fetchStatistics();
  }, []);

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
      fetchClients();
      fetchStatistics();
    },
  };
};

// Utility hooks for dropdown data
export const useUtilityData = () => {
  const [industryCategories, setIndustryCategories] = useState([]);
  const [clientCategories, setClientCategories] = useState([]);
  const [statesLgas, setStatesLgas] = useState([]);
  const [loading, setLoading] = useState(false);

  const { sanctumRequest } = useAuth();

  const fetchUtilityData = async () => {
    setLoading(true);
    try {
      // Fetch all utility data in parallel
      const [industriesRes, categoriesRes, statesRes] = await Promise.all([
        sanctumRequest(`${API_BASE}/utilities/industry-categories`),
        sanctumRequest(`${API_BASE}/utilities/client-categories`),
        sanctumRequest(`${API_BASE}/utilities/states-lgas`),
      ]);

      if (industriesRes.ok) {
        const data = await industriesRes.json();
        if (data.success) setIndustryCategories(data.data);
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        if (data.success) setClientCategories(data.data);
      }

      if (statesRes.ok) {
        const data = await statesRes.json();
        if (data.success) setStatesLgas(data.data);
      }
    } catch (error) {
      console.error("Error fetching utility data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUtilityData();
  }, []);

  return {
    industryCategories,
    clientCategories,
    statesLgas,
    loading,
    refetch: fetchUtilityData,
  };
};

export default useClients;
