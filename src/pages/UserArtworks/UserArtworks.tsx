import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchUserById } from "../../features/usersSlice";
import {
  fetchArtistArtworks,
  updateArtworkShowStatus,
} from "../../features/artworkSlice";
import { fetchArtshows } from "../../features/artshowsSlice";
import { fetchLocations } from "../../features/locationsSlice";
import { toast } from "react-hot-toast";
import ContentWrapper from "../../components/ContentWrapper";
import { Artwork } from "../../types/artwork";

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

const UserArtworks = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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

  const { data: user } = useAppSelector((state) => state.users);
  const { data: artworks, loading } = useAppSelector((state) => state.artwork);
  const { data: artshows } = useAppSelector((state) => state.artshows);
  const { data: locations } = useAppSelector((state) => state.locations);

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserById(userId));
      dispatch(fetchArtistArtworks(userId));
      dispatch(fetchArtshows());
      dispatch(fetchLocations());
    }
  }, [dispatch, userId]);

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
      if (userId) {
        await dispatch(fetchArtistArtworks(userId));
      }

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

  const getStatusBadge = (artwork: Artwork) => {
    if (!artwork.showStatus) return null;

    const statusColors: Record<NonNullable<Artwork["showStatus"]>, string> = {
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          statusColors[artwork.showStatus]
        }`}
      >
        {artwork.showStatus}
      </span>
    );
  };

  const getShowName = (artshowId: string) => {
    const show = artshows.find((s) => s.id === artshowId);
    return show?.name || "Unknown Show";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const currentUser = user.find((u) => u.id === userId);

  if (!currentUser) {
    return (
      <div className="text-center text-red-600">
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Artworks by {currentUser.name}</h1>
          <p className="text-gray-600">{currentUser.email}</p>
        </div>
        <button
          onClick={() => navigate("/users")}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Back to Users
        </button>
      </div>

      {artworks && artworks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artworks.map((artwork) => (
            <div
              key={artwork.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {artwork.images[0] && (
                <div
                  className="relative cursor-pointer group"
                  onClick={() =>
                    setSelectedArtwork({
                      images: artwork.images,
                      index: 0,
                    })
                  }
                >
                  <img
                    src={artwork.images[0]}
                    alt={artwork.title}
                    className="w-full h-48 object-cover"
                  />
                  {artwork.images.length > 1 && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {artwork.images.length} images
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold">{artwork.title}</h3>
                  {getStatusBadge(artwork)}
                </div>
                <p className="text-gray-600 mb-1">{artwork.medium}</p>
                <p className="text-gray-600 mb-1">
                  {artwork.height} X {artwork.width} {artwork.uom}
                </p>
                <p className="text-gray-600 mb-2">{artwork.date}</p>
                <p className="text-gray-700 mb-4">{artwork.description}</p>

                {artwork.artshowId && (
                  <p className="text-sm text-gray-600 mb-2">
                    Show: {getShowName(artwork.artshowId)}
                  </p>
                )}

                <button
                  onClick={() => handleShowAssignment(artwork.id!)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  {artwork.artshowId
                    ? "Change Show Assignment"
                    : "Assign to Show"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p>No artworks found for this user.</p>
        </div>
      )}

      {selectedArtwork && (
        <ImageGallery
          images={selectedArtwork.images}
          isOpen={true}
          onClose={() => setSelectedArtwork(null)}
          initialIndex={selectedArtwork.index}
        />
      )}

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
                      {locations.map((location) => (
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
                        if (userId) {
                          await dispatch(fetchArtistArtworks(userId));
                        }

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
    </div>
  );
};

export default UserArtworks;
