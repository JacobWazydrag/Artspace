import { useEffect, useState, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import {
  fetchPublicArtshowData,
  updateActiveArtshow,
} from "../../features/publicSlice";
import {
  fetchAllArtworks,
  updateSingleArtwork,
} from "../../features/artworkSlice";
import { fetchUsers } from "../../features/usersSlice";
import { fetchMediums } from "../../features/mediumsSlice";
import { motion, AnimatePresence } from "framer-motion";
import { NumericFormat } from "react-number-format";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "../../firebase";

interface ImageGalleryProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  artwork?: any;
}

interface LazyArtworkCardProps {
  artwork: any;
  index: number;
  users: any[];
  mediums: any[];
  onArtworkClick: (artwork: any) => void;
  onArtistClick: (artist: any) => void;
}

// Skeleton component for loading state
const ArtworkSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-200"></div>
    <div className="p-6">
      <div className="h-6 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
);

// Lazy artwork card component with intersection observer
const LazyArtworkCard = ({
  artwork,
  index,
  users,
  mediums,
  onArtworkClick,
  onArtistClick,
}: LazyArtworkCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const getMediumName = (mediumId: string) => {
    const medium = mediums?.find((m) => m.id === mediumId);
    return medium?.name || mediumId;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: "200px", // Start loading 200px before entering viewport
        threshold: 0.1,
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  // Start loading image when visible
  useEffect(() => {
    if (isVisible && artwork.images && artwork.images[0]) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.onerror = () => setIsLoaded(true); // Show card even if image fails
      img.src = artwork.images[0];
    } else if (isVisible && (!artwork.images || !artwork.images[0])) {
      // No image to load, show card immediately
      setIsLoaded(true);
    }
  }, [isVisible, artwork.images]);

  if (!isVisible || !isLoaded) {
    return (
      <div ref={cardRef} className="cursor-pointer">
        <ArtworkSkeleton />
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05, // Reduced delay for better perceived performance
        ease: "easeOut",
      }}
      className="cursor-pointer"
      onClick={() => onArtworkClick(artwork)}
    >
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Image Container */}
        <div className="relative overflow-hidden aspect-square bg-gray-100">
          {artwork.images && artwork.images[0] ? (
            <img
              src={artwork.images[0]}
              alt={artwork.title}
              className="w-full h-full object-cover transition-opacity duration-300"
              loading="lazy"
              decoding="async"
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

          {/* SOLD Banner */}
          {artwork.sold && (
            <div className="absolute right-0 top-0 h-16 w-16 pointer-events-none">
              <div className="absolute transform rotate-45 bg-red-600 text-center text-white font-semibold py-1 right-[-35px] top-[32px] w-[170px]">
                SOLD
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {artwork.title.length > 16
              ? `${artwork.title.substring(0, 16)}...`
              : artwork.title}
          </h3>

          <p
            className="text-indigo-600 font-semibold mb-2 cursor-pointer hover:text-indigo-800 transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation();
              const artist = users.find((user) => user.id === artwork.artistId);
              if (artist) {
                onArtistClick(artist);
              }
            }}
          >
            {artwork.artistName}
          </p>

          <p className="text-gray-600 text-sm mb-3">
            {getMediumName(artwork.medium)} • {artwork.height} × {artwork.width}{" "}
            {artwork.uom}
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
        </div>
      </div>
    </motion.div>
  );
};

