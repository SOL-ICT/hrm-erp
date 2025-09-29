"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";

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

      const data = await apiService.makeRequest(`/clients?${queryParams}`);

      // API service already handles response parsing and errors

      if (data.success) {
        // Backend returns data in data array with pagination info
        setClients(Array.isArray(data.data) ? data.data : []);
        // Set pagination from backend response
        setPagination(
          data.pagination || {
            current_page: params.page || 1,
            last_page: 1,
            per_page: params.perPage || 15,
            total: Array.isArray(data.data) ? data.data.length : 0,
          }
        );

        // Calculate statistics after setting clients
        setTimeout(() => {
          fetchStatistics();
        }, 100);
      } else {
        setError(data.message || "Failed to fetch clients");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    if (!isAuthenticated) {
      console.log("Skipping statistics fetch: not authenticated");
      return;
    }

    try {
      console.log("Fetching statistics from API...");
      const response = await sanctumRequest(`${API_BASE}/clients/statistics`);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        console.log("API response not ok, using fallback");
        throw new Error("API response not successful");
      }

      // Parse JSON only once
      const data = await response.json();

      if (data.success) {
        console.log("Statistics fetched successfully:", data.data);
        setStatistics(data.data);
        return;
      } else {
        console.log("API response not successful, using fallback");
        throw new Error("API response not successful");
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);

      // Fallback: Calculate statistics from the current clients data
      // Only if we have clients data to work with
      if (clients && clients.length > 0) {
        const activeClients = clients.filter(
          (client) => client.status === "active"
        ).length;
        const totalContracts = clients.reduce(
          (sum, client) => sum + (client.contracts_count || 0),
          0
        );
        const activeContracts = clients.reduce(
          (sum, client) =>
            sum +
            (client.contracts?.filter(
              (contract) => contract.status === "active"
            ).length || 0),
          0
        );

        const fallbackStats = {
          totalClients: clients.length,
          activeClients: activeClients,
          totalContracts: totalContracts,
          activeContracts: activeContracts,
        };

        console.log("Using fallback statistics:", fallbackStats);
        setStatistics(fallbackStats);
      } else {
        // Set default statistics if no client data available
        console.log("Setting default statistics");
        setStatistics({
          totalClients: 0,
          activeClients: 0,
          totalContracts: 0,
          activeContracts: 0,
        });
      }
    }
  };

  const createClient = async (clientData) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated");
    }

    setLoading(true);
    try {
      const response = await sanctumRequest(`${API_BASE}/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        throw new Error("Failed to create client");
      }

      const data = await response.json();
      if (data.success) {
        // Refresh the clients list
        fetchClients();
        return { success: true, data: data.data };
      } else {
        throw new Error(data.message || "Failed to create client");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateClient = async (id, clientData) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated");
    }

    setLoading(true);
    try {
      const response = await sanctumRequest(`${API_BASE}/clients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
      });

      if (!response.ok) {
        throw new Error("Failed to update client");
      }

      const data = await response.json();
      if (data.success) {
        // Refresh the clients list
        fetchClients();
        return { success: true, data: data.data };
      } else {
        throw new Error(data.message || "Failed to update client");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (id) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated");
    }

    setLoading(true);
    try {
      const response = await sanctumRequest(`${API_BASE}/clients/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete client");
      }

      const data = await response.json();
      if (data.success) {
        // Refresh the clients list
        fetchClients();
        return { success: true, message: "Client deleted successfully" };
      } else {
        throw new Error(data.message || "Failed to delete client");
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
      setLoading(true);

      const response = await sanctumRequest(
        `${API_BASE}/clients/${id}/toggle-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: status === "active" ? "inactive" : "active",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update status");
      }

      const result = await response.json();

      if (result.success) {
        // Update client in local state
        setClients((prev) =>
          prev.map((client) =>
            client.id === id
              ? {
                  ...client,
                  status: status === "active" ? "inactive" : "active",
                  updated_at: new Date().toISOString(),
                }
              : client
          )
        );

        // Refresh statistics
        setTimeout(() => fetchStatistics(), 100);

        return {
          success: true,
          message: result.message || "Status updated successfully",
        };
      } else {
        throw new Error(result.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating client status:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // TODO: Implement logo upload functionality if needed
  // const uploadLogo = async (id, logoFile) => {
  //   if (!isAuthenticated || !hasRole("admin")) {
  //     throw new Error("Unauthorized");
  //   }

  //   try {
  //     const formData = new FormData();
  //     formData.append("logo", logoFile);

  //     const response = await fetch(`${API_BASE}/clients/${id}/logo`, {
  //       method: "POST",
  //       credentials: "include",
  //       body: formData,
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       if (data.success) {
  //         await fetchClients(); // Refresh the list
  //         return data;
  //       } else {
  //         throw new Error(data.message || "Failed to upload logo");
  //       }
  //     } else {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || "Failed to upload logo");
  //     }
  //   } catch (err) {
  //     console.error("Error uploading logo:", err);
  //     throw err;
  //   }
  // };

  // Only fetch initial data if user has admin access
  useEffect(() => {
    if (isAuthenticated && hasRole("admin")) {
      // Add delay to prevent React Strict Mode double execution
      const timeoutId = setTimeout(() => {
        fetchClients();
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated]);

  // Fetch statistics after clients are loaded (with a slight delay for better reliability)
  useEffect(() => {
    if (isAuthenticated && hasRole("admin") && clients.length >= 0) {
      const timeoutId = setTimeout(() => {
        fetchStatistics();
      }, 1000); // 1 second delay to ensure authentication is fully established

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, clients]);

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
    // uploadLogo removed as per requirements
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
      // Stagger requests to prevent overwhelming the backend (instead of Promise.all)
      // This fixes the ERR_CONNECTION_RESET issue in development

      // Fetch industry categories first
      const industriesRes = await sanctumRequest(
        `${API_BASE}/utilities/industry-categories`
      );
      if (industriesRes.ok) {
        const data = await industriesRes.json();
        if (data.success) {
          setIndustryCategories(data.data || []);
        }
      }

      // Small delay before next request
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Fetch client categories
      const categoriesRes = await sanctumRequest(
        `${API_BASE}/utilities/client-categories`
      );
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        if (data.success) {
          setClientCategories(data.data || []);
        }
      }

      // Small delay before next request
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Fetch states/LGAs
      const statesRes = await sanctumRequest(`${API_BASE}/states-lgas`);
      if (statesRes.ok) {
        const data = await statesRes.json();
        if (data.success) {
          setStatesLgas(data.data || []);
        }
      }
    } catch (err) {
      console.error("Error fetching utility data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Add a small delay to prevent React Strict Mode double execution issues
      const timeoutId = setTimeout(() => {
        fetchUtilityData();
      }, 200);

      return () => clearTimeout(timeoutId);
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
