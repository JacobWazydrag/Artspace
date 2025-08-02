import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

// Define interfaces for each collection type
interface WebMasterArtshow {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  locationId?: string;
  status: string;
  subTitle?: string;
  photoUrl?: string;
  artistIds: string[];
  artworkIds: string[];
  artworkOrder: string[];
  createdAt: any;
  updatedAt?: any;
}

interface WebMasterArtwork {
  id: string;
  title: string;
  artistId: string;
  artistName?: string;
  medium: string;
  price?: number;
  sold: boolean;
  pendingSale?: boolean;
  buyerInfo?: any;
  createdAt: any;
  updatedAt?: any;
}

interface WebMasterChat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: any;
  createdAt: any;
}

interface WebMasterLocation {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt?: any;
}

interface WebMasterMail {
  id: string;
  to: string[];
  subject: string;
  status: string;
  sentAt?: any;
  createdAt: any;
}

interface WebMasterMedium {
  id: string;
  name: string;
  description?: string;
  createdAt: any;
}

interface WebMasterMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: any;
  messageType?: string;
}

interface WebMasterUser {
  id: string;
  name?: string;
  email: string;
  role: string;
  status: string;
  createdAt: any;
  updatedAt?: any;
}

interface WebMasterState {
  artshows: WebMasterArtshow[];
  artworks: WebMasterArtwork[];
  chats: WebMasterChat[];
  locations: WebMasterLocation[];
  mail: WebMasterMail[];
  mediums: WebMasterMedium[];
  messages: WebMasterMessage[];
  users: WebMasterUser[];
  loading: {
    artshows: boolean;
    artworks: boolean;
    chats: boolean;
    locations: boolean;
    mail: boolean;
    mediums: boolean;
    messages: boolean;
    users: boolean;
  };
  error: {
    artshows: string | null;
    artworks: string | null;
    chats: string | null;
    locations: string | null;
    mail: string | null;
    mediums: string | null;
    messages: string | null;
    users: string | null;
  };
}

const initialState: WebMasterState = {
  artshows: [],
  artworks: [],
  chats: [],
  locations: [],
  mail: [],
  mediums: [],
  messages: [],
  users: [],
  loading: {
    artshows: false,
    artworks: false,
    chats: false,
    locations: false,
    mail: false,
    mediums: false,
    messages: false,
    users: false,
  },
  error: {
    artshows: null,
    artworks: null,
    chats: null,
    locations: null,
    mail: null,
    mediums: null,
    messages: null,
    users: null,
  },
};

