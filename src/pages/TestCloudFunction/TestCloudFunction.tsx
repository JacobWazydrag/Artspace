import React, { useState, useCallback } from "react";
import { toast } from "react-hot-toast";

type TabType =
  | "message"
  | "create"
  | "get"
  | "update"
  | "delete"
  | "list"
  | "search"
  | "createPrice"
  | "getPrice"
  | "updatePrice"
  | "listPrices";

interface CreateProductData {
  name: string;
  active: boolean;
  description: string;
  metadata: string;
  images: string;
  tax_code: string;
  unit_label: string;
  url: string;
  // Optional price data
  includePrice: boolean;
  price: {
    currency: string;
    unit_amount_dollars: string; // Changed from unit_amount to unit_amount_dollars
    type: "one_time" | "recurring";
    nickname: string;
    tax_behavior: "inclusive" | "exclusive" | "unspecified";
    recurring?: {
      interval: "day" | "week" | "month" | "year";
      interval_count: string;
      trial_period_days: string;
    };
  };
}

interface UpdateProductData {
  active: boolean;
  description: string;
  metadata: string;
  name: string;
  images: string;
  tax_code: string;
  unit_label: string;
  url: string;
  default_price: string;
}

interface CreatePriceData {
  currency: string;
  unit_amount_dollars: string; // Changed from unit_amount to unit_amount_dollars
  product: string;
  type: "one_time" | "recurring";
  active: boolean;
  nickname: string;
  metadata: string;
  tax_behavior: "inclusive" | "exclusive" | "unspecified";
  recurring?: {
    interval: "day" | "week" | "month" | "year";
    interval_count: string;
    trial_period_days: string;
  };
}

interface UpdatePriceData {
  active: boolean;
  nickname: string;
  metadata: string;
  tax_behavior: "inclusive" | "exclusive" | "unspecified";
}

// Utility function to convert dollars to cents
const dollarsToCents = (dollars: string): number => {
  const dollarAmount = parseFloat(dollars);
  if (isNaN(dollarAmount)) return 0;
  return Math.round(dollarAmount * 100);
};

