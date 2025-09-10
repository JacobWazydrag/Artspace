export interface User {
  id?: string;
  name: string;
  email: string;
  bio: string;
  role:
    | "manager"
    | "employee"
    | "on-boarding"
    | "artist"
    | "admin"
    | "on-boarding-awaiting-approval";
  status:
    | "accepted"
    | "rejected"
    | "shown"
    | "showing"
    | "pending"
    | "webmaster"
    | "preShow"
    | null;
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
  showAccess?: string[];
  rating?: UserRating;
}

export interface UserRating {
  submittedOnTime: number; // 0-4
  easeToWorkWith: number; // 0-4
  attendedOpening: number; // 0-4
  attendedClosing: number; // 0-4
  pickedUpOnTime: number; // 0-4
  selfPromoted: number; // 0-4
  weightedScore: number; // 0-100
  decision:
    | "Invite back"
    | "Likely invite"
    | "Conditional (coach first)"
    | "Do not re-invite (for now)";
  triggers: string[];
  createdAt: string; // ISO
  createdBy: string; // admin user id
}
