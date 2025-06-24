import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { fetchUserProfile, setProfileData } from "../../features/profileSlice";
import { toast } from "react-hot-toast";
import ContentWrapper from "../../components/ContentWrapper";

const Settings = () => {
  const dispatch = useAppDispatch();
  const { data: profile } = useAppSelector((state) => state.profile);
  const { user } = useAppSelector((state) => state.auth);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.notificationPreferences?.email?.active !== undefined) {
      setEmailNotifications(profile.notificationPreferences.email.active);
    }
  }, [profile]);

  const handleEmailNotificationChange = async (enabled: boolean) => {
    if (!user?.id || !profile) return;

    setIsSubmitting(true);
    try {
      const updateData = {
        notificationPreferences: {
          email: {
            active: enabled,
            frequency:
              profile.notificationPreferences?.email?.frequency || "daily",
          },
        },
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "users", user.id), updateData);

      // Update local state
      const updatedProfile = {
        ...profile,
        notificationPreferences: {
          email: {
            active: enabled,
            frequency:
              profile.notificationPreferences?.email?.frequency || "daily",
          },
        },
      };
      dispatch(setProfileData(updatedProfile));

      // Fetch latest profile
      await dispatch(fetchUserProfile(user.id)).unwrap();

      setEmailNotifications(enabled);
      toast.success("Notification preferences updated successfully");
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      toast.error("Failed to update notification preferences");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ContentWrapper>
        <div className="max-w-4xl mx-auto py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Notification Preferences
              </h2>
              <p className="text-gray-600 mt-1">
                Control how you receive notifications from ArtSpace Chicago
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    Email Notifications
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Receive email notifications for important updates and
                    messages from admins
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>• New messages</p>
                    <p>• Show and event notifications</p>
                    <p>• Important system updates and announcements</p>
                  </div>
                </div>
                <div className="ml-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) =>
                        handleEmailNotificationChange(e.target.checked)
                      }
                      disabled={isSubmitting}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {emailNotifications ? "Enabled" : "Disabled"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Current Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Current Status
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Email notifications are currently{" "}
                        <span className="font-semibold">
                          {emailNotifications ? "enabled" : "disabled"}
                        </span>
                        .
                      </p>
                      {emailNotifications && (
                        <p className="mt-1">
                          You will receive emails when someone send you messages
                          through the chat system.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Status */}
              {isSubmitting && (
                <div className="flex items-center justify-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                    <span className="text-sm text-yellow-800">
                      Updating preferences...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Settings Section */}
          <div className="mt-8 bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Account Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <p className="text-gray-900 font-medium">
                    {profile?.name || "Not set"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <p className="text-gray-900 font-medium">
                    {profile?.email || "Not set"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <p className="text-gray-900 font-medium capitalize">
                    {profile?.role || "Not set"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Status
                  </label>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      profile?.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : profile?.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : profile?.status === "shown" ||
                          profile?.status === "showing"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {profile?.status || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContentWrapper>
    </div>
  );
};

export default Settings;
