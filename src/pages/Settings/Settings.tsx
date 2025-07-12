import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { fetchUserProfile, setProfileData } from "../../features/profileSlice";
import { toast } from "react-hot-toast";
import ContentWrapper from "../../components/ContentWrapper";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { compressImageTo250KB } from "../../utils/imageCompression";

const Settings = () => {
  const dispatch = useAppDispatch();
  const { data: profile } = useAppSelector((state) => state.profile);
  const { user } = useAppSelector((state) => state.auth);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const storage = getStorage();

  useEffect(() => {
    if (profile?.notificationPreferences?.email?.active !== undefined) {
      setEmailNotifications(profile.notificationPreferences.email.active);
    }
    // Set initial preview URL from profile
    if (profile?.photoUrl) {
      setPreviewUrl(profile.photoUrl);
    }
  }, [profile]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Show loading state
        setIsSubmitting(true);
        toast.loading("Compressing image...", { id: "compression" });

        // Compress the image to 250KB
        const compressedFile = await compressImageTo250KB(file);

        setSelectedFile(compressedFile);
        setPreviewUrl(URL.createObjectURL(compressedFile));

        toast.success("Image compressed successfully!", { id: "compression" });
      } catch (error) {
        console.error("Error compressing image:", error);
        toast.error("Failed to compress image. Please try again.", {
          id: "compression",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile?.id) return;

    try {
      setIsSubmitting(true);
      // If there's an existing photo, delete it from storage
      if (profile.photoUrl) {
        const photoRef = ref(storage, profile.photoUrl);
        await deleteObject(photoRef);
      }

      // Update the user document
      const userRef = doc(db, "users", profile.id);
      await updateDoc(userRef, {
        photoUrl: null,
        updatedAt: new Date().toISOString(),
      });

      // Update local state
      setPreviewUrl(null);
      setSelectedFile(null);

      // Update profile state
      dispatch(
        setProfileData({
          ...profile,
          photoUrl: null,
        })
      );

      toast.success("Profile photo removed successfully");
    } catch (error) {
      console.error("Error removing photo:", error);
      toast.error("Failed to remove profile photo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePhoto = async () => {
    if (!profile?.id || !selectedFile) return;

    setIsSubmitting(true);
    try {
      // If there's an existing photo, delete it first
      if (profile.photoUrl) {
        const oldPhotoRef = ref(storage, profile.photoUrl);
        await deleteObject(oldPhotoRef);
      }

      // Use the authenticated user's UID for the folder
      const userId = user?.id || profile.id;
      const storageRef = ref(
        storage,
        `profile_photos/${userId}/${Date.now()}_${selectedFile.name}`
      );
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const photoUrl = await getDownloadURL(snapshot.ref);

      const userRef = doc(db, "users", profile.id);
      await updateDoc(userRef, {
        photoUrl,
        updatedAt: new Date().toISOString(),
      });

      // Update profile state
      dispatch(
        setProfileData({
          ...profile,
          photoUrl,
        })
      );

      // Fetch the latest profile from the server
      await dispatch(fetchUserProfile(profile.id)).unwrap();

      // Clear the selected file
      setSelectedFile(null);

      toast.success("Profile photo updated successfully");
    } catch (error) {
      console.error("Error updating photo:", error);
      toast.error("Failed to update profile photo");
    } finally {
      setIsSubmitting(false);
    }
  };

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

          {/* Profile Photo Section */}
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Profile Photo
              </h2>
              <p className="text-gray-600 mt-1">Update your profile picture</p>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        className="w-16 h-16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    {previewUrl ? "Change Photo" : "Add Photo"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isSubmitting}
                    />
                  </label>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isSubmitting}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={handleSavePhoto}
                      disabled={isSubmitting}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSubmitting ? "Saving..." : "Save Photo"}
                    </button>
                  )}
                </div>
              </div>
            </div>
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
