import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  BookOpen, 
  Users, 
  UserPlus,
  UserMinus,
  MoreVertical,
  Loader2,
  GraduationCap,
  User,
  UsersRound,
  Check,
  X,
  School,
  ClipboardList,
  UserCircle
} from "lucide-react";
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectInstructors,
  assignInstructorToSubject,
  removeInstructorFromSubject,
  getSubjectStudents,
  enrollStudent,
  unenrollStudent,
  getAvailableStudents,
  getAvailableInstructors,
  getPrograms,
  getStudentsByProgram,
  bulkEnrollStudents,
} from "../../services/subjectService";

interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  department: string;
  units: number;
  description: string;
  status: string;
  enrolled_count: number;
  instructor_count: number;
}

interface Instructor {
  id: number;
  instructor_id: number;
  instructor_name: string;
  instructor_email: string;
  academic_year: string;
  semester: string;
}

interface Student {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  student_number: string;
  status: string;
  academic_year: string;
  semester: string;
}

interface Program {
  id: number;
  program_code: string;
  program_name: string;
  year_level: number;
  section: string;
  department: string;
}

interface ProgramStudent {
  user_id: number;
  full_name: string;
  email: string;
  studentID: string;
  program_id: number;
  year_level: number;
}

interface SubjectManagementProps {
  onNavigate?: (page: string) => void;
}

