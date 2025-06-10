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
import { fetchMediums, Medium } from "../../features/mediumsSlice";
import ContentWrapper from "../../components/ContentWrapper";
import { formClasses } from "../../classes/tailwindClasses";
const Mediums = () => {
  const dispatch = useAppDispatch();
  const {
    data: mediums,
    loading,
    error,
  } = useAppSelector((state) => state.mediums);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMedium, setEditingMedium] = useState<Medium | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<Medium, "createdAt">>({
    name: "",
    description: "",
    active: true,
  });
  const { h1ReverseDark } = formClasses;
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const mediumData = {
        ...formData,
        createdAt: Timestamp.now(),
      };

      if (editingMedium?.id) {
        // Update existing medium
        await updateDoc(doc(db, "mediums", editingMedium.id), mediumData);
      } else {
        // Create new medium
        await addDoc(collection(db, "mediums"), mediumData);
      }
      setIsFormOpen(false);
      setEditingMedium(null);
      setFormData({
        name: "",
        description: "",
        active: true,
      });
      // Refresh mediums list
      dispatch(fetchMediums());
    } catch (error) {
      console.error("Error saving medium:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (medium: Medium) => {
    setEditingMedium(medium);
    setFormData(medium);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this medium?")) {
      try {
        await deleteDoc(doc(db, "mediums", id));
        // Refresh mediums list
        dispatch(fetchMediums());
      } catch (error) {
        console.error("Error deleting medium:", error);
      }
    }
  };

  const handleToggleActive = async (medium: Medium) => {
    try {
      await updateDoc(doc(db, "mediums", medium.id!), {
        active: !medium.active,
      });
      // Refresh mediums list
      dispatch(fetchMediums());
    } catch (error) {
      console.error("Error toggling medium status:", error);
    }
  };

  // Only show loading state on initial load
  if (loading && !mediums) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="flex justify-between items-center mb-6">
        <h1 className={h1ReverseDark}>Art Mediums</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Add New Medium
        </button>
      </div>

      {/* Medium Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {editingMedium ? "Edit Medium" : "Add New Medium"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      active: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isSubmitting}
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingMedium(null);
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
                    : editingMedium
                    ? "Update"
                    : "Create"}{" "}
                  Medium
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mediums Table */}
      <ContentWrapper
        loading={loading}
        type="table"
        tableProps={{
          rows: 5,
          columns: 3,
          showHeader: true,
          showActions: true,
        }}
      >
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {mediums.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Mediums Found
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by adding your first art medium.
              </p>
              <button
                onClick={() => setIsFormOpen(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Add Your First Medium
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
                      Description
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
                  {mediums.map((medium: Medium) => (
                    <tr key={medium.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {medium.name}
                        </div>
                        <div className="text-sm text-gray-500 md:hidden">
                          {medium.description}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {medium.description || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(medium)}
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            medium.active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {medium.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(medium)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          disabled={isSubmitting}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => medium.id && handleDelete(medium.id)}
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

export default Mediums;
