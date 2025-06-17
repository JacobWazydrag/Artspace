import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks/storeHook";
import {
  uploadArtwork,
  fetchArtistArtworks,
  deleteArtworkImage,
  addArtworkImages,
  deleteArtwork,
} from "../../../features/artworkSlice";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { fetchMediums } from "../../../features/mediumsSlice";
import { completeOnboarding } from "../../../features/profileSlice";
import { fetchUserProfile } from "../../../features/profileSlice";
import { Artwork } from "../../../types/artwork";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Medium } from "../../../features/mediumsSlice";
import { formClasses } from "../../../classes/tailwindClasses";
import { NumericFormat } from "react-number-format";

interface ArtworkUploadProps {
  onComplete: () => void;
  isComplete: boolean;
}

interface ArtworkFormData {
  title: string;
  mediums: string[];
  date: string;
  description: string;
  images: File[];
  price: number;
  uom: string;
  height: number;
  width: number;
}

interface ArtworkInput {
  title: string;
  medium: string;
  uom: string;
  height: number;
  width: number;
  date: string;
  description: string;
  artistId: string;
}

interface ImageGalleryProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  onDeleteImage?: (imageUrl: string) => void;
  artworkId?: string;
}

const ImageGallery = ({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
  onDeleteImage,
  artworkId,
}: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  if (!isOpen) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleDelete = () => {
    if (onDeleteImage && artworkId) {
      onDeleteImage(images[currentIndex]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="relative max-w-4xl w-full mx-4">
        <div className="absolute top-4 right-4 flex space-x-2 z-10">
          {onDeleteImage && (
            <button
              onClick={handleDelete}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Delete image"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="relative">
          <img
            src={images[currentIndex]}
            alt={`Artwork image ${currentIndex + 1}`}
            className="w-full h-auto max-h-[80vh] object-contain"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
};

const MEASUREMENT_UNITS = [
  { value: "in", label: "Inches (in)" },
  { value: "cm", label: "Centimeters (cm)" },
  { value: "ft", label: "Feet (ft)" },
  { value: "m", label: "Meters (m)" },
  { value: "yd", label: "Yards (yd)" },
  { value: "mm", label: "Millimeters (mm)" },
  { value: "ft-in", label: "Feet and Inches (ft-in)" },
  { value: "m-cm", label: "Meters and Centimeters (m-cm)" },
];

const ArtworkUpload = ({ onComplete, isComplete }: ArtworkUploadProps) => {
  const {
    label,
    input,
    textarea,
    button,
    h4,
    ul,
    li,
    div,
    checkBoxInput,
    checkBoxLabel,
    select,
  } = formClasses;
  const dispatch = useAppDispatch();
  const profileState = useAppSelector((state) => state.profile);
  const artworkState = useAppSelector((state) => state.artwork);
  const { data: mediums } = useAppSelector((state) => state.mediums);
  const { data: artworks } = useAppSelector((state) => state.artwork);
  const [artworkList, setArtworkList] = useState<Artwork[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newArtwork, setNewArtwork] = useState<Partial<Artwork>>({
    title: "",
    medium: "",
    uom: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    images: [],
    price: 0,
    height: 0,
    width: 0,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loadingArtworkId, setLoadingArtworkId] = useState<string | null>(null);
  const [editingArtworkId, setEditingArtworkId] = useState<string | null>(null);
  const [addingImagesToArtworkId, setAddingImagesToArtworkId] = useState<
    string | null
  >(null);
  const navigate = useNavigate();
  const [selectedUnits, setSelectedUnits] = useState("in");
  const [selectedMediums, setSelectedMediums] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ArtworkFormData>({
    title: "",
    mediums: [],
    uom: "",
    height: 0,
    width: 0,
    date: new Date().toISOString().split("T")[0],
    description: "",
    images: [],
    price: 0,
  });
  const [selectedArtwork, setSelectedArtwork] = useState<{
    images: string[];
    index: number;
    artworkId: string;
  } | null>(null);

  useEffect(() => {
    // Fetch mediums when component mounts
    dispatch(fetchMediums());

    // Only fetch artworks if we have a valid profile ID
    if (profileState?.data?.id) {
      dispatch(fetchArtistArtworks(profileState.data.id))
        .unwrap()
        .then((artworks) => {
          if (artworks) {
            // Format artworks with proper date handling and sort by updatedAt
            const formattedArtworks = artworks
              .map((artwork) => ({
                ...artwork,
                date: artwork.date || new Date().toISOString().split("T")[0],
              }))
              .sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.date).getTime();
                const dateB = new Date(b.updatedAt || b.date).getTime();
                return dateB - dateA; // Sort in descending order (newest first)
              });
            setArtworkList(formattedArtworks);
          }
        })
        .catch((error) => {
          console.error("Error fetching artworks:", error);
        });
    }
  }, [dispatch, profileState?.data?.id]);

  // Show loading state if profile is not loaded yet
  if (!profileState) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  const { data: profile } = profileState;

  // If we don't have a profile ID, show an error
  if (!profile?.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">
            Error: No profile ID found. Please complete your profile first.
          </p>
        </div>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "date" ? value : value,
    }));
  };

  const handleMediumsChange = (mediumId: string) => {
    setFormData((prev) => ({
      ...prev,
      mediums: prev.mediums.includes(mediumId)
        ? prev.mediums.filter((id) => id !== mediumId)
        : [...prev.mediums, mediumId],
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({
        ...prev,
        images: Array.from(e.target.files || []),
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles([files[0]]);
      setPreviewUrls([URL.createObjectURL(files[0])]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditArtwork = (artwork: Artwork) => {
    // If we're already editing this artwork, cancel editing
    if (editingArtworkId === artwork.id) {
      setEditingArtworkId(null);
      setNewArtwork({
        title: "",
        medium: "",
        uom: "",
        height: 0,
        width: 0,
        date: new Date().toISOString().split("T")[0],
        description: "",
        images: [],
        price: 0,
      });
      setSelectedMediums([]);
      return;
    }

    // Otherwise, start editing
    setEditingArtworkId(artwork.id!);
    setNewArtwork(artwork);
    setSelectedUnits(artwork.uom); // Set the selected units to match the artwork's uom
    setSelectedMediums([artwork.medium]); // Set the selected medium to match the artwork's medium
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!profile?.id) {
      setError("No profile ID found. Please complete your profile first.");
      return;
    }

    if (!selectedFiles.length) {
      setError("Please select at least one image to upload.");
      return;
    }

    if (selectedMediums.length === 0) {
      setError("Please select at least one medium.");
      return;
    }

    if (
      !newArtwork.title ||
      !newArtwork.height ||
      !newArtwork.width ||
      !newArtwork.description ||
      !newArtwork.date
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoadingArtworkId(editingArtworkId || "new");
      const artworkInput = {
        title: newArtwork.title || "",
        medium: selectedMediums[0],
        uom: selectedUnits,
        date: newArtwork.date || new Date().toISOString().split("T")[0],
        description: newArtwork.description || "",
        artistId: profile.id,
        price: newArtwork.price || 0,
        height: newArtwork.height || 0,
        width: newArtwork.width || 0,
      };

      if (editingArtworkId) {
        // Update existing artwork
        const artworkRef = doc(db, "artworks", editingArtworkId);
        await updateDoc(artworkRef, {
          ...artworkInput,
          updatedAt: new Date().toISOString(),
        });

        // Update local state
        setArtworkList((prevList) =>
          prevList.map((artwork) =>
            artwork.id === editingArtworkId
              ? { ...artwork, ...artworkInput }
              : artwork
          )
        );

        toast.success("Artwork updated successfully");
        setEditingArtworkId(null);
      } else {
        // Create new artwork
        const result = await dispatch(
          uploadArtwork({
            artwork: artworkInput,
            images: selectedFiles,
          })
        ).unwrap();

        // Update local state
        setArtworkList((prevList) => [...prevList, result]);

        // Update profile with all artwork IDs
        const updatedArtworks = [...(artworkState?.data || []), result].map(
          (artwork) => artwork.id
        );

        await updateDoc(doc(db, "users", profile.id), {
          artworks: updatedArtworks,
          updatedAt: new Date().toISOString(),
        });

        // Refresh profile to get updated artworks array
        await dispatch(fetchUserProfile(profile.id));

        // If we have 3 or more artworks, we can complete this step
        if (updatedArtworks.length >= 3) {
          onComplete();
        }
      }

      // Reset form
      setNewArtwork({
        title: "",
        medium: "",
        uom: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        images: [],
        price: 0,
        height: 0,
        width: 0,
      });
      setSelectedFiles([]);
      setPreviewUrls([]);
      setShowAddForm(false);
      setSelectedMediums([]);
      setSelectedUnits("in");

      toast.success(
        editingArtworkId
          ? "Artwork updated successfully"
          : "Artwork uploaded successfully"
      );
    } catch (error: any) {
      console.error("Error uploading artwork:", error);
      setError(error.message || "Failed to upload artwork. Please try again.");
      toast.error(error.message || "Failed to upload artwork");
    } finally {
      setLoadingArtworkId(null);
    }
  };

  const handleComplete = async () => {
    if (!profileState?.data?.id) return;

    try {
      setLoadingArtworkId(null);
      await dispatch(completeOnboarding(profileState.data.id)).unwrap();
      toast.success("Onboarding completed successfully");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to complete onboarding");
    }
  };

  // Check if all required information is filled
  const basicInfoComplete = Boolean(
    profile?.name?.trim() && profile?.email?.trim() && profile?.bio?.trim()
  );

  const contactInfoComplete = Boolean(
    profile?.contactInfo?.phone?.trim() || profile?.contactInfo?.address?.trim()
  );

  const socialLinksComplete = Boolean(
    profile?.socialLinks &&
      Object.values(profile.socialLinks as Record<string, string>).some(
        (url) => url.trim() !== ""
      )
  );

  const artworksComplete = Boolean(
    profile?.artworks && profile.artworks.length >= 3
  );

  const isAllRequiredInfoComplete = Boolean(
    basicInfoComplete &&
      contactInfoComplete &&
      socialLinksComplete &&
      artworksComplete
  );

  const handleDeleteImage = async (artworkId: string, imageUrl: string) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      await dispatch(deleteArtworkImage({ artworkId, imageUrl })).unwrap();
      await refreshArtworks();
    } catch (error) {
      console.error("Error deleting image:", error);
      setError("Failed to delete image. Please try again.");
    }
  };

  const handleDeleteAllImages = async (artworkId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete all images for this artwork?"
      )
    ) {
      return;
    }

    try {
      await dispatch(
        deleteArtworkImage({ artworkId, deleteAll: true })
      ).unwrap();
      await refreshArtworks();
    } catch (error) {
      console.error("Error deleting all images:", error);
      setError("Failed to delete images. Please try again.");
    }
  };

  const handleAddImages = async (artworkId: string) => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    try {
      setLoadingArtworkId(artworkId);
      const result = await dispatch(
        addArtworkImages({ artworkId, images: selectedFiles })
      ).unwrap();

      // Update just this artwork in the local state
      setArtworkList((prevList) =>
        prevList.map((artwork) =>
          artwork.id === artworkId
            ? { ...artwork, images: result.images }
            : artwork
        )
      );

      toast.success("Images added successfully");
      setSelectedFiles([]);
      setPreviewUrls([]);
      setAddingImagesToArtworkId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to add images");
    } finally {
      setLoadingArtworkId(null);
    }
  };

  const getMediumName = (mediumId: string) => {
    const medium = mediums?.find((m) => m.id === mediumId);
    return medium?.name || mediumId;
  };

  // Add this before renderArtworkForm
  const isSaveDisabled = (isEditing: boolean) => {
    const isLoading =
      loadingArtworkId === (isEditing ? editingArtworkId : "new");
    return (
      isLoading ||
      !newArtwork.title ||
      !selectedMediums[0] ||
      (!isEditing && selectedFiles.length === 0) ||
      !newArtwork.height ||
      !newArtwork.width ||
      !newArtwork.description ||
      !newArtwork.date
    );
  };

  const renderArtworkForm = (artwork: Partial<Artwork>, isEditing = false) => {
    const isLoading = loadingArtworkId === (isEditing ? artwork.id : "new");

    return (
      <div className="bg-white p-6 rounded-lg shadow-md relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}
        <h4 className="text-lg font-semibold mb-4">
          {isEditing ? "Edit Artwork" : "Add New Artwork"}
        </h4>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (isEditing && artwork.id) {
              try {
                setLoadingArtworkId(artwork.id);
                const artworkRef = doc(db, "artworks", artwork.id);
                await updateDoc(artworkRef, {
                  ...newArtwork,
                  medium: selectedMediums[0],
                  updatedAt: new Date().toISOString(),
                  uom: selectedUnits,
                });
                toast.success("Artwork updated successfully");
                setEditingArtworkId(null);
                await refreshArtworks();
              } catch (error: any) {
                toast.error(error.message || "Failed to update artwork");
              } finally {
                setLoadingArtworkId(null);
              }
            } else {
              handleSubmit(e);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className={label}>Title</label>
            <input
              type="text"
              value={newArtwork.title}
              onChange={(e) =>
                setNewArtwork({ ...newArtwork, title: e.target.value })
              }
              className={input}
              required
            />
          </div>
          <div>
            <h4 className={h4}>Medium</h4>
            <select
              value={selectedMediums[0] || ""}
              onChange={(e) => setSelectedMediums([e.target.value])}
              className={select}
              required
            >
              <option value="" disabled>
                Select a medium
              </option>
              {mediums?.map((medium: Medium) => (
                <option key={medium.id} value={medium.id}>
                  {medium.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Height</label>
              <input
                type="number"
                value={newArtwork.height}
                onChange={(e) =>
                  setNewArtwork({
                    ...newArtwork,
                    height: e.target.valueAsNumber,
                  })
                }
                className={input}
                required
              />
            </div>
            <div>
              <label className={label}>Width</label>
              <input
                type="number"
                value={newArtwork.width}
                onChange={(e) =>
                  setNewArtwork({
                    ...newArtwork,
                    width: e.target.valueAsNumber,
                  })
                }
                className={input}
                required
              />
            </div>
            <div>
              <label className={label}>Units</label>
              <select
                value={selectedUnits}
                onChange={(e) => setSelectedUnits(e.target.value)}
                className={input}
              >
                {MEASUREMENT_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={label}>Creation Date</label>
            <input
              type="date"
              value={newArtwork.date}
              onChange={(e) =>
                setNewArtwork({ ...newArtwork, date: e.target.value })
              }
              className={input}
              required
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div>
            <label className={label}>Description</label>
            <textarea
              value={newArtwork.description}
              onChange={(e) =>
                setNewArtwork({ ...newArtwork, description: e.target.value })
              }
              className={textarea}
              rows={3}
              required
            />
          </div>
          <div>
            <label className={label}>Price (USD)</label>
            <NumericFormat
              value={newArtwork.price}
              onValueChange={(values) => {
                setNewArtwork({
                  ...newArtwork,
                  price: values.floatValue || 0,
                });
              }}
              thousandSeparator=","
              decimalSeparator="."
              prefix="$"
              decimalScale={2}
              fixedDecimalScale
              className={input}
              placeholder="0.00"
            />
          </div>
          {!isEditing && (
            <div>
              <label className={label}>Images</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              </div>
              {previewUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <div className="bg-gray-100 rounded-lg p-2">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="h-64 w-full object-contain rounded-lg"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddForm((prev) => !prev);
                setNewArtwork({
                  title: "",
                  medium: "",
                  uom: "",
                  date: new Date().toISOString().split("T")[0],
                  description: "",
                  images: [],
                  price: 0,
                  height: 0,
                  width: 0,
                });
                setSelectedFiles([]);
                setPreviewUrls([]);
                setSelectedMediums([]);
                setSelectedUnits("in");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaveDisabled(isEditing)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? "Updating..." : "Saving..."}
                </span>
              ) : isEditing ? (
                "Update Artwork"
              ) : (
                "Save Artwork"
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderAddImagesForm = (artworkId: string) => {
    const artwork = artworkList.find((a) => a.id === artworkId);
    const isLoading = loadingArtworkId === artworkId;

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Add Images</h3>
        <div className="space-y-4">
          {artwork && artwork.images && artwork.images.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-1">Current Image:</p>
              <div className="bg-gray-100 rounded-lg p-2 relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                )}
                <img
                  src={artwork.images[0]}
                  alt={artwork.title}
                  className="h-64 w-full object-contain rounded-lg"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Images
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Upload files</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            </div>
            {previewUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <div className="bg-gray-100 rounded-lg p-2">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="h-64 w-full object-contain rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={() => handleAddImages(artworkId)}
              disabled={isLoading || selectedFiles.length === 0}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                isLoading || selectedFiles.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </span>
              ) : (
                "Add Images"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleDeleteArtwork = async (artworkId: string) => {
    try {
      setLoadingArtworkId(artworkId);
      await dispatch(deleteArtwork(artworkId)).unwrap();

      // Update local state
      setArtworkList((prevList) =>
        prevList.filter((artwork) => artwork.id !== artworkId)
      );

      toast.success("Artwork deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete artwork");
    } finally {
      setLoadingArtworkId(null);
    }
  };

  const refreshArtworks = async () => {
    if (profileState?.data?.id) {
      try {
        setLoadingArtworkId("refresh");
        const artworks = await dispatch(
          fetchArtistArtworks(profileState.data.id)
        ).unwrap();
        if (artworks) {
          const formattedArtworks = artworks
            .map((artwork) => ({
              ...artwork,
              date: artwork.date || new Date().toISOString().split("T")[0],
            }))
            .sort((a, b) => {
              const dateA = new Date(a.updatedAt || a.date).getTime();
              const dateB = new Date(b.updatedAt || b.date).getTime();
              return dateB - dateA; // Sort in descending order (newest first)
            });
          setArtworkList(formattedArtworks);
        }
      } catch (error) {
        console.error("Error refreshing artworks:", error);
      } finally {
        setLoadingArtworkId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Artworks</h2>
        <button
          onClick={() => {
            setShowAddForm((prev) => !prev);
            setNewArtwork({
              title: "",
              medium: "",
              uom: "",
              date: new Date().toISOString().split("T")[0],
              description: "",
              images: [],
              price: 0,
              height: 0,
              width: 0,
            });
            setSelectedFiles([]);
            setPreviewUrls([]);
            setSelectedMediums([]);
            setSelectedUnits("in");
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Add New Artwork
        </button>
      </div>

      {showAddForm && renderArtworkForm(newArtwork)}

      {artworkList.map((artwork) => (
        <div key={artwork.id} className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start">
              {artwork.images && artwork.images[0] && (
                <img
                  src={artwork.images[0]}
                  alt={artwork.title}
                  className="w-16 h-16 rounded-full object-cover mr-4 border border-gray-200 shadow-sm"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold">{artwork.title}</h3>
                <p className="text-gray-600">{getMediumName(artwork.medium)}</p>
                <p className="text-sm text-gray-500">{artwork.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Created: {new Date(artwork.date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAddingImagesToArtworkId((prev) =>
                    prev === artwork.id ? null : artwork.id!
                  );
                }}
                disabled={
                  artwork.showStatus === "shown" ||
                  artwork.showStatus === "accepted"
                }
                className={`px-3 py-1 text-sm ${
                  artwork.showStatus === "shown" ||
                  artwork.showStatus === "accepted"
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-indigo-600 hover:text-indigo-900"
                }`}
              >
                Add Images
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditArtwork(artwork);
                }}
                disabled={
                  artwork.showStatus === "shown" ||
                  artwork.showStatus === "accepted"
                }
                className={`px-3 py-1 text-sm ${
                  artwork.showStatus === "shown" ||
                  artwork.showStatus === "accepted"
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-indigo-600 hover:text-indigo-900"
                }`}
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteArtwork(artwork.id!);
                }}
                disabled={
                  artwork.showStatus === "shown" ||
                  artwork.showStatus === "accepted"
                }
                className={`px-3 py-1 text-sm ${
                  artwork.showStatus === "shown" ||
                  artwork.showStatus === "accepted"
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-red-600 hover:text-red-900"
                }`}
              >
                Delete
              </button>
              {artwork.showStatus && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    artwork.showStatus === "shown"
                      ? "bg-yellow-100 text-yellow-800"
                      : artwork.showStatus === "accepted"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {artwork.showStatus}
                </span>
              )}
            </div>
          </div>
          {addingImagesToArtworkId === artwork.id &&
            renderAddImagesForm(artwork.id!)}
          {editingArtworkId === artwork.id && renderArtworkForm(artwork, true)}
        </div>
      ))}

      <div className="flex justify-end">
        {/* <button
          onClick={handleComplete}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Complete
        </button> */}
      </div>
    </div>
  );
};

export default ArtworkUpload;
