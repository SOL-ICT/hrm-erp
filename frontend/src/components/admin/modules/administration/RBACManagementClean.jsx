"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Helper function to safely parse response with retry logic
const safeApiCall = async (sanctumRequestFn, url, options = {}) => {
  console.log(`🌐 safeApiCall: Making ${options.method || 'GET'} request to ${url}`);
  console.log(`🌐 safeApiCall: Options:`, options);
  
  try {
    const response = await sanctumRequestFn(url, options);
    console.log(`🌐 safeApiCall: Got response, status=${response.status}, ok=${response.ok}`);

    // Try to parse response
    if (response.ok) {
      console.log(`🌐 safeApiCall: Response OK, parsing JSON...`);
      try {
        const jsonData = await response.json();
        console.log(`🌐 safeApiCall: JSON parsed successfully:`, jsonData);
        return jsonData;
      } catch (jsonError) {
        console.warn(
          "Response body already consumed, making fresh request:",
          jsonError
        );
        // Make a fresh request if the response body was already consumed
        const freshResponse = await sanctumRequestFn(url, {
          ...options,
          _retry: true,
        });
        return await freshResponse.json();
      }
    } else {
      // Handle error response
      let errorData;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        // Make fresh request for error details
        const freshResponse = await sanctumRequestFn(url, {
          ...options,
          _retry: true,
        });
        errorData = await freshResponse
          .json()
          .catch(() => ({ message: "Unknown error" }));
      }
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }
  } catch (error) {
    if (error.message?.includes("body") || error.message?.includes("clone")) {
      console.warn("Retrying API call due to response body issue:", error);
      const freshResponse = await sanctumRequestFn(url, {
        ...options,
        _retry: true,
      });
      return await freshResponse.json();
    }
    throw error;
  }
};

