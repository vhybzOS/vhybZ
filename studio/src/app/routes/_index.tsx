import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Dashboard } from "@/components/Dashboard";

export default function Index() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}