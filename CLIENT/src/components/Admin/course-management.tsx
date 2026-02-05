import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { InputField } from "../ui/input-field";
import { SelectField } from "../ui/select-field";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Program {
  id: number;
  department: string;
  program_name: string;
  program_code: string;
  year_level: number;
  section: string;
  display_label: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ProgramFormData {
  department: string;
  program_name: string;
  program_code: string;
  year_level: string;
  section: string;
  status: string;
}

export function CourseManagement() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState<ProgramFormData>({
    department: "",
    program_name: "",
    program_code: "",
    year_level: "",
    section: "",
    status: "active",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const departments = ["College", "Senior High"];
  const yearLevels = ["1", "2", "3", "4", "11", "12"];

  // Fetch programs
  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch("/api/programs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch programs");
      }

      const data = await response.json();
      // DEBUG: Log the API response structure
      console.log("[DEBUG] API Response:", JSON.stringify(data, null, 2));
      console.log("[DEBUG] First program structure:", data.programs?.[0] ? JSON.stringify(data.programs[0], null, 2) : "No programs");
      if (data.success) {
        setPrograms(data.programs);
      } else {
        toast.error("Failed to load programs", {
          description: data.message || "Please try again later.",
        });
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast.error("Error loading programs", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // DEBUG: Log form data being submitted
    console.log("[DEBUG] Submitting form data:", JSON.stringify(formData, null, 2));
    console.log("[DEBUG] Editing program:", editingProgram ? `ID ${editingProgram.id}` : "NEW");

    try {
      const token = sessionStorage.getItem("authToken");
      const url = editingProgram
        ? `/api/programs/${editingProgram.id}`
        : "/api/programs";
      const method = editingProgram ? "PUT" : "POST";

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
        throw new Error(data.message || "Failed to save program");
      }

      toast.success(
        editingProgram ? "Program updated successfully!" : "Program added successfully!"
      );
      fetchPrograms();
      resetForm();
    } catch (error: any) {
      console.error("Error saving program:", error);
      toast.error("Failed to save program", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      department: program.department,
      program_name: program.program_name,
      program_code: program.program_code,
      year_level: String(program.year_level),
      section: program.section,
      status: program.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this program?")) {
      return;
    }

    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(`/api/programs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete program");
      }

      toast.success("Program deleted successfully!");
      fetchPrograms();
    } catch (error: any) {
      console.error("Error deleting program:", error);
      toast.error("Failed to delete program", {
        description: error.message || "Please try again.",
      });
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(
        `/api/programs/${id}/toggle`,
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

      toast.success("Program status updated successfully!");
      fetchPrograms();
    } catch (error: any) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status", {
        description: error.message || "Please try again.",
      });
    }
  };

  const resetForm = () => {
    setEditingProgram(null);
    setFormData({
      department: "",
      program_name: "",
      program_code: "",
      year_level: "",
      section: "",
      status: "active",
    });
  };

  // Filter programs
  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      program.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.display_label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment
      ? program.department === filterDepartment
      : true;
    const matchesStatus = filterStatus
      ? program.status === filterStatus
      : true;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDepartment, filterStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPrograms = filteredPrograms.slice(startIndex, endIndex);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Program Management</h1>
        <p className="text-gray-600 mt-1">
          Manage programs, year levels, and sections for student registration
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Total Programs</div>
          <div className="text-2xl font-bold text-gray-900">
            {/* Count distinct program names */}
            {new Set(programs.map((p) => p.program_name)).size}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Total Sections</div>
          <div className="text-2xl font-bold text-blue-600">
            {programs.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Active Sections</div>
          <div className="text-2xl font-bold text-green-600">
            {programs.filter((p) => p.status === "active").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Inactive Sections</div>
          <div className="text-2xl font-bold text-red-600">
            {programs.filter((p) => p.status === "inactive").length}
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {editingProgram ? "Edit Program" : "Add New Program"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SelectField
              label="Department"
              value={formData.department}
              onChange={(value) =>
                setFormData({ ...formData, department: value })
              }
              options={departments.map((d) => ({ value: d, label: d }))}
              placeholder="Select department"
              required
            />
            <InputField
              label="Program Name"
              value={formData.program_name}
              onChange={(e) =>
                setFormData({ ...formData, program_name: e.target.value })
              }
              type="text"
              placeholder="e.g., Bachelor of Science in Information Technology"
              required
            />
            <InputField
              label="Program Code"
              value={formData.program_code}
              onChange={(e) =>
                setFormData({ ...formData, program_code: e.target.value.toUpperCase() })
              }
              type="text"
              placeholder="e.g., BSIT"
              required
            />
            <SelectField
              label="Year Level"
              value={formData.year_level}
              onChange={(value) =>
                setFormData({ ...formData, year_level: value })
              }
              options={yearLevels.map((y) => ({ value: y, label: y }))}
              placeholder="Select year level"
              required
            />
            <InputField
              label="Section"
              value={formData.section}
              onChange={(e) =>
                setFormData({ ...formData, section: e.target.value.toUpperCase() })
              }
              type="text"
              placeholder="e.g., A"
              required
            />
            <SelectField
              label="Status"
              value={formData.status}
              onChange={(value) =>
                setFormData({ ...formData, status: value })
              }
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              placeholder="Select status"
              required
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingProgram
                ? "Update Program"
                : "Add Program"}
            </Button>
            {editingProgram && (
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
              placeholder="Search by program name or label..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
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

      {/* Programs Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading programs...</div>
        ) : filteredPrograms.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No programs found. Add your first program above.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Display Label
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
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
                  {paginatedPrograms.map((program) => (
                    <tr key={program.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {program.display_label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {program.program_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {program.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(program.id)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            program.status === "active"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {program.status === "active" ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEdit(program)}
                            className="text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(program.id)}
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
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
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
