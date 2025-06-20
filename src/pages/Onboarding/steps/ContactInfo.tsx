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
  emailNotifications: boolean;
}

const ContactInfo = ({ onComplete, isComplete }: ContactInfoProps) => {
  const { label, input, textarea, button } = formClasses;
  const dispatch = useAppDispatch();
  const { data: profile } = useAppSelector((state) => state.profile);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: profile?.contactInfo?.phone || "",
    address: profile?.contactInfo?.address || "",
    emailNotifications: profile?.notificationPreferences?.email?.active ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    return () => {};
  }, []);

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      setContactInfo({
        phone: profile.contactInfo?.phone || "",
        address: profile.contactInfo?.address || "",
        emailNotifications:
          profile.notificationPreferences?.email?.active ?? true,
      });
    }
  }, [profile]);

  const handleChange = (field: keyof ContactInfo, value: string | boolean) => {
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
      contactInfo.address === profile.contactInfo?.address &&
      contactInfo.emailNotifications ===
        (profile.notificationPreferences?.email?.active ?? true)
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: any = {
        contactInfo: {
          phone: contactInfo.phone,
          address: contactInfo.address,
        },
        updatedAt: new Date().toISOString(),
      };

      // Add notification preferences if they don't exist or need updating
      if (
        !profile.notificationPreferences ||
        profile.notificationPreferences.email.active !==
          contactInfo.emailNotifications
      ) {
        updateData.notificationPreferences = {
          email: {
            active: contactInfo.emailNotifications,
            frequency:
              profile.notificationPreferences?.email?.frequency || "daily",
          },
        };
      }

      await updateDoc(doc(db, "users", profile.id), updateData);

      // Optimistically update the profile state
      const updatedProfile = {
        ...profile,
        contactInfo: {
          phone: contactInfo.phone,
          address: contactInfo.address,
        },
        notificationPreferences: {
          email: {
            active: contactInfo.emailNotifications,
            frequency:
              profile.notificationPreferences?.email?.frequency || "daily",
          },
        },
      };
      dispatch(setProfileData(updatedProfile));

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

        <div>
          <label className={label}>Email Notifications</label>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="radio"
                id="email-notifications-yes"
                name="emailNotifications"
                value="true"
                checked={contactInfo.emailNotifications === true}
                onChange={() => handleChange("emailNotifications", true)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                disabled={isSubmitting}
              />
              <label
                htmlFor="email-notifications-yes"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Yes, I would like to receive email notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="email-notifications-no"
                name="emailNotifications"
                value="false"
                checked={contactInfo.emailNotifications === false}
                onChange={() => handleChange("emailNotifications", false)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                disabled={isSubmitting}
              />
              <label
                htmlFor="email-notifications-no"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                No, I do not want to receive email notifications
              </label>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            You can change this preference at any time in your profile settings.
          </p>
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
