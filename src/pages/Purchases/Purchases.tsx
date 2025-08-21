import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchSoldArtworks } from "../../features/artworkSlice";
import { fetchAllUsers } from "../../features/usersSlice";
import { fetchMediums } from "../../features/mediumsSlice";
import ContentWrapper from "../../components/ContentWrapper";
import { formClasses } from "../../classes/tailwindClasses";
import React from "react";

interface FilterState {
  search: string;
  statuses: string[];
}

const Purchases = () => {
  const dispatch = useAppDispatch();
  const {
    data: artworks,
    loading,
    error,
  } = useAppSelector((state) => state.artwork);
  const { data: users } = useAppSelector((state) => state.users);
  const { data: mediums } = useAppSelector((state) => state.mediums);
  const { h1ReverseDark } = formClasses;

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    statuses: [],
  });
  const [selectedArtwork, setSelectedArtwork] = useState<any | null>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchSoldArtworks());
    dispatch(fetchAllUsers());
    dispatch(fetchMediums());
  }, [dispatch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
      }
    }
    if (isStatusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isStatusDropdownOpen]);

  const filteredArtworks = artworks.filter((artwork) => {
    // Search by title or artist name
    if (filters.search) {
      const artist = getArtistInfo(artwork.artistId);
      const titleMatch = artwork.title
        .toLowerCase()
        .includes(filters.search.toLowerCase());
      const artistMatch = artist?.name
        .toLowerCase()
        .includes(filters.search.toLowerCase());
      if (!titleMatch && !artistMatch) {
        return false;
      }
    }

    // Filter by status
    if (filters.statuses.length > 0) {
      const artworkStatus = artwork.sold ? "sold" : "pending";
      if (!filters.statuses.includes(artworkStatus)) {
        return false;
      }
    }

    return true;
  });

  const getArtistInfo = (artistId: string) => {
    const artist = users?.find((user) => user.id === artistId);
    return artist ? { name: artist.name, email: artist.email } : null;
  };

  const getMediumName = (mediumId: string) => {
    const medium = mediums?.find((m) => m.id === mediumId);
    return medium?.name || mediumId;
  };

  const formatPrice = (price?: number) => {
    if (!price) return "Price not available";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getUserName = (userId: string) => {
    const foundUser = users?.find((u) => u.id === userId);
    return foundUser?.name || "Unknown User";
  };

  return (
    <div className="p-8">
      <ContentWrapper loading={loading}>
        <div className="mb-8">
          <h1 className={h1ReverseDark}>Purchases</h1>
          <p className="text-gray-600">View sold and pending sale artworks</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <div className="relative w-full mb-4">
              <input
                type="search"
                id="search"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by artwork title or artist name..."
              />
              <button
                type="button"
                className="absolute top-0 end-0 p-2.5 text-sm font-medium h-full text-white bg-blue-700 rounded-e-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
              >
                <svg
                  className="w-4 h-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
                <span className="sr-only">Search</span>
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-4">
              <div
                className="relative flex-1 min-w-[200px]"
                ref={statusDropdownRef}
              >
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() => setIsStatusDropdownOpen((open) => !open)}
                >
                  Sale Status
                  <svg
                    className="w-2.5 h-2.5 ms-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                {isStatusDropdownOpen && (
                  <div className="z-10 absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow">
                    <ul className="py-2 text-sm text-gray-700">
                      {["sold", "pending"].map((status) => (
                        <li key={status}>
                          <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.statuses.includes(status)}
                              onChange={(e) => {
                                setFilters((prev) => ({
                                  ...prev,
                                  statuses: e.target.checked
                                    ? [...prev.statuses, status]
                                    : prev.statuses.filter((s) => s !== status),
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 capitalize">{status}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Active Filters */}
            {(filters.search || filters.statuses.length > 0) && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Search: {filters.search}
                      <button
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, search: "" }))
                        }
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.statuses.map((status) => (
                    <span
                      key={status}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      Status: {status}
                      <button
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            statuses: prev.statuses.filter((s) => s !== status),
                          }))
                        }
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  onClick={() =>
                    setFilters({
                      search: "",
                      statuses: [],
                    })
                  }
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Artworks Card Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {filteredArtworks.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">
                No Purchases Found
              </div>
            ) : (
              filteredArtworks.map((artwork) => {
                const artist = getArtistInfo(artwork.artistId);
                const status = artwork.sold ? "SOLD" : "PENDING";
                const statusColor = artwork.sold
                  ? "text-green-600 bg-green-100"
                  : "text-orange-600 bg-orange-100";

                return (
                  <div
                    key={artwork.id}
                    className="bg-white rounded-lg shadow p-6 flex flex-col items-center w-full max-w-md lg:max-w-lg cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedArtwork(artwork)}
                  >
                    <div className="w-full flex justify-center mb-3">
                      {artwork.images && artwork.images.length > 0 ? (
                        <img
                          src={artwork.images[0]}
                          alt={artwork.title}
                          className="h-40 w-40 object-cover rounded-lg shadow"
                        />
                      ) : (
                        <div className="h-40 w-40 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 text-center mb-1">
                      {artwork.title}
                    </div>
                    {artist && (
                      <div className="text-sm text-gray-700 text-center mb-2">
                        {artist.name}
                      </div>
                    )}
                    {artwork.height && artwork.width && artwork.uom && (
                      <div className="text-sm text-gray-600 text-center mb-2">
                        {artwork.height} X {artwork.width} {artwork.uom}
                      </div>
                    )}
                    <div className="flex flex-col items-center space-y-2 w-full">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
                      >
                        {status}
                      </span>
                      <div className="text-sm text-gray-600 text-center">
                        {formatPrice(artwork.price)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Buyer Info Modal */}
        {selectedArtwork && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center"
            onClick={() => setSelectedArtwork(null)}
          >
            <div
              className="relative top-10 mx-auto p-5 border w-full max-w-2xl max-h-[90vh] shadow-lg rounded-md bg-white overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Purchase Details
                </h3>
                <button
                  onClick={() => setSelectedArtwork(null)}
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
              <div className="space-y-6">
                {/* Artwork Info */}
                <div className="border-b pb-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">
                    Artwork Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Title:
                      </span>
                      <p className="text-gray-900">{selectedArtwork.title}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Artist:
                      </span>
                      <p className="text-gray-900">
                        {getArtistInfo(selectedArtwork.artistId)?.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Medium:
                      </span>
                      <p className="text-gray-900">
                        {getMediumName(selectedArtwork.medium)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Status:
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedArtwork.sold
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {selectedArtwork.sold ? "SOLD" : "PENDING"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buyer Information */}
                {selectedArtwork.buyerInfo && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">
                      Buyer Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          Name:
                        </span>
                        <p className="text-gray-900">
                          {selectedArtwork.buyerInfo.firstName}{" "}
                          {selectedArtwork.buyerInfo.lastName}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          Email:
                        </span>
                        <p className="text-gray-900">
                          {selectedArtwork.buyerInfo.email}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          Phone:
                        </span>
                        <p className="text-gray-900">
                          {selectedArtwork.buyerInfo.phone}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          Payment Method:
                        </span>
                        <p className="text-gray-900">
                          {selectedArtwork.buyerInfo.paymentMethod}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">
                          Final Price Paid:
                        </span>
                        <p className="text-gray-900">
                          {formatPrice(
                            selectedArtwork.buyerInfo.finalPricePaid
                          )}
                        </p>
                      </div>
                      {selectedArtwork.markedPending && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Marked Pending By:
                          </span>
                          <p className="text-gray-900">
                            {getUserName(selectedArtwork.markedPending)}
                          </p>
                        </div>
                      )}
                      {selectedArtwork.markedSold && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Marked Sold By:
                          </span>
                          <p className="text-gray-900">
                            {getUserName(selectedArtwork.markedSold)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Artwork Image */}
                {selectedArtwork.images &&
                  selectedArtwork.images.length > 0 && (
                    <div className="text-center">
                      <h4 className="text-lg font-medium text-gray-900 mb-3">
                        Artwork Image
                      </h4>
                      <img
                        src={selectedArtwork.images[0]}
                        alt={selectedArtwork.title}
                        className="max-w-full h-auto max-h-96 object-contain rounded-lg shadow"
                      />
                    </div>
                  )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedArtwork(null)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </ContentWrapper>
    </div>
  );
};

export default Purchases;
