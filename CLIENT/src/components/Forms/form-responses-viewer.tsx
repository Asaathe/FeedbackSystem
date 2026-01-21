import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Search,
  Download,
  ArrowLeft,
  Calendar,
  User,
  FileText,
  BarChart3,
  Star,
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { toast } from "sonner";
import {
  getFormResponses,
  FormResponse,
  getForm,
  FormData,
} from "../../services/formManagementService";

interface FormResponsesViewerProps {
  formId: string;
  onBack?: () => void;
}

export function FormResponsesViewer({ formId, onBack }: FormResponsesViewerProps) {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<FormResponse[]>([]);
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Question analytics data
  const getQuestionAnalytics = (question: any) => {
    if (!responses.length) return null;

    if (question.type === 'rating' || question.type === 'linear-scale') {
      // Calculate average for rating/linear scale questions
      let sum = 0;
      let count = 0;

      responses.forEach(response => {
        const answer = response.response_data[question.id];
        if (answer !== undefined && answer !== null && answer !== '') {
          const numAnswer = parseFloat(answer);
          if (!isNaN(numAnswer)) {
            sum += numAnswer;
            count++;
          }
        }
      });

      const average = count > 0 ? (sum / count).toFixed(2) : '0.00';
      const maxRating = question.type === 'rating' ? 5 : (question.max || 10);

      return {
        question,
        type: 'average',
        average: parseFloat(average),
        count,
        maxRating,
        totalAnswers: responses.length
      };
    } else {
      // Distribution for multiple choice, dropdown, checkboxes
      const answerCounts: Record<string, number> = {};

      responses.forEach(response => {
        const answer = response.response_data[question.id];
        if (answer !== undefined && answer !== null && answer !== '') {
          if (Array.isArray(answer)) {
            // For checkboxes
            answer.forEach(item => {
              answerCounts[item] = (answerCounts[item] || 0) + 1;
            });
          } else {
            // For single answers
            const key = String(answer);
            answerCounts[key] = (answerCounts[key] || 0) + 1;
          }
        }
      });

      const totalAnswers = responses.length;
      const chartData = Object.entries(answerCounts).map(([answer, count]) => ({
        answer,
        count,
        percentage: Math.round((count / totalAnswers) * 100)
      }));

      return {
        question,
        type: 'distribution',
        chartData: chartData.sort((a, b) => b.count - a.count),
        totalAnswers
      };
    }
  };

  const applicableQuestions = form?.questions?.filter(q =>
    ['multiple-choice', 'rating', 'linear-scale', 'dropdown', 'checkbox'].includes(q.type)
  ) || [];

  // Function to render star rating
  const renderStars = (rating: number, maxRating: number = 5) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: maxRating }, (_, index) => (
          <Star
            key={index}
            className={`w-5 h-5 ${
              index < Math.floor(rating)
                ? 'text-yellow-400 fill-yellow-400'
                : index < rating
                ? 'text-yellow-400 fill-yellow-400/50'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Load form and responses on component mount
  useEffect(() => {
    loadFormAndResponses();
  }, [formId]);

  // Filter responses based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredResponses(responses);
    } else {
      const filtered = responses.filter((response) =>
        response.respondent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        response.respondent_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        response.respondent_role?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredResponses(filtered);
    }
  }, [responses, searchQuery]);

  const loadFormAndResponses = async () => {
    setLoading(true);
    try {
      // Load form details
      const formResult = await getForm(formId);
      if (formResult.success && formResult.form) {
        setForm(formResult.form);
      }

      // Load responses
      const responsesResult = await getFormResponses(formId);
      if (responsesResult.success) {
        setResponses(responsesResult.responses);
        setFilteredResponses(responsesResult.responses);
      } else {
        toast.error(responsesResult.message);
      }
    } catch (error) {
      console.error("Error loading form responses:", error);
      toast.error("Failed to load form responses");
    } finally {
      setLoading(false);
    }
  };

  const handleViewResponse = (response: FormResponse) => {
    setSelectedResponse(response);
    setViewDialogOpen(true);
  };

  const exportToCSV = () => {
    if (!form || responses.length === 0) return;

    // Create CSV content
    const headers = ["User Name", "User Email", "User Role", "Submitted At"];
    if (form.questions) {
      form.questions.forEach((q) => {
        headers.push(q.question);
      });
    }

    const csvContent = [
      headers.join(","),
      ...responses.map((response) => {
        const row = [
          response.respondent_name || "",
          response.respondent_email || "",
          response.respondent_role || "",
          new Date(response.submitted_at).toLocaleString(),
        ];

        if (form.questions) {
          form.questions.forEach((q) => {
            const answer = response.response_data[q.id];
            let displayAnswer = "";
            if (answer !== undefined && answer !== null) {
              if (Array.isArray(answer)) {
                displayAnswer = answer.join("; ");
              } else if (typeof answer === "object") {
                displayAnswer = JSON.stringify(answer);
              } else {
                displayAnswer = String(answer);
              }
            }
            row.push(displayAnswer);
          });
        }

        return row.map(field => `"${field.replace(/"/g, '""')}"`).join(",");
      }),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${form.title}_responses.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderResponseValue = (question: any, value: any) => {
    if (value === undefined || value === null || value === "") {
      return <span className="text-gray-400">No answer</span>;
    }

    switch (question.type) {
      case "multiple-choice":
      case "dropdown":
        return <span>{String(value)}</span>;
      case "checkbox":
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((item, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          );
        }
        return <span>{String(value)}</span>;
      case "rating":
      case "linear-scale":
        return <span className="font-medium">{value}/5</span>;
      case "text":
      case "textarea":
        return <span>{String(value)}</span>;
      default:
        return <span>{String(value)}</span>;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <p className="mt-2 text-gray-600">Loading responses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div className="flex-1 text-center">
            <h2 className="text-2xl">Form Responses</h2>
            <p className="text-gray-600">
              {form?.title} - {responses.length} responses
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={responses.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold">{responses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Unique Respondents</p>
                <p className="text-2xl font-bold">
                  {new Set(responses.map(r => r.user_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Latest Response</p>
                <p className="text-sm font-bold">
                  {responses.length > 0
                    ? new Date(Math.max(...responses.map(r => new Date(r.submitted_at).getTime()))).toLocaleDateString()
                    : "No responses"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Question Analytics */}
      {applicableQuestions.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Question Analytics</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {applicableQuestions.map((question, index) => {
              const analytics = getQuestionAnalytics(question);
              if (!analytics) return null;

              if (analytics.type === 'average' && typeof analytics.average === 'number') {
                // Average display for rating/linear scale
                return (
                  <Card key={question.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Q{index + 1}: {question.question}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {question.type.replace('-', ' ').toUpperCase()} • {analytics.count} responses
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <div className="flex items-center justify-center gap-4 mb-4">
                          <div className="text-4xl font-bold text-blue-600">
                            {analytics.average.toFixed(1)}
                          </div>
                          {question.type === 'rating' && renderStars(analytics.average, analytics.maxRating)}
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          out of {analytics.maxRating}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                          <div
                            className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                            style={{ width: `${(analytics.average / analytics.maxRating) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Average rating from {analytics.count} responses
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              } else if (analytics.type === 'distribution' && analytics.chartData && analytics.chartData.length > 0) {
                // Distribution chart for multiple choice, dropdown, checkboxes
                return (
                  <Card key={question.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Q{index + 1}: {question.question}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {question.type.replace('-', ' ').toUpperCase()} • {analytics.totalAnswers} responses
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={analytics.chartData}
                            layout="horizontal"
                            margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis
                              dataKey="answer"
                              type="category"
                              width={90}
                              tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                              formatter={(value, name) => [
                                `${value} responses (${analytics.chartData.find(d => d.count === value)?.percentage}%)`,
                                'Count'
                              ]}
                            />
                            <Bar dataKey="count" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search by user name, email, or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Responses Table */}
      {filteredResponses.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {responses.length === 0 ? "No responses yet" : "No matching responses"}
          </h3>
          <p className="text-gray-500">
            {responses.length === 0
              ? "This form hasn't received any responses yet."
              : "Try adjusting your search criteria."
            }
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{response.respondent_name || "Anonymous"}</p>
                        <p className="text-sm text-gray-500">{response.respondent_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{response.respondent_role || "Unknown"}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(response.submitted_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewResponse(response)}
                      >
                        View Response
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* View Response Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Response Details
            </DialogTitle>
            <DialogDescription className="space-y-1">
              <div className="font-medium text-gray-900">
                {selectedResponse?.respondent_name || "Anonymous"}
              </div>
              <div className="text-sm text-gray-600">
                {selectedResponse?.respondent_email && `${selectedResponse.respondent_email} • `}
                {selectedResponse?.respondent_role || "Unknown"} •
                Submitted {selectedResponse ? new Date(selectedResponse.submitted_at).toLocaleString() : ""}
              </div>
            </DialogDescription>
          </DialogHeader>

          {selectedResponse && form && (
            <div
              className="max-h-[60vh] overflow-y-auto custom-scrollbar"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#10b981 #f3f4f6'
              }}
            >
              <style dangerouslySetInnerHTML={{
                __html: `
                  .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f3f4f6;
                    border-radius: 4px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #10b981;
                    border-radius: 4px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #059669;
                  }
                `
              }} />
              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-4 text-gray-800">Question Responses</h4>
                  <div className="space-y-3">
                    {form.questions?.map((question, idx) => (
                      <div key={question.id} className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-sm leading-relaxed">
                            {idx + 1}. {question.question}
                          </p>
                          <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                            {question.type.replace('-', ' ')}
                          </Badge>
                        </div>
                        <div className="text-gray-700 font-medium">
                          {renderResponseValue(question, selectedResponse.response_data[question.id])}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}