import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard/AdminDashboard";
import Onboarding from "./pages/Onboarding/Onboarding";
import Locations from "./pages/Locations/Locations";
import Artshows from "./pages/Artshows/Artshows";
import Mediums from "./pages/Mediums/Mediums";
import Artworks from "./pages/Artworks/Artworks";
import { auth } from "./firebase";
import { useAppDispatch, useAppSelector } from "./hooks/storeHook";
import { login, setInitializing } from "./features/authSlice";
import { fetchMediums } from "./features/mediumsSlice";
import AuthRoutes from "./components/HOC/AuthRoutes";
import RoleRoutes from "./components/HOC/RoleRoutes";
import AdminLayout from "./components/Layouts/AdminLayout";
import WaitingApproval from "./pages/WaitingApproval/WaitingApproval";
import Auth from "./pages/Auth/Auth";
import Users from "./pages/Users/Users";
import UserArtworks from "./pages/UserArtworks/UserArtworks";
import OnboardingLayout from "./components/Layouts/OnboardingLayout";
import { fetchLocations } from "./features/locationsSlice";
import { fetchArtshows } from "./features/artshowsSlice";
import ArtistLayout from "./components/Layouts/ArtistLayout";
import MyArtwork from "./pages/Artist/MyArtwork";
import PublicArtshow from "./pages/PublicArtshow/PublicArtshow";
import ArtshowArtworks from "./pages/Artshows/ArtshowArtworks";
import ArtshowArtists from "./pages/Artshows/ArtshowArtists";
import OnboardArt from "./pages/Artist/OnboardArt";
import Store from "./pages/Store/Store";
import ChatPage from "./pages/ChatPage";
import Invitation from "./pages/Invitation/Invitation";
import { getDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import { fetchUserChats } from "./features/chatSlice";

const App = () => {
  const dispatch = useAppDispatch();
  const { data: profile } = useAppSelector((state) => state.profile);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && user.email) {
        try {
          // Fetch user data from Firestore first
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userData = userDoc.data();

          // Dispatch auth login with the correct role from Firestore
          dispatch(
            login({
              email: user.email,
              id: user.uid,
              photoUrl: user.photoURL || null,
              name: user.displayName || "",
              bio: userData?.bio || "",
              role: userData?.role || "on-boarding",
              status: userData?.status || null,
              contactInfo: userData?.contactInfo || { address: "", phone: "" },
              socialLinks: userData?.socialLinks || {},
              onboardingCompleted: userData?.onboardingCompleted || false,
              createdAt: userData?.createdAt || new Date().toISOString(),
              updatedAt: userData?.updatedAt || new Date().toISOString(),
              assignedLocations: userData?.assignedLocations || [],
              interestInShow: userData?.interestInShow || "",
              artshowId: userData?.artshowId,
            })
          );

          // Fetch mediums data
          dispatch(fetchMediums());
          dispatch(fetchLocations());
          dispatch(fetchArtshows());
        } catch (error) {
          console.error("Error fetching user data:", error);
          // If there's an error, set initializing to false
          dispatch(setInitializing(false));
        }
      } else {
        // If no user, set initializing to false
        dispatch(setInitializing(false));
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  // Global chat listener
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserChats(user.id));
    }
    return () => {
      if ((window as any).unsubscribeChats) {
        (window as any).unsubscribeChats();
      }
    };
  }, [dispatch, user?.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/artshow" element={<PublicArtshow />} />
        <Route path="/store" element={<Store />} />

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
            <Route path="chat" element={<ChatPage />} />
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
            <Route path="artist/onboard-art" element={<OnboardArt />} />
            <Route path="artist/chat" element={<ChatPage />} />
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
            <Route path="artworks" element={<Artworks />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="invitation" element={<Invitation />} />
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
    </div>
  );
};

export default App;
