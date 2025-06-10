import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { signOut } from "firebase/auth";
import { logout } from "../../features/authSlice";
import { clearProfile } from "../../features/profileSlice";
import { auth } from "../../firebase";

const WaitingApproval = () => {
  const navigate = useNavigate();
  const { data: profile } = useAppSelector((state) => state.profile);
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await signOut(auth);
    dispatch(logout());
    dispatch(clearProfile());
  };

  useEffect(() => {
    // Redirect if user is not in awaiting approval state
    if (profile?.role !== "on-boarding-awaiting-approval") {
      navigate("/dashboard");
    }
  }, [profile, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Animated checkmark icon */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse"></div>
          <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900">
          Thank You for Your Application!
        </h1>

        <div className="space-y-4 text-lg text-gray-600">
          <p>
            We're excited to have you join the ArtSpace community! Your
            application has been successfully submitted and is now under review.
          </p>
          <p>
            Our team will carefully review your profile to ensure it aligns with
            our community standards and guidelines. This process typically takes
            1-2 business days.
          </p>
          <p>
            We'll notify you via email once your application has been reviewed.
            In the meantime, feel free to explore our public galleries and
            exhibitions.
          </p>
        </div>

        {/* Status indicator */}
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700">
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
          Application Under Review
        </div>

        {/* Help section */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Need Help?
          </h2>
          <p className="text-gray-600">
            If you have any questions about your application or need assistance,
            please don't hesitate to contact our support team at{" "}
            <a
              href="mailto:support@artspace.com"
              className="text-blue-600 hover:text-blue-700"
            >
              support@artspace.com
            </a>
          </p>
          {/* logout button */}
          <button
            onClick={handleLogout}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default WaitingApproval;
