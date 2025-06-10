import { useState, useEffect } from "react";
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
import { fetchArtshows, Artshow } from "../../features/artshowsSlice";
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
        // If replacing photo, remove old one
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
      // Refresh artshows list
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
        // Refresh artshows list
        dispatch(fetchArtshows());
      } catch (error) {
        console.error("Error deleting art show:", error);
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

        {/* Art Shows Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {artshows.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Art Shows Found
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by adding your first art show.
              </p>
              <button
                onClick={() => setIsFormOpen(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Add Your First Show
              </button>
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {artshows.map((artshow: Artshow) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(artshow)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          disabled={isSubmitting}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => artshow.id && handleDelete(artshow.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={isSubmitting}
                        >
                          Delete
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
