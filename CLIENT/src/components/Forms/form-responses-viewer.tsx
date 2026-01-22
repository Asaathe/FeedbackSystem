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
  Mail,
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
    console.log('=== getQuestionAnalytics ===');
    console.log('Question:', question);
    console.log('Responses:', responses);
    
    if (!responses.length) {
      console.log('No responses');
      return null;
    }

    const questionId = question.id;
    const questionIdStr = String(question.id);
    console.log('Question ID:', questionId, 'String:', questionIdStr);

    const questionType = question.question_type || question.type;
    console.log('Question Type:', questionType);

    if (questionType === 'rating' || questionType === 'linear-scale' || questionType === 'linear_scale') {
      // Calculate average for rating/linear scale questions
      let sum = 0;
      let count = 0;

      responses.forEach(response => {
        const answer = response.response_data[questionId] || response.response_data[questionIdStr];
        console.log('Response:', response.id, 'Answer:', answer);
        if (answer !== undefined && answer !== null && answer !== '') {
          const numAnswer = parseFloat(answer);
          if (!isNaN(numAnswer)) {
            sum += numAnswer;
            count++;
          }
        }
      });

      const average = count > 0 ? (sum / count).toFixed(2) : '0.00';
      const maxRating = questionType === 'rating' ? 5 : (question.max || 10);

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
        const answer = response.response_data[questionId] || response.response_data[questionIdStr];
        console.log('Response:', response.id, 'Question ID:', questionId, 'Answer:', JSON.stringify(answer));
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

      console.log('Answer Counts:', answerCounts);
      
      const totalAnswers = responses.length;
      const chartData = Object.entries(answerCounts).map(([answer, count]) => ({
        answer,
        count,
        percentage: Math.round((count / totalAnswers) * 100)
      }));

      console.log('Chart Data:', chartData);

      return {
        question,
        type: 'distribution',
        chartData: chartData.sort((a, b) => b.count - a.count),
        totalAnswers
      };
    }
  };

  const applicableQuestions = form?.questions?.filter(q => {
    const qType = q.question_type || q.type;
    return ['multiple-choice', 'multiple_choice', 'rating', 'linear-scale', 'linear_scale', 'dropdown', 'checkbox'].includes(qType);
  }) || [];

  console.log('Form loaded:', !!form);
  console.log('Form questions:', form?.questions?.length);
  console.log('Applicable questions:', applicableQuestions.length);
  console.log('Applicable questions details:', applicableQuestions.map(q => ({id: q.id, type: q.question_type || q.type, question: q.question})));
  console.log('Responses loaded:', responses.length);

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
            const answer = response.response_data[String(q.id)];
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
      return <span className="text-gray-400 italic">No answer</span>;
    }

    const qType = question.question_type || question.type;
    switch (qType) {
      case "multiple-choice":
      case "dropdown":
        return <span className="font-medium">{String(value)}</span>;
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
        return <span className="font-medium">{String(value)}</span>;
      case "rating":
      case "linear-scale":
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{value}</span>
            <span className="text-gray-500">/</span>
            <span className="text-gray-600">{qType === 'rating' ? 5 : (question.max || 10)}</span>
            {qType === 'rating' && renderStars(parseFloat(value), 5)}
          </div>
        );
      case "text":
      case "textarea":
        return <div className="whitespace-pre-wrap break-words">{String(value)}</div>;
      default:
        return <span className="font-medium">{String(value)}</span>;
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onBack && (
              <Button variant="outline" onClick={onBack} className="shrink-0">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex-1 text-center min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold truncate">Form Responses</h2>
            <p className="text-gray-600 truncate">
              {form?.title} - {responses.length} responses
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={responses.length === 0}
              className="flex-1 sm:flex-none"
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
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-600 truncate">Total Responses</p>
                <p className="text-2xl font-bold">{responses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-600 truncate">Unique Respondents</p>
                <p className="text-2xl font-bold">
                  {new Set(responses.map(r => r.user_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-600 truncate">Latest Response</p>
                <p className="text-sm font-bold truncate">
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
              console.log('Analytics for question', question.id, ':', analytics);
              if (!analytics) return null;

              if (analytics.type === 'average' && typeof analytics.average === 'number') {
                return (
                  <Card key={question.id} className="overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-lg truncate" title={question.question}>
                        Q{index + 1}: {question.question}
                      </CardTitle>
                      <p className="text-sm text-gray-600 truncate">
                        {(question.question_type || question.type).replace('-', ' ').toUpperCase()} • {analytics.count} responses
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-6">
                        <div className="flex items-center justify-center gap-4 mb-4">
                          <div className="text-4xl font-bold text-blue-600">
                            {analytics.average.toFixed(1)}
                          </div>
                          {question.type === 'rating' && renderStars(analytics.average, analytics.maxRating)}
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          out of {analytics.maxRating}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
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
                return (
                  <Card key={question.id} className="overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-lg truncate" title={question.question}>
                        Q{index + 1}: {question.question}
                      </CardTitle>
                      <p className="text-sm text-gray-600 truncate">
                        {(question.question_type || question.type).replace('-', ' ').toUpperCase()} • {analytics.totalAnswers} responses
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center">
                        <PieChart width={400} height={256}>
                          <Pie
                            data={analytics.chartData}
                            dataKey="count"
                            nameKey="answer"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                          >
                            {analytics.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [
                              `${value} responses (${analytics.chartData.find(d => d.answer === name)?.percentage}%)`,
                              'Count'
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </div>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">User</TableHead>
                    <TableHead className="min-w-[120px]">Role</TableHead>
                    <TableHead className="min-w-[150px]">Submitted</TableHead>
                    <TableHead className="min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResponses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{response.respondent_name || "Anonymous"}</p>
                          <p className="text-sm text-gray-500 truncate">{response.respondent_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="truncate max-w-[100px]">
                          {response.respondent_role || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(response.submitted_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewResponse(response)}
                          className="w-full sm:w-auto"
                        >
                          View Response
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Response Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Response Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedResponse && form && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* User Info Card */}
              <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate text-lg">
                      {selectedResponse.respondent_name || "Anonymous"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {selectedResponse.respondent_email && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{selectedResponse.respondent_email}</span>
                        </div>
                      )}
                      {selectedResponse.respondent_role && (
                        <>
                          <span className="text-gray-400 hidden sm:inline">•</span>
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {selectedResponse.respondent_role}
                          </Badge>
                        </>
                      )}
                      <span className="text-gray-400 hidden sm:inline">•</span>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3" />
                        <span className="whitespace-nowrap">
                          {new Date(selectedResponse.submitted_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Responses Area */}
              <div className="flex-1 overflow-hidden px-6 pb-6">
                <h4 className="font-semibold mb-4 text-gray-800 pt-4">Question Responses</h4>
                <div 
                  className="overflow-y-auto pr-1 space-y-4"
                  style={{ 
                    maxHeight: 'calc(70vh - 180px)',
                  }}
                >
                  {form.questions?.map((question, idx) => (
                    <div key={question.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                        <p className="font-medium text-sm leading-relaxed flex-1">
                          <span className="inline-block w-6 text-gray-500 font-bold">{idx + 1}.</span>
                          {question.question}
                        </p>
                        <Badge 
                          variant="secondary" 
                          className="text-xs w-fit sm:w-auto flex-shrink-0 capitalize mt-1 sm:mt-0"
                        >
                          {(question.question_type || question.type).replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="text-gray-800 bg-gray-50 rounded p-3 border border-gray-100">
                        {renderResponseValue(question, selectedResponse.response_data[String(question.id)])}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}