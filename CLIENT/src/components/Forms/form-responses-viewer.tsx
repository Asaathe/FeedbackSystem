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
import jsPDF from 'jspdf';
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
import {
  analyzeFormResponses,
  QuestionAIInsight,
  ResponseAnalysisResponse,
} from "../../services/aiQuestionService";
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // AI Insights state
  const [aiInsights, setAiInsights] = useState<QuestionAIInsight[]>([]);
  const [overallSummary, setOverallSummary] = useState<string>("");
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);

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
        console.log('Response ID:', response.id, 'response_data keys:', Object.keys(response.response_data), 'full:', JSON.stringify(response.response_data));
        const answer = response.response_data[questionId] || response.response_data[questionIdStr];
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
    setCurrentPage(1); // Reset to first page when search changes
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
        console.log("Responses loaded:", responsesResult.responses.length);
        setResponses(responsesResult.responses);
        setFilteredResponses(responsesResult.responses);
      } else {
        console.error("Failed to load responses:", responsesResult.message);
        toast.error(responsesResult.message || "Failed to load responses");
      }
    } catch (error) {
      console.error("Error loading form responses:", error);
      toast.error("Failed to load form responses");
    } finally {
      setLoading(false);
    }
  };

  const analyzeWithAI = async () => {
    if (!form || responses.length === 0) {
      toast.error("No form or responses to analyze");
      return;
    }

    setAnalyzingWithAI(true);
    try {
      const result: ResponseAnalysisResponse = await analyzeFormResponses(
        form.title,
        form.questions || [],
        responses
      );

      if (result.success && result.overallSummary) {
        setAiInsights(result.insights || []);
        setOverallSummary(result.overallSummary || "");
        setShowAIInsights(true);
        toast.success("AI analysis complete!");
      } else {
        toast.error(result.error || "Failed to analyze responses");
      }
    } catch (error) {
      console.error("Error analyzing with AI:", error);
      toast.error("Failed to analyze responses with AI");
    } finally {
      setAnalyzingWithAI(false);
    }
  };

  const handleViewResponse = (response: FormResponse) => {
    setSelectedResponse(response);
    setViewDialogOpen(true);
  };

  const generatePDF = () => {
    if (!form || responses.length === 0) return;

    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(18);
    doc.text(`${form.title} - Analytics Report`, 20, yPosition);
    yPosition += 20;

    doc.setFontSize(12);
    doc.text(`Total Responses: ${responses.length}`, 20, yPosition);
    yPosition += 15;
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 20;

    // Analytics for each applicable question
    applicableQuestions.forEach((question, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      const analytics = getQuestionAnalytics(question);
      if (!analytics) return;

      doc.setFontSize(14);
      doc.text(`Q${index + 1}: ${question.question}`, 20, yPosition);
      yPosition += 10;

      if (analytics.type === 'average') {
        doc.setFontSize(12);
        if (analytics.average !== undefined && analytics.maxRating !== undefined) {
          doc.text(`Average Rating: ${analytics.average.toFixed(1)} / ${analytics.maxRating}`, 30, yPosition);
        } else {
          doc.text(`Average Rating: N/A`, 30, yPosition);
        }
        yPosition += 10;
        doc.text(`Based on ${analytics.count} responses`, 30, yPosition);
        yPosition += 15;
      } else if (analytics.type === 'distribution') {
        doc.setFontSize(12);
        if (analytics.chartData) {
          analytics.chartData.forEach((item) => {
            doc.text(`${item.answer}: ${item.count} responses (${item.percentage}%)`, 30, yPosition);
            yPosition += 8;
          });
        }
        yPosition += 10;
      }
    });

    // Text questions answers
    const textQuestions = form.questions?.filter(q =>
      ['text', 'textarea'].includes(q.question_type || q.type)
    ) || [];

    if (textQuestions.length > 0) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.text('Text Question Responses', 20, yPosition);
      yPosition += 15;

      textQuestions.forEach((question, qIndex) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.text(`Q: ${question.question}`, 20, yPosition);
        yPosition += 10;

        responses.forEach((response, rIndex) => {
          const answer = response.response_data[question.id] || response.response_data[String(question.id)];
          if (answer && answer.trim()) {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            doc.setFontSize(10);
            const respondent = response.respondent_name || `Respondent ${rIndex + 1}`;
            doc.text(`${respondent}: ${String(answer)}`, 30, yPosition);
            yPosition += 8;
          }
        });
        yPosition += 10;
      });
    }

    // Download PDF
    doc.save(`${form.title}_analytics_report.pdf`);
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

  // AI Insights rendering functions
  const renderSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Positive
          </Badge>
        );
      case 'negative':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Negative
          </Badge>
        );
      case 'neutral':
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Neutral
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Mixed
          </Badge>
        );
    }
  };

  const renderAIInsightCard = (insight: QuestionAIInsight, index: number) => {
    return (
      <Card key={insight.questionId} className="overflow-hidden border-l-4 border-l-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg leading-relaxed" title={insight.question}>
                <span className="inline-flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600 shrink-0" />
                  Q{index + 1}: {insight.question}
                </span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {insight.type.replace('-', ' ').toUpperCase()} • {insight.totalResponses} responses
              </p>
            </div>
            {insight.sentiment && renderSentimentBadge(insight.sentiment.overall)}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* AI Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-sm text-purple-900">AI Summary</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{insight.summary}</p>
          </div>

          {/* Key Findings */}
          {insight.keyFindings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-sm text-gray-900">Key Findings</span>
              </div>
              <ul className="space-y-1">
                {insight.keyFindings.map((finding, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Themes (for text questions) */}
          {insight.themes && insight.themes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-sm text-gray-900">Main Themes</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {insight.themes.map((theme, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {theme.name} ({theme.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Sentiment Breakdown */}
          {insight.sentiment && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-sm text-gray-900">Sentiment Breakdown</span>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700">Positive: {insight.sentiment.positive}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">Neutral: {insight.sentiment.neutral}</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-gray-700">Negative: {insight.sentiment.negative}</span>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {insight.recommendations.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-sm text-amber-900">Recommendations</span>
              </div>
              <ul className="space-y-1">
                {insight.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-amber-500 mt-1">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 pt-2 border-t">
            {insight.average !== undefined && (
              <div className="text-sm">
                <span className="text-gray-500">Average:</span>{' '}
                <span className="font-semibold text-blue-600">{insight.average.toFixed(1)}</span>
                {insight.maxRating && <span className="text-gray-500">/{insight.maxRating}</span>}
              </div>
            )}
            {insight.trend && (
              <div className="text-sm">
                <span className="text-gray-500">Trend:</span>{' '}
                <span className="font-semibold text-green-600">{insight.trend}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
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
              onClick={analyzeWithAI}
              disabled={responses.length === 0 || analyzingWithAI}
              className="flex-1 sm:flex-none bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 hover:from-purple-600 hover:to-indigo-600"
            >
              {analyzingWithAI ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={generatePDF}
              disabled={responses.length === 0}
              className="flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4 mr-2" />
              Generate PDF
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

      {/* AI Insights Section - Overall Summary Only */}
      {showAIInsights && overallSummary && (
        <div className="space-y-6">
          {/* Overall Summary */}
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-600" />
                <CardTitle className="text-xl">AI-Generated Overall Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{overallSummary}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legacy Question Analytics (shown when AI insights not available) */}
      {!showAIInsights && applicableQuestions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Question Analytics</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeWithAI}
              disabled={analyzingWithAI}
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <Brain className="w-4 h-4 mr-2" />
              Get AI Insights
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {applicableQuestions.map((question, index) => {
              const analytics = getQuestionAnalytics(question);
              console.log('Analytics for question', question.id, ':', analytics);
              if (!analytics) return null;

              if (analytics.type === 'average' && typeof analytics.average === 'number') {
                return (
                  <Card key={question.id} className="overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-lg leading-relaxed" title={question.question}>
                        Q{index + 1}: {question.question}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
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
                      <CardTitle className="text-lg leading-relaxed" title={question.question}>
                        Q{index + 1}: {question.question}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {(question.question_type || question.type).replace('-', ' ').toUpperCase()} • {analytics.totalAnswers} responses
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center">
                        {question.question_type === 'multiple-choice' || question.type === 'multiple-choice' || question.type === 'multiple_choice' ? (
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
                        ) : question.question_type === 'dropdown' || question.type === 'dropdown' ? (
                          <PieChart width={400} height={256}>
                            <Pie
                              data={analytics.chartData}
                              dataKey="count"
                              nameKey="answer"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
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
                        ) : (
                          <BarChart width={400} height={256} data={analytics.chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                              dataKey="answer"
                              tick={{ fontSize: 12 }}
                              axisLine={{ stroke: '#e5e7eb' }}
                              tickLine={{ stroke: '#e5e7eb' }}
                            />
                            <YAxis
                              tick={{ fontSize: 12 }}
                              axisLine={{ stroke: '#e5e7eb' }}
                              tickLine={{ stroke: '#e5e7eb' }}
                            />
                            <Tooltip
                              formatter={(value, name) => [
                                `${value} responses (${analytics.chartData.find(d => d.answer === name)?.percentage}%)`,
                                'Count'
                              ]}
                            />
                            <Bar dataKey="count" fill="#8884d8" />
                          </BarChart>
                        )}
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
                    <TableHead className="min-w-[200px] px-6 py-4 text-center">User</TableHead>
                    <TableHead className="min-w-[120px] px-6 py-4 text-center">Role</TableHead>
                    <TableHead className="min-w-[150px] px-6 py-4 text-center">Submitted</TableHead>
                    <TableHead className="min-w-[100px] px-6 py-4 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResponses
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((response) => (
                      <TableRow key={response.id}>
                        <TableCell className="px-6 py-4 text-center">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{response.respondent_name || "Anonymous"}</p>
                            <p className="text-sm text-gray-500 truncate">{response.respondent_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <Badge variant="outline" className="truncate max-w-[100px]">
                            {response.respondent_role || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center whitespace-nowrap">
                          {new Date(response.submitted_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
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

            {/* Pagination */}
            {filteredResponses.length > itemsPerPage && (
              <div className="flex items-center justify-center gap-4 px-6 py-4 border-t bg-gray-50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {Math.ceil(filteredResponses.length / itemsPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredResponses.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(filteredResponses.length / itemsPerPage)}
                >
                  &gt;
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Response Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Response Details
            </DialogTitle>
          </DialogHeader>

          {selectedResponse && form && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* User Info Card - Fixed/Sticky */}
              <div className="py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b shrink-0">
                <div className="px-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-full flex-shrink-0 shadow-lg">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-start gap-2 mb-3">
                        <h3 className="font-bold text-gray-900 text-xl">
                          {selectedResponse.respondent_name || "Anonymous"}
                        </h3>
                        {selectedResponse.respondent_role && (
                          <Badge variant="secondary" className="text-sm bg-blue-100 text-blue-700 border border-blue-200">
                            {selectedResponse.respondent_role}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center justify-start gap-4">
                        {selectedResponse.respondent_email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 text-blue-500" />
                            <span>{selectedResponse.respondent_email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          <span>{new Date(selectedResponse.submitted_at).toLocaleString()}</span>
                        </div>
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
                    <div key={question.id} className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-colors">
                      <p className="font-medium text-sm leading-relaxed mb-3">
                        <span className="inline-block w-6 text-gray-500 font-bold">{idx + 1}.</span>
                        {question.question}
                      </p>
                      <div className="text-gray-800 bg-gray-50 rounded p-4 border border-gray-100">
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