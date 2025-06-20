export interface User {
  id?: string;
  name: string;
  email: string;
  bio: string;
  role: "manager" | "on-boarding" | "artist" | "admin";
  status: "accepted" | "rejected" | "shown" | "showing" | null;
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
  notificationPreferences?: {
    email: { active: boolean; frequency: "daily" | "weekly" | "monthly" };
  };
}