const RBACManagement = ({ currentTheme, preferences }) => {
  const { sanctumRequest } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // State for RBAC data
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [originalApiResponse, setOriginalApiResponse] = useState(null); // Store original API response for conversion
  const [allModulesStructure, setAllModulesStructure] = useState(null); // Store complete modules/submodules/permissions structure
  const [saving, setSaving] = useState(false);
  const [expandedModule, setExpandedModule] = useState(null);

  // Permission types
  const PERMISSION_TYPES = ["read", "write", "delete", "full"];

  // Use the actual navigation modules (matching AdminNavigation.jsx exactly)
  const navigationModules = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: "📊",
      type: "single",
      description: "Main administrative dashboard",
    },
    {
      id: "client-contract-management",
      name: "Contract Management Module",
      icon: "📋",
      type: "module",
      description: "Client relationships and contracts",
      submodules: [
        { id: "client-master", name: "Master Setup" },
        { id: "service-location", name: "Service Location" },
        { id: "job-function-setup", name: "Job Function Setup" },
      ],
    },
    {
      id: "recruitment-management",
      name: "Recruitment Mgt.",
      icon: "👥",
      type: "module",
      description: "Recruitment and candidate management",
      submodules: [
        { id: "vacancy-declaration", name: "Vacancy Declaration" },
        { id: "check-blacklist", name: "Check Blacklist" },
        { id: "screening-management", name: "Screening Management" },
        { id: "interview", name: "Interview" },
        { id: "boarding", name: "Boarding" },
        { id: "reports", name: "Reports" },
      ],
    },
    {
      id: "hr-payroll-management",
      name: "HR & Payroll Mgt.",
      icon: "💼",
      type: "module",
      description: "Human resources and payroll management",
      submodules: [
        { id: "employee-record", name: "Employee Record" },
        { id: "employee-management", name: "Employee Management" },
        { id: "payroll-processing", name: "Payroll Processing" },
        { id: "attendance-tracking", name: "Attendance Tracking" },
        { id: "leave-management", name: "Leave Management" },
        { id: "performance-review", name: "Performance Review" },
        { id: "invoicing", name: "Invoicing" },
      ],
    },
    {
      id: "claims",
      name: "Claims",
      icon: "⚖️",
      type: "module",
      description: "Claims resolution and management",
      submodules: [
        { id: "claims-resolution", name: "Claims Resolution" },
        { id: "claims-resolution-list", name: "Claims Resolution List" },
        { id: "policy-management", name: "Policy Management" },
      ],
    },
    {
      id: "requisition-management",
      name: "Requisition Mgt.",
      icon: "📝",
      type: "module",
      description: "Staff requisition and approvals",
      submodules: [
        { id: "create-requisition", name: "Create Requisition" },
        { id: "approve-requisition", name: "Approve Requisition" },
        { id: "requisition-history", name: "Requisition History" },
      ],
    },
    {
      id: "procurement-management",
      name: "Procurement Mgt.",
      icon: "📦",
      type: "module",
      description: "Procurement and vendor management",
      submodules: [
        { id: "vendor-management", name: "Vendor Management" },
        { id: "purchase-orders", name: "Purchase Orders" },
        { id: "inventory-tracking", name: "Inventory Tracking" },
      ],
    },
    {
      id: "business-development",
      name: "Business Development",
      icon: "📈",
      type: "module",
      description: "Business growth and development",
      submodules: [
        { id: "lead-management", name: "Lead Management" },
        { id: "opportunity-tracking", name: "Opportunity Tracking" },
        { id: "market-analysis", name: "Market Analysis" },
      ],
    },
    {
      id: "administration",
      name: "Administration",
      icon: "⚙️",
      type: "module",
      description: "System administration and settings",
      submodules: [
        { id: "sol-master", name: "SOL Master" },
        { id: "user-management", name: "User Management" },
        { id: "rbac-management", name: "Roles & Permissions" },
        { id: "system-settings", name: "System Settings" },
        { id: "audit-logs", name: "Audit Logs" },
      ],
    },
  ];

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await loadAllModulesStructure();
      await loadRoles();
    };
    loadData();
  }, []);

  const loadAllModulesStructure = async () => {
    try {
      console.log("📦 Loading complete modules structure...");
      const data = await safeApiCall(
        sanctumRequest,
        `${process.env.NEXT_PUBLIC_API_URL}/admin/rbac/modules`
      );

      if (data.success) {
        setAllModulesStructure(data.data);
        console.log("✅ Loaded complete modules structure:", data.data);
        console.log("✅ Total modules loaded:", data.data?.length);
      } else {
        console.error("❌ Failed to load modules structure:", data);
      }
    } catch (err) {
      console.error("❌ Error loading modules structure:", err);
    }
  };

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await safeApiCall(
        sanctumRequest,
        `${process.env.NEXT_PUBLIC_API_URL}/admin/rbac/roles`
      );

      if (data.success) {
        setRoles(data.data || []);
        // Auto-select first role if available
        if (data.data && data.data.length > 0) {
          setSelectedRole(data.data[0]);
          loadRolePermissions(data.data[0].id);
        }
      } else {
        throw new Error(data.message || "Failed to load roles");
      }
    } catch (err) {
      console.error("Error loading roles:", err);
      setError("Failed to load roles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async (roleId) => {
    try {
      const data = await safeApiCall(
        sanctumRequest,
        `${process.env.NEXT_PUBLIC_API_URL}/admin/rbac/roles/${roleId}/permissions`
      );

      if (data.success) {
        const apiPermissions = data.data?.permissions || {};
        const transformedPermissions = {};

        console.log("Raw API response:", apiPermissions);
        console.log("API response type:", typeof apiPermissions);
        console.log("API response keys:", Object.keys(apiPermissions));

        // Store original API response for later conversion
        setOriginalApiResponse(apiPermissions);

        // IMPORTANT: Clear existing permissions before transformation
        // This ensures removed permissions don't persist in state
        console.log("🔄 Clearing existing permissions state before reload...");
        setPermissions({});

        // Transform the backend response to match expected frontend format
        // Backend returns: { moduleSlug: [ {permission1}, {permission2}, ... ] }
        // Frontend expects: { submoduleId: { read: true, write: false, ... } }

        // First pass: collect all backend permissions by submodule
        const backendPermissionsBySubmodule = {};

        Object.keys(apiPermissions).forEach((moduleSlug) => {
          const modulePermissions = apiPermissions[moduleSlug];

          if (Array.isArray(modulePermissions)) {
            modulePermissions.forEach((permission) => {
              // Try multiple ways to get submodule ID
              const submoduleId =
                permission.submodule?.id || permission.submodule_id;
              const backendPermissionName = permission.name?.toLowerCase();

              console.log(`Processing permission:`, {
                submoduleId,
                submodule_id: permission.submodule_id,
                nested_submodule_id: permission.submodule?.id,
                permissionName: permission.name,
                lowercaseName: backendPermissionName,
              });

              if (submoduleId && backendPermissionName) {
                if (!backendPermissionsBySubmodule[submoduleId]) {
                  backendPermissionsBySubmodule[submoduleId] = [];
                }
                backendPermissionsBySubmodule[submoduleId].push(
                  backendPermissionName
                );
              }
            });
          }
        });

        // Create mappings for frontend compatibility
        const submoduleSlugToId = {};
        const moduleToSubmoduleId = {}; // For single modules like dashboard

        // Map frontend module IDs to backend module slugs
        const frontendToBackendModuleMap = {
          "recruitment-management": "recruitment",
          "hr-payroll-management": "hr-payroll",
          "requisition-management": "requisition",
          "procurement-management": "procurement",
          "business-development": "business-development",
          "client-contract-management": "client-contract-management",
          dashboard: "dashboard",
          claims: "claims",
          administration: "administration",
        };

        console.log(
          "🔍 CREATING MAPPINGS - API Permissions keys:",
          Object.keys(apiPermissions)
        );

        Object.keys(apiPermissions).forEach((moduleSlug) => {
          const modulePermissions = apiPermissions[moduleSlug];
          console.log(
            `🔍 Processing module: ${moduleSlug}, type: ${typeof modulePermissions}, isArray: ${Array.isArray(
              modulePermissions
            )}`
          );

          if (Array.isArray(modulePermissions)) {
            console.log(
              `  - Module ${moduleSlug} has ${modulePermissions.length} permissions`
            );

            modulePermissions.forEach((permission, index) => {
              if (index < 2) {
                // Only log first 2 permissions per module to avoid spam
                console.log(`  - Permission ${index}:`, {
                  submodule_id: permission.submodule_id,
                  nested_submodule_id: permission.submodule?.id,
                  submodule_slug: permission.submodule?.slug,
                  module_slug: permission.submodule?.module?.slug,
                  permission_name: permission.name,
                });
              }

              const submoduleId =
                permission.submodule?.id || permission.submodule_id;
              const submoduleSlug = permission.submodule?.slug;
              const moduleSlugFromSubmodule =
                permission.submodule?.module?.slug;

              if (submoduleId && submoduleSlug) {
                submoduleSlugToId[submoduleSlug] = submoduleId;

                // For single modules, map module slug to its submodule ID
                if (moduleSlugFromSubmodule) {
                  if (!moduleToSubmoduleId[moduleSlugFromSubmodule]) {
                    moduleToSubmoduleId[moduleSlugFromSubmodule] = submoduleId;
                  }
                }
              }
            });
          }
        });

        // Add frontend-to-backend mappings
        Object.keys(frontendToBackendModuleMap).forEach((frontendModuleId) => {
          const backendModuleSlug =
            frontendToBackendModuleMap[frontendModuleId];
          if (moduleToSubmoduleId[backendModuleSlug]) {
            moduleToSubmoduleId[frontendModuleId] =
              moduleToSubmoduleId[backendModuleSlug];
            console.log(
              `🔍 Added frontend mapping: ${frontendModuleId} -> ${moduleToSubmoduleId[backendModuleSlug]} (via ${backendModuleSlug})`
            );
          }
        });

        console.log("🔍 FINAL MAPPINGS:");
        console.log("  Submodule slug to ID mapping:", submoduleSlugToId);
        console.log("  Module to submodule ID mapping:", moduleToSubmoduleId);

        // Second pass: transform to frontend format (both by ID and slug)
        Object.keys(backendPermissionsBySubmodule).forEach((submoduleId) => {
          const backendPerms = backendPermissionsBySubmodule[submoduleId];
          const permissionSet = {};

          // Map individual permissions
          if (backendPerms.includes("read")) {
            permissionSet["read"] = true;
          }
          if (backendPerms.includes("delete")) {
            permissionSet["delete"] = true;
          }

          // Map write permissions
          if (
            backendPerms.includes("create") ||
            backendPerms.includes("update")
          ) {
            permissionSet["write"] = true;
          }

          // Map full permissions (if has all CRUD operations)
          if (
            backendPerms.includes("read") &&
            backendPerms.includes("create") &&
            backendPerms.includes("update") &&
            backendPerms.includes("delete")
          ) {
            permissionSet["full"] = true;
          }

          // Store by numeric ID
          transformedPermissions[submoduleId] = permissionSet;

          // Also store by slug for frontend compatibility
          const matchingSlug = Object.keys(submoduleSlugToId).find(
            (slug) => submoduleSlugToId[slug] == submoduleId
          );
          if (matchingSlug) {
            transformedPermissions[matchingSlug] = permissionSet;
          }

          // Also store by module slug for single modules
          const matchingModule = Object.keys(moduleToSubmoduleId).find(
            (moduleSlug) => moduleToSubmoduleId[moduleSlug] == submoduleId
          );
          if (matchingModule) {
            transformedPermissions[matchingModule] = permissionSet;

            // Also store by frontend module ID if mapping exists
            const frontendModuleId = Object.keys(
              frontendToBackendModuleMap
            ).find(
              (frontendId) =>
                frontendToBackendModuleMap[frontendId] === matchingModule
            );
            if (frontendModuleId) {
              transformedPermissions[frontendModuleId] = permissionSet;
            }
          }
        });

        // CRITICAL FIX: Add ALL submodules from allModulesStructure with false values
        // This ensures disabled submodules (with zero permissions) are explicitly set to false
        if (allModulesStructure && allModulesStructure.length > 0) {
          console.log("🔧 ADDING DISABLED SUBMODULES to state...");
          let addedCount = 0;
          
          allModulesStructure.forEach(module => {
            module.submodules?.forEach(submodule => {
              const numericKey = String(submodule.id);
              const slugKey = submodule.slug;
              
              // If this submodule is NOT in transformedPermissions, add it with all false
              if (!transformedPermissions[numericKey]) {
                transformedPermissions[numericKey] = {
                  read: false,
                  write: false,
                  delete: false,
                  full: false
                };
                transformedPermissions[slugKey] = {
                  read: false,
                  write: false,
                  delete: false,
                  full: false
                };
                addedCount++;
                console.log(`  ➕ Added disabled submodule: ${submodule.slug} (ID: ${submodule.id})`);
              }
            });
          });
          
          console.log(`✅ Added ${addedCount} disabled submodules to state`);
        } else {
          console.warn("⚠️ allModulesStructure not available - cannot add disabled submodules");
        }

        setPermissions(transformedPermissions);

        console.log(`🔍 TRANSFORMATION RESULT for role ${roleId}:`);
        console.log(
          "  Total submodules transformed:",
          Object.keys(transformedPermissions).length
        );
        console.log(
          "  First 3 submodules:",
          Object.keys(transformedPermissions).slice(0, 3)
        );
        if (Object.keys(transformedPermissions).length > 0) {
          const firstSubmodule = Object.keys(transformedPermissions)[0];
          console.log(
            `  Sample submodule ${firstSubmodule}:`,
            transformedPermissions[firstSubmodule]
          );
        }
        console.log("  Full transformed permissions:", transformedPermissions);
        console.log(
          "  🎯 NEW PERMISSIONS STATE SET - this should clear unchecked permissions"
        );

        // Debug SUBMODULES
        console.log("🔍 SUBMODULE DEBUG:");
        const debugSubmodules = [
          {
            frontend: "vacancy-declaration",
            name: "Vacancy Declaration",
            parentModule: "recruitment",
          },
          {
            frontend: "service-location",
            name: "Service Location",
            parentModule: "client-contract-management",
          },
          {
            frontend: "job-function-setup",
            name: "Job Function Setup",
            parentModule: "client-contract-management",
          },
        ];

        debugSubmodules.forEach((submodule) => {
          console.log(`  ${submodule.name} (${submodule.frontend}):`);
          console.log(
            `    - In transformedPermissions: ${!!transformedPermissions[
              submodule.frontend
            ]}`
          );
          console.log(
            `    - Parent module exists: ${!!apiPermissions[
              submodule.parentModule
            ]}`
          );

          if (apiPermissions[submodule.parentModule]) {
            const parentPerms = apiPermissions[submodule.parentModule];
            const submodulePerms = parentPerms.filter(
              (p) =>
                p.submodule?.slug === submodule.frontend ||
                p.submodule?.slug === submodule.frontend.replace("-", "_") ||
                p.submodule?.name
                  ?.toLowerCase()
                  .includes(submodule.name.toLowerCase().split(" ")[0])
            );
            console.log(
              `    - Found ${submodulePerms.length} permissions in parent module`
            );
            if (submodulePerms.length > 0) {
              console.log(
                `    - Submodule ID: ${submodulePerms[0].submodule?.id}`
              );
              console.log(
                `    - Submodule slug: ${submodulePerms[0].submodule?.slug}`
              );
            }
          }
        });
      }
    } catch (err) {
      console.error("Error loading role permissions:", err);
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setPermissions({});
    loadRolePermissions(role.id);
  };

  const handlePermissionChange = (
    moduleId,
    submoduleId,
    permissionType,
    checked
  ) => {
    console.log(`📝 Permission change: moduleId=${moduleId}, submoduleId=${submoduleId}, type=${permissionType}, checked=${checked}`);
    
    setPermissions((prev) => {
      const newPermissions = { ...prev };
      
      // If this is a module-level change (submoduleId is null), update module AND all its submodules
      if (!submoduleId) {
        // Update the module key
        newPermissions[moduleId] = {
          ...newPermissions[moduleId],
          [permissionType]: checked,
        };
        
        // CRITICAL: Use allModulesStructure instead of navigationModules
        // because navigationModules might not include newly re-enabled modules
        if (allModulesStructure) {
          // Find this module by slug in allModulesStructure
          const moduleData = allModulesStructure.find(m => m.slug === moduleId);
          
          if (moduleData && moduleData.submodules && Array.isArray(moduleData.submodules)) {
            console.log(`  📋 Found ${moduleData.submodules.length} submodules for module "${moduleId}" in allModulesStructure`);
            
            // Update all submodule keys - both slug-based AND numeric ID-based keys
            moduleData.submodules.forEach(submodule => {
              const submoduleSlug = submodule.slug;
              const numericKey = String(submodule.id);
              
              console.log(`    🔄 Updating submodule "${submoduleSlug}" (ID: ${numericKey}) to ${checked}`);
              
              // Update the slug-based key
              newPermissions[submoduleSlug] = {
                ...newPermissions[submoduleSlug],
                [permissionType]: checked,
              };
              
              // Update the numeric ID key (CRITICAL for saving)
              newPermissions[numericKey] = {
                ...(newPermissions[numericKey] || {}),
                [permissionType]: checked,
              };
            });
          } else {
            console.warn(`  ⚠️ Could not find module "${moduleId}" in allModulesStructure`);
          }
        } else {
          console.warn(`  ⚠️ allModulesStructure not available, falling back to navigationModules`);
          
          // Fallback to navigationModules if allModulesStructure not loaded
          const module = navigationModules.find(m => m.id === moduleId);
          if (module && module.submodules) {
            module.submodules.forEach(submodule => {
              newPermissions[submodule.id] = {
                ...newPermissions[submodule.id],
                [permissionType]: checked,
              };
            });
          }
        }
      } else {
        // Submodule-level change only - update both slug key AND numeric ID key
        console.log(`  🔧 Submodule-level change for "${submoduleId}"`);
        
        // Update the slug-based key
        newPermissions[submoduleId] = {
          ...newPermissions[submoduleId],
          [permissionType]: checked,
        };
        
        // CRITICAL: Also find and update the numeric ID key for this specific submodule
        if (allModulesStructure) {
          let foundNumericKey = false;
          
          allModulesStructure.forEach(module => {
            if (module.submodules && Array.isArray(module.submodules)) {
              module.submodules.forEach(submodule => {
                if (submodule.slug === submoduleId) {
                  const numericKey = String(submodule.id);
                  console.log(`  ✅ Found numeric ID ${numericKey} for submodule "${submoduleId}"`);
                  
                  newPermissions[numericKey] = {
                    ...(newPermissions[numericKey] || {}),
                    [permissionType]: checked,
                  };
                  foundNumericKey = true;
                }
              });
            }
          });
          
          if (!foundNumericKey) {
            console.warn(`  ⚠️ Could not find numeric ID for submodule "${submoduleId}" in allModulesStructure`);
          }
        } else {
          console.warn(`  ⚠️ allModulesStructure not available for submodule-level change`);
        }
      }
      
      return newPermissions;
    });
  };

  const handleSavePermissions = async () => {
    console.log("🚀 SAVE BUTTON CLICKED!");
    console.log("🚀 Selected Role:", selectedRole);
    
    if (!selectedRole) {
      console.error("❌ No role selected, aborting save");
      return;
    }

    try {
      console.log("🔄 Setting saving state to true...");
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Backend expects: permissions: [257, 258, 259, ...] (array of permission IDs)
      // Convert our boolean permissions to permission ID array
      console.log("🔧 CONVERTING TO PERMISSION ID ARRAY");
      console.log("🔧 allModulesStructure available:", !!allModulesStructure);
      console.log("🔧 Current permissions state:", permissions);

      if (!allModulesStructure) {
        console.error("❌ CRITICAL: allModulesStructure is null/undefined!");
        console.error("❌ This means complete module structure was never loaded");
        throw new Error(
          "Cannot save permissions - complete module structure not available"
        );
      }

      console.log("✅ allModulesStructure exists, proceeding with conversion...");
      const enabledPermissionIds = [];

      // CRITICAL: Use allModulesStructure instead of originalApiResponse
      // This ensures we check ALL permissions, even for modules that were previously disabled
      allModulesStructure.forEach((module) => {
        const moduleSlug = module.slug;
        
        if (module.submodules && Array.isArray(module.submodules)) {
          module.submodules.forEach((submodule) => {
            const submoduleId = submodule.id;
            
            if (submodule.permissions && Array.isArray(submodule.permissions)) {
              submodule.permissions.forEach((permission) => {
                const permissionName = permission.name?.toLowerCase();
                const permissionId = permission.id;

                if (permissionId && permissionName) {
                  // Check if this permission should be enabled based on our current state
                  let shouldEnable = false;

                  // CRITICAL: Check ONLY submodule-specific keys (numeric ID and slug)
                  // Do NOT use module-level key as fallback, as that would enable all submodules
                  // even when individual submodules are disabled
                  const possibleKeys = [
                    String(submoduleId),  // Numeric ID as string (MOST IMPORTANT)
                    submodule.slug,       // Submodule slug (SECONDARY)
                  ];

                  for (const key of possibleKeys) {
                    if (permissions[key]) {
                      const permState = permissions[key];
                      if (typeof permState === "object") {
                        // Map permission names to frontend types
                        const frontendPermType = {
                          read: "read",
                          create: "write",
                          update: "write",
                          delete: "delete",
                        }[permissionName];

                        if (frontendPermType && permState[frontendPermType]) {
                          shouldEnable = true;
                          // Debug: Log which key/permission enabled this
                          if (moduleSlug === 'claims' || moduleSlug === 'client-contract-management') {
                            console.log(`  ✅ ENABLED: ${moduleSlug}.${submodule.slug}.${permissionName} (ID: ${permissionId}) via key="${key}"`);
                          }
                          break;
                        } else if ((moduleSlug === 'claims' || moduleSlug === 'client-contract-management') && frontendPermType) {
                          console.log(`  ⏭️ SKIPPED: ${moduleSlug}.${submodule.slug}.${permissionName} via key="${key}", ${frontendPermType}=${permState[frontendPermType]}`);
                        }
                      } else if (permState) {
                        shouldEnable = true;
                        break;
                      }
                    } else if (moduleSlug === 'claims' || moduleSlug === 'client-contract-management') {
                      console.log(`  ❓ KEY NOT FOUND: "${key}" for ${moduleSlug}.${submodule.slug}.${permissionName}`);
                    }
                  }

                  if (shouldEnable) {
                    enabledPermissionIds.push(permissionId);
                  }
                }
              });
            }
          });
        }
      });

      console.log("🔧 Generated permission IDs array:", enabledPermissionIds);
      console.log("🔧 Total permissions to save:", enabledPermissionIds.length);
      console.log("🔧 DETAILED PERMISSION BREAKDOWN:");
      console.log("   - Claims permissions in enabledPermissionIds:", 
        enabledPermissionIds.filter(id => {
          // Find this permission in originalApiResponse to check if it's Claims
          for (const moduleSlug of Object.keys(originalApiResponse)) {
            const modulePerms = originalApiResponse[moduleSlug];
            if (Array.isArray(modulePerms)) {
              const found = modulePerms.find(p => p.id === id);
              if (found && moduleSlug === 'claims') {
                return true;
              }
            }
          }
          return false;
        })
      );

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/rbac/roles/${selectedRole.id}/permissions`;
      const requestBody = { permissions: enabledPermissionIds };
      
      console.log("📡 API URL:", apiUrl);
      console.log("📡 Request Body:", JSON.stringify(requestBody));
      console.log("📡 About to make PUT request to backend...");

      const data = await safeApiCall(
        sanctumRequest,
        apiUrl,
        {
          method: "PUT",
          body: JSON.stringify(requestBody),
        }
      );
      
      console.log("📡 PUT request completed!");

      console.log("🎉 Save API Response:", data);
      console.log("🎉 Response type:", typeof data);
      console.log("🎉 Response keys:", Object.keys(data || {}));

      if (data.success) {
        setSuccess("Permissions updated successfully!");
        console.log("✅ Permissions saved successfully!");
        console.log("✅ Server returned:", data);

        // DON'T reload - trust the save was successful
        // Reloading causes the UI to reset because of async timing issues
        setTimeout(() => {
          setSuccess(null);
        }, 2000);
      } else {
        console.error("❌ Save failed:", data);
        throw new Error(data.message || "Failed to update permissions");
      }
    } catch (err) {
      console.error("❌❌❌ ERROR SAVING PERMISSIONS ❌❌❌");
      console.error("Error object:", err);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      setError(`Failed to save permissions: ${err.message || 'Unknown error'}`);
    } finally {
      console.log("🏁 Save operation finished, setting saving=false");
      setSaving(false);
    }
  };

  const isPermissionChecked = (moduleId, submoduleId, permissionType) => {
    // Map frontend submodule IDs to backend submodule IDs/slugs and numeric IDs
    const frontendToBackendSubmoduleMap = {
      // Module mappings only (submodules now use correct database slugs)
      "recruitment-management": "recruitment", // ID: 69
      "hr-payroll-management": "hr-payroll", // ID: 75
      "requisition-management": "requisition", // ID: 84
      "procurement-management": "procurement", // ID: 87
    };

    // Direct numeric ID mappings from console logs
    const frontendToNumericIdMap = {
      "vacancy-declaration": "69", // Vacancy Declaration
      "service-location": "67", // Service Location
      "job-function-setup": "68", // Job Function Setup
      "recruitment-management": "69", // Recruitment module -> first submodule ID
      "hr-payroll-management": "75", // HR Payroll -> first submodule ID
      "requisition-management": "84", // Requisition -> first submodule ID
      "procurement-management": "87", // Procurement -> first submodule ID
    };

    let key = submoduleId || moduleId;

    // Try to map the frontend ID to backend ID first
    if (frontendToBackendSubmoduleMap[key]) {
      key = frontendToBackendSubmoduleMap[key];
    }

    // If still not found, try different key combinations including numeric IDs
    if (!permissions[key]) {
      const originalKey = submoduleId || moduleId;
      const possibleKeys = [
        key,
        frontendToBackendSubmoduleMap[originalKey],
        frontendToNumericIdMap[originalKey],
        submoduleId,
        moduleId,
        frontendToBackendSubmoduleMap[submoduleId],
        frontendToBackendSubmoduleMap[moduleId],
        frontendToNumericIdMap[submoduleId],
        frontendToNumericIdMap[moduleId],
      ].filter(Boolean);

      for (const possibleKey of possibleKeys) {
        if (permissions[possibleKey]) {
          key = possibleKey;
          break;
        }
      }
    }

    const result = permissions[key]?.[permissionType] || false;

    // TARGETED LOGGING: Only log client-master checks
    if (submoduleId === "client-master") {
      console.log(
        `🔍 CLIENT-MASTER CHECK: moduleId=${moduleId}, submoduleId=${submoduleId}, type=${permissionType}`
      );
      console.log(`  Final key used: "${key}"`);
      console.log(`  Permissions state has key?`, key in permissions);
      console.log(`  Permissions for key:`, permissions[key]);
      console.log(`  Result: ${result}`);
      console.log(`  All permission keys:`, Object.keys(permissions).filter(k => k.includes('66') || k.includes('client')));
    }

    return result;
  };

  const toggleModuleExpansion = (moduleId) => {
    setExpandedModule((prev) => (prev === moduleId ? null : moduleId));
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RBAC data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Role-Based Access Control
        </h1>
        <p className="text-gray-600 mt-2">
          Configure detailed permissions for each role in the system.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-700 text-sm">❌ {error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="text-green-700 text-sm">✅ {success}</div>
        </div>
      )}

      {/* Role Selection - Compact */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 min-w-0 flex-shrink-0">
            Select Role:
          </label>
          <select
            value={selectedRole?.id || ""}
            onChange={(e) => {
              const selected = roles.find(
                (role) => role.id === parseInt(e.target.value)
              );
              if (selected) handleRoleChange(selected);
            }}
            className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Choose a Role --</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name} - {role.description}
              </option>
            ))}
          </select>
          {selectedRole && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {selectedRole.slug}
              </span>
              <span className="text-xs text-blue-600 font-medium">
                {Object.keys(permissions).length} submodules configured
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Permission Matrix */}
      {selectedRole && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Permissions for {selectedRole.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Click on module names to expand/collapse. Only one module can
                  be expanded at a time.
                </p>
              </div>
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{saving ? "Saving..." : "Save Permissions"}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module / Submodule
                  </th>
                  {PERMISSION_TYPES.map((permission) => (
                    <th
                      key={permission}
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {permission}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {navigationModules.map((module) => (
                  <React.Fragment key={module.id}>
                    {/* Module Header - Always Visible */}
                    <tr
                      className="bg-blue-50 cursor-pointer hover:bg-blue-100"
                      onClick={() => toggleModuleExpansion(module.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-3">{module.icon}</span>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-blue-900 flex items-center">
                              {module.name}
                              <span className="ml-2 text-xs">
                                {expandedModule === module.id ? "▼" : "▶"}
                              </span>
                            </div>
                            <div className="text-xs text-blue-600">
                              {module.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      {PERMISSION_TYPES.map((permission) => (
                        <td key={permission} className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isPermissionChecked(
                              module.id,
                              null,
                              permission
                            )}
                            onChange={(e) => {
                              e.stopPropagation();
                              handlePermissionChange(
                                module.id,
                                null,
                                permission,
                                e.target.checked
                              );
                            }}
                            className={`h-4 w-4 border-gray-300 rounded focus:ring-blue-500 ${
                              isPermissionChecked(module.id, null, permission)
                                ? "text-blue-600 bg-blue-50"
                                : "text-gray-400 bg-gray-50"
                            }`}
                          />
                        </td>
                      ))}
                    </tr>

                    {/* Submodules - Only show when module is expanded */}
                    {expandedModule === module.id &&
                      module.submodules &&
                      module.submodules.map((submodule) => (
                        <tr key={submodule.id} className="hover:bg-gray-50">
                          <td className="px-6 py-3 whitespace-nowrap">
                            <div className="ml-10">
                              <div className="text-sm text-gray-900">
                                • {submodule.name}
                              </div>
                            </div>
                          </td>
                          {PERMISSION_TYPES.map((permission) => (
                            <td
                              key={permission}
                              className="px-6 py-3 text-center"
                            >
                              <input
                                type="checkbox"
                                checked={isPermissionChecked(
                                  module.id,
                                  submodule.id,
                                  permission
                                )}
                                onChange={(e) =>
                                  handlePermissionChange(
                                    module.id,
                                    submodule.id,
                                    permission,
                                    e.target.checked
                                  )
                                }
                                className={`h-4 w-4 border-gray-300 rounded focus:ring-blue-500 ${
                                  isPermissionChecked(
                                    module.id,
                                    submodule.id,
                                    permission
                                  )
                                    ? "text-blue-600 bg-blue-50"
                                    : "text-gray-400 bg-gray-50"
                                }`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RBACManagement;
