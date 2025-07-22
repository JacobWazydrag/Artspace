import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchPublicArtshowData } from "../../features/publicSlice";
import { motion, AnimatePresence } from "framer-motion";
import { NumericFormat } from "react-number-format";
import { User } from "../../features/usersSlice";

interface Artist {
  id: string;
  name: string;
  email: string;
  bio: string;
  photoUrl?: string;
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

const BioModal = ({
  artist,
  isOpen,
  onClose,
}: {
  artist: { name: string; bio: string; photoUrl?: string | null };
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
          <h2 className="text-2xl font-bold text-gray-900">About the Artist</h2>
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

        <div className="flex items-center mb-4">
          <img
            src={
              artist.photoUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                artist.name || "Artist"
              )}`
            }
            alt={artist.name}
            className="w-16 h-16 rounded-full object-cover mr-4"
          />
          <h3 className="text-xl font-bold text-gray-900">{artist.name}</h3>
        </div>

        <p className="text-gray-700 leading-relaxed">{artist.bio}</p>
      </div>
    </div>
  );
};

const ArtistGallery = ({
  artworks,
  isOpen,
  onClose,
  artistName,
}: {
  artworks: any[];
  isOpen: boolean;
  onClose: () => void;
  artistName: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: mediums } = useAppSelector((state) => state.mediums);

  const getMediumName = (mediumId: string) => {
    const medium = mediums?.find((m) => m.id === mediumId);
    return medium?.name || mediumId;
  };

  if (!isOpen) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? artworks.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === artworks.length - 1 ? 0 : prev + 1));
  };

  const currentArtwork = artworks[currentIndex];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="max-w-4xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">
            {artistName}'s Gallery
          </h2>
          <button
            onClick={onClose}
            className="text-white text-2xl hover:text-gray-300"
          >
            ×
          </button>
        </div>

        <div className="relative">
          <img
            src={currentArtwork.images[0]}
            alt={currentArtwork.title}
            className="w-full max-h-[70vh] object-contain rounded-lg"
          />

          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300"
          >
            ‹
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300"
          >
            ›
          </button>
        </div>

        <div className="mt-4 text-white">
          <h3 className="text-xl font-bold mb-2">{currentArtwork.title}</h3>
          <p className="text-gray-300 mb-2">
            {getMediumName(currentArtwork.medium)} • {currentArtwork.height} x{" "}
            {currentArtwork.width} {currentArtwork.uom}
          </p>
          {currentArtwork.price && (
            <p className="text-gray-300 mb-2">
              <NumericFormat
                value={currentArtwork.price}
                thousandSeparator=","
                decimalSeparator="."
                prefix="$"
                decimalScale={2}
                fixedDecimalScale
                displayType="text"
              />
            </p>
          )}
          <p className="text-gray-300">{currentArtwork.description}</p>
        </div>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
          {currentIndex + 1} / {artworks.length}
        </div>
      </div>
    </div>
  );
};

const PublicArtshow = () => {
  const dispatch = useAppDispatch();
  const { activeArtshow, publicArtists, publicArtworks, loading, error } =
    useAppSelector((state) => state.public);
  const { data: mediums } = useAppSelector((state) => state.mediums);
  const [selectedArtist, setSelectedArtist] = useState<{
    id: string;
    name: string;
    artworks: any[];
  } | null>(null);
  const [selectedArtistBio, setSelectedArtistBio] = useState<{
    name: string;
    bio: string;
    photoUrl?: string | null;
  } | null>(null);

  useEffect(() => {
    dispatch(fetchPublicArtshowData());
  }, [dispatch]);

  const getMediumName = (mediumId: string) => {
    const medium = mediums?.find((m) => m.id === mediumId);
    return medium?.name || mediumId;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!activeArtshow) return <div>No active artshow found.</div>;

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
              {new Date(
                activeArtshow.startDate + "T00:00:00"
              ).toLocaleDateString()}{" "}
              -{" "}
              {new Date(
                activeArtshow.endDate + "T00:00:00"
              ).toLocaleDateString()}
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
      {/* <div className="block sm:hidden bg-gray-900 px-4 py-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          {activeArtshow.name}
        </h1>
        <p className="text-white mb-2">
          {new Date(activeArtshow.startDate + "T00:00:00").toLocaleDateString()}{" "}
          - {new Date(activeArtshow.endDate + "T00:00:00").toLocaleDateString()}
        </p>
        <p className="text-white">{activeArtshow.description}</p>
      </div> */}

      {/* Artists Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Featured Artists
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {publicArtists.map((artist: User) => {
            const artistArtworks = publicArtworks.filter(
              (artwork) => artwork.artistId === artist.id
            );

            return (
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
                          artist.name || "Artist"
                        )}`
                      }
                      alt={artist.name || "Artist"}
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {artist.name || "Artist"}
                      </h3>
                      {artist.socialLinks?.instagram && (
                        <p className="text-gray-600">
                          Instagram: {artist.socialLinks.instagram}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setSelectedArtistBio({
                          name: artist.name || "Artist",
                          bio: artist.bio || "",
                          photoUrl: artist.photoUrl,
                        })
                      }
                      className="flex-1 bg-amber-500 text-white py-2 px-4 rounded-md hover:bg-amber-600 transition-colors duration-200"
                    >
                      About the Artist
                    </button>
                    {artistArtworks.length > 0 && (
                      <button
                        onClick={() =>
                          setSelectedArtist({
                            id: artist.id || "",
                            name: artist.name || "Artist",
                            artworks: artistArtworks,
                          })
                        }
                        className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                      >
                        View {artistArtworks.length} Artwork
                        {artistArtworks.length !== 1 ? "s" : ""}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">ArtSpace</h2>
            <p className="text-gray-400">
              Thoughtfully curated emerging artists exhibitions
            </p>
          </div>
        </div>
      </footer>

      {selectedArtist && (
        <ArtistGallery
          artworks={selectedArtist.artworks}
          isOpen={true}
          onClose={() => setSelectedArtist(null)}
          artistName={selectedArtist.name}
        />
      )}

      {selectedArtistBio && (
        <BioModal
          artist={selectedArtistBio}
          isOpen={true}
          onClose={() => setSelectedArtistBio(null)}
        />
      )}
    </div>
  );
};

export default PublicArtshow;
