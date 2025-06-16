import { Link, useLocation } from "react-router-dom";
import { useAppDispatch } from "../hooks/storeHook";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { logout } from "../features/authSlice";
import { clearProfile } from "../features/profileSlice";
import logo from "../assets/artspaceLogo.jpg";
import lightLogo from "../assets/light.png";
import darkLogo from "../assets/dark.png";
import {
  HomeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  Squares2X2Icon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  PaintBrushIcon,
} from "@heroicons/react/24/outline";

const Sidebar = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await signOut(auth);
    dispatch(logout());
    dispatch(clearProfile());
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen p-4">
      <div className="mb-8 flex items-center gap-3">
        <img
          src={logo}
          alt="ArtSpace Chicago Logo"
          className="h-16 w-16 rounded-full object-cover border-2 border-white shadow"
        />
        <h1 className="text-2xl font-bold">ArtSpace</h1>
      </div>
      <nav>
        <ul className="space-y-2">
          <li>
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
          </li>
          <li>
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
          </li>
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
          <li>
            <Link
              to="/users"
              className={`block px-4 py-2 rounded ${
                isActive("/users") ? "bg-gray-900" : "hover:bg-gray-700"
              }`}
            >
              <span className="flex items-center gap-3">
                <UsersIcon className="w-5 h-5" />
                Users
              </span>
            </Link>
          </li>
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
      </nav>
    </div>
  );
};

export default Sidebar;
