import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../Reusable_components/card";
import { Button } from "../Reusable_components/button";
import { Label } from "../Reusable_components/label";
import { Input } from "../Reusable_components/input";
import { Textarea } from "../Reusable_components/textarea";
import { RadioGroup, RadioGroupItem } from "../Reusable_components/radio-group";
import { Checkbox } from "../Reusable_components/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Reusable_components/select";
import { Progress } from "../Reusable_components/progress";
import { ArrowLeft, Send, ClipboardList, Clock } from "lucide-react";
import { Badge } from "../Reusable_components/badge";
import {
  getFormsForUserRole,
  FormQuestion as ServiceFormQuestion,
  PublishedForm,
} from "../../services/publishedFormsService";
import { getForm } from "../../services/formManagementService";
import { getAuthToken } from "../../utils/auth";

type FormQuestion = ServiceFormQuestion;

interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  imageUrl?: string;
  questions: FormQuestion[];
}

// ============================================================
// TODO: BACKEND - Feedback Submission
// ============================================================
// Get Assigned Forms:
// - GET /api/forms/assigned?userId={userId}
//   Response: [{ id, title, description, category, dueDate, imageUrl, questions: [...] }]
//
// Get Single Form:
// - GET /api/forms/:formId
//   Response: { id, title, description, questions: [...] }
//
// Submit Response:
// - POST /api/forms/:formId/responses
//   Request: { answers: [{ questionId, answer, rating }], responseTimeSeconds }
//   Response: { id, message: 'Response submitted successfully' }
//
// Save Draft (Optional):
// - POST /api/forms/:formId/drafts
//   Request: { answers: [...], isComplete: false }
//   Response: { draftId, message: 'Draft saved' }
// ============================================================
//
// ============================================================
// BACKEND FLOW EXPLANATION - Form Creation to Submission
// ============================================================
//
// 1. ADMIN CREATES FORM (Form Builder Component):
//    - Admin designs form with title, description, image, questions
//    - Image URL is uploaded/stored during form creation
//    - POST /api/forms
//      Request: {
//        title, description, category, imageUrl (uploaded image),
//        questions: [...], targetRoles: ['student', 'instructor', etc.],
//        dueDate, scheduledPublishDate
//      }
//      Response: { formId, message: 'Form created successfully' }
//
// 2. FORM ASSIGNMENT TO STAKEHOLDERS:
//    - When Admin publishes form, it gets assigned to target stakeholders
//    - POST /api/forms/:formId/publish
//      Request: {
//        targetRoles: ['student', 'instructor', 'alumni', 'employer', 'staff'],
//        specificUsers: [userId1, userId2...] (optional),
//        dueDate
//      }
//      Response: { assignedCount, message: 'Form assigned to 150 users' }
//
// 3. STAKEHOLDERS RECEIVE FORMS:
//    - Each stakeholder (Student, Instructor, Alumni, Employer, Staff) sees
//      their assigned forms when they open Feedback Submission
//    - GET /api/forms/assigned?userId={userId}&role={userRole}
//      Response: [{
//        id, title, description, category, dueDate,
//        imageUrl (SAME image uploaded by Admin in Form Builder),
//        questions: [...]
//      }]
//
// 4. STAKEHOLDER SUBMITS FEEDBACK:
//    - User fills out form and submits
//    - POST /api/forms/:formId/responses
//      Request: {
//        userId, userRole,
//        answers: [{ questionId, answer, rating }],
//        completedAt, responseTimeSeconds
//      }
//      Response: { responseId, message: 'Response submitted successfully' }
//
// KEY POINTS:
// - The imageUrl created in Form Builder is stored in database
// - Same imageUrl is sent to ALL stakeholders who receive the form
// - Forms can be role-specific (e.g., only for Students or Instructors)
// - All stakeholders (Students, Instructors, Alumni, Employers, Staff)
//   use the SAME submission interface
// ============================================================

interface FeedbackSubmissionProps {
  userRole?: string;
}

