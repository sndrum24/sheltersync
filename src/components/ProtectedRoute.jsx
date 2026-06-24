import { useAuthUser } from "@/auth/AuthProvider";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthUser();

  if (loading) return <div>Loading...</div>;

  // IMPORTANT FIX: don't immediately reject unknown auth state
  if (user === undefined) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  return children;
}