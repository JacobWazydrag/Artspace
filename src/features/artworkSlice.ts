import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  Timestamp,
  getDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export interface Artwork {
  id: string;
  title: string;
  medium: string;
  uom: string;
  date: string;
  images: string[];
  description: string;
  artistId: string;
  artshowId?: string;
  price?: number;
  height?: number;
  width?: number;
  availability?: "available" | "sold" | "not for sale";
  createdAt: string;
  updatedAt: string;
  locationId?: string;
  showStatus?: "accepted" | "rejected" | null;
  beenInShows?: string[];
}

export interface ArtworkState {
  data: Artwork[];
  loading: boolean;
  error: string | null;
}

export const initialState: ArtworkState = {
  data: [],
  loading: false,
  error: null,
};

const storage = getStorage();

// Async thunks
export const uploadArtwork = createAsyncThunk(
  "artwork/upload",
  async ({
    artwork,
    images,
  }: {
    artwork: Omit<Artwork, "id" | "images" | "createdAt" | "updatedAt">;
    images: File[];
  }) => {
    try {
      // Upload images to Firebase Storage
      const imageUrls = await Promise.all(
        images.map(async (image) => {
          try {
            const storageRef = ref(
              storage,
              `artworks/${Date.now()}_${image.name}`
            );
            const snapshot = await uploadBytes(storageRef, image);
            return getDownloadURL(snapshot.ref);
          } catch (error: any) {
            console.error("Error uploading image:", error);
            throw new Error(`Failed to upload image: ${error.message}`);
          }
        })
      );

      // Create artwork document
      const now = Timestamp.now();
      const artworkData = {
        ...artwork,
        images: imageUrls,
        createdAt: now.toString(),
        updatedAt: now.toString(),
      };

      try {
        const docRef = await addDoc(collection(db, "artworks"), artworkData);
        return { id: docRef.id, ...artworkData };
      } catch (error: any) {
        console.error("Error creating artwork document:", error);
        // If document creation fails, we should clean up any uploaded images
        await Promise.all(
          imageUrls.map(async (url) => {
            try {
              const imageRef = ref(storage, url);
              await deleteObject(imageRef);
            } catch (deleteError) {
              console.error("Error deleting uploaded image:", deleteError);
            }
          })
        );
        throw new Error(`Failed to create artwork document: ${error.message}`);
      }
    } catch (error: any) {
      console.error("Error in uploadArtwork:", error);
      throw error;
    }
  }
);

export const fetchArtistArtworks = createAsyncThunk(
  "artwork/fetchArtistArtworks",
  async (artistId: string) => {
    try {
      const q = query(
        collection(db, "artworks"),
        where("artistId", "==", artistId)
      );
      const querySnapshot = await getDocs(q);
      const artworks = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      }) as Artwork[];
      return artworks;
    } catch (error) {
      console.error("Error fetching artist artworks:", error);
      throw error;
    }
  }
);

export const deleteArtworkImage = createAsyncThunk(
  "artwork/deleteImage",
  async ({
    artworkId,
    imageUrl,
    deleteAll = false,
  }: {
    artworkId: string;
    imageUrl?: string;
    deleteAll?: boolean;
  }) => {
    const artworkRef = doc(db, "artworks", artworkId);
    const artworkDoc = await getDoc(artworkRef);

    if (!artworkDoc.exists()) {
      throw new Error("Artwork not found");
    }

    const artwork = artworkDoc.data();
    const images = artwork.images || [];

    if (deleteAll) {
      // Delete all images from storage
      const deletePromises = images.map(async (url: string) => {
        const imageRef = ref(storage, url);
        try {
          await deleteObject(imageRef);
        } catch (error) {
          console.error("Error deleting image from storage:", error);
        }
      });

      await Promise.all(deletePromises);

      // Update artwork document to remove all images
      await updateDoc(artworkRef, {
        images: [],
        updatedAt: serverTimestamp(),
      });

      return { artworkId, images: [] };
    } else if (imageUrl) {
      // Delete single image from storage
      const imageRef = ref(storage, imageUrl);
      try {
        await deleteObject(imageRef);
      } catch (error) {
        console.error("Error deleting image from storage:", error);
      }

      // Update artwork document to remove the specific image
      const updatedImages = images.filter((url: string) => url !== imageUrl);
      await updateDoc(artworkRef, {
        images: updatedImages,
        updatedAt: serverTimestamp(),
      });

      return { artworkId, images: updatedImages };
    }

    throw new Error("No image URL provided for deletion");
  }
);

