import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { signOut } from "firebase/auth";
import { logout } from "../../features/authSlice";
import { clearProfile } from "../../features/profileSlice";
import { auth } from "../../firebase";

const PreShowWaiting = () => {
  const navigate = useNavigate();
  const { data: profile } = useAppSelector((state) => state.profile);
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await signOut(auth);
    dispatch(logout());
    dispatch(clearProfile());
  };

  useEffect(() => {
    // Redirect if user is not an employee with preShow status
    if (profile?.role !== "employee" || profile?.status !== "preShow") {
      navigate("/artworks");
    }
  }, [profile, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Animated heart icon */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-purple-100 rounded-full animate-pulse"></div>
          <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-purple-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900">
          Thank You, {profile?.name}! 🎉
        </h1>

        <div className="space-y-4 text-lg text-gray-600">
          <p>
            We couldn't have done it without you! Your incredible help and
            dedication during our recent art show made it a tremendous success.
          </p>
          <p>
            Your hard work behind the scenes - from assisting with sales,
            helping visitors, and ensuring everything ran smoothly - was
            absolutely invaluable to our community.
          </p>
          <p>
            Your employee portal will be reactivated once our next show goes
            live, and you'll be able to continue helping with artwork sales and
            management.
          </p>
        </div>

        {/* Status indicator */}
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-50 text-green-700">
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Awaiting Next Show
        </div>

        {/* Appreciation section */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            From the ArtSpace Team
          </h2>
          <p className="text-gray-600 mb-4">
            We are incredibly grateful for your commitment to supporting our
            artists and making each show a memorable experience for everyone
            involved.
          </p>
          <p className="text-gray-600 mb-6">
            We'll notify you as soon as the next show is scheduled and your
            portal access is restored. Until then, enjoy some well-deserved
            rest!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:artspacechicago@gmail.com"
              className="inline-flex items-center justify-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
            >
              Contact Us
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreShowWaiting;
