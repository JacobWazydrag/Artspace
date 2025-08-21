import { Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/storeHook";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { logout } from "../features/authSlice";
import { clearProfile } from "../features/profileSlice";
import logo from "../assets/artspaceLogo.jpg";
import {
  PaintBrushIcon,
  ArrowRightOnRectangleIcon,
  PlusCircleIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { selectHasUnreadMessages } from "../features/chatSlice";
import { useMemo } from "react";

const ArtistSidebar = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);
  const { data: artshows } = useAppSelector((state) => state.artshows);
  const hasUnread = useAppSelector((state) =>
    selectHasUnreadMessages(state, user?.id || "")
  );

  const handleLogout = async () => {
    await signOut(auth);
    dispatch(logout());
    dispatch(clearProfile());
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const accessibleShows = useMemo(() => {
    const ids = (user?.showAccess as string[]) || [];
    return artshows.filter((s) => ids.includes(s.id || ""));
  }, [artshows, user?.showAccess]);

  return (
    <div className="bg-gray-800 text-white w-64 h-screen overflow-y-auto p-4 flex flex-col">
      <div className="mb-8 flex items-center gap-3">
        <img
          src={logo}
          alt="ArtSpace Chicago Logo"
          className="h-16 w-16 rounded-full object-cover border-2 border-white shadow"
        />
        <h1 className="text-2xl font-bold">ArtSpace</h1>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <Link
              to="/artist/my-artwork"
              className={`block px-4 py-2 rounded ${
                isActive("/artist/my-artwork")
                  ? "bg-gray-900"
                  : "hover:bg-gray-700"
              }`}
            >
              <span className="flex items-center gap-3">
                <PaintBrushIcon className="w-5 h-5" />
                My Artwork
              </span>
            </Link>
          </li>
          <li>
            <Link
              to="/artist/onboard-art"
              className={`block px-4 py-2 rounded ${
                isActive("/artist/onboard-art")
                  ? "bg-gray-900"
                  : "hover:bg-gray-700"
              }`}
            >
              <span className="flex items-center gap-3">
                <PlusCircleIcon className="w-5 h-5" />
                Onboard Art
              </span>
            </Link>
          </li>
          <li>
            <Link
              to="/artist/chat"
              className={`block px-4 py-2 rounded ${
                isActive("/artist/chat") ? "bg-gray-900" : "hover:bg-gray-700"
              }`}
            >
              <span className="flex items-center gap-3">
                <ChatBubbleLeftRightIcon
                  className={`w-5 h-5 ${
                    hasUnread ? "text-red-500" : "text-white"
                  }`}
                />
                Chat
              </span>
            </Link>
          </li>

          {/* Accessible Shows (User Access) */}
          {accessibleShows.length > 0 && (
            <li className="mt-4">
              <div className="text-xs uppercase tracking-wide text-gray-400 px-4 mb-2">
                Collaborate with Artspace
              </div>
              <ul className="space-y-2">
                {accessibleShows.map((show) => (
                  <li key={show.id}>
                    <Link
                      to={`/artist/show/${show.id}/users`}
                      className={`block px-4 py-2 rounded ${
                        isActive(`/artist/show/${show.id}/users`)
                          ? "bg-gray-900"
                          : "hover:bg-gray-700"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <UsersIcon className="w-5 h-5" />
                        {show.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          )}
        </ul>
      </nav>

      {/* Fixed bottom section */}
      <div className="mt-auto pt-4 border-t border-gray-700">
        <ul className="space-y-2">
          <li>
            <Link
              to="/artist/settings"
              className={`block px-4 py-2 rounded ${
                isActive("/artist/settings")
                  ? "bg-gray-900"
                  : "hover:bg-gray-700"
              }`}
            >
              <span className="flex items-center gap-3">
                <Cog6ToothIcon className="w-5 h-5" />
                Settings
              </span>
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 rounded hover:bg-gray-700"
              type="button"
            >
              <span className="flex items-center gap-3">
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Logout
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ArtistSidebar;
