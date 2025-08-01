import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../hooks/storeHook";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireApproval?: boolean;
}

const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireApproval = false,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const { data: profile } = useAppSelector((state) => state.profile);

  // If auth is not required, render children
  if (!requireAuth) {
    return <>{children}</>;
  }

  // If no profile, redirect to login
  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If admin role is required but user is not a admin or employee
  if (requireAdmin && profile.role !== "admin" && profile.role !== "employee") {
    return <Navigate to="/dashboard" replace />;
  }

  // If approval is required but user is not in awaiting approval state
  if (requireApproval && profile.role !== "on-boarding-awaiting-approval") {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is in awaiting approval state but trying to access protected routes
  if (profile.role === "on-boarding-awaiting-approval" && !requireApproval) {
    return <Navigate to="/waiting-approval" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
