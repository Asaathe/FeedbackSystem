import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { InputField } from "../ui/input-field";
import { SelectField } from "../ui/select-field";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";  

interface CourseSection {
  id: number;
  value: string;
  label: string;
  category: string;
  subcategory: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CourseFormData {
  value: string;
  label: string;
  category: string;
  subcategory: string;
  is_active: boolean;
}

export function CourseManagement() {
  const [courses, setCourses] = useState<CourseSection[]>([]);
  const [editingCourse, setEditingCourse] = useState<CourseSection | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    value: "",
    label: "",
    category: "",
    subcategory: "",
    is_active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const categories = ["Grade 11", "Grade 12", "College"];
  const subcategories = [
    "ABM",
    "HUMSS",
    "STEM",
    "ICT",
    "BSIT",
    "BSBA",
    "BSCS",
    "BSEN",
    "BSOA",
    "BSAIS",
    "BTVTEd",
  ];

  // Fetch courses
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch("/api/admin/courses/sections", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();
      if (data.success) {
        setCourses(data.courses);
      } else {
        toast.error("Failed to load courses", {
          description: data.message || "Please try again later.",
        });
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Error loading courses", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem("authToken");
      const url = editingCourse
        ? `/api/admin/courses/sections/${editingCourse.id}`
        : "/api/admin/courses/sections";
      const method = editingCourse ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save course");
      }

      toast.success(
        editingCourse ? "Course updated successfully!" : "Course added successfully!"
      );
      fetchCourses();
      resetForm();
    } catch (error: any) {
      console.error("Error saving course:", error);
      toast.error("Failed to save course", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (course: CourseSection) => {
    setEditingCourse(course);
    setFormData({
      value: course.value,
      label: course.label,
      category: course.category,
      subcategory: course.subcategory || "",
      is_active: course.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course?")) {
      return;
    }

    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(`/api/admin/courses/sections/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete course");
      }

      toast.success("Course deleted successfully!");
      fetchCourses();
    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course", {
        description: error.message || "Please try again.",
      });
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(
        `/api/admin/courses/sections/${id}/toggle`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to toggle status");
      }

      toast.success("Course status updated successfully!");
      fetchCourses();
    } catch (error: any) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status", {
        description: error.message || "Please try again.",
      });
    }
  };

  const resetForm = () => {
    setEditingCourse(null);
    setFormData({
      value: "",
      label: "",
      category: "",
      subcategory: "",
      is_active: true,
    });
  };

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory
      ? course.category === filterCategory
      : true;
    const matchesStatus = filterStatus
      ? (filterStatus === "active" && course.is_active) ||
        (filterStatus === "inactive" && !course.is_active)
      : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory, filterStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
        <p className="text-gray-600 mt-1">
          Manage course-year and section combinations for student registration
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Total Courses</div>
          <div className="text-2xl font-bold text-gray-900">
            {courses.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Active Courses</div>
          <div className="text-2xl font-bold text-green-600">
            {courses.filter((c) => c.is_active).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Inactive Courses</div>
          <div className="text-2xl font-bold text-red-600">
            {courses.filter((c) => !c.is_active).length}
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {editingCourse ? "Edit Course Section" : "Add New Course Section"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Value (e.g., BSIT-1A)"
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              type="text"
              placeholder="Enter unique identifier"
              required
            />
            <InputField
              label="Display Label"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              type="text"
              placeholder="Enter display label"
              required
            />
            <SelectField
              label="Category"
              value={formData.category}
              onChange={(value) =>
                setFormData({ ...formData, category: value })
              }
              options={categories.map((c) => ({ value: c, label: c }))}
              placeholder="Select category"
              required
            />
            <SelectField
              label="Subcategory"
              value={formData.subcategory}
              onChange={(value) =>
                setFormData({ ...formData, subcategory: value })
              }
              options={subcategories.map((s) => ({ value: s, label: s }))}
              placeholder="Select subcategory (optional)"
            />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active (visible in signup form)
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingCourse
                ? "Update Course"
                : "Add Course"}
            </Button>
            {editingCourse && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by value or label..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No courses found. Add your first course section above.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Label
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subcategory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {course.value}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {course.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {course.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {course.subcategory || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(course.id)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            course.is_active
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {course.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEdit(course)}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(course.id)}
                            className="text-xs"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 px-6 py-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      const start = Math.max(1, currentPage - 2);
                      const end = Math.min(totalPages, currentPage + 2);
                      return page >= start && page <= end;
                    })
                    .map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {page}
                      </Button>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