export const addArtworkImages = createAsyncThunk(
  "artwork/addImages",
  async ({ artworkId, images }: { artworkId: string; images: File[] }) => {
    try {
      // Get the current artwork
      const artworkRef = doc(db, "artworks", artworkId);
      const artworkDoc = await getDoc(artworkRef);

      if (!artworkDoc.exists()) {
        throw new Error("Artwork not found");
      }

      const artwork = artworkDoc.data();
      const currentImages = artwork.images || [];

      // Upload new images to Firebase Storage
      const newImageUrls = await Promise.all(
        images.map(async (image) => {
          try {
            const storageRef = ref(
              storage,
              `artworks/${Date.now()}_${image.name}`
            );
            const snapshot = await uploadBytes(storageRef, image);
            return getDownloadURL(snapshot.ref);
          } catch (error: any) {
            console.error("Error uploading image:", error);
            throw new Error(`Failed to upload image: ${error.message}`);
          }
        })
      );

      // Update artwork document with new images
      const updatedImages = [...currentImages, ...newImageUrls];
      await updateDoc(artworkRef, {
        images: updatedImages,
        updatedAt: serverTimestamp(),
      });

      return { artworkId, images: updatedImages };
    } catch (error: any) {
      console.error("Error in addArtworkImages:", error);
      throw error;
    }
  }
);

