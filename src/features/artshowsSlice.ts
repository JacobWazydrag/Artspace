import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export interface Artshow {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
  mediums: string[];
  locationId: string;
  description?: string;
  createdAt: Timestamp;
  createdBy?: string;
  photoUrl?: string | null;
  status: "active" | "inactive";
  artistIds?: string[];
  artworkIds?: string[];
}

interface ArtshowsState {
  data: Artshow[];
  loading: boolean;
  error: string | null;
}

const initialState: ArtshowsState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchArtshows = createAsyncThunk(
  "artshows/fetchArtshows",
  async () => {
    const querySnapshot = await getDocs(collection(db, "artshows"));
    const artshows = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Artshow[];
    return artshows;
  }
);

export const fetchArtshowById = createAsyncThunk(
  "artshows/fetchArtshowById",
  async (id: string) => {
    const artshowRef = doc(db, "artshows", id);
    const artshowSnap = await getDoc(artshowRef);
    if (artshowSnap.exists()) {
      return {
        id: artshowSnap.id,
        ...artshowSnap.data(),
      } as Artshow;
    }
    throw new Error("Artshow not found");
  }
);

const artshowsSlice = createSlice({
  name: "artshows",
  initialState,
  reducers: {
    clearArtshows: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchArtshows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArtshows.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchArtshows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch artshows";
      })
      .addCase(fetchArtshowById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArtshowById.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(
          (show) => show.id === action.payload.id
        );
        if (index !== -1) {
          state.data[index] = action.payload;
        } else {
          state.data.push(action.payload);
        }
      })
      .addCase(fetchArtshowById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch artshow";
      });
  },
});

export const { clearArtshows } = artshowsSlice.actions;
export default artshowsSlice.reducer;
