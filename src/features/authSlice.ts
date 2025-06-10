import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { User } from "../models/User";

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initializing: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  initializing: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
      state.initializing = false;
    },
    logout: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
      state.initializing = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.initializing = action.payload;
    },
  },
});

export const { login, logout, setLoading, setError, setInitializing } =
  authSlice.actions;
export default authSlice.reducer;
