import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ClipboardList, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "../ui/progress";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getFormsForUserRole, getFormStatsForUser, getCompletedFormsForUser, PublishedForm } from "../../services/publishedFormsService";



// Generate completion trend data (mock for now, would come from analytics API)
const completionTrendData = [
  { week: 'Week 1', completed: 2, target: 3 },
  { week: 'Week 2', completed: 3, target: 4 },
  { week: 'Week 3', completed: 4, target: 5 },
  { week: 'Week 4', completed: 3, target: 4 },
  { week: 'Week 5', completed: 5, target: 5 },
  { week: 'Week 6', completed: 4, target: 4 },
];

const feedbackStatusData = [
  { name: 'Pending', value: 3, color: '#f97316' },
  { name: 'Completed', value: 3, color: '#22c55e' },
  { name: 'Overdue', value: 1, color: '#ef4444' },
];

interface StudentDashboardProps {
  onNavigate?: (page: string) => void;
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps = {}) {
  const [publishedForms, setPublishedForms] = useState<PublishedForm[]>([]);
  const [formStats, setFormStats] = useState({ pending: 0, completed: 0, total: 0, completionRate: 0 });
  const [completedForms, setCompletedForms] = useState<Array<{title: string, date: string, rating?: number}>>([]);
  const [submittedFormIds, setSubmittedFormIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      const forms = await getFormsForUserRole('student');
      setPublishedForms(forms);
      const stats = await getFormStatsForUser('student');
      setFormStats(stats);
      const completed = await getCompletedFormsForUser('student');
      setCompletedForms(completed || []);

      // Fetch submitted form ids
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('authToken');
        if (token) {
          const response = await fetch('http://localhost:5000/api/forms/my-responses', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const result = await response.json();
            const submittedIds = new Set<string>(result.responses?.map((r: any) => String(r.form_id)) || []);
            setSubmittedFormIds(submittedIds);
          }
        }
      } catch (error) {
        console.error('Error fetching submitted forms:', error);
      }
    };
    loadData();
  }, []);

  // Transform published forms to match expected format
  const pendingForms = publishedForms
    .filter(form => form.assignment_status === 'pending' && !submittedFormIds.has(form.id))
    .map(form => ({
      id: form.id,
      title: form.title,
      course: form.category === 'Academic' ? form.title : null,
      instructor: form.category === 'Academic' ? 'Instructor' : null,
      dueDate: form.dueDate,
      priority: form.category === 'Academic' ? 'high' : 'medium',
    }));

  // Get completed forms count
  const completedFormsCount = publishedForms.filter(form => form.assignment_status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <h2 className="text-2xl">Welcome back, Student!</h2>
        <p className="text-gray-600 mt-1">You have {pendingForms.length} pending feedback forms to complete.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Pending</CardTitle>
            <Clock className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{pendingForms.length}</div>
            <p className="text-xs text-orange-600 mt-1">Due this week</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Completed</CardTitle>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{completedFormsCount}</div>
            <p className="text-xs text-green-600 mt-1">This semester</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Completion Rate</CardTitle>
            <ClipboardList className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{formStats.completionRate}%</div>
            <Progress value={formStats.completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Active Courses</CardTitle>
            <AlertCircle className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">5</div>
            <p className="text-xs text-gray-600 mt-1">Fall 2025</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Forms */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>Pending Feedback Forms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingForms.map((form) => (
              <div 
                key={form.id} 
                className="p-4 rounded-lg border border-gray-200 hover:border-green-200 hover:bg-green-50/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3>{form.title}</h3>
                      <Badge 
                        variant="secondary"
                        className={
                          form.priority === 'high' 
                            ? 'bg-red-100 text-red-700' 
                            : form.priority === 'medium'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                        }
                      >
                        {form.priority}
                      </Badge>
                    </div>
                    {form.course && <p className="text-sm text-gray-600">{form.course}</p>}
                    {form.instructor && <p className="text-sm text-gray-500">{form.instructor}</p>}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-500">Due</p>
                    <p className="text-sm">{form.dueDate}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    className="bg-green-500 hover:bg-green-600"
                    disabled={submittedFormIds.has(form.id)}
                    onClick={() => onNavigate?.('submit-feedback')}
                  >
                    {submittedFormIds.has(form.id) ? 'Already Submitted' : 'Start Feedback'}
                  </Button>
                  <Button variant="outline" className="border-green-200 hover:bg-green-50">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Trend */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle>Your Completion Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={completionTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} name="Completed" />
                <Line type="monotone" dataKey="target" stroke="#84cc16" strokeWidth={2} strokeDasharray="5 5" name="Target" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feedback Status Distribution */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle>Feedback Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={feedbackStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {feedbackStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recently Completed */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>Recently Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completedForms.map((form, index) => (
              <div 
                key={index}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p>{form.title}</p>
                    <p className="text-sm text-gray-500">{form.date}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span 
                      key={i} 
                      className={`text-lg ${i < (form.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}