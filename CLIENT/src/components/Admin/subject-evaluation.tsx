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
  GraduationCap
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
  avg_rating: number;
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

      const response = await fetch('http://localhost:5000/api/subject-evaluation/instructors', {
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

      const response = await fetch(`http://localhost:5000/api/subject-evaluation/instructors/${instructorId}/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
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
          avg_rating: ((subject.subject_avg || 0) + (subject.instructor_avg || 0)) / 2 || 0
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

      const response = await fetch('http://localhost:5000/api/subject-evaluation/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
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
          avg_rating: ((subject.subject_avg || 0) + (subject.instructor_avg || 0)) / 2 || 0,
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

  // View: Selected Subject - shows analytics and individual responses
  if (selectedSubject) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={selectedInstructor ? handleBackToSubjects : () => setSelectedSubject(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{selectedSubject.subject_name}</h2>
            <p className="text-gray-600">
              {selectedSubject.subject_code} • {selectedInstructor?.full_name || selectedSubject.instructor_name || 'Unknown Instructor'}
            </p>
          </div>
        </div>

        {/* Results by Section Table - Responses vs Enrolled */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-lg">Evaluation Results by Section</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingFeedback ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto" />
                <p className="mt-2 text-gray-600">Loading results...</p>
              </div>
            ) : sectionResults.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead className="text-center">Responses / Enrolled</TableHead>
                    <TableHead className="text-center">Average Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionResults.map((result, index) => (
                    <TableRow key={`${result.respondents}-${index}`}>
                      <TableCell className="font-medium">{result.respondents}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-medium">{result.total_responses}</span>
                          <span className="text-gray-400">/</span>
                          <span>{result.total_enrolled}</span>
                          {Number(result.total_enrolled) > 0 && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({((result.total_responses / Number(result.total_enrolled)) * 100).toFixed(0)}%)
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {result.average !== 'N/A' ? (
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{result.average}</span>
                          </div>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No section data available</p>
                <p className="text-sm text-gray-400 mt-1">Students need to be enrolled in programs for section breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // View: Selected Instructor - shows their subjects
  if (selectedInstructor) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackToInstructors}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-12 h-12">
            {selectedInstructor.image ? (
              <img src={selectedInstructor.image} alt={selectedInstructor.full_name} className="w-full h-full object-cover" />
            ) : (
              <AvatarFallback className="bg-green-500 text-white">
                {getInitials(selectedInstructor.full_name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{selectedInstructor.full_name}</h2>
            <p className="text-gray-600">{selectedInstructor.school_role} • {selectedInstructor.email}</p>
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
              <div className="text-3xl">{subjects.length}</div>
              <p className="text-xs text-gray-600 mt-1">Teaching this semester</p>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">Total Feedbacks</CardTitle>
              <MessageSquare className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{selectedInstructor.total_feedbacks}</div>
              <p className="text-xs text-gray-600 mt-1">Student responses</p>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">Avg Rating</CardTitle>
              <Star className="w-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl flex items-center gap-1">
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

        {/* Subjects List */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-lg">Subjects & Feedback Results</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSubjects ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto" />
                <p className="mt-2 text-gray-600">Loading subjects...</p>
              </div>
            ) : subjects.length > 0 ? (
              <div className="space-y-3">
                {subjects.map((subject) => (
                  <div 
                    key={subject.section_id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-green-200 hover:bg-green-50/50 transition-colors cursor-pointer"
                    onClick={() => handleSubjectClick(subject)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium">{subject.subject_name}</h3>
                        <p className="text-sm text-gray-600">
                          {subject.subject_code} • Section {subject.section} • {subject.year_level}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{subject.student_count} students</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{subject.feedback_count} feedbacks</span>
                      </div>
                      <div className="flex items-center gap-1 ml-auto">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">
                          {parseFloat((subject.avg_rating || 0).toString()).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
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
            /* Subjects Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loadingAllSubjects ? (
                <div className="col-span-full text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto" />
                  <p className="mt-2 text-gray-600">Loading subjects...</p>
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No subjects found</p>
                </div>
              ) : (
                filteredSubjects.map((subject) => (
                  <Card 
                    key={subject.section_id} 
                    className="border-green-100 hover:border-green-300 cursor-pointer transition-colors"
                    onClick={() => handleSubjectClick(subject)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{subject.subject_name}</h3>
                          <p className="text-sm text-gray-600">{subject.subject_code}</p>
                          <p className="text-xs text-gray-400">Section {subject.section} • {subject.year_level}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600 mb-3">
                          <span className="font-medium">Instructor:</span> {subject.instructor_name || 'Unknown'}
                        </p>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-xl font-bold text-blue-600">{subject.student_count}</div>
                            <div className="text-xs text-gray-500">Students</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-green-600">{subject.feedback_count}</div>
                            <div className="text-xs text-gray-500">Feedbacks</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                              {subject.avg_rating !== undefined && subject.avg_rating !== null ? parseFloat(subject.avg_rating.toString()).toFixed(1) : 'N/A'}
                              {subject.avg_rating > 0 && <Star className="w-4 h-4 text-yellow-500" />}
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
          )}
        </>
    </div>
  );
}
