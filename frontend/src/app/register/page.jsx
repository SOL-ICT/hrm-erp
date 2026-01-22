import { Suspense } from "react";
import HRMRegistrationPage from "@/components/HRMRegistrationPage";

export const metadata = {
  title: "Create Account - HRM ERP System",
  description: "Join our talent network and start your career journey",
};

function RegisterLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading registration form...</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoadingFallback />}>
      <HRMRegistrationPage />
    </Suspense>
  );
}