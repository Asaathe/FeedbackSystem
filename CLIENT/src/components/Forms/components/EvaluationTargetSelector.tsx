import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Target, Search, X, ChevronDown, User, BookOpen, Users, Loader2 } from "lucide-react";

interface Subject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  department: string;
  units: number;
  instructor_id: number | null;
  instructor_name: string | null;
  semester: string;
  academic_year: string;
  enrolled_students_count: number;
}

interface Instructor {
  user_id: number;
  full_name: string;
  email: string;
  department: string;
  instructor_id: number;
  image: string | null;
  total_subjects: number;
  total_enrolled_students: number;
}

interface InstructorSubject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  department: string;
  units: number;
  semester: string;
  academic_year: string;
  enrolled_students_count: number;
}

interface StudentRecipient {
  id: number;
  full_name: string;
  email: string;
  course_section: string;
  department: string;
}

interface EvaluationTargetSelectorProps {
  evaluationType: 'subject' | 'instructor';
  onEvaluationTypeChange: (type: 'subject' | 'instructor') => void;
  selectedIds: number[];
  onSelectionChange: (ids: number[], selectedItems?: any[]) => void;
  onStudentsLoaded?: (students: StudentRecipient[]) => void;
}

export function EvaluationTargetSelector({
  evaluationType,
  onEvaluationTypeChange,
  selectedIds,
  onSelectionChange,
  onStudentsLoaded,
}: EvaluationTargetSelectorProps) {
  // Search state
  const [subjectSearch, setSubjectSearch] = useState("");
  const [instructorSearch, setInstructorSearch] = useState("");
  
  // Dropdown open state
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [instructorDropdownOpen, setInstructorDropdownOpen] = useState(false);
  
  // Data state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [instructorSubjects, setInstructorSubjects] = useState<InstructorSubject[]>([]);
  
  // Selected data
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  
  // Loading state
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [loadingInstructorDetails, setLoadingInstructorDetails] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Initial load
  useEffect(() => {
    fetchInstructors();
  }, []);
  
  // Fetch instructors for dropdown
  const fetchInstructors = async () => {
    setLoadingInstructors(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('/api/subject-evaluation/instructors', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setInstructors(data.instructors || []);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoadingInstructors(false);
    }
  };
  
  // Search subjects when search term changes
  useEffect(() => {
    if (subjectSearch.length >= 2) {
      searchSubjects(subjectSearch);
    } else {
      setSubjects([]);
    }
  }, [subjectSearch]);
  
  // Search instructors when search term changes
  useEffect(() => {
    if (instructorSearch.length >= 2) {
      filterInstructors(instructorSearch);
    }
  }, [instructorSearch]);
  
  // Search subjects by code or name
  const searchSubjects = async (search: string) => {
    setLoadingSubjects(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`/api/subject-evaluation/subjects/search?search=${encodeURIComponent(search)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Error searching subjects:', error);
    } finally {
      setLoadingSubjects(false);
    }
  };
  
  // Filter instructors by search term
  const filterInstructors = (search: string) => {
    const filtered = instructors.filter(inst =>
      inst.full_name.toLowerCase().includes(search.toLowerCase()) ||
      inst.email.toLowerCase().includes(search.toLowerCase()) ||
      (inst.department && inst.department.toLowerCase().includes(search.toLowerCase()))
    );
    setInstructors(filtered);
  };
  
  // Fetch instructor details (subjects handled by instructor)
  const fetchInstructorDetails = async (instructorId: number) => {
    setLoadingInstructorDetails(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`/api/subject-evaluation/instructors/${instructorId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setInstructorSubjects(data.subjects || []);
        // Fetch students for this instructor's subjects
        fetchStudentsByInstructor(instructorId);
      }
    } catch (error) {
      console.error('Error fetching instructor details:', error);
    } finally {
      setLoadingInstructorDetails(false);
    }
  };
  
  // Fetch students by selected subject
  const fetchStudentsBySubject = async (subjectId: number) => {
    setLoadingStudents(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('/api/subject-evaluation/students-by-subject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ subjectId }),
      });
      const data = await response.json();
      if (data.success && onStudentsLoaded) {
        onStudentsLoaded(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students by subject:', error);
    } finally {
      setLoadingStudents(false);
    }
  };
  
  // Fetch students by instructor
  const fetchStudentsByInstructor = async (instructorId: number) => {
    setLoadingStudents(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch('/api/subject-evaluation/students-by-instructor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ instructorId }),
      });
      const data = await response.json();
      if (data.success && onStudentsLoaded) {
        onStudentsLoaded(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching students by instructor:', error);
    } finally {
      setLoadingStudents(false);
    }
  };
  
  // Handle subject selection
  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
    setSubjectSearch(`${subject.subject_code} - ${subject.subject_name}`);
    setSubjectDropdownOpen(false);
    setSelectedInstructor(null);
    setInstructorSubjects([]);
    
    // Pass subject ID for selection
    onSelectionChange([subject.subject_id], [subject]);
    
    // Fetch enrolled students
    fetchStudentsBySubject(subject.subject_id);
  };
  
  // Handle instructor selection
  const handleInstructorSelect = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setInstructorSearch(instructor.full_name);
    setInstructorDropdownOpen(false);
    setSelectedSubject(null);
    
    // Pass instructor ID for selection
    onSelectionChange([instructor.user_id], [instructor]);
    
    // Fetch instructor details and students
    fetchInstructorDetails(instructor.user_id);
  };
  
  // Clear selection
  const clearSelection = () => {
    if (evaluationType === 'subject') {
      setSelectedSubject(null);
      setSubjectSearch("");
    } else {
      setSelectedInstructor(null);
      setInstructorSearch("");
      setInstructorSubjects([]);
    }
    onSelectionChange([], []);
    if (onStudentsLoaded) {
      onStudentsLoaded([]);
    }
  };
  
  // Handle evaluation type change
  const handleTypeChange = (type: 'subject' | 'instructor') => {
    onEvaluationTypeChange(type);
    clearSelection();
  };

  return (
    <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-purple-700">
          <Target className="w-4 h-4" />
          <span className="text-sm font-medium">
            Evaluation Target
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Evaluation Type Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Select What to Evaluate
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('subject')}
              className={`p-3 rounded-lg border-2 transition-colors text-left ${
                evaluationType === 'subject'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-200'
              }`}
            >
              <div className="font-medium text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Subject
              </div>
              <div className="text-xs text-gray-500">Evaluate a specific subject</div>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('instructor')}
              className={`p-3 rounded-lg border-2 transition-colors text-left ${
                evaluationType === 'instructor'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-200'
              }`}
            >
              <div className="font-medium text-sm flex items-center gap-2">
                <User className="w-4 h-4" />
                Instructor
              </div>
              <div className="text-xs text-gray-500">Evaluate an instructor</div>
            </button>
          </div>
        </div>

        {/* Target Selection - Subject */}
        {evaluationType === 'subject' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Select Subject
            </Label>
            <p className="text-xs text-gray-600">
              Search by Subject Code or Subject Name
            </p>
            
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search subjects (e.g., CCS 101 or Introduction to Computing)"
                  value={subjectSearch}
                  onChange={(e) => {
                    setSubjectSearch(e.target.value);
                    setSubjectDropdownOpen(true);
                    setSelectedSubject(null);
                  }}
                  onFocus={() => setSubjectDropdownOpen(true)}
                  className="pl-10 pr-10"
                />
                {subjectSearch && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Dropdown */}
              {subjectDropdownOpen && subjectSearch.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {loadingSubjects ? (
                    <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </div>
                  ) : subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <button
                        key={subject.subject_id}
                        type="button"
                        onClick={() => handleSubjectSelect(subject)}
                        className="w-full p-3 text-left hover:bg-purple-50 border-b last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-sm text-purple-700">
                          {subject.subject_code}
                        </div>
                        <div className="text-sm text-gray-600">
                          {subject.subject_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                          <span>{subject.department}</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {subject.enrolled_students_count} students
                          </span>
                          <span>{subject.instructor_name || 'No instructor'}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No subjects found matching "{subjectSearch}"
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Selected Subject Info */}
            {selectedSubject && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-purple-700">
                      {selectedSubject.subject_code}
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedSubject.subject_name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {selectedSubject.instructor_name || 'No instructor assigned'}
                      </span>
                      <span className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3" />
                        {selectedSubject.enrolled_students_count} enrolled students
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Target Selection - Instructor */}
        {evaluationType === 'instructor' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Select Instructor
            </Label>
            <p className="text-xs text-gray-600">
              Search by Instructor Name or Department
            </p>
            
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search instructors by name or department"
                  value={instructorSearch}
                  onChange={(e) => {
                    setInstructorSearch(e.target.value);
                    setInstructorDropdownOpen(true);
                    setSelectedInstructor(null);
                  }}
                  onFocus={() => {
                    setInstructorDropdownOpen(true);
                    fetchInstructors();
                  }}
                  className="pl-10 pr-10"
                />
                {instructorSearch && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Dropdown */}
              {instructorDropdownOpen && instructorSearch.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {loadingInstructors ? (
                    <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </div>
                  ) : instructors.length > 0 ? (
                    instructors.filter(inst =>
                      inst.full_name.toLowerCase().includes(instructorSearch.toLowerCase()) ||
                      (inst.department && inst.department.toLowerCase().includes(instructorSearch.toLowerCase()))
                    ).map((instructor) => (
                      <button
                        key={instructor.user_id}
                        type="button"
                        onClick={() => handleInstructorSelect(instructor)}
                        className="w-full p-3 text-left hover:bg-purple-50 border-b last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-sm text-purple-700">
                          {instructor.full_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                          <span>{instructor.department || 'No department'}</span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {instructor.total_subjects} subjects
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {instructor.total_enrolled_students} students
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No instructors found matching "{instructorSearch}"
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Selected Instructor Info */}
            {selectedInstructor && (
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-purple-700">
                        {selectedInstructor.full_name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span>{selectedInstructor.department || 'No department'}</span>
                        <span className="mx-2">•</span>
                        <span>{selectedInstructor.email}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {instructorSubjects.length} subjects
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {selectedInstructor.total_enrolled_students} total students
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      Change
                    </Button>
                  </div>
                </div>
                
                {/* Instructor Subjects */}
                {loadingInstructorDetails ? (
                  <div className="text-center py-2 text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading subjects...
                  </div>
                ) : instructorSubjects.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="text-xs font-medium text-gray-600 mb-2">
                      Subjects Handled by This Instructor:
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {instructorSubjects.map((subject) => (
                        <div key={subject.subject_id} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium text-purple-700">{subject.subject_code}</span>
                            <span className="text-gray-500 ml-2">{subject.subject_name}</span>
                          </div>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {subject.enrolled_students_count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Loading Students Indicator */}
        {loadingStudents && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-blue-700">Loading enrolled students...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

