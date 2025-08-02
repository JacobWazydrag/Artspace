import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import {
  fetchWebMasterArtshows,
  fetchWebMasterArtworks,
  fetchWebMasterChats,
  fetchWebMasterLocations,
  fetchWebMasterMail,
  fetchWebMasterMediums,
  fetchWebMasterMessages,
  fetchWebMasterUsers,
} from "../../features/webMasterSlice";
import { fetchLocations } from "../../features/locationsSlice";

type TabType =
  | "artshows"
  | "artworks"
  | "chats"
  | "locations"
  | "mail"
  | "mediums"
  | "messages"
  | "users";

const TableView = () => {
  const dispatch = useAppDispatch();
  const webMaster = useAppSelector((state) => state.webMaster);
  const locations = useAppSelector((state) => state.locations);
  const auth = useAppSelector((state) => state.auth);
  const profile = useAppSelector((state) => state.profile);
  const [activeTab, setActiveTab] = useState<TabType>("artshows");

  // Dialog state for array field details
  const [showDialog, setShowDialog] = useState(false);
  const [dialogData, setDialogData] = useState<{
    title: string;
    items: Array<{ id: string; name: string }>;
  }>({ title: "", items: [] });

  useEffect(() => {
    // Fetch all data when component mounts
    dispatch(fetchWebMasterArtshows());
    dispatch(fetchWebMasterArtworks());
    dispatch(fetchWebMasterChats());
    dispatch(fetchWebMasterLocations()).then((result) => {
      console.log("WebMaster Locations fetch result:", result);
    });
    dispatch(fetchWebMasterMail());
    dispatch(fetchWebMasterMediums());
    dispatch(fetchWebMasterMessages());
    dispatch(fetchWebMasterUsers());

    // Also fetch regular locations for comparison
    dispatch(fetchLocations()).then((result) => {
      console.log("Regular Locations fetch result:", result);
    });
  }, [dispatch]);

  const tabs = [
    {
      key: "artshows" as TabType,
      label: "Artshows",
      count: webMaster.artshows.length,
    },
    {
      key: "artworks" as TabType,
      label: "Artworks",
      count: webMaster.artworks.length,
    },
    { key: "chats" as TabType, label: "Chats", count: webMaster.chats.length },
    {
      key: "locations" as TabType,
      label: "Locations",
      count: webMaster.locations.length,
    },
    { key: "mail" as TabType, label: "Mail", count: webMaster.mail.length },
    {
      key: "mediums" as TabType,
      label: "Mediums",
      count: webMaster.mediums.length,
    },
    {
      key: "messages" as TabType,
      label: "Messages",
      count: webMaster.messages.length,
    },
    { key: "users" as TabType, label: "Users", count: webMaster.users.length },
  ];

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";

    let date;
    if (timestamp.seconds) {
      // Firestore timestamp
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      // Firestore timestamp object
      date = timestamp.toDate();
    } else {
      // Regular date
      date = new Date(timestamp);
    }

    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") {
      if (Array.isArray(value)) return `[${value.length} items]`;
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  // Helper functions to resolve IDs to names
  const resolveArtistNames = (artistIds: string[]) => {
    return artistIds.map((id) => {
      const user = webMaster.users.find((u) => u.id === id);
      return {
        id,
        name: user?.name || user?.email || `Artist ${id.slice(0, 8)}...`,
      };
    });
  };

  const resolveArtworkTitles = (artworkIds: string[]) => {
    return artworkIds.map((id) => {
      const artwork = webMaster.artworks.find((a) => a.id === id);
      return {
        id,
        name: artwork?.title || `Artwork ${id.slice(0, 8)}...`,
      };
    });
  };

  // Handle clicking on array field counts
  const handleArrayFieldClick = (fieldName: string, ids: string[]) => {
    let resolvedItems: Array<{ id: string; name: string }> = [];
    let title = "";

    switch (fieldName) {
      case "artistIds":
        resolvedItems = resolveArtistNames(ids);
        title = "Artists in Show";
        break;
      case "artworkIds":
        resolvedItems = resolveArtworkTitles(ids);
        title = "Artworks in Show";
        break;
      case "artworkOrder":
        resolvedItems = resolveArtworkTitles(ids);
        title = "Artwork Display Order";
        break;
      default:
        resolvedItems = ids.map((id) => ({ id, name: id }));
        title = fieldName;
    }

    setDialogData({ title, items: resolvedItems });
    setShowDialog(true);
  };

  const renderTable = () => {
    const data = webMaster[activeTab];
    const loading = webMaster.loading[activeTab];
    const error = webMaster.error[activeTab];

    // Debug logging for locations
    if (activeTab === "locations") {
      console.log("WebMaster Locations data:", data);
      console.log("WebMaster Locations loading:", loading);
      console.log("WebMaster Locations error:", error);
      console.log("Regular Locations slice data:", locations.data);
      console.log("Regular Locations slice loading:", locations.loading);
      console.log("Regular Locations slice error:", locations.error);
      console.log("User auth info:", {
        hasUser: !!auth.user,
        user: auth.user,
        profile: profile.data,
        authLoading: auth.loading,
        profileLoading: profile.loading,
      });
    }

    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Loading {activeTab}...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600">
            Error loading {activeTab}: {error}
          </p>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">No {activeTab} found.</p>
        </div>
      );
    }

    // Get all unique keys from the data to create table headers
    const allKeys = Array.from(
      new Set(data.flatMap((item: any) => Object.keys(item)))
    ).filter((key) => key !== "id"); // We'll show ID first

    const headers = ["id", ...allKeys];

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item: any, index: number) => (
              <tr key={item.id || index} className="hover:bg-gray-50">
                {headers.map((header) => {
                  const value = item[header];
                  const isArrayField =
                    activeTab === "artshows" &&
                    (header === "artistIds" ||
                      header === "artworkIds" ||
                      header === "artworkOrder") &&
                    Array.isArray(value);

                  return (
                    <td
                      key={`${item.id || index}-${header}`}
                      className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 max-w-xs"
                    >
                      {isArrayField ? (
                        <button
                          onClick={() => handleArrayFieldClick(header, value)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors"
                          title={`Click to view ${value.length} ${header}`}
                        >
                          {value.length} items
                        </button>
                      ) : (
                        <div className="truncate" title={formatValue(value)}>
                          {header.includes("createdAt") ||
                          header.includes("timestamp") ||
                          header.includes("sentAt") ||
                          header.includes("lastMessageTime") ||
                          header.includes("updatedAt")
                            ? formatDate(value)
                            : formatValue(value)}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            WebMaster Table View
          </h1>
          <p className="mt-2 text-gray-600">
            Complete database overview with real-time data from all collections
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              {activeTab} ({webMaster[activeTab].length} records)
            </h2>
          </div>
          <div className="p-6">{renderTable()}</div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => {
              switch (activeTab) {
                case "artshows":
                  dispatch(fetchWebMasterArtshows());
                  break;
                case "artworks":
                  dispatch(fetchWebMasterArtworks());
                  break;
                case "chats":
                  dispatch(fetchWebMasterChats());
                  break;
                case "locations":
                  dispatch(fetchWebMasterLocations());
                  break;
                case "mail":
                  dispatch(fetchWebMasterMail());
                  break;
                case "mediums":
                  dispatch(fetchWebMasterMediums());
                  break;
                case "messages":
                  dispatch(fetchWebMasterMessages());
                  break;
                case "users":
                  dispatch(fetchWebMasterUsers());
                  break;
              }
            }}
            disabled={webMaster.loading[activeTab]}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {webMaster.loading[activeTab] ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Refreshing...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh {activeTab}
              </>
            )}
          </button>
        </div>

        {/* Array Field Details Dialog */}
        {showDialog && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-96">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {dialogData.title}
                  </h3>
                  <button
                    onClick={() => setShowDialog(false)}
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

                <div className="max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {dialogData.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            ID: {item.id}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 ml-2">
                          #{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDialog(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableView;
