import { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  User,
} from "../../features/usersSlice";
import { useNavigate } from "react-router-dom";
import ContentWrapper from "../../components/ContentWrapper";
import { formClasses } from "../../classes/tailwindClasses";
import { fetchArtshows } from "../../features/artshowsSlice";
import { fetchArtistArtworks } from "../../features/artworkSlice";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAcceptShowModalOpen, setIsAcceptShowModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    role: "on-boarding",
    status: "active",
    assignedLocations: [],
  });
  const [acceptShowData, setAcceptShowData] = useState({
    artshowId: "",
    locationId: "",
    selectedArtworks: [] as string[],
  });
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    roles: [],
    statuses: [],
    interestInShow: [],
  });

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchArtshows());
  }, [dispatch]);

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
        status: "active",
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
      status: "active",
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

      await updateDoc(locationRef, {
        artworkIds: [...currentLocationArtworkIds, ...selectedArtworkIds],
        artistIds: [...currentLocationArtistIds, selectedUser.id],
        updatedAt: new Date().toISOString(),
      });

      const artshowRef = doc(db, "artshows", acceptShowData.artshowId);
      const artshowDoc = await getDoc(artshowRef);
      const currentArtistIds = artshowDoc.data()?.artistIds || [];

      await updateDoc(artshowRef, {
        artworkIds: selectedArtworkIds,
        artistIds: [...currentArtistIds, selectedUser.id],
        updatedAt: new Date().toISOString(),
      });

      await Promise.all(updatePromises);
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
            updatedAt: new Date().toISOString(),
          })
        );

        const updatedArtistIds = (artshowData?.artistIds || []).filter(
          (id: string) => id !== user.id
        );
        const updatedArtworkIds = (artshowData?.artworkIds || []).filter(
          (id: string) => !artworkIds.includes(id)
        );

        await updateDoc(artshowRef, {
          artistIds: updatedArtistIds,
          artworkIds: updatedArtworkIds,
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

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        if (
          filters.search &&
          !user.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !user.email.toLowerCase().includes(filters.search.toLowerCase())
        ) {
          return false;
        }

        if (filters.roles.length > 0 && !filters.roles.includes(user.role)) {
          return false;
        }

        if (
          filters.statuses.length > 0 &&
          !filters.statuses.includes(user.status)
        ) {
          return false;
        }

        if (
          filters.interestInShow.length > 0 &&
          !filters.interestInShow.includes(user.interestInShow || "none")
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, filters]);

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
          <h1 className={h1ReverseDark}>Users</h1>
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
              <div className="relative">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() =>
                    document
                      .getElementById("role-dropdown")
                      ?.classList.toggle("hidden")
                  }
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
                <div
                  id="role-dropdown"
                  className="z-10 hidden absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow"
                >
                  <ul className="py-2 text-sm text-gray-700">
                    {["manager", "on-boarding", "artist"].map((role) => (
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
              </div>

              <div className="relative">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() =>
                    document
                      .getElementById("status-dropdown")
                      ?.classList.toggle("hidden")
                  }
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
                <div
                  id="status-dropdown"
                  className="z-10 hidden absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow"
                >
                  <ul className="py-2 text-sm text-gray-700">
                    {["active", "inactive", "banned"].map((status) => (
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
                                  : prev.statuses.filter((s) => s !== status),
                              }));
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 capitalize">{status}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="relative">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() =>
                    document
                      .getElementById("interest-dropdown")
                      ?.classList.toggle("hidden")
                  }
                >
                  Interest in Show
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
                <div
                  id="interest-dropdown"
                  className="z-10 hidden absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow"
                >
                  <ul className="py-2 text-sm text-gray-700">
                    {["yes", "no", "maybe"].map((interest) => (
                      <li key={interest}>
                        <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.interestInShow.includes(interest)}
                            onChange={(e) => {
                              setFilters((prev) => ({
                                ...prev,
                                interestInShow: e.target.checked
                                  ? [...prev.interestInShow, interest]
                                  : prev.interestInShow.filter(
                                      (i) => i !== interest
                                    ),
                              }));
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 capitalize">{interest}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
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
                {filters.interestInShow.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    Interest: {interest}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          interestInShow: prev.interestInShow.filter(
                            (i) => i !== interest
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
                onClick={() =>
                  setFilters({
                    search: "",
                    roles: [],
                    statuses: [],
                    interestInShow: [],
                  })
                }
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interest in Show
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Artworks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={
                            user.photoUrl ||
                            "https://ui-avatars.com/api/?name=" +
                              encodeURIComponent(user.name)
                          }
                          alt={user.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : user.status === "inactive"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.interestInShow || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleArtworksClick(user.id!)}
                      className="text-sm text-indigo-600 hover:text-indigo-900 hover:underline"
                    >
                      {user.artworks?.length || 0} artworks
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user.role === "on-boarding" && (
                      <button
                        onClick={() => handleAcceptIntoShow(user)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Accept into Show
                      </button>
                    )}
                    {user.artshowId && (
                      <button
                        onClick={() => handleRemoveFromShow(user)}
                        className="text-red-600 hover:text-red-900 mr-4"
                      >
                        Remove from Show
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenModal(user)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                      <option value="manager">Manager</option>
                      <option value="on-boarding">On-boarding</option>
                      <option value="artist">Artist</option>
                    </select>
                  </div>
                  <div>
                    <label className={label}>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as User["status"],
                        })
                      }
                      className={select}
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="banned">Banned</option>
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
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
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
                    <div className="mt-2 max-h-60 overflow-y-auto border rounded-md p-4">
                      {artworks.length > 0 ? (
                        <div className="space-y-3">
                          {artworks.map((artwork) => (
                            <div
                              key={artwork.id}
                              className="flex items-center space-x-3"
                            >
                              <input
                                type="checkbox"
                                id={`artwork-${artwork.id}`}
                                checked={acceptShowData.selectedArtworks.includes(
                                  artwork.id!
                                )}
                                onChange={(e) => {
                                  setAcceptShowData((prev) => ({
                                    ...prev,
                                    selectedArtworks: e.target.checked
                                      ? [...prev.selectedArtworks, artwork.id!]
                                      : prev.selectedArtworks.filter(
                                          (id) => id !== artwork.id
                                        ),
                                  }));
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label
                                htmlFor={`artwork-${artwork.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="flex items-center space-x-3">
                                  {artwork.images[0] && (
                                    <img
                                      src={artwork.images[0]}
                                      alt={artwork.title}
                                      className="h-12 w-12 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {artwork.title}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {artwork.medium} • {artwork.height}x
                                      {artwork.width} {artwork.uom}
                                    </p>
                                  </div>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No artworks found
                        </p>
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
      </ContentWrapper>
    </div>
  );
};

export default Users;
