import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ArrowLeft, Award, TrendingUp, TrendingDown, Users } from "lucide-react";
import { Progress } from "../ui/progress";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ratingTrend = [
  { month: 'Jan', rating: 4.2 },
  { month: 'Feb', rating: 4.3 },
  { month: 'Mar', rating: 4.5 },
  { month: 'Apr', rating: 4.6 },
  { month: 'May', rating: 4.8 },
  { month: 'Jun', rating: 4.9 },
];

const subjectRatings = [
  { subject: 'CS101', rating: 4.9, responses: 52 },
  { subject: 'CS301', rating: 4.8, responses: 48 },
  { subject: 'CS401', rating: 5.0, responses: 56 },
];

const feedbackCategories = [
  { category: 'Teaching Quality', score: 4.9 },
  { category: 'Communication', score: 4.8 },
  { category: 'Course Materials', score: 4.9 },
  { category: 'Responsiveness', score: 5.0 },
  { category: 'Accessibility', score: 4.7 },
];

const recentFeedback = [
  { date: 'Oct 1, 2025', subject: 'CS101', rating: 5, comment: 'Excellent teaching methods and very engaging lectures.' },
  { date: 'Sep 28, 2025', subject: 'CS301', rating: 5, comment: 'Clear explanations of complex concepts. Very helpful.' },
  { date: 'Sep 25, 2025', subject: 'CS401', rating: 4, comment: 'Great course content. Would appreciate more practice problems.' },
];

interface EmployeePerformanceProps {
  onBack: () => void;
}

export function EmployeePerformance({ onBack }: EmployeePerformanceProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack} className="border-green-200 hover:bg-green-50">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl">Dr. Sarah Johnson - Performance Analytics</h2>
          <p className="text-gray-600">Computer Science Department • Professor</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Overall Rating</CardTitle>
            <Award className="w-5 h-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">4.9/5</div>
            <p className="text-xs text-green-600 mt-1">Top performer</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Subjects Taught</CardTitle>
            <Users className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">3</div>
            <p className="text-xs text-gray-600 mt-1">Fall 2025</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Total Feedback</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">156</div>
            <p className="text-xs text-green-600 mt-1">+23% from last term</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Rating Trend</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">+0.7</div>
            <Progress value={100} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-green-100">
          <CardHeader>
            <CardTitle>Rating Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={ratingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis domain={[0, 5]} stroke="#6b7280" />
                <Tooltip />
                <Line type="monotone" dataKey="rating" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader>
            <CardTitle>Performance by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={subjectRatings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="subject" stroke="#6b7280" />
                <YAxis domain={[0, 5]} stroke="#6b7280" />
                <Tooltip />
                <Bar dataKey="rating" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subject Details */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>Subject Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjectRatings.map((subject, index) => (
              <div key={index} className="p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h4>{subject.subject}</h4>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      ⭐ {subject.rating}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-600">{subject.responses} responses</span>
                </div>
                <Progress value={subject.rating * 20} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Categories */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>Performance by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feedbackCategories.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{category.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{category.score}/5</span>
                    {category.score >= 4.8 && <TrendingUp className="w-4 h-4 text-green-500" />}
                  </div>
                </div>
                <Progress value={category.score * 20} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Feedback Comments */}
      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>Recent Feedback Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentFeedback.map((feedback, index) => (
              <div key={index} className="p-4 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{feedback.subject}</Badge>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{feedback.date}</span>
                </div>
                <p className="text-sm text-gray-700">{feedback.comment}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-green-100 bg-gradient-to-r from-green-50 to-lime-50">
        <CardHeader>
          <CardTitle>Performance Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4>Exceptional Performance</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Consistently high ratings (4.9/5) across all subjects. Recommend for Teaching Excellence Award and consideration for promotion.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4>Positive Trend</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Rating improved from 4.2 to 4.9 over 6 months. Consider sharing teaching methods with department as best practices.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <h4>Mentorship Opportunity</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    High performance makes this employee an ideal mentor for junior faculty members.
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