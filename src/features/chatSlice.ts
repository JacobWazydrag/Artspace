import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  setDoc,
  Timestamp,
  getDoc,
  serverTimestamp,
  onSnapshot,
  limit,
} from "firebase/firestore";
import toast from "react-hot-toast";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  readBy: string[];
}

export interface Conversation {
  id: string;
  participants: string[];
  roles: string[];
  lastMessage?: string;
  lastMessageId?: string;
  lastMessageReadBy?: string[];
  lastUpdated: Timestamp;
  createdAt: Timestamp;
  initiatedBy: string;
}

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
};

// Helper function to generate conversation ID
const generateConversationId = (uid1: string, uid2: string) => {
  return `conversation_${[uid1, uid2].sort().join("_")}`;
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async (userId: string, { dispatch, getState }) => {
    try {
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", userId),
        orderBy("lastUpdated", "desc")
      );

      // Set up real-time listener for conversations
      const unsubscribe = onSnapshot(q, async (querySnapshot) => {
        const conversations = (await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const data = doc.data();

            // Get the latest message for each conversation
            const messagesQuery = query(
              collection(db, `conversations/${doc.id}/messages`),
              orderBy("timestamp", "desc"),
              limit(1)
            );
            const messagesSnapshot = await getDocs(messagesQuery);
            const lastMessageDoc = messagesSnapshot.docs[0];
            const lastMessage = lastMessageDoc?.data();

            return {
              id: doc.id,
              ...data,
              lastMessageId: lastMessageDoc?.id,
              lastMessage: lastMessage?.text,
              lastMessageReadBy: lastMessage?.readBy || [],
              createdAt: data.createdAt?.toDate
                ? data.createdAt.toDate().toISOString()
                : null,
              lastUpdated: data.lastUpdated?.toDate
                ? data.lastUpdated.toDate().toISOString()
                : null,
            };
          })
        )) as Conversation[];

        // Notification toast for new unread messages in conversations not currently viewed
        const chatState = (getState() as { chat: ChatState }).chat;
        const prevConversations = chatState.conversations || [];
        const currentConversationId = chatState.currentConversation?.id;
        conversations.forEach((conv: Conversation) => {
          const prev = prevConversations.find(
            (c: Conversation) => c.id === conv.id
          );
          // If there's a new lastMessageId and the user hasn't read it
          if (
            prev &&
            conv.lastMessageId &&
            conv.lastMessageId !== prev.lastMessageId &&
            conv.lastMessageReadBy &&
            !conv.lastMessageReadBy.includes(userId) &&
            conv.lastMessage &&
            conv.id !== currentConversationId
          ) {
            toast.success(`New message: ${conv.lastMessage}`);
          }
        });

        dispatch(chatSlice.actions.setConversations(conversations));
      });

      // Do NOT return unsubscribe!
      // return unsubscribe;
      return null;
    } catch (error) {
      console.error("Error setting up conversations listener:", error);
      throw error;
    }
  }
);

