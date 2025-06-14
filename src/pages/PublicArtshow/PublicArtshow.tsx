import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchArtshows } from "../../features/artshowsSlice";
import { fetchUsers } from "../../features/usersSlice";
import { fetchArtshowArtworks } from "../../features/artworkSlice";
import { fetchMediums } from "../../features/mediumsSlice";
import { Artshow } from "../../features/artshowsSlice";
import { User } from "../../features/usersSlice";
import { Artwork } from "../../features/artworkSlice";
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
        className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
      >
        ×
      </button>
      <button
        onClick={handlePrevious}
        className="absolute left-4 text-white text-4xl hover:text-gray-300"
      >
        ‹
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 text-white text-4xl hover:text-gray-300"
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

const CollapsibleDescription = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const previewLength = 30;
  const shouldCollapse = text.length > previewLength;

  if (!shouldCollapse) {
    return <p className="text-gray-700 text-sm">{text}</p>;
  }

  return (
    <div className="relative">
      <AnimatePresence>
        <motion.p
          className="text-gray-700 text-sm"
          initial={false}
          animate={{ height: isExpanded ? "auto" : "1.5em" }}
          transition={{ duration: 0.3 }}
        >
          {isExpanded ? text : `${text.slice(0, previewLength)}...`}
        </motion.p>
      </AnimatePresence>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1 flex items-center"
      >
        {isExpanded ? (
          <>
            Show less
            <svg
              className="w-4 h-4 ml-1 transform rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </>
        ) : (
          <>
            Read more
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </>
        )}
      </button>
    </div>
  );
};

const PublicArtshow = () => {
  const dispatch = useAppDispatch();
  const { data: artshows } = useAppSelector((state) => state.artshows);
  const { data: users } = useAppSelector((state) => state.users);
  const { data: artworks } = useAppSelector((state) => state.artwork);
  const { data: mediums } = useAppSelector((state) => state.mediums);
  const [activeArtshow, setActiveArtshow] = useState<Artshow | null>(null);
  const [showArtists, setShowArtists] = useState<User[]>([]);
  const [showArtworks, setShowArtworks] = useState<Artwork[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<{
    images: string[];
    index: number;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchArtshows());
    dispatch(fetchUsers());
    dispatch(fetchMediums());
  }, [dispatch]);

  useEffect(() => {
    // Find the active art show
    const active = artshows.find((show) => show.status === "active");
    if (active) {
      setActiveArtshow(active);
      // Fetch artworks for this show
      dispatch(fetchArtshowArtworks(active.id!));
    }
  }, [artshows, dispatch]);

  useEffect(() => {
    if (activeArtshow && users && artworks) {
      // Get artists in this show
      const artists = users.filter((user) =>
        activeArtshow.artistIds?.includes(user.id!)
      );
      setShowArtists(artists);

      // Set all artworks from the fetchArtshowArtworks call
      setShowArtworks(artworks);

      console.log("Active Artshow:", activeArtshow);
      console.log("All Artworks:", artworks);
      console.log("Artists in Show:", artists);
    }
  }, [activeArtshow, users, artworks]);

  const getMediumName = (mediumId: string) => {
    const medium = mediums?.find((m) => m.id === mediumId);
    return medium?.name || mediumId;
  };

  if (!activeArtshow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            No Active Art Show
          </h1>
          <p className="text-gray-600">
            There is currently no active art show to display.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section*/}
      <section className="bg-white">
        <div className="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
          {/* Mobile Image - only visible on mobile, full-bleed */}
          <div className="block lg:hidden w-screen max-w-none relative left-1/2 right-1/2 -mx-[50vw] -mt-8 mb-8 h-[300px] overflow-hidden bg-white">
            {activeArtshow.photoUrl && (
              <img
                src={activeArtshow.photoUrl}
                alt={activeArtshow.name}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: "center top" }}
              />
            )}
          </div>
          {/* Text content */}
          <div className="mr-auto place-self-center lg:col-span-7">
            <h1 className="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl text-black">
              {activeArtshow.name}
            </h1>
            <p className="max-w-2xl mb-6 font-light text-black lg:mb-8 md:text-lg lg:text-xl">
              {new Date(activeArtshow.startDate).toLocaleDateString()} -{" "}
              {new Date(activeArtshow.endDate).toLocaleDateString()}
            </p>
            <p className="max-w-2xl mb-6 font-light text-black lg:mb-8 md:text-lg lg:text-xl">
              {activeArtshow.description}
            </p>
          </div>
          {/* Desktop Image - only visible on desktop */}
          <div className="hidden lg:mt-0 lg:col-span-5 lg:flex lg:order-last mb-8 lg:mb-0">
            {activeArtshow.photoUrl && (
              <img
                src={activeArtshow.photoUrl}
                alt={activeArtshow.name}
                className="w-full h-full object-cover rounded-lg"
              />
            )}
          </div>
        </div>
      </section>
      {/* Description below image for mobile */}
      <div className="block sm:hidden bg-gray-900 px-4 py-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          {activeArtshow.name}
        </h1>
        <p className="text-white mb-2">
          {new Date(activeArtshow.startDate).toLocaleDateString()} -{" "}
          {new Date(activeArtshow.endDate).toLocaleDateString()}
        </p>
        <p className="text-white">{activeArtshow.description}</p>
      </div>

      {/* Artists Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Featured Artists
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {showArtists.map((artist) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={
                      artist.photoUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        artist.name
                      )}`
                    }
                    alt={artist.name}
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {artist.name}
                    </h3>
                    <p className="text-gray-600">{artist.email}</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">{artist.bio}</p>
                <div className="space-y-4">
                  {showArtworks
                    .filter((artwork) => artwork.artistId === artist.id)
                    .map((artwork) => (
                      <div key={artwork.id} className="border-t pt-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {artwork.title}
                        </h4>
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
                              className="w-full h-48 object-cover rounded-lg mb-2"
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
                        <p className="text-sm text-gray-600 mb-2">
                          {getMediumName(artwork.medium)} • {artwork.height} x{" "}
                          {artwork.width} {artwork.uom}
                        </p>
                        {/* price */}
                        <p className="text-sm text-gray-600 mb-2">
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
                        </p>
                        <CollapsibleDescription text={artwork.description} />
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Art Space Chicago</h2>
            <p className="text-gray-400">
              Celebrating local artists and their creative expressions
            </p>
          </div>
        </div>
      </footer>

      {selectedArtwork && (
        <ImageGallery
          images={selectedArtwork.images}
          isOpen={true}
          onClose={() => setSelectedArtwork(null)}
          initialIndex={selectedArtwork.index}
        />
      )}
    </div>
  );
};

export default PublicArtshow;
