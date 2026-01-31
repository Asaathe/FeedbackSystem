import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { 
  Users, 
  FileText, 
  MessageSquare
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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

export function AdminDashboard({ onNavigate }: AdminDashboardProps = {}) {
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeForms: 0,
    totalFeedback: 0,
  });
  const [formActivityData, setFormActivityData] = useState<FormActivity[]>([]);
  const [responseRateByRole, setResponseRateByRole] = useState<ResponseRate[]>([]);
  const [activeForms, setActiveForms] = useState<ActiveForm[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Fetch forms data
      const formsResponse = await fetch('http://localhost:5000/api/forms?status=active&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (formsResponse.ok) {
        const formsData = await formsResponse.json();
        if (formsData.success && formsData.forms) {
          const forms = formsData.forms;
          
          // Calculate system stats
          const totalFeedback = forms.reduce((sum: number, form: any) => sum + (form.submission_count || 0), 0);
          const activeFormsCount = forms.length;
          
          setSystemStats({
            totalUsers: 0, // Will be updated from users API
            activeForms: activeFormsCount,
            totalFeedback: totalFeedback,
          });

          // Set active forms
          setActiveForms(forms.map((form: any) => ({
            title: form.title,
            target: form.target_audience || 'All',
            responses: form.submission_count || 0,
            status: form.status,
            period: form.start_date ? `${new Date(form.start_date).toLocaleDateString()} - ${new Date(form.end_date).toLocaleDateString()}` : 'Ongoing',
          })));

          // Calculate form activity by category
          const activityByType: { [key: string]: { active: number; completed: number } } = {};
          forms.forEach((form: any) => {
            const type = form.category || 'General';
            if (!activityByType[type]) {
              activityByType[type] = { active: 0, completed: 0 };
            }
            if (form.status === 'active') {
              activityByType[type].active++;
            } else {
              activityByType[type].completed++;
            }
          });

          setFormActivityData(Object.entries(activityByType).map(([type, counts]) => ({
            type,
            active: counts.active,
            completed: counts.completed,
          })));
        }
      }

      // Fetch users data by role
      const roles = ['student', 'instructor', 'alumni', 'employer'];
      const roleColors: { [key: string]: string } = {
        student: '#22c55e',
        instructor: '#3b82f6',
        alumni: '#a855f7',
        employer: '#ec4899',
      };

      const rolePromises = roles.map(async (role) => {
        const response = await fetch(`http://localhost:5000/api/users?role=${role}&limit=1`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          return {
            name: role.charAt(0).toUpperCase() + role.slice(1),
            value: data.pagination?.total || 0,
            color: roleColors[role],
          };
        }
        return null;
      });

      const roleResults = await Promise.all(rolePromises);
      const validRoleResults = roleResults.filter((r): r is ResponseRate => r !== null);
      setResponseRateByRole(validRoleResults);

      // Calculate total users
      const totalUsers = validRoleResults.reduce((sum, role) => sum + role.value, 0);
      setSystemStats(prev => ({ ...prev, totalUsers }));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <h2 className="text-2xl">Admin Dashboard</h2>
        <p className="text-gray-600 mt-1">System-wide analytics and management overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3  gap-6">
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
            <p className="text-xs text-green-600 mt-1">Total submissions</p>
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

      {/* Charts Section - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Activity Summary - Bar Chart */}
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

        {/* User Distribution by Role - Pie Chart */}
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
      </div>

      {/* Active Forms List */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle className="text-lg">Active Forms</CardTitle>
        </CardHeader>
        <CardContent>
          {activeForms.length > 0 ? (
            <div className="space-y-3">
              {activeForms.map((form, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{form.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Target: {form.target} • Period: {form.period}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">{form.responses}</div>
                    <div className="text-xs text-gray-600">responses</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No active forms available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}