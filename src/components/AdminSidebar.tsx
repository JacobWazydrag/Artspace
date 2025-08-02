import { Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/storeHook";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { logout } from "../features/authSlice";
import { clearProfile } from "../features/profileSlice";
import logo from "../assets/artspaceLogo.jpg";
import {
  HomeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  Squares2X2Icon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  PaintBrushIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon,
  ShoppingCartIcon,
  TableCellsIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { selectHasUnreadMessages } from "../features/chatSlice";

const Sidebar = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);
  const { data: profile } = useAppSelector((state) => state.profile);
  const hasUnread = useAppSelector((state) =>
    selectHasUnreadMessages(state, user?.id || "")
  );

  const isEmployee = profile?.role === "employee";
  const isWebMaster = profile?.status === "webmaster";

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
          {/* Only show these items for admin users */}
          {!isEmployee && (
            <>
              {/* <li>
                <Link
                  to="/dashboard"
                  className={`block px-4 py-2 rounded ${
                    isActive("/dashboard") ? "bg-gray-900" : "hover:bg-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <HomeIcon className="w-5 h-5" />
                    Dashboard
                  </span>
                </Link>
              </li> */}
              {/* <li>
                <Link
                  to="/locations"
                  className={`block px-4 py-2 rounded ${
                    isActive("/locations") ? "bg-gray-900" : "hover:bg-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <MapPinIcon className="w-5 h-5" />
                    Locations
                  </span>
                </Link>
              </li> */}
              <li>
                <Link
                  to="/artshows"
                  className={`block px-4 py-2 rounded ${
                    isActive("/artshows") ? "bg-gray-900" : "hover:bg-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <CalendarDaysIcon className="w-5 h-5" />
                    Art Shows
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/users"
                  className={`block px-4 py-2 rounded ${
                    isActive("/users") ? "bg-gray-900" : "hover:bg-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <UsersIcon className="w-5 h-5" />
                    Artists
                  </span>
                </Link>
              </li>
            </>
          )}

          {/* Artworks - available to both admin and employee */}
          <li>
            <Link
              to="/artworks"
              className={`block px-4 py-2 rounded ${
                isActive("/artworks") ? "bg-gray-900" : "hover:bg-gray-700"
              }`}
            >
              <span className="flex items-center gap-3">
                <PaintBrushIcon className="w-5 h-5" />
                Artworks
              </span>
            </Link>
          </li>

          {/* Purchases - only for admin users */}
          {!isEmployee && (
            <li>
              <Link
                to="/purchases"
                className={`block px-4 py-2 rounded ${
                  isActive("/purchases") ? "bg-gray-900" : "hover:bg-gray-700"
                }`}
              >
                <span className="flex items-center gap-3">
                  <ShoppingCartIcon className="w-5 h-5" />
                  Purchases
                </span>
              </Link>
            </li>
          )}

          {/* Only show these items for admin users */}
          {!isEmployee && (
            <>
              <li>
                <Link
                  to="/curate"
                  className={`block px-4 py-2 rounded ${
                    isActive("/curate") ? "bg-gray-900" : "hover:bg-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <AdjustmentsHorizontalIcon className="w-5 h-5" />
                    Curate
                  </span>
                </Link>
              </li>
              {/* Table View - only for webmaster users */}
              {isWebMaster && (
                <li>
                  <Link
                    to="/table-view"
                    className={`block px-4 py-2 rounded ${
                      isActive("/table-view")
                        ? "bg-gray-900"
                        : "hover:bg-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <TableCellsIcon className="w-5 h-5" />
                      Table View
                    </span>
                  </Link>
                </li>
              )}
              <li>
                <Link
                  to="/chat"
                  className={`block px-4 py-2 rounded ${
                    isActive("/chat") ? "bg-gray-900" : "hover:bg-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-3 relative">
                    <ChatBubbleLeftRightIcon
                      className={`w-5 h-5 ${
                        hasUnread ? "text-red-500" : "text-white"
                      }`}
                    />
                    Chat
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/invitation"
                  className={`block px-4 py-2 rounded ${
                    isActive("/invitation")
                      ? "bg-gray-900"
                      : "hover:bg-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <EnvelopeIcon className="w-5 h-5" />
                    Invite New Artist
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/send-mail"
                  className={`block px-4 py-2 rounded ${
                    isActive("/send-mail") ? "bg-gray-900" : "hover:bg-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <PaperAirplaneIcon className="w-5 h-5" />
                    Send Mail
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/mediums"
                  className={`block px-4 py-2 rounded ${
                    isActive("/mediums") ? "bg-gray-900" : "hover:bg-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Squares2X2Icon className="w-5 h-5" />
                    Mediums
                  </span>
                </Link>
              </li>
            </>
          )}
          {/* Product Management and Test Cloud Function only for specific user and not employees */}
          {user?.email === "jgw.jakegeorge@gmail.com" && !isEmployee && (
            <>
              <li>
                <Link
                  to="/product-management"
                  className={`block px-4 py-2 rounded ${
                    isActive("/product-management")
                      ? "bg-gray-900"
                      : "hover:bg-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <ShoppingCartIcon className="w-5 h-5" />
                    Product Management
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/test-cloud-function"
                  className={`block px-4 py-2 rounded ${
                    isActive("/test-cloud-function")
                      ? "bg-gray-900"
                      : "hover:bg-gray-700"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Cog6ToothIcon className="w-5 h-5" />
                    Test Cloud Function
                  </span>
                </Link>
              </li>
            </>
          )}

          {/* External Links - only for admin users */}
          {!isEmployee && (
            <>
              <li>
                <a
                  href={`${process.env.REACT_APP_URL}/artshow`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 rounded hover:bg-gray-700"
                >
                  <span className="flex items-center gap-3">
                    <UsersIcon className="w-5 h-5" />
                    Artists Show
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`${process.env.REACT_APP_URL}/artshow-artworks`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 rounded hover:bg-gray-700"
                >
                  <span className="flex items-center gap-3">
                    <PaintBrushIcon className="w-5 h-5" />
                    Artworks Show
                  </span>
                </a>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Fixed bottom section */}
      <div className="mt-auto pt-4 border-t border-gray-700">
        <ul className="space-y-2">
          <li>
            <Link
              to="/settings"
              className={`block px-4 py-2 rounded ${
                isActive("/settings") ? "bg-gray-900" : "hover:bg-gray-700"
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

export default Sidebar;
