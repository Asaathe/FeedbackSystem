import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  Save,
  GraduationCap,
  Users,
  ArrowLeft,
  UserPlus,
  UserCheck,
  School,
  Edit,
  X,
  Image
} from "lucide-react";
import { toast } from "sonner";

interface Instructor {
  user_id: number;
  full_name: string;
  email: string;
  department: string;
  instructor_id: string;
  profilePicture?: string;
}

interface CourseSection {
  id: number;
  subject_code: string;
  subject_name: string;
  section: string;
  year_level: number;
  department: string;
  display_label: string;
  instructor_id?: number;
  instructor_name?: string;
}

interface Program {
  id: number;
  program_code: string;
  program_name: string;
  year_level: number;
  section: string;
  department: string;
}

interface Student {
  user_id: number;
  full_name: string;
  email: string;
  studentID: string;
  program_id?: number;
  year_level?: number;
  profilePicture?: string;
}

interface InstructorCourse {
  id: number;
  instructor_id: number;
  subject_code: string;
  subject_name: string;
  section: string;
  year_level: number;
  department: string;
}

interface SubjectStudent {
  id: number;
  student_id: number;
  subject_id: number;
  subject_instructor_id?: number;
  course_section_id?: number;
  student_name: string;
  student_email: string;
  studentID?: string;
  program_id?: number;
  profilePicture?: string;
}

interface SubjectAssignmentProps {
  onNavigate?: (page: string) => void;
}

