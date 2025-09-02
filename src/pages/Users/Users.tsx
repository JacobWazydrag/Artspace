import { useState, useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  User,
  listenToUsers,
} from "../../features/usersSlice";
import { useNavigate } from "react-router-dom";
import ContentWrapper from "../../components/ContentWrapper";
import { formClasses } from "../../classes/tailwindClasses";
import { fetchArtshows } from "../../features/artshowsSlice";
import {
  fetchArtistArtworks,
  fetchAllArtworks,
} from "../../features/artworkSlice";
import { fetchMediums } from "../../features/mediumsSlice";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-hot-toast";
import { NumericFormat } from "react-number-format";
import { sendMail } from "../../features/mailSlice";
import { mergeEmailConfig } from "../../utils/emailConfig";

// Persistent storage keys
const FILTERS_STORAGE_KEY = "usersPageFilters";
const SCROLL_STORAGE_KEY = "usersPageScrollY";
const ANCHOR_STORAGE_KEY = "usersPageAnchorUserId";

interface FilterState {
  search: string;
  roles: string[];
  statuses: string[];
  interestInShow: string[];
}

const Users = () => {
  const { label, input, select, button, h4, cancelButton, h1ReverseDark } =
    formClasses;
  const dispatch = useAppDispatch();
  const {
    data: users,
    loading,
    error,
  } = useAppSelector((state) => state.users);
  const { data: locations } = useAppSelector((state) => state.locations);
  const { data: artshows } = useAppSelector((state) => state.artshows);
  const { data: artworks } = useAppSelector((state) => state.artwork);
  const { data: mediums } = useAppSelector((state) => state.mediums);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAcceptShowModalOpen, setIsAcceptShowModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    role: "on-boarding",
    status: "accepted",
    assignedLocations: [],
  });
  const [acceptShowData, setAcceptShowData] = useState({
    artshowId: "",
    locationId: "",
    selectedArtworks: [] as string[],
  });
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          search: typeof parsed.search === "string" ? parsed.search : "",
          roles: Array.isArray(parsed.roles)
            ? parsed.roles
            : ["artist", "on-boarding"],
          statuses: Array.isArray(parsed.statuses) ? parsed.statuses : [],
          interestInShow: Array.isArray(parsed.interestInShow)
            ? parsed.interestInShow
            : [],
        } as FilterState;
      }
    } catch (e) {
      // Ignore parse errors and fall back to defaults
    }
    return {
      search: "",
      roles: ["artist", "on-boarding"],
      statuses: [],
      interestInShow: [],
    } as FilterState;
  });
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isArtShowDropdownOpen, setIsArtShowDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const artShowDropdownRef = useRef<HTMLDivElement>(null);
  const hasRestoredScrollRef = useRef(false);

  useEffect(() => {
    dispatch(fetchUsers());
    const unsubscribe = dispatch(listenToUsers());
    dispatch(fetchArtshows());
    dispatch(fetchMediums());
    dispatch(fetchAllArtworks());
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [dispatch]);

  // Click outside logic for Role dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRoleDropdownOpen(false);
      }
    }
    if (isRoleDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isRoleDropdownOpen]);

  // Click outside logic for Status dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
      }
    }
    if (isStatusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isStatusDropdownOpen]);

  // Click outside logic for Art Show dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        artShowDropdownRef.current &&
        !artShowDropdownRef.current.contains(event.target as Node)
      ) {
        setIsArtShowDropdownOpen(false);
      }
    }
    if (isArtShowDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isArtShowDropdownOpen]);

  // Persist filters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch (e) {
      // Ignore storage write errors
    }
  }, [filters]);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        role: user.role,
        status: user.status,
        assignedLocations: user.assignedLocations || [],
      });
    } else {
      setSelectedUser(null);
      setFormData({
        role: "on-boarding",
        status: null,
        assignedLocations: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormData({
      role: "on-boarding",
      status: null,
      assignedLocations: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await dispatch(
          updateUser({
            userId: selectedUser.id!,
            userData: formData,
          })
        ).unwrap();
      } else {
        await dispatch(
          createUser(formData as Omit<User, "id" | "createdAt" | "updatedAt">)
        ).unwrap();
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await dispatch(deleteUser(userId)).unwrap();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleArtworksClick = (userId: string) => {
    try {
      sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
      sessionStorage.setItem(ANCHOR_STORAGE_KEY, userId);
    } catch (e) {
      // Ignore storage write errors
    }
    navigate(`/users/${userId}/artworks`);
  };

  const handleAcceptIntoShow = async (user: User) => {
    setSelectedUser(user);
    setAcceptShowData({ artshowId: "", locationId: "", selectedArtworks: [] });
    if (user.id) {
      await dispatch(fetchArtistArtworks(user.id));
    }
    setIsAcceptShowModalOpen(true);
  };

  const handleAcceptShowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedUser ||
      !acceptShowData.artshowId ||
      !acceptShowData.locationId ||
      acceptShowData.selectedArtworks.length === 0
    )
      return;

    try {
      const userRef = doc(db, "users", selectedUser.id!);
      await updateDoc(userRef, {
        status: "showing",
        role: "artist",
        artshowId: acceptShowData.artshowId,
        updatedAt: new Date().toISOString(),
      });

      const artworksQuery = query(
        collection(db, "artworks"),
        where("artistId", "==", selectedUser.id)
      );
      const artworksSnapshot = await getDocs(artworksQuery);

      const updatePromises = artworksSnapshot.docs.map((doc) => {
        const isSelected = acceptShowData.selectedArtworks.includes(doc.id);
        return updateDoc(doc.ref, {
          artshowId: isSelected ? acceptShowData.artshowId : "",
          locationId: isSelected ? acceptShowData.locationId : "",
          showStatus: isSelected ? "accepted" : "rejected",
          updatedAt: new Date().toISOString(),
        });
      });

      const selectedArtworkIds = acceptShowData.selectedArtworks;

      const locationRef = doc(db, "locations", acceptShowData.locationId);
      const locationDoc = await getDoc(locationRef);
      const locationData = locationDoc.data();
      const currentLocationArtistIds = locationData?.artistIds || [];
      const currentLocationArtworkIds = locationData?.artworkIds || [];

      // Avoid duplicates in location arrays
      const newArtworkIdsForLocation = selectedArtworkIds.filter(
        (id: string) => !currentLocationArtworkIds.includes(id)
      );
      const updatedLocationArtworkIds = [
        ...currentLocationArtworkIds,
        ...newArtworkIdsForLocation,
      ];

      const updatedLocationArtistIds = currentLocationArtistIds.includes(
        selectedUser.id
      )
        ? currentLocationArtistIds
        : [...currentLocationArtistIds, selectedUser.id];

      await updateDoc(locationRef, {
        artworkIds: updatedLocationArtworkIds,
        artistIds: updatedLocationArtistIds,
        updatedAt: new Date().toISOString(),
      });

      const artshowRef = doc(db, "artshows", acceptShowData.artshowId);
      const artshowDoc = await getDoc(artshowRef);
      const artshowData = artshowDoc.data();
      const currentArtistIds = artshowData?.artistIds || [];
      const currentArtworkIds = artshowData?.artworkIds || [];
      const currentArtworkOrder = artshowData?.artworkOrder || [];

      // Add selected artwork IDs to the bottom of the artworkOrder array, avoiding duplicates
      const newArtworkIds = selectedArtworkIds.filter(
        (id: string) => !currentArtworkOrder.includes(id)
      );
      const updatedArtworkOrder = [...currentArtworkOrder, ...newArtworkIds];

      // Also avoid duplicates in artworkIds
      const newArtworkIdsForShow = selectedArtworkIds.filter(
        (id: string) => !currentArtworkIds.includes(id)
      );
      const updatedArtworkIds = [...currentArtworkIds, ...newArtworkIdsForShow];

      // Check if artist is already in the show to avoid duplicates
      const updatedArtistIds = currentArtistIds.includes(selectedUser.id)
        ? currentArtistIds
        : [...currentArtistIds, selectedUser.id];

      await updateDoc(artshowRef, {
        artworkIds: updatedArtworkIds,
        artistIds: updatedArtistIds,
        artworkOrder: updatedArtworkOrder,
        updatedAt: new Date().toISOString(),
      });

      await Promise.all(updatePromises);

      // Send congratulatory email to the accepted user
      try {
        const selectedArtworksCount = acceptShowData.selectedArtworks.length;
        const artshowName =
          artshows.find((show) => show.id === acceptShowData.artshowId)?.name ||
          "the art show";
        const locationName =
          locations.find((loc) => loc.id === acceptShowData.locationId)?.name ||
          "the studio";

        const mailData = mergeEmailConfig({
          replyTo: "artspacechicago@gmail.com",
          toUids: [selectedUser.id!],
          message: {
            subject:
              "🎉 Congratulations! You've Been Accepted into the Art Show!",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #6b46c1; margin: 0; font-size: 28px;">🎨 ArtSpace Chicago</h1>
                  <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">Art Show Acceptance</p>
                </div>
                
                <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Congratulations! 🎉</h2>
                  
                  <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                    Dear <strong>${selectedUser.name}</strong>,
                  </p>
                  
                  <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                    We are thrilled to inform you that your artwork has been accepted into <strong>${artshowName}</strong>! 
                  </p>
                  
                  <div style="background-color: #f0f4ff; padding: 20px; border-radius: 6px; border-left: 4px solid #6b46c1; margin-bottom: 25px;">
                    <h3 style="color: #6b46c1; margin: 0 0 15px 0; font-size: 18px;">Acceptance Details:</h3>
                    <p style="margin: 8px 0; color: #333;"><strong>Art Show:</strong> ${artshowName}</p>
                    <p style="margin: 8px 0; color: #333;"><strong>Location:</strong> 3418 W. Armitage Ave, Chicago, Illinois 60647</p>
                    <p style="margin: 8px 0; color: #333;"><strong>Artworks Accepted:</strong> Log into your portal to see which artworks were accepted.</p>
                    <p style="margin: 8px 0; color: #333;"><strong>Status:</strong> <span style="color: #48bb78; font-weight: 600;">Accepted</span></p>
                  </div>
                  
                  <div style="background-color: #e8f5e8; padding: 20px; border-radius: 6px; border-left: 4px solid #48bb78; margin-bottom: 25px;">
                    <h3 style="color: #2f855a; margin: 0 0 15px 0; font-size: 18px;">🚀 Next Steps:</h3>
                    <p style="margin: 0 0 15px 0; color: #2f855a;">
                      <strong>You will be notified of drop off dates and times through your portal messaging.</strong>
                    </p>
                  </div>
                  
                  <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                      <strong>Important:</strong> Please ensure your artwork is properly prepared and ready for installation. 
                      All packing materials will need to be taken with you after dropoff.
                    </p>
                  </div>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p style="color: #666; font-size: 14px; margin: 0;">
                      We're excited to have you as part of this exhibition! If you have any questions, 
                      please don't hesitate to reach out to us.
                    </p>
                  </div>
                </div>
                
                <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                  <p>ArtSpace Chicago - Supporting Emerging Artists</p>
                  <p>📍 3418 W. Armitage Ave, Chicago, Illinois 60647</p>
                </div>
              </div>
            `,
          },
        });

        await dispatch(sendMail(mailData)).unwrap();
      } catch (emailError) {
        console.error("Failed to send acceptance email:", emailError);
        // Don't fail the acceptance process if email fails
      }

      setIsAcceptShowModalOpen(false);
      dispatch(fetchUsers());
      toast.success("User accepted into show successfully");
    } catch (error) {
      console.error("Error accepting user into show:", error);
      toast.error("Failed to accept user into show");
    }
  };

  const handleRemoveFromShow = async (user: User) => {
    if (!user.id || !user.artshowId) return;

    if (
      window.confirm("Are you sure you want to remove this user from the show?")
    ) {
      try {
        const artshowRef = doc(db, "artshows", user.artshowId);
        const artshowDoc = await getDoc(artshowRef);
        const artshowData = artshowDoc.data();

        const artworksQuery = query(
          collection(db, "artworks"),
          where("artistId", "==", user.id)
        );
        const artworksSnapshot = await getDocs(artworksQuery);
        const artworkIds = artworksSnapshot.docs.map((doc) => doc.id);

        const locationId = artworksSnapshot.docs[0]?.data()?.locationId;

        const updateArtworkPromises = artworksSnapshot.docs.map((doc) =>
          updateDoc(doc.ref, {
            artshowId: "",
            locationId: "",
            showStatus: "rejected",
            updatedAt: new Date().toISOString(),
          })
        );

        const updatedArtistIds = (artshowData?.artistIds || []).filter(
          (id: string) => id !== user.id
        );
        const updatedArtworkIds = (artshowData?.artworkIds || []).filter(
          (id: string) => !artworkIds.includes(id)
        );
        const updatedArtworkOrder = (artshowData?.artworkOrder || []).filter(
          (id: string) => !artworkIds.includes(id)
        );

        await updateDoc(artshowRef, {
          artistIds: updatedArtistIds,
          artworkIds: updatedArtworkIds,
          artworkOrder: updatedArtworkOrder,
          updatedAt: new Date().toISOString(),
        });

        if (locationId) {
          const locationRef = doc(db, "locations", locationId);
          const locationDoc = await getDoc(locationRef);
          const locationData = locationDoc.data();
          const updatedLocationArtworkIds = (
            locationData?.artworkIds || []
          ).filter((id: string) => !artworkIds.includes(id));
          const updatedLocationArtistIds = (
            locationData?.artistIds || []
          ).filter((id: string) => id !== user.id);
          await updateDoc(locationRef, {
            artworkIds: updatedLocationArtworkIds,
            artistIds: updatedLocationArtistIds,
            updatedAt: new Date().toISOString(),
          });
        }

        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, {
          artshowId: "",
          role: "on-boarding",
          status: "active",
          updatedAt: new Date().toISOString(),
        });

        await Promise.all(updateArtworkPromises);
        dispatch(fetchUsers());
        toast.success("User removed from show successfully");
      } catch (error) {
        console.error("Error removing user from show:", error);
        toast.error("Failed to remove user from show");
      }
    }
  };

  const handlePreviewUser = (user: User) => {
    setSelectedUser(user);
    setIsPreviewModalOpen(true);
  };

  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setSelectedUser(null);
  };

  const getMediumName = (mediumId: string) => {
    const medium = mediums?.find((m) => m.id === mediumId);
    return medium?.name || mediumId;
  };

  const getUserArtworkStats = (userId: string) => {
    const userArtworks = artworks.filter(
      (artwork) => artwork.artistId === userId
    );
    const soldCount = userArtworks.filter((artwork) => artwork.sold).length;
    const pendingCount = userArtworks.filter(
      (artwork) => artwork.pendingSale
    ).length;

    return { soldCount, pendingCount, totalCount: userArtworks.length };
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        // Exclude current user from the list (check both id and email)
        if (
          currentUser &&
          (user.id === currentUser.id || user.email === currentUser.email)
        ) {
          return false;
        }

        // Apply search filter
        if (
          filters.search &&
          !user.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !user.email.toLowerCase().includes(filters.search.toLowerCase())
        ) {
          return false;
        }

        // Apply role filter (defaults to artist and on-boarding)
        if (filters.roles.length > 0 && !filters.roles.includes(user.role)) {
          return false;
        }

        // Apply status filter
        if (
          filters.statuses.length > 0 &&
          !filters.statuses.includes(user.status || "")
        ) {
          return false;
        }

        // Apply art show interest filter
        if (
          filters.interestInShow.length > 0 &&
          !filters.interestInShow.includes(user.interestInShow || "")
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, filters, currentUser]);

  // Restore scroll position after skeleton/loading settles and content height is ready
  useEffect(() => {
    if (hasRestoredScrollRef.current) return;
    let cancelled = false;

    let savedY: number | null = null;
    let anchorUserId: string | null = null;
    try {
      const raw = sessionStorage.getItem(SCROLL_STORAGE_KEY);
      if (raw) {
        const parsed = parseInt(raw, 10);
        if (!Number.isNaN(parsed)) savedY = parsed;
      }
      anchorUserId = sessionStorage.getItem(ANCHOR_STORAGE_KEY);
    } catch (e) {
      // Ignore storage read errors
    }

    if (savedY === null && !anchorUserId) {
      hasRestoredScrollRef.current = true;
      return;
    }

    const start = Date.now();
    const maxWaitMs = 2000;

    const tryRestore = () => {
      if (cancelled) return;
      const scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const maxScrollTop = Math.max(0, scrollHeight - window.innerHeight);

      // If we have an anchor user, try to scroll that card into view first
      if (anchorUserId) {
        const el = document.getElementById(anchorUserId);
        if (el) {
          el.scrollIntoView({ block: "center" });
          hasRestoredScrollRef.current = true;
          return;
        }
      }

      // Wait until content is tall enough to reach savedY (allow small slack)
      if (savedY !== null && maxScrollTop >= Math.max(0, savedY - 10)) {
        const target = Math.min(savedY, maxScrollTop);
        window.scrollTo(0, target);
        hasRestoredScrollRef.current = true;
        return;
      }

      if (Date.now() - start < maxWaitMs) {
        requestAnimationFrame(tryRestore);
      } else {
        // Fallback: scroll to the bottom if we can't reach savedY in time
        window.scrollTo(0, maxScrollTop);
        hasRestoredScrollRef.current = true;
      }
    };

    // Defer initial attempt slightly to outlast ContentWrapper's 500ms skeleton
    const timeoutId = window.setTimeout(() => {
      requestAnimationFrame(tryRestore);
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  // Save scroll position on unmount and before page unload
  useEffect(() => {
    const saveScrollPosition = () => {
      try {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, String(window.scrollY));
      } catch (e) {
        // Ignore storage write errors
      }
    };

    window.addEventListener("beforeunload", saveScrollPosition);
    return () => {
      window.removeEventListener("beforeunload", saveScrollPosition);
      saveScrollPosition();
    };
  }, []);

  if (error) {
    return (
      <div className="text-center text-red-600">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ContentWrapper loading={loading}>
        <div className="flex justify-between items-center mb-6">
          <h1 className={h1ReverseDark}>Artists</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Showing</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {filteredUsers.length}
            </span>
            <span className="text-sm text-gray-500">of {users.length}</span>
          </div>
        </div>

        <div className="mb-8 space-y-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex">
              <div className="relative w-full">
                <input
                  type="search"
                  id="search"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search users by name or email..."
                />
                <button
                  type="button"
                  className="absolute top-0 end-0 p-2.5 text-sm font-medium h-full text-white bg-blue-700 rounded-e-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
                >
                  <svg
                    className="w-4 h-4"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 20"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                    />
                  </svg>
                  <span className="sr-only">Search</span>
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative" ref={roleDropdownRef}>
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() => setIsRoleDropdownOpen((open) => !open)}
                >
                  Role
                  <svg
                    className="w-2.5 h-2.5 ms-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                {isRoleDropdownOpen && (
                  <div className="z-10 absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow">
                    <ul className="py-2 text-sm text-gray-700">
                      {["admin", "on-boarding", "artist"].map((role) => (
                        <li key={role}>
                          <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.roles.includes(role)}
                              onChange={(e) => {
                                setFilters((prev) => ({
                                  ...prev,
                                  roles: e.target.checked
                                    ? [...prev.roles, role]
                                    : prev.roles.filter((r) => r !== role),
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 capitalize">
                              {role.replace("-", " ")}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="relative" ref={statusDropdownRef}>
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() => setIsStatusDropdownOpen((open) => !open)}
                >
                  Status
                  <svg
                    className="w-2.5 h-2.5 ms-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                {isStatusDropdownOpen && (
                  <div className="z-10 absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow">
                    <ul className="py-2 text-sm text-gray-700">
                      {["showing", "shown", "accepted", "rejected"].map(
                        (status) => (
                          <li key={status}>
                            <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.statuses.includes(status)}
                                onChange={(e) => {
                                  setFilters((prev) => ({
                                    ...prev,
                                    statuses: e.target.checked
                                      ? [...prev.statuses, status]
                                      : prev.statuses.filter(
                                          (s) => s !== status
                                        ),
                                  }));
                                }}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="ml-2 capitalize">{status}</span>
                            </label>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="relative" ref={artShowDropdownRef}>
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() => setIsArtShowDropdownOpen((open) => !open)}
                >
                  Art Show
                  <svg
                    className="w-2.5 h-2.5 ms-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                {isArtShowDropdownOpen && (
                  <div className="z-10 absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow max-h-60 overflow-y-auto">
                    <ul className="py-2 text-sm text-gray-700">
                      {artshows.map((show) => (
                        <li key={show.id}>
                          <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.interestInShow.includes(
                                show.name
                              )}
                              onChange={(e) => {
                                setFilters((prev) => ({
                                  ...prev,
                                  interestInShow: e.target.checked
                                    ? [...prev.interestInShow, show.name]
                                    : prev.interestInShow.filter(
                                        (name) => name !== show.name
                                      ),
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2">{show.name}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(filters.search ||
            filters.roles.length > 0 ||
            filters.statuses.length > 0 ||
            filters.interestInShow.length > 0) && (
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Search: {filters.search}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, search: "" }))
                      }
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    Role: {role.replace("-", " ")}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          roles: prev.roles.filter((r) => r !== role),
                        }))
                      }
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {filters.statuses.map((status) => (
                  <span
                    key={status}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    Status: {status}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          statuses: prev.statuses.filter((s) => s !== status),
                        }))
                      }
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {filters.interestInShow.map((showName) => (
                  <span
                    key={showName}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    Show: {showName}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          interestInShow: prev.interestInShow.filter(
                            (name) => name !== showName
                          ),
                        }))
                      }
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <button
                onClick={() => {
                  setFilters({
                    search: "",
                    roles: ["artist", "on-boarding"],
                    statuses: [],
                    interestInShow: [],
                  });
                  try {
                    sessionStorage.removeItem(SCROLL_STORAGE_KEY);
                    sessionStorage.removeItem(ANCHOR_STORAGE_KEY);
                  } catch (e) {
                    // ignore storage errors
                  }
                  window.scrollTo({ top: 0 });
                }}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {filteredUsers.map((user) => {
              const { soldCount, pendingCount } = getUserArtworkStats(
                user.id || ""
              );

              return (
                <div
                  key={user.id}
                  id={user.id || undefined}
                  className="bg-white rounded-lg shadow p-6 flex flex-col items-center w-full max-w-md lg:max-w-lg cursor-pointer hover:shadow-lg transition-shadow relative"
                  onClick={() => handlePreviewUser(user)}
                >
                  {/* Sale Status Indicators - Top Right */}
                  {(soldCount > 0 || pendingCount > 0) && (
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      {soldCount > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                          <svg
                            className="w-3 h-3 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-xs font-medium text-green-700">
                            {soldCount}
                          </span>
                        </div>
                      )}
                      {pendingCount > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
                          <svg
                            className="w-3 h-3 text-orange-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-xs font-medium text-orange-700">
                            {pendingCount}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <img
                    className="h-20 w-20 rounded-full object-cover mb-3"
                    src={
                      user.photoUrl ||
                      "https://ui-avatars.com/api/?name=" +
                        encodeURIComponent(user.name)
                    }
                    alt={user.name}
                  />
                  <div className="text-lg font-semibold text-gray-900 text-center">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500 text-center mb-4">
                    {user.email}
                  </div>
                  <div className="flex flex-col items-center space-y-2 w-full">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewUser(user);
                      }}
                      className="text-blue-600 hover:text-blue-900 w-full"
                    >
                      Preview
                    </button>
                    {/* <button
                    onClick={() => handleOpenModal(user)}
                    className="text-indigo-600 hover:text-indigo-900 w-full"
                  >
                    Edit
                  </button> */}
                    {user.status !== "showing" &&
                      user.status !== "accepted" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptIntoShow(user);
                          }}
                          className={`text-green-600 hover:text-green-900 w-full ${
                            !user.artworks || user.artworks.length === 0
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          disabled={
                            !user.artworks || user.artworks.length === 0
                          }
                        >
                          Accept into Show
                        </button>
                      )}
                    {user.artshowId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromShow(user);
                        }}
                        className="text-red-600 hover:text-red-900 w-full"
                      >
                        Remove from Show
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className={h4}>
                  {selectedUser ? "Edit User" : "Add User"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {selectedUser && (
                    <>
                      <div>
                        <label className={label}>Name</label>
                        <input
                          type="text"
                          value={selectedUser.name}
                          className={input}
                          disabled
                        />
                      </div>
                      <div>
                        <label className={label}>Email</label>
                        <input
                          type="email"
                          value={selectedUser.email}
                          className={input}
                          disabled
                        />
                      </div>
                      <div>
                        <label className={label}>Bio</label>
                        <textarea
                          value={selectedUser.bio || ""}
                          className={input}
                          rows={2}
                          disabled
                        />
                      </div>
                      <div>
                        <label className={label}>Address</label>
                        <input
                          type="text"
                          value={selectedUser.contactInfo?.address || ""}
                          className={input}
                          disabled
                        />
                      </div>
                      <div>
                        <label className={label}>Phone</label>
                        <input
                          type="text"
                          value={selectedUser.contactInfo?.phone || ""}
                          className={input}
                          disabled
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className={label}>Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as User["role"],
                        })
                      }
                      className={select}
                      required
                    >
                      <option value="admin">admin</option>
                      <option value="on-boarding">On-boarding</option>
                      <option value="artist">Artist</option>
                    </select>
                  </div>
                  <div>
                    <label className={label}>Status</label>
                    <select
                      value={formData.status || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as User["status"],
                        })
                      }
                      className={select}
                      required
                    >
                      <option value="showing">Showing</option>
                      <option value="shown">Shown</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className={label}>Assigned Locations</label>
                    <div className="flex flex-col gap-1 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                      {locations && locations.length > 0 ? (
                        locations
                          .filter((loc) => !!loc.id)
                          .map((loc) => (
                            <label
                              key={loc.id}
                              className="inline-flex items-center gap-2"
                            >
                              <input
                                type="checkbox"
                                checked={formData.assignedLocations?.includes(
                                  loc.id as string
                                )}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const id = loc.id as string;
                                  setFormData((prev) => {
                                    const prevAssigned =
                                      prev.assignedLocations || [];
                                    const updated = checked
                                      ? [...prevAssigned, id]
                                      : prevAssigned.filter(
                                          (lid) => lid !== id
                                        );
                                    return {
                                      ...prev,
                                      assignedLocations: updated,
                                    };
                                  });
                                }}
                              />
                              <span>{loc.name}</span>
                            </label>
                          ))
                      ) : (
                        <span className="text-gray-400 text-sm">
                          No locations found
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className={cancelButton}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={button}>
                      {selectedUser ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {isAcceptShowModalOpen && selectedUser && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start md:pl-64 justify-center"
            onClick={() => setIsAcceptShowModalOpen(false)}
          >
            <div
              className="relative top-10 mx-auto p-5 border w-[600px] max-w-full max-h-[90vh] shadow-lg rounded-md bg-white overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mt-3">
                <h3 className={h4}>Accept {selectedUser.name} into Show</h3>
                <form onSubmit={handleAcceptShowSubmit} className="space-y-4">
                  <div>
                    <label className={label}>Art Show</label>
                    <select
                      value={acceptShowData.artshowId}
                      onChange={(e) =>
                        setAcceptShowData({
                          ...acceptShowData,
                          artshowId: e.target.value,
                        })
                      }
                      className={select}
                      required
                    >
                      <option value="">Select an Art Show</option>
                      {artshows.map((show) => (
                        <option key={show.id} value={show.id}>
                          {show.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={label}>Location</label>
                    <select
                      value={acceptShowData.locationId}
                      onChange={(e) =>
                        setAcceptShowData({
                          ...acceptShowData,
                          locationId: e.target.value,
                        })
                      }
                      className={select}
                      required
                    >
                      <option value="">Select a Location</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={label}>Select Artworks</label>
                    <div className="mt-2 max-h-96 overflow-y-auto border rounded-md p-4">
                      {artworks.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4">
                          {artworks.map((artwork) => (
                            <div
                              key={artwork.id}
                              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                                acceptShowData.selectedArtworks.includes(
                                  artwork.id!
                                )
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                setAcceptShowData((prev) => ({
                                  ...prev,
                                  selectedArtworks:
                                    prev.selectedArtworks.includes(artwork.id!)
                                      ? prev.selectedArtworks.filter(
                                          (id) => id !== artwork.id
                                        )
                                      : [...prev.selectedArtworks, artwork.id!],
                                }));
                              }}
                            >
                              <div className="flex items-start space-x-4">
                                <input
                                  type="checkbox"
                                  id={`artwork-${artwork.id}`}
                                  checked={acceptShowData.selectedArtworks.includes(
                                    artwork.id!
                                  )}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setAcceptShowData((prev) => ({
                                      ...prev,
                                      selectedArtworks: e.target.checked
                                        ? [
                                            ...prev.selectedArtworks,
                                            artwork.id!,
                                          ]
                                        : prev.selectedArtworks.filter(
                                            (id) => id !== artwork.id
                                          ),
                                    }));
                                  }}
                                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-4">
                                    {artwork.images[0] && (
                                      <img
                                        src={artwork.images[0]}
                                        alt={artwork.title}
                                        className="h-64 w-full md:w-64 object-contain rounded-lg shadow-sm bg-gray-100"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                        {artwork.title}
                                      </h4>
                                      <div className="space-y-1">
                                        <p className="text-sm text-gray-600">
                                          <span className="font-medium">
                                            Medium:
                                          </span>{" "}
                                          {getMediumName(artwork.medium)}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          <span className="font-medium">
                                            Dimensions:
                                          </span>{" "}
                                          {artwork.height} × {artwork.width}{" "}
                                          {artwork.uom}
                                        </p>
                                        {artwork.price && (
                                          <p className="text-sm text-gray-600">
                                            <span className="font-medium">
                                              Price:
                                            </span>{" "}
                                            <NumericFormat
                                              value={artwork.price}
                                              thousandSeparator=","
                                              decimalSeparator="."
                                              prefix="$"
                                              decimalScale={2}
                                              fixedDecimalScale
                                              displayType="text"
                                              className="font-semibold text-green-600"
                                            />
                                          </p>
                                        )}
                                        {artwork.description && (
                                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                            {artwork.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No artworks found</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsAcceptShowModalOpen(false)}
                      className={cancelButton}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={button}
                      disabled={acceptShowData.selectedArtworks.length === 0}
                    >
                      Accept
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {isPreviewModalOpen && selectedUser && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start md:pl-64 justify-center"
            onClick={handleClosePreviewModal}
          >
            <div
              className="relative top-10 mx-auto p-5 border w-[800px] max-w-full max-h-[90vh] shadow-lg rounded-md bg-white overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className={h4}>Artist Profile Preview</h3>
                  <button
                    onClick={handleClosePreviewModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center space-x-4 border-b pb-4">
                    <img
                      className="h-20 w-20 rounded-full object-cover"
                      src={
                        selectedUser.photoUrl ||
                        "https://ui-avatars.com/api/?name=" +
                          encodeURIComponent(selectedUser.name)
                      }
                      alt={selectedUser.name}
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedUser.name}
                      </h2>
                      <p className="text-gray-600">{selectedUser.email}</p>
                      <div className="flex space-x-2 mt-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedUser.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : selectedUser.status === "shown"
                              ? "bg-yellow-100 text-yellow-800"
                              : selectedUser.status === "showing"
                              ? "bg-blue-100 text-blue-800"
                              : selectedUser.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {selectedUser.status || "No Status"}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          {selectedUser.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {selectedUser.bio && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Bio
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedUser.bio}
                      </p>
                    </div>
                  )}

                  {/* Contact Information */}
                  {selectedUser.contactInfo && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">
                        Contact Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedUser.contactInfo.address && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Address
                            </label>
                            <p className="text-gray-600">
                              {selectedUser.contactInfo.address}
                            </p>
                          </div>
                        )}
                        {selectedUser.contactInfo.phone && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone
                            </label>
                            <p className="text-gray-600">
                              {selectedUser.contactInfo.phone}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Social Links */}
                  {selectedUser.socialLinks &&
                    Object.keys(selectedUser.socialLinks).length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3">
                          Social Links
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(selectedUser.socialLinks).map(
                            ([platform, link]) =>
                              link && (
                                <div key={platform}>
                                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                    {platform}
                                  </label>
                                  <p className="text-blue-600 hover:text-blue-800">
                                    <a
                                      href={
                                        link.startsWith("http")
                                          ? link
                                          : `https://${platform}.com/${link}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {link}
                                    </a>
                                  </p>
                                </div>
                              )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Payment Information */}
                  {selectedUser.paymentInformation && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">
                        Payment Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedUser.paymentInformation.venmo && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Venmo
                            </label>
                            <p className="text-gray-600">
                              @{selectedUser.paymentInformation.venmo}
                            </p>
                          </div>
                        )}
                        {selectedUser.paymentInformation.zelle && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Zelle
                            </label>
                            <p className="text-gray-600">
                              {selectedUser.paymentInformation.zelle}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notification Preferences */}
                  {selectedUser.notificationPreferences && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">
                        Notification Preferences
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Notifications
                          </label>
                          <p className="text-gray-600">
                            {selectedUser.notificationPreferences.email?.active
                              ? "Active"
                              : "Inactive"}
                            {selectedUser.notificationPreferences.email
                              ?.frequency &&
                              ` (${selectedUser.notificationPreferences.email.frequency})`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Art Show Information */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">
                      Art Show Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.interestInShow && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Interest in Show
                          </label>
                          <p className="text-gray-600">
                            {selectedUser.interestInShow}
                          </p>
                        </div>
                      )}
                      {selectedUser.artshowId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Art Show ID
                          </label>
                          <p className="text-gray-600 font-mono text-sm">
                            {selectedUser.artshowId}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Shown at ArtSpace
                        </label>
                        <p className="text-gray-600">
                          {selectedUser.shownAtArtspace ? "Yes" : "No"}
                        </p>
                      </div>
                      {selectedUser.artworks && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Artworks
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              className="text-indigo-600 hover:text-indigo-900 hover:underline text-sm p-0 bg-transparent border-none cursor-pointer"
                              style={{ outline: "none" }}
                              onClick={() => {
                                try {
                                  sessionStorage.setItem(
                                    SCROLL_STORAGE_KEY,
                                    String(window.scrollY)
                                  );
                                  if (selectedUser.id) {
                                    sessionStorage.setItem(
                                      ANCHOR_STORAGE_KEY,
                                      selectedUser.id
                                    );
                                  }
                                } catch (e) {
                                  // ignore storage errors
                                }
                                handleClosePreviewModal();
                                navigate(`/users/${selectedUser.id}/artworks`);
                              }}
                            >
                              {selectedUser.artworks.length} artworks
                            </button>
                            {(() => {
                              const { soldCount, pendingCount } =
                                getUserArtworkStats(selectedUser.id || "");
                              return (
                                <>
                                  {soldCount > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                                      <svg
                                        className="w-3 h-3 text-green-600"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      <span className="text-xs font-medium text-green-700">
                                        {soldCount}
                                      </span>
                                    </div>
                                  )}
                                  {pendingCount > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
                                      <svg
                                        className="w-3 h-3 text-orange-600"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      <span className="text-xs font-medium text-orange-700">
                                        {pendingCount}
                                      </span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assigned Locations */}
                  {selectedUser.assignedLocations &&
                    selectedUser.assignedLocations.length > 0 && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3">
                          Assigned Locations
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.assignedLocations.map((locationId) => {
                            const location = locations.find(
                              (loc) => loc.id === locationId
                            );
                            return (
                              <span
                                key={locationId}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                {location ? location.name : locationId}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Timestamps */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">
                      Timestamps
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.createdAt && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Created At
                          </label>
                          <p className="text-gray-600">
                            {new Date(selectedUser.createdAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {selectedUser.updatedAt && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Updated
                          </label>
                          <p className="text-gray-600">
                            {new Date(selectedUser.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User ID */}
                  {currentUser?.email === "jgw.jakegeorge@gmail.com" && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">
                        Technical Information
                      </h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          User ID
                        </label>
                        <p className="text-gray-600 font-mono text-sm break-all">
                          {selectedUser.id}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleClosePreviewModal}
                    className={cancelButton}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default Users;
