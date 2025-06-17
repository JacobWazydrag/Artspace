import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks/storeHook";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import {
  fetchUserProfile,
  setProfileData,
} from "../../../features/profileSlice";
import { formClasses } from "../../../classes/tailwindClasses";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { toast } from "react-hot-toast";
import { fetchArtshows } from "../../../features/artshowsSlice";

interface BasicInfoProps {
  onComplete: () => void;
  isComplete: boolean;
}

interface BasicInfo {
  name: string;
  email: string;
  bio: string;
  photoUrl?: string;
}

const BasicInfo = ({ onComplete, isComplete }: BasicInfoProps) => {
  const { label, input, textarea, button } = formClasses;
  const dispatch = useAppDispatch();
  const { data: profile } = useAppSelector((state) => state.profile);
  const { data: artshows } = useAppSelector((state) => state.artshows);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    name: "",
    email: "",
    bio: "",
    photoUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [interestInShow, setInterestInShow] = useState<string>(
    profile?.interestInShow || ""
  );
  const [shownAtArtspace, setShownAtArtspace] = useState<boolean | null>(
    profile?.shownAtArtspace ?? null
  );
  const storage = getStorage();

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      setBasicInfo({
        name: profile.name || "",
        email: profile.email || "",
        bio: profile.bio || "",
        photoUrl: profile.photoUrl || "",
      });
      setPreviewUrl(profile.photoUrl || null);
      setInterestInShow(profile.interestInShow || "");
      setShownAtArtspace(profile.shownAtArtspace ?? null);
    }
  }, [profile]);

  useEffect(() => {
    dispatch(fetchArtshows());
  }, [dispatch]);

  const handleChange = (field: keyof BasicInfo, value: string) => {
    setBasicInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
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
      setBasicInfo((prev) => ({ ...prev, photoUrl: "" }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    // Don't submit if nothing has changed
    if (
      basicInfo.name === profile.name &&
      basicInfo.email === profile.email &&
      basicInfo.bio === profile.bio &&
      !selectedFile &&
      interestInShow === (profile.interestInShow || "") &&
      shownAtArtspace === profile.shownAtArtspace
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl = basicInfo.photoUrl;

      // If there's a new file selected, upload it
      if (selectedFile) {
        // If there's an existing photo, delete it first
        if (profile.photoUrl) {
          const oldPhotoRef = ref(storage, profile.photoUrl);
          await deleteObject(oldPhotoRef);
        }

        // Upload new photo
        const storageRef = ref(
          storage,
          `profile_photos/${profile.id}/${Date.now()}_${selectedFile.name}`
        );
        const snapshot = await uploadBytes(storageRef, selectedFile);
        photoUrl = await getDownloadURL(snapshot.ref);
      }

      const userRef = doc(db, "users", profile.id);
      await updateDoc(userRef, {
        name: basicInfo.name,
        email: basicInfo.email,
        bio: basicInfo.bio,
        photoUrl,
        interestInShow,
        shownAtArtspace,
        updatedAt: new Date().toISOString(),
      });

      // Optimistically update the profile state
      dispatch(
        setProfileData({
          ...profile,
          name: basicInfo.name,
          email: basicInfo.email,
          bio: basicInfo.bio,
          photoUrl,
          interestInShow,
          shownAtArtspace,
        })
      );

      // Optionally fetch the latest profile from the server
      await dispatch(fetchUserProfile(profile.id)).unwrap();
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating basic info:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Basic Information</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Photo Section */}
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
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div>
          <label className={label}>
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={basicInfo.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={input}
            placeholder="Enter your full name"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className={label}>
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={basicInfo.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className={input}
            placeholder="Enter your email"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className={label}>
            Bio <span className="text-red-500">*</span>
          </label>
          <textarea
            value={basicInfo.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            className={textarea}
            rows={4}
            placeholder="Tell us about yourself"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className={label}>
            Which show are you interested in?{" "}
            <span className="text-red-500">*</span>
          </label>
          <select
            value={interestInShow}
            onChange={(e) => setInterestInShow(e.target.value)}
            className={input}
            required
            disabled={isSubmitting}
          >
            <option value="">Select a show</option>
            {artshows &&
              artshows.length > 0 &&
              artshows.map((show) => (
                <option key={show.id} value={show.name}>
                  {show.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className={label}>
            Have you shown at ArtSpace before?{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="mt-2 space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="shownAtArtspace"
                value="yes"
                checked={shownAtArtspace === true}
                onChange={() => setShownAtArtspace(true)}
                required
                disabled={isSubmitting}
                className="form-radio h-4 w-4 text-indigo-600"
              />
              <span className="ml-2">Yes</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="shownAtArtspace"
                value="no"
                checked={shownAtArtspace === false}
                onChange={() => setShownAtArtspace(false)}
                required
                disabled={isSubmitting}
                className="form-radio h-4 w-4 text-indigo-600"
              />
              <span className="ml-2">No</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className={button}>
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BasicInfo;