export function SubjectAssignment({ onNavigate }: SubjectAssignmentProps = {}) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [instructorCourses, setInstructorCourses] = useState<InstructorCourse[]>([]);
  const [subjectStudents, setSubjectStudents] = useState<SubjectStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Student selection state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [subjectInstructorId, setSubjectInstructorId] = useState<string>("");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  
  // Subject detail view state
  const [selectedSubject, setSelectedSubject] = useState<CourseSection | null>(null);
  const [selectedEnrolledSection, setSelectedEnrolledSection] = useState<Program | null>(null);
  
  // Form state
  const [newCourseSection, setNewCourseSection] = useState({
    subject_code: "",
    subject_name: "",
    section: "",
    year_level: "",
    department: ""
  });

  // Edit subject state
  const [editSubjectDialogOpen, setEditSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<CourseSection | null>(null);
  const [editSubjectForm, setEditSubjectForm] = useState({
    subject_code: "",
    subject_name: ""
  });

  // Delete subject state
  const [deleteSubjectDialogOpen, setDeleteSubjectDialogOpen] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState<CourseSection | null>(null);

  // Unenroll student state
  const [unenrollDialogOpen, setUnenrollDialogOpen] = useState(false);
  const [unenrollingStudent, setUnenrollingStudent] = useState<SubjectStudent | null>(null);

  // Remove enrolled section state
  const [removeSectionDialogOpen, setRemoveSectionDialogOpen] = useState(false);
  const [removingSection, setRemovingSection] = useState<Program | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error('No auth token found');
        return;
      }

      // Fetch instructors
      const instructorsRes = await fetch('http://localhost:5000/api/users?role=instructor&limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const instructorsData = await instructorsRes.json();
      
      if (instructorsData.success) {
        const instructorList = (instructorsData.users || []).map((u: any) => ({
          user_id: u.id,
          full_name: u.fullName, // Server returns fullName (camelCase)
          email: u.email,
          department: u.department || 'Not set',
          instructor_id: u.instructorId || '', // Server returns instructorId (camelCase)
          profilePicture: u.profilePicture || null
        }));
        setInstructors(instructorList);
      }

      // Fetch course sections (subjects)
      const sectionsRes = await fetch('http://localhost:5000/api/subject-evaluation/course-sections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const sectionsData = await sectionsRes.json();
      
      console.log('Course sections data:', sectionsData);
      
      if (sectionsData.success) {
        const sectionsList = (sectionsData.sections || []).map((s: any) => ({
          id: s.id,
          subject_code: s.subject_code || s.course_code,
          subject_name: s.subject_name || s.course_name,
          section: s.section,
          year_level: s.year_level,
          department: s.department,
          display_label: `${s.subject_code || s.course_code} - ${s.subject_name || s.course_name}`,
          instructor_id: s.instructor_id,
          instructor_name: s.instructor_name
        }));
        setCourseSections(sectionsList);
      }

      // Fetch programs from course_management
      const programsRes = await fetch('http://localhost:5000/api/programs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const programsData = await programsRes.json();
      
      if (programsData.success) {
        const programList = (programsData.programs || []).map((p: any) => ({
          id: p.id,
          program_code: p.program_code,
          program_name: p.program_name,
          year_level: p.year_level,
          section: p.section,
          department: p.department
        }));
        setPrograms(programList);
      }

      // Fetch students
      const studentsRes = await fetch('http://localhost:5000/api/users?role=student&limit=500', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const studentsData = await studentsRes.json();
      
      if (studentsData.success) {
        const studentList = (studentsData.users || []).map((u: any) => ({
          user_id: u.id,
          full_name: u.fullName || u.full_name || 'Unknown',
          email: u.email,
          studentID: u.studentID || '',
          program_id: u.programId, // Fixed: server returns programId not program_id
          year_level: u.year_level,
          profilePicture: u.profilePicture || null
        }));
        setStudents(studentList);
      }

      // Fetch instructor courses
      const coursesRes = await fetch('http://localhost:5000/api/subject-evaluation/instructor-courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const coursesData = await coursesRes.json();
      
      if (coursesData.success) {
        setInstructorCourses(coursesData.courses || []);
      }

      // Fetch student enrollments
      const enrollmentsRes = await fetch('http://localhost:5000/api/subject-evaluation/student-enrollments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const enrollmentsData = await enrollmentsRes.json();
      
      if (enrollmentsData.success) {
        setSubjectStudents(enrollmentsData.enrollments || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Create a new course section
  const handleCreateCourseSection = async () => {
    if (!newCourseSection.subject_code || !newCourseSection.subject_name) {
      toast.error('Please fill in subject code and name');
      return;
    }

    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/subject-evaluation/course-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCourseSection)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Subject created successfully');
        fetchData();
        setNewCourseSection({ subject_code: "", subject_name: "", section: "", year_level: "", department: "" });
      } else {
        toast.error(data.message || 'Failed to create subject');
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      toast.error('Failed to create subject');
    }
  };

  // Open edit subject dialog
  const handleOpenEditSubject = (subject: CourseSection) => {
    setEditingSubject(subject);
    setEditSubjectForm({
      subject_code: subject.subject_code,
      subject_name: subject.subject_name
    });
    setEditSubjectDialogOpen(true);
  };

  // Update subject
  const handleUpdateSubject = async () => {
    if (!editingSubject || !editSubjectForm.subject_code || !editSubjectForm.subject_name) {
      toast.error('Please fill in course code and name');
      return;
    }

    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/subject-evaluation/course-sections/${editingSubject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editSubjectForm)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Subject updated successfully');
        fetchData();
        setEditSubjectDialogOpen(false);
        setEditingSubject(null);
      } else {
        toast.error(data.message || 'Failed to update subject');
      }
    } catch (error) {
      console.error('Error updating subject:', error);
      toast.error('Failed to update subject');
    }
  };

  // Open delete subject dialog
  const handleOpenDeleteSubject = (subject: CourseSection) => {
    setDeletingSubject(subject);
    setDeleteSubjectDialogOpen(true);
  };

  // Delete subject
  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;

    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/subject-evaluation/course-sections/${deletingSubject.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Subject deleted successfully');
        fetchData();
        setDeleteSubjectDialogOpen(false);
        setDeletingSubject(null);
      } else {
        toast.error(data.message || 'Failed to delete subject');
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
    }
  };

  // Unenroll student from subject
  const handleUnenrollStudent = async () => {
    if (!unenrollingStudent) return;

    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/subject-evaluation/student-enrollments/${unenrollingStudent.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Student unenrolled successfully');
        fetchData();
        setUnenrollDialogOpen(false);
        setUnenrollingStudent(null);
      } else {
        toast.error(data.message || 'Failed to unenroll student');
      }
    } catch (error) {
      console.error('Error unenrolling student:', error);
      toast.error('Failed to unenroll student');
    }
  };

  // Remove all students in a program from subject
  const handleRemoveEnrolledSection = async () => {
    if (!removingSection || !selectedSubject) return;

    try {
      const token = sessionStorage.getItem('authToken');
      
      // Get enrollments for this subject AND matching the selected program/section
      const removingSectionKey = `${removingSection.program_code}-${removingSection.year_level}-${removingSection.section}`;
      
      // Find students in this subject with matching program
      const sectionEnrollments = subjectStudents.filter(ss => {
        const enrollmentMatchesSubject = ss.subject_id === selectedSubject.id || ss.course_section_id === selectedSubject.id;
        if (!enrollmentMatchesSubject) return false;
        
        // Find the student and check if their program matches
        const student = students.find(s => s.user_id === ss.student_id);
        if (!student || !student.program_id) return false;
        
        const studentProgram = programs.find(p => p.id === student.program_id);
        if (!studentProgram) return false;
        
        const studentSectionKey = `${studentProgram.program_code}-${studentProgram.year_level}-${studentProgram.section}`;
        return studentSectionKey === removingSectionKey;
      });
      
      console.log('Removing enrollments:', sectionEnrollments);
      console.log('Selected subject id:', selectedSubject.id);
      
      if (sectionEnrollments.length === 0) {
        toast.error('No enrollments found for this subject');
        return;
      }
      
      let removed = 0;
      for (const enrollment of sectionEnrollments) {
        console.log('Deleting enrollment:', enrollment.id);
        const response = await fetch(`http://localhost:5000/api/subject-evaluation/student-enrollments/${enrollment.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Delete response:', data);
        if (data.success) removed++;
      }
      
      toast.success(`${removed} students removed from subject`);
      fetchData();
      setRemoveSectionDialogOpen(false);
      setRemovingSection(null);
      setSelectedEnrolledSection(null);
    } catch (error) {
      console.error('Error removing section:', error);
      toast.error('Failed to remove section');
    }
  };

  // Assign course section to instructor
  const handleAssignCourse = async () => {
    if (!selectedInstructor || !selectedSubjectId) {
      toast.error('Please select an instructor and a subject');
      return;
    }

    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/subject-evaluation/instructor-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          instructor_id: selectedInstructor.user_id,
          course_section_id: parseInt(selectedSubjectId)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Subject assigned to instructor successfully');
        fetchData();
        setEditDialogOpen(false);
        setSelectedSubjectId("");
      } else {
        toast.error(data.message || 'Failed to assign subject');
      }
    } catch (error) {
      console.error('Error assigning subject:', error);
      toast.error('Failed to assign subject');
    }
  };

  const handleRemoveCourse = async (courseId: number) => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/subject-evaluation/instructor-courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Subject removed from instructor');
        fetchData();
      } else {
        toast.error(data.message || 'Failed to remove subject');
      }
    } catch (error) {
      console.error('Error removing subject:', error);
      toast.error('Failed to remove subject');
    }
  };

  // Enroll all students from a program to a subject
  const handleEnrollProgram = async () => {
    if (!selectedSubjectId || !selectedProgramId) {
      toast.error('Please select a subject and a program');
      return;
    }

    // Get students from this program (matching program_id AND year_level)
    const selectedProgram = programs.find(p => p.id === parseInt(selectedProgramId));
    const programStudents = students.filter(s => {
      // First try to match both program_id and year_level
      if (selectedProgram && s.program_id && s.year_level) {
        return s.program_id === parseInt(selectedProgramId) && s.year_level === selectedProgram.year_level;
      }
      // Fallback: just match program_id if year_level data is missing
      return s.program_id === parseInt(selectedProgramId);
    });

    // Debug: Show count before enrolling
    console.log('Selected Program:', selectedProgram);
    console.log('Program Students Count:', programStudents.length);
    console.log('Sample student program_ids:', students.slice(0, 5).map(s => ({ program_id: s.program_id, year_level: s.year_level, name: s.full_name })));
    
    if (programStudents.length === 0) {
      const selectedProgram = programs.find(p => p.id === parseInt(selectedProgramId));
      if (selectedProgram) {
        toast.error(`No students found in ${selectedProgram.program_code} Year ${selectedProgram.year_level}. Check if students have the correct program and year level assigned.`);
      } else {
        toast.error('No students found in this program. Make sure students have program assigned.');
      }
      return;
    }

    try {
      const token = sessionStorage.getItem('authToken');
      let enrolled = 0;
      const errors: string[] = [];

      for (const student of programStudents) {
        // Use subject_instructor_id (new format) if available, otherwise use course_section_id (legacy)
        const enrollmentData = subjectInstructorId ? {
          student_id: student.user_id,
          subject_instructor_id: parseInt(subjectInstructorId)
        } : {
          student_id: student.user_id,
          course_section_id: parseInt(selectedSubjectId)
        };
        
        const response = await fetch('http://localhost:5000/api/subject-evaluation/student-enrollments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(enrollmentData)
        });

        const data = await response.json();
        if (data.success) {
          enrolled++;
        } else if (data.message && !data.message.includes('already enrolled')) {
          errors.push(data.message);
        }
      }

      if (enrolled > 0) {
        toast.success(`${enrolled} students enrolled successfully`);
      }
      if (errors.length > 0) {
        toast.error(errors[0]);
      }
      
      setAssignDialogOpen(false);
      setSelectedProgramId("");
      fetchData();
    } catch (error) {
      console.error('Error enrolling students:', error);
      toast.error('Failed to enroll students');
    }
  };

  const handleSubjectClick = (subject: CourseSection) => {
    setSelectedSubject(subject);
    setSelectedSubjectId(subject.id.toString());
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
  };

  const getInstructorCourses = (instructorId: number) => {
    return instructorCourses.filter(ic => ic.instructor_id === instructorId);
  };

  // Get unique sections enrolled in a subject
  const getSubjectEnrolledSections = (subjectId: number) => {
    // Support both subject_id (new) and course_section_id (legacy)
    const enrolledStudents = subjectStudents.filter(ss => ss.subject_id === subjectId || ss.course_section_id === subjectId);
    const studentIds = enrolledStudents.map(ss => ss.student_id);
    const studentsInSubject = students.filter(s => studentIds.includes(s.user_id));
    
    const sectionsMap = new Map();
    
    // First, add sections for students with program_id
    studentsInSubject.forEach(student => {
      if (student.program_id) {
        const program = programs.find(p => p.id === student.program_id);
        if (program) {
          const sectionKey = `${program.program_code}-${program.year_level}-${program.section}`;
          if (!sectionsMap.has(sectionKey)) {
            sectionsMap.set(sectionKey, { ...program });
          }
        }
      }
    });
    
    // If no sections found, create a placeholder for students without program
    if (sectionsMap.size === 0 && studentsInSubject.length > 0) {
      sectionsMap.set('unassigned', {
        id: 0,
        program_code: 'UNK',
        program_name: 'Unassigned Program',
        year_level: 1,
        section: '-',
        department: 'N/A'
      });
    }
    
    return Array.from(sectionsMap.values());
  };

  // Get total number of enrolled students in a subject
  const getEnrolledStudentCount = (subjectId: number): number => {
    // Support both subject_id (new) and course_section_id (legacy)
    const enrolledStudents = subjectStudents.filter(ss => ss.subject_id === subjectId || ss.course_section_id === subjectId);
    return enrolledStudents.length;
  };

  const getInstructorName = (instructorId: number | undefined) => {
    if (!instructorId) return "No instructor";
    const instructor = instructors.find(i => i.user_id === instructorId);
    return instructor ? instructor.full_name : "Unknown";
  };

  // Get students enrolled in a specific program/section for a subject
  const getStudentsByEnrolledSection = (subjectId: number, program: Program | null): SubjectStudent[] => {
    if (!program) return [];
    
    // Support both subject_id (new) and course_section_id (legacy)
    const subjectEnrollments = subjectStudents.filter(ss => ss.subject_id === subjectId || ss.course_section_id === subjectId);
    
    // Filter by matching program_code, year_level, and section
    const programKey = `${program.program_code}-${program.year_level}-${program.section}`;
    
    const filteredEnrollments = subjectEnrollments.filter(enrollment => {
      const student = students.find(s => s.user_id === enrollment.student_id);
      if (!student || !student.program_id) return false;
      
      const studentProgram = programs.find(p => p.id === student.program_id);
      if (!studentProgram) return false;
      
      const studentProgramKey = `${studentProgram.program_code}-${studentProgram.year_level}-${studentProgram.section}`;
      return studentProgramKey === programKey;
    });
    
    const studentIds = filteredEnrollments.map(ss => ss.student_id);
    
    // Build maps for quick lookup of student details from ALL students
    const studentDetailsMap = new Map<number, { profilePicture?: string; studentID?: string }>();
    students.forEach(s => {
      // Match by user_id directly
      studentDetailsMap.set(s.user_id, {
        profilePicture: s.profilePicture || undefined,
        studentID: s.studentID || undefined
      });
    });
    
    // Return filtered enrollments with student details merged
    return filteredEnrollments.map(enrollment => {
      const details = studentDetailsMap.get(enrollment.student_id) || {};
      return {
        ...enrollment,
        profilePicture: details.profilePicture,
        studentID: details.studentID || enrollment.studentID
      };
    });
  };

  // Get unique programs
  const getUniquePrograms = () => {
    const unique = new Map();
    programs.forEach(p => {
      const key = `${p.program_code}-${p.year_level}-${p.section}`;
      if (!unique.has(key)) {
        unique.set(key, p);
      }
    });
    return Array.from(unique.values());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

   // Show subject detail view
  if (selectedSubject) {
    const enrolledSections = getSubjectEnrolledSections(selectedSubject.id);
    const instructor = selectedSubject.instructor_id ? instructors.find(i => i.user_id === selectedSubject.instructor_id) : null;
    
    return (
      <div className="space-y-6">
        {/* Header with Instructor Picture */}
        <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackToSubjects}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {/* Instructor Avatar */}
            {instructor?.profilePicture ? (
              <Avatar className="w-16 h-16 border-2 border-green-500">
                <AvatarImage src={instructor.profilePicture} alt={instructor.full_name || 'Instructor'} />
                <AvatarFallback className="bg-green-500 text-white text-lg">
                  {instructor?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg border-2 border-green-600">
                {instructor?.full_name ? instructor.full_name.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{selectedSubject.subject_code} - {selectedSubject.subject_name}</h2>
              <p className="text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Instructor: {getInstructorName(selectedSubject.instructor_id)}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => { setSelectedProgramId(""); setAssignDialogOpen(true); }} className="bg-green-500 hover:bg-green-600">
                <School className="w-4 h-4 mr-2" />
                Enroll by Program
              </Button>
            </div>
          </div>
        </div>

        {/* Enrolled Sections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Enrolled Sections ({enrolledSections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrolledSections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {enrolledSections.map((program) => (
                  <div 
                    key={`${program.program_code}-${program.year_level}-${program.section}`} 
                    className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedEnrolledSection(program)}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                      {program.program_code.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{program.program_code} - {program.year_level}{program.section}</p>
                      <p className="text-sm text-gray-500 truncate">{program.program_name}</p>
                    </div>
                    <div className="text-sm text-green-600">
                      {getStudentsByEnrolledSection(selectedSubject.id, program).length}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No sections enrolled in this subject yet</p>
            )}
          </CardContent>
        </Card>

        {/* Enrolled Students in Section View */}
        {selectedEnrolledSection && (
          <Card className="border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Students in {selectedEnrolledSection.program_code} - Year {selectedEnrolledSection.year_level} Section {selectedEnrolledSection.section}
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setRemovingSection(selectedEnrolledSection);
                      setRemoveSectionDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Section
                  </Button>
                  <Button variant="ghost" onClick={() => setSelectedEnrolledSection(null)}>
                    <X className="w-4 h-4 mr-2" />
                    Close
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const sectionStudents = getStudentsByEnrolledSection(selectedSubject.id, selectedEnrolledSection);
                return sectionStudents.length > 0 ? (
                  <div className="space-y-2">
                    {sectionStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3">
                          {student.profilePicture ? (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={student.profilePicture} alt={student.student_name || 'Student'} />
                              <AvatarFallback className="bg-blue-500 text-white text-sm">
                                {student.student_name ? student.student_name.charAt(0).toUpperCase() : '?'}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-blue-500 text-white text-sm">
                                {student.student_name ? student.student_name.charAt(0).toUpperCase() : '?'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <p className="font-medium text-sm">{student.student_name || 'Unknown Student'}</p>
                            <p className="text-xs text-gray-500">{student.student_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const studentEnrollment = subjectStudents.find(
                              ss => (ss.subject_id === selectedSubject.id || ss.course_section_id === selectedSubject.id) && ss.student_id === student.student_id
                            );
                            return studentEnrollment ? (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setUnenrollingStudent(studentEnrollment);
                                  setUnenrollDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No students found in this section</p>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Enroll by Program Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enroll Students by Program</DialogTitle>
              <DialogDescription>Select a program to enroll all its students to this subject</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Program</Label>
                <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                  <SelectTrigger><SelectValue placeholder="Select a program" /></SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.program_code} - {program.program_name} (Year {program.year_level} - Section {program.section})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedProgramId && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <Users className="w-4 h-4 inline mr-1" />
                    {(() => {
                      const selectedProgram = programs.find(p => p.id === parseInt(selectedProgramId));
                      const count = students.filter(s => {
                        // First try to match both program_id and year_level
                        if (selectedProgram && s.program_id && s.year_level) {
                          return s.program_id === parseInt(selectedProgramId) && s.year_level === selectedProgram.year_level;
                        }
                        // Fallback: just match program_id if year_level data is missing
                        return s.program_id === parseInt(selectedProgramId);
                      }).length;
                      return count;
                    })()} students will be enrolled
                  </p>
                </div>
              )}
              
              <Button onClick={handleEnrollProgram} className="w-full" disabled={!selectedProgramId}>
                <Save className="w-4 h-4 mr-2" />
                Enroll All Students
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Unenroll Student Dialog */}
        <Dialog open={unenrollDialogOpen} onOpenChange={setUnenrollDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unenroll Student</DialogTitle>
              <DialogDescription>
                Are you sure you want to unenroll {unenrollingStudent?.student_name} from this subject?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setUnenrollDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleUnenrollStudent}>
                Unenroll
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Remove Section Dialog */}
        <Dialog open={removeSectionDialogOpen} onOpenChange={setRemoveSectionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Enrolled Section</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove all students in {removingSection?.program_code} - Year {removingSection?.year_level} Section {removingSection?.section} from this subject? This will unenroll all {getStudentsByEnrolledSection(selectedSubject.id, removingSection!).length} students.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRemoveSectionDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemoveEnrolledSection}>
                Remove All
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <h2 className="text-2xl font-bold">Subject Assignment</h2>
        <p className="text-gray-600 mt-1">Assign subjects to instructors and students</p>
      </div>

      {/* Create Subject Form */}
      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Subject
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Subject Code</Label>
              <Input 
                placeholder="e.g. IT144" 
                value={newCourseSection.subject_code}
                onChange={(e) => setNewCourseSection({...newCourseSection, subject_code: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="flex-1">
              <Label>Subject Name</Label>
              <Input 
                placeholder="e.g. System Architecture" 
                value={newCourseSection.subject_name}
                onChange={(e) => setNewCourseSection({...newCourseSection, subject_name: e.target.value})}
              />
            </div>
            <Button onClick={handleCreateCourseSection} className="bg-green-500 hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Subject
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="instructors" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="instructors" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Instructor Subjects
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Student Enrollments
          </TabsTrigger>
        </TabsList>

        {/* Instructor Tab */}
        <TabsContent value="instructors" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instructors.map((instructor) => (
              <Card key={instructor.user_id} className="border-green-100">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg">{instructor.full_name}</CardTitle>
                    <p className="text-sm text-gray-600">{instructor.department}</p>
                  </div>
                  <Badge variant="outline" className="border-green-200">
                    {getInstructorCourses(instructor.user_id).length}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">{instructor.email}</p>
                    
                    {/* Subjects List */}
                    {getInstructorCourses(instructor.user_id).length > 0 ? (
                      <div className="space-y-2">
                        {getInstructorCourses(instructor.user_id).map((ic) => (
                          <div key={ic.id} className="p-2 rounded bg-gray-50 border border-gray-200 flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{ic.subject_code}</p>
                              <p className="text-xs text-gray-500">{ic.subject_name}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveCourse(ic.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No subjects assigned</p>
                    )}

                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-green-200 hover:bg-green-50" onClick={() => setSelectedInstructor(instructor)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Subject
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Assign Subject to {selectedInstructor?.full_name}</DialogTitle>
                          <DialogDescription>Select a subject from the list</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Select Subject</Label>
                            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                              <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                              <SelectContent>
                                {courseSections.map((section) => (
                                  <SelectItem key={section.id} value={section.id.toString()}>
                                    {section.subject_code} - {section.subject_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={handleAssignCourse} className="w-full">
                            <Save className="w-4 h-4 mr-2" />
                            Assign Subject
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Student Tab - Subject Cards */}
        <TabsContent value="students" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courseSections.map((subject) => {
              const enrolledCount = getEnrolledStudentCount(subject.id);
              
              return (
                <Card 
                  key={subject.id} 
                  className="border-purple-100 hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => handleSubjectClick(subject)}>
                        <CardTitle className="text-lg">{subject.subject_code}</CardTitle>
                        <p className="text-sm text-gray-600">{subject.subject_name}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditSubject(subject);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeleteSubject(subject);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>Instructor: {getInstructorName(subject.instructor_id)}</span>
                      </div>
                      <Badge variant="outline" className="border-purple-200">
                        {enrolledCount} Students
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {courseSections.length === 0 && (
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No subjects created yet</p>
                <p className="text-sm text-gray-400">Create a subject above to get started</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Subject Dialog */}
      <Dialog open={editSubjectDialogOpen} onOpenChange={setEditSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update the subject details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subject Code</Label>
              <Input 
                placeholder="e.g. IT144" 
                value={editSubjectForm.subject_code}
                onChange={(e) => setEditSubjectForm({...editSubjectForm, subject_code: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="space-y-2">
              <Label>Subject Name</Label>
              <Input 
                placeholder="e.g. System Architecture" 
                value={editSubjectForm.subject_name}
                onChange={(e) => setEditSubjectForm({...editSubjectForm, subject_name: e.target.value})}
              />
            </div>
            <Button onClick={handleUpdateSubject} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Dialog */}
      <Dialog open={deleteSubjectDialogOpen} onOpenChange={setDeleteSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingSubject?.subject_code} - {deletingSubject?.subject_name}?
              This action cannot be undone and will remove all enrollments.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteSubjectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubject}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SubjectAssignment;
