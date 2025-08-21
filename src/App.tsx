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
import Settings from "./pages/Settings/Settings";
import Curate from "./pages/Curate/Curate";
import { getDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { fetchUserChats } from "./features/chatSlice";
import PublicArtshowArtworks from "./pages/PublicArtshow/PublicArtshowArtworks";
import TestCloudFunction from "./pages/TestCloudFunction/TestCloudFunction";
import ProductManagement from "./pages/ProductManagement/ProductManagement";
import TableView from "./pages/TableView/TableView";
import Purchases from "./pages/Purchases/Purchases";
import SendMail from "./pages/SendMail/SendMail";
import PreShowWaiting from "./pages/PreShowWaiting/PreShowWaiting";
import AdminArtshowPDF from "./pages/PDF/AdminArtshowPDF";
import ShowUsers from "./pages/Artist/ShowUsers";
import UserAccess from "./pages/UserAccess/UserAccess";

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
              stripeId: userData?.stripeId,
              showAccess: userData?.showAccess || [],
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

  // Live subscription to current user's Firestore doc (updates showAccess, etc.)
  useEffect(() => {
    if (!user?.id) return;

    const userRef = doc(db, "users", user.id);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return;
      const data: any = snap.data();

      const toIso = (ts: any, fallback: string) =>
        typeof ts === "string"
          ? ts
          : ts?.toDate?.().toISOString?.() || fallback;

      dispatch(
        login({
          email: user.email,
          id: user.id,
          photoUrl: data?.photoUrl ?? user.photoUrl ?? null,
          name: data?.name ?? user.name ?? "",
          bio: data?.bio ?? user.bio ?? "",
          role: data?.role ?? user.role ?? "on-boarding",
          status: data?.status ?? user.status ?? null,
          contactInfo: data?.contactInfo ??
            user.contactInfo ?? {
              address: "",
              phone: "",
            },
          socialLinks: data?.socialLinks ?? user.socialLinks ?? {},
          onboardingCompleted:
            data?.onboardingCompleted ?? user.onboardingCompleted ?? false,
          createdAt: toIso(
            data?.createdAt,
            user.createdAt || new Date().toISOString()
          ),
          updatedAt: toIso(data?.updatedAt, new Date().toISOString()),
          assignedLocations:
            data?.assignedLocations ?? user.assignedLocations ?? [],
          interestInShow: data?.interestInShow ?? user.interestInShow ?? "",
          artshowId: data?.artshowId ?? user.artshowId,
          stripeId: data?.stripeId ?? user.stripeId,
          showAccess: data?.showAccess ?? user.showAccess ?? [],
        })
      );
    });

    return () => unsubscribe();
  }, [dispatch, user?.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/artshow" element={<PublicArtshow />} />
        <Route path="/artshow-artworks" element={<PublicArtshowArtworks />} />
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
            <Route path="settings" element={<Settings />} />
            <Route path="show/:showId/users" element={<ShowUsers />} />
            <Route path="users/:userId/artworks" element={<UserArtworks />} />
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

          {/* Pre Show Waiting Route */}
          <Route
            path="pre-show-waiting"
            element={
              <RoleRoutes allowedRoles={["employee"]}>
                <PreShowWaiting />
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
            <Route path="artist/settings" element={<Settings />} />
            <Route path="artist/show/:showId/users" element={<ShowUsers />} />
            <Route
              path="artist/users/:userId/artworks"
              element={<UserArtworks />}
            />
          </Route>

          {/* Admin Routes */}
          <Route
            element={
              <RoleRoutes allowedRoles={["admin", "employee"]}>
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
            <Route path="user-access" element={<UserAccess />} />
            <Route path="users/:userId/artworks" element={<UserArtworks />} />
            <Route path="artworks" element={<Artworks />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="curate" element={<Curate />} />
            <Route path="table-view" element={<TableView />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="invitation" element={<Invitation />} />
            <Route path="send-mail" element={<SendMail />} />
            <Route path="pdf" element={<AdminArtshowPDF />} />
            <Route path="product-management" element={<ProductManagement />} />
            <Route path="test-cloud-function" element={<TestCloudFunction />} />
            <Route path="settings" element={<Settings />} />
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
                  "employee",
                  "artist",
                ]}
              >
                {profile?.role === "on-boarding" ? (
                  <Navigate to="/onboarding" replace />
                ) : profile?.role === "on-boarding-awaiting-approval" ? (
                  <Navigate to="/waiting-approval" replace />
                ) : profile?.role === "admin" ? (
                  <Navigate to="/users" replace />
                ) : profile?.role === "employee" ? (
                  <Navigate to="/artworks" replace />
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
