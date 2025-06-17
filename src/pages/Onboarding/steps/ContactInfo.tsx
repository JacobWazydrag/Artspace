import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks/storeHook";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import {
  fetchUserProfile,
  setProfileData,
} from "../../../features/profileSlice";
import { formClasses } from "../../../classes/tailwindClasses";
import { toast } from "react-hot-toast";

interface ContactInfoProps {
  onComplete: () => void;
  isComplete: boolean;
}

interface ContactInfo {
  phone: string;
  address: string;
}

const ContactInfo = ({ onComplete, isComplete }: ContactInfoProps) => {
  const { label, input, textarea, button } = formClasses;
  const dispatch = useAppDispatch();
  const { data: profile } = useAppSelector((state) => state.profile);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: profile?.contactInfo?.phone || "",
    address: profile?.contactInfo?.address || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    return () => {};
  }, []);

  // Update form when profile changes
  useEffect(() => {
    if (profile?.contactInfo) {
      setContactInfo({
        phone: profile.contactInfo.phone || "",
        address: profile.contactInfo.address || "",
      });
    }
  }, [profile]);

  const handleChange = (field: keyof ContactInfo, value: string) => {
    setContactInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatPhone = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "").slice(0, 10);
    const len = digits.length;
    if (len === 0) return "";
    if (len < 4) return `(${digits}`;
    if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
      6,
      10
    )}`;
  };

  const validatePhone = (value: string) => {
    // Only valid if exactly 10 digits
    const digits = value.replace(/\D/g, "");
    return digits.length === 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    // Don't submit if nothing has changed
    if (
      contactInfo.phone === profile.contactInfo?.phone &&
      contactInfo.address === profile.contactInfo?.address
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", profile.id), {
        contactInfo,
        updatedAt: new Date().toISOString(),
      });
      // Optimistically update the profile state
      dispatch(setProfileData({ ...profile, contactInfo }));
      // Optionally fetch the latest profile from the server
      await dispatch(fetchUserProfile(profile.id)).unwrap();
      toast.success("Contact information updated successfully");
    } catch (error) {
      console.error("[ContactInfo] Error updating contact info:", error);
      toast.error("Failed to update contact information");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="mb-5">
          <label className={label}>
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formatPhone(contactInfo.phone)}
            onChange={(e) => {
              // Only allow digits, auto-format, and update state
              const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
              handleChange("phone", raw);
              if (raw === "" || validatePhone(raw)) {
                setPhoneError(null);
              } else {
                setPhoneError("Please enter a valid 10-digit US phone number.");
              }
            }}
            onBlur={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              if (raw && !validatePhone(raw)) {
                setPhoneError("Please enter a valid 10-digit US phone number.");
              }
            }}
            className={input}
            placeholder="(123) 456-7890"
            maxLength={14}
            required
            disabled={isSubmitting}
            inputMode="numeric"
            pattern="\(\d{3}\) \d{3}-\d{4}"
          />
          <p className="text-xs text-gray-500 mt-1">Format: (123) 456-7890</p>
          {phoneError && (
            <p className="text-xs text-red-600 mt-1">{phoneError}</p>
          )}
        </div>

        <div>
          <label className={label}>
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            value={contactInfo.address}
            onChange={(e) => handleChange("address", e.target.value)}
            className={textarea}
            rows={3}
            placeholder="Enter your full address"
            required
            disabled={isSubmitting}
          />
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

export default ContactInfo;
