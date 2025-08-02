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
  const [activeTab, setActiveTab] = useState<TabType>("artshows");

  useEffect(() => {
    // Fetch all data when component mounts
    dispatch(fetchWebMasterArtshows());
    dispatch(fetchWebMasterArtworks());
    dispatch(fetchWebMasterChats());
    dispatch(fetchWebMasterLocations());
    dispatch(fetchWebMasterMail());
    dispatch(fetchWebMasterMediums());
    dispatch(fetchWebMasterMessages());
    dispatch(fetchWebMasterUsers());
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

  const renderTable = () => {
    const data = webMaster[activeTab];
    const loading = webMaster.loading[activeTab];
    const error = webMaster.error[activeTab];

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
                {headers.map((header) => (
                  <td
                    key={`${item.id || index}-${header}`}
                    className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200 max-w-xs"
                  >
                    <div className="truncate" title={formatValue(item[header])}>
                      {header.includes("createdAt") ||
                      header.includes("timestamp") ||
                      header.includes("sentAt") ||
                      header.includes("lastMessageTime")
                        ? formatDate(item[header])
                        : formatValue(item[header])}
                    </div>
                  </td>
                ))}
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
      </div>
    </div>
  );
};

export default TableView;
