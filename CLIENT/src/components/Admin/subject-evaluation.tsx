import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Progress } from "../ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { 
  BookOpen, 
  Users, 
  Star, 
  ArrowLeft, 
  MessageSquare,
  ChevronRight,
  Search,
  Filter,
  Loader2,
  BarChart3,
  GraduationCap,
  Award
} from "lucide-react";
import { toast } from "sonner";
import { getSubjectEvaluationResults, getEvaluationSummary, getEvaluationResultsBySection } from "../../services/subjectService";

interface Instructor {
  user_id: number;
  full_name: string;
  email: string;
  department: string;
  school_role: string;
  instructor_id: string;
  image: string | null;
  total_subjects: number;
  total_feedbacks: number;
  avg_rating: number;
}

interface Subject {
  id: number;
  section_id: number;
  subject_code: string;
  subject_name: string;
  section: string;
  year_level: string;
  department: string;
  student_count: number;
  feedback_count: number;
  instructor_feedback_count: number;  // Instructor feedback count for "By Instructor" view
  subject_feedback_count: number;      // Subject feedback count for "By Subject" view
  avg_rating: number;
  subject_avg?: number;  // Separate instructor feedback average
  instructor_avg?: number;  // Separate subject feedback average
  instructor_name?: string;
}

interface SectionResult {
  respondents: string;
  total_enrolled: string;
  total_responses: number;
  q1: string;
  q2: string;
  q3: string;
  average: string;
  question_averages?: Record<string, string>;
}

interface SubjectEvaluationProps {
  onNavigate?: (page: string) => void;
}

