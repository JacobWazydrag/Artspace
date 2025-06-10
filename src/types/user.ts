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
    | "artist";
  status: "active" | "inactive" | "AWAITING_APPROVAL";
  contactInfo?: {
    phone?: string;
    address?: string;
  };
  socialLinks?: {
    [key: string]: string;
  };
  artworks?: string[]; // Array of artwork IDs
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  photoUrl?: string | null;
  interestInShow?: string;
}
