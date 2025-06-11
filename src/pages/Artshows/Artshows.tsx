import { useState, useEffect, useMemo } from "react";
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
    startDate: "",
    endDate: "",
    mediums: [],
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

  const handleMediumsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMediums = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setFormData((prev) => ({
      ...prev,
      mediums: selectedMediums,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
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
          createdAt: editingArtshow.createdAt,
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
        startDate: "",
        endDate: "",
        mediums: [],
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
    setFormData(artshow);
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
    if (
      window.confirm(
        "Are you sure you want to close this art show? This action cannot be undone."
      )
    ) {
      try {
        await dispatch(closeShow(id)).unwrap();
        dispatch(fetchArtshows());
      } catch (error) {
        console.error("Error closing art show:", error);
      }
    }
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
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Add New Show
          </button>
        </div>

        {/* Art Show Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
              <h2 className="text-xl font-bold mb-4">
                {editingArtshow ? "Edit Art Show" : "Add New Art Show"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Artshow Image Upload */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden bg-gray-200">
                    {previewUrl || formData.photoUrl ? (
                      <img
                        src={previewUrl || formData.photoUrl || ""}
                        alt="Artshow"
                        className="w-full h-full object-cover"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mediums
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {mediums
                      ?.filter((medium) => medium.active)
                      .map((medium) => (
                        <div key={medium.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`medium-${medium.id}`}
                            checked={formData.mediums.includes(medium.id!)}
                            onChange={(e) => {
                              const newMediums = e.target.checked
                                ? [...formData.mediums, medium.id!]
                                : formData.mediums.filter(
                                    (id) => id !== medium.id
                                  );
                              setFormData((prev) => ({
                                ...prev,
                                mediums: newMediums,
                              }));
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={isSubmitting}
                          />
                          <label
                            htmlFor={`medium-${medium.id}`}
                            className="ml-2 block text-sm text-gray-900"
                          >
                            {medium.name}
                          </label>
                        </div>
                      ))}
                  </div>
                  {formData.mediums.length === 0 && (
                    <p className="mt-1 text-sm text-red-500">
                      Please select at least one medium
                    </p>
                  )}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
              <div className="relative">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() =>
                    document
                      .getElementById("status-dropdown")
                      ?.classList.toggle("hidden")
                  }
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
                <div
                  id="status-dropdown"
                  className="z-10 hidden absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow"
                >
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
              </div>

              {/* Location Filter */}
              <div className="relative">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() =>
                    document
                      .getElementById("location-dropdown")
                      ?.classList.toggle("hidden")
                  }
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
                <div
                  id="location-dropdown"
                  className="z-10 hidden absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow max-h-60 overflow-y-auto"
                >
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
              </div>

              {/* Date Range Filter */}
              <div className="relative">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-100"
                  onClick={() =>
                    document
                      .getElementById("date-dropdown")
                      ?.classList.toggle("hidden")
                  }
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
                <div
                  id="date-dropdown"
                  className="z-10 hidden absolute w-full mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow p-4"
                >
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

        {/* Art Shows Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredArtshows.length === 0 ? (
            <div className="p-8 text-center">
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Artists
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Artworks
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredArtshows.map((artshow: Artshow) => (
                    <tr key={artshow.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {artshow.name}
                        </div>
                        <div className="text-sm text-gray-500 md:hidden">
                          {new Date(artshow.startDate).toLocaleDateString()} -{" "}
                          {new Date(artshow.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(artshow.startDate).toLocaleDateString()} -{" "}
                          {new Date(artshow.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {locations?.find(
                            (loc) => loc.id === artshow.locationId
                          )?.name || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            artshow.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {artshow.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/artshows/${artshow.id}/artists`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {artshow.artistIds?.length || 0} artists
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/artshows/${artshow.id}/artworks`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {artshow.artworkIds?.length || 0} artworks
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {artshow.status === "active" && (
                          <button
                            onClick={() =>
                              artshow.id && handleCloseShow(artshow.id)
                            }
                            className="text-yellow-600 hover:text-yellow-900 mr-4"
                            disabled={isSubmitting}
                          >
                            Close Show
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(artshow)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          disabled={isSubmitting}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </ContentWrapper>
    </div>
  );
};

export default Artshows;
