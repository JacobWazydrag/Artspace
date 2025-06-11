import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchAllArtworks } from "../../features/artworkSlice";
import ContentWrapper from "../../components/ContentWrapper";
import { formClasses } from "../../classes/tailwindClasses";

interface FilterState {
  search: string;
}

const Artworks = () => {
  const dispatch = useAppDispatch();
  const {
    data: artworks,
    loading,
    error,
  } = useAppSelector((state) => state.artwork);
  const { h1ReverseDark } = formClasses;
  const [filters, setFilters] = useState<FilterState>({
    search: "",
  });

  useEffect(() => {
    dispatch(fetchAllArtworks());
  }, [dispatch]);

  const filteredArtworks = artworks.filter((artwork) => {
    if (
      filters.search &&
      !artwork.title.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-8">
      <ContentWrapper loading={loading}>
        <div className="flex justify-between items-center mb-6">
          <h1 className={h1ReverseDark}>Artworks</h1>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex">
              <div className="relative w-full">
                <input
                  type="search"
                  id="search"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search artworks by title..."
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
            </div>
          </div>
        </div>

        {/* Artworks Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredArtworks.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Artworks Found
              </h3>
              <p className="text-gray-500 mb-4">
                {artworks.length === 0
                  ? "No artworks have been added yet."
                  : "No artworks match your current search."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Images
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredArtworks.map((artwork) => (
                    <tr key={artwork.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {artwork.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {artwork.images?.length || 0} images
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ContentWrapper>
    </div>
  );
};

export default Artworks;
