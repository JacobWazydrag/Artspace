import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import {
  fetchAllArtworks,
  updateArtworkShowStatus,
} from "../../features/artworkSlice";
import { fetchUsers } from "../../features/usersSlice";
import { fetchArtshows } from "../../features/artshowsSlice";
import { fetchLocations } from "../../features/locationsSlice";
import { fetchMediums } from "../../features/mediumsSlice";
import ContentWrapper from "../../components/ContentWrapper";
import { formClasses } from "../../classes/tailwindClasses";
import { toast } from "react-hot-toast";
import { NumericFormat } from "react-number-format";
import React from "react";

interface FilterState {
  search: string;
  showStatuses: string[];
  artists: string[];
  shows: string[];
  mediums: string[];
  priceRange: string;
}

interface ColumnVisibility {
  image: boolean;
  title: boolean;
  medium: boolean;
  dimensions: boolean;
  price: boolean;
  lastUpdated: boolean;
  description: boolean;
  artist: boolean;
  images: boolean;
  showStatus: boolean;
  previousShows: boolean;
  actions: boolean;
  isExpanded: boolean;
}

const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  image: true,
  title: true,
  medium: true,
  dimensions: true,
  price: true,
  lastUpdated: false,
  description: false,
  artist: true,
  images: false,
  showStatus: false,
  previousShows: false,
  actions: false,
  isExpanded: false,
};

interface ImageGalleryProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

const ImageGallery = ({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
}: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  if (!isOpen) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="relative max-w-4xl w-full mx-4">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
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

        <div className="relative">
          <img
            src={images[currentIndex]}
            alt={`Artwork image ${currentIndex + 1}`}
            className="w-full h-auto max-h-[80vh] object-contain"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};

