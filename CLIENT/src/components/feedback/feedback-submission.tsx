import { useState, useEffect, useRef } from "react";
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
import { ArrowLeft, Send, ClipboardList, Clock } from "lucide-react";
import { Badge } from "../ui/badge";
import {
  getFormsForUserRole,
  FormQuestion as ServiceFormQuestion,
  PublishedForm,
  checkFormSubmissionStatus,
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
  questionCount?: number;
}



interface FeedbackSubmissionProps {
  userRole?: string;
}

export function FeedbackSubmission({ userRole }: FeedbackSubmissionProps = {}) {
  const [selectedForm, setSelectedForm] = useState<FeedbackForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [availableForms, setAvailableForms] = useState<FeedbackForm[]>([]);
  const [loading, setLoading] = useState(true);

  // Mobile swipe gesture handling
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX.current - touchEndX;
    const deltaY = touchStartY.current - touchEndY;

    // Only handle horizontal swipes (ignore vertical scrolls)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe left - next question
        if (currentQuestionIndex < selectedForm!.questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
      } else {
        // Swipe right - previous question
        if (currentQuestionIndex > 0) {
          setCurrentQuestionIndex(currentQuestionIndex - 1);
        } else {
          handleBack();
        }
      }
    }

    touchStartX.current = 0;
    touchStartY.current = 0;
  };

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
          questionCount: form.questionCount,
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
        return (
          <div className="flex gap-2 sm:gap-3 justify-center py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setAnswers({ ...answers, [question.id]: star })}
                className={`text-3xl sm:text-4xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded ${
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
            value={answers[question.id] || ""}
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
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-gray-500">1</span>
              <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() =>
                      setAnswers({ ...answers, [question.id]: num })
                    }
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded border-2 transition-all flex-shrink-0 min-h-[44px] min-w-[44px] ${
                      answers[question.id] === num
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300 hover:border-green-300"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <span className="text-xs sm:text-sm text-gray-500">10</span>
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
            className="h-12 sm:h-10 text-base"
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
            className="text-base"
          />
        );

      default:
        return null;
    }
  };

  // Show form list if no form is selected
  if (!selectedForm) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-4 sm:p-6 border border-green-100">
          <h2 className="text-xl sm:text-2xl">Submit Feedback</h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableForms.map((form) => (
              <Card
                key={form.id}
                className="border-green-100 hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Form Image */}
                {form.imageUrl ? (
                  <div className="relative h-32 sm:h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={form.imageUrl}
                      alt={form.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 z-10">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                        <Badge
                          variant="outline"
                          className="bg-white border-green-200 text-green-700 text-xs shadow-md"
                        >
                          {form.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-white bg-orange-600 px-2 py-1 rounded text-xs shadow-md">
                          <Clock className="w-3 h-3" />
                          <span>Due {form.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-32 sm:h-48 w-full overflow-hidden bg-gradient-to-br from-green-50 to-lime-50 flex items-center justify-center">
                    <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <Badge
                          variant="outline"
                          className="bg-white border-green-200 text-green-700 text-xs shadow-md"
                        >
                          {form.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-orange-600 bg-white px-2 py-1 rounded text-xs shadow-md">
                          <Clock className="w-3 h-3" />
                          <span>Due {form.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                        <CardTitle className="text-base sm:text-lg leading-tight break-words">{form.title}</CardTitle>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 break-words">
                        {form.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <ClipboardList className="w-4 h-4" />
                      <span>{form.questionCount || form.questions.length} questions</span>
                    </div>
                    <Button
                      className="bg-green-500 hover:bg-green-600 h-7 px-1.5 sm:px-2 text-xs whitespace-nowrap"
                      onClick={() => handleSelectForm(form)}
                    >
                      <span className="hidden sm:inline">Start Feedback</span>
                      <span className="sm:hidden">Start</span>
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
    <div
      className="min-h-screen bg-gradient-to-br from-green-50 via-white to-lime-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
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
                className="text-white hover:bg-white/20 border border-white/30 h-10 px-3 sm:px-4 text-sm whitespace-nowrap"
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
          <div className="px-4 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-green-50 to-lime-50">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 text-sm">
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

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-md border border-green-100 p-4 sm:p-8">
          <div className="space-y-4 sm:space-y-6">
            {/* Question Header */}
            <div className="pb-4 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-lime-500 flex items-center justify-center text-white text-sm sm:text-base">
                  {currentQuestionIndex + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg text-gray-900 mb-1 leading-tight break-words">
                    {currentQuestion.question}
                    {currentQuestion.required && (
                      <span className="text-red-500 ml-1.5">*</span>
                    )}
                  </h3>
                  {currentQuestion.description && (
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed break-words">
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
        <div className="bg-white rounded-xl shadow-sm border border-green-100 px-4 sm:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                } else {
                  handleBack();
                }
              }}
              className="border-gray-300 hover:bg-gray-50 px-3 sm:px-4 h-10 text-sm whitespace-nowrap w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              
              <span className="sm:hidden">
                {currentQuestionIndex === 0 ? "Back" : "Prev"}
              </span>
            </Button>

            <div className="text-center text-sm text-gray-500 order-first sm:order-none">
              {isLastQuestion
                ? "Ready to submit"
                : `${
                    selectedForm.questions.length - currentQuestionIndex - 1
                  } questions remaining`}
            </div>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-700 hover:to-lime-700 px-3 sm:px-4 shadow-md h-10 text-sm whitespace-nowrap w-auto"
              >
                <Send className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Submit Feedback</span>
                
              </Button>
            ) : (
              <Button
                onClick={() =>
                  setCurrentQuestionIndex(currentQuestionIndex + 1)
                }
                className="bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-700 hover:to-lime-700 px-3 sm:px-4 h-10 text-sm whitespace-nowrap w-auto"
              >
                
                <span className="sm:hidden ml-2">Next</span>
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
