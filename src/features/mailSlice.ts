import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export interface MailData {
  toUids?: string[];
  to?: string[];
  cc?: string[];
  bcc?: string[];
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  message: {
    subject: string;
    text?: string;
    html: string;
    amp?: string;
    attachments?: any[];
  };
}

interface MailState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: MailState = {
  loading: false,
  error: null,
  success: false,
};

export const sendMail = createAsyncThunk(
  "mail/sendMail",
  async (mailData: MailData) => {
    const mailRef = collection(db, "mail");
    const docRef = await addDoc(mailRef, {
      ...mailData,
      createdAt: Timestamp.now(),
    });
    return { id: docRef.id, ...mailData };
  }
);

const mailSlice = createSlice({
  name: "mail",
  initialState,
  reducers: {
    clearMailState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    resetSuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(sendMail.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = null;
      })
      .addCase(sendMail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to send email";
        state.success = false;
      });
  },
});

export const { clearMailState, resetSuccess } = mailSlice.actions;
export default mailSlice.reducer;
