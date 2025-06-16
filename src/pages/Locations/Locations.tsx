import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { fetchLocations, Location } from "../../features/locationsSlice";
import { fetchUsers } from "../../features/usersSlice";
import { fetchAllArtworks } from "../../features/artworkSlice";
import ContentWrapper from "../../components/ContentWrapper";
import { formClasses } from "../../classes/tailwindClasses";

interface FilterState {
  search: string;
  artistFilter: string[];
  shownArtistFilter: string[];
  artworkFilter: string[];
  hungArtworkFilter: string[];
}

interface ColumnVisibility {
  name: boolean;
  currentArtists: boolean;
  artistsThatHaveShown: boolean;
  currentArtworks: boolean;
  artworksThatHaveHungHere: boolean;
  city: boolean;
  contact: boolean;
  hours: boolean;
  actions: boolean;
  isExpanded: boolean;
}

const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  name: true,
  currentArtists: true,
  artistsThatHaveShown: true,
  currentArtworks: true,
  artworksThatHaveHungHere: true,
  city: true,
  contact: true,
  hours: true,
  actions: true,
  isExpanded: false,
};

const Locations = () => {
  const dispatch = useAppDispatch();
  const {
    data: locations,
    loading,
    error,
  } = useAppSelector((state) => state.locations);
  const { data: users } = useAppSelector((state) => state.users);
  const { data: artworks } = useAppSelector((state) => state.artwork);
  const { h1ReverseDark } = formClasses;
  const [search, setSearch] = useState("");
  const [artistFilter, setArtistFilter] = useState<string[]>([]);
  const [shownArtistFilter, setShownArtistFilter] = useState<string[]>([]);
  const [artworkFilter, setArtworkFilter] = useState<string[]>([]);
  const [hungArtworkFilter, setHungArtworkFilter] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedArtworks, setSelectedArtworks] = useState<{
    artworks: string[];
    title: string;
  } | null>(null);
  const [selectedArtists, setSelectedArtists] = useState<{
    artists: string[];
    title: string;
  } | null>(null);
  const [formData, setFormData] = useState<Location>({
    name: "",
    address: "",
    city: "",
    state: "",
    contactPhone: "",
    contactEmail: "",
    managerIds: [],
    hours: "",
    notes: "",
  });
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(
    () => {
      const saved = localStorage.getItem("locationsColumnVisibility");
      return saved ? JSON.parse(saved) : DEFAULT_COLUMN_VISIBILITY;
    }
  );

  useEffect(() => {
    localStorage.setItem(
      "locationsColumnVisibility",
      JSON.stringify(columnVisibility)
    );
  }, [columnVisibility]);

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const resetColumnVisibility = () => {
    setColumnVisibility(DEFAULT_COLUMN_VISIBILITY);
  };

  const getUserInfo = (userId: string) => {
    const user = users?.find((u) => u.id === userId);
    return user ? `${user.name} (${user.email})` : userId;
  };

  const getArtworkInfo = (artworkId: string) => {
    const artwork = artworks?.find((a) => a.id === artworkId);
    return artwork;
  };

  const filteredLocations = locations.filter((location) => {
    const q = search.toLowerCase();
    const matchesSearch =
      location.name.toLowerCase().includes(q) ||
      location.address.toLowerCase().includes(q);
    const matchesArtist =
      artistFilter.length === 0 ||
      (location.artistIds &&
        location.artistIds.some((id: string) => artistFilter.includes(id)));
    const matchesShownArtist =
      shownArtistFilter.length === 0 ||
      (location.artistsThatHaveShown &&
        location.artistsThatHaveShown.some((id: string) =>
          shownArtistFilter.includes(id)
        ));
    const matchesArtwork =
      artworkFilter.length === 0 ||
      (location.artworkIds &&
        location.artworkIds.some((id: string) => artworkFilter.includes(id)));
    const matchesHungArtwork =
      hungArtworkFilter.length === 0 ||
      (location.artworksThatHaveHungHere &&
        location.artworksThatHaveHungHere.some((id: string) =>
          hungArtworkFilter.includes(id)
        ));
    return (
      matchesSearch &&
      matchesArtist &&
      matchesShownArtist &&
      matchesArtwork &&
      matchesHungArtwork
    );
  });

  useEffect(() => {
    dispatch(fetchLocations());
    dispatch(fetchUsers());
    dispatch(fetchAllArtworks());
  }, [dispatch]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingLocation?.id) {
        // Update existing location
        await updateDoc(doc(db, "locations", editingLocation.id), {
          name: formData.name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
          managerIds: formData.managerIds,
          hours: formData.hours,
          notes: formData.notes,
        });
      } else {
        // Create new location
        await addDoc(collection(db, "locations"), {
          name: formData.name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
          managerIds: formData.managerIds,
          hours: formData.hours,
          notes: formData.notes,
        });
      }
      setIsFormOpen(false);
      setEditingLocation(null);
      setFormData({
        name: "",
        address: "",
        city: "",
        state: "",
        contactPhone: "",
        contactEmail: "",
        managerIds: [],
        hours: "",
        notes: "",
      });
      // Refresh locations list
      dispatch(fetchLocations());
    } catch (error) {
      console.error("Error saving location:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData(location);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      try {
        await deleteDoc(doc(db, "locations", id));
        // Refresh locations list
        dispatch(fetchLocations());
      } catch (error) {
        console.error("Error deleting location:", error);
      }
    }
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <ContentWrapper loading={loading}>
        <div className="flex justify-between items-center mb-6">
          <h1 className={h1ReverseDark}>Locations</h1>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Add New Location
          </button>
        </div>

        {/* Collapsible Column Visibility Controls */}
        <div className="mb-4">
          <button
            onClick={() =>
              setColumnVisibility((prev) => ({
                ...prev,
                isExpanded: !prev.isExpanded,
              }))
            }
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg
              className={`w-4 h-4 mr-2 transform transition-transform ${
                columnVisibility.isExpanded ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            Column Visibility
          </button>

          {columnVisibility.isExpanded && (
            <div className="mt-2 p-4 bg-white rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  Visible Columns
                </h3>
                <button
                  onClick={resetColumnVisibility}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Reset to Default
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(columnVisibility)
                  .filter(([key]) => key !== "isExpanded")
                  .map(([key, isVisible]) => (
                    <button
                      key={key}
                      onClick={() =>
                        toggleColumn(key as keyof ColumnVisibility)
                      }
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isVisible
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {key.split(/(?=[A-Z])/).join(" ")}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Unified Search & Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="mb-4">
            <div className="flex">
              <div className="relative w-full">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search locations by name or address..."
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
          <div className="flex flex-wrap gap-4">
            {/* ArtistIds Filter */}
            <div className="relative min-w-[200px]">
              <button
                type="button"
                className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                onClick={() =>
                  document
                    .getElementById("artist-filter-dropdown")
                    ?.classList.toggle("hidden")
                }
              >
                Current Artists
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
                id="artist-filter-dropdown"
                className="z-10 hidden absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow max-h-60 overflow-y-auto"
              >
                <ul className="py-2 text-sm text-gray-700">
                  {users?.map((user) => (
                    <li key={user.id}>
                      <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={artistFilter.includes(user.id!)}
                          onChange={(e) => {
                            setArtistFilter((prev) =>
                              e.target.checked
                                ? [...prev, user.id!]
                                : prev.filter((id) => id !== user.id)
                            );
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2">
                          {user.name} ({user.email})
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* ArtistsThatHaveShown Filter */}
            <div className="relative min-w-[200px]">
              <button
                type="button"
                className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                onClick={() =>
                  document
                    .getElementById("shown-artist-filter-dropdown")
                    ?.classList.toggle("hidden")
                }
              >
                Artists That Have Shown
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
                id="shown-artist-filter-dropdown"
                className="z-10 hidden absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow max-h-60 overflow-y-auto"
              >
                <ul className="py-2 text-sm text-gray-700">
                  {users?.map((user) => (
                    <li key={user.id}>
                      <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={shownArtistFilter.includes(user.id!)}
                          onChange={(e) => {
                            setShownArtistFilter((prev) =>
                              e.target.checked
                                ? [...prev, user.id!]
                                : prev.filter((id) => id !== user.id)
                            );
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2">
                          {user.name} ({user.email})
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Current Artworks Filter */}
            <div className="relative min-w-[200px]">
              <button
                type="button"
                className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                onClick={() =>
                  document
                    .getElementById("artwork-filter-dropdown")
                    ?.classList.toggle("hidden")
                }
              >
                Current Artworks
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
                id="artwork-filter-dropdown"
                className="z-10 hidden absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow max-h-60 overflow-y-auto"
              >
                <ul className="py-2 text-sm text-gray-700">
                  {artworks?.map((artwork) => (
                    <li key={artwork.id}>
                      <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={artworkFilter.includes(artwork.id!)}
                          onChange={(e) => {
                            setArtworkFilter((prev) =>
                              e.target.checked
                                ? [...prev, artwork.id!]
                                : prev.filter((id) => id !== artwork.id)
                            );
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2">{artwork.title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Artworks That Have Hung Here Filter */}
            <div className="relative min-w-[200px]">
              <button
                type="button"
                className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                onClick={() =>
                  document
                    .getElementById("hung-artwork-filter-dropdown")
                    ?.classList.toggle("hidden")
                }
              >
                Artworks That Have Hung Here
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
                id="hung-artwork-filter-dropdown"
                className="z-10 hidden absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow max-h-60 overflow-y-auto"
              >
                <ul className="py-2 text-sm text-gray-700">
                  {artworks?.map((artwork) => (
                    <li key={artwork.id}>
                      <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hungArtworkFilter.includes(artwork.id!)}
                          onChange={(e) => {
                            setHungArtworkFilter((prev) =>
                              e.target.checked
                                ? [...prev, artwork.id!]
                                : prev.filter((id) => id !== artwork.id)
                            );
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2">{artwork.title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Location Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
              <h2 className="text-xl font-bold mb-4">
                {editingLocation ? "Edit Location" : "Add New Location"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hours
                  </label>
                  <input
                    type="text"
                    name="hours"
                    value={formData.hours}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingLocation(null);
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingLocation
                      ? "Update"
                      : "Create"}{" "}
                    Location
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Artists Modal */}
        {selectedArtists && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{selectedArtists.title}</h2>
                <button
                  onClick={() => setSelectedArtists(null)}
                  className="text-gray-500 hover:text-gray-700"
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
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedArtists.artists.map((artistId) => {
                  const artist = users?.find((u) => u.id === artistId);
                  if (!artist) return null;
                  return (
                    <div
                      key={artistId}
                      className="border rounded-lg overflow-hidden"
                    >
                      {artist.photoUrl ? (
                        <img
                          src={artist.photoUrl}
                          alt={artist.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500">No photo</span>
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900">
                          {artist.name}
                        </h3>
                        <p className="text-sm text-gray-500">{artist.email}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Artworks Modal */}
        {selectedArtworks && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{selectedArtworks.title}</h2>
                <button
                  onClick={() => setSelectedArtworks(null)}
                  className="text-gray-500 hover:text-gray-700"
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
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedArtworks.artworks.map((artworkId) => {
                  const artwork = getArtworkInfo(artworkId);
                  if (!artwork) return null;
                  return (
                    <div
                      key={artworkId}
                      className="border rounded-lg overflow-hidden"
                    >
                      {artwork.images && artwork.images.length > 0 && (
                        <img
                          src={artwork.images[0]}
                          alt={artwork.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900">
                          {artwork.title}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Locations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredLocations.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Locations Found
              </h3>
              <p className="text-gray-500 mb-4">
                {locations.length === 0
                  ? "Get started by adding your first gallery location."
                  : "No locations match your search."}
              </p>
              <button
                onClick={() => setIsFormOpen(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Add Your First Location
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columnVisibility.name && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                    )}
                    {columnVisibility.currentArtists && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Artists
                      </th>
                    )}
                    {columnVisibility.artistsThatHaveShown && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Artists That Have Shown
                      </th>
                    )}
                    {columnVisibility.currentArtworks && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Artworks
                      </th>
                    )}
                    {columnVisibility.artworksThatHaveHungHere && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Artworks That Have Hung Here
                      </th>
                    )}
                    {columnVisibility.city && (
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        City
                      </th>
                    )}
                    {columnVisibility.contact && (
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                    )}
                    {columnVisibility.hours && (
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                    )}
                    {columnVisibility.actions && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLocations.map((location: Location) => (
                    <tr key={location.id}>
                      {columnVisibility.name && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {location.name}
                          </div>
                          {columnVisibility.city && (
                            <div className="text-sm text-gray-500 md:hidden">
                              {location.city}, {location.state}
                            </div>
                          )}
                        </td>
                      )}
                      {columnVisibility.currentArtists && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              setSelectedArtists({
                                artists: location.artistIds || [],
                                title: `Current Artists at ${location.name}`,
                              })
                            }
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {location.artistIds?.length || 0} artists
                          </button>
                        </td>
                      )}
                      {columnVisibility.artistsThatHaveShown && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              setSelectedArtists({
                                artists: location.artistsThatHaveShown || [],
                                title: `Artists That Have Shown at ${location.name}`,
                              })
                            }
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {location.artistsThatHaveShown?.length || 0} artists
                          </button>
                        </td>
                      )}
                      {columnVisibility.currentArtworks && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              setSelectedArtworks({
                                artworks: location.artworkIds || [],
                                title: `Current Artworks at ${location.name}`,
                              })
                            }
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {location.artworkIds?.length || 0} artworks
                          </button>
                        </td>
                      )}
                      {columnVisibility.artworksThatHaveHungHere && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              setSelectedArtworks({
                                artworks:
                                  location.artworksThatHaveHungHere || [],
                                title: `Artworks That Have Hung at ${location.name}`,
                              })
                            }
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {location.artworksThatHaveHungHere?.length || 0}{" "}
                            artworks
                          </button>
                        </td>
                      )}
                      {columnVisibility.city && (
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {location.city}
                          </div>
                          <div className="text-sm text-gray-500">
                            {location.state}
                          </div>
                        </td>
                      )}
                      {columnVisibility.contact && (
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {location.contactEmail}
                          </div>
                          <div className="text-sm text-gray-500">
                            {location.contactPhone}
                          </div>
                        </td>
                      )}
                      {columnVisibility.hours && (
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {location.hours}
                        </td>
                      )}
                      {columnVisibility.actions && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(location)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                            disabled={isSubmitting}
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ContentWrapper>
    </div>
  );
};

export default Locations;
