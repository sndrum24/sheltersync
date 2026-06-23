import { useShelter } from "@/hooks/useShelter";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useShelter();

  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}