import React, { useState, useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import {
  fetchAllArtworks,
  Artwork,
  updateArtworkProductId,
} from "../../features/artworkSlice";
import { toast } from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

interface MakeProductModalProps {
  artwork: Artwork | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (artwork: Artwork) => void;
  loading: boolean;
}

const MakeProductModal: React.FC<MakeProductModalProps> = ({
  artwork,
  isOpen,
  onClose,
  onConfirm,
  loading,
}) => {
  if (!isOpen || !artwork) return null;

  const handleConfirm = () => {
    onConfirm(artwork);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Make Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />
            <p className="text-sm text-gray-600">
              Are you sure you want to make this artwork available for sale?
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-gray-900">Product Preview:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Name:</span> {artwork.title}
              </div>
              <div>
                <span className="font-medium">Description:</span>{" "}
                {artwork.description || "No description"}
              </div>
              <div>
                <span className="font-medium">Price:</span> $
                {artwork.price?.toFixed(2) || "0.00"} USD
              </div>
              <div>
                <span className="font-medium">Type:</span> One-time purchase
              </div>
              <div>
                <span className="font-medium">Active:</span> Yes
              </div>
              <div>
                <span className="font-medium">Images:</span>{" "}
                {artwork.images?.length || 0} image(s) will be included
              </div>
              <div>
                <span className="font-medium">Metadata:</span>
                <div className="ml-4 mt-1 text-xs bg-gray-100 p-2 rounded">
                  {JSON.stringify(
                    {
                      artworkId: artwork.id,
                      artistId: artwork.artistId,
                      artspacePrice: artwork.price,
                    },
                    null,
                    2
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Yes, Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    data: artworks,
    loading,
    error,
  } = useAppSelector((state) => state.artwork);
  const { user } = useAppSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState<
    "all" | "with-price" | "no-price"
  >("all");
  const [productFilter, setProductFilter] = useState<
    "all" | "with-product" | "no-product"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [createProductLoading, setCreateProductLoading] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchAllArtworks());
  }, [dispatch]);

  // Prevent any automatic redirects when we have checkout parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasCheckoutParams =
      urlParams.get("success") || urlParams.get("canceled");

    if (hasCheckoutParams) {
      // Store a flag to prevent redirects
      sessionStorage.setItem("checkout_return", "true");
    }
  }, []);

  // Handle checkout success/cancel URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const canceled = urlParams.get("canceled");
    const artworkId = urlParams.get("artwork_id");
    const sessionId = urlParams.get("session_id");

    console.log("ProductManagement loaded with URL Params:", {
      success,
      canceled,
      artworkId,
      sessionId,
    });
    console.log("Current URL:", window.location.href);
    console.log("Current pathname:", window.location.pathname);

    if (success === "true") {
      toast.success("Payment test completed successfully!");
      // Clean up URL parameters immediately
      window.history.replaceState({}, document.title, "/product-management");
    } else if (canceled === "true") {
      toast.error("Payment test was canceled.");
      // Clean up URL parameters immediately
      window.history.replaceState({}, document.title, "/product-management");
    }
  }, []);

  // Filter artworks
  const filteredArtworks = artworks.filter((artwork) => {
    const matchesSearch =
      artwork.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artwork.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "with-price" && artwork.price && artwork.price > 0) ||
      (priceFilter === "no-price" && (!artwork.price || artwork.price <= 0));

    const matchesProduct =
      productFilter === "all" ||
      (productFilter === "with-product" && artwork.productId) ||
      (productFilter === "no-product" && !artwork.productId);

    return matchesSearch && matchesPrice && matchesProduct;
  });

  // Pagination
  const totalPages = Math.ceil(filteredArtworks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedArtworks = filteredArtworks.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleMakeProduct = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedArtwork(null);
  };

  // Convert dollars to cents for Stripe
  const dollarsToCents = (dollars: number): number => {
    return Math.round(dollars * 100);
  };

  const handleTestPayment = useCallback(async (artwork: Artwork) => {
    if (!artwork.productId) {
      toast.error("Artwork must have a product created first");
      return;
    }

    if (!artwork.price || artwork.price <= 0) {
      toast.error("Artwork must have a valid price to test payment");
      return;
    }

    setCreateProductLoading(true);

    try {
      // Get the current URL for success/cancel URLs
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/product-management?success=true&artwork_id=${artwork.id}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/product-management?canceled=true&artwork_id=${artwork.id}`;

      console.log("Checkout URLs:", { successUrl, cancelUrl });
      console.log("User data:", { user, stripeId: user?.stripeId });

      const body = {
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: dollarsToCents(artwork.price),
              product_data: {
                name: artwork.title,
                description: artwork.description || "",
                images: artwork.images || [],
              },
            },
            quantity: 1,
          },
        ],
        customer: user?.stripeId || "",
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: "", // Could be filled with test email
        metadata: {
          artworkId: artwork.id,
          artistId: artwork.artistId,
          productId: artwork.productId,
        },
        allow_promotion_codes: true,
      };

      console.log("Creating checkout session with data:", body);

      const response = await fetch(
        "https://us-central1-artspace-dev.cloudfunctions.net/createCheckoutSessionV3",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          mode: "cors",
          credentials: "omit",
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Checkout session created successfully:", data);

        // Redirect to Stripe Checkout in same window
        if (data.url) {
          window.location.href = data.url;
        } else {
          toast.error("Checkout session created but no URL returned");
        }
      } else {
        console.error("Error creating checkout session:", data);
        toast.error(
          `Error creating checkout session: ${data.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Network error creating checkout session:", error);
      toast.error(
        `Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setCreateProductLoading(false);
    }
  }, []);

  const handleConfirmMakeProduct = useCallback(async (artwork: Artwork) => {
    if (!artwork.price || artwork.price <= 0) {
      toast.error("Artwork must have a valid price to create a product");
      return;
    }

    setCreateProductLoading(true);

    try {
      const body = {
        name: artwork.title,
        description: artwork.description || "",
        active: true,
        images: artwork.images || [], // Include artwork images (up to 8 URLs)
        metadata: {
          artworkId: artwork.id,
          artistId: artwork.artistId,
          artspacePrice: artwork.price,
        },
        includePrice: true,
        price: {
          currency: "usd",
          unit_amount: dollarsToCents(artwork.price),
          type: "one_time" as const,
          tax_behavior: "unspecified" as const,
        },
      };

      console.log("Creating product with data:", body);

      const response = await fetch(
        "https://us-central1-artspace-dev.cloudfunctions.net/createProductV3",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          mode: "cors",
          credentials: "omit",
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log("Product created successfully:", data);

        // Update artwork with productId
        if (data.product?.id) {
          try {
            await dispatch(
              updateArtworkProductId({
                artworkId: artwork.id,
                productId: data.product.id,
              })
            ).unwrap();

            toast.success(
              `Product created successfully! Product ID: ${data.product.id}`
            );
          } catch (updateError) {
            console.error(
              "Error updating artwork with product ID:",
              updateError
            );
            toast.error("Product created but failed to update artwork");
          }
        } else {
          toast.success("Product created successfully!");
        }

        handleCloseModal();
      } else {
        console.error("Error creating product:", data);
        toast.error(`Error creating product: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Network error creating product:", error);
      toast.error(
        `Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setCreateProductLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Error loading artworks: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
        <div className="text-sm text-gray-600">
          {filteredArtworks.length} of {artworks.length} artworks
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search artworks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={priceFilter}
              onChange={(e) =>
                setPriceFilter(
                  e.target.value as "all" | "with-price" | "no-price"
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Artworks</option>
              <option value="with-price">With Price</option>
              <option value="no-price">No Price</option>
            </select>
          </div>
          <div>
            <select
              value={productFilter}
              onChange={(e) =>
                setProductFilter(
                  e.target.value as "all" | "with-product" | "no-product"
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Products</option>
              <option value="with-product">With Product</option>
              <option value="no-product">No Product</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price (USD)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedArtworks.map((artwork) => (
                <tr key={artwork.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex-shrink-0 h-12 w-12">
                      {artwork.images && artwork.images.length > 0 ? (
                        <img
                          className="h-12 w-12 rounded-full object-cover"
                          src={artwork.images[0]}
                          alt={artwork.title}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-xs">
                            No Image
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {artwork.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {artwork.medium} • {artwork.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {artwork.price && artwork.price > 0
                        ? `$${artwork.price.toFixed(2)}`
                        : "No price set"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {artwork.productId ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Product Created
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No Product
                        </span>
                      )}
                    </div>
                    {artwork.productId && (
                      <div className="text-xs text-gray-500 mt-1">
                        ID: {artwork.productId}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMakeProduct(artwork)}
                        disabled={
                          !artwork.price ||
                          artwork.price <= 0 ||
                          !!artwork.productId
                        }
                        className="inline-flex items-center gap-2 px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCartIcon className="w-4 h-4" />
                        {artwork.productId ? "Product Exists" : "Make Product"}
                      </button>
                      {artwork.productId && (
                        <button
                          onClick={() => handleTestPayment(artwork)}
                          disabled={!artwork.price || artwork.price <= 0}
                          className="inline-flex items-center gap-2 px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CreditCardIcon className="w-4 h-4" />
                          Test Payment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      startIndex + itemsPerPage,
                      filteredArtworks.length
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{filteredArtworks.length}</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* No results */}
      {filteredArtworks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <ShoppingCartIcon className="mx-auto h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No artworks found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        </div>
      )}

      {/* Modal */}
      <MakeProductModal
        artwork={selectedArtwork}
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmMakeProduct}
        loading={createProductLoading}
      />
    </div>
  );
};

export default ProductManagement;
