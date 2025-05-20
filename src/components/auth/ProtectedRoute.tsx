
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};
