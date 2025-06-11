export interface Artwork {
  id?: string;
  title: string;
  medium: string;
  uom: string;
  date: string;
  description: string;
  images: string[];
  artistId: string;
  artshowId?: string;
  locationId?: string;
  price?: number;
  height?: number;
  width?: number;
  status?: "pending" | "approved" | "rejected";
  showStatus?: "accepted" | "rejected" | null;
  availability?: "available" | "sold" | "not for sale";
  createdAt: string;
  updatedAt: string;
  beenInShows?: string[];
}
