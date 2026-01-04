import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../Reusable_components/card";
import { Button } from "../Reusable_components/button";
import { Badge } from "../Reusable_components/badge";
import { GraduationCap, Briefcase, Users, MessageSquare, TrendingUp } from "lucide-react";
import { Progress } from "../Reusable_components/progress";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getFormsForUserRole, getFormStatsForUser, PublishedForm } from "../../services/publishedFormsService";

const skillsRelevanceData = [
  { skill: 'Programming', yourRating: 4.5, avgAlumni: 4.2 },
  { skill: 'Problem Solving', yourRating: 4.8, avgAlumni: 4.4 },
  { skill: 'Teamwork', yourRating: 4.0, avgAlumni: 4.3 },
  { skill: 'Communication', yourRating: 3.8, avgAlumni: 4.0 },
  { skill: 'Industry Tools', yourRating: 4.2, avgAlumni: 3.9 },
];

const engagementTimelineData = [
  { month: 'Jan', feedback: 1, events: 2 },
  { month: 'Mar', feedback: 0, events: 1 },
  { month: 'May', feedback: 1, events: 3 },
  { month: 'Jul', feedback: 0, events: 0 },
  { month: 'Sep', feedback: 1, events: 2 },
  { month: 'Oct', feedback: 0, events: 1 },
];

const alumniStats = {
  graduationYear: '2023',
  program: 'BS in Computer Science',
  currentEmployment: 'Software Developer',
  feedbackSubmitted: 3,
};

// Type for pending forms
type PendingForm = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: string;
};

const recentActivity = [
  { action: 'Submitted Program Quality Feedback', date: 'Sep 28, 2025', type: 'feedback' },
  { action: 'Updated Employment Information', date: 'Sep 25, 2025', type: 'profile' },
  { action: 'Completed Faculty Evaluation', date: 'Sep 20, 2025', type: 'feedback' },
];

const careerImpact = [
  { skill: 'Technical Skills Relevance', rating: 4.5, impact: 'high' },
  { skill: 'Soft Skills Development', rating: 4.0, impact: 'medium' },
  { skill: 'Industry Preparedness', rating: 3.8, impact: 'medium' },
  { skill: 'Career Network Building', rating: 3.5, impact: 'low' },
];

interface AlumniDashboardProps {
  onNavigate?: (page: string) => void;
}

export function AlumniDashboard({ onNavigate }: AlumniDashboardProps = {}) {
  const [alumniPendingForms, setAlumniPendingForms] = useState<PendingForm[]>([]);
  const [formStats, setFormStats] = useState({ pending: 0, completed: 0, total: 0, completionRate: 0 });

  useEffect(() => {
    const loadData = async () => {
      const publishedForms = await getFormsForUserRole('alumni');
      const pendingForms = publishedForms.map(form => ({
        id: form.id,
        title: form.title,
        description: form.description,
        dueDate: form.dueDate || 'No due date',
        priority: form.category === 'Alumni' ? 'high' : 'medium',
      }));
      setAlumniPendingForms(pendingForms);
      const stats = await getFormStatsForUser('alumni');
      setFormStats(stats);
    };
    loadData();
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl">Welcome back, Alumnus!</h2>
            <p className="text-gray-600 mt-1">{alumniStats.program} • Class of {alumniStats.graduationYear}</p>
            <div className="flex items-center gap-2 mt-2">
              <Briefcase className="w-4 h-4 text-gray-600" />
              <p className="text-sm text-gray-600">{alumniStats.currentEmployment}</p>
            </div>
          </div>
          <Badge className="bg-purple-500">Alumni</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Feedback Submitted</CardTitle>
            <MessageSquare className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{alumniStats.feedbackSubmitted}</div>
            <p className="text-xs text-gray-600 mt-1">Post-graduation</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Pending Forms</CardTitle>
            <GraduationCap className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{alumniPendingForms.length}</div>
            <p className="text-xs text-orange-600 mt-1">Awaiting response</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Alumni Network</CardTitle>
            <Users className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">234</div>
            <p className="text-xs text-gray-600 mt-1">Connections</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Relevance Comparison */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle>Skills Relevance to Career</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={skillsRelevanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 5]} stroke="#6b7280" />
                <YAxis type="category" dataKey="skill" stroke="#6b7280" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="yourRating" fill="#22c55e" name="Your Rating" radius={[0, 8, 8, 0]} />
                <Bar dataKey="avgAlumni" fill="#84cc16" name="Avg Alumni" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Timeline */}
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle>Your Engagement Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={engagementTimelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="feedback" stroke="#22c55e" strokeWidth={2} name="Feedback Submitted" />
                <Line type="monotone" dataKey="events" stroke="#a855f7" strokeWidth={2} name="Events Attended" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Career Impact Assessment */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>How Your Education Impacts Your Career</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {careerImpact.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{item.skill}</span>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary"
                      className={
                        item.impact === 'high' 
                          ? 'bg-green-100 text-green-700' 
                          : item.impact === 'medium'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }
                    >
                      {item.impact} impact
                    </Badge>
                    <span className="text-sm">{item.rating}/5</span>
                  </div>
                </div>
                <Progress value={item.rating * 20} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Alumni Feedback */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>Pending Alumni Feedback Forms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alumniPendingForms.map((form) => (
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
                            : 'bg-orange-100 text-orange-700'
                        }
                      >
                        {form.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{form.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Due: {form.dueDate}</p>
                  </div>
                </div>
                <Button 
                  className="bg-green-500 hover:bg-green-600 mt-3"
                  onClick={() => onNavigate?.('submit-feedback')}
                >
                  Complete Feedback
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div 
                key={index}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  {activity.type === 'feedback' ? (
                    <MessageSquare className="w-5 h-5 text-green-500" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  )}
                  <div>
                    <p>{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3>Share Your Experience</h3>
              <p className="text-sm text-gray-600 mt-1">
                Help improve the program by sharing how your education prepared you for your career.
              </p>
              <Button 
                className="mt-3 bg-purple-500 hover:bg-purple-600"
                onClick={() => onNavigate?.('submit-feedback')}
              >
                Submit Feedback
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}