const TestCloudFunction: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("message");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Message tab state
  const [message, setMessage] = useState("");

  // Create product state
  const [createData, setCreateData] = useState<CreateProductData>({
    name: "",
    active: true,
    description: "",
    metadata: "",
    images: "",
    tax_code: "",
    unit_label: "",
    url: "",
    includePrice: false,
    price: {
      currency: "usd",
      unit_amount_dollars: "", // Changed from unit_amount to unit_amount_dollars
      type: "one_time",
      nickname: "",
      tax_behavior: "unspecified",
      recurring: {
        interval: "month",
        interval_count: "1",
        trial_period_days: "",
      },
    },
  });

  // Get/Update/Delete product state
  const [productId, setProductId] = useState("");

  // Update product state
  const [updateData, setUpdateData] = useState<UpdateProductData>({
    active: true,
    description: "",
    metadata: "",
    name: "",
    images: "",
    tax_code: "",
    unit_label: "",
    url: "",
    default_price: "",
  });

  // Create price state
  const [createPriceData, setCreatePriceData] = useState<CreatePriceData>({
    currency: "usd",
    unit_amount_dollars: "", // Changed from unit_amount to unit_amount_dollars
    product: "",
    type: "one_time",
    active: true,
    nickname: "",
    metadata: "",
    tax_behavior: "unspecified",
    recurring: {
      interval: "month",
      interval_count: "1",
      trial_period_days: "",
    },
  });

  // Get/Update price state
  const [priceId, setPriceId] = useState("");

  // Update price state
  const [updatePriceData, setUpdatePriceData] = useState<UpdatePriceData>({
    active: true,
    nickname: "",
    metadata: "",
    tax_behavior: "unspecified",
  });

  // List prices state
  const [listPricesParams, setListPricesParams] = useState({
    limit: "10",
    starting_after: "",
    ending_before: "",
    active: "",
    currency: "",
    product: "",
    type: "",
  });

  // List products state
  const [listParams, setListParams] = useState({
    limit: "10",
    starting_after: "",
    ending_before: "",
    active: "",
  });

  // Search products state
  const [searchParams, setSearchParams] = useState({
    query: "",
    limit: "10",
    page: "",
  });

  const tabs = [
    { id: "message", label: "Message", icon: "💬" },
    { id: "create", label: "Create P", icon: "➕" },
    { id: "get", label: "Get P", icon: "🔍" },
    { id: "update", label: "Update P", icon: "✏️" },
    { id: "delete", label: "Delete P", icon: "🗑️" },
    { id: "list", label: "List Ps", icon: "📋" },
    { id: "search", label: "Search Ps", icon: "🔎" },
    { id: "createPrice", label: "C Price", icon: "💰" },
    { id: "getPrice", label: "G Price", icon: "💳" },
    { id: "updatePrice", label: "U Price", icon: "📝" },
    { id: "listPrices", label: "L rices", icon: "💵" },
  ];

  // Helper function to make HTTP requests
  const makeRequest = useCallback(
    async (url: string, options: RequestInit = {}) => {
      setLoading(true);
      setResults(null);

      try {
        console.log("Making request to:", url, "with options:", options);

        let fetchOptions: RequestInit;

        // For GET requests, use minimal options to avoid preflight
        if (!options.method || options.method === "GET") {
          fetchOptions = {
            method: "GET",
            // No custom headers for GET requests to avoid preflight
          };
        } else {
          // For POST/PUT/DELETE, include necessary headers
          fetchOptions = {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              ...(options.headers as Record<string, string>),
            },
            mode: "cors",
            credentials: "omit",
            ...options,
          };
        }

        const response = await fetch(url, fetchOptions);

        console.log("Response status:", response.status);
        console.log(
          "Response headers:",
          Object.fromEntries(response.headers.entries())
        );

        const data = await response.json();

        if (response.ok) {
          setResults(data);
          toast.success("Request successful!");
        } else {
          setResults({ error: data });
          toast.error(`Error: ${data.error || "Request failed"}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setResults({ error: errorMessage });
        toast.error(`Network error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Message test handler
  const handleTestMessage = useCallback(async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const url = `https://addmessage-cv74cv34mq-uc.a.run.app?text=${encodeURIComponent(
      message
    )}`;
    await makeRequest(url, { method: "GET" });
  }, [message, makeRequest]);

  // Create product handler
  const handleCreateProduct = useCallback(async () => {
    if (!createData.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    const body: any = {
      name: createData.name,
      active: createData.active,
    };

    if (createData.description) body.description = createData.description;
    if (createData.metadata) {
      try {
        body.metadata = JSON.parse(createData.metadata);
      } catch {
        toast.error("Invalid JSON in metadata field");
        return;
      }
    }
    if (createData.images)
      body.images = createData.images.split(",").map((img) => img.trim());
    if (createData.tax_code) body.tax_code = createData.tax_code;
    if (createData.unit_label) body.unit_label = createData.unit_label;
    if (createData.url) body.url = createData.url;

    // Include price data if specified
    if (createData.includePrice) {
      if (!createData.price.currency || !createData.price.unit_amount_dollars) {
        toast.error("Price currency and amount are required");
        return;
      }

      const priceData: any = {
        currency: createData.price.currency,
        unit_amount: dollarsToCents(createData.price.unit_amount_dollars),
        type: createData.price.type,
        tax_behavior: createData.price.tax_behavior,
      };

      if (createData.price.nickname)
        priceData.nickname = createData.price.nickname;

      if (createData.price.type === "recurring" && createData.price.recurring) {
        priceData.recurring = {
          interval: createData.price.recurring.interval,
        };
        if (createData.price.recurring.interval_count) {
          priceData.recurring.interval_count = parseInt(
            createData.price.recurring.interval_count
          );
        }
        if (createData.price.recurring.trial_period_days) {
          priceData.recurring.trial_period_days = parseInt(
            createData.price.recurring.trial_period_days
          );
        }
      }

      body.price = priceData;
    }

    await makeRequest(
      "https://us-central1-artspace-dev.cloudfunctions.net/createProductV2",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
  }, [createData, makeRequest]);

  // Get product handler
  const handleGetProduct = useCallback(async () => {
    if (!productId.trim()) {
      toast.error("Product ID is required");
      return;
    }

    const url = `https://us-central1-artspace-dev.cloudfunctions.net/getProductV2?id=${encodeURIComponent(
      productId
    )}`;
    await makeRequest(url, { method: "GET" });
  }, [productId, makeRequest]);

  // Update product handler
  const handleUpdateProduct = useCallback(async () => {
    if (!productId.trim()) {
      toast.error("Product ID is required");
      return;
    }

    const body: any = {
      active: updateData.active,
    };

    if (updateData.name) body.name = updateData.name;
    if (updateData.description) body.description = updateData.description;
    if (updateData.metadata) {
      try {
        body.metadata = JSON.parse(updateData.metadata);
      } catch {
        toast.error("Invalid JSON in metadata field");
        return;
      }
    }
    if (updateData.images)
      body.images = updateData.images.split(",").map((img) => img.trim());
    if (updateData.tax_code) body.tax_code = updateData.tax_code;
    if (updateData.unit_label) body.unit_label = updateData.unit_label;
    if (updateData.url) body.url = updateData.url;
    if (updateData.default_price) body.default_price = updateData.default_price;

    await makeRequest(
      `https://us-central1-artspace-dev.cloudfunctions.net/updateProductV2?id=${encodeURIComponent(
        productId
      )}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      }
    );
  }, [productId, updateData, makeRequest]);

  // Delete product handler
  const handleDeleteProduct = useCallback(async () => {
    if (!productId.trim()) {
      toast.error("Product ID is required");
      return;
    }

    await makeRequest(
      `https://us-central1-artspace-dev.cloudfunctions.net/deleteProductV2?id=${encodeURIComponent(
        productId
      )}`,
      {
        method: "DELETE",
      }
    );
  }, [productId, makeRequest]);

  // List products handler
  const handleListProducts = useCallback(async () => {
    const params = new URLSearchParams();

    if (listParams.limit) params.append("limit", listParams.limit);
    if (listParams.starting_after)
      params.append("starting_after", listParams.starting_after);
    if (listParams.ending_before)
      params.append("ending_before", listParams.ending_before);
    if (listParams.active) params.append("active", listParams.active);

    const url = `https://us-central1-artspace-dev.cloudfunctions.net/listProductsV2?${params.toString()}`;
    await makeRequest(url, { method: "GET" });
  }, [listParams, makeRequest]);

  // Search products handler
  const handleSearchProducts = useCallback(async () => {
    if (!searchParams.query.trim()) {
      toast.error("Search query is required");
      return;
    }

    const params = new URLSearchParams();
    params.append("query", searchParams.query);
    if (searchParams.limit) params.append("limit", searchParams.limit);
    if (searchParams.page) params.append("page", searchParams.page);

    const url = `https://us-central1-artspace-dev.cloudfunctions.net/searchProductsV2?${params.toString()}`;
    await makeRequest(url, { method: "GET" });
  }, [searchParams, makeRequest]);

  // Create price handler
  const handleCreatePrice = useCallback(async () => {
    if (
      !createPriceData.currency ||
      !createPriceData.unit_amount_dollars ||
      !createPriceData.product
    ) {
      toast.error("Currency, unit amount, and product ID are required");
      return;
    }

    const body: any = {
      currency: createPriceData.currency,
      unit_amount: dollarsToCents(createPriceData.unit_amount_dollars),
      product: createPriceData.product,
      type: createPriceData.type,
      active: createPriceData.active,
      tax_behavior: createPriceData.tax_behavior,
    };

    if (createPriceData.nickname) body.nickname = createPriceData.nickname;
    if (createPriceData.metadata) {
      try {
        body.metadata = JSON.parse(createPriceData.metadata);
      } catch {
        toast.error("Invalid JSON in metadata field");
        return;
      }
    }

    if (createPriceData.type === "recurring" && createPriceData.recurring) {
      body.recurring = {
        interval: createPriceData.recurring.interval,
      };
      if (createPriceData.recurring.interval_count) {
        body.recurring.interval_count = parseInt(
          createPriceData.recurring.interval_count
        );
      }
      if (createPriceData.recurring.trial_period_days) {
        body.recurring.trial_period_days = parseInt(
          createPriceData.recurring.trial_period_days
        );
      }
    }

    await makeRequest(
      "https://us-central1-artspace-dev.cloudfunctions.net/createPriceV2",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
  }, [createPriceData, makeRequest]);

  // Get price handler
  const handleGetPrice = useCallback(async () => {
    if (!priceId.trim()) {
      toast.error("Price ID is required");
      return;
    }

    const url = `https://us-central1-artspace-dev.cloudfunctions.net/getPriceV2?id=${encodeURIComponent(
      priceId
    )}`;
    await makeRequest(url, { method: "GET" });
  }, [priceId, makeRequest]);

  // Update price handler
  const handleUpdatePrice = useCallback(async () => {
    if (!priceId.trim()) {
      toast.error("Price ID is required");
      return;
    }

    const body: any = {
      active: updatePriceData.active,
      tax_behavior: updatePriceData.tax_behavior,
    };

    if (updatePriceData.nickname) body.nickname = updatePriceData.nickname;
    if (updatePriceData.metadata) {
      try {
        body.metadata = JSON.parse(updatePriceData.metadata);
      } catch {
        toast.error("Invalid JSON in metadata field");
        return;
      }
    }

    await makeRequest(
      `https://us-central1-artspace-dev.cloudfunctions.net/updatePriceV2?id=${encodeURIComponent(
        priceId
      )}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      }
    );
  }, [priceId, updatePriceData, makeRequest]);

  // List prices handler
  const handleListPrices = useCallback(async () => {
    const params = new URLSearchParams();

    if (listPricesParams.limit) params.append("limit", listPricesParams.limit);
    if (listPricesParams.starting_after)
      params.append("starting_after", listPricesParams.starting_after);
    if (listPricesParams.ending_before)
      params.append("ending_before", listPricesParams.ending_before);
    if (listPricesParams.active)
      params.append("active", listPricesParams.active);
    if (listPricesParams.currency)
      params.append("currency", listPricesParams.currency);
    if (listPricesParams.product)
      params.append("product", listPricesParams.product);
    if (listPricesParams.type) params.append("type", listPricesParams.type);

    const url = `https://us-central1-artspace-dev.cloudfunctions.net/listPricesV2?${params.toString()}`;
    await makeRequest(url, { method: "GET" });
  }, [listPricesParams, makeRequest]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "message":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <button
              onClick={handleTestMessage}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Testing..." : "Test Message Function"}
            </button>
          </div>
        );

      case "create":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={createData.name}
                  onChange={(e) =>
                    setCreateData({ ...createData, name: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active
                </label>
                <select
                  value={createData.active.toString()}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      active: e.target.value === "true",
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={createData.description}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metadata (JSON)
                </label>
                <input
                  type="text"
                  value={createData.metadata}
                  onChange={(e) =>
                    setCreateData({ ...createData, metadata: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='{"key": "value"}'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images (comma-separated URLs)
                </label>
                <input
                  type="text"
                  value={createData.images}
                  onChange={(e) =>
                    setCreateData({ ...createData, images: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Code
                </label>
                <input
                  type="text"
                  value={createData.tax_code}
                  onChange={(e) =>
                    setCreateData({ ...createData, tax_code: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tax code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Label
                </label>
                <input
                  type="text"
                  value={createData.unit_label}
                  onChange={(e) =>
                    setCreateData({ ...createData, unit_label: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Unit label"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="text"
                  value={createData.url}
                  onChange={(e) =>
                    setCreateData({ ...createData, url: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Optional Price Creation */}
            <div className="border-t pt-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="includePrice"
                  checked={createData.includePrice}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      includePrice: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                <label
                  htmlFor="includePrice"
                  className="text-sm font-medium text-gray-700"
                >
                  Create default price with product
                </label>
              </div>

              {createData.includePrice && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency *
                      </label>
                      <select
                        value={createData.price.currency}
                        onChange={(e) =>
                          setCreateData({
                            ...createData,
                            price: {
                              ...createData.price,
                              currency: e.target.value,
                            },
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="usd">USD</option>
                        <option value="eur">EUR</option>
                        <option value="gbp">GBP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Amount * (dollars)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={createData.price.unit_amount_dollars}
                        onChange={(e) =>
                          setCreateData({
                            ...createData,
                            price: {
                              ...createData.price,
                              unit_amount_dollars: e.target.value,
                            },
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="10.00"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        value={createData.price.type}
                        onChange={(e) =>
                          setCreateData({
                            ...createData,
                            price: {
                              ...createData.price,
                              type: e.target.value as "one_time" | "recurring",
                            },
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="one_time">One Time</option>
                        <option value="recurring">Recurring</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nickname
                      </label>
                      <input
                        type="text"
                        value={createData.price.nickname}
                        onChange={(e) =>
                          setCreateData({
                            ...createData,
                            price: {
                              ...createData.price,
                              nickname: e.target.value,
                            },
                          })
                        }
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Monthly subscription"
                      />
                    </div>
                  </div>

                  {createData.price.type === "recurring" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interval
                        </label>
                        <select
                          value={createData.price.recurring?.interval}
                          onChange={(e) =>
                            setCreateData({
                              ...createData,
                              price: {
                                ...createData.price,
                                recurring: {
                                  ...createData.price.recurring!,
                                  interval: e.target.value as
                                    | "day"
                                    | "week"
                                    | "month"
                                    | "year",
                                },
                              },
                            })
                          }
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="day">Day</option>
                          <option value="week">Week</option>
                          <option value="month">Month</option>
                          <option value="year">Year</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interval Count
                        </label>
                        <input
                          type="number"
                          value={createData.price.recurring?.interval_count}
                          onChange={(e) =>
                            setCreateData({
                              ...createData,
                              price: {
                                ...createData.price,
                                recurring: {
                                  ...createData.price.recurring!,
                                  interval_count: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="1"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trial Period Days
                        </label>
                        <input
                          type="number"
                          value={createData.price.recurring?.trial_period_days}
                          onChange={(e) =>
                            setCreateData({
                              ...createData,
                              price: {
                                ...createData.price,
                                recurring: {
                                  ...createData.price.recurring!,
                                  trial_period_days: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleCreateProduct}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Product"}
            </button>
          </div>
        );

      case "get":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product ID *
              </label>
              <input
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product ID"
              />
            </div>
            <button
              onClick={handleGetProduct}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Getting..." : "Get Product"}
            </button>
          </div>
        );

      case "update":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product ID *
              </label>
              <input
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product ID"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={updateData.name}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, name: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active
                </label>
                <select
                  value={updateData.active.toString()}
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
                      active: e.target.value === "true",
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={updateData.description}
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metadata (JSON)
                </label>
                <input
                  type="text"
                  value={updateData.metadata}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, metadata: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='{"key": "value"}'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images (comma-separated URLs)
                </label>
                <input
                  type="text"
                  value={updateData.images}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, images: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Code
                </label>
                <input
                  type="text"
                  value={updateData.tax_code}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, tax_code: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tax code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Label
                </label>
                <input
                  type="text"
                  value={updateData.unit_label}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, unit_label: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Unit label"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="text"
                  value={updateData.url}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, url: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Price ID
                </label>
                <input
                  type="text"
                  value={updateData.default_price}
                  onChange={(e) =>
                    setUpdateData({
                      ...updateData,
                      default_price: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="price_xxxxxxxxxxxxxxxx"
                />
              </div>
            </div>
            <button
              onClick={handleUpdateProduct}
              disabled={loading}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Product"}
            </button>
          </div>
        );

      case "delete":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product ID *
              </label>
              <input
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product ID"
              />
            </div>
            <button
              onClick={handleDeleteProduct}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Deleting..." : "Delete Product"}
            </button>
          </div>
        );

      case "list":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limit
                </label>
                <input
                  type="number"
                  value={listParams.limit}
                  onChange={(e) =>
                    setListParams({ ...listParams, limit: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10"
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active
                </label>
                <select
                  value={listParams.active}
                  onChange={(e) =>
                    setListParams({ ...listParams, active: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting After (Product ID)
                </label>
                <input
                  type="text"
                  value={listParams.starting_after}
                  onChange={(e) =>
                    setListParams({
                      ...listParams,
                      starting_after: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product ID for pagination"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ending Before (Product ID)
                </label>
                <input
                  type="text"
                  value={listParams.ending_before}
                  onChange={(e) =>
                    setListParams({
                      ...listParams,
                      ending_before: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product ID for pagination"
                />
              </div>
            </div>
            <button
              onClick={handleListProducts}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "List Products"}
            </button>
          </div>
        );

      case "search":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Query *
                </label>
                <input
                  type="text"
                  value={searchParams.query}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, query: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search products..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limit
                </label>
                <input
                  type="number"
                  value={searchParams.limit}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, limit: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10"
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Token
                </label>
                <input
                  type="text"
                  value={searchParams.page}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, page: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Page token for pagination"
                />
              </div>
            </div>
            <button
              onClick={handleSearchProducts}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search Products"}
            </button>
          </div>
        );

      case "createPrice":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product ID *
                </label>
                <input
                  type="text"
                  value={createPriceData.product}
                  onChange={(e) =>
                    setCreatePriceData({
                      ...createPriceData,
                      product: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="prod_xxxxxxxxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  value={createPriceData.currency}
                  onChange={(e) =>
                    setCreatePriceData({
                      ...createPriceData,
                      currency: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="usd">USD</option>
                  <option value="eur">EUR</option>
                  <option value="gbp">GBP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Amount * (dollars)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={createPriceData.unit_amount_dollars}
                  onChange={(e) =>
                    setCreatePriceData({
                      ...createPriceData,
                      unit_amount_dollars: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10.00"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={createPriceData.type}
                  onChange={(e) =>
                    setCreatePriceData({
                      ...createPriceData,
                      type: e.target.value as "one_time" | "recurring",
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="one_time">One Time</option>
                  <option value="recurring">Recurring</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nickname
                </label>
                <input
                  type="text"
                  value={createPriceData.nickname}
                  onChange={(e) =>
                    setCreatePriceData({
                      ...createPriceData,
                      nickname: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Monthly subscription"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Behavior
                </label>
                <select
                  value={createPriceData.tax_behavior}
                  onChange={(e) =>
                    setCreatePriceData({
                      ...createPriceData,
                      tax_behavior: e.target.value as
                        | "inclusive"
                        | "exclusive"
                        | "unspecified",
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unspecified">Unspecified</option>
                  <option value="inclusive">Inclusive</option>
                  <option value="exclusive">Exclusive</option>
                </select>
              </div>
            </div>
            {createPriceData.type === "recurring" && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">
                  Recurring Options
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interval
                    </label>
                    <select
                      value={createPriceData.recurring?.interval}
                      onChange={(e) =>
                        setCreatePriceData({
                          ...createPriceData,
                          recurring: {
                            ...createPriceData.recurring!,
                            interval: e.target.value as
                              | "day"
                              | "week"
                              | "month"
                              | "year",
                          },
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="year">Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interval Count
                    </label>
                    <input
                      type="number"
                      value={createPriceData.recurring?.interval_count}
                      onChange={(e) =>
                        setCreatePriceData({
                          ...createPriceData,
                          recurring: {
                            ...createPriceData.recurring!,
                            interval_count: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trial Period Days
                    </label>
                    <input
                      type="number"
                      value={createPriceData.recurring?.trial_period_days}
                      onChange={(e) =>
                        setCreatePriceData({
                          ...createPriceData,
                          recurring: {
                            ...createPriceData.recurring!,
                            trial_period_days: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={handleCreatePrice}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Price"}
            </button>
          </div>
        );

      case "getPrice":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price ID *
              </label>
              <input
                type="text"
                value={priceId}
                onChange={(e) => setPriceId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="price_xxxxxxxxxxxxxxxx"
              />
            </div>
            <button
              onClick={handleGetPrice}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Getting..." : "Get Price"}
            </button>
          </div>
        );

      case "updatePrice":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price ID *
              </label>
              <input
                type="text"
                value={priceId}
                onChange={(e) => setPriceId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="price_xxxxxxxxxxxxxxxx"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active
                </label>
                <select
                  value={updatePriceData.active.toString()}
                  onChange={(e) =>
                    setUpdatePriceData({
                      ...updatePriceData,
                      active: e.target.value === "true",
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nickname
                </label>
                <input
                  type="text"
                  value={updatePriceData.nickname}
                  onChange={(e) =>
                    setUpdatePriceData({
                      ...updatePriceData,
                      nickname: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Monthly subscription"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Behavior
                </label>
                <select
                  value={updatePriceData.tax_behavior}
                  onChange={(e) =>
                    setUpdatePriceData({
                      ...updatePriceData,
                      tax_behavior: e.target.value as
                        | "inclusive"
                        | "exclusive"
                        | "unspecified",
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unspecified">Unspecified</option>
                  <option value="inclusive">Inclusive</option>
                  <option value="exclusive">Exclusive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metadata (JSON)
                </label>
                <input
                  type="text"
                  value={updatePriceData.metadata}
                  onChange={(e) =>
                    setUpdatePriceData({
                      ...updatePriceData,
                      metadata: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='{"key": "value"}'
                />
              </div>
            </div>
            <button
              onClick={handleUpdatePrice}
              disabled={loading}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Price"}
            </button>
          </div>
        );

      case "listPrices":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limit
                </label>
                <input
                  type="number"
                  value={listPricesParams.limit}
                  onChange={(e) =>
                    setListPricesParams({
                      ...listPricesParams,
                      limit: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10"
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active
                </label>
                <select
                  value={listPricesParams.active}
                  onChange={(e) =>
                    setListPricesParams({
                      ...listPricesParams,
                      active: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={listPricesParams.currency}
                  onChange={(e) =>
                    setListPricesParams({
                      ...listPricesParams,
                      currency: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="usd">USD</option>
                  <option value="eur">EUR</option>
                  <option value="gbp">GBP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={listPricesParams.type}
                  onChange={(e) =>
                    setListPricesParams({
                      ...listPricesParams,
                      type: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="one_time">One Time</option>
                  <option value="recurring">Recurring</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product ID
                </label>
                <input
                  type="text"
                  value={listPricesParams.product}
                  onChange={(e) =>
                    setListPricesParams({
                      ...listPricesParams,
                      product: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="prod_xxxxxxxxxxxxxxxx"
                />
              </div>
            </div>
            <button
              onClick={handleListPrices}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "List Prices"}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Cloud Functions Testing
          </h1>
          <p className="text-gray-600 mt-2">
            Test your deployed Cloud Functions with interactive forms
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">{renderTabContent()}</div>

        {/* Results */}
        {results && (
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Results
            </h3>
            <div className="bg-gray-50 rounded-md p-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Documentation */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Function URLs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                Message Functions
              </h4>
              <ul className="space-y-1 text-gray-600">
                <li>
                  • <strong>addmessage:</strong>{" "}
                  https://addmessage-cv74cv34mq-uc.a.run.app
                </li>
                <li>
                  • <strong>makeuppercase:</strong> Firestore trigger
                  (automatic)
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                Stripe Product Functions (V2)
              </h4>
              <ul className="space-y-1 text-gray-600">
                <li>
                  • <strong>createProductV2:</strong>{" "}
                  https://us-central1-artspace-dev.cloudfunctions.net/createProductV2
                </li>
                <li>
                  • <strong>getProductV2:</strong>{" "}
                  https://us-central1-artspace-dev.cloudfunctions.net/getProductV2
                </li>
                <li>
                  • <strong>updateProductV2:</strong>{" "}
                  https://us-central1-artspace-dev.cloudfunctions.net/updateProductV2
                </li>
                <li>
                  • <strong>deleteProductV2:</strong>{" "}
                  https://us-central1-artspace-dev.cloudfunctions.net/deleteProductV2
                </li>
                <li>
                  • <strong>listProductsV2:</strong>{" "}
                  https://us-central1-artspace-dev.cloudfunctions.net/listProductsV2
                </li>
                <li>
                  • <strong>searchProductsV2:</strong>{" "}
                  https://us-central1-artspace-dev.cloudfunctions.net/searchProductsV2
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                Stripe Price Functions (V2)
              </h4>
              <ul className="space-y-1 text-gray-600">
                <li>
                  • <strong>createPriceV2:</strong>{" "}
                  https://us-central1-artspace-dev.cloudfunctions.net/createPriceV2
                </li>
                <li>
                  • <strong>getPriceV2:</strong>{" "}
                  https://us-central1-artspace-dev.cloudfunctions.net/getPriceV2
                </li>
                <li>
                  • <strong>updatePriceV2:</strong>{" "}
                  https://us-central1-artspace-dev.cloudfunctions.net/updatePriceV2
                </li>
                <li>
                  • <strong>listPricesV2:</strong>{" "}
                  https://us-central1-artspace-dev.cloudfunctions.net/listPricesV2
                </li>
              </ul>
            </div>
          </div>

          {/* CORS Troubleshooting */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-medium text-yellow-800 mb-2">
              🔧 CORS Troubleshooting
            </h4>
            <div className="text-sm text-yellow-700 space-y-2">
              <p>
                <strong>If you're getting CORS errors:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Check the browser console for detailed error messages</li>
                <li>
                  Verify that your Cloud Functions are properly handling OPTIONS
                  requests
                </li>
                <li>
                  Make sure your Cloud Functions have the latest CORS
                  configuration
                </li>
                <li>
                  Try testing the endpoints directly in a new browser tab (for
                  GET requests)
                </li>
              </ol>
              <p className="mt-2">
                <strong>Direct testing URLs:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Message:{" "}
                  <code className="bg-yellow-100 px-1 rounded">
                    https://addmessage-cv74cv34mq-uc.a.run.app?text=hello
                  </code>
                </li>
                <li>
                  List Products:{" "}
                  <code className="bg-yellow-100 px-1 rounded">
                    https://us-central1-artspace-dev.cloudfunctions.net/listProductsV2?limit=5
                  </code>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCloudFunction;
