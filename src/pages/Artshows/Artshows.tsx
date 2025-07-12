import { useState, useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/storeHook";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  fetchArtshows,
  Artshow,
  closeShow,
} from "../../features/artshowsSlice";
import { fetchLocations } from "../../features/locationsSlice";
import ContentWrapper from "../../components/ContentWrapper";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { formClasses } from "../../classes/tailwindClasses";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { compressImageTo250KB } from "../../utils/imageCompression";

interface FilterState {
  search: string;
  statuses: string[];
  locations: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

const Artshows = () => {
  const dispatch = useAppDispatch();
  const {
    data: artshows,
    loading,
    error,
  } = useAppSelector((state) => state.artshows);
  const { data: locations } = useAppSelector((state) => state.locations);
  const { data: mediums } = useAppSelector((state) => state.mediums);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArtshow, setEditingArtshow] = useState<Artshow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<Artshow, "createdAt">>({
    name: "",
    subTitle: "",
    startDate: "",
    endDate: "",
    locationId: "",
    description: "",
    status: "active",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const storage = getStorage();
  const { h1ReverseDark } = formClasses;
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    statuses: [],
    locations: [],
    dateRange: {
      start: "",
      end: "",
    },
  });
  const [previewArtshow, setPreviewArtshow] = useState<Artshow | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Dropdown state and refs
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handlers for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
      }
    }
    if (isStatusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isStatusDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLocationDropdownOpen(false);
      }
    }
    if (isLocationDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLocationDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDateDropdownOpen(false);
      }
    }
    if (isDateDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDateDropdownOpen]);

  const filteredArtshows = useMemo(() => {
    return artshows
      .filter((artshow) => {
        if (
          filters.search &&
          !artshow.name.toLowerCase().includes(filters.search.toLowerCase())
        ) {
          return false;
        }

        if (
          filters.statuses.length > 0 &&
          !filters.statuses.includes(artshow.status)
        ) {
          return false;
        }

        if (
          filters.locations.length > 0 &&
          !filters.locations.includes(artshow.locationId)
        ) {
          return false;
        }

        if (filters.dateRange.start && filters.dateRange.end) {
          const showStartDate = new Date(artshow.startDate);
          const showEndDate = new Date(artshow.endDate);
          const filterStartDate = new Date(filters.dateRange.start);
          const filterEndDate = new Date(filters.dateRange.end);

          if (showStartDate < filterStartDate || showEndDate > filterEndDate) {
            return false;
          }
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
  }, [artshows, filters]);

  useEffect(() => {
    dispatch(fetchArtshows());
    dispatch(fetchLocations());
  }, [dispatch]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Show loading state
        setPhotoLoading(true);

        // Compress the image to 250KB
        const compressedFile = await compressImageTo250KB(file);

        setSelectedFile(compressedFile);
        setPreviewUrl(URL.createObjectURL(compressedFile));
      } catch (error) {
        console.error("Error compressing image:", error);
        // Still allow the original file if compression fails
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      } finally {
        setPhotoLoading(false);
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!editingArtshow?.id && !formData.photoUrl) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    setPhotoLoading(true);
    try {
      if (formData.photoUrl) {
        const photoRef = ref(storage, formData.photoUrl);
        await deleteObject(photoRef);
      }
      if (editingArtshow?.id) {
        await updateDoc(doc(db, "artshows", editingArtshow.id), {
          photoUrl: null,
        });
      }
      setFormData((prev) => ({ ...prev, photoUrl: null }));
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Error removing photo:", error);
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleUploadPhoto = async (artshowId: string) => {
    if (!selectedFile) return null;
    setPhotoLoading(true);
    try {
      const storageRef = ref(
        storage,
        `artshow_photos/${artshowId}/${Date.now()}_${selectedFile.name}`
      );
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const url = await getDownloadURL(snapshot.ref);
      return url;
    } catch (error) {
      console.error("Error uploading photo:", error);
      return null;
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let photoUrl = formData.photoUrl || null;
      let artshowId = editingArtshow?.id;
      let artshowDocRef;
      if (editingArtshow?.id) {
        if (selectedFile && formData.photoUrl) {
          const oldPhotoRef = ref(storage, formData.photoUrl);
          await deleteObject(oldPhotoRef);
        }
        if (selectedFile) {
          photoUrl = await handleUploadPhoto(editingArtshow.id);
        }
        const artshowData = {
          ...formData,
          photoUrl,
          createdAt: Timestamp.fromDate(new Date(editingArtshow.createdAt)),
        };
        await updateDoc(doc(db, "artshows", editingArtshow.id), artshowData);
      } else {
        const artshowData = {
          ...formData,
          createdAt: Timestamp.now(),
          photoUrl: null,
        };
        artshowDocRef = await addDoc(collection(db, "artshows"), artshowData);
        artshowId = artshowDocRef.id;
        if (selectedFile) {
          photoUrl = await handleUploadPhoto(artshowId);
          await updateDoc(doc(db, "artshows", artshowId), { photoUrl });
        }
      }
      setIsFormOpen(false);
      setEditingArtshow(null);
      setFormData({
        name: "",
        subTitle: "",
        startDate: "",
        endDate: "",
        locationId: "",
        description: "",
        status: "active",
        photoUrl: null,
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      dispatch(fetchArtshows());
    } catch (error) {
      console.error("Error saving artshow:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (artshow: Artshow) => {
    setEditingArtshow(artshow);
    setFormData({
      name: artshow.name,
      subTitle: artshow.subTitle,
      startDate: artshow.startDate,
      endDate: artshow.endDate,
      locationId: artshow.locationId,
      description: artshow.description,
      status: artshow.status,
      photoUrl: artshow.photoUrl,
    });
    setPreviewUrl(artshow.photoUrl || null);
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this art show?")) {
      try {
        await deleteDoc(doc(db, "artshows", id));
        dispatch(fetchArtshows());
      } catch (error) {
        console.error("Error deleting art show:", error);
      }
    }
  };

  const handleCloseShow = async (id: string) => {
    if (window.confirm("Are you sure you want to close this show?")) {
      setIsSubmitting(true);
      try {
        await dispatch(closeShow(id)).unwrap();
      } catch (error) {
        console.error("Error closing show:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePreview = (artshow: Artshow) => {
    setPreviewArtshow(artshow);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewArtshow(null);
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <ContentWrapper loading={loading}>
        <div className="flex justify-between items-center mb-6">
          <h1 className={h1ReverseDark}>Art Shows</h1>
          <button
            onClick={() => {
              setIsFormOpen(true);
              setEditingArtshow(null);
              setFormData({
                name: "",
                subTitle: "",
                startDate: "",
                endDate: "",
                locationId: "",
                description: "",
                status: "active",
                photoUrl: null,
              });
              setPreviewUrl(null);
              setSelectedFile(null);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Add New Show
          </button>
        </div>

        {/* Art Show Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-2xl relative z-50 flex flex-col max-h-[90vh] mx-2">
              <h2 className="text-xl font-bold mb-4">
                {editingArtshow ? "Edit Art Show" : "Add New Art Show"}
              </h2>
              <div className="overflow-y-auto flex-1 min-h-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Artshow Image Upload */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden bg-gray-200">
                      {previewUrl || formData.photoUrl ? (
                        <img
                          src={previewUrl || formData.photoUrl || ""}
                          alt="Artshow"
                          className="w-full h-full object-contain bg-gray-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg
                            className="w-16 h-16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                      )}
                      {photoLoading && (
                        <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center">
                          <div className="loader" />
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                        {previewUrl || formData.photoUrl
                          ? "Change Photo"
                          : "Add Photo"}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={isSubmitting || photoLoading}
                        />
                      </label>
                      {(previewUrl || formData.photoUrl) && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          disabled={isSubmitting || photoLoading}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      name="subTitle"
                      value={formData.subTitle}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                      placeholder="e.g., Annual Abstract Exhibition"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <select
                      name="locationId"
                      value={formData.locationId}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">Select a location</option>
                      {locations?.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormOpen(false);
                        setEditingArtshow(null);
                      }}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? "Saving..."
                        : editingArtshow
                        ? "Update"
                        : "Create"}{" "}
                      Show
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="flex">
              <div className="relative w-full">
                <input
                  type="search"
                  id="search"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="block p-2.5 w-full z-20 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search art shows by name..."
                />
                <button
                  type="button"
                  className="absolute top-0 end-0 p-2.5 text-sm font-medium h-full text-white bg-blue-700 rounded-e-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
                >
                  <svg
                    className="w-4 h-4"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 20"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                    />
                  </svg>
                  <span className="sr-only">Search</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Grid */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div className="relative" ref={statusDropdownRef}>
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() => setIsStatusDropdownOpen((open) => !open)}
                >
                  Status
                  <svg
                    className="w-2.5 h-2.5 ms-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                {isStatusDropdownOpen && (
                  <div className="z-10 absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow">
                    <ul className="py-2 text-sm text-gray-700">
                      {["active", "inactive", "closed"].map((status) => (
                        <li key={status}>
                          <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.statuses.includes(status)}
                              onChange={(e) => {
                                setFilters((prev) => ({
                                  ...prev,
                                  statuses: e.target.checked
                                    ? [...prev.statuses, status]
                                    : prev.statuses.filter((s) => s !== status),
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 capitalize">{status}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Location Filter */}
              <div className="relative" ref={locationDropdownRef}>
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() => setIsLocationDropdownOpen((open) => !open)}
                >
                  Location
                  <svg
                    className="w-2.5 h-2.5 ms-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                {isLocationDropdownOpen && (
                  <div className="z-10 absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow max-h-60 overflow-y-auto">
                    <ul className="py-2 text-sm text-gray-700">
                      {locations?.map((location) => (
                        <li key={location.id}>
                          <label className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.locations.includes(location.id!)}
                              onChange={(e) => {
                                setFilters((prev) => ({
                                  ...prev,
                                  locations: e.target.checked
                                    ? [...prev.locations, location.id!]
                                    : prev.locations.filter(
                                        (id) => id !== location.id
                                      ),
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2">{location.name}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Date Range Filter */}
              <div className="relative" ref={dateDropdownRef}>
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() => setIsDateDropdownOpen((open) => !open)}
                >
                  Date Range
                  <svg
                    className="w-2.5 h-2.5 ms-2.5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 10 6"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 1 4 4 4-4"
                    />
                  </svg>
                </button>
                {isDateDropdownOpen && (
                  <div className="z-10 absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={filters.dateRange.start}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              dateRange: {
                                ...prev.dateRange,
                                start: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={filters.dateRange.end}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              dateRange: {
                                ...prev.dateRange,
                                end: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters and Clear Button */}
          {(filters.search ||
            filters.statuses.length > 0 ||
            filters.locations.length > 0 ||
            filters.dateRange.start ||
            filters.dateRange.end) && (
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Search: {filters.search}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, search: "" }))
                      }
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.statuses.map((status) => (
                  <span
                    key={status}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    Status: {status}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          statuses: prev.statuses.filter((s) => s !== status),
                        }))
                      }
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {filters.locations.map((locationId) => {
                  const location = locations?.find((l) => l.id === locationId);
                  return (
                    <span
                      key={locationId}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      Location: {location?.name}
                      <button
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            locations: prev.locations.filter(
                              (id) => id !== locationId
                            ),
                          }))
                        }
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
                {(filters.dateRange.start || filters.dateRange.end) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Date Range: {filters.dateRange.start} -{" "}
                    {filters.dateRange.end}
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: { start: "", end: "" },
                        }))
                      }
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
              <button
                onClick={() =>
                  setFilters({
                    search: "",
                    statuses: [],
                    locations: [],
                    dateRange: { start: "", end: "" },
                  })
                }
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Art Shows Card Grid */}
        <div className="max-w-7xl mx-auto">
          {filteredArtshows.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Art Shows Found
              </h3>
              <p className="text-gray-500 mb-4">
                {artshows.length === 0
                  ? "Get started by adding your first art show."
                  : "No shows match your current filters."}
              </p>
              {artshows.length === 0 && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Add Your First Show
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredArtshows.map((artshow: Artshow) => (
                <div
                  key={artshow.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
                  {/* Image */}
                  <div className="aspect-video bg-gray-200 relative">
                    {artshow.photoUrl ? (
                      <img
                        src={artshow.photoUrl}
                        alt={artshow.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg
                          className="w-12 h-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {artshow.name}
                    </h3>
                    {artshow.subTitle && (
                      <p className="text-sm text-gray-600 mb-3 italic">
                        {artshow.subTitle}
                      </p>
                    )}

                    {/* Status Badge */}
                    <div className="mb-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          artshow.status === "active"
                            ? "bg-green-100 text-green-800"
                            : artshow.status === "closed"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {artshow.status}
                      </span>
                    </div>

                    {/* Dates */}
                    <div className="text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1 mb-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="font-medium">Dates:</span>
                      </div>
                      <div className="pl-5">
                        {new Date(
                          artshow.startDate + "T00:00:00"
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(
                          artshow.endDate + "T00:00:00"
                        ).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1 mb-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="font-medium">Location:</span>
                      </div>
                      <div className="pl-5">
                        {locations?.find((loc) => loc.id === artshow.locationId)
                          ?.name || "Not specified"}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between text-sm text-gray-500 mb-4">
                      <span>{artshow.artistIds?.length || 0} artists</span>
                      <span>{artshow.artworkIds?.length || 0} artworks</span>
                    </div>

                    {/* Actions */}
                    {artshow.status !== "closed" && (
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handlePreview(artshow)}
                          className="w-full text-center text-orange-600 hover:text-orange-900 font-medium text-sm py-1 border border-orange-200 rounded hover:bg-orange-50 transition-colors"
                          disabled={isSubmitting}
                        >
                          Preview
                        </button>
                        {artshow.status === "active" && (
                          <button
                            onClick={() =>
                              artshow.id && handleCloseShow(artshow.id)
                            }
                            className="w-full text-center text-yellow-600 hover:text-yellow-900 font-medium text-sm py-1 border border-yellow-200 rounded hover:bg-yellow-50 transition-colors"
                            disabled={isSubmitting}
                          >
                            Close Show
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(artshow)}
                          className="w-full text-center text-blue-600 hover:text-blue-900 font-medium text-sm py-1 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                          disabled={isSubmitting}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ContentWrapper>

      {/* Preview Modal */}
      {isPreviewOpen && previewArtshow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Art Show Preview
                </h2>
                <button
                  onClick={closePreview}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
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

              <div className="space-y-6">
                {/* Photo */}
                {previewArtshow.photoUrl && (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={previewArtshow.photoUrl}
                      alt={previewArtshow.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Title and Subtitle */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {previewArtshow.name}
                  </h1>
                  {previewArtshow.subTitle && (
                    <p className="text-xl text-gray-600 italic">
                      {previewArtshow.subTitle}
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                <div>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      previewArtshow.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {previewArtshow.status.charAt(0).toUpperCase() +
                      previewArtshow.status.slice(1)}
                  </span>
                </div>

                {/* Dates */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Show Dates
                  </h3>
                  <div className="flex items-center gap-4 text-blue-800">
                    <div>
                      <span className="font-medium">Start:</span>{" "}
                      {new Date(
                        previewArtshow.startDate + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div>
                      <span className="font-medium">End:</span>{" "}
                      {new Date(
                        previewArtshow.endDate + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Location
                  </h3>
                  <p className="text-gray-700">
                    {locations?.find(
                      (loc) => loc.id === previewArtshow.locationId
                    )?.name +
                      " " +
                      locations?.find(
                        (loc) => loc.id === previewArtshow.locationId
                      )?.address || "Location not specified"}{" "}
                    {locations?.find(
                      (loc) => loc.id === previewArtshow.locationId
                    )?.city +
                      " " +
                      locations?.find(
                        (loc) => loc.id === previewArtshow.locationId
                      )?.state || "Location not specified"}
                  </p>
                </div>

                {/* Description */}
                {previewArtshow.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {previewArtshow.description}
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-900">
                      {previewArtshow.artistIds?.length || 0}
                    </div>
                    <div className="text-sm text-purple-700">Artists</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-900">
                      {previewArtshow.artworkIds?.length || 0}
                    </div>
                    <div className="text-sm text-orange-700">Artworks</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={closePreview}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closePreview();
                    handleEdit(previewArtshow);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit Show
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Artshows;
