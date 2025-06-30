import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchPublicArtshowData } from "../../features/publicSlice";
import { fetchAllArtworks } from "../../features/artworkSlice";
import { fetchUsers } from "../../features/usersSlice";
import { motion, AnimatePresence } from "framer-motion";
import { NumericFormat } from "react-number-format";

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

  if (!isOpen) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10"
      >
        ×
      </button>
      <button
        onClick={handlePrevious}
        className="absolute left-4 text-white text-4xl hover:text-gray-300 z-10"
      >
        ‹
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 text-white text-4xl hover:text-gray-300 z-10"
      >
        ›
      </button>
      <div className="max-w-4xl max-h-[90vh]">
        <img
          src={images[currentIndex]}
          alt={`Artwork image ${currentIndex + 1}`}
          className="max-w-full max-h-[90vh] object-contain"
        />
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};

const PublicArtshowArtworks = () => {
  const dispatch = useAppDispatch();
  const { activeArtshow, loading, error } = useAppSelector(
    (state) => state.public
  );
  const { data: artworks } = useAppSelector((state) => state.artwork);
  const { data: users } = useAppSelector((state) => state.users);
  const { data: mediums } = useAppSelector((state) => state.mediums);

  const [orderedArtworks, setOrderedArtworks] = useState<any[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<any>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchPublicArtshowData());
    dispatch(fetchAllArtworks());
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (activeArtshow && artworks.length > 0 && users.length > 0) {
      // Get the artworkOrder array from the artshow
      const artworkOrder = activeArtshow.artworkOrder || [];

      // Create ordered artworks array with full artwork data
      const ordered = artworkOrder
        .map((artworkId: string) => {
          const artwork = artworks.find((aw) => aw.id === artworkId);
          if (artwork) {
            const artist = users.find((user) => user.id === artwork.artistId);
            return {
              ...artwork,
              artistName: artist?.name || "Unknown Artist",
              artistEmail: artist?.email || "",
            };
          }
          return null;
        })
        .filter(Boolean);

      setOrderedArtworks(ordered);
    }
  }, [activeArtshow, artworks, users]);

  const getMediumName = (mediumId: string) => {
    const medium = mediums?.find((m) => m.id === mediumId);
    return medium?.name || mediumId;
  };

  const handleArtworkClick = (artwork: any) => {
    setSelectedArtwork(artwork);
    setGalleryOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading artworks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!activeArtshow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No active art show found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {activeArtshow.name}
            </h1>
            <p className="text-xl md:text-2xl mb-4 opacity-90">
              {new Date(
                activeArtshow.startDate + "T00:00:00"
              ).toLocaleDateString()}{" "}
              -{" "}
              {new Date(
                activeArtshow.endDate + "T00:00:00"
              ).toLocaleDateString()}
            </p>
            <p className="text-lg md:text-xl opacity-80 max-w-3xl mx-auto">
              {activeArtshow.description}
            </p>
            <div className="mt-8">
              <a
                href="/artshow"
                className="inline-flex items-center px-6 py-3 bg-white text-indigo-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                ← Back to Show Overview
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Artworks Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Artworks
          </h2>
          <p className="text-gray-600 text-lg">
            {orderedArtworks.length} artwork
            {orderedArtworks.length !== 1 ? "s" : ""} curated for this
            exhibition
          </p>
        </div>

        {orderedArtworks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">
              No artworks have been curated for this show yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence>
              {orderedArtworks.map((artwork, index) => (
                <motion.div
                  key={artwork.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: "easeOut",
                  }}
                  className="cursor-pointer"
                  onClick={() => handleArtworkClick(artwork)}
                >
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Image Container */}
                    <div className="relative overflow-hidden aspect-square">
                      {artwork.images && artwork.images[0] ? (
                        <img
                          src={artwork.images[0]}
                          alt={artwork.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg
                            className="w-16 h-16 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Position Badge */}
                      <div className="absolute top-4 left-4 bg-white bg-opacity-90 text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                        #{index + 1}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {artwork.title}
                      </h3>

                      <p className="text-indigo-600 font-semibold mb-2">
                        {artwork.artistName}
                      </p>

                      <p className="text-gray-600 text-sm mb-3">
                        {getMediumName(artwork.medium)} • {artwork.height} ×{" "}
                        {artwork.width} {artwork.uom}
                      </p>

                      {artwork.price && (
                        <p className="text-2xl font-bold text-gray-900">
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

                      {artwork.description && (
                        <p className="text-gray-600 text-sm mt-3 line-clamp-2">
                          {artwork.description}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">ArtSpace</h2>
            <p className="text-gray-400 text-lg">
              Thoughtfully curated emerging artists exhibitions
            </p>
            <div className="mt-6">
              <a
                href="/artshow"
                className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
              >
                ← Back to Show Overview
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Image Gallery Modal */}
      {selectedArtwork && (
        <ImageGallery
          images={selectedArtwork.images || []}
          isOpen={galleryOpen}
          onClose={() => {
            setGalleryOpen(false);
            setSelectedArtwork(null);
          }}
        />
      )}
    </div>
  );
};

export default PublicArtshowArtworks;
