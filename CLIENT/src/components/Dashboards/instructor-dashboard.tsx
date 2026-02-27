import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BookOpen, Eye, Users, Star, MessageSquare, Loader2, ChevronLeft, X } from "lucide-react";
import { Progress } from "../ui/progress";
import { toast } from "sonner";

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

interface FeedbackResponse {
  id: number;
  response_data: string;
  submitted_at: string;
  student_name: string;
  student_email: string;
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
}

export function InstructorDashboard({ onNavigate }: InstructorDashboardProps = {}) {
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

  useEffect(() => {
    fetchInstructorData();
  }, []);

  const fetchInstructorData = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error('No auth token found');
        setLoading(false);
        return;
      }

      // Fetch instructor's subjects
      const subjectsResponse = await fetch('http://localhost:5000/api/subject-evaluation/my-subjects', {
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
      const statsResponse = await fetch('http://localhost:5000/api/subject-evaluation/my-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error fetching instructor data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbackResponses = async (subjectId: number) => {
    setLoadingFeedback(true);
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/subject-evaluation/subjects/${subjectId}/feedback`, {
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

  const handleSubjectClick = async (subject: Subject) => {
    setSelectedSubject(subject);
    await fetchFeedbackResponses(subject.subject_id);
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
            {loadingFeedback ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
              </div>
            ) : feedbackResponses.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Feedback Responses ({feedbackResponses.length})</h3>
                {feedbackResponses.map((response) => (
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
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No feedback responses yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <h2 className="text-2xl">Welcome, {instructor?.full_name || 'Instructor'}!</h2>
        <p className="text-gray-600 mt-1">{instructor?.department || 'Department'} Department</p>
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

      {/* My Subjects as Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">My Subjects</h2>
        {subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <Card 
                key={subject.subject_instructor_id}
                className="border-green-100 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleSubjectClick(subject)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-1">{subject.form_name}</CardTitle>
                    <Badge variant="outline" className={subject.status === 'active' ? 'border-green-200 text-green-700' : 'border-gray-200'}>
                      {subject.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{subject.subject_code}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {subject.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {subject.semester} {subject.academic_year}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">
                        {subject.avg_rating ? parseFloat(subject.avg_rating.toString()).toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full mt-4 bg-green-500 hover:bg-green-600"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Feedback
                  </Button>
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
    </div>
  );
}
