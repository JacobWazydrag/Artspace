import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchArtshows } from "../../features/artshowsSlice";
import { fetchAllUsers, User } from "../../features/usersSlice";

const ShowUsers = () => {
  const { showId } = useParams();
  const dispatch = useAppDispatch();
  const { data: artshows } = useAppSelector((state) => state.artshows);
  const { data: users, loading } = useAppSelector((state) => state.users);

  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    dispatch(fetchArtshows());
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const show = useMemo(
    () => artshows.find((s) => s.id === showId),
    [artshows, showId]
  );

  const filteredUsers = useMemo(() => {
    const targetName = (show?.name || "").toLowerCase();
    return users
      .filter(
        (u: User) => (u.interestInShow || "").toLowerCase() === targetName
      )
      .filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, show?.name, search]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {show?.name || "Show"} Users
        </h1>
      </div>

      <div className="max-w-xl mb-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="block p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600 mb-4">
          {loading ? "Loading..." : ``}
        </div>
        {filteredUsers.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No users found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="bg-white rounded-lg border shadow hover:shadow-md transition-shadow p-6 flex flex-col items-center cursor-pointer"
                onClick={() => {
                  setSelectedUser(u);
                  setIsPreviewOpen(true);
                }}
              >
                <img
                  className="h-20 w-20 rounded-full object-cover mb-3"
                  src={
                    u.photoUrl ||
                    "https://ui-avatars.com/api/?name=" +
                      encodeURIComponent(u.name || u.email)
                  }
                  alt={u.name}
                />
                <div className="text-lg font-semibold text-gray-900 text-center">
                  {u.name || "Unnamed"}
                </div>
                <div className="text-xs text-gray-500 text-center mb-4">
                  {u.email}
                </div>
                <button
                  className="text-indigo-600 hover:text-indigo-900 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    const base = routerLocation.pathname.startsWith(
                      "/onboarding"
                    )
                      ? "/onboarding"
                      : "/artist";
                    navigate(`${base}/users/${u.id}/artworks`);
                  }}
                >
                  View Artworks
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isPreviewOpen && selectedUser && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="relative top-10 mx-auto p-5 border w-[800px] max-w-full max-h-[90vh] shadow-lg rounded-md bg-white overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Artist Profile Preview
                </h3>
                <button
                  onClick={() => setIsPreviewOpen(false)}
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
                {/* Profile Header */}
                <div className="flex items-center space-x-4 border-b pb-4">
                  <img
                    className="h-20 w-20 rounded-full object-cover"
                    src={
                      selectedUser.photoUrl ||
                      "https://ui-avatars.com/api/?name=" +
                        encodeURIComponent(
                          selectedUser.name || selectedUser.email
                        )
                    }
                    alt={selectedUser.name}
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedUser.name}
                    </h2>
                    <p className="text-gray-600">{selectedUser.email}</p>
                    <div className="flex space-x-2 mt-2">
                      {selectedUser.status && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {selectedUser.status}
                        </span>
                      )}
                      {selectedUser.role && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          {selectedUser.role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {selectedUser.bio && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Bio
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedUser.bio}
                    </p>
                  </div>
                )}

                {/* Contact Information */}
                {selectedUser.contactInfo && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.contactInfo.address && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                          </label>
                          <p className="text-gray-600">
                            {selectedUser.contactInfo.address}
                          </p>
                        </div>
                      )}
                      {selectedUser.contactInfo.phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <p className="text-gray-600">
                            {selectedUser.contactInfo.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {selectedUser.socialLinks &&
                  Object.keys(selectedUser.socialLinks).length > 0 && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-3">
                        Social Links
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(selectedUser.socialLinks).map(
                          ([platform, link]) =>
                            link && (
                              <div key={platform}>
                                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                                  {platform}
                                </label>
                                <p className="text-blue-600 hover:text-blue-800 break-all">
                                  <a
                                    href={
                                      link.startsWith("http")
                                        ? link
                                        : `https://${platform}.com/${link}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {link}
                                  </a>
                                </p>
                              </div>
                            )
                        )}
                      </div>
                    </div>
                  )}

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(false)}
                    className="px-4 py-2 text-sm border rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const base = routerLocation.pathname.startsWith(
                        "/onboarding"
                      )
                        ? "/onboarding"
                        : "/artist";
                      navigate(`${base}/users/${selectedUser.id}/artworks`);
                    }}
                    className="px-4 py-2 text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    View Artworks
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowUsers;
