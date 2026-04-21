import { useState, useEffect, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Users,
  FileText,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FadeContent, SlideContent } from "../ui/transition-container";

interface SystemStats {
  totalUsers: number;
  activeForms: number;
  totalFeedback: number;
}

interface FormActivity {
  type: string;
  active: number;
  completed: number;
}

interface ResponseRate {
  name: string;
  value: number;
  color: string;
}

interface ActiveForm {
  title: string;
  target: string;
  responses: number;
  status: string;
  period: string;
}

interface AdminDashboardProps {
  onNavigate?: (page: string) => void;
}

export const AdminDashboard = memo(function AdminDashboard({ onNavigate }: AdminDashboardProps = {}) {
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeForms: 0,
    totalFeedback: 0,
  });
  const [formActivityData, setFormActivityData] = useState<FormActivity[]>([]);
  const [responseRateByRole, setResponseRateByRole] = useState<ResponseRate[]>([]);
  const [activeForms, setActiveForms] = useState<ActiveForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {

    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        setLoading(false);
        return;
      }

      // Single optimized endpoint for all dashboard data
      const response = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          const { stats } = data;
          
          setSystemStats({
            totalUsers: stats.total || 0,
            activeForms: stats.activeForms || 0,
            totalFeedback: stats.totalFeedback || 0,
          });

          // Transform users by role to pie chart format
          const roleColors: { [key: string]: string } = {
            student: '#22c55e',
            instructor: '#3b82f6',
            alumni: '#a855f7',
            employer: '#ec4899',
          };

          const userData = (stats.byRole || []).map((r: any) => ({
            name: r.role.charAt(0).toUpperCase() + r.role.slice(1),
            value: parseInt(r.count) || 0,
            color: roleColors[r.role] || '#666666',
          }));

          setResponseRateByRole(userData);

          // Transform forms by category to bar chart format
          const activityByType: { [key: string]: { active: number; completed: number } } = {};
          (stats.formsByCategory || []).forEach((form: any) => {
            const type = form.category || 'General';
            if (!activityByType[type]) {
              activityByType[type] = { active: 0, completed: 0 };
            }
            if (form.status === 'active') {
              activityByType[type].active = parseInt(form.count) || 0;
            } else {
              activityByType[type].completed = parseInt(form.count) || 0;
            }
          });

          setFormActivityData(Object.entries(activityByType).map(([type, counts]) => ({
            type,
            active: counts.active,
            completed: counts.completed,
          })));

          // Set recent forms
          setActiveForms((stats.recentForms || []).slice(0, 3).map((form: any) => ({
            title: form.title,
            target: form.target_audience || 'All',
            responses: form.submission_count || 0,
            status: form.status,
            period: form.start_date 
              ? `${new Date(form.start_date).toLocaleDateString()} - ${new Date(form.end_date).toLocaleDateString()}` 
              : 'Ongoing',
          })));
        }
      } else {
        throw new Error('Failed to fetch dashboard stats');
      }

      console.log('Dashboard data loaded successfully');

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoading(false);
      setTimeout(() => setDataLoaded(true), 100);
    }
  };

  if (loading) {
    return (
      <FadeContent isVisible={true}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
        </div>
      </FadeContent>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <SlideContent isVisible={dataLoaded} direction="down">
        <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
          <h2 className="text-2xl">Admin Dashboard</h2>
          <p className="text-gray-600 mt-1">System-wide analytics and management overview</p>
        </div>
      </SlideContent>

      {/* Error Message */}
      {error && (
        <FadeContent isVisible={!!error}>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </FadeContent>
      )}

      {/* Key Metrics */}
      <FadeContent isVisible={dataLoaded}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <FadeContent isVisible={dataLoaded} className="delay-100">
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
          </FadeContent>

          <FadeContent isVisible={dataLoaded} className="delay-200">
            <Card className="border-green-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-gray-600">Total Feedbacks</CardTitle>
                <MessageSquare className="w-5 h-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl">{systemStats.totalFeedback.toLocaleString()}</div>
                <p className="text-xs text-green-600 mt-1">Total submissions</p>
              </CardContent>
            </Card>
          </FadeContent>

          <FadeContent isVisible={dataLoaded} className="delay-300">
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
          </FadeContent>
        </div>
      </FadeContent>

      {/* Charts Section - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Activity Summary - Bar Chart */}
        <SlideContent isVisible={dataLoaded} direction="left">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-lg">Form Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {formActivityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formActivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="active" fill="#22c55e" name="Active" />
                    <Bar dataKey="completed" fill="#3b82f6" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No form activity data available</p>
              )}
            </CardContent>
          </Card>
        </SlideContent>

        {/* User Distribution by Role - Pie Chart */}
        <SlideContent isVisible={dataLoaded} direction="right">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-lg">User Distribution by Role</CardTitle>
            </CardHeader>
            <CardContent>
              {responseRateByRole.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={responseRateByRole}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {responseRateByRole.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No user data available</p>
              )}
            </CardContent>
          </Card>
        </SlideContent>
      </div>

      {/* Active Forms List */}
      <SlideContent isVisible={dataLoaded} direction="up">
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="text-lg">Active Forms</CardTitle>
          </CardHeader>
          <CardContent>
            {activeForms.length > 0 ? (
              <div className="space-y-3">
                {activeForms.slice(0, 3).map((form, index) => (
                  <FadeContent
                    key={index}
                    isVisible={dataLoaded}
                    className={`delay-${(index + 1) * 100}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{form.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">
                          Target: {form.target} • Period: {form.period}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <div className="text-lg font-semibold text-green-600">{form.responses}</div>
                        <div className="text-xs text-gray-600">responses</div>
                      </div>
                    </div>
                  </FadeContent>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No active forms available</p>
            )}
          </CardContent>
        </Card>
      </SlideContent>
    </div>
  );
});
