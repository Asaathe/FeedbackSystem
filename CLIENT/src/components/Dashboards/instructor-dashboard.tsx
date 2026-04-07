import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BookOpen, Eye, Users, Star, MessageSquare, Loader2, ChevronLeft, X, GraduationCap, BarChart3, Target, Percent, ChevronRight, Search, ArrowLeft } from "lucide-react";
import { Progress } from "../ui/progress";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

interface Subject {
  subject_instructor_id: number;
  form_id: number;
  subject_id: number;
  subject_code: string;
  form_name: string;
  description: string;
  category: string;
  status: string;
  semester: string;
  academic_year: number;
  response_count: number;
  start_date: string;
  end_date: string;
  shared_at: string;
  avg_rating: number;
  total_responses: number;
}

// Interface for instructor subject evaluation (from /api/subject-evaluation/instructors/:id/subjects)
interface InstructorSubject {
  offering_id: number;
  subject_id: number;
  subject_code: string;
  subject_name: string;
  department: string;
  year_level: string;
  section: string;
  academic_year: number;
  semester: string;
  student_count: number;
  subject_feedback_count: number;
  instructor_feedback_count: number;
  subject_avg: number;
  instructor_avg: number;
}

interface FeedbackResponse {
  id: number;
  response_data: string;
  submitted_at: string;
  student_name: string;
  student_email: string;
}

interface CategoryBreakdown {
  categories_template: Array<{
    id: number;
    name: string;
    feedback_type: string;
  }>;
  instructor_breakdown: {
    categories: Record<string, number>;
    overall_average: number;
    total_responses: number;
  } | null;
  subject_breakdown: {
    categories: Record<string, number>;
    overall_average: number;
    total_responses: number;
  } | null;
}

interface SubjectStats {
  total_students: number;
  total_enrolled: number;
  response_count: number;
  response_rate: number;
  avg_rating: number;
  instructor_avg_rating: number;
  subject_avg_rating: number;
}

interface Instructor {
  user_id: number;
  full_name: string;
  email: string;
  department: string;
  instructor_id: string;
  image: string | null;
}

interface Stats {
  total_students: number;
  total_courses: number;
  total_feedbacks: number;
  avg_rating: number;
}

interface InstructorDashboardProps {
  onNavigate?: (page: string) => void;
  showSubjectsOnly?: boolean;
  showEvaluationView?: boolean;
}

