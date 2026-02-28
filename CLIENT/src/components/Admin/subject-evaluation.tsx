import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Progress } from "../ui/progress";
import { 
  BookOpen, 
  Users, 
  Star, 
  ArrowLeft, 
  MessageSquare,
  ChevronRight,
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";

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
  section_id: number;
  subject_name: string;
  subject_code: string;
  section: string;
  year_level: string;
  department: string;
  student_count: number;
  feedback_count: number;
  avg_rating: number;
}

interface FeedbackStats {
  total_responses: number;
  avg_rating: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface SubjectEvaluationProps {
  onNavigate?: (page: string) => void;
}

export function SubjectEvaluation({ onNavigate }: SubjectEvaluationProps = {}) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInstructors();
  }, []);

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
        setInstructors(data.instructors || []);
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
        setSubjects(data.subjects || []);
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

  const fetchSubjectFeedback = async (subjectId: number) => {
    setLoadingFeedback(true);
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error('No auth token found');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/subject-evaluation/subjects/${subjectId}/feedback`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setFeedbackStats(data.statistics);
      } else {
        toast.error(data.message || 'Failed to fetch feedback');
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
    setFeedbackStats(null);
    await fetchInstructorSubjects(instructor.user_id);
  };

  const handleSubjectClick = async (subject: Subject) => {
    setSelectedSubject(subject);
    await fetchSubjectFeedback(subject.section_id);
  };

  const handleBackToInstructors = () => {
    setSelectedInstructor(null);
    setSelectedSubject(null);
    setFeedbackStats(null);
    setSubjects([]);
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
    setFeedbackStats(null);
  };

  const filteredInstructors = instructors.filter(instructor =>
    instructor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.school_role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subject evaluation data...</p>
        </div>
      </div>
    );
  }

  // View: Subject Feedback Details
  if (selectedSubject && feedbackStats) {
    const totalRatings = Object.values(feedbackStats.rating_distribution).reduce((a, b) => a + b, 0);
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackToSubjects}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{selectedSubject.subject_name}</h2>
            <p className="text-gray-600">
              {selectedSubject.subject_code} • {selectedInstructor?.full_name}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-green-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">Total Responses</CardTitle>
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{feedbackStats.total_responses}</div>
              <p className="text-xs text-gray-600 mt-1">Student feedbacks</p>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">Average Rating</CardTitle>
              <Star className="w-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl flex items-center gap-1">
                {parseFloat(feedbackStats.avg_rating.toString()).toFixed(1)}
                <span className="text-lg">{renderStars(parseFloat(feedbackStats.avg_rating.toString()))}</span>
              </div>
              <Progress value={parseFloat(feedbackStats.avg_rating.toString()) * 20} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-gray-600">Students</CardTitle>
              <Users className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{selectedSubject.student_count}</div>
              <p className="text-xs text-gray-600 mt-1">Enrolled students</p>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-lg">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = feedbackStats.rating_distribution[rating as keyof typeof feedbackStats.rating_distribution];
                const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-4">
                    <div className="w-12 flex items-center gap-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm font-medium">{rating}</span>
                    </div>
                    <div className="flex-1">
                      <Progress value={percentage} className="h-3" />
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // View: Subjects List
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
                {parseFloat(selectedInstructor.avg_rating.toString()).toFixed(1)}
                <span className="text-lg">{renderStars(parseFloat(selectedInstructor.avg_rating.toString()))}</span>
              </div>
              <Progress value={parseFloat(selectedInstructor.avg_rating.toString()) * 20} className="mt-2 h-2" />
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
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
                          {parseFloat(subject.avg_rating.toString()).toFixed(1)}
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

  // View: Instructors List
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <h2 className="text-2xl font-bold">Subject Evaluation</h2>
        <p className="text-gray-600 mt-1">View instructor performance and feedback results</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search instructors..."
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInstructors.length > 0 ? (
          filteredInstructors.map((instructor) => (
            <Card 
              key={instructor.user_id}
              className="border-green-100 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleInstructorClick(instructor)}
            >
              <CardHeader className="flex flex-row items-start gap-4 pb-2">
                <Avatar className="w-14 h-14">
                  {instructor.image ? (
                    <img src={instructor.image} alt={instructor.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-green-500 text-white text-lg">
                      {getInitials(instructor.full_name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{instructor.full_name}</CardTitle>
                  <p className="text-sm text-gray-600 truncate">{instructor.school_role || 'No School Role'}</p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <BookOpen className="w-4 h-4" />
                      <span>{instructor.total_subjects || 0} Subjects</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MessageSquare className="w-4 h-4" />
                      <span>{instructor.total_feedbacks || 0} Feedbacks</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {parseFloat(instructor.avg_rating?.toString() || '0').toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">avg rating</span>
                    </div>
                    <Badge variant="outline" className="border-green-200 text-green-700">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No instructors found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SubjectEvaluation;
