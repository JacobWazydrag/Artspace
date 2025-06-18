import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  Timestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export interface Message {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Chat {
  id?: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  loading: boolean;
  sendingMessage: boolean;
  error: string | null;
}

const initialState: ChatState = {
  chats: [],
  currentChat: null,
  messages: [],
  loading: false,
  sendingMessage: false,
  error: null,
};

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

// Helper function to convert chat data
const convertChatData = (doc: any): Chat => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    updatedAt: convertTimestamp(data.updatedAt),
    lastMessage: data.lastMessage
      ? {
          ...data.lastMessage,
          createdAt: convertTimestamp(data.lastMessage.createdAt),
        }
      : undefined,
  };
};

// Async thunks
export const fetchUserChats = createAsyncThunk(
  "chat/fetchUserChats",
  async (userId: string, { dispatch }) => {
    try {
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", userId),
        orderBy("updatedAt", "desc")
      );

      // Set up real-time listener for chats
      return new Promise<Chat[]>((resolve) => {
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const chats = querySnapshot.docs.map(convertChatData);
          dispatch(setChats(chats));
          resolve(chats);
        });

        // Store unsubscribe function in window for cleanup
        (window as any).unsubscribeChats = unsubscribe;
      });
    } catch (error) {
      console.error("Error fetching user chats:", error);
      throw error;
    }
  }
);

export const fetchChatMessages = createAsyncThunk(
  "chat/fetchChatMessages",
  async (chatId: string, { dispatch }) => {
    try {
      const messagesRef = collection(db, "messages");
      const q = query(
        messagesRef,
        where("chatId", "==", chatId),
        orderBy("createdAt", "asc")
      );

      // Set up real-time listener for messages
      return new Promise<Message[]>((resolve) => {
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const messages = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            const { createdAt, ...messageData } = data;
            return {
              id: doc.id,
              ...messageData,
              createdAt: convertTimestamp(createdAt),
            } as Message;
          });
          dispatch(setMessages(messages));
          resolve(messages);
        });

        // Store unsubscribe function in window for cleanup
        (window as any).unsubscribeMessages = unsubscribe;
      });
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      throw error;
    }
  }
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({
    chatId,
    message,
  }: {
    chatId: string;
    message: Omit<Message, "id" | "createdAt">;
  }) => {
    try {
      const messagesRef = collection(db, "messages");
      const chatRef = doc(db, "chats", chatId);

      const newMessage = {
        ...message,
        chatId,
        createdAt: serverTimestamp(),
        read: false,
      };

      const messageDoc = await addDoc(messagesRef, newMessage);

      // Update chat's lastMessage and updatedAt
      await updateDoc(chatRef, {
        lastMessage: {
          ...newMessage,
          id: messageDoc.id,
        },
        updatedAt: serverTimestamp(),
      });

      return {
        id: messageDoc.id,
        ...newMessage,
        createdAt: new Date().toISOString(),
      } as Message;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
);

export const createChat = createAsyncThunk(
  "chat/createChat",
  async ({ participants }: { participants: string[] }) => {
    try {
      const chatsRef = collection(db, "chats");
      const newChat = {
        participants,
        updatedAt: serverTimestamp(),
      };
      const chatDoc = await addDoc(chatsRef, newChat);
      return {
        id: chatDoc.id,
        ...newChat,
        updatedAt: new Date().toISOString(),
      } as Chat;
    } catch (error) {
      console.error("Error creating chat:", error);
      throw error;
    }
  }
);

export const startChat = createAsyncThunk(
  "chat/startChat",
  async ({ userId, otherUserId }: { userId: string; otherUserId: string }) => {
    try {
      // Check if a chat already exists between these users
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", userId)
      );
      const querySnapshot = await getDocs(q);

      // Look for an existing chat with both users
      const existingChat = querySnapshot.docs.find((doc) => {
        const data = doc.data();
        return data.participants.includes(otherUserId);
      });

      if (existingChat) {
        // Return the existing chat instead of creating a new one
        const data = existingChat.data();
        return {
          id: existingChat.id,
          participants: data.participants,
          lastMessage: data.lastMessage,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as Chat;
      }

      // If no existing chat, create a new one
      const chatRef = await addDoc(collection(db, "chats"), {
        participants: [userId, otherUserId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: null,
      });

      const chatDoc = await getDoc(chatRef);
      if (!chatDoc.exists()) {
        throw new Error("Failed to create chat");
      }

      const data = chatDoc.data();
      return {
        id: chatDoc.id,
        participants: data.participants,
        lastMessage: data.lastMessage,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as Chat;
    } catch (error) {
      console.error("Error starting chat:", error);
      throw error;
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    clearChat: (state) => {
      state.currentChat = null;
      state.messages = [];
    },
    markMessageAsRead: (state, action) => {
      const message = state.messages.find((m) => m.id === action.payload);
      if (message) {
        message.read = true;
      }
    },
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch User Chats
      .addCase(fetchUserChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserChats.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchUserChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch chats";
      })
      // Fetch Chat Messages
      .addCase(fetchChatMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatMessages.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch messages";
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        state.sendingMessage = false;
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false;
        state.error = action.error.message || "Failed to send message";
      })
      // Create Chat
      .addCase(createChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChat.fulfilled, (state, action) => {
        state.loading = false;
        state.chats.unshift(action.payload);
        state.error = null;
      })
      .addCase(createChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create chat";
      });
  },
});

export const {
  setCurrentChat,
  clearChat,
  markMessageAsRead,
  setChats,
  setMessages,
} = chatSlice.actions;
export default chatSlice.reducer;
