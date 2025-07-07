import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import {
  fetchAllArtworks,
  updateArtworkShowStatus,
} from "../../features/artworkSlice";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
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
  const [previewArtwork, setPreviewArtwork] = useState<any | null>(null);
  const [isShowStatusDropdownOpen, setIsShowStatusDropdownOpen] =
    useState(false);
  const [isArtistDropdownOpen, setIsArtistDropdownOpen] = useState(false);
  const [isShowsDropdownOpen, setIsShowsDropdownOpen] = useState(false);
  const [isMediumDropdownOpen, setIsMediumDropdownOpen] = useState(false);
  const [isPriceRangeDropdownOpen, setIsPriceRangeDropdownOpen] =
    useState(false);
  const showStatusDropdownRef = useRef<HTMLDivElement>(null);
  const artistDropdownRef = useRef<HTMLDivElement>(null);
  const showsDropdownRef = useRef<HTMLDivElement>(null);
  const mediumDropdownRef = useRef<HTMLDivElement>(null);
  const priceRangeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchAllArtworks());
    dispatch(fetchUsers());
    dispatch(fetchArtshows());
    dispatch(fetchLocations());
    dispatch(fetchMediums());
  }, [dispatch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showStatusDropdownRef.current &&
        !showStatusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsShowStatusDropdownOpen(false);
      }
    }
    if (isShowStatusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isShowStatusDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        artistDropdownRef.current &&
        !artistDropdownRef.current.contains(event.target as Node)
      ) {
        setIsArtistDropdownOpen(false);
      }
    }
    if (isArtistDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isArtistDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showsDropdownRef.current &&
        !showsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsShowsDropdownOpen(false);
      }
    }
    if (isShowsDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isShowsDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mediumDropdownRef.current &&
        !mediumDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMediumDropdownOpen(false);
      }
    }
    if (isMediumDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMediumDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        priceRangeDropdownRef.current &&
        !priceRangeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPriceRangeDropdownOpen(false);
      }
    }
    if (isPriceRangeDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPriceRangeDropdownOpen]);

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

  const handleMarkAsSold = async (artworkId: string) => {
    if (window.confirm("Are you sure you want to mark this artwork as sold?")) {
      try {
        const artworkRef = doc(db, "artworks", artworkId);
        await updateDoc(artworkRef, {
          sold: true,
          updatedAt: new Date().toISOString(),
        });

        // Refresh the artworks list
        await dispatch(fetchAllArtworks());

        toast.success("Artwork marked as sold successfully");
      } catch (error) {
        console.error("Error marking artwork as sold:", error);
        toast.error("Failed to mark artwork as sold");
      }
    }
  };

  return (
    <div className="p-8">
      <ContentWrapper loading={loading}>
        <div className="mb-8">
          <h1 className={h1ReverseDark}>Artworks</h1>
          <p className="text-gray-600">Manage and view all artworks</p>
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
              <div
                className="relative flex-1 min-w-[200px]"
                ref={showStatusDropdownRef}
              >
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() => setIsShowStatusDropdownOpen((open) => !open)}
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
                {isShowStatusDropdownOpen && (
                  <div className="z-10 absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow">
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
                )}
              </div>

              {/* Artist Filter */}
              <div
                className="relative flex-1 min-w-[200px]"
                ref={artistDropdownRef}
              >
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() => setIsArtistDropdownOpen((open) => !open)}
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
                {isArtistDropdownOpen && (
                  <div className="z-10 absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow max-h-60 overflow-y-auto">
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
                                    : prev.artists.filter(
                                        (id) => id !== user.id
                                      ),
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
                )}
              </div>

              {/* Shows Filter */}
              <div
                className="relative flex-1 min-w-[200px]"
                ref={showsDropdownRef}
              >
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() => setIsShowsDropdownOpen((open) => !open)}
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
                {isShowsDropdownOpen && (
                  <div className="z-10 absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow max-h-60 overflow-y-auto">
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
                )}
              </div>

              {/* Medium Filter */}
              <div
                className="relative flex-1 min-w-[200px]"
                ref={mediumDropdownRef}
              >
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() => setIsMediumDropdownOpen((open) => !open)}
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
                {isMediumDropdownOpen && (
                  <div className="z-10 absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow max-h-60 overflow-y-auto">
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
                )}
              </div>

              {/* Price Range Filter */}
              <div
                className="relative flex-1 min-w-[200px]"
                ref={priceRangeDropdownRef}
              >
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() => setIsPriceRangeDropdownOpen((open) => !open)}
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
                {isPriceRangeDropdownOpen && (
                  <div className="z-10 absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow">
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
                )}
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

        {/* Artworks Card Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {filteredArtworks.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">
                No Artworks Found
              </div>
            ) : (
              filteredArtworks.map((artwork) => {
                const artist = getArtistInfo(artwork.artistId);
                return (
                  <div
                    key={artwork.id}
                    className="bg-white rounded-lg shadow p-6 flex flex-col items-center w-full max-w-md lg:max-w-lg"
                  >
                    <div className="w-full flex justify-center mb-3">
                      {artwork.images && artwork.images.length > 0 ? (
                        <img
                          src={artwork.images[0]}
                          alt={artwork.title}
                          className="h-40 w-40 object-cover rounded-lg shadow"
                        />
                      ) : (
                        <div className="h-40 w-40 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 text-center mb-1">
                      {artwork.title}
                    </div>
                    {artist && (
                      <>
                        <div className="text-sm text-gray-700 text-center">
                          {artist.name}
                        </div>
                        <div className="text-xs text-gray-500 text-center mb-2">
                          {artist.email}
                        </div>
                      </>
                    )}
                    <div className="flex flex-col space-y-2 w-full mt-2">
                      <button
                        onClick={() => setPreviewArtwork(artwork)}
                        className="text-blue-600 hover:text-blue-900 w-full"
                      >
                        Preview
                      </button>
                      {!artwork.sold && (
                        <button
                          onClick={() => handleMarkAsSold(artwork.id!)}
                          className="text-green-600 hover:text-green-900 w-full font-medium"
                        >
                          Mark as Sold
                        </button>
                      )}
                      {artwork.sold && (
                        <span className="text-green-600 font-bold text-center py-1">
                          SOLD
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Preview Modal */}
        {previewArtwork &&
          (() => {
            const artist = getArtistInfo(previewArtwork.artistId);
            return (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center">
                <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl max-h-[90vh] shadow-lg rounded-md bg-white overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      Artwork Preview
                    </h3>
                    <button
                      onClick={() => setPreviewArtwork(null)}
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
                    {/* Images Gallery */}
                    {previewArtwork.images &&
                      previewArtwork.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {previewArtwork.images.map(
                            (img: string, idx: number) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Artwork image ${idx + 1}`}
                                className="h-32 w-32 object-cover rounded shadow"
                              />
                            )
                          )}
                        </div>
                      )}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        Title
                      </h4>
                      <p className="text-gray-700">{previewArtwork.title}</p>
                    </div>
                    {artist && (
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-1">
                          Artist
                        </h4>
                        <p className="text-gray-700">{artist.name}</p>
                        <p className="text-gray-500 text-sm">{artist.email}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        Medium
                      </h4>
                      <p className="text-gray-700">
                        {getMediumName(previewArtwork.medium)}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        Dimensions
                      </h4>
                      <p className="text-gray-700">
                        {previewArtwork.height} x {previewArtwork.width}{" "}
                        {previewArtwork.uom}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        Price
                      </h4>
                      <p className="text-gray-700">
                        {previewArtwork.price ? (
                          <NumericFormat
                            value={previewArtwork.price}
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
                      </p>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        Show Status
                      </h4>
                      <p className="text-gray-700">
                        {previewArtwork.showStatus ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              previewArtwork.showStatus === "accepted"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {previewArtwork.showStatus}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Not in Show
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        Sale Status
                      </h4>
                      <p className="text-gray-700">
                        {previewArtwork.sold ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            SOLD
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Available
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        Previous Shows
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {previewArtwork.beenInShows &&
                        previewArtwork.beenInShows.length > 0 ? (
                          previewArtwork.beenInShows.map((showId: string) => {
                            const show = artshows?.find((s) => s.id === showId);
                            return (
                              <span
                                key={showId}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {show?.name}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-sm text-gray-500">
                            No previous shows
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        Description
                      </h4>
                      <p className="text-gray-700 whitespace-pre-line break-words">
                        {previewArtwork.description || "-"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        Last Updated
                      </h4>
                      <p className="text-gray-700">
                        {new Date(previewArtwork.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setPreviewArtwork(null)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

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
