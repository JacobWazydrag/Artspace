export interface User {
  id?: string;
  name: string;
  email: string;
  bio: string;
  role: "manager" | "on-boarding" | "artist" | "admin";
  status: "accepted" | "rejected" | "shown" | "showing" | "pending" | null;
  contactInfo?: {
    phone?: string;
    address?: string;
  };
  socialLinks?: {
    [key: string]: string;
  };
  artworks?: string[];
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  photoUrl?: string | null;
  assignedLocations?: string[];
  interestInShow?: string;
  artshowId?: string;
  stripeId?: string;
  notificationPreferences?: {
    email: { active: boolean; frequency: "daily" | "weekly" | "monthly" };
  };
  paymentInformation?: {
    venmo?: string;
    zelle?: string;
  };
  shownAtArtspace?: boolean;
}
