import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks/storeHook";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import {
  fetchUserProfile,
  completeOnboarding,
  setProfileData,
} from "../../../features/profileSlice";
import { formClasses } from "../../../classes/tailwindClasses";
import { toast } from "react-hot-toast";

interface SocialLinksProps {
  onComplete: () => void;
  isComplete: boolean;
}

type SocialPlatform = "facebook" | "instagram" | "linkedin" | "twitter";

interface SocialLinks {
  [key: string]: string;
}

const SocialLinks = ({ onComplete, isComplete }: SocialLinksProps) => {
  const { label, input, textarea, button } = formClasses;
  const dispatch = useAppDispatch();
  const { data: profile } = useAppSelector((state) => state.profile);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(
    profile?.socialLinks || {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when profile changes
  useEffect(() => {
    if (profile?.socialLinks) {
      setSocialLinks(profile.socialLinks);
    }
  }, [profile]);

  const handleChange = (platform: SocialPlatform, value: string) => {
    setSocialLinks((prev) => ({
      ...prev,
      [platform]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    // Filter out empty links
    const validLinks = Object.entries(socialLinks).reduce(
      (acc, [platform, url]) => {
        if (url.trim()) {
          acc[platform] = url.trim();
        }
        return acc;
      },
      {} as SocialLinks
    );

    // Don't submit if nothing has changed
    if (JSON.stringify(validLinks) === JSON.stringify(profile.socialLinks)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", profile.id), {
        socialLinks: validLinks,
        updatedAt: new Date().toISOString(),
      });
      // Optimistically update the profile state
      dispatch(setProfileData({ ...profile, socialLinks: validLinks }));
      // Optionally fetch the latest profile from the server
      await dispatch(fetchUserProfile(profile.id)).unwrap();
      toast.success("Social links updated successfully");
    } catch (error) {
      console.error("Error updating social links:", error);
      setError("An error occurred while updating social links.");
      toast.error("Failed to update social links");
    } finally {
      setIsSubmitting(false);
    }
  };

  const platforms: { id: SocialPlatform; label: string }[] = [
    { id: "facebook", label: "Facebook" },
    { id: "instagram", label: "Instagram" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "twitter", label: "Twitter" },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Social Links</h2>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {platforms.map((platform) => (
          <div key={platform.id} className="space-y-4 p-4 border rounded-lg">
            <div>
              <label className={label}>{platform.label}</label>
              <input
                type="url"
                value={socialLinks[platform.id] || ""}
                onChange={(e) => handleChange(platform.id, e.target.value)}
                className={input}
                placeholder={`Enter your ${platform.label} URL`}
                disabled={isSubmitting}
              />
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className={button}>
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SocialLinks;
