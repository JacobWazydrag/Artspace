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
  showStatus?: "accepted" | "rejected" | "shown" | null;
  availability?: "available" | "sold" | "not for sale" | "pending";
  markedPending?: string;
  pendingSale?: boolean;
  sold?: boolean;
  createdAt: string;
  updatedAt: string;
  beenInShows?: string[];
  buyerInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    paymentMethod?: string;
    finalPricePaid?: number;
  };
}
