import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { InputField } from "../ui/input-field";
import { SelectField } from "../ui/select-field";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import { toast } from "sonner";
import {
  Search,
  Edit,
  Trash2,
  BookOpen,
  Loader2,
  Plus,
  BookText,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../../services/subjectService";

interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  department: string;
  units: number;
  description: string;
  status: string;
  enrolled_count?: number;
  instructor_count?: number;
}

interface SubjectManagementProps {
  onNavigate?: (page: string) => void;
}

export function SubjectManagement({ onNavigate }: SubjectManagementProps = {}) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form states
  const [formData, setFormData] = useState({
    subject_code: "",
    subject_name: "",
    department: "",
    units: 3,
    description: "",
    status: "active",
  });
   
  // Edit/Delete states
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [editFormData, setEditFormData] = useState({
    subject_code: "",
    subject_name: "",
    department: "",
    units: 3,
    description: "",
    status: "active",
  });
   
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);

const departments = ["College", "Senior High"];

  // Calculate stats
  const stats = useMemo(() => {
    const total = subjects.length;
    const active = subjects.filter(s => s.status === 'active').length;
    const inactive = subjects.filter(s => s.status === 'inactive').length;
    return { total, active, inactive };
  }, [subjects]);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const result = await getSubjects(searchQuery);
      if (result.success) {
        setSubjects(result.subjects || []);
      } else {
        toast.error(result.message || "Failed to load subjects");
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadSubjects();
    setCurrentPage(1); // Reset to first page on search
  };

  const handleCreateSubject = async () => {
    if (!formData.subject_code.trim() || !formData.subject_name.trim()) {
      toast.error("Subject code and name are required");
      return;
    }

    setSaving(true);
    try {
      const result = await createSubject(formData);
      if (result.success) {
        toast.success("Subject created successfully");
        setFormData({
          subject_code: "",
          subject_name: "",
          department: "",
          units: 3,
          description: "",
          status: "active",
        });
        loadSubjects();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error creating subject:", error);
      toast.error("Failed to create subject");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSubject = async () => {
    if (!editSubject) return;
     
    if (!editFormData.subject_code.trim() || !editFormData.subject_name.trim()) {
      toast.error("Subject code and name are required");
      return;
    }

    setSaving(true);
    try {
      const result = await updateSubject(editSubject.id.toString(), editFormData);
      if (result.success) {
        toast.success("Subject updated successfully");
        setEditSubject(null);
        loadSubjects();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      toast.error("Failed to update subject");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;

    setSaving(true);
    try {
      const result = await deleteSubject(subjectToDelete.id.toString());
      if (result.success) {
        toast.success("Subject deleted successfully");
        setSubjectToDelete(null);
        loadSubjects();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error("Failed to delete subject");
    } finally {
      setSaving(false);
    }
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.subject_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (subject.department && subject.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
  const paginatedSubjects = filteredSubjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Full page skeleton loading
  if (loading && subjects.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100 mb-6">
          <div className="h-8 bg-green-200 rounded animate-pulse mb-2 w-48"></div>
          <div className="h-4 bg-green-100 rounded animate-pulse w-64"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-green-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-12"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add/Edit Form Skeleton */}
        <Card className="border-green-100 mb-6">
          <CardContent className="p-6">
            <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-40"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                  <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search Skeleton */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="h-10 bg-gray-100 rounded animate-pulse w-full"></div>
          </div>
          <div className="h-10 bg-gray-100 rounded animate-pulse w-24"></div>
        </div>

        {/* Table Skeleton */}
        <Card className="border-green-100">
          <CardContent className="p-0">
            <div className="space-y-0">
              {/* Table Header */}
              <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
              {/* Table Rows */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b">
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100 mb-6">
        <h2 className="text-2xl">Subject Management</h2>
        <p className="text-gray-600 mt-1">Manage master data for subjects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BookText className="w-4 h-4" />
              Total Subjects
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {stats.total}
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Active Subjects
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {stats.active}
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <XCircle className="w-4 h-4 text-red-600" />
              Inactive Subjects
            </div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {stats.inactive}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form - Always Visible */}
      <Card className="border-green-100 mb-6">
        <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-4">
          {editSubject ? "Edit Subject" : "Add New Subject"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Subject Code *"
            value={editSubject ? editFormData.subject_code : formData.subject_code}
            onChange={(e) => editSubject 
              ? setEditFormData({ ...editFormData, subject_code: e.target.value })
              : setFormData({ ...formData, subject_code: e.target.value })
            }
            type="text"
            placeholder="e.g., CS101"
          />
          <InputField
            label="Subject Name *"
            value={editSubject ? editFormData.subject_name : formData.subject_name}
            onChange={(e) => editSubject
              ? setEditFormData({ ...editFormData, subject_name: e.target.value })
              : setFormData({ ...formData, subject_name: e.target.value })
            }
            type="text"
            placeholder="e.g., Introduction to CS"
          />
          <SelectField
            label="Department"
            value={editSubject ? editFormData.department : formData.department}
            onChange={(value) => editSubject
              ? setEditFormData({ ...editFormData, department: value })
              : setFormData({ ...formData, department: value })
            }
            options={departments.map(d => ({ value: d, label: d }))}
            placeholder="Select department"
          />
          <InputField
            label="Units"
            value={String(editSubject ? editFormData.units : formData.units)}
            onChange={(e) => editSubject
              ? setEditFormData({ ...editFormData, units: parseInt(e.target.value) || 3 })
              : setFormData({ ...formData, units: parseInt(e.target.value) || 3 })
            }
            type="number"
            placeholder="e.g., 3"
          />
          <SelectField
            label="Status"
            value={editSubject ? editFormData.status : formData.status}
            onChange={(value) => editSubject
              ? setEditFormData({ ...editFormData, status: value })
              : setFormData({ ...formData, status: value })
            }
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            placeholder="Select status"
          />
          <div className="flex items-end">
            {editSubject ? (
              <div className="flex gap-2 w-full">
                <Button onClick={handleUpdateSubject} disabled={saving} className="bg-green-600 hover:bg-green-700 flex-1">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditSubject(null);
                  setEditFormData({
                    subject_code: "",
                    subject_name: "",
                    department: "",
                    units: 3,
                    description: "",
                    status: "active",
                  });
                }}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={handleCreateSubject} disabled={saving} className="bg-green-600 hover:bg-green-700 w-full">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Subject
              </Button>
            )}
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} variant="outline">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Subjects Table */}
      <Card className="border-green-100">
        <CardContent className="p-0">
          <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Code</TableHead>
              <TableHead className="font-semibold">Subject Name</TableHead>
              <TableHead className="font-semibold">Department</TableHead>
              <TableHead className="font-semibold">Units</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                </TableCell>
              </TableRow>
            ) : filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No subjects found. Add a subject using the form above.
                </TableCell>
              </TableRow>
            ) : (
              paginatedSubjects.map((subject) => (
                <TableRow key={subject.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-green-600" />
                      {subject.subject_code || '-'}
                    </div>
                  </TableCell>
                  <TableCell>{subject.subject_name || '-'}</TableCell>
                  <TableCell>{subject.department || '-'}</TableCell>
                  <TableCell>{subject.units}</TableCell>
                  <TableCell>
                    <Badge className={subject.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {subject.status || 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditSubject(subject);
                          setEditFormData({
                            subject_code: subject.subject_code,
                            subject_name: subject.subject_name,
                            department: subject.department || "",
                            units: subject.units,
                            description: subject.description || "",
                            status: subject.status,
                          });
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSubjectToDelete(subject)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 px-6 py-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>

      {/* Delete Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Delete Subject</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{subjectToDelete.subject_name}</strong> ({subjectToDelete.subject_code})?
            </p>
            <p className="text-red-500 text-sm mb-4">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSubjectToDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteSubject} disabled={saving} className="bg-red-600 hover:bg-red-700">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubjectManagement;

