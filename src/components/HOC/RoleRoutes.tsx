import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../hooks/storeHook";
import LayoutSkeleton from "../Skeleton/LayoutSkeleton";

interface RoleRoutesProps {
  allowedRoles: string[];
  allowedStatuses?: string[];
  children?: React.ReactNode;
}

const RoleRoutes = ({
  allowedRoles,
  allowedStatuses,
  children,
}: RoleRoutesProps) => {
  const { data: profile, loading } = useAppSelector((state) => state.profile);

  // If still loading, show skeleton
  if (loading && !profile && !allowedRoles.includes("on-boarding")) {
    return <LayoutSkeleton />;
  }

  // If no profile, redirect to auth
  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user is in onboarding state
  if (profile.role === "on-boarding") {
    // If trying to access onboarding, allow it
    if (allowedRoles.includes("on-boarding")) {
      return children ? <>{children}</> : <Outlet />;
    }
    // Otherwise redirect to onboarding
    return <Navigate to="/onboarding" replace />;
  }

  // Check if user is a admin
  if (profile.role === "admin") {
    // If trying to access admin routes, allow it
    if (allowedRoles.includes("admin")) {
      return children ? <>{children}</> : <Outlet />;
    }
    // Otherwise redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user has allowed role
  const hasAllowedRole = allowedRoles.includes(profile.role);

  if (!hasAllowedRole) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RoleRoutes;
