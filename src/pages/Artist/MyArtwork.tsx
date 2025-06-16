import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchArtistArtworks } from "../../features/artworkSlice";
import ContentWrapper from "../../components/ContentWrapper";
import { Artwork } from "../../types/artwork";

const MyArtwork = () => {
  const dispatch = useAppDispatch();
  const { data: profile } = useAppSelector((state) => state.profile);
  const {
    data: artworks,
    loading,
    error,
  } = useAppSelector((state) => state.artwork);

  useEffect(() => {
    if (profile?.id) {
      dispatch(fetchArtistArtworks(profile.id));
    }
  }, [dispatch, profile?.id]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artworks.map((artwork: Artwork) => (
              <div
                key={artwork.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={artwork.images[0]}
                    alt={artwork.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {artwork.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {artwork.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">
                      {artwork.medium}
                    </span>
                    <span className="text-sm font-medium text-gray-500">
                      {artwork.height} x {artwork.width} {artwork.uom}
                    </span>
                  </div>
                  <div className="flex justify-end mt-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        artwork.showStatus === "shown"
                          ? "bg-yellow-100 text-yellow-800"
                          : artwork.showStatus === "accepted"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {artwork.showStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