const Artworks = () => {
  const dispatch = useAppDispatch();
  const {
    data: artworks,
    loading,
    error,
  } = useAppSelector((state) => state.artwork);
  const { data: users } = useAppSelector((state) => state.users);
  const { data: artshows } = useAppSelector((state) => state.artshows);
  const { data: locations } = useAppSelector((state) => state.locations);
  const { data: mediums } = useAppSelector((state) => state.mediums);
  const { h1ReverseDark } = formClasses;
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    showStatuses: [],
    artists: [],
    shows: [],
    mediums: [],
    priceRange: "",
  });
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(
    () => {
      const saved = localStorage.getItem("artworksColumnVisibility");
      return saved ? JSON.parse(saved) : DEFAULT_COLUMN_VISIBILITY;
    }
  );
  const [selectedArtwork, setSelectedArtwork] = useState<{
    images: string[];
    index: number;
  } | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(
    null
  );
  const [assignmentData, setAssignmentData] = useState({
    artshowId: "",
    locationId: "",
  });
  const [descModal, setDescModal] = useState<{ open: boolean; text: string }>({
    open: false,
    text: "",
  });

  useEffect(() => {
    dispatch(fetchAllArtworks());
    dispatch(fetchUsers());
    dispatch(fetchArtshows());
    dispatch(fetchLocations());
    dispatch(fetchMediums());
  }, [dispatch]);

  useEffect(() => {
    localStorage.setItem(
      "artworksColumnVisibility",
      JSON.stringify(columnVisibility)
    );
  }, [columnVisibility]);

  const filteredArtworks = artworks.filter((artwork) => {
    if (
      filters.search &&
      !artwork.title.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    if (
      filters.showStatuses.length > 0 &&
      (!artwork.showStatus ||
        !filters.showStatuses.includes(artwork.showStatus))
    ) {
      return false;
    }

    if (
      filters.artists.length > 0 &&
      !filters.artists.includes(artwork.artistId)
    ) {
      return false;
    }

    if (
      filters.shows.length > 0 &&
      (!artwork.beenInShows ||
        !filters.shows.some((showId) => artwork.beenInShows?.includes(showId)))
    ) {
      return false;
    }

    if (
      filters.mediums.length > 0 &&
      !filters.mediums.includes(artwork.medium)
    ) {
      return false;
    }

    if (filters.priceRange && artwork.price) {
      const [min, max] = filters.priceRange.split("-").map(Number);
      if (max) {
        if (artwork.price < min || artwork.price > max) return false;
      } else {
        if (artwork.price < min) return false;
      }
    }

    return true;
  });

  const getArtistInfo = (artistId: string) => {
    const artist = users?.find((user) => user.id === artistId);
    return artist ? { name: artist.name, email: artist.email } : null;
  };

  const getShowInfo = (showId: string) => {
    const show = artshows?.find((s) => s.id === showId);
    return show ? { name: show.name, status: show.status } : null;
  };

  const getMediumName = (mediumId: string) => {
    const medium = mediums?.find((m) => m.id === mediumId);
    return medium?.name || mediumId;
  };

  const handleShowAssignment = (artworkId: string) => {
    setSelectedArtworkId(artworkId);
    const artwork = artworks.find((a) => a.id === artworkId);
    if (artwork) {
      setAssignmentData({
        artshowId: artwork.artshowId || "",
        locationId: artwork.locationId || "",
      });
    }
    setShowAssignmentModal(true);
  };

  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtworkId) return;

    try {
      const artwork = artworks.find((a) => a.id === selectedArtworkId);
      if (!artwork) return;

      const showStatus = assignmentData.artshowId ? "accepted" : "rejected";

      await dispatch(
        updateArtworkShowStatus({
          artworkId: selectedArtworkId,
          artshowId: assignmentData.artshowId,
          locationId: assignmentData.locationId,
          showStatus,
        })
      ).unwrap();

      // Refresh the artworks list
      await dispatch(fetchAllArtworks());

      toast.success(
        showStatus === "accepted"
          ? "Artwork assigned to show successfully"
          : "Artwork rejected from show"
      );
      setShowAssignmentModal(false);
    } catch (error) {
      console.error("Error updating artwork show status:", error);
      toast.error("Failed to update artwork show status");
    }
  };

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const resetColumnVisibility = () => {
    setColumnVisibility(DEFAULT_COLUMN_VISIBILITY);
  };

  return (
    <div className="p-8">
      <ContentWrapper loading={loading}>
        <div className="mb-8">
          <h1 className={h1ReverseDark}>Artworks</h1>
          <p className="text-gray-600">Manage and view all artworks</p>
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
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <div className="relative w-full mb-4">
              <input
                type="search"
                id="search"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search artworks by title..."
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

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Show Status Filter */}
              <div className="relative flex-1 min-w-[200px]">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() =>
                    document
                      .getElementById("show-status-dropdown")
                      ?.classList.toggle("hidden")
                  }
                >
                  Show Status
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
                  id="show-status-dropdown"
                  className="z-10 hidden absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow"
                >
                  <ul className="py-2 text-sm text-gray-700">
                    {["accepted", "rejected"].map((status) => (
                      <li key={status}>
                        <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.showStatuses.includes(status)}
                            onChange={(e) => {
                              setFilters((prev) => ({
                                ...prev,
                                showStatuses: e.target.checked
                                  ? [...prev.showStatuses, status]
                                  : prev.showStatuses.filter(
                                      (s) => s !== status
                                    ),
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

              {/* Artist Filter */}
              <div className="relative flex-1 min-w-[200px]">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() =>
                    document
                      .getElementById("artist-dropdown")
                      ?.classList.toggle("hidden")
                  }
                >
                  Artist
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
                  id="artist-dropdown"
                  className="z-10 hidden absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow max-h-60 overflow-y-auto"
                >
                  <ul className="py-2 text-sm text-gray-700">
                    {users?.map((user) => (
                      <li key={user.id}>
                        <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.artists.includes(user.id!)}
                            onChange={(e) => {
                              setFilters((prev) => ({
                                ...prev,
                                artists: e.target.checked
                                  ? [...prev.artists, user.id!]
                                  : prev.artists.filter((id) => id !== user.id),
                              }));
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2">{user.name}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Shows Filter */}
              <div className="relative flex-1 min-w-[200px]">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() =>
                    document
                      .getElementById("shows-dropdown")
                      ?.classList.toggle("hidden")
                  }
                >
                  Previous Shows
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
                  id="shows-dropdown"
                  className="z-10 hidden absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow max-h-60 overflow-y-auto"
                >
                  <ul className="py-2 text-sm text-gray-700">
                    {artshows?.map((show) => (
                      <li key={show.id}>
                        <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.shows.includes(show.id!)}
                            onChange={(e) => {
                              setFilters((prev) => ({
                                ...prev,
                                shows: e.target.checked
                                  ? [...prev.shows, show.id!]
                                  : prev.shows.filter((id) => id !== show.id),
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
              </div>

              {/* Medium Filter */}
              <div className="relative flex-1 min-w-[200px]">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() =>
                    document
                      .getElementById("medium-dropdown")
                      ?.classList.toggle("hidden")
                  }
                >
                  Medium
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
                  id="medium-dropdown"
                  className="z-10 hidden absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow max-h-60 overflow-y-auto"
                >
                  <ul className="py-2 text-sm text-gray-700">
                    {mediums?.map((medium) => (
                      <li key={medium.id}>
                        <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.mediums.includes(medium.id!)}
                            onChange={(e) => {
                              setFilters((prev) => ({
                                ...prev,
                                mediums: e.target.checked
                                  ? [...prev.mediums, medium.id!]
                                  : prev.mediums.filter(
                                      (id) => id !== medium.id
                                    ),
                              }));
                            }}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2">{medium.name}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="relative flex-1 min-w-[200px]">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() =>
                    document
                      .getElementById("price-range-dropdown")
                      ?.classList.toggle("hidden")
                  }
                >
                  Price Range
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
                  id="price-range-dropdown"
                  className="z-10 hidden absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow"
                >
                  <ul className="py-2 text-sm text-gray-700">
                    <li>
                      <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="radio"
                          name="priceRange"
                          checked={filters.priceRange === ""}
                          onChange={() =>
                            setFilters((prev) => ({
                              ...prev,
                              priceRange: "",
                            }))
                          }
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2">Any Price</span>
                      </label>
                    </li>
                    <li>
                      <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="radio"
                          name="priceRange"
                          checked={filters.priceRange === "0-49"}
                          onChange={() =>
                            setFilters((prev) => ({
                              ...prev,
                              priceRange: "0-49",
                            }))
                          }
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2">Under $50</span>
                      </label>
                    </li>
                    <li>
                      <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="radio"
                          name="priceRange"
                          checked={filters.priceRange === "50-149"}
                          onChange={() =>
                            setFilters((prev) => ({
                              ...prev,
                              priceRange: "50-149",
                            }))
                          }
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2">$50 - $149</span>
                      </label>
                    </li>
                    <li>
                      <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="radio"
                          name="priceRange"
                          checked={filters.priceRange === "150-499"}
                          onChange={() =>
                            setFilters((prev) => ({
                              ...prev,
                              priceRange: "150-499",
                            }))
                          }
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2">$150 - $499</span>
                      </label>
                    </li>
                    <li>
                      <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="radio"
                          name="priceRange"
                          checked={filters.priceRange === "500-999"}
                          onChange={() =>
                            setFilters((prev) => ({
                              ...prev,
                              priceRange: "500-999",
                            }))
                          }
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2">$500 - $999</span>
                      </label>
                    </li>
                    <li>
                      <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <input
                          type="radio"
                          name="priceRange"
                          checked={filters.priceRange === "1000"}
                          onChange={() =>
                            setFilters((prev) => ({
                              ...prev,
                              priceRange: "1000",
                            }))
                          }
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2">$1,000+</span>
                      </label>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.search ||
              filters.showStatuses.length > 0 ||
              filters.artists.length > 0 ||
              filters.shows.length > 0 ||
              filters.mediums.length > 0 ||
              filters.priceRange) && (
              <div className="mt-4 flex items-center justify-between">
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
                  {filters.showStatuses.map((status) => (
                    <span
                      key={status}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      Status: {status}
                      <button
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            showStatuses: prev.showStatuses.filter(
                              (s) => s !== status
                            ),
                          }))
                        }
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {filters.artists.map((artistId) => {
                    const artist = users?.find((u) => u.id === artistId);
                    return (
                      <span
                        key={artistId}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        Artist: {artist?.name}
                        <button
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              artists: prev.artists.filter(
                                (id) => id !== artistId
                              ),
                            }))
                          }
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                  {filters.shows.map((showId) => {
                    const show = artshows?.find((s) => s.id === showId);
                    return (
                      <span
                        key={showId}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        Show: {show?.name}
                        <button
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              shows: prev.shows.filter((id) => id !== showId),
                            }))
                          }
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                  {filters.mediums.map((mediumId) => {
                    const medium = mediums?.find((m) => m.id === mediumId);
                    return (
                      <span
                        key={mediumId}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        Medium: {medium?.name}
                        <button
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              mediums: prev.mediums.filter(
                                (id) => id !== mediumId
                              ),
                            }))
                          }
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                  {filters.priceRange && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Price:{" "}
                      {filters.priceRange === "1000"
                        ? "$1,000+"
                        : filters.priceRange === ""
                        ? "Any Price"
                        : `$${filters.priceRange.split("-")[0]} - $${
                            filters.priceRange.split("-")[1]
                          }`}
                      <button
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            priceRange: "",
                          }))
                        }
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
                <button
                  onClick={() =>
                    setFilters({
                      search: "",
                      showStatuses: [],
                      artists: [],
                      shows: [],
                      mediums: [],
                      priceRange: "",
                    })
                  }
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Artworks Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredArtworks.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Artworks Found
              </h3>
              <p className="text-gray-500 mb-4">
                {artworks.length === 0
                  ? "There are no artworks in the system yet."
                  : "No artworks match your current filters."}
              </p>
              {artworks.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Artworks will appear here once artists upload them.
                </p>
              ) : (
                <button
                  onClick={() =>
                    setFilters({
                      search: "",
                      showStatuses: [],
                      artists: [],
                      shows: [],
                      mediums: [],
                      priceRange: "",
                    })
                  }
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columnVisibility.image && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Image
                      </th>
                    )}
                    {columnVisibility.title && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Title
                      </th>
                    )}
                    {columnVisibility.medium && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Medium
                      </th>
                    )}
                    {columnVisibility.dimensions && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Dimensions
                      </th>
                    )}
                    {columnVisibility.price && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Price
                      </th>
                    )}
                    {columnVisibility.lastUpdated && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Last Updated
                      </th>
                    )}
                    {columnVisibility.description && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Description
                      </th>
                    )}
                    {columnVisibility.artist && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Artist
                      </th>
                    )}
                    {columnVisibility.images && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Images
                      </th>
                    )}
                    {columnVisibility.showStatus && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Show Status
                      </th>
                    )}
                    {columnVisibility.previousShows && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Previous Shows
                      </th>
                    )}
                    {columnVisibility.actions && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredArtworks.map((artwork) => (
                    <tr key={artwork.id}>
                      {columnVisibility.image && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex-shrink-0 h-10 w-10">
                            {artwork.images && artwork.images.length > 0 ? (
                              <img
                                src={artwork.images[0]}
                                alt={artwork.title}
                                className="h-10 w-10 rounded-full object-cover cursor-pointer hover:opacity-75 transition-opacity"
                                onClick={() =>
                                  setSelectedArtwork({
                                    images: artwork.images,
                                    index: 0,
                                  })
                                }
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">
                                  No image
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      {columnVisibility.title && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {artwork.title}
                          </div>
                        </td>
                      )}
                      {columnVisibility.medium && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getMediumName(artwork.medium)}
                          </div>
                        </td>
                      )}
                      {columnVisibility.dimensions && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {artwork.height} x {artwork.width} {artwork.uom}
                          </div>
                        </td>
                      )}
                      {columnVisibility.price && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {artwork.price ? (
                              <NumericFormat
                                value={artwork.price}
                                thousandSeparator=","
                                decimalSeparator="."
                                prefix="$"
                                decimalScale={2}
                                fixedDecimalScale
                                displayType="text"
                              />
                            ) : (
                              "Price not available"
                            )}
                          </div>
                        </td>
                      )}
                      {columnVisibility.lastUpdated && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(artwork.updatedAt).toLocaleDateString()}
                          </div>
                        </td>
                      )}
                      {columnVisibility.description && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            className="text-sm text-blue-600 hover:underline focus:outline-none"
                            onClick={() =>
                              setDescModal({
                                open: true,
                                text: artwork.description,
                              })
                            }
                          >
                            {artwork.description &&
                            artwork.description.length > 10
                              ? artwork.description.slice(0, 10) + "..."
                              : artwork.description || "-"}
                          </button>
                        </td>
                      )}
                      {columnVisibility.artist && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getArtistInfo(artwork.artistId)?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getArtistInfo(artwork.artistId)?.email}
                          </div>
                        </td>
                      )}
                      {columnVisibility.images && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              setSelectedArtwork({
                                images: artwork.images,
                                index: 0,
                              })
                            }
                            className="text-sm text-indigo-600 hover:text-indigo-900"
                          >
                            {artwork.images.length} images
                          </button>
                        </td>
                      )}
                      {columnVisibility.showStatus && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {artwork.showStatus ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                artwork.showStatus === "accepted"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {artwork.showStatus}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">
                              Not in Show
                            </span>
                          )}
                        </td>
                      )}
                      {columnVisibility.previousShows && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {artwork.beenInShows?.map((showId) => {
                              const show = artshows?.find(
                                (s) => s.id === showId
                              );
                              return (
                                <span
                                  key={showId}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {show?.name}
                                </span>
                              );
                            })}
                            {(!artwork.beenInShows ||
                              artwork.beenInShows.length === 0) && (
                              <span className="text-sm text-gray-500">
                                No previous shows
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      {columnVisibility.actions && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleShowAssignment(artwork.id!)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {artwork.artshowId
                              ? "Change Show Assignment"
                              : "Assign to Show"}
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

        {/* Image Gallery Modal */}
        {selectedArtwork && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="relative">
                  <img
                    src={selectedArtwork.images[selectedArtwork.index]}
                    alt="Selected artwork"
                    className="w-full h-auto rounded-lg"
                  />
                  {selectedArtwork.images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setSelectedArtwork((prev) => ({
                            ...prev!,
                            index:
                              (prev!.index - 1 + prev!.images.length) %
                              prev!.images.length,
                          }))
                        }
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                      >
                        <svg
                          className="w-6 h-6 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          setSelectedArtwork((prev) => ({
                            ...prev!,
                            index: (prev!.index + 1) % prev!.images.length,
                          }))
                        }
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                      >
                        <svg
                          className="w-6 h-6 text-gray-600"
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
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedArtwork(null)}
                    className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                  >
                    <svg
                      className="w-6 h-6 text-gray-600"
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
                <div className="mt-2 text-center text-sm text-gray-500">
                  Image {selectedArtwork.index + 1} of{" "}
                  {selectedArtwork.images.length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show Assignment Modal */}
        {showAssignmentModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Manage Artwork Show Status
                </h3>
                <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Art Show
                    </label>
                    <select
                      value={assignmentData.artshowId}
                      onChange={(e) =>
                        setAssignmentData({
                          ...assignmentData,
                          artshowId: e.target.value,
                          locationId: "", // Reset location when show changes
                        })
                      }
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="">Select a Show</option>
                      {artshows.map((show) => (
                        <option key={show.id} value={show.id}>
                          {show.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {assignmentData.artshowId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <select
                        value={assignmentData.locationId}
                        onChange={(e) =>
                          setAssignmentData({
                            ...assignmentData,
                            locationId: e.target.value,
                          })
                        }
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        required
                      >
                        <option value="">Select a Location</option>
                        {locations
                          ?.filter((location) => {
                            const selectedShow = artshows.find(
                              (show) => show.id === assignmentData.artshowId
                            );
                            return (
                              selectedShow &&
                              location.id === selectedShow.locationId
                            );
                          })
                          .map((location) => (
                            <option key={location.id} value={location.id}>
                              {location.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAssignmentModal(false)}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await dispatch(
                            updateArtworkShowStatus({
                              artworkId: selectedArtworkId!,
                              artshowId: "",
                              locationId: "",
                              showStatus: "rejected",
                            })
                          ).unwrap();

                          // Refresh the artworks list
                          await dispatch(fetchAllArtworks());

                          toast.success("Artwork rejected from show");
                          setShowAssignmentModal(false);
                        } catch (error) {
                          console.error("Error rejecting artwork:", error);
                          toast.error("Failed to reject artwork");
                        }
                      }}
                      className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Reject
                    </button>
                    <button
                      type="submit"
                      disabled={
                        !assignmentData.artshowId || !assignmentData.locationId
                      }
                      className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Accept
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Description Modal */}
        {descModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setDescModal({ open: false, text: "" })}
              >
                ×
              </button>
              <h3 className="text-lg font-semibold mb-4">Description</h3>
              <div className="text-gray-800 whitespace-pre-line break-words">
                {descModal.text}
              </div>
            </div>
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default Artworks;
