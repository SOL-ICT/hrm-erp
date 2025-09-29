"use client"; // Client-side for interactivity
  
import StaffSidebar from "./StaffSidebar";
import StaffHeader from "./StaffHeader";
import StaffDashboard from "./StaffDashboard.jsx";
  
export default function StaffIndex({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <StaffSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <StaffHeader />
        <main className="p-6 flex-1 overflow-y-auto">
          <StaffDashboard />

          {children}
        </main>
      </div>
    </div>
  );
}