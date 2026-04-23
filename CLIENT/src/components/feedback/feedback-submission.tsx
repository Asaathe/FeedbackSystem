import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Progress } from "../ui/progress";
import { ArrowLeft, Send, ClipboardList, Clock, Check, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  getFormsForUserRole,
  FormQuestion as ServiceFormQuestion,
  PublishedForm,
  checkFormSubmissionStatus,
} from "../../services/publishedFormsService";
import API_BASE from '../../config/api';
import { getForm } from "../../services/formManagementService";
import { getAuthToken } from "../../utils/auth";
import { submitPublicFeedback, getPublicForm } from "../../services/formManagementService";

type FormQuestion = ServiceFormQuestion;

interface FormSection {
  id: number;
  title: string;
  description?: string;
  order: number;
}

interface ContentRendererProps {
  loading: boolean;
  isExternalMode: boolean;
  selectedForm: FeedbackForm | null;
  availableForms: FeedbackForm[];
  onBackToLogin?: () => void;
  onSelectForm: (form: FeedbackForm) => void;
  isNotStarted: (form: FeedbackForm) => boolean;
  isOverdue: (dueDate: string) => boolean;
  externalFeedbackSubmitted?: boolean;
  selectingFormId?: string | null;
}

function ContentRenderer({
  loading,
  isExternalMode,
  selectedForm,
  availableForms,
  onBackToLogin = () => {},
  onSelectForm,
  isNotStarted,
  isOverdue,
  externalFeedbackSubmitted = false,
  selectingFormId = null
}: ContentRendererProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-green-100 hover:shadow-md transition-shadow overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-1 w-48"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-64"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mt-2 w-16"></div>
                </div>
                <div className="h-16 w-16 bg-gray-200 rounded-lg animate-pulse ml-4 flex-shrink-0"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="h-4 w-4 bg-gray-100 rounded animate-pulse mr-1"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-32"></div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="h-4 w-4 bg-gray-100 rounded animate-pulse mr-1"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-24"></div>
                </div>
                <div className="h-4 bg-orange-100 rounded animate-pulse w-28"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isExternalMode && loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Loading Feedback Form...
        </h3>
        <p className="text-gray-600">
          Please wait while we load your feedback form.
        </p>
      </div>
    );
  }

  if (isExternalMode && externalFeedbackSubmitted && !selectedForm && !loading) {
    return (
      <div className="text-center py-8">
        <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Thank You!
        </h3>
        <p className="text-gray-600">
          Your feedback has been submitted successfully. We appreciate your valuable input.
        </p>
      </div>
    );
  }

  if (isExternalMode && !selectedForm && !loading) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Form Not Available
        </h3>
        <p className="text-gray-600">
          The feedback form you're looking for is not available or has expired.
        </p>
        <Button
          onClick={onBackToLogin}
          className="mt-4"
          variant="outline"
        >
          Go Back
        </Button>
      </div>
    );
  }

  if (!isExternalMode && availableForms.length === 0) {
    return (
      <Card className="border-green-100">
        <CardContent className="py-12">
          <div className="text-center">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Forms Assigned</h3>
            <p className="text-gray-600">
              You don't have any feedback forms assigned at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // This should only be reached for authenticated users with forms
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {availableForms.map((form) => (
        <Card
          key={form.id}
          className={`border-green-100 hover:shadow-md transition-shadow overflow-hidden ${isOverdue(form.dueDate) ? 'border-l-4 border-l-red-500' : ''}`}
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg mb-1">{form.title}</CardTitle>
                <p className="text-sm text-gray-600 mb-2">{form.description}</p>
                <Badge variant="secondary" className="text-xs">
                  {form.category}
                </Badge>
              </div>
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt={form.title}
                  className="w-16 h-16 object-cover rounded-lg ml-4 flex-shrink-0"
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                <span>Due {form.dueDate}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <ClipboardList className="w-4 h-4 mr-1" />
                <span>{form.questionCount} questions</span>
              </div>
              {isNotStarted(form) && (
                <div className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  Not yet available
                </div>
              )}
              {isOverdue(form.dueDate) && (
                <div className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                  Overdue
                </div>
              )}
              <Button
                onClick={() => onSelectForm(form)}
                className="w-full"
                disabled={isNotStarted(form) || selectingFormId === form.id}
              >
                {selectingFormId === form.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opening Form...
                  </>
                ) : (
                  "Start Feedback"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  startDate?: string;
  startDateOnly?: string;
  startTimeOnly?: string;
  endDateOnly?: string;
  endTimeOnly?: string;
  imageUrl?: string;
  questions: FormQuestion[];
  questionCount?: number;
  sections?: FormSection[];
}



interface FeedbackSubmissionProps {
  userRole?: string;
  externalFormId?: string | null;
  externalToken?: string | null;
  onBackToLogin?: () => void;
}

export function FeedbackSubmission({ userRole, externalFormId, externalToken, onBackToLogin }: FeedbackSubmissionProps = {}) {
  const [selectedForm, setSelectedForm] = useState<FeedbackForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [availableForms, setAvailableForms] = useState<FeedbackForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedFormIds, setSubmittedFormIds] = useState<Set<string>>(new Set());
  const [isExternalMode, setIsExternalMode] = useState(!!externalFormId || !!externalToken);
  const [externalFeedbackSubmitted, setExternalFeedbackSubmitted] = useState(false);
  const [selectingFormId, setSelectingFormId] = useState<string | null>(null);
  
  // External supervisor info (for public feedback)
  const [externalSupervisorName, setExternalSupervisorName] = useState("");
  const [externalSupervisorEmail, setExternalSupervisorEmail] = useState("");
  const [externalCompanyName, setExternalCompanyName] = useState("");
  const [externalAlumnusName, setExternalAlumnusName] = useState("");
  const [invitationToken, setInvitationToken] = useState("");
  
  // Track current "page" - either a standalone question or a section with all its questions
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Clear any stale localStorage data from previous sessions
  useEffect(() => {
    localStorage.removeItem('submittedFormIds');
  }, []);

  // Load submitted form IDs from database on mount
  useEffect(() => {
    const loadSubmittedForms = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch('/api/forms/my-responses', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          const submittedIds = new Set<string>(result.responses?.map((r: any) => String(r.form_id)) || []);
          setSubmittedFormIds(submittedIds);
        }
      } catch (error) {
        console.error('Error loading submitted forms:', error);
      }
    };

    loadSubmittedForms();
  }, []);

  // Touch gesture handling removed to prevent accidental navigation

  // Build pages array from questions - each page is either a standalone question or a section with all its questions
  const buildPages = (questions: FormQuestion[], sections: FormSection[]) => {
    const standaloneQuestions = questions.filter(q => !q.sectionId);
    
    // Create items array with order information
    const items: Array<{ type: 'section'; data: FormSection; order: number } | { type: 'question'; data: FormQuestion; order: number }> = [
      ...sections.map(s => ({ 
        type: 'section' as const, 
        data: s, 
        order: s.order ?? 0 
      })),
      ...standaloneQuestions.map((q, idx) => ({ 
        type: 'question' as const, 
        data: q, 
        order: (q as any).order ?? idx
      }))
    ];
    
    // Sort by order
    items.sort((a, b) => a.order - b.order);
    
    // Build pages
    const pages: Array<{ type: 'standalone'; question: FormQuestion } | { type: 'section'; section: FormSection; questions: FormQuestion[] }> = [];
    
    items.forEach(item => {
      if (item.type === 'section') {
        const sectionQuestions = questions.filter(q => q.sectionId === item.data.id);
        pages.push({
          type: 'section',
          section: item.data,
          questions: sectionQuestions
        });
      } else {
        pages.push({
          type: 'standalone',
          question: item.data
        });
      }
    });
    
    return pages;
  };

  // Get current pages
  const currentPages = selectedForm ? buildPages(selectedForm.questions, selectedForm.sections || []) : [];
  const currentPage = currentPages[currentPageIndex];
  const totalPages = currentPages.length;
  console.log("Page calculation:", { selectedForm: !!selectedForm, questionsCount: selectedForm?.questions?.length, currentPagesLength: currentPages.length, totalPages });



  // Load external form when externalFormId or externalToken is provided (for public feedback links)
  // ✅ THIS MUST RUN FIRST BEFORE THE OTHER USEEFFECT!
  useEffect(() => {
    if ((externalFormId || externalToken) && isExternalMode) {
      const loadExternalForm = async () => {
        setLoading(true);
        setSelectedForm(null); // Clear any previous state

        // Check sessionStorage for cached form data to prevent flashes
        const cacheKey = externalToken ? `external_form_token_${externalToken}` : `external_form_${externalFormId}`;
        const cachedFormData = sessionStorage.getItem(cacheKey);
        if (cachedFormData) {
          try {
            const parsed = JSON.parse(cachedFormData);
            setSelectedForm(parsed.formData);
            setAvailableForms([parsed.formData]);
            setExternalSupervisorEmail(parsed.supervisorEmail || '');
            setExternalSupervisorName(parsed.supervisorName || '');
            setExternalCompanyName(parsed.companyName || '');
            setExternalAlumnusName(parsed.alumnusName || '');
            setInvitationToken(parsed.invitationToken || '');
            setLoading(false);
            return; // Use cached data
          } catch (e) {
            // Invalid cache, continue with API call
            sessionStorage.removeItem(cacheKey);
          }
        }

        try {
          let result;
          if (externalToken) {
            // Use new token-based API for secure links
            const apiUrl = `${API_BASE}/api/forms/public/t/${externalToken}`;
            console.log("Making token-based API call to:", apiUrl);

            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            result = await response.json();
            console.log("Token-based API result:", result);

            if (!response.ok) {
              console.error("Token API failed with status:", response.status);
              console.error("Error response:", result);
              throw new Error(result.message || "Failed to load form with token");
            }
          } else if (externalFormId) {
            // Use legacy formId-based API for backward compatibility
            console.log("Making legacy API call to getPublicForm for form ID:", externalFormId);
            result = await getPublicForm(externalFormId);
            console.log("Legacy API result:", result);

            // Parse URL parameters for supervisor info (only for legacy URLs)
            const params = new URLSearchParams(window.location.search);
            const supervisorEmail = params.get('supervisorEmail');
            const supervisorName = params.get('supervisorName');
            const companyName = params.get('companyName');
            const alumnusName = params.get('alumnusName');

            if (supervisorEmail) setExternalSupervisorEmail(supervisorEmail);
            if (supervisorName) setExternalSupervisorName(supervisorName);
            if (companyName) setExternalCompanyName(companyName);
            if (alumnusName) setExternalAlumnusName(alumnusName);
          } else {
            // This shouldn't happen - invalid routing state
            console.error("Invalid external mode state: no token or formId provided");
            throw new Error("Invalid invitation link");
          }

          if (result.success && result.form) {
            console.log("Form data received successfully!");
            console.log("Full result:", result);
            console.log("Form invitation data:", result.form.invitation);
            const form = result.form;

            // Handle invitation data from token-based access
            if (form.invitation) {
              console.log("Invitation data found:", form.invitation);
              setExternalSupervisorEmail(form.invitation.supervisorEmail || '');
              setExternalSupervisorName(form.invitation.supervisorName || '');
              setExternalCompanyName(form.invitation.companyName || '');
              setExternalAlumnusName(form.invitation.alumnusName || '');
              setInvitationToken(form.invitation.token || '');
            }

            // Safe date parsing helper
            const safeDateString = (dateStr: string | null) => {
              if (!dateStr) return "No due date";
              try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return "No due date";
                return date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              } catch {
                return "No due date";
              }
            };

            const formData: FeedbackForm = {
              id: form.id,
              title: form.title,
              description: form.description,
              category: form.category,
              dueDate: safeDateString(form.end_date),
              startDate: form.start_date || null,
              // Map server fields to client field names for status functions
              startDateOnly: form.start_date ? form.start_date.split(' ')[0] : null,
              startTimeOnly: form.start_date ? form.start_date.split(' ')[1] : null,
              endDateOnly: form.end_date ? form.end_date.split(' ')[0] : null,
              endTimeOnly: form.end_date ? form.end_date.split(' ')[1] : null,
              imageUrl: form.image_url,
              questions: form.questions || [],
              questionCount: form.questions?.length || 0,
              sections: form.sections || []
            };
            console.log("Final form data questions:", formData.questions);
            console.log("Final form data questionCount:", formData.questionCount);
            console.log("Setting form data:", formData);
            setSelectedForm(formData);
            setAvailableForms([formData]);

            // Cache the form data in sessionStorage to prevent loading flashes
            const cacheData = {
              formData,
              supervisorEmail: externalSupervisorEmail,
              supervisorName: externalSupervisorName,
              companyName: externalCompanyName,
              alumnusName: externalAlumnusName,
              invitationToken: invitationToken
            };
            sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));

            // Only set loading to false after form is successfully loaded
            setLoading(false);
          } else {
            console.error("Form API call failed:", result);
            console.error("Error message:", result.message);
            alert("Form access failed: " + result.message);
            setLoading(false); // Set loading to false on error
          }
        } catch (error) {
          console.error("Error loading external form:", error);
          // Clear any cached data on error
          sessionStorage.removeItem(cacheKey);
          setLoading(false); // Set loading to false on exception
        }
      };
      loadExternalForm();
    }
  }, [externalFormId, externalToken, isExternalMode]);

  // Load forms when component mounts or userRole changes (only in non-external mode)
  useEffect(() => {
    // Skip loading user forms if in external mode
    if (isExternalMode) {
      // ONLY set loading to false if external form loading is NOT in progress
      if (!(externalFormId || externalToken)) {
        setLoading(false);
      }
      return;
    }

    const loadForms = async () => {
      setLoading(true);
      try {
        const role =
          userRole === "instructor"
            ? "instructor"
            : userRole === "employer"
            ? "employer"
            : userRole === "alumni"
            ? "alumni"
            : userRole === "staff"
            ? "staff"
            : "student";

        console.log("Loading forms for role:", role);
        const publishedForms = await getFormsForUserRole(role);

        const forms = publishedForms.map((form) => ({
          id: form.id,
          title: form.title,
          description: form.description,
          category: form.category,
          dueDate: form.dueDate || "No due date",
          startDateOnly: form.startDateOnly || undefined,
          startTimeOnly: form.startTimeOnly || undefined,
          endDateOnly: form.endDateOnly || undefined,
          endTimeOnly: form.endTimeOnly || undefined,
          imageUrl: form.image,
          questions: form.questions,
          questionCount: form.questionCount,
        }));

        setAvailableForms(forms);
      } catch (error) {
        console.error("Error loading forms:", error);
        setAvailableForms([]);
      } finally {
        setLoading(false);
      }
    };

    loadForms();
  }, [userRole]);

  const handleSelectForm = async (form: FeedbackForm) => {
    // Check if the form hasn't started yet
    if (isNotStarted(form)) {
      const formattedStartDate = form.startDateOnly && form.startTimeOnly
        ? new Date(form.startDateOnly + ' ' + form.startTimeOnly).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'the scheduled start time';
      alert(`This feedback form is not yet available.\n\nIt will be available starting from: ${formattedStartDate}`);
      return;
    }

    setSelectingFormId(form.id);
    try {
      // Fetch the full form data including questions
      const result = await getForm(form.id);
      if (result.success && result.form) {
        const formQuestions = result.form.questions || [];
        const formSections = result.form.sections || [];

        // Sort questions based on interleaved order (sections + standalone questions)
        const standaloneQuestions = formQuestions.filter((q: any) => !(q.sectionId || q.section_id));

        // Create items array with order information
        const items: Array<{ type: 'section'; data: any; order: number } | { type: 'question'; data: any; order: number }> = [
          ...formSections.map((s: any) => ({
            type: 'section' as const,
            data: s,
            order: s.order ?? s.order_index ?? 0
          })),
          ...standaloneQuestions.map((q: any) => ({
            type: 'question' as const,
            data: q,
            order: q.order ?? q.order_index ?? 0
          }))
        ];

        // Sort by order
        items.sort((a, b) => a.order - b.order);

        // Build the sorted questions array
        const sortedQuestions: any[] = [];
        items.forEach(item => {
          if (item.type === 'section') {
            // Add all questions from this section in their original order
            const sectionQuestions = formQuestions.filter(
              (q: any) => (q.sectionId || q.section_id) === item.data.id
            );
            sortedQuestions.push(...sectionQuestions);
          } else {
            // Add standalone question
            sortedQuestions.push(item.data);
          }
        });

        setSelectedForm({
          ...form,
          questions: sortedQuestions,
          sections: formSections,
        });
      } else {
        // Fallback to the basic form data if full fetch fails
        setSelectedForm(form);
      }
    } catch (error) {
      console.error("Error loading form details:", error);
      // Fallback to basic form data
      setSelectedForm(form);
    } finally {
      setSelectingFormId(null);
    }
    setAnswers({});
    setCurrentPageIndex(0);
  };

  const handleBack = () => {
    setSelectedForm(null);
    setAnswers({});
    setCurrentPageIndex(0);
  };

  // Check if a form is overdue
  const isOverdue = (dueDate: string) => {
    if (!dueDate || dueDate === 'No due date') return false;
    const date = new Date(dueDate);
    return isNaN(date.getTime()) ? false : date < new Date();
  };

  // Check if a form hasn't started yet (before start date and time)
  // Uses the separate startDateOnly and startTimeOnly fields from form_deployments
  const isNotStarted = (form: FeedbackForm) => {
    const startDate = form.startDateOnly;
    const startTime = form.startTimeOnly;
    const formId = form.id;
    
    // If no start date, form is available immediately
    if (!startDate || startDate === 'null' || startDate === 'undefined' || startDate === '') return false;
    
    // Combine date and time - ensure we have proper format
    const datePart = String(startDate).split('T')[0]; // Handle if already a datetime string
    const timeStr = startTime && String(startTime) !== 'null' && String(startTime) !== 'undefined' && String(startTime) !== ''
      ? String(startTime).split('T')[1]?.split('.')[0] || startTime 
      : '00:00:00';
    
    // Validate before parsing
    if (!datePart || datePart.includes('undefined') || datePart.includes('null')) return false;
    
    // Parse as Manila time (+08:00) by appending timezone offset
    const start = new Date(`${datePart}T${timeStr}+08:00`);
    const now = new Date();
    
    // Return true if current time is before the start datetime
    return isNaN(start.getTime()) ? false : start > now;
  };

  // Check if a form has ended (after end date and time)
  const isFormEnded = (form: FeedbackForm) => {
    const endDate = form.endDateOnly;
    const endTime = form.endTimeOnly;
    const formId = form.id;
    
    // If no end date, form never ends
    if (!endDate || endDate === 'null' || endDate === 'undefined' || endDate === '') return false;
    
    // Combine date and time - ensure we have proper format
    const datePart = String(endDate).split('T')[0]; // Handle if already a datetime string
    const timeStr = endTime && String(endTime) !== 'null' && String(endTime) !== 'undefined' && String(endTime) !== ''
      ? String(endTime).split('T')[1]?.split('.')[0] || endTime 
      : '23:59:59';
    
    // Validate before parsing
    if (!datePart || datePart.includes('undefined') || datePart.includes('null')) return false;
    
    // Parse as Manila time (+08:00) by appending timezone offset - FIX: was not applying timezone
    const end = new Date(`${datePart}T${timeStr}+08:00`);
    const now = new Date();
    
    // Return true if current time is after the end datetime
    return isNaN(end.getTime()) ? false : end < now;
  };

  // Filter out submitted, ended and overdue forms
  const pendingForms = availableForms
    .filter(form => {
      if (submittedFormIds.has(form.id)) return false;
      if (isFormEnded(form)) return false;
      if (isOverdue(form.dueDate)) return false;
      return true;
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const handleSubmit = async () => {
    if (!selectedForm) {
      alert("No form selected.");
      return;
    }

    try {
      // For external/public mode, use public API submission
      if (isExternalMode) {
        console.log("Submitting external feedback...");
        const result = await submitPublicFeedback({
          formId: selectedForm.id,
          responses: answers,
          supervisorEmail: externalSupervisorEmail,
          supervisorName: externalSupervisorName,
          companyName: externalCompanyName,
          alumnusName: externalAlumnusName,
          token: invitationToken, // Include token for secure submissions
        });

        if (result.success) {
          setSubmittedFormIds(prev => new Set([...prev, selectedForm.id]));
          setExternalFeedbackSubmitted(true);
          setShowSuccessModal(true);
          console.log("External feedback submitted successfully!");
        } else {
          alert("Failed to submit feedback: " + result.message);
        }
        return;
      }

      // For authenticated users, use the normal submission
      const token = getAuthToken();
      if (!token) {
        alert("You must be logged in to submit feedback.");
        return;
      }

      // Check form submission status before attempting to submit
      const statusCheck = await checkFormSubmissionStatus(selectedForm.id);
      if (statusCheck && !statusCheck.canSubmit) {
        let errorMessage = "Cannot submit this form:\n\n";
        statusCheck.issues.forEach((issue) => {
          errorMessage += `• ${issue.message}\n`;
        });
        alert(errorMessage);
        return;
      }

      // Submit the form response
      const response = await fetch(
        `/api/forms/${selectedForm.id}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            responses: answers,
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        // Add form ID to submitted forms (session-only, not persisted)
        setSubmittedFormIds(prev => new Set([...prev, selectedForm.id]));
        // Show success modal
        setShowSuccessModal(true);
      } else {
        // Show detailed error message
        let errorMessage = result.message || "Failed to submit feedback. Please try again.";
        
        // If there are validation errors, show them
        if (result.errors && Array.isArray(result.errors)) {
          errorMessage += "\n\nValidation errors:\n" + result.errors.join("\n");
        }
        
        // If form status is provided, include it
        if (result.formStatus) {
          errorMessage += `\n\nForm status: ${result.formStatus}`;
        }
        
        console.error("Submission failed:", result);
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert(
        "An error occurred while submitting your feedback. Please try again."
      );
    }
  };

  const renderQuestionInput = (question: FormQuestion) => {
    switch (question.type) {
      case "rating":
        const maxStars = (question as any).max || 5;
        return (
          <div className="flex gap-3 sm:gap-3 justify-center py-6 sm:py-4">
            {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
              <button
                key={star}
                onClick={() => setAnswers({ ...answers, [question.id]: star })}
                className={`text-4xl sm:text-4xl transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center rounded touch-manipulation hover:scale-110 ${
                  answers[question.id] >= star
                    ? "text-yellow-400 drop-shadow-sm"
                    : "text-gray-300 hover:text-yellow-200"
                }`}
              >
                ★
              </button>
            ))}
          </div>
        );

      case "multiple-choice":
        return (
          <RadioGroup
            value={answers[question.id] || ""}
            onValueChange={(value) =>
              setAnswers({ ...answers, [question.id]: value })
            }
          >
            <div className="space-y-4 sm:space-y-3">
              {question.options?.map((option) => (
                <div
                  key={option.id || option.option_text}
                  className="flex items-center space-x-3 py-1"
                >
                  <RadioGroupItem
                    value={option.option_text}
                    id={`${question.id}-${option.id || option.option_text}`}
                    className="min-h-[44px] min-w-[44px]"
                  />
                  <Label
                    htmlFor={`${question.id}-${
                      option.id || option.option_text
                    }`}
                    className="cursor-pointer text-base sm:text-sm leading-relaxed py-2"
                  >
                    {option.option_text}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case "checkbox":
        return (
          <div className="space-y-4 sm:space-y-3">
            {question.options?.map((option) => (
              <div
                key={option.id || option.option_text}
                className="flex items-center space-x-3 py-1"
              >
                <Checkbox
                  id={`${question.id}-${option.id || option.option_text}`}
                  checked={
                    answers[question.id]?.includes(option.option_text) || false
                  }
                  onCheckedChange={(checked) => {
                    const current = answers[question.id] || [];
                    setAnswers({
                      ...answers,
                      [question.id]: checked
                        ? [...current, option.option_text]
                        : current.filter(
                            (item: string) => item !== option.option_text
                          ),
                    });
                  }}
                  className="min-h-[44px] min-w-[44px]"
                />
                <Label
                  htmlFor={`${question.id}-${option.id || option.option_text}`}
                  className="cursor-pointer text-base sm:text-sm leading-relaxed py-2"
                >
                  {option.option_text}
                </Label>
              </div>
            ))}
          </div>
        );

      case "dropdown":
        return (
          <Select
            value={answers[question.id] || ""}
            onValueChange={(value) =>
              setAnswers({ ...answers, [question.id]: value })
            }
          >
            <SelectTrigger className="h-14 sm:h-10 sm:min-h-[44px] touch-manipulation">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem
                  key={option.id || option.option_text}
                  value={option.option_text}
                  className="py-3 px-4 text-base sm:text-sm"
                >
                  {option.option_text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "linear-scale":
        const minVal = (question as any).min || 1;
        const maxVal = (question as any).max || 10;
        const currentValue = answers[question.id] || minVal;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 sm:gap-2">
              <span className="text-sm sm:text-sm text-gray-500 font-medium">{minVal}</span>
              <div className="flex gap-2 sm:gap-2 overflow-x-auto pb-2 px-2">
                {Array.from({ length: maxVal - minVal + 1 }, (_, i) => minVal + i).map((num) => (
                  <button
                    key={num}
                    onClick={() =>
                      setAnswers({ ...answers, [question.id]: num })
                    }
                    className={`w-12 h-12 sm:w-12 sm:h-12 rounded border-2 transition-all flex-shrink-0 min-h-[48px] min-w-[48px] touch-manipulation text-base font-medium ${
                      answers[question.id] === num
                        ? "border-green-500 bg-green-500 text-white shadow-md"
                        : "border-gray-300 hover:border-green-300 bg-white"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <span className="text-xs sm:text-sm text-gray-500">{maxVal}</span>
            </div>
          </div>
        );

      case "text":
        return (
          <Input
            value={answers[question.id] || ""}
            onChange={(e) =>
              setAnswers({ ...answers, [question.id]: e.target.value })
            }
            placeholder="Type your answer here..."
            className="h-14 sm:h-10 text-base sm:min-h-[44px] touch-manipulation"
          />
        );

      case "textarea":
        return (
          <Textarea
            value={answers[question.id] || ""}
            onChange={(e) =>
              setAnswers({ ...answers, [question.id]: e.target.value })
            }
            placeholder="Type your answer here..."
            rows={5}
            className="text-base resize-none min-h-[120px] touch-manipulation"
          />
        );

      default:
        return null;
    }
  };

  // Show form list if no form is selected (skip in external mode)
  if (!selectedForm) {
    if (isExternalMode) {
      // Handle external mode without selected form
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-lime-50">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <ContentRenderer
              loading={loading}
              isExternalMode={isExternalMode}
              selectedForm={selectedForm}
              availableForms={pendingForms}
              onBackToLogin={onBackToLogin}
              onSelectForm={handleSelectForm}
              isNotStarted={isNotStarted}
              isOverdue={isOverdue}
              externalFeedbackSubmitted={externalFeedbackSubmitted}
              selectingFormId={selectingFormId}
            />
          </div>
        </div>
      );
    } else {
      // Show form selection UI for authenticated users
      return (
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-4 sm:p-6 border border-green-100">
            <h2 className="text-xl sm:text-2xl">Submit Feedback</h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Complete your assigned feedback forms
            </p>
          </div>

          {/* Content based on state */}
          <ContentRenderer
            loading={loading}
            isExternalMode={isExternalMode}
            selectedForm={selectedForm}
            availableForms={pendingForms}
            onBackToLogin={onBackToLogin}
            onSelectForm={handleSelectForm}
            isNotStarted={isNotStarted}
            isOverdue={isOverdue}
            externalFeedbackSubmitted={externalFeedbackSubmitted}
            selectingFormId={selectingFormId}
          />
        </div>
      );
    }
  }

  // Show form answering interface
  // Calculate progress based on pages
  const progress = totalPages > 0 ? ((currentPageIndex + 1) / totalPages) * 100 : 0;
  const isLastPage = currentPageIndex === totalPages - 1;
  console.log("Progress calculation:", { currentPageIndex, totalPages, progress, isLastPage });

  // Render a single question card
  const renderQuestionCard = (question: FormQuestion) => (
    <div key={question.id} className="bg-white rounded-xl shadow-md border border-green-100 p-4 sm:p-3 mb-6 sm:mb-4">
      <div className="space-y-4 sm:space-y-3">
        {/* Question Header */}
        <div className="pb-4 sm:pb-3 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-lg text-gray-900 mb-2 sm:mb-1 leading-tight break-words font-medium">
              {question.question}
              {question.required && (
                <span className="text-red-500 ml-1.5">*</span>
              )}
            </h3>
            {question.description && (
              <p className="text-sm text-gray-500 mt-2 sm:mt-1 leading-relaxed break-words">
                {question.description}
              </p>
            )}
          </div>
        </div>

        {/* Answer Input Area */}
        <div className="pt-2 sm:pt-1">{renderQuestionInput(question)}</div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-50 via-white to-lime-50"
    >
      <div className="max-w-4xl mx-auto px-5 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-6">
        {/* University Header Banner */}
        <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-lime-600 px-6 sm:px-6 py-8 sm:py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-white text-2xl sm:text-2xl mb-2 sm:mb-1">
                  FeedbACTS System
                </h1>
                <p className="text-green-50 text-base sm:text-sm">
                  Your feedback helps us improve educational excellence
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-white hover:bg-white/20 border border-white/30 h-12 sm:h-10 px-3 sm:px-4 text-sm whitespace-nowrap sm:min-h-[44px] touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Exit Form</span>
              </Button>
            </div>
          </div>

          {/* Form Title Section */}
          <div className="px-6 sm:px-6 py-8 sm:py-6 border-b border-gray-100">
            {/* External Supervisor Info - shown only in external mode */}
            {isExternalMode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-blue-800 font-medium mb-3">Your Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-blue-700 text-sm">Your Name</Label>
                    <Input
                      value={externalSupervisorName}
                      readOnly
                      className="mt-1 bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Label className="text-blue-700 text-sm">Your Email</Label>
                    <Input
                      value={externalSupervisorEmail}
                      readOnly
                      className="mt-1 bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Label className="text-blue-700 text-sm">Company</Label>
                    <Input
                      value={externalCompanyName}
                      readOnly
                      className="mt-1 bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Label className="text-blue-700 text-sm">Alumnus Name</Label>
                    <Input
                      value={externalAlumnusName}
                      readOnly
                      className="mt-1 bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl mb-2">{selectedForm.title}</h2>
                <p className="text-gray-600 mb-3">{selectedForm.description}</p>
                {/* Category and Due Date Badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    {selectedForm.category}
                  </Badge>
                  {selectedForm.dueDate && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Due {selectedForm.dueDate}</span>
                    </div>
                  )}
                </div>
              </div>
              {selectedForm.imageUrl && (
                <div className="hidden md:block w-32 h-32 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                  <img
                    src={selectedForm.imageUrl}
                    alt={selectedForm.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Progress Section */}
          <div className="px-6 sm:px-6 py-6 sm:py-5 bg-gradient-to-r from-green-50 to-lime-50">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 text-sm">
                <span className="text-gray-700">
                  {currentPage?.type === 'section' ? (
                    <>
                      {currentPage.section.title}
                    </>
                  ) : (
                    <>
                      Question{" "}
                      <span className="text-green-600">
                        {currentPageIndex + 1}
                      </span>
                    </>
                  )}
                </span>
                <span className="text-green-600">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <div className="relative">
                <Progress value={progress} className="h-3 bg-white" />
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span className="break-words">All responses are confidential and secure</span>
              </p>
            </div>
          </div>
        </div>

        {/* Section Header (for section pages) */}
        {currentPage?.type === 'section' && (
          <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl border border-green-200 p-6 sm:p-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-green-800">{currentPage.section.title}</h3>
                {currentPage.section.description && (
                  <p className="text-sm text-green-600 mt-0.5">{currentPage.section.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Questions - either single standalone or all questions in a section */}
        {currentPage?.type === 'section' ? (
          // Render all questions in the section
          currentPage.questions.map((question) => renderQuestionCard(question))
        ) : (
          // Render single standalone question
          currentPage && renderQuestionCard(currentPage.question)
        )}

        {/* Navigation Footer */}
        <div className="bg-white rounded-xl shadow-sm border border-green-100 px-6 sm:px-6 py-6 sm:py-5">
          <div className="flex justify-between items-center gap-6">
            <Button
              variant="outline"
              onClick={() => {
                if (currentPageIndex > 0) {
                  setCurrentPageIndex(currentPageIndex - 1);
                } else {
                  handleBack();
                }
              }}
              className="border-gray-300 hover:bg-gray-50 px-4 h-12 sm:h-10 text-sm whitespace-nowrap sm:min-h-[44px] touch-manipulation flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">
                {currentPageIndex === 0 ? "Back" : "Previous"}
              </span>
            </Button>

            <div className="text-center text-sm text-gray-500 flex-1 px-2">
              {isLastPage
                ? "Ready to submit"
                : `${totalPages - currentPageIndex - 1} pages remaining`}
            </div>

            {isLastPage ? (
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-700 hover:to-lime-700 px-4 shadow-md h-12 sm:h-10 text-sm whitespace-nowrap sm:min-h-[44px] touch-manipulation flex-shrink-0"
              >
                <span className="hidden sm:inline mr-2">Submit</span>
                <Send className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentPageIndex(currentPageIndex + 1)}
                className="bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-700 hover:to-lime-700 px-4 h-12 sm:h-10 text-sm whitespace-nowrap sm:min-h-[44px] touch-manipulation flex-shrink-0"
              >
                <span className="hidden sm:inline mr-2">Next</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={(open) => !open && setShowSuccessModal(false)}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-lg">
          <DialogHeader className="text-center">
            <DialogTitle></DialogTitle>
            <DialogDescription></DialogDescription>
            <div className="flex flex-col items-center">
              {/* Animated checkmark circle */}
              <div className="mb-2 relative">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-lime-500 shadow-lg">
                  <Check className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                </div>
              </div>
              
              {/* Thank you message */}
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Thank You!
              </h2>
              <p className="text-base text-gray-700 mt-1 font-medium">
                Your feedback has been submitted successfully
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                We appreciate your time and valuable input
              </p>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-col items-center justify-center mt-6 gap-3 sm:flex-col">
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                // Navigate back to form list
                handleBack();
              }}
              className="bg-gradient-to-r from-green-500 to-lime-500 hover:from-green-600 hover:to-lime-600 text-white px-8 sm:px-12 py-3 sm:py-4 text-sm font-medium shadow-lg transition-all min-w-[180px] sm:min-w-[200px]"
            >
              Back to Forms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