export function SubjectEvaluation({ onNavigate }: SubjectEvaluationProps = {}) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState<'overview' | 'instructors' | 'subjects'>('instructors');
  const [summaryResults, setSummaryResults] = useState<any[]>([]);
  const [sectionResults, setSectionResults] = useState<SectionResult[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loadingAllSubjects, setLoadingAllSubjects] = useState(false);

  useEffect(() => {
    fetchInstructors();
  }, []);

  useEffect(() => {
    if (currentView === 'subjects' && allSubjects.length === 0) {
      fetchAllSubjects();
    }
  }, [currentView]);

  const fetchInstructors = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error('No auth token found');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/subject-evaluation/instructors', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const mappedInstructors = (data.instructors || []).map((instructor: any) => ({
          user_id: instructor.user_id,
          full_name: instructor.full_name,
          email: instructor.email,
          department: instructor.department,
          school_role: instructor.school_role || 'No School Role',
          instructor_id: instructor.instructor_id,
          image: instructor.image || null,
          total_subjects: instructor.total_subjects || 0,
          total_feedbacks: instructor.total_feedbacks || 0,
          avg_rating: instructor.avg_rating || 0
        }));
        setInstructors(mappedInstructors);
      } else {
        toast.error(data.message || 'Failed to fetch instructors');
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
      toast.error('Failed to fetch instructors');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructorSubjects = async (instructorId: number) => {
    setLoadingSubjects(true);
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error('No auth token found');
        return;
      }

      const response = await fetch(`/api/subject-evaluation/instructors/${instructorId}/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // For "By Instructor" view - show ONLY instructor feedback ratings
        const mappedSubjects = (data.subjects || []).map((subject: any) => ({
          id: subject.section_id || subject.offering_id || subject.id || 0,
          section_id: subject.section_id || subject.offering_id || subject.id || 0,
          subject_name: subject.subject_name || '',
          subject_code: subject.subject_code || '',
          section: subject.section || '-',
          year_level: subject.year_level || '1',
          department: subject.department || '',
          student_count: subject.student_count || 0,
          feedback_count: subject.feedback_count || 0,
          instructor_feedback_count: subject.instructor_feedback_count || 0,
          subject_feedback_count: subject.subject_feedback_count || 0,
          subject_avg: subject.subject_avg || 0,
          instructor_avg: subject.instructor_avg || 0,
          // For "By Instructor" - show ONLY instructor rating
          avg_rating: subject.instructor_avg || 0
        }));
        setSubjects(mappedSubjects);
      } else {
        toast.error(data.message || 'Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to fetch subjects');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchAllSubjects = async () => {
    setLoadingAllSubjects(true);
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error('No auth token found');
        return;
      }

      const response = await fetch('/api/subject-evaluation/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // For "By Subjects" view - show ONLY subject feedback ratings
        const mappedSubjects = (data.subjects || []).map((subject: any) => ({
          id: subject.section_id || subject.offering_id || subject.id || 0,
          section_id: subject.section_id || subject.offering_id || subject.id || 0,
          subject_name: subject.subject_name || '',
          subject_code: subject.subject_code || '',
          section: subject.section || '-',
          year_level: subject.year_level || '1',
          department: subject.department || '',
          student_count: subject.student_count || 0,
          feedback_count: subject.feedback_count || 0,
          instructor_feedback_count: subject.instructor_feedback_count || 0,
          subject_feedback_count: subject.subject_feedback_count || 0,
          subject_avg: subject.subject_avg || 0,
          instructor_avg: subject.instructor_avg || 0,
          // For "By Subjects" - show ONLY subject rating
          avg_rating: subject.subject_avg || 0,
          instructor_name: subject.instructor_name || 'Unknown Instructor'
        }));
        setAllSubjects(mappedSubjects);
      } else {
        toast.error(data.message || 'Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to fetch subjects');
    } finally {
      setLoadingAllSubjects(false);
    }
  };

  const fetchSubjectFeedback = async (subjectId: number) => {
    setLoadingFeedback(true);
    console.log('Fetching feedback for subjectId:', subjectId);
    try {
      const [analyticsResult, sectionResult] = await Promise.all([
        getSubjectEvaluationResults(subjectId.toString()),
        getEvaluationResultsBySection(subjectId.toString())
      ]);
      
      if (analyticsResult.success) {
        setResponses(analyticsResult.responses || []);
      }
      
      if (sectionResult.success) {
        setSectionResults(sectionResult.results || []);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to fetch feedback');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleInstructorClick = async (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setSelectedSubject(null);
    setSectionResults([]);
    await fetchInstructorSubjects(instructor.user_id);
  };

  const handleSubjectClick = async (subject: Subject) => {
    setSelectedSubject(subject);
    // If there's no selected instructor but subject has instructor_name, we don't need to set it
    // The view will show the subject details
    await fetchSubjectFeedback(subject.section_id || subject.id);
  };

  const handleBackToInstructors = () => {
    setSelectedInstructor(null);
    setSelectedSubject(null);
    setSectionResults([]);
    setSubjects([]);
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setSectionResults([]);
    // If we came from the 'subjects' view, stay there; otherwise go to instructors
    if (currentView === 'subjects') {
      // Stay on subjects view, just clear the selected subject
    } else if (selectedInstructor) {
      // Going back from a subject to the instructor's subject list
      // Keep the instructor selected
    }
  };

  const handleBackToMain = () => {
    setSelectedInstructor(null);
    setSelectedSubject(null);
    setSectionResults([]);
    setSubjects([]);
  };

  const filteredInstructors = instructors.filter(instructor =>
    instructor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.school_role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubjects = allSubjects.filter(subject =>
    subject.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.subject_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">★</span>);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">★</span>);
    }
    return stars;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading subject evaluation data...</p>
        </div>
      </div>
    );
  }

  // View: Selected Subject - Simplified view showing key metrics
  // Shows either instructor rating or subject rating based on which view user came from
  if (selectedSubject) {
    // Calculate response rate for this subject
    const responseRate = selectedSubject.student_count > 0 
      ? ((selectedSubject.feedback_count / selectedSubject.student_count) * 100).toFixed(1)
      : '0';
    const responseFraction = selectedSubject.student_count > 0 
      ? `${selectedSubject.feedback_count}/${selectedSubject.student_count}`
      : '0/0';
    
    // Determine which rating to show based on which tab user came from
    const isInstructorView = currentView === 'instructors' || selectedInstructor;
    const displayRating = isInstructorView ? selectedSubject.instructor_avg : selectedSubject.subject_avg;
    const ratingLabel = isInstructorView ? 'Instructor Rating' : 'Subject Rating';
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4" >
          <Button variant="ghost" size="icon" onClick={selectedInstructor ? handleBackToSubjects : () => setSelectedSubject(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{selectedSubject.subject_name}</h2>
            <p className="text-gray-600">
              {selectedSubject.subject_code} • Section {selectedSubject.section} • {selectedInstructor?.full_name || selectedSubject.instructor_name || 'Unknown Instructor'}
            </p>
          </div>
        </div>

        {/* Summary Cards - All Key Info in One View */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 ">
          {/* Course/Section Title */}
          <Card className="border-green-100 ">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">Course</CardTitle>
              <BookOpen className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{selectedSubject.subject_code}</div>
              <p className="text-xs text-gray-600 mt-1">{selectedSubject.subject_name}</p>
              <p className="text-xs text-gray-500 mt-1">Section {selectedSubject.section}</p>
            </CardContent>
          </Card>

          {/* Total Enrolled Students */}
          <Card className="border-green-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">Enrolled Students</CardTitle>
              <Users className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{selectedSubject.student_count}</div>
              <p className="text-xs text-gray-600 mt-1">Total enrolled</p>
            </CardContent>
          </Card>

          {/* Feedbacks Submitted & Response Rate */}
          <Card className="border-green-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">Response Rate</CardTitle>
              <MessageSquare className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{responseRate}%</div>
              <p className="text-xs text-gray-600 mt-1">{responseFraction} respondents</p>
            </CardContent>
          </Card>

          {/* Rating - Shows either Instructor or Subject based on view */}
          <Card className="border-green-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">{ratingLabel}</CardTitle>
              {isInstructorView ? <GraduationCap className="w-5 h-5 text-teal-500" /> : <BookOpen className="w-5 h-5 text-orange-500" />}
            </CardHeader>
            <CardContent>
              <div className="text-3xl flex items-center gap-1">
                {parseFloat((displayRating || 0).toString()).toFixed(1)}
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <Progress value={parseFloat((displayRating || 0).toString()) * 20} className="mt-2 h-2" />
              <p className="text-xs text-gray-500 mt-2">
                {isInstructorView ? 'From instructor_feedback table' : 'From subject_feedback table'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Formula Explanation */}
        <Card className="border-green-100 bg-gray-50">
          <CardContent className="py-4">
            <h4 className="font-medium text-gray-700 mb-2">Rating Calculation Formula</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {isInstructorView ? (
                <p><span className="font-medium">Instructor Rating</span> = Average of all instructor feedback ratings for this section (from instructor_feedback table)</p>
              ) : (
                <p><span className="font-medium">Subject Rating</span> = Average of all subject feedback ratings for this section (from subject_feedback table)</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Note: These are separate evaluations. Instructor and Subject ratings are NOT combined.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // View: Selected Instructor - shows their subjects with expanded inline details
  if (selectedInstructor) {
    return (
      <div className="space-y-6">
        {/* Instructor Information Header - Enhanced */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackToInstructors} className="hover:bg-green-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-20 h-20 border-2 border-green-300">
              {selectedInstructor.image ? (
                <img src={selectedInstructor.image} alt={selectedInstructor.full_name} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="bg-green-500 text-white text-xl">
                  {getInitials(selectedInstructor.full_name)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Instructor Information</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedInstructor.full_name}</h2>
              <p className="text-gray-600">{selectedInstructor.school_role} • {selectedInstructor.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-green-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">Subjects</CardTitle>
              <BookOpen className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">{subjects.length}</div>
              <p className="text-xs text-gray-600 mt-1">Teaching this semester</p>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">Total Feedbacks</CardTitle>
              <MessageSquare className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">{selectedInstructor.total_feedbacks}</div>
              <p className="text-xs text-gray-600 mt-1">Student responses</p>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">Avg Rating</CardTitle>
              <Star className="w-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl flex items-center gap-1 font-semibold">
                {selectedInstructor.avg_rating !== undefined && selectedInstructor.avg_rating > 0 
                  ? parseFloat(selectedInstructor.avg_rating.toString()).toFixed(1) 
                  : 'N/A'}
              </div>
              {selectedInstructor.avg_rating !== undefined && selectedInstructor.avg_rating > 0 && (
                <Progress value={parseFloat(selectedInstructor.avg_rating.toString()) * 20} className="mt-2 h-2" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subjects List - NOW WITH EXPANDED INLINE DETAILS (no second click needed) */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-lg">Subjects & Feedback Results</CardTitle>
            <p className="text-sm text-gray-500 font-normal">
              Click any subject to view detailed evaluation results. 
            </p>
          </CardHeader>
          <CardContent>
            {loadingSubjects ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto" />
                <p className="mt-2 text-gray-600">Loading subjects...</p>
              </div>
            ) : subjects.length > 0 ? (
              <div className="space-y-4">
                {subjects.map((subject) => {
                  // Calculate response rate using instructor_feedback_count for By Instructor view
                  const responseRate = subject.student_count > 0 
                    ? ((subject.instructor_feedback_count / subject.student_count) * 100).toFixed(1)
                    : '0';
                  const responseFraction = subject.student_count > 0 
                    ? `${subject.instructor_feedback_count}/${subject.student_count}`
                    : '0/0';
                  
                  return (
                    <div 
                      key={subject.section_id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50/30 transition-all cursor-pointer"
                      onClick={() => handleSubjectClick(subject)}
                    >
                      {/* Subject Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{subject.subject_name}</h3>
                          <p className="text-sm text-gray-600">
                            {subject.subject_code} • Section {subject.section} • Year Level {subject.year_level}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                      
                      {/* Expanded Details - Shown Inline (Instructor Feedback Only) */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        {/* Total Enrolled Students */}
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                          <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                          <div className="text-base font-semibold text-blue-700">{subject.student_count}</div>
                          <div className="text-xs text-blue-600">Enrolled</div>
                        </div>
                        
                        {/* Instructor Feedbacks Submitted - For By Instructor view */}
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                          <MessageSquare className="w-4 h-4 text-green-600 mx-auto mb-1" />
                          <div className="text-base font-semibold text-green-700">{subject.instructor_feedback_count}</div>
                          <div className="text-xs text-green-600">Instructor Feedbacks</div>
                        </div>
                        
                        {/* Response Rate */}
                        <div className="bg-purple-50 rounded-lg p-2 text-center">
                          <BarChart3 className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                          <div className="text-base font-semibold text-purple-700">{responseRate}%</div>
                          <div className="text-xs text-purple-600">Rate</div>
                          <div className="text-xs text-gray-500">({responseFraction})</div>
                        </div>
                        
                        {/* INSTRUCTOR RATING ONLY - for By Instructor view */}
                        <div className="bg-teal-50 rounded-lg p-2 text-center">
                          <GraduationCap className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                          <div className="text-lg font-semibold text-teal-700">
                            {parseFloat((subject.avg_rating || 0).toString()).toFixed(1)}
                          </div>
                          <div className="text-xs text-teal-600">Instructor Rating</div>
                        </div>
                      </div>
                      
                     
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No subjects found for this instructor</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // View: Main - Overview or Instructors
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Feedback Results</h2>
            <p className="text-gray-600 mt-1">View evaluation results by subject and instructor</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={currentView === 'instructors' ? 'default' : 'outline'} 
              onClick={() => setCurrentView('instructors')}
              className={currentView === 'instructors' ? 'bg-green-600' : ''}
            >
              <Users className="w-4 h-4 mr-2" />
              By Instructor
            </Button>
            <Button 
              variant={currentView === 'subjects' ? 'default' : 'outline'} 
              onClick={() => setCurrentView('subjects')}
              className={currentView === 'subjects' ? 'bg-green-600' : ''}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              By Subjects
            </Button>
          </div>
        </div>
      </div>

      {/* Instructor Cards */}
      <>
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={currentView === 'subjects' ? "Search subjects..." : "Search instructors..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <Button variant="outline" className="border-green-200">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Instructor Cards Grid */}
          {currentView === 'instructors' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstructors.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No instructors found</p>
              </div>
            ) : (
              filteredInstructors.map((instructor) => (
                <Card 
                  key={instructor.user_id} 
                  className="border-green-100 hover:border-green-300 cursor-pointer transition-colors"
                  onClick={() => handleInstructorClick(instructor)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-14 h-14">
                        {instructor.image ? (
                          <img src={instructor.image} alt={instructor.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="bg-green-500 text-white text-lg">
                            {getInitials(instructor.full_name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{instructor.full_name}</h3>
                        <p className="text-sm text-gray-600">{instructor.school_role}</p>
                        <p className="text-xs text-gray-400">{instructor.email}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xl font-bold text-green-600">{instructor.total_subjects}</div>
                          <div className="text-xs text-gray-500">Subjects</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-blue-600">{instructor.total_feedbacks}</div>
                          <div className="text-xs text-gray-500">Feedbacks</div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                            {instructor.avg_rating !== undefined && instructor.avg_rating !== null ? parseFloat(instructor.avg_rating.toString()).toFixed(1) : 'N/A'}
                            {instructor.avg_rating > 0 && <Star className="w-4 h-4 text-yellow-500" />}
                          </div>
                          <div className="text-xs text-gray-500">Avg Rating</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          ) : (
            /* Subjects Cards Grid - WITH EXPANDED INLINE DETAILS */
            <div className="space-y-4">
              {loadingAllSubjects ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto" />
                  <p className="mt-2 text-gray-600">Loading subjects...</p>
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No subjects found</p>
                </div>
              ) : (
                filteredSubjects.map((subject) => {
                  // Calculate response rate using subject_feedback_count for By Subject view
                  const responseRate = subject.student_count > 0 
                    ? ((subject.subject_feedback_count / subject.student_count) * 100).toFixed(1)
                    : '0';
                  const responseFraction = subject.student_count > 0 
                    ? `${subject.subject_feedback_count}/${subject.student_count}`
                    : '0/0';
                  
                  return (
                    <Card 
                      key={subject.section_id} 
                      className="border-green-100 hover:border-green-300 cursor-pointer transition-all"
                      onClick={() => handleSubjectClick(subject)}
                    >
                      <CardContent className="p-4">
                        {/* Subject Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                              <GraduationCap className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{subject.subject_name}</h3>
                              <p className="text-sm text-gray-600">{subject.subject_code} • Section {subject.section} • Year {subject.year_level}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                <span className="font-medium">Instructor:</span> {subject.instructor_name || 'Unknown'}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                        
                        {/* Expanded Inline Details (Subject Feedback Only) */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                          {/* Total Enrolled Students */}
                          <div className="bg-blue-50 rounded-lg p-2 text-center">
                            <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                            <div className="text-base font-semibold text-blue-700">{subject.student_count}</div>
                            <div className="text-xs text-blue-600">Enrolled</div>
                          </div>
                          
                          {/* Subject Feedbacks Submitted - For By Subject view */}
                          <div className="bg-green-50 rounded-lg p-2 text-center">
                            <MessageSquare className="w-4 h-4 text-green-600 mx-auto mb-1" />
                            <div className="text-base font-semibold text-green-700">{subject.subject_feedback_count}</div>
                            <div className="text-xs text-green-600">Subject Feedbacks</div>
                          </div>
                          
                          {/* Response Rate */}
                          <div className="bg-purple-50 rounded-lg p-2 text-center">
                            <BarChart3 className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                            <div className="text-base font-semibold text-purple-700">{responseRate}%</div>
                            <div className="text-xs text-purple-600">Rate</div>
                            <div className="text-xs text-gray-500">({responseFraction})</div>
                          </div>
                          
                          {/* SUBJECT RATING ONLY - for By Subjects view */}
                          <div className="bg-orange-50 rounded-lg p-2 text-center">
                            <BookOpen className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                            <div className="text-lg font-semibold text-orange-700">
                              {subject.avg_rating !== undefined && subject.avg_rating !== null ? parseFloat(subject.avg_rating.toString()).toFixed(1) : 'N/A'}
                            </div>
                            <div className="text-xs text-orange-600">Subject Rating</div>
                          </div>
                        </div>
                        
                     
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </>
    </div>
  );
}

