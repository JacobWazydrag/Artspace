import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchPublicArtshowData } from "../../features/publicSlice";
import { fetchAllArtworks } from "../../features/artworkSlice";
import { fetchUsers } from "../../features/usersSlice";
import { fetchMediums } from "../../features/mediumsSlice";

const AdminArtshowPDF = () => {
  const dispatch = useAppDispatch();
  const { activeArtshow } = useAppSelector((state) => state.public);
  const { data: artworks } = useAppSelector((state) => state.artwork);
  const { data: users } = useAppSelector((state) => state.users);
  const { data: mediums } = useAppSelector((state) => state.mediums);

  const [imagesReady, setImagesReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    dispatch(fetchPublicArtshowData());
    dispatch(fetchAllArtworks());
    dispatch(fetchUsers());
    dispatch(fetchMediums());
  }, [dispatch]);

  const orderedArtworks = useMemo(() => {
    if (!activeArtshow || !Array.isArray(activeArtshow.artworkOrder))
      return [] as any[];
    const order: string[] = activeArtshow.artworkOrder || [];
    const enriched = order
      .map((artworkId) => artworks.find((aw: any) => aw.id === artworkId))
      .filter(Boolean)
      .map((aw: any) => {
        const artist = users.find((u: any) => u.id === aw.artistId);
        return {
          ...aw,
          artistName: artist?.name || "Unknown Artist",
          artistEmail: artist?.email || "",
        };
      });
    return enriched;
  }, [activeArtshow, artworks, users]);

  const artworksByArtist = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const aw of orderedArtworks) {
      const key = `${aw.artistId}__${aw.artistName}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(aw);
    }
    return Array.from(map.entries()).map(([key, list]) => {
      const [, artistName] = key.split("__");
      return { artistName, list };
    });
  }, [orderedArtworks]);

  const getMediumName = (mediumId?: string) => {
    if (!mediumId) return "";
    const medium = mediums?.find((m: any) => m.id === mediumId);
    return medium?.name || mediumId;
  };

  const formatPrice = (price?: number) => {
    if (price == null) return "";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price);
    } catch {
      return `$${price}`;
    }
  };

  // Preload all artwork images to ensure they appear in PDF and enable Print only after ready
  useEffect(() => {
    setImagesReady(false);
    setIsLoading(true);
    const urls: string[] = orderedArtworks
      .map((a: any) => (a.images && a.images[0] ? a.images[0] : ""))
      .filter(Boolean);

    if (urls.length === 0) {
      setImagesReady(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let loadedCount = 0;

    const handleDone = () => {
      if (!cancelled && loadedCount >= urls.length) {
        setImagesReady(true);
        setIsLoading(false);
      }
    };

    urls.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        loadedCount += 1;
        handleDone();
      };
      img.onerror = () => {
        // Consider errored images as loaded to avoid blocking
        loadedCount += 1;
        handleDone();
      };
      img.src = src;
      // Try to hint eager loading
      (img as any).loading = "eager";
      (img as any).decoding = "sync";
    });

    return () => {
      cancelled = true;
    };
  }, [orderedArtworks]);

  const handlePrint = () => {
    window.print();
  };

  if (!activeArtshow) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <p className="text-gray-700 dark:text-gray-200">
          No active art show found.
        </p>
      </div>
    );
  }

  return (
    <div
      id="admin-pdf-root"
      className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6"
      ref={containerRef}
    >
      {/* Print styles */}
      <style>{`
        @media print {
          /* Print only the PDF root content */
          body * { visibility: hidden; }
          #admin-pdf-root, #admin-pdf-root * { visibility: visible; }
          #admin-pdf-root { position: static !important; overflow: visible !important; }

          /* Hide elements commonly outside PDF root */
          .no-print, .fixed, .sticky { display: none !important; }

          /* Prevent unwanted clipping and ensure multi-page */
          html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; height: auto !important; overflow: visible !important; }
          .overflow-auto, .overflow-y-auto, .overflow-x-auto { overflow: visible !important; }

          /* Avoid breaking important boxes */
          .page-break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
          img { break-inside: avoid; page-break-inside: avoid; }

          /* Force 4 columns for artworks grid on print */
          .artist-grid { display: grid !important; grid-template-columns: repeat(4, minmax(0, 1fr)) !important; gap: 1rem !important; }
          .card-shadow { box-shadow: none !important; }
        }

        @page {
          size: auto;
          margin: 0.5in;
        }
      `}</style>

      <div className="max-w-5xl mx-auto">
        {/* Header / Actions */}
        <div className="no-print flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ArtShow PDF
          </h1>
          <button
            onClick={handlePrint}
            disabled={!imagesReady}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors ${
              imagesReady
                ? "bg-violet-600 hover:bg-violet-500"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Print to PDF
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M5 3a2 2 0 00-2 2v2h2V5h10v2h2V5a2 2 0 00-2-2H5z" />
              <path
                fillRule="evenodd"
                d="M3 9a2 2 0 012-2h10a2 2 0 012 2v3a2 2 0 01-2 2h-1v3H6v-3H5a2 2 0 01-2-2V9zm5 7h4v-3H8v3z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Show meta */}
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {activeArtshow.name}
          </h2>
          {activeArtshow.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-3xl">
              {activeArtshow.description}
            </p>
          )}
        </div>

        {/* Artists Sections */}
        <div className="space-y-10">
          {artworksByArtist.map(({ artistName, list }) => (
            <section key={artistName} className="page-break-inside-avoid">
              {/* Artist Header */}
              <div className="mb-4 border-b border-gray-200 dark:border-gray-700 pb-2 avoid-break">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {artistName}
                </h3>
              </div>

              {/* Artworks Grid for this artist */}
              <div className="artist-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {list.map((aw: any) => (
                  <div
                    key={aw.id}
                    className="card-shadow break-inside-avoid border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800"
                  >
                    <div className="bg-gray-100 dark:bg-slate-700">
                      {aw.images && aw.images[0] ? (
                        <img
                          src={aw.images[0]}
                          alt={aw.title}
                          className="w-full h-auto object-contain"
                          loading="eager"
                          decoding="sync"
                        />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center text-gray-400 text-sm">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-4 text-gray-900 dark:text-gray-100">
                      <h4 className="font-semibold mb-1">
                        {aw.title || "Untitled"}
                      </h4>
                      <p className="text-sm">
                        {getMediumName(aw.medium)}
                        {aw.height && aw.width ? (
                          <>
                            {" "}
                            • {aw.height} × {aw.width} {aw.uom || "in"}
                          </>
                        ) : null}
                      </p>
                      {aw.price != null && (
                        <p className="mt-1 font-medium">
                          {formatPrice(aw.price)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Loading notice */}
        {!imagesReady && (
          <div className="no-print mt-8 text-sm text-gray-600 dark:text-gray-300">
            Preparing images for print... please wait.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminArtshowPDF;
