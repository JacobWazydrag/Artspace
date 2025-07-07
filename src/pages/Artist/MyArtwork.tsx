import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchArtistArtworks } from "../../features/artworkSlice";
import ContentWrapper from "../../components/ContentWrapper";
import { Artwork } from "../../types/artwork";

const MyArtwork = () => {
  const dispatch = useAppDispatch();
  const { data: profile } = useAppSelector((state) => state.profile);
  const { data: mediums } = useAppSelector((state) => state.mediums);
  const {
    data: artworks,
    loading,
    error,
  } = useAppSelector((state) => state.artwork);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    if (profile?.id) {
      dispatch(fetchArtistArtworks(profile.id));
    }
  }, [dispatch, profile?.id]);

  const getMediumName = (mediumId: string) => {
    const medium = mediums?.find((m) => m.id === mediumId);
    return medium?.name || mediumId;
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <ContentWrapper loading={loading}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">My Artwork</h1>
          <p className="text-gray-600">
            View and manage your artwork collection
          </p>
        </div>

        {artworks && artworks.length > 0 ? (
          <>
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
              {artworks.map((artwork) => (
                <div key={artwork.id} className="break-inside-avoid mb-4">
                  <div className="relative">
                    <img
                      src={artwork.images[0]}
                      alt={artwork.title}
                      className="rounded-lg w-full h-auto cursor-pointer"
                      onClick={() => setSelectedArtwork(artwork)}
                    />
                    {artwork.showStatus && (
                      <div className="absolute top-2 right-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${
                            artwork.showStatus === "shown"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : artwork.showStatus === "accepted"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : artwork.showStatus === "rejected"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}
                        >
                          {artwork.showStatus === "rejected"
                            ? "not selected"
                            : artwork.showStatus === "accepted"
                            ? "selected"
                            : artwork.showStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Artwork Details Modal */}
            {selectedArtwork && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedArtwork(null)}
              >
                <div
                  className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedArtwork.title}
                      </h2>
                      <button
                        onClick={() => setSelectedArtwork(null)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
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
                    <img
                      src={selectedArtwork.images[0]}
                      alt={selectedArtwork.title}
                      className="w-full rounded-lg mb-4 object-contain"
                    />
                    <p className="text-gray-600 mb-4">
                      {selectedArtwork.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">
                          Medium:
                        </span>{" "}
                        {getMediumName(selectedArtwork.medium)}
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">
                          Dimensions:
                        </span>{" "}
                        {selectedArtwork.height} x {selectedArtwork.width}{" "}
                        {selectedArtwork.uom}
                      </div>
                      {selectedArtwork.price && (
                        <div>
                          <span className="font-medium text-gray-500">
                            Price:
                          </span>{" "}
                          ${selectedArtwork.price}
                        </div>
                      )}
                      {selectedArtwork.showStatus && (
                        <div>
                          <span className="font-medium text-gray-500">
                            Show Status:
                          </span>{" "}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              selectedArtwork.showStatus === "shown"
                                ? "bg-yellow-100 text-yellow-800"
                                : selectedArtwork.showStatus === "accepted"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {selectedArtwork.showStatus === "rejected"
                              ? "not selected"
                              : selectedArtwork.showStatus === "accepted"
                              ? "selected"
                              : selectedArtwork.showStatus}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No artwork found. Start by adding your first piece!
            </p>
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default MyArtwork;
