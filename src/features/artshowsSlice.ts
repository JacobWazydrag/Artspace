import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

export interface Artshow {
  id?: string;
  name: string;
  subTitle: string;
  startDate: string;
  endDate: string;
  locationId: string;
  description?: string;
  createdAt: string;
  createdBy?: string;
  photoUrl?: string | null;
  status: "active" | "inactive" | "closed";
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
    const artshows = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      };
    }) as Artshow[];
    return artshows;
  }
);

export const fetchArtshowById = createAsyncThunk(
  "artshows/fetchArtshowById",
  async (id: string) => {
    const artshowRef = doc(db, "artshows", id);
    const artshowSnap = await getDoc(artshowRef);
    if (artshowSnap.exists()) {
      const data = artshowSnap.data();
      return {
        id: artshowSnap.id,
        ...data,
        createdAt:
          data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      } as Artshow;
    }
    throw new Error("Artshow not found");
  }
);

export const closeShow = createAsyncThunk(
  "artshows/closeShow",
  async (artshowId: string) => {
    const batch = writeBatch(db);

    // 1. Update Artshow status
    const artshowRef = doc(db, "artshows", artshowId);
    batch.update(artshowRef, { status: "closed" });

    // 2. Get all artworks in the show
    const artworksQuery = query(
      collection(db, "artworks"),
      where("artshowId", "==", artshowId)
    );
    const artworksSnapshot = await getDocs(artworksQuery);

    // 3. Get all artists in the show
    const artshowDoc = await getDoc(artshowRef);
    const artshowData = artshowDoc.data();
    const artistIds = artshowData?.artistIds || [];

    // 4. Get location
    const locationRef = doc(db, "locations", artshowData?.locationId);
    const locationDoc = await getDoc(locationRef);
    const locationData = locationDoc.data();

    // Update artworks
    artworksSnapshot.forEach((artworkDoc) => {
      const artworkRef = doc(db, "artworks", artworkDoc.id);
      const artworkData = artworkDoc.data();

      batch.update(artworkRef, {
        artshowId: null,
        locationId: null,
        showStatus: "shown",
        beenInShows: [...(artworkData.beenInShows || []), artshowId],
      });
    });

    // Update artists
    for (const artistId of artistIds) {
      const artistRef = doc(db, "users", artistId);
      const artistDoc = await getDoc(artistRef);
      const artistData = artistDoc.data();

      batch.update(artistRef, {
        status: "shown",
        artshowId: null,
        beenInShows: [...(artistData?.beenInShows || []), artshowId],
      });
    }

    // Update location
    if (locationDoc.exists()) {
      batch.update(locationRef, {
        artistIds: [],
        artistsThatHaveShown: [
          ...(locationData?.artistsThatHaveShown || []),
          ...artistIds,
        ],
        artworkIds: [],
        artworksThatHaveHungHere: [
          ...(locationData?.artworksThatHaveHungHere || []),
          ...artworksSnapshot.docs.map((doc) => doc.id),
        ],
      });
    }

    // Commit all updates
    await batch.commit();

    return artshowId;
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
      })
      .addCase(closeShow.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(closeShow.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(
          (show) => show.id === action.payload
        );
        if (index !== -1) {
          state.data[index].status = "closed";
        }
      })
      .addCase(closeShow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to close artshow";
      });
  },
});

export const { clearArtshows } = artshowsSlice.actions;
export default artshowsSlice.reducer;
