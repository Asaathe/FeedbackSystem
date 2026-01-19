import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BookOpen, TrendingUp, MessageSquare, Eye, AlertCircle } from "lucide-react";
import { Progress } from "../ui/progress";
import { AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getFormsForUserRole, getFormStatsForUser, PublishedForm } from "../../services/publishedFormsService";

// ============================================================
// TODO: BACKEND - Instructor Dashboard Data
// ============================================================
// Dashboard Overview:
// - GET /api/instructor/dashboard/overview?instructorId={id}
//   Response: { totalStudents, coursesTeaching, avgRating, totalFeedback }
//
// My Courses:
// - GET /api/instructor/courses
//   Response: [{ id, code, name, section, students, feedbackCount, avgRating, responseRate }]
//
// Performance Metrics:
// - GET /api/instructor/performance-metrics
//   Response: [{ metric, value, fullMark }]
//
// Engagement Trends:
// - GET /api/instructor/engagement-trends?weeks=6
//   Response: [{ week, CS101, CS201, CS301 }] // per course
// ============================================================

// TEMPORARY: Mock data for development
const engagementTrendData = [
  { week: 'Week 1', CS101: 82, CS201: 78, CS301: 85 },
  { week: 'Week 2', CS101: 85, CS201: 80, CS301: 87 },
  { week: 'Week 3', CS101: 83, CS201: 83, CS301: 86 },
  { week: 'Week 4', CS101: 88, CS201: 85, CS301: 88 },
  { week: 'Week 5', CS101: 84, CS201: 84, CS301: 89 },
  { week: 'Week 6', CS101: 87, CS201: 86, CS301: 90 },
];

const performanceMetricsData = [
  { metric: 'Content Quality', value: 4.5, fullMark: 5 },
  { metric: 'Engagement', value: 4.3, fullMark: 5 },
  { metric: 'Clarity', value: 4.7, fullMark: 5 },
  { metric: 'Availability', value: 4.2, fullMark: 5 },
  { metric: 'Feedback', value: 4.4, fullMark: 5 },
];

const myCourses = [
  {
    id: 1,
    code: 'CS101',
    name: 'Introduction to Computer Science',
    section: 'A',
    students: 45,
    feedbackCount: 38,
    avgRating: 4.5,
    responseRate: 84,
    status: 'active',
  },
  {
    id: 2,
    code: 'CS201',
    name: 'Data Structures and Algorithms',
    section: 'B',
    students: 42,
    feedbackCount: 35,
    avgRating: 4.3,
    responseRate: 83,
    status: 'active',
  },
  {
    id: 3,
    code: 'CS301',
    name: 'Database Management Systems',
    section: 'A',
    students: 38,
    feedbackCount: 30,
    avgRating: 4.7,
    responseRate: 79,
    status: 'active',
  },
];

const recentFeedback = [
  { course: 'CS101', comment: 'Great explanations and engaging lectures!', rating: 5, date: 'Oct 1, 2025' },
  { course: 'CS201', comment: 'Clear examples, but assignments are challenging.', rating: 4, date: 'Sep 30, 2025' },
  { course: 'CS301', comment: 'Very practical approach to database concepts.', rating: 5, date: 'Sep 29, 2025' },
];

const improvementAreas = [
  { area: 'More hands-on examples', mentions: 12, course: 'CS201' },
  { area: 'Clearer assignment instructions', mentions: 8, course: 'CS101' },
];

interface InstructorDashboardProps {
  onNavigate?: (page: string) => void;
}

export function InstructorDashboard({ onNavigate }: InstructorDashboardProps = {}) {
  const [instructorForms, setInstructorForms] = useState<PublishedForm[]>([]);
  const [formStats, setFormStats] = useState({ pending: 0, completed: 0, total: 0, completionRate: 0 });

  useEffect(() => {
    const loadData = async () => {
      const forms = await getFormsForUserRole('instructor');
      setInstructorForms(forms);
      const stats = await getFormStatsForUser('instructor');
      setFormStats(stats);
    };
    loadData();
  }, []);
  
  const totalStudents = myCourses.reduce((sum, course) => sum + course.students, 0);
  const totalFeedback = myCourses.reduce((sum, course) => sum + course.feedbackCount, 0);
  const avgRating = (myCourses.reduce((sum, course) => sum + course.avgRating, 0) / myCourses.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <h2 className="text-2xl">Welcome, Dr. Sarah Johnson!</h2>
        <p className="text-gray-600 mt-1">Computer Science Department</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">My Courses</CardTitle>
            <BookOpen className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{myCourses.length}</div>
            <p className="text-xs text-gray-600 mt-1">This semester</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Total Students</CardTitle>
            <BookOpen className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{totalStudents}</div>
            <p className="text-xs text-gray-600 mt-1">Across all courses</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Avg Rating</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{avgRating}/5</div>
            <Progress value={parseFloat(avgRating) * 20} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Feedback Received</CardTitle>
            <MessageSquare className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{totalFeedback}</div>
            <p className="text-xs text-gray-600 mt-1">Student responses</p>
          </CardContent>
        </Card>
      </div>

      {/* My Courses */}
      <Card className="border-green-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Courses</CardTitle>
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
          <div className="space-y-4">
            {myCourses.map((course) => (
              <div 
                key={course.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-green-200 hover:bg-green-50/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3>{course.code} - {course.name}</h3>
                      <Badge variant="outline" className="border-green-200">
                        Section {course.section}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{course.students} students • {course.feedbackCount} responses</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl">⭐</span>
                    <span className="text-xl">{course.avgRating}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600">Response Rate</p>
                    <Progress value={course.responseRate} className="mt-1 h-2" />
                    <p className="text-xs text-gray-500 mt-1">{course.responseRate}%</p>
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
        </CardContent>
      </Card>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Engagement Trend */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle>Student Engagement Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={engagementTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="CS101" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                <Area type="monotone" dataKey="CS201" stackId="1" stroke="#84cc16" fill="#84cc16" fillOpacity={0.6} />
                <Area type="monotone" dataKey="CS301" stackId="1" stroke="#bef264" fill="#bef264" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Radar */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle>Teaching Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={performanceMetricsData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 5]} />
                <Radar name="Your Rating" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle>Recent Feedback Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentFeedback.map((feedback, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="border-blue-200">
                      {feedback.course}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{feedback.comment}</p>
                  <p className="text-xs text-gray-500">{feedback.date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {improvementAreas.map((area, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg bg-white border border-orange-200"
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm">{area.area}</p>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      {area.mentions} mentions
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{area.course}</p>
                </div>
              ))}
              <p className="text-sm text-orange-700 mt-3">
                💡 Consider addressing these suggestions to improve student satisfaction
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="border-green-100 bg-gradient-to-r from-green-50 to-lime-50">
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4>Excellent Overall Performance</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Your average rating of {avgRating}/5 is above the department average of 4.2. Keep up the great work!
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4>High Student Engagement</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    82% average response rate shows strong student engagement with your courses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}