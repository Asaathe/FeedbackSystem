import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { GraduationCap, Briefcase, MessageSquare } from "lucide-react";
import { Progress } from "../ui/progress";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getFormsForUserRole, getFormStatsForUser } from "../../services/publishedFormsService";

// Type for pending forms
type PendingForm = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: string;
};

// Types for alumni data from API
type AlumniStats = {
  graduationYear: string;
  program: string;
  currentEmployment: string;
  feedbackSubmitted: number;
};

type CareerImpactItem = {
  skill: string;
  rating: number;
  impact: 'high' | 'medium' | 'low';
};

type RecentActivityItem = {
  action: string;
  date: string;
  type: 'feedback' | 'profile';
};

type SkillsData = {
  skill: string;
  yourRating: number;
  avgAlumni: number;
};

type EngagementData = {
  month: string;
  feedback: number;
  events: number;
};

interface AlumniDashboardProps {
  onNavigate?: (page: string) => void;
}

export function AlumniDashboard({ onNavigate }: AlumniDashboardProps = {}) {
  const [alumniPendingForms, setAlumniPendingForms] = useState<PendingForm[]>([]);
  const [submittedFormIds, setSubmittedFormIds] = useState<Set<string>>(new Set());
  const [formStats, setFormStats] = useState({ pending: 0, completed: 0, total: 0, completionRate: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // State for dynamic data (replacing mock data)
  const [alumniStats, setAlumniStats] = useState<AlumniStats>({
    graduationYear: '',
    program: '',
    currentEmployment: '',
    feedbackSubmitted: 0,
  });
  const [careerImpact, setCareerImpact] = useState<CareerImpactItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [skillsData, setSkillsData] = useState<SkillsData[]>([]);
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);

  const loadAlumniData = async () => {
    const token = sessionStorage.getItem('authToken');
    try {
      const response = await fetch('/api/users/alumni-data', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (data.success && data.data) {
        if (data.data.stats) setAlumniStats(data.data.stats);
        if (data.data.careerImpact) setCareerImpact(data.data.careerImpact);
        if (data.data.recentActivity) setRecentActivity(data.data.recentActivity);
        if (data.data.skills) setSkillsData(data.data.skills);
        if (data.data.engagement) setEngagementData(data.data.engagement);
        if (data.data.employment) {
          setAlumniStats(prev => ({
            ...prev,
            currentEmployment: data.data.employment.jobTitle 
              ? `${data.data.employment.jobTitle} at ${data.data.employment.companyName}`
              : prev.currentEmployment
          }));
        }
      }
    } catch (error) {
      console.error('Error loading alumni data:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const publishedForms = await getFormsForUserRole('alumni');
      
      // Fetch submitted form IDs from API
      let submittedIds = new Set<string>();
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('authToken');
        if (token) {
          const response = await fetch('/api/forms/my-responses', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const result = await response.json();
            submittedIds = new Set<string>(result.responses?.map((r: any) => String(r.form_id)) || []);
            setSubmittedFormIds(submittedIds);
          }
        }
      } catch (error) {
        console.error('Error fetching submitted forms:', error);
      }

      // Filter out already submitted forms
      const pendingForms = publishedForms
        .filter(form => !submittedIds.has(form.id))
        .map(form => ({
          id: form.id,
          title: form.title,
          description: form.description,
          dueDate: form.dueDate || 'No due date',
          priority: form.category === 'Alumni' ? 'high' : 'medium',
        }));
      setAlumniPendingForms(pendingForms);
      const stats = await getFormStatsForUser('alumni');
      setFormStats(stats);
      
      // Load alumni-specific data from API
      await loadAlumniData();
      setIsLoading(false);
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Welcome Section Skeleton */}
        <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-48"></div>
              <div className="h-4 bg-gray-100 rounded animate-pulse w-64"></div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-48"></div>
              </div>
            </div>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-16 self-start"></div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-green-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-1 w-12"></div>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Analytics Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Skills Chart Skeleton */}
          <Card className="border-green-100">
            <CardHeader>
              <div className="h-5 bg-gray-200 rounded animate-pulse w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>

          {/* Engagement Chart Skeleton */}
          <Card className="border-green-100">
            <CardHeader>
              <div className="h-5 bg-gray-200 rounded animate-pulse w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64 bg-gray-100 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>

        {/* Career Impact Assessment Skeleton */}
        <Card className="border-green-100">
          <CardHeader>
            <div className="h-5 bg-gray-200 rounded animate-pulse w-64"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 bg-gray-200 rounded animate-pulse w-16"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded animate-pulse w-full"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Alumni Feedback Skeleton */}
        <Card className="border-green-100">
          <CardHeader>
            <div className="h-5 bg-gray-200 rounded animate-pulse w-48"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-3 sm:p-4 rounded-lg border border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-48"></div>
                      <div className="h-3 bg-gray-100 rounded animate-pulse mt-1 w-24"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse mt-3 w-32"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Skeleton */}
        <Card className="border-green-100">
          <CardHeader>
            <div className="h-5 bg-gray-200 rounded animate-pulse w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-1 w-40"></div>
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-20"></div>
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

  return (
    <div className="space-y-4">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl">Welcome back, Alumnus!</h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {alumniStats.program
                ? `${alumniStats.program} • Class of ${alumniStats.graduationYear}`
                : 'Alumni User'}
            </p>
            {alumniStats.currentEmployment && (
              <div className="flex items-center gap-2 mt-2">
                <Briefcase className="w-4 h-4 text-gray-600" />
                <p className="text-xs sm:text-sm text-gray-600">{alumniStats.currentEmployment}</p>
              </div>
            )}
          </div>
          <Badge className="bg-purple-500 self-start">Alumni</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Feedback Submitted</CardTitle>
            <MessageSquare className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl">{alumniStats.feedbackSubmitted || formStats.completed}</div>
            <p className="text-xs text-gray-600 mt-1">Post-graduation</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Pending Forms</CardTitle>
            <GraduationCap className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl">{alumniPendingForms.length || formStats.pending}</div>
            <p className="text-xs text-orange-600 mt-1">Awaiting response</p>
          </CardContent>
        </Card>

        {/* Placeholder for third stat if needed */}
        <div className="hidden lg:block"></div>
      </div>

      {/* Analytics Row */}
      {skillsData.length > 0 && engagementData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Skills Relevance Comparison */}
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle>Skills Relevance to Career</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={skillsData} layout="vertical">
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
                <LineChart data={engagementData}>
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
      )}

      {/* Career Impact Assessment */}
      {careerImpact.length > 0 && (
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
      )}

      {/* Pending Alumni Feedback */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>Pending Alumni Feedback Forms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alumniPendingForms.length > 0 ? (
              alumniPendingForms.map((form) => (
                <div
                  key={form.id}
                  className="p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-green-200 hover:bg-green-50/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                        <h3 className="text-sm sm:text-base font-medium">{form.title}</h3>
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
                      <p className="text-xs sm:text-sm text-gray-600">{form.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Due: {form.dueDate}</p>
                    </div>
                  </div>
                  <Button
                    className="bg-green-500 hover:bg-green-600 mt-3 w-full sm:w-auto"
                    onClick={() => onNavigate?.('submit-feedback')}
                  >
                    Complete Feedback
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No pending feedback forms at this time.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
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
                      <Briefcase className="w-5 h-5 text-blue-500" />
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
      )}
    </div>
  );
}