export const startConversation = createAsyncThunk(
  "chat/startConversation",
  async ({
    currentUserId,
    otherUserId,
    initialMessage,
    initialSenderId,
  }: {
    currentUserId: string;
    otherUserId: string;
    initialMessage: string;
    initialSenderId?: string;
  }) => {
    try {
      const conversationId = generateConversationId(currentUserId, otherUserId);
      const conversationRef = doc(db, "conversations", conversationId);
      const conversationDoc = await getDoc(conversationRef);

      if (!conversationDoc.exists()) {
        // Create new conversation
        const conversationData = {
          participants: [currentUserId, otherUserId],
          roles: ["artist", "user", "on-boarding"], // You might want to make this dynamic based on user roles
          lastMessage: initialMessage,
          lastUpdated: serverTimestamp(),
          createdAt: serverTimestamp(),
          initiatedBy: currentUserId,
        };
        await setDoc(conversationRef, conversationData);
      }

      // Add initial message
      const messageData = {
        senderId: initialSenderId || currentUserId,
        text: initialMessage,
        timestamp: serverTimestamp(),
        readBy: [currentUserId],
      };

      await addDoc(
        collection(db, `conversations/${conversationId}/messages`),
        messageData
      );

      return conversationId;
    } catch (error) {
      console.error("Error starting conversation:", error);
      throw error;
    }
  }
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (
    {
      conversationId,
      senderId,
      text,
    }: {
      conversationId: string;
      senderId: string;
      text: string;
    },
    { dispatch }
  ) => {
    try {
      const messageData = {
        senderId,
        text,
        timestamp: serverTimestamp(),
        readBy: [senderId],
      };

      const messageRef = await addDoc(
        collection(db, `conversations/${conversationId}/messages`),
        messageData
      );

      // Update conversation's last message and timestamp
      const lastUpdated = new Date().toISOString();
      await updateDoc(doc(db, "conversations", conversationId), {
        lastMessage: text,
        lastUpdated: serverTimestamp(),
        lastMessageReadBy: [senderId],
      });

      // Optimistically update conversation in Redux
      dispatch(
        chatSlice.actions.optimisticallyUpdateConversation({
          conversationId,
          lastMessage: text,
          lastUpdated,
          lastMessageReadBy: [senderId],
        })
      );

      // Do not return the message for Redux state.messages
      return null;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
);

export const markMessageAsRead = createAsyncThunk(
  "chat/markMessageAsRead",
  async (
    {
      conversationId,
      messageId,
      userId,
    }: {
      conversationId: string;
      messageId: string;
      userId: string;
    },
    { dispatch }
  ) => {
    try {
      const messageRef = doc(
        db,
        `conversations/${conversationId}/messages/${messageId}`
      );
      const messageDoc = await getDoc(messageRef);

      if (messageDoc.exists()) {
        const messageData = messageDoc.data();
        const readBy = messageData.readBy || [];
        if (!readBy.includes(userId)) {
          await updateDoc(messageRef, {
            readBy: [...readBy, userId],
          });

          // Update the message in Redux store
          dispatch(
            chatSlice.actions.updateMessageReadStatus({
              messageId,
              userId,
            })
          );

          // Check if this is the latest message in the conversation
          const messagesQuery = query(
            collection(db, `conversations/${conversationId}/messages`),
            orderBy("timestamp", "desc"),
            limit(1)
          );
          const messagesSnapshot = await getDocs(messagesQuery);
          const latestMessageDoc = messagesSnapshot.docs[0];
          if (latestMessageDoc && latestMessageDoc.id === messageId) {
            // Update the conversation's lastMessageReadBy field
            const updatedReadBy = !readBy.includes(userId)
              ? [...readBy, userId]
              : readBy;
            await updateDoc(doc(db, "conversations", conversationId), {
              lastMessageReadBy: updatedReadBy,
            });

            // Update the conversation in Redux store
            dispatch(
              chatSlice.actions.updateConversationReadStatus({
                conversationId,
                userId,
              })
            );
          }
        }
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
      throw error;
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (conversationId: string, { dispatch }) => {
    try {
      const q = query(
        collection(db, `conversations/${conversationId}/messages`),
        orderBy("timestamp", "asc")
      );

      // Set up real-time listener for messages
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            senderId: data.senderId || "",
            text: data.text || "",
            timestamp: data.timestamp?.toDate
              ? data.timestamp.toDate().toISOString()
              : null,
            readBy: data.readBy || [],
          };
        });

        dispatch(chatSlice.actions.setMessages(messages));
      });

      // Do NOT return unsubscribe!
      // return unsubscribe;
      return null;
    } catch (error) {
      console.error("Error setting up messages listener:", error);
      throw error;
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    clearCurrentConversation: (state) => {
      state.currentConversation = null;
      state.messages = [];
    },
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    optimisticallyUpdateConversation: (state, action) => {
      const { conversationId, lastMessage, lastUpdated, lastMessageReadBy } =
        action.payload;
      const conv = state.conversations.find((c) => c.id === conversationId);
      if (conv) {
        conv.lastMessage = lastMessage;
        conv.lastUpdated = lastUpdated;
        if (lastMessageReadBy) conv.lastMessageReadBy = lastMessageReadBy;
      }
    },
    updateMessageReadStatus: (state, action) => {
      const { messageId, userId } = action.payload;
      const message = state.messages.find((m) => m.id === messageId);
      if (message && !message.readBy.includes(userId)) {
        message.readBy.push(userId);
      }
    },
    updateConversationReadStatus: (state, action) => {
      const { conversationId, userId } = action.payload;
      const conversation = state.conversations.find(
        (c) => c.id === conversationId
      );
      if (conversation && conversation.lastMessageReadBy) {
        if (!conversation.lastMessageReadBy.includes(userId)) {
          conversation.lastMessageReadBy.push(userId);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch conversations";
      })
      // Start Conversation
      .addCase(startConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startConversation.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(startConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to start conversation";
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        state.loading = false;
        // Do not push the message to state.messages here
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to send message";
      })
      .addCase(fetchMessages.fulfilled, (state) => {
        state.loading = false;
      });
  },
});

export const {
  setCurrentConversation,
  clearCurrentConversation,
  setConversations,
  setMessages,
  optimisticallyUpdateConversation,
  updateMessageReadStatus,
  updateConversationReadStatus,
} = chatSlice.actions;
export default chatSlice.reducer;
