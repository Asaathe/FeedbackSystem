import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Users, 
  FileText, 
  MessageSquare, 
 
  TrendingUp, 

  Award,
 
  Eye,
 
} from "lucide-react";
import { Progress } from "../ui/progress";


const systemStats = {
  totalUsers: 3250,
  activeForms: 8,
  totalFeedback: 1256,
  avgRating: 4.3,
  pendingSuggestions: 12,
};



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
       

        
      </div>

      
      {/* Top Performers & Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
      

        
      </div>

      

      
    </div>
  );
}