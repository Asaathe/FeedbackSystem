import { Card, CardContent, CardHeader, CardTitle } from "../Reusable_components/card";
import { Button } from "../Reusable_components/button";
import { Badge } from "../Reusable_components/badge";
import { 
  Users, 
  FileText, 
  MessageSquare, 
 
  TrendingUp, 

  Award,
 
  Eye,
 
} from "lucide-react";
import { Progress } from "../Reusable_components/progress";

// ============================================================
// TODO: BACKEND - Admin Dashboard Data
// ============================================================
// Dashboard Overview:
// - GET /api/admin/dashboard/stats
//   Response: { totalUsers, activeForms, totalFeedback, avgRating, pendingSuggestions }
//
// Submission Trends:
// - GET /api/admin/dashboard/trends?period=12weeks
//   Response: [{ week, submissions, target }]
//
// Department Response Rates:
// - GET /api/admin/dashboard/response-rates
//   Response: [{ department, actual, target, responses, expected }]
//
// Recent Activities:
// - GET /api/admin/dashboard/activities?limit=10
//   Response: [{ type, description, timestamp, userId }]
// ============================================================

// TEMPORARY: Mock data for development
const systemStats = {
  totalUsers: 3250,
  activeForms: 8,
  totalFeedback: 1256,
  avgRating: 4.3,
  pendingSuggestions: 12,
};

const submissionTrends = [
  { week: 'Week 10', submissions: 145, target: 120 },
  { week: 'Week 11', submissions: 132, target: 120 },
  { week: 'Week 12', submissions: 158, target: 120 },
];





// Helper function to get color based on performance
const getPerformanceColor = (actual: number, target: number) => {
  if (actual >= target) return '#22c55e'; // green - meeting target
  if (actual >= target * 0.85) return '#eab308'; // yellow - at risk
  return '#ef4444'; // red - critical
};

const formActivityData = [
  { type: 'Course Feedback', active: 12, completed: 28 },
  { type: 'Service Feedback', active: 5, completed: 15 },
  { type: 'Alumni Survey', active: 3, completed: 8 },
  { type: 'Instructor Review', active: 4, completed: 12 },
];

const responseRateByRole = [
  { name: 'Students', value: 1245, color: '#22c55e' },
  { name: 'Instructors', value: 412, color: '#3b82f6' },
  { name: 'Alumni', value: 234, color: '#a855f7' },
  { name: 'Staff', value: 187, color: '#f59e0b' },
  { name: 'Employers', value: 89, color: '#ec4899' },
];

const topPerformers = [
  { name: 'Dr. Sarah Johnson', department: 'Computer Science', rating: 4.9, responses: 156 },
  { name: 'Prof. Michael Chen', department: 'Engineering', rating: 4.8, responses: 203 },
  { name: 'Dr. Emily Rodriguez', department: 'Business', rating: 4.7, responses: 128 },
];

const needsAttention = [
  { name: 'Prof. John Williams', department: 'Computer Science', rating: 3.2, issue: 'Low engagement' },
  { name: 'IT Support Department', department: 'Services', rating: 3.8, issue: 'Response time complaints' },
];

const activeForms = [
  { title: 'Midterm Course Feedback', target: 'Students', responses: 520, status: 'Active', period: 'Oct 1-20' },
  { title: 'Alumni Employability Survey', target: 'Alumni', responses: 87, status: 'Active', period: 'Oct 1-31' },
  { title: 'Instructor Performance', target: 'Students', responses: 612, status: 'Active', period: 'Oct 1-25' },
];

const recentSuggestions = [
  { text: 'Extended library hours during exams', submittedBy: 'Student', date: 'Oct 2, 2025', status: 'Pending' },
  { text: 'More WiFi routers in Building A', submittedBy: 'Student', date: 'Oct 1, 2025', status: 'Under Review' },
  { text: 'Improve cafeteria meal options', submittedBy: 'Student', date: 'Sep 30, 2025', status: 'Pending' },
];


interface AdminDashboardProps {
  onNavigate?: (page: string) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps = {}) {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <h2 className="text-2xl">Admin Dashboard</h2>
        <p className="text-gray-600 mt-1">System-wide analytics and management overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Active Forms</CardTitle>
            <FileText className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{systemStats.activeForms}</div>
            <p className="text-xs text-gray-600 mt-1">Currently running</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Total Feedbacks</CardTitle>
            <MessageSquare className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{systemStats.totalFeedback.toLocaleString()}</div>
            <p className="text-xs text-green-600 mt-1">+156 this week</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Avg. Rating</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{systemStats.avgRating}/5</div>
            <Progress value={systemStats.avgRating * 20} className="mt-2 h-2" />
          </CardContent>
        </Card>


        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Total Users</CardTitle>
            <Users className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{systemStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">Registered accounts</p>
          </CardContent>
        </Card>
      </div>

      

      {/* Form Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Activity Summary */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle>Form Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formActivityData.map((form, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                  <div>
                    <p className="font-medium">{form.type}</p>
                    <p className="text-sm text-gray-600">Active: {form.active} | Completed: {form.completed}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{form.active + form.completed}</div>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Response Rate by Role */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle>Response Rate by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {responseRateByRole.map((role, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: role.color }}></div>
                    <span className="font-medium">{role.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{role.value}</div>
                    <p className="text-xs text-gray-500">Responses</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      
      {/* Top Performers & Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card className="border-green-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Top Performing Instructors
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                className="border-green-200 hover:bg-green-50"
                onClick={() => onNavigate?.('analytics')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((performer, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-lime-50 border border-green-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div>
                      <p>{performer.name}</p>
                      <p className="text-sm text-gray-600">{performer.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-lg">⭐</span>
                      <span>{performer.rating}</span>
                    </div>
                    <p className="text-xs text-gray-500">{performer.responses} responses</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        
      </div>

      {/* Active Forms */}
      <Card className="border-green-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Feedback Forms</CardTitle>
            <Button
              className="bg-green-500 hover:bg-green-600"
              onClick={() => {
                console.log('Navigate to forms');
                onNavigate?.('forms');
              }}
            >
              Manage Forms
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeForms.map((form, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-green-200 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4>{form.title}</h4>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {form.status}
                    </Badge>
                    <Badge variant="outline" className="border-gray-300">
                      {form.target}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{form.responses} responses • {form.period}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-green-200 hover:bg-green-50"
                  onClick={() => onNavigate?.('analytics')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Results
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Suggestions */}
      <Card className="border-green-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Suggestions</CardTitle>
            <Button 
              variant="outline"
              className="border-green-200 hover:bg-green-50"
              onClick={() => onNavigate?.('suggestions')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSuggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="flex items-start justify-between p-3 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <p className="mb-1">{suggestion.text}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>By: {suggestion.submittedBy}</span>
                    <span>•</span>
                    <span>{suggestion.date}</span>
                  </div>
                </div>
                <Badge 
                  variant="secondary"
                  className={
                    suggestion.status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }
                >
                  {suggestion.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}