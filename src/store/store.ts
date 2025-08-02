import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice";
import profileReducer from "../features/profileSlice";
import locationsReducer from "../features/locationsSlice";
import artshowsReducer from "../features/artshowsSlice";
import mediumsReducer from "../features/mediumsSlice";
import usersReducer from "../features/usersSlice";
import artworkReducer from "../features/artworkSlice";
import publicReducer from "../features/publicSlice";
import chatReducer from "../features/chatSlice";
import mailReducer from "../features/mailSlice";
import webMasterReducer from "../features/webMasterSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    locations: locationsReducer,
    artshows: artshowsReducer,
    mediums: mediumsReducer,
    users: usersReducer,
    artwork: artworkReducer,
    public: publicReducer,
    chat: chatReducer,
    mail: mailReducer,
    webMaster: webMasterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          "mediums/fetchMediums/fulfilled",
          "profile/fetchUserProfile/fulfilled",
          "artshows/fetchArtshows/fulfilled",
          "locations/fetchLocations/fulfilled",
          "users/fetchUsers/fulfilled",
          "artwork/fetchArtwork/fulfilled",
          "chat/sendMessage/fulfilled",
          "chat/createChat/fulfilled",
          "webMaster/fetchArtshows/fulfilled",
          "webMaster/fetchArtworks/fulfilled",
          "webMaster/fetchChats/fulfilled",
          "webMaster/fetchLocations/fulfilled",
          "webMaster/fetchMail/fulfilled",
          "webMaster/fetchMediums/fulfilled",
          "webMaster/fetchMessages/fulfilled",
          "webMaster/fetchUsers/fulfilled",
        ],
        // Ignore these field paths in all actions
        ignoredActionPaths: [
          "payload.timestamp",
          "payload.createdAt",
          "payload.lastUpdated",
          "payload.data.timestamp",
          "payload.data.createdAt",
          "payload.data.lastUpdated",
          "payload.data.0.createdAt",
          "payload.data.0.timestamp",
          "payload.data.0.lastUpdated",
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          "mediums.data.createdAt",
          "mediums.data.0.createdAt",
          "artshows.data.createdAt",
          "artshows.data.0.createdAt",
          "locations.data.createdAt",
          "locations.data.0.createdAt",
          "users.data.createdAt",
          "users.data.0.createdAt",
          "artwork.data.createdAt",
          "artwork.data.0.createdAt",
          "profile.data.createdAt",
          "profile.data.0.createdAt",
          "chat.messages.createdAt",
          "chat.chats.updatedAt",
        ],
      },
      immutableCheck: false, // Disable immutable checks in development
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