export const deleteArtwork = createAsyncThunk(
  "artwork/delete",
  async (artworkId: string) => {
    try {
      const artworkRef = doc(db, "artworks", artworkId);
      const artworkDoc = await getDoc(artworkRef);

      if (!artworkDoc.exists()) {
        throw new Error("Artwork not found");
      }

      const artwork = artworkDoc.data();

      // Delete all images from storage
      if (artwork.images && artwork.images.length > 0) {
        await Promise.all(
          artwork.images.map(async (imageUrl: string) => {
            try {
              const imageRef = ref(storage, imageUrl);
              await deleteObject(imageRef);
            } catch (error) {
              console.error("Error deleting image:", error);
            }
          })
        );
      }

      // Delete the artwork document
      await deleteDoc(artworkRef);

      // Update the user's artworks array to remove the deleted artwork ID
      if (artwork.artistId) {
        const userRef = doc(db, "users", artwork.artistId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const updatedArtworks =
            userData.artworks?.filter((id: string) => id !== artworkId) || [];

          await updateDoc(userRef, {
            artworks: updatedArtworks,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      return artworkId;
    } catch (error: any) {
      console.error("Error in deleteArtwork:", error);
      throw error;
    }
  }
);

export const fetchArtshowArtworks = createAsyncThunk(
  "artwork/fetchArtshowArtworks",
  async (artshowId: string) => {
    try {
      const q = query(
        collection(db, "artworks"),
        where("artshowId", "==", artshowId)
      );
      const querySnapshot = await getDocs(q);
      const artworks = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      }) as Artwork[];
      return artworks;
    } catch (error) {
      console.error("Error fetching artshow artworks:", error);
      throw error;
    }
  }
);

export const updateArtworkShowStatus = createAsyncThunk(
  "artwork/updateShowStatus",
  async ({
    artworkId,
    artshowId,
    locationId,
    showStatus,
  }: {
    artworkId: string;
    artshowId?: string;
    locationId?: string;
    showStatus: "accepted" | "rejected" | null;
  }) => {
    try {
      const artworkRef = doc(db, "artworks", artworkId);
      const artworkDoc = await getDoc(artworkRef);

      if (!artworkDoc.exists()) {
        throw new Error("Artwork not found");
      }

      const artwork = artworkDoc.data();
      const currentArtshowId = artwork.artshowId;
      const currentLocationId = artwork.locationId;

      // Update artwork with empty strings for rejected status
      await updateDoc(artworkRef, {
        artshowId: showStatus === "rejected" ? "" : artshowId || "",
        locationId: showStatus === "rejected" ? "" : locationId || "",
        showStatus,
        updatedAt: new Date().toISOString(),
      });

      // If artwork was previously in a show, update that show
      if (currentArtshowId) {
        const artshowRef = doc(db, "artshows", currentArtshowId);
        const artshowDoc = await getDoc(artshowRef);
        if (artshowDoc.exists()) {
          const artshowData = artshowDoc.data();
          const updatedArtworkIds = (artshowData.artworkIds || []).filter(
            (id: string) => id !== artworkId
          );
          await updateDoc(artshowRef, {
            artworkIds: updatedArtworkIds,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // If artwork was previously in a location, update that location
      if (currentLocationId) {
        const locationRef = doc(db, "locations", currentLocationId);
        const locationDoc = await getDoc(locationRef);
        if (locationDoc.exists()) {
          const locationData = locationDoc.data();
          const updatedArtworkIds = (locationData.artworkIds || []).filter(
            (id: string) => id !== artworkId
          );
          await updateDoc(locationRef, {
            artworkIds: updatedArtworkIds,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // If artwork is being added to a new show and is accepted, update that show
      if (artshowId && showStatus === "accepted") {
        const artshowRef = doc(db, "artshows", artshowId);
        const artshowDoc = await getDoc(artshowRef);
        if (artshowDoc.exists()) {
          const artshowData = artshowDoc.data();
          const currentArtworkIds = artshowData.artworkIds || [];
          if (!currentArtworkIds.includes(artworkId)) {
            await updateDoc(artshowRef, {
              artworkIds: [...currentArtworkIds, artworkId],
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      // If artwork is being added to a new location and is accepted, update that location
      if (locationId && showStatus === "accepted") {
        const locationRef = doc(db, "locations", locationId);
        const locationDoc = await getDoc(locationRef);
        if (locationDoc.exists()) {
          const locationData = locationDoc.data();
          const currentArtworkIds = locationData.artworkIds || [];
          if (!currentArtworkIds.includes(artworkId)) {
            await updateDoc(locationRef, {
              artworkIds: [...currentArtworkIds, artworkId],
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      return { artworkId, artshowId, locationId, showStatus };
    } catch (error: any) {
      console.error("Error updating artwork show status:", error);
      throw error;
    }
  }
);

export const fetchAllArtworks = createAsyncThunk(
  "artwork/fetchAll",
  async () => {
    try {
      const artworksRef = collection(db, "artworks");
      const q = query(artworksRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const artworks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Artwork[];
      return artworks;
    } catch (error) {
      console.error("Error fetching all artworks:", error);
      throw error;
    }
  }
);

const artworkSlice = createSlice({
  name: "artwork",
  initialState,
  reducers: {
    resetArtworkState: () => initialState,
    clearArtwork: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload Artwork
      .addCase(uploadArtwork.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadArtwork.fulfilled, (state, action) => {
        state.loading = false;
        state.data.push(action.payload);
      })
      .addCase(uploadArtwork.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to upload artwork";
      })
      // Fetch Artist Artworks
      .addCase(fetchArtistArtworks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArtistArtworks.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchArtistArtworks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch artworks";
      })
      .addCase(deleteArtworkImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteArtworkImage.fulfilled, (state, action) => {
        state.loading = false;
        if (state.data) {
          const index = state.data.findIndex(
            (artwork) => artwork.id === action.payload.artworkId
          );
          if (index !== -1) {
            state.data[index] = {
              ...state.data[index],
              images: action.payload.images,
            };
          }
        }
      })
      .addCase(deleteArtworkImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete image";
      })
      .addCase(addArtworkImages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addArtworkImages.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(
          (artwork) => artwork.id === action.payload.artworkId
        );
        if (index !== -1) {
          state.data[index] = {
            ...state.data[index],
            images: action.payload.images,
          };
        }
      })
      .addCase(addArtworkImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to add images";
      })
      .addCase(deleteArtwork.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteArtwork.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter(
          (artwork) => artwork.id !== action.payload
        );
      })
      .addCase(deleteArtwork.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete artwork";
      })
      // Fetch Artshow Artworks
      .addCase(fetchArtshowArtworks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArtshowArtworks.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchArtshowArtworks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch artworks";
      })
      .addCase(updateArtworkShowStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateArtworkShowStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(
          (artwork) => artwork.id === action.payload.artworkId
        );
        if (index !== -1) {
          state.data[index] = {
            ...state.data[index],
            artshowId: action.payload.artshowId || "",
            locationId: action.payload.locationId || "",
            showStatus: action.payload.showStatus,
          };
        }
      })
      .addCase(updateArtworkShowStatus.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Failed to update artwork show status";
      })
      .addCase(fetchAllArtworks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllArtworks.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAllArtworks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch artworks";
      });
  },
});

export const { resetArtworkState, clearArtwork } = artworkSlice.actions;
export default artworkSlice.reducer;
