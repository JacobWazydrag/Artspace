import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface Location {
  id?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  contactPhone: string;
  contactEmail: string;
  managerIds: string[];
  hours: string;
  notes: string;
}

interface LocationsState {
  data: Location[];
  loading: boolean;
  error: string | null;
}

const initialState: LocationsState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchLocations = createAsyncThunk(
  "locations/fetchLocations",
  async () => {
    const querySnapshot = await getDocs(collection(db, "locations"));
    const locations = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Location[];
    return locations;
  }
);

export const fetchLocationById = createAsyncThunk(
  "locations/fetchLocationById",
  async (id: string) => {
    const locationRef = doc(db, "locations", id);
    const locationSnap = await getDoc(locationRef);
    if (locationSnap.exists()) {
      return {
        id: locationSnap.id,
        ...locationSnap.data(),
      } as Location;
    }
    throw new Error("Location not found");
  }
);

const locationsSlice = createSlice({
  name: "locations",
  initialState,
  reducers: {
    clearLocations: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch locations";
      })
      .addCase(fetchLocationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocationById.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(
          (loc) => loc.id === action.payload.id
        );
        if (index !== -1) {
          state.data[index] = action.payload;
        } else {
          state.data.push(action.payload);
        }
      })
      .addCase(fetchLocationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch location";
      });
  },
});

export const { clearLocations } = locationsSlice.actions;
export default locationsSlice.reducer;
