import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchUserProfile } from "../../features/profileSlice";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { logout } from "../../features/authSlice";
import { clearProfile } from "../../features/profileSlice";
import LayoutSkeleton from "../Skeleton/LayoutSkeleton";

const AuthRoutes = () => {
  const dispatch = useAppDispatch();
  const handleLogout = async () => {
    await signOut(auth);
    dispatch(logout());
    dispatch(clearProfile());
  };
  const location = useLocation();
  const { user, initializing } = useAppSelector((state) => state.auth);
  const {
    data: profile,
    loading,
    error,
  } = useAppSelector((state) => state.profile);
  const hasAttemptedFetch = useRef(false);
  const isAuthPage = location.pathname === "/auth";

  // Fetch profile when user changes, but only if we haven't tried before
  useEffect(() => {
    if (user?.id && !hasAttemptedFetch.current && !isAuthPage) {
      hasAttemptedFetch.current = true;
      dispatch(fetchUserProfile(user.id));
    }
  }, [user, dispatch, isAuthPage]);

  // Show skeleton during initial auth check or profile loading
  if (initializing || (loading && !profile)) {
    return <LayoutSkeleton />;
  }

  // If not authenticated and not initializing, redirect to auth
  if (!user && !initializing) {
    return <Navigate to="/auth" replace />;
  }

  // If we're already on the auth page, don't redirect
  if (isAuthPage) {
    return <Outlet />;
  }

  // If authenticated but no profile, show error state
  if (!profile && error && user) {
    console.error("AuthRoutes - Error loading profile:", {
      userId: user.id,
      error,
    });
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-900">
        <div className="max-w-md w-full bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-red-400 mb-4">
            {error === "User profile not found"
              ? "Account Data Missing"
              : "Connection Error"}
          </h2>
          <p className="text-slate-300 mb-4">
            {error === "User profile not found"
              ? "We couldn't find your account data. This might happen if your account was recently created or if there was an issue with the data."
              : error}
          </p>
          <div className="space-y-4">
            <button
              onClick={() => {
                hasAttemptedFetch.current = false;
                dispatch(fetchUserProfile(user.id!));
              }}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                handleLogout();
              }}
              className="w-full bg-slate-700 text-slate-300 py-2 px-4 rounded hover:bg-slate-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Handle routing based on role
  switch (profile?.role) {
    case "admin":
      return <Outlet />;

    case "artist":
      return <Outlet />;

    case "on-boarding":
      if (location.pathname === "/onboarding") {
        return <Outlet />;
      }
      return <Navigate to="/onboarding" replace />;

    case "on-boarding-awaiting-approval":
      if (location.pathname === "/waiting-approval") {
        return <Outlet />;
      }
      return <Navigate to="/waiting-approval" replace />;

    default:
      return <Navigate to="/auth" replace />;
  }
};

export default AuthRoutes;
