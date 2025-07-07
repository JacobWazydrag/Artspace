import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Artshow } from "./artshowsSlice";
import { User } from "./usersSlice";
import { Artwork } from "./artworkSlice";

interface PublicState {
  activeArtshow: Artshow | null;
  publicArtists: User[];
  publicArtworks: Artwork[];
  loading: boolean;
  error: string | null;
}

const initialState: PublicState = {
  activeArtshow: null,
  publicArtists: [],
  publicArtworks: [],
  loading: false,
  error: null,
};

export const fetchPublicArtshowData = createAsyncThunk(
  "public/fetchPublicArtshowData",
  async (_, { rejectWithValue }) => {
    try {
      // 1. Get the active artshow
      const artshowsSnap = await getDocs(collection(db, "artshows"));
      const artshows = artshowsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Artshow[];
      const activeArtshow =
        artshows.find((show) => show.status === "active") || null;
      if (!activeArtshow)
        return { activeArtshow: null, publicArtists: [], publicArtworks: [] };

      // 2. Get all artists in artistIds
      let publicArtists: User[] = [];
      if (activeArtshow.artistIds && activeArtshow.artistIds.length > 0) {
        const usersSnap = await getDocs(collection(db, "users"));
        publicArtists = usersSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((user: any) =>
            activeArtshow.artistIds!.includes(user.id)
          ) as User[];
      }

      // 3. Get all artworks in artworkIds
      let publicArtworks: Artwork[] = [];
      if (activeArtshow.artworkIds && activeArtshow.artworkIds.length > 0) {
        const artworksSnap = await getDocs(collection(db, "artworks"));
        publicArtworks = artworksSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((artwork: any) =>
            activeArtshow.artworkIds!.includes(artwork.id)
          ) as Artwork[];
      }

      return { activeArtshow, publicArtists, publicArtworks };
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch public artshow data"
      );
    }
  }
);

const publicSlice = createSlice({
  name: "public",
  initialState,
  reducers: {
    clearPublicData: (state) => {
      state.activeArtshow = null;
      state.publicArtists = [];
      state.publicArtworks = [];
      state.loading = false;
      state.error = null;
    },
    updateActiveArtshow: (state, action) => {
      state.activeArtshow = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicArtshowData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicArtshowData.fulfilled, (state, action) => {
        state.loading = false;
        state.activeArtshow = action.payload.activeArtshow;
        state.publicArtists = action.payload.publicArtists;
        state.publicArtworks = action.payload.publicArtworks;
        state.error = null;
      })
      .addCase(fetchPublicArtshowData.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch public artshow data";
      });
  },
});

export const { clearPublicData, updateActiveArtshow } = publicSlice.actions;
export default publicSlice.reducer;