export function SubjectManagement({ onNavigate }: SubjectManagementProps = {}) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instructorDialogOpen, setInstructorDialogOpen] = useState(false);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  
  // For create dialog - allow selecting instructor immediately
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");
  const [availableInstructorsForCreate, setAvailableInstructorsForCreate] = useState<any[]>([]);
  
  // Selected items
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjectInstructors, setSubjectInstructors] = useState<Instructor[]>([]);
  const [subjectStudents, setSubjectStudents] = useState<Student[]>([]);
  const [availableInstructors, setAvailableInstructors] = useState<any[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  
  // Program-based selection states
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [programStudents, setProgramStudents] = useState<ProgramStudent[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [loadingProgramStudents, setLoadingProgramStudents] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    subject_code: "",
    subject_name: "",
    department: "",
    units: 3,
    description: "",
    status: "active",
  });
  
  const [saving, setSaving] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Academic year and semester defaults
  const currentAcademicYear = "2025-2026";
  const currentSemester = "1st";

  useEffect(() => {
    loadSubjects();
    loadPrograms();
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

  const loadPrograms = async () => {
    try {
      const result = await getPrograms();
      if (result.success) {
        setPrograms(result.programs || []);
      }
    } catch (error) {
      console.error("Error loading programs:", error);
    }
  };

  // Load available instructors when create dialog opens
  const handleOpenCreateDialog = async (open: boolean) => {
    setCreateDialogOpen(open);
    if (open) {
      try {
        const result = await getAvailableInstructors();
        if (result.success) {
          setAvailableInstructorsForCreate(result.instructors || []);
        }
      } catch (error) {
        console.error("Error loading instructors for create:", error);
      }
    } else {
      setSelectedInstructorId("");
      setAvailableInstructorsForCreate([]);
    }
  };

  const handleSearch = () => {
    loadSubjects();
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
        
        // If instructor is selected, assign them to the subject
        if (selectedInstructorId && result.subjectId) {
          const assignResult = await assignInstructorToSubject({
            subject_id: parseInt(result.subjectId),
            instructor_id: parseInt(selectedInstructorId),
            academic_year: currentAcademicYear,
            semester: currentSemester,
          });
          
          if (assignResult.success) {
            toast.success("Instructor assigned to subject");
          }
        }
        
        setCreateDialogOpen(false);
        resetForm();
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
    if (!selectedSubject) return;
    
    if (!formData.subject_code.trim() || !formData.subject_name.trim()) {
      toast.error("Subject code and name are required");
      return;
    }

    setSaving(true);
    try {
      const result = await updateSubject(selectedSubject.id.toString(), formData);
      if (result.success) {
        toast.success("Subject updated successfully");
        setEditDialogOpen(false);
        resetForm();
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
    if (!selectedSubject) return;

    setSaving(true);
    try {
      const result = await deleteSubject(selectedSubject.id.toString());
      if (result.success) {
        toast.success("Subject deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedSubject(null);
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

  const openEditDialog = (subject: Subject) => {
    setSelectedSubject(subject);
    setFormData({
      subject_code: subject.subject_code,
      subject_name: subject.subject_name,
      department: subject.department || "",
      units: subject.units,
      description: subject.description || "",
      status: subject.status,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (subject: Subject) => {
    setSelectedSubject(subject);
    setDeleteDialogOpen(true);
  };

  const openInstructorDialog = async (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedProgramId("");
    setLoadingDetails(true);
    setInstructorDialogOpen(true);
    
    try {
      const result = await getSubjectInstructors(subject.id.toString());
      if (result.success) {
        setSubjectInstructors(result.instructors || []);
      }
      
      // Load available instructors
      const instructorsResult = await getAvailableInstructors();
      if (instructorsResult.success) {
        setAvailableInstructors(instructorsResult.instructors || []);
      }
    } catch (error) {
      console.error("Error loading instructors:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openStudentDialog = async (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedProgramId("");
    setSelectedStudentIds([]);
    setLoadingDetails(true);
    setStudentDialogOpen(true);
    
    try {
      const result = await getSubjectStudents(subject.id.toString());
      if (result.success) {
        setSubjectStudents(result.students || []);
      }
      
      // Load available students
      const studentsResult = await getAvailableStudents();
      if (studentsResult.success) {
        setAvailableStudents(studentsResult.students || []);
      }
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Load program students when program is selected
  const handleProgramSelect = async (programId: string) => {
    setSelectedProgramId(programId);
    setSelectedStudentIds([]);
    setLoadingProgramStudents(true);
    
    try {
      const result = await getStudentsByProgram(programId, currentAcademicYear, currentSemester);
      if (result.success) {
        setProgramStudents(result.students || []);
      } else {
        toast.error("Failed to load program students");
      }
    } catch (error) {
      console.error("Error loading program students:", error);
    } finally {
      setLoadingProgramStudents(false);
    }
  };

  // Toggle student selection for bulk enrollment
  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select all students in program
  const selectAllProgramStudents = () => {
    const allStudentIds = programStudents.map(s => s.user_id);
    setSelectedStudentIds(allStudentIds);
  };

  // Deselect all students
  const deselectAllStudents = () => {
    setSelectedStudentIds([]);
  };

  const handleAssignInstructor = async (instructorId: string) => {
    if (!selectedSubject) return;
    
    try {
      const result = await assignInstructorToSubject({
        subject_id: selectedSubject.id,
        instructor_id: parseInt(instructorId),
        academic_year: currentAcademicYear,
        semester: currentSemester,
      });
      
      if (result.success) {
        toast.success("Instructor assigned successfully");
        // Refresh instructors list
        const refreshResult = await getSubjectInstructors(selectedSubject.id.toString());
        if (refreshResult.success) {
          setSubjectInstructors(refreshResult.instructors || []);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error assigning instructor:", error);
      toast.error("Failed to assign instructor");
    }
  };

  const handleRemoveInstructor = async (instructorId: string) => {
    if (!selectedSubject) return;
    
    try {
      const result = await removeInstructorFromSubject(instructorId);
      if (result.success) {
        toast.success("Instructor removed successfully");
        // Refresh instructors list
        const refreshResult = await getSubjectInstructors(selectedSubject.id.toString());
        if (refreshResult.success) {
          setSubjectInstructors(refreshResult.instructors || []);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error removing instructor:", error);
      toast.error("Failed to remove instructor");
    }
  };

  // Bulk enroll students by program
  const handleBulkEnrollByProgram = async () => {
    if (!selectedSubject || !selectedProgramId) return;
    
    if (selectedStudentIds.length === 0) {
      toast.error("Please select at least one student to enroll");
      return;
    }

    setSaving(true);
    try {
      const result = await bulkEnrollStudents({
        subject_id: selectedSubject.id,
        program_id: parseInt(selectedProgramId),
        academic_year: currentAcademicYear,
        semester: currentSemester,
      });
      
      if (result.success) {
        toast.success(`${selectedStudentIds.length} students enrolled successfully`);
        // Refresh students list
        const refreshResult = await getSubjectStudents(selectedSubject.id.toString());
        if (refreshResult.success) {
          setSubjectStudents(refreshResult.students || []);
        }
        setSelectedStudentIds([]);
        setSelectedProgramId("");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error bulk enrolling students:", error);
      toast.error("Failed to enroll students");
    } finally {
      setSaving(false);
    }
  };

  // Enroll individual student (for irregular students)
  const handleEnrollStudent = async (studentId: string) => {
    if (!selectedSubject) return;
    
    try {
      const result = await enrollStudent({
        subject_id: selectedSubject.id,
        student_id: parseInt(studentId),
        academic_year: currentAcademicYear,
        semester: currentSemester,
      });
      
      if (result.success) {
        toast.success("Student enrolled successfully");
        // Refresh students list
        const refreshResult = await getSubjectStudents(selectedSubject.id.toString());
        if (refreshResult.success) {
          setSubjectStudents(refreshResult.students || []);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error enrolling student:", error);
      toast.error("Failed to enroll student");
    }
  };

  const handleUnenrollStudent = async (studentId: string) => {
    if (!selectedSubject) return;
    
    try {
      const result = await unenrollStudent(studentId);
      if (result.success) {
        toast.success("Student unenrolled successfully");
        // Refresh students list
        const refreshResult = await getSubjectStudents(selectedSubject.id.toString());
        if (refreshResult.success) {
          setSubjectStudents(refreshResult.students || []);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error unenrolling student:", error);
      toast.error("Failed to unenroll student");
    }
  };

  const resetForm = () => {
    setFormData({
      subject_code: "",
      subject_name: "",
      department: "",
      units: 3,
      description: "",
      status: "active",
    });
    setSelectedSubject(null);
    setSelectedProgramId("");
    setSelectedStudentIds([]);
    setSelectedInstructorId("");
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.subject_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (subject.department && subject.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Subject Management</h2>
            <p className="text-gray-600 mt-1">Manage subjects, instructors, and student enrollments</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={handleOpenCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Subject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject_code">Subject Code *</Label>
                    <Input
                      id="subject_code"
                      value={formData.subject_code}
                      onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                      placeholder="e.g., CS101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="units">Units</Label>
                    <Input
                      id="units"
                      type="number"
                      value={formData.units}
                      onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) || 3 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject_name">Subject Name *</Label>
                  <Input
                    id="subject_name"
                    value={formData.subject_name}
                    onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                    placeholder="e.g., Introduction to Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Computer Studies"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Subject description..."
                  />
                </div>
                
                {/* Instructor Selection */}
                <div className="space-y-2">
                  <Label htmlFor="instructor">Assign Instructor (Optional)</Label>
                  <Select 
                    value={selectedInstructorId} 
                    onValueChange={setSelectedInstructorId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableInstructorsForCreate.map((instructor) => (
                        <SelectItem key={instructor.user_id} value={instructor.user_id.toString()}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                                {instructor.full_name?.charAt(0) || 'I'}
                              </AvatarFallback>
                            </Avatar>
                            {instructor.full_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">You can also assign instructors later from the subject details</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateSubject} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create Subject
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
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
          Search
        </Button>
      </div>

      {/* Subjects Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No subjects found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Instructors</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.subject_code}</TableCell>
                    <TableCell>{subject.subject_name}</TableCell>
                    <TableCell>{subject.department || '-'}</TableCell>
                    <TableCell>{subject.units}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openInstructorDialog(subject)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        {subject.instructor_count || 0}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openStudentDialog(subject)}
                      >
                        <Users className="w-4 h-4 mr-1" />
                        {subject.enrolled_count || 0}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={subject.status === 'active' ? 'default' : 'secondary'}>
                        {subject.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(subject)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDeleteDialog(subject)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_subject_code">Subject Code *</Label>
                <Input
                  id="edit_subject_code"
                  value={formData.subject_code}
                  onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_units">Units</Label>
                <Input
                  id="edit_units"
                  type="number"
                  value={formData.units}
                  onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) || 3 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_subject_name">Subject Name *</Label>
              <Input
                id="edit_subject_name"
                value={formData.subject_name}
                onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_department">Department</Label>
              <Input
                id="edit_department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateSubject} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete <strong>{selectedSubject?.subject_name}</strong>?</p>
            <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSubject} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Instructors Dialog with Program Selection */}
      <Dialog open={instructorDialogOpen} onOpenChange={setInstructorDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-green-600" />
              Manage Instructors - {selectedSubject?.subject_code}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="program" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="program" className="flex items-center gap-2">
                <School className="w-4 h-4" />
                By Program
              </TabsTrigger>
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Individual
              </TabsTrigger>
            </TabsList>
            
            {/* Program-based Instructor Assignment */}
            <TabsContent forceMount value="program" className="flex-1 overflow-hidden flex flex-col space-y-4">
              <div className="space-y-2">
                <Label>Select Program</Label>
                <Select onValueChange={handleProgramSelect} value={selectedProgramId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.program_code} - {program.program_name} (Year {program.year_level}-{program.section})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedProgramId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Available Instructors</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedProgramId("");
                        setInstructorDialogOpen(false);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign to Program
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Select a program first, then assign instructor to handle all students in that program
                  </p>
                </div>
              )}
              
              <div className="flex-1 overflow-y-auto space-y-2">
                <Label>Current Instructors</Label>
                {loadingDetails ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  </div>
                ) : subjectInstructors.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No instructors assigned</p>
                ) : (
                  <div className="space-y-2">
                    {subjectInstructors.map((instructor) => (
                      <div key={instructor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-green-100 text-green-600 text-sm">
                              {instructor.instructor_name?.charAt(0) || 'I'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{instructor.instructor_name}</p>
                            <p className="text-xs text-gray-500">{instructor.instructor_email}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveInstructor(instructor.id.toString())}
                        >
                          <UserMinus className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Individual Instructor Assignment */}
            <TabsContent forceMount value="individual" className="flex-1 overflow-hidden flex flex-col space-y-4">
              <div className="space-y-2">
                <Label>Assign Individual Instructor</Label>
                <Select onValueChange={handleAssignInstructor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInstructors
                      .filter(inst => !subjectInstructors.some(si => si.instructor_id === inst.user_id))
                      .map((instructor) => (
                        <SelectItem key={instructor.user_id} value={instructor.user_id.toString()}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                                {instructor.full_name?.charAt(0) || 'I'}
                              </AvatarFallback>
                            </Avatar>
                            {instructor.full_name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                <Label>Current Instructors</Label>
                {loadingDetails ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  </div>
                ) : subjectInstructors.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No instructors assigned</p>
                ) : (
                  <div className="space-y-2">
                    {subjectInstructors.map((instructor) => (
                      <div key={instructor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-green-100 text-green-600 text-sm">
                              {instructor.instructor_name?.charAt(0) || 'I'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{instructor.instructor_name}</p>
                            <p className="text-xs text-gray-500">{instructor.instructor_email}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveInstructor(instructor.id.toString())}
                        >
                          <UserMinus className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Enhanced Students Dialog with Bulk and Individual Enrollment */}
      <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersRound className="w-5 h-5 text-green-600" />
              Manage Students - {selectedSubject?.subject_code}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="program" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="program" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Bulk Enrollment (By Program)
              </TabsTrigger>
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                Individual (Irregular)
              </TabsTrigger>
            </TabsList>
            
            {/* Program-based Bulk Enrollment */}
            <TabsContent forceMount value="program" className="flex-1 overflow-hidden flex flex-col space-y-4">
              <div className="space-y-2">
                <Label>Select Program to Enroll</Label>
                <Select onValueChange={handleProgramSelect} value={selectedProgramId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.program_code} - {program.program_name} (Year {program.year_level}-{program.section})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedProgramId && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="selectAll"
                        checked={selectedStudentIds.length === programStudents.length && programStudents.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) selectAllProgramStudents();
                          else deselectAllStudents();
                        }}
                      />
                      <Label htmlFor="selectAll" className="text-sm cursor-pointer">
                        Select All ({programStudents.length} students)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {selectedStudentIds.length} selected
                      </span>
                      <Button 
                        size="sm"
                        onClick={handleBulkEnrollByProgram}
                        disabled={saving || selectedStudentIds.length === 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                        Enroll Selected
                      </Button>
                    </div>
                  </div>
                  
                  {loadingProgramStudents ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                    </div>
                  ) : programStudents.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">No students found in this program</p>
                  ) : (
                    <div className="flex-1 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10"></TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Student ID</TableHead>
                            <TableHead>Year Level</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {programStudents.map((student) => (
                            <TableRow key={student.user_id}>
                              <TableCell>
                                <Checkbox 
                                  checked={selectedStudentIds.includes(student.user_id)}
                                  onCheckedChange={() => toggleStudentSelection(student.user_id)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{student.full_name}</TableCell>
                              <TableCell>{student.studentID}</TableCell>
                              <TableCell>{student.year_level}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            {/* Individual Student Enrollment for Irregular Students */}
            <TabsContent forceMount value="individual" className="flex-1 overflow-hidden flex flex-col space-y-4">
              <div className="space-y-2">
                <Label>Enroll Individual Student (Irregular)</Label>
                <Select onValueChange={handleEnrollStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStudents
                      .filter(stu => !subjectStudents.some(ss => ss.student_id === stu.user_id && ss.status === 'enrolled'))
                      .map((student) => (
                        <SelectItem key={student.user_id} value={student.user_id.toString()}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                {student.full_name?.charAt(0) || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            {student.full_name} ({student.studentID})
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                <Label>Enrolled Students</Label>
                {loadingDetails ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  </div>
                ) : subjectStudents.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No students enrolled</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {subjectStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                              {student.student_name?.charAt(0) || 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.student_name}</p>
                            <p className="text-xs text-gray-500">{student.student_number} - {student.status}</p>
                          </div>
                        </div>
                        {student.status === 'enrolled' && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleUnenrollStudent(student.id.toString())}
                          >
                            <UserMinus className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
