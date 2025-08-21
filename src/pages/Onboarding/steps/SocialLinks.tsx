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

interface PaymentInformation {
  venmo: string;
  zelle: string;
}

interface SocialLinks {
  instagram: string;
}

const SocialLinks = ({ onComplete, isComplete }: SocialLinksProps) => {
  const { label, input, textarea, button } = formClasses;
  const dispatch = useAppDispatch();
  const { data: profile } = useAppSelector((state) => state.profile);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: profile?.socialLinks?.instagram || "",
  });
  const [paymentInfo, setPaymentInfo] = useState<PaymentInformation>({
    venmo: profile?.paymentInformation?.venmo || "",
    zelle: profile?.paymentInformation?.zelle || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Update form when profile changes
  useEffect(() => {
    if (profile?.socialLinks) {
      setSocialLinks({ instagram: profile.socialLinks.instagram || "" });
    }
    if (profile?.paymentInformation) {
      setPaymentInfo({
        venmo: profile.paymentInformation.venmo || "",
        zelle: profile.paymentInformation.zelle || "",
      });
    }
  }, [profile]);

  const handleSocialChange = (value: string) => {
    setSocialLinks({ instagram: value });
  };

  const handlePaymentChange = (
    field: keyof PaymentInformation,
    value: string
  ) => {
    setPaymentInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear payment error when either field is filled
    if (
      value.trim() ||
      (field === "venmo" ? paymentInfo.zelle : paymentInfo.venmo).trim()
    ) {
      setPaymentError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    // Validate payment information
    if (!paymentInfo.venmo.trim() && !paymentInfo.zelle.trim()) {
      setPaymentError("Please provide at least one payment method");
      return;
    }

    setIsSubmitting(true);
    try {
      const updates = {
        socialLinks: { instagram: socialLinks.instagram.trim() },
        paymentInformation: {
          venmo: paymentInfo.venmo.trim(),
          zelle: paymentInfo.zelle.trim(),
        },
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "users", profile.id), updates);

      // Optimistically update the profile state
      dispatch(
        setProfileData({
          ...profile,
          socialLinks: updates.socialLinks,
          paymentInformation: updates.paymentInformation,
        })
      );

      // Optionally fetch the latest profile from the server
      await dispatch(fetchUserProfile(profile.id)).unwrap();
      toast.success("Information updated successfully");
    } catch (error) {
      console.error("Error updating information:", error);
      setError("An error occurred while updating information.");
      toast.error("Failed to update information");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Social & Payment Information</h2>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-small text-lg">
            Payment Information <span className="text-red-500">*</span>
          </h3>
          <div>
            <label className={label}>Venmo Username</label>
            <input
              type="text"
              value={paymentInfo.venmo}
              onChange={(e) => handlePaymentChange("venmo", e.target.value)}
              className={input}
              placeholder="Enter your Venmo username"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className={label}>Zelle Information</label>
            <input
              type="text"
              value={paymentInfo.zelle}
              onChange={(e) => handlePaymentChange("zelle", e.target.value)}
              className={input}
              placeholder="Enter your Zelle information"
              disabled={isSubmitting}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Note: At least one payment method (Venmo or Zelle) is required.
          </p>
          {paymentError && (
            <p className="text-sm text-red-600 mt-1">{paymentError}</p>
          )}
        </div>
        <div className="space-y-4 p-4 border rounded-lg">
          <div>
            <label className={label}>
              Instagram Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={socialLinks.instagram}
              onChange={(e) => handleSocialChange(e.target.value)}
              className={input}
              placeholder="Instagram username"
              disabled={isSubmitting}
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Note: Your Instagram account must be set to "taggable" for this to
              work properly.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Format MUST BE what comes after the url in your instagram profile.
              <br />
              Example: www.instagram.com/wazman_jake/ would be{" "}
              <span className="font-bold">wazman_jake</span>
            </p>
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

export default SocialLinks;