export function FeedbackSubmission({ userRole }: FeedbackSubmissionProps = {}) {
  const [selectedForm, setSelectedForm] = useState<FeedbackForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [availableForms, setAvailableForms] = useState<FeedbackForm[]>([]);
  const [loading, setLoading] = useState(true);

  // Load forms when component mounts or userRole changes
  useEffect(() => {
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

        console.log("Published forms received:", publishedForms.length);

        const forms = publishedForms.map((form) => ({
          id: form.id,
          title: form.title,
          description: form.description,
          category: form.category,
          dueDate: form.dueDate || "No due date",
          imageUrl: form.image,
          questions: form.questions,
        }));

        console.log("Mapped forms:", forms);
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
    try {
      // Fetch the full form data including questions
      const result = await getForm(form.id);
      if (result.success && result.form) {
        setSelectedForm({
          ...form,
          questions: result.form.questions || [],
        });
      } else {
        // Fallback to the basic form data if full fetch fails
        setSelectedForm(form);
      }
    } catch (error) {
      console.error("Error loading form details:", error);
      // Fallback to basic form data
      setSelectedForm(form);
    }
    setAnswers({});
    setCurrentQuestionIndex(0);
  };

  const handleBack = () => {
    setSelectedForm(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
  };

  const handleSubmit = async () => {
    if (!selectedForm) {
      alert("No form selected.");
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        alert("You must be logged in to submit feedback.");
        return;
      }

      // Submit the form response
      const response = await fetch(
        `http://localhost:5000/api/forms/${selectedForm.id}/submit`,
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
        alert("Feedback submitted successfully! Thank you for your response.");
        handleBack();
      } else {
        alert(result.message || "Failed to submit feedback. Please try again.");
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
        return (
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setAnswers({ ...answers, [question.id]: star })}
                className={`text-4xl transition-colors ${
                  answers[question.id] >= star
                    ? "text-yellow-400"
                    : "text-gray-300"
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
            value={answers[question.id]}
            onValueChange={(value) =>
              setAnswers({ ...answers, [question.id]: value })
            }
          >
            <div className="space-y-3">
              {question.options?.map((option) => (
                <div
                  key={option.id || option.option_text}
                  className="flex items-center space-x-2"
                >
                  <RadioGroupItem
                    value={option.option_text}
                    id={`${question.id}-${option.id || option.option_text}`}
                  />
                  <Label
                    htmlFor={`${question.id}-${
                      option.id || option.option_text
                    }`}
                    className="cursor-pointer"
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
          <div className="space-y-3">
            {question.options?.map((option) => (
              <div
                key={option.id || option.option_text}
                className="flex items-center space-x-2"
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
                />
                <Label
                  htmlFor={`${question.id}-${option.id || option.option_text}`}
                  className="cursor-pointer"
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
            value={answers[question.id]}
            onValueChange={(value) =>
              setAnswers({ ...answers, [question.id]: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem
                  key={option.id || option.option_text}
                  value={option.option_text}
                >
                  {option.option_text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "linear-scale":
        const currentValue = answers[question.id] || 5;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-500">1</span>
              <div className="flex gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() =>
                      setAnswers({ ...answers, [question.id]: num })
                    }
                    className={`w-10 h-10 rounded border-2 transition-all ${
                      answers[question.id] === num
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300 hover:border-green-300"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <span className="text-sm text-gray-500">10</span>
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
          />
        );

      default:
        return null;
    }
  };

  // Show form list if no form is selected
  if (!selectedForm) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-6 border border-green-100">
          <h2 className="text-2xl">Submit Feedback</h2>
          <p className="text-gray-600 mt-1">
            Complete your assigned feedback forms
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <p className="mt-2 text-gray-600">Loading your assigned forms...</p>
          </div>
        ) : availableForms.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Forms Assigned
            </h3>
            <p className="text-gray-600">
              You don't have any feedback forms assigned at this time.
            </p>
          </div>
        ) : (
          /* Assigned Forms */
          <div className="grid grid-cols-1 gap-4">
            {availableForms.map((form) => (
              <Card
                key={form.id}
                className="border-green-100 hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Form Image */}
                {form.imageUrl && (
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={form.imageUrl}
                      alt={form.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="bg-white/90 backdrop-blur-sm border-green-200 text-green-700"
                        >
                          {form.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-white bg-orange-600/90 backdrop-blur-sm px-2 py-1 rounded">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">Due {form.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle>{form.title}</CardTitle>
                        {!form.imageUrl && (
                          <>
                            <Badge
                              variant="outline"
                              className="border-green-200"
                            >
                              {form.category}
                            </Badge>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {form.description}
                      </p>
                    </div>
                    {!form.imageUrl && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Due {form.dueDate}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ClipboardList className="w-4 h-4" />
                      <span>{form.questions.length} questions</span>
                    </div>
                    <Button
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => handleSelectForm(form)}
                    >
                      Start Feedback
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show form answering interface
  const currentQuestion = selectedForm.questions[currentQuestionIndex];
  const progress =
    ((currentQuestionIndex + 1) / selectedForm.questions.length) * 100;
  const isLastQuestion =
    currentQuestionIndex === selectedForm.questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-lime-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* University Header Banner */}
        <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-lime-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-white text-2xl mb-1">
                  University Feedback System
                </h1>
                <p className="text-green-50 text-sm">
                  Your feedback helps us improve educational excellence
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={handleBack}
                className="text-white hover:bg-white/20 border border-white/30"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exit Form
              </Button>
            </div>
          </div>

          {/* Form Title Section */}
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
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
                <h2 className="text-2xl mb-2">{selectedForm.title}</h2>
                <p className="text-gray-600">{selectedForm.description}</p>
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
          <div className="px-8 py-5 bg-gradient-to-r from-green-50 to-lime-50">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">
                  Question{" "}
                  <span className="text-green-600">
                    {currentQuestionIndex + 1}
                  </span>{" "}
                  of {selectedForm.questions.length}
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
                  className="w-3.5 h-3.5"
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
                All responses are confidential and secure
              </p>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-md border border-green-100 p-8">
          <div className="space-y-6">
            {/* Question Header */}
            <div className="pb-4 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-lime-500 flex items-center justify-center text-white">
                  {currentQuestionIndex + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg text-gray-900 mb-1">
                    {currentQuestion.question}
                    {currentQuestion.required && (
                      <span className="text-red-500 ml-1.5">*</span>
                    )}
                  </h3>
                  {currentQuestion.description && (
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                      {currentQuestion.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Answer Input Area */}
            <div className="pt-2">{renderQuestionInput(currentQuestion)}</div>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-white rounded-xl shadow-sm border border-green-100 px-8 py-5">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                } else {
                  handleBack();
                }
              }}
              className="border-gray-300 hover:bg-gray-50 px-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentQuestionIndex === 0 ? "Back to Forms" : "Previous"}
            </Button>

            <div className="text-sm text-gray-500">
              {isLastQuestion
                ? "Ready to submit"
                : `${
                    selectedForm.questions.length - currentQuestionIndex - 1
                  } questions remaining`}
            </div>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-700 hover:to-lime-700 px-8 shadow-md"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Feedback
              </Button>
            ) : (
              <Button
                onClick={() =>
                  setCurrentQuestionIndex(currentQuestionIndex + 1)
                }
                className="bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-700 hover:to-lime-700 px-8"
              >
                Next Question
                <svg
                  className="w-4 h-4 ml-2"
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
    </div>
  );
}
