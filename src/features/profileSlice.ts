import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile } from "../types/user";

interface ProfileState {
  data: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchUserProfile = createAsyncThunk(
  "profile/fetchUserProfile",
  async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) {
        throw new Error("User profile not found");
      }
      return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }
);

export const completeOnboarding = createAsyncThunk(
  "profile/completeOnboarding",
  async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        onboardingCompleted: true,
        role: "admin",
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
    setProfileData: (state, action) => {
      state.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        // Only update if the data has actually changed
        if (JSON.stringify(state.data) !== JSON.stringify(action.payload)) {
          state.data = action.payload;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        // Check for specific error types
        if (
          action.error.message?.includes(
            "Failed to get document because the client is offline"
          )
        ) {
          state.error =
            "You appear to be offline. Please check your internet connection and try again.";
        } else if (action.error.message?.includes("User profile not found")) {
          state.error = "User profile not found";
        } else {
          state.error = "Failed to fetch profile. Please try again.";
        }
      })
      .addCase(completeOnboarding.fulfilled, (state) => {
        if (state.data) {
          state.data.onboardingCompleted = true;
          state.data.role = "admin";
        }
      });
  },
});

export const { clearProfile, setProfileData } = profileSlice.actions;
export default profileSlice.reducer;
