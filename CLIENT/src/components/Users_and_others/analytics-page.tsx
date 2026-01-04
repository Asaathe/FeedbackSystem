import { Card, CardContent, CardHeader, CardTitle } from "../Reusable_components/card";
import { Badge } from "../Reusable_components/badge";
import { TrendingUp, Users, FileText, MessageSquare } from "lucide-react";

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <h2 className="text-2xl">Analytics Dashboard</h2>
        <p className="text-gray-600 mt-1">Comprehensive feedback analytics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Total Responses</CardTitle>
            <MessageSquare className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">1,256</div>
            <p className="text-xs text-green-600 mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Active Forms</CardTitle>
            <FileText className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">8</div>
            <p className="text-xs text-gray-600 mt-1">Currently deployed</p>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Completion Rate</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">87%</div>
            <Progress value={87} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-600">Avg. Rating</CardTitle>
            <Users className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl">4.3/5</div>
            <p className="text-xs text-gray-600 mt-1">Across all forms</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-green-100">
        <CardHeader>
          <CardTitle>Analytics Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Advanced analytics features including response trends, detailed breakdowns,
            and performance insights will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}