import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BookOpen, Eye, Users, Star, MessageSquare, Loader2 } from "lucide-react";
import { Progress } from "../ui/progress";
import { toast } from "sonner";

interface Subject {
  form_id: number;
  form_name: string;
  description: string;
  category: string;
  status: string;
  response_count: number;
  start_date: string;
  end_date: string;
  shared_at: string;
  avg_rating: number;
  total_responses: number;
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

      {/* My Subjects */}
      <Card className="border-green-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Subjects</CardTitle>
            <Button 
              variant="outline" 
              className="border-green-200 hover:bg-green-50"
              onClick={() => onNavigate?.('my-feedback')}
            >
              View All Feedback
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subjects.length > 0 ? (
            <div className="space-y-4">
              {subjects.map((subject) => (
                <div 
                  key={subject.form_id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-green-200 hover:bg-green-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3>{subject.form_name}</h3>
                        <Badge 
                          variant="outline" 
                          className={subject.status === 'active' ? 'border-green-200 text-green-700' : 'border-gray-200'}
                        >
                          {subject.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{subject.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-2xl">⭐</span>
                      <span className="text-xl">
                        {subject.avg_rating ? parseFloat(subject.avg_rating.toString()).toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Responses</p>
                      <p className="text-lg font-medium">{subject.total_responses || 0} / {subject.response_count || 0}</p>
                      <Progress 
                        value={subject.response_count > 0 ? ((subject.total_responses || 0) / subject.response_count) * 100 : 0} 
                        className="mt-1 h-2" 
                      />
                    </div>
                    <div className="flex items-end justify-end">
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => onNavigate?.('my-feedback')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Feedback
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No subjects assigned yet</p>
              <p className="text-gray-400 text-sm">Subjects will appear here when assigned by admin</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
