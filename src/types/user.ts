export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  role:
    | "admin"
    | "manager"
    | "on-boarding"
    | "on-boarding-awaiting-approval"
    | "artist"
    | "employee";
  status:
    | "accepted"
    | "rejected"
    | "shown"
    | "showing"
    | "webmaster"
    | "preShow"
    | null;
  contactInfo?: {
    phone?: string;
    address?: string;
  };
  socialLinks?: {
    instagram?: string;
  };
  paymentInformation?: {
    venmo?: string;
    zelle?: string;
  };
  artworks?: string[]; // Array of artwork IDs
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  photoUrl?: string | null;
  interestInShow?: string;
  stripeId?: string;
  shownAtArtspace?: boolean;
  notificationPreferences?: {
    email: { active: boolean; frequency: "daily" | "weekly" | "monthly" };
  };
}
