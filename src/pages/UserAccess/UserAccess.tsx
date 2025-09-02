import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { fetchAllUsers, updateUser, User } from "../../features/usersSlice";
import { fetchArtshows } from "../../features/artshowsSlice";
import { sendMail } from "../../features/mailSlice";
import { mergeEmailConfig } from "../../utils/emailConfig";

const UserAccess = () => {
  const dispatch = useAppDispatch();
  const { data: users, loading: usersLoading } = useAppSelector(
    (state) => state.users
  );
  const { data: artshows, loading: showsLoading } = useAppSelector(
    (state) => state.artshows
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedShowIds, setSelectedShowIds] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchAllUsers());
    dispatch(fetchArtshows());
  }, [dispatch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [users]);

  const openModal = (user: User) => {
    setSelectedUser(user);
    setSelectedShowIds(
      Array.isArray(user.showAccess) ? (user.showAccess as string[]) : []
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setSelectedShowIds([]);
    setIsDropdownOpen(false);
  };

  const toggleShowId = (id: string) => {
    setSelectedShowIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!selectedUser?.id) return;
    const previousAccess = Array.isArray(selectedUser.showAccess)
      ? (selectedUser.showAccess as string[])
      : [];
    const newlyGranted = selectedShowIds.filter(
      (id) => !previousAccess.includes(id)
    );

    await dispatch(
      updateUser({
        userId: selectedUser.id,
        userData: { showAccess: selectedShowIds },
      })
    ).unwrap();

    if (newlyGranted.length > 0) {
      const grantedShowNames = newlyGranted
        .map((id) => artshows.find((s) => s.id === id)?.name)
        .filter(Boolean) as string[];

      for (const showName of grantedShowNames) {
        const mailData = mergeEmailConfig({
          replyTo: "artspacechicago@gmail.com",
          toUids: [selectedUser.id],
          message: {
            subject: `You've been added as a collaborator for ${showName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
                <h2 style="color: #333; margin: 0 0 16px 0;">Access to Collaborate</h2>
                <p style="color: #555; line-height: 1.6;">You've been added as a collaborator for <strong>${showName}</strong>.</p>
                <p style="color: #555; line-height: 1.6;">You should now see a link in your sidebar to view the artists and their artworks for this show.</p>
              </div>
            `,
          },
        });
        try {
          await dispatch(sendMail(mailData)).unwrap();
        } catch (e) {
          // Do not block on email failure
          // eslint-disable-next-line no-console
          console.error("Failed to send collaborator email:", e);
        }
      }
    }
    closeModal();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Access</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {usersLoading || showsLoading
              ? "Loading..."
              : `${sortedUsers.length} users`}
          </div>
        </div>
        <ul className="divide-y">
          {sortedUsers.map((user) => (
            <li
              key={user.id}
              className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              onClick={() => openModal(user)}
            >
              <div className="flex items-center gap-3">
                <img
                  className="h-10 w-10 rounded-full object-cover"
                  src={
                    user.photoUrl ||
                    "https://ui-avatars.com/api/?name=" +
                      encodeURIComponent(user.name || user.email)
                  }
                  alt={user.name}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {user.name || "Unnamed"}
                  </div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isModalOpen && selectedUser && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <img
                className="h-12 w-12 rounded-full object-cover"
                src={
                  selectedUser.photoUrl ||
                  "https://ui-avatars.com/api/?name=" +
                    encodeURIComponent(selectedUser.name || selectedUser.email)
                }
                alt={selectedUser.name}
              />
              <div>
                <div className="text-base font-semibold text-gray-900">
                  {selectedUser.name}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedUser.email}
                </div>
              </div>
            </div>

            <div className="mb-6" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Show Access
              </label>
              <button
                type="button"
                className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => setIsDropdownOpen((v) => !v)}
              >
                {selectedShowIds.length > 0
                  ? `${selectedShowIds.length} selected`
                  : "Select art shows"}
                <svg
                  className="w-3 h-3 ms-2.5"
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
              {isDropdownOpen && (
                <div className="relative mt-2">
                  <div className="absolute z-50 w-full bg-white rounded-lg shadow border max-h-64 overflow-y-auto">
                    <ul className="py-2 text-sm text-gray-700">
                      {artshows.map((show) => (
                        <li key={show.id}>
                          <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              checked={selectedShowIds.includes(show.id!)}
                              onChange={() => {
                                toggleShowId(show.id!);
                                setIsDropdownOpen(false);
                              }}
                            />
                            <span className="ml-2">{show.name}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {selectedShowIds.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">
                    Selected shows
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedShowIds.map((id) => {
                      const show = artshows.find((s) => s.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {show?.name || id}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm border rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccess;
