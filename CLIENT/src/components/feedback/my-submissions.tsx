import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { ClipboardList, Check, Eye, Calendar, X, AlertCircle, Clock, FileText } from "lucide-react";
import { getAuthToken } from "../../utils/auth";
import { getFormsForUserRole, PublishedForm } from "../../services/publishedFormsService";

interface Question {
  id: number;
  form_id: number;
  question_text: string;
  order_index: number;
}

interface FormResponse {
  id: number;
  form_id: number;
  form_title: string;
  category: string;
  answers: Record<string, any>;
  submitted_at: string;
  questions: Question[];
}

interface AssignedForm {
  id: string;
  title: string;
  category: string;
  dueDate: string;
  status: 'submitted' | 'pending' | 'overdue';
  submittedAt?: string;
  responseId?: number;
}

interface MySubmissionsProps {
  userRole?: string;
}

export function MySubmissions({ userRole = 'student' }: MySubmissionsProps) {
  const [assignedForms, setAssignedForms] = useState<AssignedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<FormResponse | null>(null);

  useEffect(() => {
    loadAllForms();
  }, []);

  const loadAllForms = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch submitted forms
      const submittedResponse = await fetch("http://localhost:5000/api/forms/my-responses", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let submittedForms: FormResponse[] = [];
      if (submittedResponse.ok) {
        const result = await submittedResponse.json();
        submittedForms = result.responses || [];
      }

      // Fetch all assigned forms based on user role
      const forms = await getFormsForUserRole(userRole);
      
      // Combine and determine status
      const submittedIds = new Set(submittedForms.map(s => String(s.form_id)));
      const now = new Date();

      const allForms: AssignedForm[] = forms.map((form: PublishedForm) => {
        const dueDate = new Date(form.dueDate || '');
        const isSubmitted = submittedIds.has(form.id);
        const isOverdue = dueDate < now;

        return {
          id: form.id,
          title: form.title,
          category: form.category,
          dueDate: form.dueDate || 'No due date',
          status: isSubmitted ? 'submitted' : (isOverdue ? 'overdue' : 'pending'),
          submittedAt: submittedForms.find(s => String(s.form_id) === form.id)?.submitted_at,
          responseId: submittedForms.find(s => String(s.form_id) === form.id)?.id,
        };
      });

      // Filter: Only show submitted and overdue (not pending)
      const filteredForms = allForms.filter(f => f.status === 'submitted' || f.status === 'overdue');

      // Sort: submitted first, then overdue
      filteredForms.sort((a, b) => {
        const statusOrder: Record<string, number> = { submitted: 0, overdue: 1 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      setAssignedForms(filteredForms);
    } catch (error) {
      console.error("Error loading forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFormResponse = async (formId: string, responseId: number) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/forms/my-responses", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        const formResponse = result.responses?.find((r: FormResponse) => r.id === responseId);
        if (formResponse) {
          setSelectedForm(formResponse);
        }
      }
    } catch (error) {
      console.error("Error loading form response:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAnswerDisplay = (answer: any) => {
    if (Array.isArray(answer)) {
      return answer.join(", ");
    }
    if (typeof answer === "object" && answer !== null) {
      return JSON.stringify(answer);
    }
    return String(answer);
  };

  const getQuestionText = (questionId: string, questions: Question[]) => {
    // If no questions provided, return the key as-is
    if (!questions || questions.length === 0) {
      return `Question ${questionId.replace(/\D/g, '') || 'Unknown'}`;
    }
    
    // Try to match q1, q2 format (array index)
    const match = questionId.match(/q(\d+)/i);
    if (match) {
      const index = parseInt(match[1]) - 1;
      if (questions && questions[index]) {
        return questions[index].question_text;
      }
    }
    
    // Try to find by exact ID match (both as number and string)
    const qidNum = parseInt(questionId.replace(/\D/g, ""));
    if (!isNaN(qidNum)) {
      // Try finding by id
      const foundById = questions?.find(q => q.id === qidNum);
      if (foundById) {
        return foundById.question_text;
      }
      // Try finding by order_index (1-based)
      const foundByOrder = questions?.find(q => q.order_index === qidNum);
      if (foundByOrder) {
        return foundByOrder.question_text;
      }
    }
    
    // If still not found, try partial match on question text
    const cleanKey = questionId.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundByPartial = questions?.find(q => {
      const cleanQ = q.question_text.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanKey.includes(cleanQ) || cleanQ.includes(cleanKey);
    });
    if (foundByPartial) {
      return foundByPartial.question_text;
    }
    
    // Fallback: try to get any question that might match
    if (questions.length > 0) {
      return questions[0].question_text;
    }
    
    return `Question ${questionId.replace(/\D/g, '') || 'Unknown'}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Submitted</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Overdue</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Pending</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
          <h2 className="text-2xl">My Submissions</h2>
          <p className="text-gray-600 mt-1">View all your assigned feedback forms</p>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <p className="mt-2 text-gray-600">Loading your forms...</p>
        </div>
      </div>
    );
  }

  const submittedCount = assignedForms.filter(f => f.status === 'submitted').length;
  const overdueCount = assignedForms.filter(f => f.status === 'overdue').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
        <h2 className="text-2xl">My Submissions</h2>
        <p className="text-gray-600 mt-1">View all your assigned feedback forms</p>
        
        {/* Status Summary */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">{submittedCount} Submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-600">{overdueCount} Overdue</span>
          </div>
        </div>
      </div>

      {/* Forms List */}
      {assignedForms.length === 0 ? (
        <Card className="border-green-100">
          <CardContent className="py-12">
            <div className="text-center">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Forms Assigned</h3>
              <p className="text-gray-600">
                You don't have any feedback forms assigned at this time.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignedForms.map((form) => (
            <Card key={form.id} className={`border-green-100 overflow-hidden ${form.status === 'overdue' ? 'border-l-4 border-l-red-500' : ''}`}>
              <div className="p-4 bg-gradient-to-r from-green-50 to-lime-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      form.status === 'submitted' ? 'bg-green-100' : 
                      form.status === 'overdue' ? 'bg-red-100' : 'bg-orange-100'
                    }`}>
                      {form.status === 'submitted' ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : form.status === 'overdue' ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{form.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {form.category}
                        </Badge>
                        {getStatusBadge(form.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {form.status === 'overdue' && (
                        <>
                          <p className="text-xs text-gray-500">Due Date</p>
                          <p className="text-sm text-gray-600">{form.dueDate}</p>
                        </>
                      )}
                    </div>
                    {form.status === 'submitted' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => loadFormResponse(form.id, form.responseId!)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View Response Modal */}
      <Dialog open={!!selectedForm} onOpenChange={() => setSelectedForm(null)}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10 flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                {selectedForm?.form_title}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">{selectedForm?.category}</Badge>
                <span>•</span>
                <span>{selectedForm && formatDate(selectedForm.submitted_at)}</span>
              </DialogDescription>
            </div>
            <button
              onClick={() => setSelectedForm(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(80vh - 80px)' }}>
            <div className="space-y-3">
              {selectedForm && Object.entries(selectedForm.answers || {}).length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No response data available</p>
              ) : selectedForm ? (
                Object.entries(selectedForm.answers || {}).map(([questionId, answer], index) => (
                  <div key={questionId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">
                        {getQuestionText(questionId, selectedForm.questions || [])}
                      </p>
                    </div>
                    <div className="px-4 py-3 bg-white">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {getAnswerDisplay(answer)}
                      </p>
                    </div>
                  </div>
                ))
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
