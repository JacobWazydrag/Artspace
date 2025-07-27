import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchArtshows } from "../../features/artshowsSlice";
import { fetchAllArtworks } from "../../features/artworkSlice";
import { fetchUsers } from "../../features/usersSlice";
import ContentWrapper from "../../components/ContentWrapper";
import { formClasses } from "../../classes/tailwindClasses";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-hot-toast";
import { motion, Reorder } from "framer-motion";
import { NumericFormat } from "react-number-format";

const Curate = () => {
  const { h1ReverseDark, button, cancelButton } = formClasses;
  const dispatch = useAppDispatch();
  const { data: artshows, loading: artshowsLoading } = useAppSelector(
    (state) => state.artshows
  );
  const { data: artworks, loading: artworksLoading } = useAppSelector(
    (state) => state.artwork
  );
  const { data: users, loading: usersLoading } = useAppSelector(
    (state) => state.users
  );

  const [activeArtshow, setActiveArtshow] = useState<any>(null);
  const [orderedArtworks, setOrderedArtworks] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  useEffect(() => {
    dispatch(fetchArtshows());
    dispatch(fetchAllArtworks());
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    // Find the active artshow
    const active = artshows.find((show) => show.status === "active");
    setActiveArtshow(active);
  }, [artshows]);

  useEffect(() => {
    if (
      activeArtshow &&
      artworks.length > 0 &&
      users.length > 0 &&
      !hasLocalChanges
    ) {
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
  }, [activeArtshow, artworks, users, hasLocalChanges]);

  const handleReorder = (newOrder: any[]) => {
    setOrderedArtworks(newOrder);
    setHasLocalChanges(true);
  };

  const handleSaveOrder = async () => {
    if (!activeArtshow) return;

    setIsSaving(true);
    try {
      const newArtworkOrder = orderedArtworks.map((artwork) => artwork.id);

      const artshowRef = doc(db, "artshows", activeArtshow.id);
      await updateDoc(artshowRef, {
        artworkOrder: newArtworkOrder,
        updatedAt: new Date().toISOString(),
      });

      // Update the local activeArtshow state to reflect the new order
      setActiveArtshow({
        ...activeArtshow,
        artworkOrder: newArtworkOrder,
        updatedAt: new Date().toISOString(),
      });

      setHasLocalChanges(false);
      toast.success("Artwork order saved successfully!");
    } catch (error) {
      console.error("Error saving artwork order:", error);
      toast.error("Failed to save artwork order");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetOrder = () => {
    if (activeArtshow) {
      const artworkOrder = activeArtshow.artworkOrder || [];
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
      setHasLocalChanges(false);
    }
  };

  if (artshowsLoading || artworksLoading || usersLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ContentWrapper loading={true}>
          <div>Loading...</div>
        </ContentWrapper>
      </div>
    );
  }

  if (!activeArtshow) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ContentWrapper loading={false}>
          <div className="text-center">
            <h1 className={h1ReverseDark}>Curate Art Show</h1>
            <p className="text-gray-600 mt-4">
              No active art show found. Please activate an art show first.
            </p>
          </div>
        </ContentWrapper>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ContentWrapper loading={false}>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className={h1ReverseDark}>Curate Art Show</h1>
              <p className="text-gray-600 mt-2">
                Reorder artworks for:{" "}
                <span className="font-semibold">{activeArtshow.name}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleResetOrder}
                className={cancelButton}
                disabled={isSaving}
              >
                Reset Order
              </button>
              <button
                onClick={handleSaveOrder}
                className={button}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Order"}
              </button>
            </div>
          </div>

          {orderedArtworks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No artworks found in this art show. Add artworks to the show
                first.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drag and drop to reorder artworks
                </h3>
                <p className="text-sm text-gray-600">
                  {orderedArtworks.length} artwork
                  {orderedArtworks.length !== 1 ? "s" : ""} in show
                </p>
              </div>

              <Reorder.Group
                axis="y"
                values={orderedArtworks}
                onReorder={handleReorder}
                className="space-y-3"
              >
                {orderedArtworks.map((artwork, index) => (
                  <Reorder.Item
                    key={artwork.id}
                    value={artwork}
                    className="cursor-move"
                  >
                    <motion.div
                      layout
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-gray-500 font-medium text-sm w-8">
                          {index + 1}
                        </div>
                        {artwork.images && artwork.images[0] && (
                          <img
                            src={artwork.images[0]}
                            alt={artwork.title}
                            className="h-16 w-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {artwork.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {artwork.artistName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {artwork.medium} • {artwork.height}x{artwork.width}{" "}
                            {artwork.uom}
                          </p>
                        </div>
                        {artwork.price && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
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
                          </div>
                        )}
                      </div>
                      <div className="text-gray-400">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 8h16M4 16h16"
                          />
                        </svg>
                      </div>
                    </motion.div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          )}
        </div>
      </ContentWrapper>
    </div>
  );
};

export default Curate;