// Async thunks for fetching each collection
export const fetchWebMasterArtshows = createAsyncThunk(
  "webMaster/fetchArtshows",
  async () => {
    const q = query(collection(db, "artshows"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WebMasterArtshow[];
  }
);

export const fetchWebMasterArtworks = createAsyncThunk(
  "webMaster/fetchArtworks",
  async () => {
    const q = query(collection(db, "artworks"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WebMasterArtwork[];
  }
);

export const fetchWebMasterChats = createAsyncThunk(
  "webMaster/fetchChats",
  async () => {
    console.log("🔍 WebMaster: Fetching chats without orderBy...");
    const querySnapshot = await getDocs(collection(db, "chats"));
    console.log("📍 WebMaster: Chats found:", querySnapshot.docs.length);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WebMasterChat[];
  }
);

export const fetchWebMasterLocations = createAsyncThunk(
  "webMaster/fetchLocations",
  async () => {
    console.log(
      "🔍 WebMaster: Starting to fetch locations - using same method as working regular fetch..."
    );

    // Use exactly the same approach as the working regular locations slice
    const querySnapshot = await getDocs(collection(db, "locations"));
    console.log(
      "📍 WebMaster: Query completed. Documents found:",
      querySnapshot.docs.length
    );

    const locations = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      console.log("📍 WebMaster: Location document:", { id: doc.id, data });
      return {
        id: doc.id,
        ...data,
      };
    }) as WebMasterLocation[];

    console.log("📍 WebMaster: Final locations array:", locations);
    return locations;
  }
);

export const fetchWebMasterMail = createAsyncThunk(
  "webMaster/fetchMail",
  async () => {
    const q = query(collection(db, "mail"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WebMasterMail[];
  }
);

export const fetchWebMasterMediums = createAsyncThunk(
  "webMaster/fetchMediums",
  async () => {
    const q = query(collection(db, "mediums"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WebMasterMedium[];
  }
);

export const fetchWebMasterMessages = createAsyncThunk(
  "webMaster/fetchMessages",
  async () => {
    console.log("🔍 WebMaster: Fetching messages without orderBy...");
    const querySnapshot = await getDocs(collection(db, "messages"));
    console.log("📍 WebMaster: Messages found:", querySnapshot.docs.length);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WebMasterMessage[];
  }
);

export const fetchWebMasterUsers = createAsyncThunk(
  "webMaster/fetchUsers",
  async () => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WebMasterUser[];
  }
);

const webMasterSlice = createSlice({
  name: "webMaster",
  initialState,
  reducers: {
    clearWebMasterData: (state) => {
      state.artshows = [];
      state.artworks = [];
      state.chats = [];
      state.locations = [];
      state.mail = [];
      state.mediums = [];
      state.messages = [];
      state.users = [];
    },
  },
  extraReducers: (builder) => {
    // Artshows
    builder
      .addCase(fetchWebMasterArtshows.pending, (state) => {
        state.loading.artshows = true;
        state.error.artshows = null;
      })
      .addCase(fetchWebMasterArtshows.fulfilled, (state, action) => {
        state.loading.artshows = false;
        state.artshows = action.payload;
      })
      .addCase(fetchWebMasterArtshows.rejected, (state, action) => {
        state.loading.artshows = false;
        state.error.artshows =
          action.error.message || "Failed to fetch artshows";
      })
      // Artworks
      .addCase(fetchWebMasterArtworks.pending, (state) => {
        state.loading.artworks = true;
        state.error.artworks = null;
      })
      .addCase(fetchWebMasterArtworks.fulfilled, (state, action) => {
        state.loading.artworks = false;
        state.artworks = action.payload;
      })
      .addCase(fetchWebMasterArtworks.rejected, (state, action) => {
        state.loading.artworks = false;
        state.error.artworks =
          action.error.message || "Failed to fetch artworks";
      })
      // Chats
      .addCase(fetchWebMasterChats.pending, (state) => {
        state.loading.chats = true;
        state.error.chats = null;
      })
      .addCase(fetchWebMasterChats.fulfilled, (state, action) => {
        state.loading.chats = false;
        state.chats = action.payload;
      })
      .addCase(fetchWebMasterChats.rejected, (state, action) => {
        state.loading.chats = false;
        state.error.chats = action.error.message || "Failed to fetch chats";
      })
      // Locations
      .addCase(fetchWebMasterLocations.pending, (state) => {
        state.loading.locations = true;
        state.error.locations = null;
      })
      .addCase(fetchWebMasterLocations.fulfilled, (state, action) => {
        state.loading.locations = false;
        state.locations = action.payload;
      })
      .addCase(fetchWebMasterLocations.rejected, (state, action) => {
        state.loading.locations = false;
        state.error.locations =
          action.error.message || "Failed to fetch locations";
      })
      // Mail
      .addCase(fetchWebMasterMail.pending, (state) => {
        state.loading.mail = true;
        state.error.mail = null;
      })
      .addCase(fetchWebMasterMail.fulfilled, (state, action) => {
        state.loading.mail = false;
        state.mail = action.payload;
      })
      .addCase(fetchWebMasterMail.rejected, (state, action) => {
        state.loading.mail = false;
        state.error.mail = action.error.message || "Failed to fetch mail";
      })
      // Mediums
      .addCase(fetchWebMasterMediums.pending, (state) => {
        state.loading.mediums = true;
        state.error.mediums = null;
      })
      .addCase(fetchWebMasterMediums.fulfilled, (state, action) => {
        state.loading.mediums = false;
        state.mediums = action.payload;
      })
      .addCase(fetchWebMasterMediums.rejected, (state, action) => {
        state.loading.mediums = false;
        state.error.mediums = action.error.message || "Failed to fetch mediums";
      })
      // Messages
      .addCase(fetchWebMasterMessages.pending, (state) => {
        state.loading.messages = true;
        state.error.messages = null;
      })
      .addCase(fetchWebMasterMessages.fulfilled, (state, action) => {
        state.loading.messages = false;
        state.messages = action.payload;
      })
      .addCase(fetchWebMasterMessages.rejected, (state, action) => {
        state.loading.messages = false;
        state.error.messages =
          action.error.message || "Failed to fetch messages";
      })
      // Users
      .addCase(fetchWebMasterUsers.pending, (state) => {
        state.loading.users = true;
        state.error.users = null;
      })
      .addCase(fetchWebMasterUsers.fulfilled, (state, action) => {
        state.loading.users = false;
        state.users = action.payload;
      })
      .addCase(fetchWebMasterUsers.rejected, (state, action) => {
        state.loading.users = false;
        state.error.users = action.error.message || "Failed to fetch users";
      });
  },
});

export const { clearWebMasterData } = webMasterSlice.actions;
export default webMasterSlice.reducer;
