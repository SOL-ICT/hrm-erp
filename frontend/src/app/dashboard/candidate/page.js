// app/dashboard/candidate/page.js
import ProtectedRoute from "../../../components/ProtectedRoute";
import CandidateDashboard from "../../../components/CandidateDashboard";

export default function CandidateDashboardPage() {
  return (
    <ProtectedRoute requiredRole="candidate">
      <CandidateDashboard />
    </ProtectedRoute>
  );
}
