import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard/AdminDashboard";
import Onboarding from "./pages/Onboarding/Onboarding";
import Locations from "./pages/Locations/Locations";
import Artshows from "./pages/Artshows/Artshows";
import Mediums from "./pages/Mediums/Mediums";
import { auth } from "./firebase";
import { useAppDispatch, useAppSelector } from "./hooks/storeHook";
import { login, setInitializing } from "./features/authSlice";
import { fetchMediums } from "./features/mediumsSlice";
import AuthRoutes from "./components/HOC/AuthRoutes";
import RoleRoutes from "./components/HOC/RoleRoutes";
import AdminLayout from "./components/Layouts/AdminLayout";
import WaitingApproval from "./pages/WaitingApproval/WaitingApproval";
import ProtectedRoute from "./components/ProtectedRoute";
import Auth from "./pages/Auth/Auth";
import Users from "./pages/Users/Users";
import UserArtworks from "./pages/UserArtworks/UserArtworks";
import ChatDrawer from "./components/ChatDrawer";
import OnboardingLayout from "./components/Layouts/OnboardingLayout";
import { fetchLocations } from "./features/locationsSlice";
import { fetchArtshows } from "./features/artshowsSlice";
import ArtistLayout from "./components/Layouts/ArtistLayout";
import MyArtwork from "./pages/Artist/MyArtwork";
import PublicArtshow from "./pages/PublicArtshow/PublicArtshow";
import ArtshowArtworks from "./pages/Artshows/ArtshowArtworks";
import ArtshowArtists from "./pages/Artshows/ArtshowArtists";

const App = () => {
  const dispatch = useAppDispatch();
  const {
    data: profile,
    loading,
    error,
  } = useAppSelector((state) => state.profile);
  const { user } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const hideChatDrawer = location.pathname.startsWith("/artshow");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && user.email) {
        // Dispatch auth login
        dispatch(
          login({
            email: user.email,
            id: user.uid,
            photoURL: user?.photoURL || null,
          })
        );
        // Fetch mediums data
        dispatch(fetchMediums());
        dispatch(fetchLocations());
        dispatch(fetchArtshows());
      } else {
        // If no user, set initializing to false
        dispatch(setInitializing(false));
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/artshow" element={<PublicArtshow />} />

        {/* Protected Routes */}
        <Route element={<AuthRoutes />}>
          {/* Onboarding Routes */}
          <Route
            path="onboarding"
            element={
              <RoleRoutes allowedRoles={["on-boarding"]}>
                <OnboardingLayout />
              </RoleRoutes>
            }
          >
            <Route index element={<Onboarding />} />
          </Route>

          {/* Waiting Approval Route */}
          <Route
            path="waiting-approval"
            element={
              <RoleRoutes allowedRoles={["on-boarding-awaiting-approval"]}>
                <WaitingApproval />
              </RoleRoutes>
            }
          />

          {/* Artist Routes */}
          <Route
            element={
              <RoleRoutes allowedRoles={["artist"]}>
                <ArtistLayout />
              </RoleRoutes>
            }
          >
            <Route path="artist/my-artwork" element={<MyArtwork />} />
          </Route>

          {/* Admin Routes */}
          <Route
            element={
              <RoleRoutes allowedRoles={["admin"]}>
                <AdminLayout />
              </RoleRoutes>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="locations" element={<Locations />} />
            <Route path="artshows" element={<Artshows />} />
            <Route path="artshows/:id/artworks" element={<ArtshowArtworks />} />
            <Route path="artshows/:id/artists" element={<ArtshowArtists />} />
            <Route path="mediums" element={<Mediums />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:userId/artworks" element={<UserArtworks />} />
          </Route>

          {/* Redirect root to appropriate route based on role */}
          <Route
            path="/"
            element={
              <RoleRoutes
                allowedRoles={[
                  "on-boarding",
                  "on-boarding-awaiting-approval",
                  "admin",
                  "artist",
                ]}
              >
                {profile?.role === "on-boarding" ? (
                  <Navigate to="/onboarding" replace />
                ) : profile?.role === "on-boarding-awaiting-approval" ? (
                  <Navigate to="/waiting-approval" replace />
                ) : profile?.role === "admin" ? (
                  <Navigate to="/dashboard" replace />
                ) : profile?.role === "artist" ? (
                  <Navigate to="/artist/my-artwork" replace />
                ) : (
                  <Navigate to="/auth" replace />
                )}
              </RoleRoutes>
            }
          />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {user && !hideChatDrawer && <ChatDrawer />}
    </div>
  );
};

export default App;