export function InstructorDashboard({ onNavigate, showSubjectsOnly = false, showEvaluationView = false }: InstructorDashboardProps = {}) {
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_students: 0,
    total_courses: 0,
    total_feedbacks: 0,
    avg_rating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [feedbackResponses, setFeedbackResponses] = useState<FeedbackResponse[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);
  const [subjectStats, setSubjectStats] = useState<SubjectStats | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary');
  
  // For subject evaluation view (like admin)
  const [evaluationSubjects, setEvaluationSubjects] = useState<InstructorSubject[]>([]);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [selectedEvalSubject, setSelectedEvalSubject] = useState<InstructorSubject | null>(null);
  const [evalView, setEvalView] = useState<'list' | 'details'>('list');

  useEffect(() => {
    fetchInstructorData();
  }, []);

  // Fetch instructor subjects with evaluation data
  const fetchEvaluationSubjects = async (instructorData?: Instructor) => {
    setLoadingEvaluation(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const targetInstructor = instructorData || instructor;
      
      if (!token || !targetInstructor) {
        toast.error('No auth token or instructor data found');
        return;
      }

      // Use instructor_id (string) instead of user_id (number) as per API requirements
      const response = await fetch(`/api/subject-evaluation/instructors/${targetInstructor.instructor_id}/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setEvaluationSubjects(data.subjects || []);
      } else {
        console.error('API returned error for evaluation subjects:', data);
      }
    } catch (error) {
      console.error('Error fetching evaluation subjects:', error);
      toast.error('Failed to load subjects with evaluation data');
    } finally {
      setLoadingEvaluation(false);
    }
  };

  const handleViewEvaluation = async (subject: InstructorSubject) => {
    setSelectedEvalSubject(subject);
    setEvalView('details');
    await Promise.all([
      fetchCategoryBreakdown(subject.offering_id),
      fetchFeedbackResponses(subject.offering_id)
    ]);
  };

  const fetchInstructorData = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error('No auth token found');
        setLoading(false);
        return null;
      }

      // Fetch instructor's subjects
      const subjectsResponse = await fetch('/api/subject-evaluation/my-subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const subjectsData = await subjectsResponse.json();
      if (subjectsData.success) {
        setInstructor(subjectsData.instructor);
        setSubjects(subjectsData.subjects || []);
      }

      // Fetch stats
      const statsResponse = await fetch('/api/subject-evaluation/my-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }
      
      return subjectsData.instructor;
    } catch (error) {
      console.error('Error fetching instructor data:', error);
      toast.error('Failed to load dashboard data');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbackResponses = async (subjectId: number) => {
    setLoadingFeedback(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`/api/subject-evaluation/subjects/${subjectId}/feedback`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      if (data.success) {
        setFeedbackResponses(data.feedback || []);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback responses');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const fetchCategoryBreakdown = async (subjectId: number) => {
    setLoadingBreakdown(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`/api/subject-evaluation/category-breakdown/${subjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      if (data.success) {
        setCategoryBreakdown(data.data || null);
      }
    } catch (error) {
      console.error('Error fetching category breakdown:', error);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const calculateSubjectStats = (subject: Subject, responses: FeedbackResponse[]) => {
    const totalStudents = subject.response_count || 0;
    const feedbackReceived = responses.length;
    const responseRate = totalStudents > 0 ? (feedbackReceived / totalStudents) * 100 : 0;
    const avgRating = subject.avg_rating || 0;
    
    setSubjectStats({
      total_students: totalStudents,
      total_enrolled: totalStudents,
      response_count: feedbackReceived,
      response_rate: responseRate,
      avg_rating: avgRating,
      instructor_avg_rating: categoryBreakdown?.instructor_breakdown?.overall_average || avgRating,
      subject_avg_rating: categoryBreakdown?.subject_breakdown?.overall_average || avgRating,
    });
  };

  const handleSubjectClick = async (subject: Subject) => {
    setSelectedSubject(subject);
    setViewMode('summary');
    // Use offering_id (subject_instructor_id) for the new evaluation system
    const subjectId = subject.subject_instructor_id || subject.subject_id;
    await fetchFeedbackResponses(subjectId);
    await fetchCategoryBreakdown(subjectId);
  };

  // Handle click on evaluation subject (from My Subjects Cards with feedback data)
  const handleEvalSubjectClick = async (subject: InstructorSubject) => {
    setSelectedEvalSubject(subject);
    setEvalView('details');
    setViewMode('summary');
    await Promise.all([
      fetchCategoryBreakdown(subject.offering_id),
      fetchFeedbackResponses(subject.offering_id)
    ]);
  };

  // Update stats when category breakdown changes
  useEffect(() => {
    if (selectedSubject && feedbackResponses.length > 0) {
      calculateSubjectStats(selectedSubject, feedbackResponses);
    }
  }, [categoryBreakdown, feedbackResponses, selectedSubject]);

  // Load evaluation subjects when component mounts if showEvaluationView or showSubjectsOnly is true
  useEffect(() => {
    if (showEvaluationView || showSubjectsOnly) {
      // If instructor data is not loaded yet, fetch it first
      const loadData = async () => {
        const fetchedInstructor = await fetchInstructorData();
        // Use returned instructor data immediately (not relying on state update)
        if (fetchedInstructor) {
          fetchEvaluationSubjects(fetchedInstructor);
        }
      };
      loadData();
    }
  }, [showEvaluationView, showSubjectsOnly]);

  // Also trigger fetch when instructor data becomes available (for edge cases)
  useEffect(() => {
    if ((showEvaluationView || showSubjectsOnly) && instructor && evaluationSubjects.length === 0 && !loadingEvaluation) {
      fetchEvaluationSubjects();
    }
  }, [instructor, showEvaluationView, showSubjectsOnly, evaluationSubjects.length, loadingEvaluation]);

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

  const parseResponseData = (data: string) => {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If a subject is selected, show the feedback view
  if (selectedSubject) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedSubject(null)}
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Subjects
        </Button>

        <Card className="border-green-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{selectedSubject.form_name}</CardTitle>
                <p className="text-gray-500 mt-1">
                  {selectedSubject.subject_code} • {selectedSubject.semester} Semester {selectedSubject.academic_year}
                </p>
              </div>
              <Badge variant="outline" className={selectedSubject.status === 'active' ? 'border-green-200 text-green-700' : 'border-gray-200'}>
                {selectedSubject.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stats Overview - Different layout from admin */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-700">{selectedSubject.response_count || 0}</p>
                <p className="text-xs text-blue-600">All Students</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <MessageSquare className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">{feedbackResponses.length}</p>
                <p className="text-xs text-green-600">Feedback Received</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Target className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-700">
                  {selectedSubject.response_count > 0 
                    ? ((feedbackResponses.length / selectedSubject.response_count) * 100).toFixed(0) 
                    : 0}%
                </p>
                <p className="text-xs text-purple-600">Response Rate</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-700">
                  {selectedSubject.avg_rating ? parseFloat(selectedSubject.avg_rating.toString()).toFixed(1) : 'N/A'}
                </p>
                <p className="text-xs text-yellow-600">Overall Rating</p>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={viewMode === 'summary' ? 'default' : 'outline'}
                onClick={() => setViewMode('summary')}
                className={viewMode === 'summary' ? 'bg-teal-500 hover:bg-teal-600' : ''}
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Instructor Feedback
              </Button>
              <Button
                variant={viewMode === 'details' ? 'default' : 'outline'}
                onClick={() => setViewMode('details')}
                className={viewMode === 'details' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Subject Feedback
              </Button>
            </div>

            {/* Instructor Feedback Breakdown View */}
            {viewMode === 'summary' && (
              <div className="space-y-6">
                {loadingBreakdown ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                ) : categoryBreakdown && (categoryBreakdown.instructor_breakdown || categoryBreakdown.subject_breakdown) ? (
                  <Tabs defaultValue="instructor" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="instructor" className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        As Instructor
                      </TabsTrigger>
                      <TabsTrigger value="subject" className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        For Subject
                      </TabsTrigger>
                    </TabsList>

                    {/* Instructor Breakdown */}
                    <TabsContent value="instructor">
                      <Card className="border-teal-200">
                        <CardHeader className="bg-teal-50 py-3">
                          <CardTitle className="text-lg text-teal-800 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5" />
                            Instructor Feedback Breakdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-teal-50">
                                <TableHead className="text-teal-800 font-semibold">Category</TableHead>
                                <TableHead className="text-teal-800 font-semibold text-center">Average Score</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(categoryBreakdown.categories_template || [])
                                .filter((cat: any) => cat.feedback_type === 'instructor' || cat.feedback_type === 'both')
                                .map((cat: any) => {
                                  const avg = categoryBreakdown.instructor_breakdown?.categories?.[cat.name];
                                  const hasData = avg !== null && avg !== undefined;
                                  return (
                                    <TableRow key={`instructor-${cat.id}`}>
                                      <TableCell className="font-medium">{cat.name}</TableCell>
                                      <TableCell className="text-center">
                                        {hasData ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-500" />
                                            <span className="font-medium">{avg}</span>
                                          </div>
                                        ) : <span className="text-gray-400">N/A</span>}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              <TableRow className="bg-teal-50 font-semibold">
                                <TableCell>Overall Average</TableCell>
                                <TableCell className="text-center text-lg">
                                  {categoryBreakdown.instructor_breakdown?.overall_average ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <Star className="w-5 h-5 text-yellow-500" />
                                      <span className="text-lg font-bold">
                                        {categoryBreakdown.instructor_breakdown?.overall_average}
                                      </span>
                                    </div>
                                  ) : 'N/A'}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          <div className="p-3 bg-teal-50 text-sm text-teal-700 flex items-center justify-between">
                            <span>Total Responses: {categoryBreakdown.instructor_breakdown?.total_responses || 0}</span>
                            <span>Response Rate: {selectedSubject.response_count > 0 
                              ? ((categoryBreakdown.instructor_breakdown?.total_responses || 0) / selectedSubject.response_count * 100).toFixed(0) 
                              : 0}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Subject Breakdown */}
                    <TabsContent value="subject">
                      <Card className="border-orange-200">
                        <CardHeader className="bg-orange-50 py-3">
                          <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Subject Feedback Breakdown
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-orange-50">
                                <TableHead className="text-orange-800 font-semibold">Category</TableHead>
                                <TableHead className="text-orange-800 font-semibold text-center">Average Score</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(categoryBreakdown.categories_template || [])
                                .filter((cat: any) => cat.feedback_type === 'subject' || cat.feedback_type === 'both')
                                .map((cat: any) => {
                                  const avg = categoryBreakdown.subject_breakdown?.categories?.[cat.name];
                                  const hasData = avg !== null && avg !== undefined;
                                  return (
                                    <TableRow key={`subject-${cat.id}`}>
                                      <TableCell className="font-medium">{cat.name}</TableCell>
                                      <TableCell className="text-center">
                                        {hasData ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-500" />
                                            <span className="font-medium">{avg}</span>
                                          </div>
                                        ) : <span className="text-gray-400">N/A</span>}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              <TableRow className="bg-orange-50 font-semibold">
                                <TableCell>Overall Average</TableCell>
                                <TableCell className="text-center text-lg">
                                  {categoryBreakdown.subject_breakdown?.overall_average ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <Star className="w-5 h-5 text-yellow-500" />
                                      <span className="text-lg font-bold">
                                        {categoryBreakdown.subject_breakdown?.overall_average}
                                      </span>
                                    </div>
                                  ) : 'N/A'}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          <div className="p-3 bg-orange-50 text-sm text-orange-700 flex items-center justify-between">
                            <span>Total Responses: {categoryBreakdown.subject_breakdown?.total_responses || 0}</span>
                            <span>Response Rate: {selectedSubject.response_count > 0 
                              ? ((categoryBreakdown.subject_breakdown?.total_responses || 0) / selectedSubject.response_count * 100).toFixed(0) 
                              : 0}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No breakdown data available yet</p>
                    <p className="text-gray-400 text-sm">Category breakdown will appear after students submit feedback</p>
                  </div>
                )}
              </div>
            )}

            {/* Subject Feedback Breakdown View */}
            {viewMode === 'details' && (
              <div className="space-y-6">
                {loadingBreakdown ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                ) : categoryBreakdown && categoryBreakdown.subject_breakdown ? (
                  <Card className="border-orange-200">
                    <CardHeader className="bg-orange-50 py-3">
                      <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Subject Feedback Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-orange-50">
                            <TableHead className="text-orange-800 font-semibold">Category</TableHead>
                            <TableHead className="text-orange-800 font-semibold text-center">Average Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(categoryBreakdown.categories_template || [])
                            .filter((cat: any) => cat.feedback_type === 'subject' || cat.feedback_type === 'both')
                            .map((cat: any) => {
                              const avg = categoryBreakdown.subject_breakdown?.categories?.[cat.name];
                              const hasData = avg !== null && avg !== undefined;
                              return (
                                <TableRow key={`subject-${cat.id}`}>
                                  <TableCell className="font-medium">{cat.name}</TableCell>
                                  <TableCell className="text-center">
                                    {hasData ? (
                                      <div className="flex items-center justify-center gap-1">
                                        <Star className="w-4 h-4 text-yellow-500" />
                                        <span className="font-medium">{avg}</span>
                                      </div>
                                    ) : <span className="text-gray-400">N/A</span>}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          <TableRow className="bg-orange-100 font-semibold">
                            <TableCell>Overall Average</TableCell>
                            <TableCell className="text-center text-lg">
                              {categoryBreakdown.subject_breakdown?.overall_average ? (
                                <div className="flex items-center justify-center gap-1">
                                  <Star className="w-5 h-5 text-yellow-500" />
                                  <span className="text-lg font-bold">
                                    {categoryBreakdown.subject_breakdown?.overall_average}
                                  </span>
                                </div>
                              ) : 'N/A'}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      <div className="p-3 bg-orange-50 text-sm text-orange-700 flex items-center justify-between">
                        <span>Responses: {categoryBreakdown.subject_breakdown?.total_responses || 0}</span>
                        <span>Rate: {selectedSubject.response_count > 0 
                          ? ((categoryBreakdown.subject_breakdown?.total_responses || 0) / selectedSubject.response_count * 100).toFixed(0) 
                          : 0}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No subject feedback data available yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Individual Responses View (hidden, for reference) */}
            {false && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Feedback Responses ({feedbackResponses.length})</h3>
                {loadingFeedback ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  </div>
                ) : feedbackResponses.length > 0 ? (
                  feedbackResponses.map((response) => (
                    <div 
                      key={response.id} 
                      className="p-4 rounded-lg border border-gray-200 bg-white"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{response.student_name}</p>
                          <p className="text-sm text-gray-500">{response.student_email}</p>
                        </div>
                        <p className="text-sm text-gray-400">
                          {new Date(response.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        {Object.entries(parseResponseData(response.response_data)).map(([key, value]) => (
                          <div key={key} className="mb-2">
                            <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}: </span>
                            <span className="text-gray-800">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No feedback responses yet</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Subject Evaluation View (like admin but filtered to instructor's subjects)
  if (showEvaluationView) {
    if (loadingEvaluation) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading your subject evaluations...</p>
          </div>
        </div>
      );
    }

    // Subject Details View
    if (evalView === 'details' && selectedEvalSubject) {
      return (
        <div className="space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => { setEvalView('list'); setSelectedEvalSubject(null); }}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Subjects
          </Button>

          <Card className="border-green-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedEvalSubject.subject_name}</CardTitle>
                  <p className="text-gray-500 mt-1">
                    {selectedEvalSubject.subject_code} • Section {selectedEvalSubject.section} • {selectedEvalSubject.semester} Semester {selectedEvalSubject.academic_year}
                  </p>
                </div>
                <Badge variant="outline" className="border-green-200 text-green-700">
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Stats Overview - Combined for Instructor and Subject */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700">{selectedEvalSubject.student_count || 0}</p>
                  <p className="text-xs text-blue-600">All Students</p>
                </div>
                <div className="bg-teal-50 rounded-lg p-4 text-center">
                  <GraduationCap className="w-6 h-6 text-teal-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-teal-700">{selectedEvalSubject.instructor_feedback_count || 0}</p>
                  <p className="text-xs text-teal-600">Instructor Feedback</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <BookOpen className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-orange-700">{selectedEvalSubject.subject_feedback_count || 0}</p>
                  <p className="text-xs text-orange-600">Subject Feedback</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <Target className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700">
                    {selectedEvalSubject.student_count > 0 
                      ? Math.round((((selectedEvalSubject.instructor_feedback_count || 0) + (selectedEvalSubject.subject_feedback_count || 0)) / selectedEvalSubject.student_count * 100)) 
                      : 0}%
                  </p>
                  <p className="text-xs text-purple-600">Response Rate</p>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={viewMode === 'summary' ? 'default' : 'outline'}
                  onClick={() => setViewMode('summary')}
                  className={viewMode === 'summary' ? 'bg-teal-500 hover:bg-teal-600' : ''}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Instructor Feedback
                </Button>
                <Button
                  variant={viewMode === 'details' ? 'default' : 'outline'}
                  onClick={() => setViewMode('details')}
                  className={viewMode === 'details' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Subject Feedback
                </Button>
              </div>

              {/* Instructor Feedback Breakdown View */}
              {viewMode === 'summary' && (
                <div className="space-y-6">
                  {loadingBreakdown ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                    </div>
                  ) : categoryBreakdown && (categoryBreakdown.instructor_breakdown || categoryBreakdown.subject_breakdown) ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Instructor Breakdown - Left Side */}
                      <Card className="border-teal-200">
                        <CardHeader className="bg-teal-50 py-3">
                          <CardTitle className="text-lg text-teal-800 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5" />
                            As Instructor
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-teal-50">
                                <TableHead className="text-teal-800 font-semibold">Category</TableHead>
                                <TableHead className="text-teal-800 font-semibold text-center">Average Score</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(categoryBreakdown.categories_template || [])
                                .filter((cat: any) => cat.feedback_type === 'instructor' || cat.feedback_type === 'both')
                                .map((cat: any) => {
                                  const avg = categoryBreakdown.instructor_breakdown?.categories?.[cat.name];
                                  const hasData = avg !== null && avg !== undefined;
                                  return (
                                    <TableRow key={`instructor-${cat.id}`}>
                                      <TableCell className="font-medium">{cat.name}</TableCell>
                                      <TableCell className="text-center">
                                        {hasData ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-500" />
                                            <span className="font-medium">{avg}</span>
                                          </div>
                                        ) : <span className="text-gray-400">N/A</span>}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              <TableRow className="bg-teal-100 font-semibold">
                                <TableCell>Overall Average</TableCell>
                                <TableCell className="text-center text-lg">
                                  {categoryBreakdown.instructor_breakdown?.overall_average ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <Star className="w-5 h-5 text-yellow-500" />
                                      <span className="text-lg font-bold">
                                        {categoryBreakdown.instructor_breakdown?.overall_average}
                                      </span>
                                    </div>
                                  ) : 'N/A'}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          <div className="p-3 bg-teal-50 text-sm text-teal-700 flex items-center justify-between">
                            <span>Responses: {categoryBreakdown.instructor_breakdown?.total_responses || 0}</span>
                            <span>Rate: {selectedEvalSubject.student_count > 0 
                              ? ((categoryBreakdown.instructor_breakdown?.total_responses || 0) / selectedEvalSubject.student_count * 100).toFixed(0) 
                              : 0}%</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Subject Breakdown - Right Side */}
                      <Card className="border-orange-200">
                        <CardHeader className="bg-orange-50 py-3">
                          <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            For Subject
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-orange-50">
                                <TableHead className="text-orange-800 font-semibold">Category</TableHead>
                                <TableHead className="text-orange-800 font-semibold text-center">Average Score</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(categoryBreakdown.categories_template || [])
                                .filter((cat: any) => cat.feedback_type === 'subject' || cat.feedback_type === 'both')
                                .map((cat: any) => {
                                  const avg = categoryBreakdown.subject_breakdown?.categories?.[cat.name];
                                  const hasData = avg !== null && avg !== undefined;
                                  return (
                                    <TableRow key={`subject-${cat.id}`}>
                                      <TableCell className="font-medium">{cat.name}</TableCell>
                                      <TableCell className="text-center">
                                        {hasData ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-500" />
                                            <span className="font-medium">{avg}</span>
                                          </div>
                                        ) : <span className="text-gray-400">N/A</span>}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              <TableRow className="bg-orange-100 font-semibold">
                                <TableCell>Overall Average</TableCell>
                                <TableCell className="text-center text-lg">
                                  {categoryBreakdown.subject_breakdown?.overall_average ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <Star className="w-5 h-5 text-yellow-500" />
                                      <span className="text-lg font-bold">
                                        {categoryBreakdown.subject_breakdown?.overall_average}
                                      </span>
                                    </div>
                                  ) : 'N/A'}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                          <div className="p-3 bg-orange-50 text-sm text-orange-700 flex items-center justify-between">
                            <span>Responses: {categoryBreakdown.subject_breakdown?.total_responses || 0}</span>
                            <span>Rate: {selectedEvalSubject.student_count > 0 
                              ? ((categoryBreakdown.subject_breakdown?.total_responses || 0) / selectedEvalSubject.student_count * 100).toFixed(0) 
                              : 0}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No breakdown data available yet</p>
                      <p className="text-gray-400 text-sm">Category breakdown will appear after students submit feedback</p>
                    </div>
                  )}
                </div>
              )}

              {/* Individual Responses View */}
              {viewMode === 'details' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Feedback Responses ({feedbackResponses.length})</h3>
                  {feedbackResponses.length > 0 ? (
                    feedbackResponses.map((response) => (
                      <div 
                        key={response.id} 
                        className="p-4 rounded-lg border border-gray-200 bg-white"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{response.student_name}</p>
                            <p className="text-sm text-gray-500">{response.student_email}</p>
                          </div>
                          <p className="text-sm text-gray-400">
                            {new Date(response.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          {Object.entries(parseResponseData(response.response_data)).map(([key, value]) => (
                            <div key={key} className="mb-2">
                              <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}: </span>
                              <span className="text-gray-800">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No feedback responses yet</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    // Subject List View
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
          <h2 className="text-2xl font-semibold">My Subject Evaluations</h2>
          <p className="text-gray-600 mt-1">View evaluation results and feedback for your assigned subjects</p>
        </div>

        {loadingEvaluation ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : evaluationSubjects.length > 0 ? (
          <div className="grid gap-4">
            {evaluationSubjects.map((subject) => (
              <Card 
                key={subject.offering_id}
                className="border-green-100 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleViewEvaluation(subject)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="w-5 h-5 text-green-500" />
                        <div>
                          <h3 className="font-semibold text-lg">{subject.subject_name}</h3>
                          <p className="text-sm text-gray-500">
                            {subject.subject_code} • Section {subject.section} • {subject.semester} {subject.academic_year}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Users className="w-4 h-4" />
                          {subject.student_count} Students
                        </span>
                        <span className="flex items-center gap-1 text-teal-600">
                          <GraduationCap className="w-4 h-4" />
                          {subject.instructor_feedback_count} Instructor
                        </span>
                        <span className="flex items-center gap-1 text-orange-600">
                          <BookOpen className="w-4 h-4" />
                          {subject.subject_feedback_count} Subject
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="text-xl font-bold">
                          {subject.subject_avg ? parseFloat(subject.subject_avg.toString()).toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Subject Rating</p>
                      <div className="flex items-center gap-2 mt-2">
                        <GraduationCap className="w-4 h-4 text-teal-500" />
                        <span className="text-sm font-medium">
                          {subject.instructor_avg ? parseFloat(subject.instructor_avg.toString()).toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Instructor Rating</p>
                      <ChevronRight className="w-5 h-5 text-gray-400 mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-green-100">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No subjects with evaluations yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // If showSubjectsOnly is true and a subject is selected, show the detailed feedback view
  if (showSubjectsOnly && selectedEvalSubject && evalView === 'details') {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => { setEvalView('list'); setSelectedEvalSubject(null); }}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Subjects
        </Button>

        <Card className="border-green-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{selectedEvalSubject.subject_name}</CardTitle>
                <p className="text-gray-500 mt-1">
                  {selectedEvalSubject.subject_code} • Section {selectedEvalSubject.section} • {selectedEvalSubject.semester} Semester {selectedEvalSubject.academic_year}
                </p>
              </div>
              <Badge variant="outline" className="border-green-200 text-green-700">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stats Overview - Combined for Instructor and Subject */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-700">{selectedEvalSubject.student_count || 0}</p>
                <p className="text-xs text-blue-600">All Students</p>
              </div>
              <div className="bg-lime-100 rounded-lg p-4 text-center">
                <GraduationCap className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-teal-800">{selectedEvalSubject.instructor_feedback_count || 0}</p>
                <p className="text-xs text-teal-700">Instructor Feedback</p>
              </div>
              <div className="bg-orange-100 rounded-lg p-4 text-center">
                <BookOpen className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-800">{selectedEvalSubject.subject_feedback_count || 0}</p>
                <p className="text-xs text-orange-700">Subject Feedback</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Target className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-700">
                  {selectedEvalSubject.student_count > 0 
                    ? Math.round((((selectedEvalSubject.instructor_feedback_count || 0) + (selectedEvalSubject.subject_feedback_count || 0)) / selectedEvalSubject.student_count * 100)) 
                    : 0}%
                </p>
                <p className="text-xs text-purple-600">Response Rate</p>
              </div>
            </div>

            {/* Show both Instructor and Subject Feedback breakdown by default */}
            <div className="space-y-6">
              {loadingBreakdown ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                </div>
              ) : categoryBreakdown && (categoryBreakdown.instructor_breakdown || categoryBreakdown.subject_breakdown) ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Instructor Breakdown - Left Side */}
                  <Card className="border-lime-300 overflow-hidden">
                      <CardHeader className="bg-lime-200 py-4 rounded-t-lg">
                        <CardTitle className="text-lg text-lime-800 flex items-center gap-2">
                          <GraduationCap className="w-5 h-5" />
                          As Instructor
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2">
                        <div className="overflow-x-hidden scrollbar-hide">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-lime-50">
                                <TableHead className="text-lime-800 font-semibold">Category</TableHead>
                                <TableHead className="text-lime-800 font-semibold text-center">Average Score</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(categoryBreakdown.categories_template || [])
                                .filter((cat: any) => cat.feedback_type === 'instructor' || cat.feedback_type === 'both')
                                .map((cat: any) => {
                                  const avg = categoryBreakdown.instructor_breakdown?.categories?.[cat.name];
                                  const hasData = avg !== null && avg !== undefined;
                                  return (
                                    <TableRow key={`instructor-${cat.id}`}>
                                      <TableCell className="font-medium">{cat.name}</TableCell>
                                      <TableCell className="text-center">
                                        {hasData ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-500" />
                                            <span className="font-medium">{avg}</span>
                                          </div>
                                        ) : <span className="text-gray-400">N/A</span>}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              <TableRow className="bg-lime-100 font-semibold">
                                <TableCell>Overall Average</TableCell>
                                <TableCell className="text-center text-lg">
                                  {categoryBreakdown.instructor_breakdown?.overall_average ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <Star className="w-5 h-5 text-yellow-500" />
                                      <span className="text-lg font-bold">
                                        {categoryBreakdown.instructor_breakdown?.overall_average}
                                      </span>
                                    </div>
                                  ) : 'N/A'}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                        <div className="p-3 bg-lime-50 text-sm text-lime-700 flex items-center justify-between mt-3 rounded-b-lg">
                          <span>Responses: {categoryBreakdown.instructor_breakdown?.total_responses || 0}</span>
                          <span>Rate: {selectedEvalSubject.student_count > 0 
                            ? ((categoryBreakdown.instructor_breakdown?.total_responses || 0) / selectedEvalSubject.student_count * 100).toFixed(0) 
                            : 0}%</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Subject Breakdown - Right Side */}
                    <Card className="border-orange-400 overflow-hidden">
                      <CardHeader className="bg-orange-200 py-4 rounded-t-lg">
                        <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          For Subject
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="overflow-x-hidden scrollbar-hide">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-orange-50">
                                <TableHead className="text-orange-800 font-semibold">Category</TableHead>
                                <TableHead className="text-orange-800 font-semibold text-center">Average Score</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(categoryBreakdown.categories_template || [])
                                .filter((cat: any) => cat.feedback_type === 'subject' || cat.feedback_type === 'both')
                                .map((cat: any) => {
                                  const avg = categoryBreakdown.subject_breakdown?.categories?.[cat.name];
                                  const hasData = avg !== null && avg !== undefined;
                                  return (
                                    <TableRow key={`subject-${cat.id}`}>
                                      <TableCell className="font-medium">{cat.name}</TableCell>
                                      <TableCell className="text-center">
                                        {hasData ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-500" />
                                            <span className="font-medium">{avg}</span>
                                          </div>
                                        ) : <span className="text-gray-400">N/A</span>}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              <TableRow className="bg-orange-100 font-semibold">
                                <TableCell>Overall Average</TableCell>
                                <TableCell className="text-center text-lg">
                                  {categoryBreakdown.subject_breakdown?.overall_average ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <Star className="w-5 h-5 text-yellow-500" />
                                      <span className="text-lg font-bold">
                                        {categoryBreakdown.subject_breakdown?.overall_average}
                                      </span>
                                    </div>
                                  ) : 'N/A'}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                        <div className="p-3 bg-orange-50 text-sm text-orange-700 flex items-center justify-between mt-3 rounded-b-lg">
                          <span>Responses: {categoryBreakdown.subject_breakdown?.total_responses || 0}</span>
                          <span>Rate: {selectedEvalSubject.student_count > 0 
                            ? ((categoryBreakdown.subject_breakdown?.total_responses || 0) / selectedEvalSubject.student_count * 100).toFixed(0) 
                            : 0}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No breakdown data available yet</p>
                    <p className="text-gray-400 text-sm">Category breakdown will appear after students submit feedback</p>
                  </div>
                )}
              </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If showSubjectsOnly is true, render only the My Subjects view
  if (showSubjectsOnly) {
    // Use evaluationSubjects if available, otherwise show loading
    const displaySubjects = loadingEvaluation ? [] : evaluationSubjects;
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold">My Subjects</h2>
              <p className="text-gray-600 mt-1">View and manage your assigned subjects with feedback data</p>
            </div>
          </div>
        </div>

        {/* My Subjects Cards */}
        {loadingEvaluation ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        ) : displaySubjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displaySubjects.map((subject) => (
              <Card 
                key={subject.offering_id}
                className="border-green-100 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleEvalSubjectClick(subject)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-1">{subject.subject_name}</CardTitle>
                    <Badge variant="outline" className="border-green-200 text-green-700">
                      Active
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{subject.subject_code} • Section {subject.section}</p>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 mb-3">
                    <p>{subject.department}</p>
                    <p className="text-gray-500">{subject.semester} Semester {subject.academic_year}</p>
                  </div>
                  
                  {/* Instructor and Subject Feedback Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-lime-100 rounded-md p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <GraduationCap className="w-4 h-4 text-teal-700" />
                        <span className="font-bold text-teal-800">
                          {subject.instructor_avg ? parseFloat(subject.instructor_avg.toString()).toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-teal-700">Instructor Rating</p>
                    </div>
                    <div className="bg-orange-100 rounded-md p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <BookOpen className="w-4 h-4 text-orange-700" />
                        <span className="font-bold text-orange-800">
                          {subject.subject_avg ? parseFloat(subject.subject_avg.toString()).toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-orange-700">Subject Rating</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{subject.student_count || 0} Students</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm bg-green-100 p-2 rounded-md mb-3">
                    <div className="flex-1 text-center border-r border-green-200">
                      <span className="text-green-700 font-medium">
                        {subject.instructor_feedback_count || 0}
                      </span>
                      <span className="text-green-600 text-xs ml-1">Instructor</span>
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-green-700 font-medium">
                        {subject.subject_feedback_count || 0}
                      </span>
                      <span className="text-green-600 text-xs ml-1">Subject</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-green-100">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No subjects assigned yet</p>
              <p className="text-gray-400 text-sm">Subjects will appear here when assigned by admin</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Default Dashboard view - stats only (no subjects tab)
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl">Welcome, {instructor?.full_name || 'Instructor'}!</h2>
            <p className="text-gray-600 mt-1">{instructor?.department || 'Department'} Department</p>
          </div>
          <Badge className="bg-green-500">Instructor</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">My Courses</CardTitle>
            <BookOpen className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{subjects.length}</div>
            <p className="text-xs text-gray-600 mt-1">Assigned subjects</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Total Students</CardTitle>
            <Users className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.total_students}</div>
            <p className="text-xs text-gray-600 mt-1">Across all subjects</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Avg Rating</CardTitle>
            <Star className="w-5 h-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl flex items-center gap-1">
              {parseFloat(stats.avg_rating.toString()).toFixed(1)}
              <span className="text-lg">{renderStars(parseFloat(stats.avg_rating.toString()))}</span>
            </div>
            <Progress value={parseFloat(stats.avg_rating.toString()) * 20} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Feedback Received</CardTitle>
            <MessageSquare className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{stats.total_feedbacks}</div>
            <p className="text-xs text-gray-600 mt-1">Student responses</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

