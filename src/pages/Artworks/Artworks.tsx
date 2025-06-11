import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import {
  fetchAllArtworks,
  updateArtworkShowStatus,
} from "../../features/artworkSlice";
import { fetchUsers } from "../../features/usersSlice";
import { fetchArtshows } from "../../features/artshowsSlice";
import { fetchLocations } from "../../features/locationsSlice";
import ContentWrapper from "../../components/ContentWrapper";
import { formClasses } from "../../classes/tailwindClasses";
import { toast } from "react-hot-toast";

interface FilterState {
  search: string;
  showStatuses: string[];
  artists: string[];
  shows: string[];
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
  const { h1ReverseDark } = formClasses;
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    showStatuses: [],
    artists: [],
    shows: [],
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

  useEffect(() => {
    dispatch(fetchAllArtworks());
    dispatch(fetchUsers());
    dispatch(fetchArtshows());
    dispatch(fetchLocations());
  }, [dispatch]);

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

  return (
    <div className="p-8">
      <ContentWrapper loading={loading}>
        <div className="flex justify-between items-center mb-6">
          <h1 className={h1ReverseDark}>Artworks</h1>
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
            </div>

            {/* Active Filters */}
            {(filters.search ||
              filters.showStatuses.length > 0 ||
              filters.artists.length > 0 ||
              filters.shows.length > 0) && (
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
                </div>
                <button
                  onClick={() =>
                    setFilters({
                      search: "",
                      showStatuses: [],
                      artists: [],
                      shows: [],
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
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Title
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Artist
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Images
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Show Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Previous Shows
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredArtworks.map((artwork) => (
                    <tr key={artwork.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {artwork.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getArtistInfo(artwork.artistId)?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getArtistInfo(artwork.artistId)?.email}
                        </div>
                      </td>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {artwork.showStatus && (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              artwork.showStatus === "accepted"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {artwork.showStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {artwork.beenInShows?.map((showId) => {
                            const show = artshows?.find((s) => s.id === showId);
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
      </ContentWrapper>
    </div>
  );
};

export default Artworks;
