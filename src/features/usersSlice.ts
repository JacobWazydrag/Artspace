import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { ThunkDispatch } from "@reduxjs/toolkit";
import { RootState } from "../store/store";

export interface User {
  id?: string;
  name: string;
  email: string;
  bio: string;
  role:
    | "manager"
    | "employee"
    | "on-boarding"
    | "artist"
    | "admin"
    | "on-boarding-awaiting-approval";
  status:
    | "accepted"
    | "rejected"
    | "shown"
    | "showing"
    | "pending"
    | "webmaster"
    | null;
  contactInfo?: {
    phone?: string;
    address?: string;
  };
  socialLinks?: {
    [key: string]: string;
  };
  artworks?: string[];
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  photoUrl?: string | null;
  assignedLocations?: string[];
  interestInShow?: string;
  artshowId?: string;
  stripeId?: string;
  shownAtArtspace?: boolean;
  paymentInformation?: {
    venmo?: string;
    zelle?: string;
  };
  notificationPreferences?: {
    email: { active: boolean; frequency: "daily" | "weekly" | "monthly" };
  };
}

interface UsersState {
  data: User[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk("users/fetchUsers", async () => {
  const usersRef = collection(db, "users");
  const q = query(
    usersRef,
    where("role", "not-in", ["admin", "manager", "employee"])
  );
  const querySnapshot = await getDocs(q);
  const users = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as User[];
  return users;
});

export const fetchUserById = createAsyncThunk(
  "users/fetchUserById",
  async (userId: string) => {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error("User not found");
    }
    return { id: docSnap.id, ...docSnap.data() } as User;
  }
);

export const createUser = createAsyncThunk(
  "users/createUser",
  async (userData: Omit<User, "id" | "createdAt" | "updatedAt">) => {
    const now = Timestamp.now();
    const userWithTimestamps = {
      ...userData,
      createdAt: now.toString(),
      updatedAt: now.toString(),
    };
    const docRef = await addDoc(collection(db, "users"), userWithTimestamps);
    return { id: docRef.id, ...userWithTimestamps };
  }
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ userId, userData }: { userId: string; userData: Partial<User> }) => {
    const userRef = doc(db, "users", userId);
    const updateData = {
      ...userData,
      updatedAt: Timestamp.now().toString(),
    };
    await updateDoc(userRef, updateData);
    return { id: userId, ...updateData };
  }
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId: string) => {
    await deleteDoc(doc(db, "users", userId));
    return userId;
  }
);

// Helper function to convert Firestore timestamps to ISO strings
const convertTimestamp = (timestamp: any): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === "string") {
    return timestamp;
  }
  return new Date().toISOString();
};

// Helper function to convert user data
const convertUserData = (doc: any): User => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

export const fetchUsersForChat = createAsyncThunk(
  "users/fetchUsersForChat",
  async () => {
    try {
      const usersRef = collection(db, "users");
      const querySnapshot = await getDocs(usersRef);
      const users = querySnapshot.docs.map(convertUserData);
      return users;
    } catch (error) {
      console.error("Error fetching users for chat:", error);
      throw error;
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUsers: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
    setUsers: (state, action) => {
      state.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch users";
      })
      // Fetch Users For Chat
      .addCase(fetchUsersForChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersForChat.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchUsersForChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch users for chat";
      })
      // Fetch User by ID
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(
          (user) => user.id === action.payload.id
        );
        if (index !== -1) {
          state.data[index] = action.payload;
        } else {
          state.data.push(action.payload);
        }
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch user";
      })
      // Create User
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create user";
      })
      // Update User
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(
          (user) => user.id === action.payload.id
        );
        if (index !== -1) {
          state.data[index] = { ...state.data[index], ...action.payload };
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update user";
      })
      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter((user) => user.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete user";
      });
  },
});

// Live updates thunk
export const listenToUsers =
  () => (dispatch: ThunkDispatch<RootState, void, any>) => {
    const usersRef = collection(db, "users");
    // You can add a query here if you want to filter out admins/managers
    return onSnapshot(usersRef, (snapshot) => {
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      dispatch(usersSlice.actions.setUsers(users));
    });
  };

export const { clearUsers, setUsers } = usersSlice.actions;
export default usersSlice.reducer;
