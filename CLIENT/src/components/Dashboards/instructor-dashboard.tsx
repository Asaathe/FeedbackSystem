import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BookOpen, Eye } from "lucide-react";
import { Progress } from "../ui/progress";
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
// ============================================================

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
            <BookOpen className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{avgRating}/5</div>
            <Progress value={parseFloat(avgRating) * 20} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Feedback Received</CardTitle>
            <BookOpen className="w-5 h-5 text-blue-500" />
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
    </div>
  );
}