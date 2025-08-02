import { Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/storeHook";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { logout } from "../features/authSlice";
import { clearProfile } from "../features/profileSlice";
import logo from "../assets/artspaceLogo.jpg";
import {
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { selectHasUnreadMessages } from "../features/chatSlice";

const OnboardingSidebar = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);
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

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen p-4 flex flex-col">
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
              to="/onboarding"
              className={`block px-4 py-2 rounded ${
                isActive("/onboarding") ? "bg-gray-900" : "hover:bg-gray-700"
              }`}
            >
              <span className="flex items-center gap-3">
                <ClipboardDocumentListIcon className="w-5 h-5" />
                Onboarding
              </span>
            </Link>
          </li>
          <li>
            <Link
              to="/onboarding/chat"
              className={`block px-4 py-2 rounded ${
                isActive("/onboarding/chat")
                  ? "bg-gray-900"
                  : "hover:bg-gray-700"
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
        </ul>
      </nav>

      {/* Fixed bottom section */}
      <div className="mt-auto pt-4 border-t border-gray-700">
        <ul className="space-y-2">
          <li>
            <Link
              to="/onboarding/settings"
              className={`block px-4 py-2 rounded ${
                isActive("/onboarding/settings")
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

export default OnboardingSidebar;
