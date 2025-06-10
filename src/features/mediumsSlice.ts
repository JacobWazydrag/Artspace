import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export interface Medium {
  id?: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
}

interface MediumsState {
  data: Medium[];
  loading: boolean;
  error: string | null;
}

const initialState: MediumsState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchMediums = createAsyncThunk(
  "mediums/fetchMediums",
  async () => {
    const querySnapshot = await getDocs(collection(db, "mediums"));
    const mediums = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      };
    }) as Medium[];
    return mediums;
  }
);

export const fetchMediumById = createAsyncThunk(
  "mediums/fetchMediumById",
  async (id: string) => {
    const mediumRef = doc(db, "mediums", id);
    const mediumSnap = await getDoc(mediumRef);
    if (mediumSnap.exists()) {
      const data = mediumSnap.data();
      return {
        id: mediumSnap.id,
        ...data,
        createdAt:
          data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      } as Medium;
    }
    throw new Error("Medium not found");
  }
);

const mediumsSlice = createSlice({
  name: "mediums",
  initialState,
  reducers: {
    clearMediums: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMediums.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMediums.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchMediums.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch mediums";
      })
      .addCase(fetchMediumById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMediumById.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(
          (medium) => medium.id === action.payload.id
        );
        if (index !== -1) {
          state.data[index] = action.payload;
        } else {
          state.data.push(action.payload);
        }
      })
      .addCase(fetchMediumById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch medium";
      });
  },
});

export const { clearMediums } = mediumsSlice.actions;
export default mediumsSlice.reducer;
