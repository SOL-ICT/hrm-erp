"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import StaffSidebar from "./StaffSidebar";
import StaffHeader from "./StaffHeader";
import StaffDashboard from "./StaffDashboard";
import LeaveApply from "./modules/LeaveAdministration/LeaveApply";
import MyLeaves from "./modules/LeaveAdministration/MyLeaves";
import Payslip from "./modules/PaySlip/Payslip";
import NameChange from "./modules/StaffChangeRequest/NameChange";
import TrainingFeedback from "./modules/TrainingDev/TrainingFeedback";
import InvoiceManagement from "../invoicing/InvoiceManagement";

// Placeholder component for pages that are not yet developed
const UnderDevelopment = ({ moduleName }) => (
  <div className="flex items-center justify-center h-full p-6 bg-white rounded-lg shadow-md">
    <div className="text-center text-gray-500">
      <h2 className="text-2xl font-bold mb-2">"{moduleName}" Module</h2>
      <p>
        This module is currently under development. Please check back later!
      </p>
    </div>
  </div>
);

// The StaffLayout component is now self-contained, using state to manage the active content.
export default function StaffLayout() {
  //constants for authentication
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // Use a state variable to track the currently active component.
  const [activeComponent, setActiveComponent] = useState("dashboard");

  // Add state for sidebar open/closed status
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  //check if the user is authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg">Loading Staff Dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // A simple function to render the correct component based on the state.
  const renderContent = () => {
    switch (activeComponent) {
      case "dashboard":
        return <StaffDashboard />;
      case "leave-application-entry":
        return <LeaveApply />;
      case "my-leaves":
        return <MyLeaves />;
      case "payslip-view-print":
        return <Payslip />;
      case "invoice-management":
        return <InvoiceManagement />;
      case "name-change-application":
        return <NameChange />;
      // case "training-feedback":
      //   return <TrainingFeedback />;
      // All other cases will fall through to the default UnderDevelopment component
      default:
        return <UnderDevelopment moduleName={activeComponent} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Pass sidebar state and toggle functions to both components */}
      <StaffSidebar
        activeComponent={activeComponent}
        setActiveComponent={setActiveComponent}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <StaffHeader
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
        />
        <main className="p-6 flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
}
