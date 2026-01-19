import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Users, FileText, Clock, CheckCircle, Building2, ArrowRight } from "lucide-react";
import { getFormsForUserRole, PublishedForm } from "../../services/publishedFormsService";

// Sample data for alumni employees at this company
const alumniEmployees = [
  { id: 1, name: 'John Smith', graduationYear: '2022', department: 'Computer Science', position: 'Software Engineer' },
  { id: 2, name: 'Maria Garcia', graduationYear: '2021', department: 'Business Admin', position: 'Marketing Manager' },
  { id: 3, name: 'James Wilson', graduationYear: '2023', department: 'Engineering', position: 'Junior Engineer' },
  { id: 4, name: 'Sarah Chen', graduationYear: '2020', department: 'Computer Science', position: 'Senior Developer' },
  { id: 5, name: 'Emily Davis', graduationYear: '2021', department: 'Education', position: 'Training Coordinator' },
];

// Type for pending forms
type EmployerPendingForm = {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  description: string;
};

const completedForms = 8;

interface EmployerDashboardProps {
  onNavigate?: (page: string) => void;
}

export function EmployerDashboard({ onNavigate }: EmployerDashboardProps = {}) {
  const [employerPendingForms, setEmployerPendingForms] = useState<EmployerPendingForm[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const publishedForms = await getFormsForUserRole('employer');
      const pendingForms = publishedForms.map(form => ({
        id: form.id,
        title: form.title,
        dueDate: form.dueDate || 'No due date',
        status: 'pending', // Default status for new forms
        description: form.description
      }));
      setEmployerPendingForms(pendingForms);
    };
    loadData();
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-lime-500 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl">Welcome, Employer</h2>
            <p className="text-gray-600 mt-1">Provide valuable feedback to help the university improve</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-orange-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Pending Forms</CardTitle>
            <Clock className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{employerPendingForms.filter(f => f.status === 'pending').length}</div>
            <p className="text-xs text-orange-600 mt-1">Awaiting your response</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Completed</CardTitle>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{completedForms}</div>
            <p className="text-xs text-green-600 mt-1">Forms submitted</p>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Our Alumni</CardTitle>
            <Users className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{alumniEmployees.length}</div>
            <p className="text-xs text-blue-600 mt-1">University graduates</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Feedback Forms */}
      <Card className="border-green-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feedback Forms from Admin</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Complete these forms to provide feedback about our alumni
              </p>
            </div>
            <Badge variant="outline" className="border-orange-200 text-orange-700">
              {employerPendingForms.length} Forms
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employerPendingForms.map((form) => (
              <div 
                key={form.id}
                className={`p-4 rounded-lg border transition-colors ${
                  form.status === 'pending' 
                    ? 'border-orange-200 bg-orange-50/50 hover:border-orange-300' 
                    : 'border-blue-200 bg-blue-50/50 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-base">{form.title}</h3>
                      <Badge 
                        variant="secondary"
                        className={
                          form.status === 'pending' 
                            ? 'bg-orange-100 text-orange-700' 
                            : 'bg-blue-100 text-blue-700'
                        }
                      >
                        {form.status === 'in-progress' ? 'In Progress' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{form.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Due: {form.dueDate}</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-green-500 hover:bg-green-600 flex-shrink-0"
                    onClick={() => onNavigate?.('submit-feedback')}
                  >
                    {form.status === 'pending' ? 'Start' : 'Continue'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {employerPendingForms.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p>No pending forms at the moment</p>
              <p className="text-sm mt-1">You're all caught up!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Our Alumni Employees */}
      <Card className="border-green-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Our Alumni Employees</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                University graduates working at your company
              </p>
            </div>
            <Button 
              variant="outline"
              size="sm"
              className="border-green-200 hover:bg-green-50"
              onClick={() => onNavigate?.('employee-directory')}
            >
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alumniEmployees.slice(0, 5).map((employee) => (
              <div 
                key={employee.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-green-200 hover:bg-green-50/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-lime-500 flex items-center justify-center text-white flex-shrink-0">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-sm">{employee.name}</h3>
                      <p className="text-xs text-gray-600">{employee.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-gray-300">
                      {employee.department}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-gray-300">
                      '{employee.graduationYear.slice(-2)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-blue-900">About Feedback Forms</h4>
              <p className="text-sm text-blue-700 mt-1">
                The university administration sends you feedback forms to evaluate our alumni's performance 
                in your organization. Your honest feedback helps us improve our curriculum and better prepare 
                future students for the workforce. Thank you for your partnership!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}