const ArtistModal = ({
  artist,
  isOpen,
  onClose,
}: {
  artist: any;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Artist Profile</h2>
          <button
            onClick={onClose}
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

        <div className="text-center">
          <img
            src={
              artist.photoUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                artist.name || "Artist"
              )}`
            }
            alt={artist.name}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
          />

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {artist.name}
          </h3>

          {artist.socialLinks?.instagram && (
            <p className="text-indigo-600 font-medium mb-4">
              Instagram: {artist.socialLinks.instagram}
            </p>
          )}

          {artist.bio && (
            <p className="text-gray-700 leading-relaxed">{artist.bio}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ImageGallery = ({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
  artwork,
}: ImageGalleryProps) => {
  const { data: mediums } = useAppSelector((state) => state.mediums);

  const getMediumName = (mediumId: string) => {
    const medium = mediums?.find((m) => m.id === mediumId);
    return medium?.name || mediumId;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col md:items-center md:justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10"
      >
        ×
      </button>

      <div className="flex-1 flex flex-col justify-center items-center">
        <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
          <img
            src={images[0]}
            alt="Artwork"
            className="w-full h-auto max-h-[60vh] md:max-h-[80vh] object-contain"
          />
        </div>
      </div>

      {/* Artwork Description - Mobile: below image, Desktop: overlay */}
      {artwork?.description && (
        <>
          {/* Mobile: Description below image */}
          <div className="md:hidden bg-black bg-opacity-75 text-white p-4 mt-4 rounded-lg">
            <p className="text-sm leading-relaxed opacity-90">
              {artwork.description}
            </p>
          </div>

          {/* Desktop: Description overlay */}
          <div className="hidden md:block absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-6">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm leading-relaxed opacity-90">
                {artwork.description}
              </p>
            </div>
          </div>
        </>
      )}
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
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [artistModalOpen, setArtistModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchPublicArtshowData());
    dispatch(fetchAllArtworks());
    dispatch(fetchUsers());
    dispatch(fetchMediums());
  }, [dispatch]);

  // Live listener for artshow updates
  useEffect(() => {
    if (!activeArtshow?.id) return;

    const artshowRef = doc(db, "artshows", activeArtshow.id);

    const unsubscribe = onSnapshot(
      artshowRef,
      (doc) => {
        if (doc.exists()) {
          const updatedArtshow = { id: doc.id, ...doc.data() };
          // Update the local state with the latest artshow data
          // This will trigger a re-render with the updated artworkOrder
          dispatch(updateActiveArtshow(updatedArtshow));
        }
      },
      (error) => {
        console.error("Error listening to artshow updates:", error);
      }
    );

    return () => unsubscribe();
  }, [activeArtshow?.id, dispatch]);

  // Live listener for artworks updates
  useEffect(() => {
    if (!activeArtshow?.artworkIds || activeArtshow.artworkIds.length === 0)
      return;

    const artworkIds = activeArtshow.artworkIds;

    // Create listeners for each artwork in the show
    const unsubscribes = artworkIds.map((artworkId: string) => {
      const artworkRef = doc(db, "artworks", artworkId);

      return onSnapshot(
        artworkRef,
        (doc) => {
          if (doc.exists()) {
            const updatedArtwork = { id: doc.id, ...doc.data() };

            // Update the artwork in the Redux store
            dispatch(updateSingleArtwork(updatedArtwork));
          }
        },
        (error) => {
          console.error(
            `Error listening to artwork ${artworkId} updates:`,
            error
          );
        }
      );
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [activeArtshow?.artworkIds, dispatch]);

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

  const handleArtworkClick = useCallback((artwork: any) => {
    setSelectedArtwork(artwork);
    setGalleryOpen(true);
  }, []);

  const handleArtistClick = useCallback((artist: any) => {
    setSelectedArtist(artist);
    setArtistModalOpen(true);
  }, []);

  // Helper function to get thumbnail URL for Firebase Storage images
  const getThumbnailUrl = (originalUrl: string) => {
    if (originalUrl.includes("firebasestorage.googleapis.com")) {
      return `${originalUrl}?alt=media&w=400&h=400`;
    }
    return originalUrl;
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
      <section className="bg-black">
        <div className="container mx-auto px-4 md:px-8 lg:px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[60vh]">
            {/* Image Section */}
            <div className="hidden lg:block order-2 lg:order-1">
              {activeArtshow.photoUrl ? (
                <div className="relative w-full h-[450px] md:h-[550px] lg:h-[650px] rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={activeArtshow.photoUrl}
                    alt={activeArtshow.name}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
              ) : (
                <div className="w-full h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl shadow-2xl flex items-center justify-center">
                  <div className="text-white text-center">
                    <svg
                      className="w-24 h-24 mx-auto mb-4 opacity-50"
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
                    <p className="text-lg opacity-75">Exhibition Image</p>
                  </div>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="order-1 lg:order-2 space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
                  {activeArtshow.name}
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mb-6"></div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <p className="text-xl md:text-2xl text-gray-200 font-medium">
                    {new Date(
                      activeArtshow.startDate + "T00:00:00"
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <p className="text-xl md:text-2xl text-gray-200 font-medium">
                    {new Date(
                      activeArtshow.endDate + "T00:00:00"
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
                  {activeArtshow.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Artworks Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Exhibition
          </h2>
          {/* <p className="text-gray-600 text-lg">
            {orderedArtworks.length} artwork
            {orderedArtworks.length !== 1 ? "s" : ""} curated for this
            exhibition
          </p> */}
        </div>

        {orderedArtworks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">
              No artworks have been curated for this show yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {orderedArtworks.map((artwork, index) => (
              <LazyArtworkCard
                key={artwork.id}
                artwork={artwork}
                index={index}
                users={users}
                mediums={mediums}
                onArtworkClick={handleArtworkClick}
                onArtistClick={handleArtistClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">ArtSpace Chicago</h2>
            <p className="text-gray-400 text-lg">
              Thoughtfully curated emerging artists exhibitions
            </p>
            {/* <div className="mt-6">
              <a
                href="/artshow"
                className="text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
              >
                ← Back to Show Overview
              </a>
            </div> */}
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
          artwork={selectedArtwork}
        />
      )}

      {/* Artist Modal */}
      {selectedArtist && (
        <ArtistModal
          artist={selectedArtist}
          isOpen={artistModalOpen}
          onClose={() => {
            setArtistModalOpen(false);
            setSelectedArtist(null);
          }}
        />
      )}
    </div>
  );
};

export default PublicArtshowArtworks;
