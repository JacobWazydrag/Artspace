export interface ArtSpace {
  id: string;
  name: string;
  description: string;
  address: string;
  image: string;
  phone: string;
  email: string;
  website: string;
  socialLinks: object | null;
  bio: string | null;
  assignedLocations: string[] | null;
  createdAt: string;
  updatedAt: string;
}
