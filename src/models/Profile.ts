export interface Profile {
  email: string;
  name: string;
  contactInfo: {
    address: string;
    phone: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  bio: string;
  assignedLocations: string[];
  role: string;
  interestInShow: string;
}
