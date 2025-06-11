import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchArtshowById } from "../../features/artshowsSlice";
import { fetchArtshowArtworks } from "../../features/artworkSlice";
import { fetchUsers } from "../../features/usersSlice";
import { fetchMediums } from "../../features/mediumsSlice";
import ContentWrapper from "../../components/ContentWrapper";
import { NumericFormat } from "react-number-format";
import { motion } from "framer-motion";

const ArtshowArtworks = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: artshows } = useAppSelector((state) => state.artshows);
  const { data: artworks } = useAppSelector((state) => state.artwork);
  const { data: users } = useAppSelector((state) => state.users);
  const { data: mediums } = useAppSelector((state) => state.mediums);
  const [selectedArtwork, setSelectedArtwork] = useState<{
    images: string[];
    index: number;
  } | null>(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchArtshowById(id));
      dispatch(fetchArtshowArtworks(id));
      dispatch(fetchUsers());
      dispatch(fetchMediums());
    }
  }, [dispatch, id]);

  const artshow = artshows.find((show) => show.id === id);

  if (!artshow) {
    return (
      <div className="p-8">
        <ContentWrapper loading={true}>
          <div className="text-center">Loading...</div>
        </ContentWrapper>
      </div>
    );
  }

  const getMediumName = (mediumId: string) => {
    const medium = mediums?.find((m) => m.id === mediumId);
    return medium?.name || mediumId;
  };

  const getArtistName = (artistId: string) => {
    const artist = users?.find((u) => u.id === artistId);
    return artist?.name || "Unknown Artist";
  };

  return (
    <div className="p-8">
      <ContentWrapper loading={false}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {artshow.name} - Artworks
            </h1>
            <p className="text-gray-600">
              {new Date(artshow.startDate).toLocaleDateString()} -{" "}
              {new Date(artshow.endDate).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => navigate("/artshows")}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Back to Shows
          </button>
        </div>

        {artworks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Artworks Found
            </h3>
            <p className="text-gray-500">
              This art show doesn't have any artworks yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artworks.map((artwork) => (
              <motion.div
                key={artwork.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                {artwork.images && artwork.images.length > 0 && (
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {artwork.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    by {getArtistName(artwork.artistId)}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    {getMediumName(artwork.medium)} • {artwork.height} x{" "}
                    {artwork.width} {artwork.uom}
                  </p>
                  {artwork.price && (
                    <p className="text-sm text-gray-600 mb-2">
                      <NumericFormat
                        value={artwork.price}
                        thousandSeparator=","
                        decimalSeparator="."
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale
                        displayType="text"
                      />
                    </p>
                  )}
                  <p className="text-gray-700 text-sm">{artwork.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {selectedArtwork && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            <button
              onClick={() => setSelectedArtwork(null)}
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
            >
              ×
            </button>
            <button
              onClick={() =>
                setSelectedArtwork((prev) => ({
                  ...prev!,
                  index:
                    prev!.index === 0
                      ? selectedArtwork.images.length - 1
                      : prev!.index - 1,
                }))
              }
              className="absolute left-4 text-white text-4xl hover:text-gray-300"
            >
              ‹
            </button>
            <button
              onClick={() =>
                setSelectedArtwork((prev) => ({
                  ...prev!,
                  index:
                    prev!.index === selectedArtwork.images.length - 1
                      ? 0
                      : prev!.index + 1,
                }))
              }
              className="absolute right-4 text-white text-4xl hover:text-gray-300"
            >
              ›
            </button>
            <div className="max-w-4xl max-h-[90vh]">
              <img
                src={selectedArtwork.images[selectedArtwork.index]}
                alt={`Artwork image ${selectedArtwork.index + 1}`}
                className="max-w-full max-h-[90vh] object-contain"
              />
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
              {selectedArtwork.index + 1} / {selectedArtwork.images.length}
            </div>
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default ArtshowArtworks;
