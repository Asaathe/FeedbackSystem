import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { 
  BookOpen, 
  ArrowLeft, 
  ChevronRight,
  FileText,
  Clock,
  CheckCircle,
  Send
} from "lucide-react";
import { toast } from "sonner";

interface Subject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  department: string;
  units: number;
  subject_instructor_id: number;
  semester: string;
  academic_year: string;
  course_section_id: number;
  instructor_id: number | null;
  instructor_name: string | null;
  instructor_email: string | null;
  instructor_department: string | null;
  instructor_image: string | null;
  enrollment_id: number;
  enrolled_at: string;
}

interface PublishedForm {
  id: string;
  title: string;
  description: string;
  category: string;
  target_audience: string;
  dueDate?: string;
  assignment_status: string;
}

interface StudentSubjectEvaluationProps {
  onNavigate?: (page: string) => void;
}

export function StudentSubjectEvaluation({ onNavigate }: StudentSubjectEvaluationProps = {}) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [availableForms, setAvailableForms] = useState<PublishedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingForms, setLoadingForms] = useState(false);
  const [submittedFormIds, setSubmittedFormIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchMySubjects();
    fetchSubmittedFormIds();
  }, []);

  const fetchMySubjects = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error('No auth token found');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/subject-evaluation/my-subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSubjects(data.subjects || []);
      } else {
        toast.error(data.message || 'Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmittedFormIds = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/forms/my-responses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const submittedIds = new Set<string>(result.responses?.map((r: any) => String(r.form_id)) || []);
        setSubmittedFormIds(submittedIds);
      }
    } catch (error) {
      console.error('Error fetching submitted forms:', error);
    }
  };

  const fetchFormsForSubject = async (subject: Subject) => {
    setLoadingForms(true);
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error('No auth token found');
        return;
      }

      // Get all assigned forms for students
      const response = await fetch('http://localhost:5000/api/users/assigned-forms', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.forms) {
        // Filter forms that are for students and match the course
        const studentForms = data.forms.filter((form: PublishedForm) => {
          const target = form.target_audience || '';
          const isStudentForm = target === 'Students' || target.startsWith('Students - ');
          // For now, show all student forms - could be filtered by course_code in future
          return isStudentForm;
        });

        setAvailableForms(studentForms.map((form: any) => ({
          id: form.id.toString(),
          title: form.title,
          description: form.description,
          category: form.category,
          target_audience: form.target_audience,
          dueDate: form.end_date ? new Date(form.end_date).toLocaleDateString() : undefined,
          assignment_status: form.assignment_status || 'pending'
        })));
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to fetch evaluation forms');
    } finally {
      setLoadingForms(false);
    }
  };

  const handleSubjectClick = async (subject: Subject) => {
    setSelectedSubject(subject);
    await fetchFormsForSubject(subject);
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setAvailableForms([]);
  };

  const handleStartEvaluation = (formId: string) => {
    // Navigate to feedback submission with the form
    onNavigate?.('submit-feedback');
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    const date = new Date(dueDate);
    return isNaN(date.getTime()) ? false : date < new Date();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your subjects...</p>
        </div>
      </div>
    );
  }

  // View: Subject Forms (when a subject is selected)
  if (selectedSubject) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackToSubjects}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{selectedSubject.subject_name}</h2>
            <p className="text-gray-600">
              {selectedSubject.subject_code} • {selectedSubject.semester} • {selectedSubject.academic_year}
            </p>
          </div>
        </div>

        {/* Instructor Card */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-lg">Instructor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                {selectedSubject.instructor_image ? (
                  <img 
                    src={selectedSubject.instructor_image} 
                    alt={selectedSubject.instructor_name || 'Instructor'} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <AvatarFallback className="bg-green-500 text-white text-lg">
                    {getInitials(selectedSubject.instructor_name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="font-medium text-lg">
                  {selectedSubject.instructor_name || 'No Instructor Assigned'}
                </h3>
                {selectedSubject.instructor_department && (
                  <p className="text-sm text-gray-600">
                    {selectedSubject.instructor_department}
                  </p>
                )}
                {selectedSubject.instructor_email && (
                  <p className="text-sm text-gray-500">
                    {selectedSubject.instructor_email}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Evaluation Forms */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Subject Evaluations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingForms ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading evaluation forms...</p>
              </div>
            ) : availableForms.length > 0 ? (
              <div className="space-y-3">
                {availableForms.map((form) => {
                  const isSubmitted = submittedFormIds.has(form.id);
                  const overdue = isOverdue(form.dueDate) && !isSubmitted;
                  
                  return (
                    <div 
                      key={form.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        isSubmitted 
                          ? 'border-green-200 bg-green-50/50' 
                          : overdue 
                          ? 'border-red-200 bg-red-50/50'
                          : 'border-gray-200 hover:border-green-200 hover:bg-green-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{form.title}</h3>
                            {isSubmitted && (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Submitted
                              </Badge>
                            )}
                            {overdue && !isSubmitted && (
                              <Badge className="bg-red-100 text-red-700">
                                <Clock className="w-3 h-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{form.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {form.category}
                          </span>
                          {form.dueDate && (
                            <span className={`flex items-center gap-1 ${overdue ? 'text-red-600' : ''}`}>
                              <Clock className="w-4 h-4" />
                              Due: {form.dueDate}
                            </span>
                          )}
                        </div>
                        
                        {isSubmitted ? (
                          <Button variant="outline" size="sm" disabled>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </Button>
                        ) : (
                          <Button 
                            className="bg-green-500 hover:bg-green-600"
                            size="sm"
                            onClick={() => handleStartEvaluation(form.id)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Start Evaluation
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No evaluation forms available for this subject</p>
                <p className="text-sm text-gray-400 mt-1">Check back later for updates</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // View: Subjects List
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <h2 className="text-2xl font-bold">My Subjects</h2>
        <p className="text-gray-600 mt-1">View your enrolled subjects and submit evaluations</p>
      </div>

      {/* Subjects Grid */}
      {subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Card 
              key={subject.subject_id}
              className="border-green-100 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleSubjectClick(subject)}
            >
              <CardHeader className="flex flex-row items-start gap-4 pb-2">
                <Avatar className="w-14 h-14">
                  {subject.instructor_image ? (
                    <img 
                      src={subject.instructor_image} 
                      alt={subject.instructor_name || 'Instructor'} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <AvatarFallback className="bg-green-500 text-white text-lg">
                      {getInitials(subject.instructor_name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{subject.subject_name}</CardTitle>
                  <p className="text-sm text-gray-600 truncate">{subject.subject_code}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{subject.semester}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <span>{subject.academic_year}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Instructor</p>
                    <p className="text-sm font-medium truncate">
                      {subject.instructor_name || 'Not Assigned'}
                    </p>
                  </div>

                  <Button variant="outline" className="w-full mt-2 border-green-200 hover:bg-green-50">
                    View Evaluations
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-green-100">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500">No subjects enrolled yet</p>
            <p className="text-sm text-gray-400 mt-1">Contact your administrator for subject enrollment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
