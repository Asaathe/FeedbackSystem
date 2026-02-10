import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Plus,
  Trash2,
  Eye,
  Save,
  ArrowLeft,
  FileText,
  Target,
  Upload,
  X,
  Settings,
  ChevronDown,
  ChevronUp,
  Star,
  Type,
  AlignLeft,
  List,
  CheckCircle2,
  Sliders,
  SendHorizontal,
  Calendar,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { toast } from "sonner";
import { Checkbox } from "../ui/checkbox";
import { EnhancedImage, getImageRecommendations, validateImageFile } from "../../utils/imageUtils";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { ImageCropper } from "../ui/image-cropper";

// Custom hooks
import { useFormSettings } from "./hooks/useFormSettings";
import { useQuestions } from "./hooks/useQuestions";
import { useRecipients } from "./hooks/useRecipients";
import { usePublishWizard } from "./hooks/usePublishWizard";

// Components
import { QuestionCard } from "./components/QuestionCard";
import { RecipientSelector } from "./components/RecipientSelector";
import { CategoryManager } from "./components/CategoryManager";

// Types
import { QuestionTypeConfig, FormQuestion, Instructor } from "./types/form";

// Utils
import { cleanQuestions, getDepartmentFromSection, formatUserDetails } from "./utils/formValidation";

// AI Service
import { generateQuestionsWithAI, GeneratedQuestion } from "../../services/aiQuestionService";

interface FormBuilderProps {
  onBack: () => void;
  formId?: string;
  isCustomFormTab?: boolean;
}

const questionTypes: QuestionTypeConfig[] = [
  { value: "text", label: "Short Text", icon: Type },
  { value: "textarea", label: "Long Text", icon: AlignLeft },
  { value: "multiple-choice", label: "Multiple Choice", icon: CheckCircle2 },
  { value: "checkbox", label: "Checkboxes", icon: List },
  { value: "dropdown", label: "Dropdown", icon: List },
  { value: "rating", label: "Star Rating", icon: Star },
  { value: "linear-scale", label: "Linear Scale", icon: Sliders },
];

export function FormBuilder({
  onBack,
  formId,
  isCustomFormTab,
}: FormBuilderProps) {
  // Form Settings Hook
  const {
    formTitle,
    setFormTitle,
    formDescription,
    setFormDescription,
    formCategory,
    setFormCategory,
    formTarget,
    setFormTarget,
    formImage,
    setFormImage,
    imageFile,
    setImageFile,
    isPublished,
    setIsPublished,
    customCategories,
    databaseCategories,
    loadingCategories,
    loadingCategoryOperation,
    submissionSchedule,
    setSubmissionSchedule,
    loading,
    setLoading,
    handleImageUpload,
    removeImage,
    addCategory,
    removeCategory,
    saveForm,
    publishForm,
    aiDescription,
    setAiDescription,
  } = useFormSettings({ formId });

  // Questions Hook
  const {
    questions,
    activeQuestion,
    setActiveQuestion,
    addQuestion,
    duplicateQuestion,
    updateQuestion,
    deleteQuestion,
    moveQuestion,
    addOption,
    updateOption,
    deleteOption,
    loadQuestions,
  } = useQuestions();

  // Recipients Hook
  const {
    selectedAudienceType,
    setSelectedAudienceType,
    selectedDepartment,
    setSelectedDepartment,
    selectedCourseYearSection,
    setSelectedCourseYearSection,
    recipients,
    filteredRecipients,
    selectedRecipients,
    setSelectedRecipients,
    selectAllRecipients,
    searchTerm,
    setSearchTerm,
    alumniCompanies,
    employerCompanies,
    instructors,
    filteredInstructors,
    selectedInstructors,
    setSelectedInstructors,
    instructorSearchTerm,
    setInstructorSearchTerm,
    courseYearSections,
    instructorDepartments,
    studentDepartments,
    loadingStudentDepartments,
    toggleRecipient,
    toggleAllRecipients,
    toggleInstructor,
    assignToUsers,
    deployToGroup,
  } = useRecipients();

  // Wizard Hook
  const {
    currentWizardStep,
    totalWizardSteps,
    nextWizardStep,
    prevWizardStep,
    resetWizard,
  } = usePublishWizard(4);

  // Dialog States
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [cropperDialogOpen, setCropperDialogOpen] = useState(false);
  const [fileToCrop, setFileToCrop] = useState<File | null>(null);

  // AI Question Generation States
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // State to track loaded recipients and instructors from existing form
  const [loadedRecipientIds, setLoadedRecipientIds] = useState<Set<number>>(new Set());
  const [loadedInstructorIds, setLoadedInstructorIds] = useState<Set<number>>(new Set());

  // Load existing form data when formId is provided
  useEffect(() => {
    const loadExistingForm = async () => {
      if (formId) {
        try {
          // Load from API
          const { getForm } = await import("../../services/formManagementService");
          const result = await getForm(formId);
          if (result.success && result.form) {
            const form = result.form;
            console.log("📋 Loaded form data:", form);
            console.log("📋 Deployment data:", form.deployment);
            console.log("📋 Target filters:", form.deployment?.target_filters);
            setFormTitle(form.title || "");
            setFormDescription(form.description || "");
            setFormCategory(form.category || "Academic");
            setFormTarget(form.target_audience || "All Users");
            setFormImage(form.image_url || null);
            setIsPublished(form.status === "active");
            setAiDescription(form.ai_description || "");

            // Parse target_audience to set audience selection fields
            // First, check if there's deployment data with target_filters
            let target = form.target_audience || "All Users";
            let targetDepartment = "";
            let targetCourseYearSection = "";

            if (form.deployment && form.deployment.target_filters) {
              const filters = form.deployment.target_filters;
              // Use deployment data if available
              if (filters.target_audience) {
                target = filters.target_audience;
              }
              if (filters.department) {
                targetDepartment = filters.department;
              }
              if (filters.course_year_section) {
                targetCourseYearSection = filters.course_year_section;
              }
            } else {
              // If no deployment data, extract from target_audience field
              if (target.includes(" - ")) {
                const parts = target.split(" - ");
                const audienceType = parts[0];
                const courseYearSection = parts.slice(1).join(" - ");
                targetCourseYearSection = courseYearSection;
                if (audienceType === "Students") {
                  targetDepartment = getDepartmentFromSection(courseYearSection);
                }
              }
            }

            if (target === "All Users") {
              setSelectedAudienceType("All Users");
              setSelectedDepartment("");
              setSelectedCourseYearSection("");
            } else if (target.includes(" - ")) {
              const parts = target.split(" - ");
              const audienceType = parts[0];
              // Get all parts after the audience type to form the full course/year/section
              const courseYearSection = parts.slice(1).join(" - ");
              setSelectedAudienceType(audienceType);
              setSelectedCourseYearSection(courseYearSection);
              if (audienceType === "Students") {
                // Use department from deployment data if available, otherwise extract from courseYearSection
                const department = targetDepartment || getDepartmentFromSection(courseYearSection);
                setSelectedDepartment(department);
              } else {
                setSelectedDepartment("");
              }
            } else {
              setSelectedAudienceType(target);
              setSelectedDepartment(targetDepartment);
              setSelectedCourseYearSection(targetCourseYearSection);
            }

            console.log("📋 Setting audience values:", {
              target,
              targetDepartment,
              targetCourseYearSection,
              selectedAudienceType: target,
              selectedDepartment: targetDepartment,
              selectedCourseYearSection: targetCourseYearSection
            });

            // Load submission schedule if available
            // Use deployment data if available, otherwise use form data
            let scheduleStartDate = form.start_date || "";
            let scheduleEndDate = form.end_date || "";
            let scheduleStartTime = "";
            let scheduleEndTime = "";

            console.log("📋 Raw schedule dates:", {
              start_date: form.start_date,
              end_date: form.end_date,
              deployment_start_date: form.deployment?.start_date,
              deployment_end_date: form.deployment?.end_date,
              deployment_start_time: form.deployment?.start_time,
              deployment_end_time: form.deployment?.end_time,
            });

            if (form.deployment) {
              // Use deployment dates if available
              if (form.deployment.start_date) {
                scheduleStartDate = form.deployment.start_date;
              }
              if (form.deployment.end_date) {
                scheduleEndDate = form.deployment.end_date;
              }
              // Use deployment time values directly (format: HH:MM:SS)
              if (form.deployment.start_time) {
                // Format from HH:MM:SS to HH:MM for HTML time input
                scheduleStartTime = form.deployment.start_time.substring(0, 5);
              }
              if (form.deployment.end_time) {
                // Format from HH:MM:SS to HH:MM for HTML time input
                scheduleEndTime = form.deployment.end_time.substring(0, 5);
              }
            }

            console.log("📋 Schedule dates before formatting:", {
              scheduleStartDate,
              scheduleEndDate,
              scheduleStartTime,
              scheduleEndTime,
            });

            // Format dates to YYYY-MM-DD format (remove time component)
            // Handle both ISO format with timezone (2026-02-10T16:00:00.000Z) and without (2026-02-10T16:00:00)
            if (scheduleStartDate && scheduleStartDate.includes('T')) {
              // Parse the date as UTC and convert to local time
              const dateObj = new Date(scheduleStartDate);
              // Get local date components
              const year = dateObj.getFullYear();
              const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
              const day = dateObj.getDate().toString().padStart(2, '0');
              scheduleStartDate = `${year}-${month}-${day}`;
            }
            if (scheduleEndDate && scheduleEndDate.includes('T')) {
              // Parse the date as UTC and convert to local time
              const dateObj = new Date(scheduleEndDate);
              // Get local date components
              const year = dateObj.getFullYear();
              const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
              const day = dateObj.getDate().toString().padStart(2, '0');
              scheduleEndDate = `${year}-${month}-${day}`;
            }

            const scheduleData = {
              startDate: scheduleStartDate,
              endDate: scheduleEndDate,
              startTime: scheduleStartTime,
              endTime: scheduleEndTime,
            };
            console.log("📋 Setting schedule:", scheduleData);
            setSubmissionSchedule(scheduleData);

            // Load questions
            loadQuestions(form.questions || []);

            // Load assigned recipients and restore selection
            if (form.assigned_recipients && form.assigned_recipients.length > 0) {
              // Store the loaded recipient IDs to be used after recipients list is loaded
              const assignedUserIds = new Set<number>(form.assigned_recipients.map((r: any) => r.user_id));
              setLoadedRecipientIds(assignedUserIds);
            }

            // Load shared instructors and restore selection
            if (form.shared_instructors && form.shared_instructors.length > 0) {
              const sharedInstructorIds = new Set<number>(form.shared_instructors.map((i: any) => i.user_id));
              setLoadedInstructorIds(sharedInstructorIds);
            }
          } else {
            toast.error("Failed to load form data");
          }
        } catch (error) {
          toast.error("Failed to load form data");
        }
      }
    };

    loadExistingForm();
  }, [formId]);

  // Restore selected recipients after recipients list is loaded
  useEffect(() => {
    if (loadedRecipientIds.size > 0 && recipients.length > 0) {
      // Filter the loaded recipient IDs to only include IDs that are in the current recipients list
      const validRecipientIds = new Set(
        Array.from(loadedRecipientIds).filter(id => 
          recipients.some(r => r.id === id)
        )
      );
      setSelectedRecipients(validRecipientIds);
      // Clear the loaded recipient IDs after setting
      setLoadedRecipientIds(new Set());
    }
  }, [recipients, loadedRecipientIds]);

  // Restore selected instructors after instructors list is loaded
  useEffect(() => {
    if (loadedInstructorIds.size > 0 && instructors.length > 0) {
      // Filter the loaded instructor IDs to only include IDs that are in the current instructors list
      const validInstructorIds = new Set(
        Array.from(loadedInstructorIds).filter(id => 
          instructors.some(i => i.id === id)
        )
      );
      setSelectedInstructors(validInstructorIds);
      // Clear the loaded instructor IDs after setting
      setLoadedInstructorIds(new Set());
    }
  }, [instructors, loadedInstructorIds]);

  // Render Question Preview
  const renderQuestionPreview = (question: FormQuestion) => {
    switch (question.type) {
      case "rating":
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-6 h-6 text-yellow-400 fill-yellow-400"
              />
            ))}
          </div>
        );
      case "multiple-choice":
        return (
          <div className="space-y-2">
            {question.options?.map((option, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                <span className="text-sm">{option}</span>
              </div>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div className="space-y-2">
            {question.options?.map((option, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-gray-300"></div>
                <span className="text-sm">{option}</span>
              </div>
            ))}
          </div>
        );
      case "dropdown":
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
          </Select>
        );
      case "linear-scale":
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">1</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <div
                  key={num}
                  className="w-8 h-8 border-2 border-gray-300 rounded flex items-center justify-center text-xs"
                >
                  {num}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500">10</span>
          </div>
        );
      case "text":
        return (
          <Input
            placeholder="Short answer text"
            disabled
            className="max-w-md"
          />
        );
      case "textarea":
        return <Textarea placeholder="Long answer text" rows={3} disabled />;
      default:
        return null;
    }
  };

  // Handle save form
  const handleSaveForm = async () => {
    const cleanedQuestions = cleanQuestions(questions);
    const success = await saveForm(cleanedQuestions);
    if (success) {
      setTimeout(() => {
        onBack();
      }, 1000);
    }
  };

  // Handle publish form
  const handlePublishForm = async () => {
    const cleanedQuestions = cleanQuestions(questions);
    const result = await publishForm(
      cleanedQuestions,
      selectedRecipients,
      recipients,
      selectedInstructors
    );

    if (result && result.success) {
      const currentFormId = result.formId;

      // Check if specific recipients are selected (not all recipients)
      const hasSpecificRecipients =
        selectedRecipients.size > 0 &&
        selectedRecipients.size < recipients.length;

      let deployResult;
      if (hasSpecificRecipients) {
        // Assign to specific users
        // Combine date and time for start and end dates
        const startDateTime = submissionSchedule.startDate && submissionSchedule.startTime
          ? `${submissionSchedule.startDate}T${submissionSchedule.startTime}:00`
          : submissionSchedule.startDate;
        const endDateTime = submissionSchedule.endDate && submissionSchedule.endTime
          ? `${submissionSchedule.endDate}T${submissionSchedule.endTime}:00`
          : submissionSchedule.endDate;

        console.log("📋 Assigning to specific users with schedule:", {
          submissionSchedule,
          startDateTime,
          endDateTime,
        });

        deployResult = await assignToUsers(
          currentFormId,
          Array.from(selectedRecipients),
          formTarget,
          submissionSchedule.startDate,
          submissionSchedule.endDate,
          submissionSchedule.startTime,
          submissionSchedule.endTime,
          selectedDepartment,
          selectedCourseYearSection
        );
      } else {
        // Deploy to group
        // Combine date and time for start and end dates
        console.log("📋 Before combining dates:", {
          submissionSchedule,
          hasStartDate: !!submissionSchedule.startDate,
          hasStartTime: !!submissionSchedule.startTime,
          hasEndDate: !!submissionSchedule.endDate,
          hasEndTime: !!submissionSchedule.endTime,
        });

        const startDateTime = submissionSchedule.startDate && submissionSchedule.startTime
          ? `${submissionSchedule.startDate}T${submissionSchedule.startTime}:00`
          : submissionSchedule.startDate;
        const endDateTime = submissionSchedule.endDate && submissionSchedule.endTime
          ? `${submissionSchedule.endDate}T${submissionSchedule.endTime}:00`
          : submissionSchedule.endDate;

        console.log("📋 Publishing form with schedule:", {
          submissionSchedule,
          startDateTime,
          endDateTime,
        });

        deployResult = await deployToGroup(
          currentFormId,
          formTarget,
          submissionSchedule.startDate,
          submissionSchedule.endDate,
          submissionSchedule.startTime,
          submissionSchedule.endTime,
          selectedDepartment,
          selectedCourseYearSection
        );
      }

      if (deployResult.success) {
        setPublishDialogOpen(false);
        setTimeout(() => {
          onBack();
        }, 1500);
      } else {
        toast.error(deployResult.message || "Failed to deploy form");
      }
    }
  };

  // Handle AI question generation
  const handleGenerateQuestions = async () => {
    if (!aiDescription.trim()) {
      toast.error("Please enter a description for the form's purpose");
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const response = await generateQuestionsWithAI(
        aiDescription,
        formCategory,
        formTarget
      );

      if (response.success && response.questions) {
        // Convert generated questions to FormQuestion format and add directly to form
        const newQuestions: FormQuestion[] = response.questions.map(
          (q, index) => ({
            id: `question-${Date.now()}-${index}`,
            type: q.type as any,
            question: q.question,
            description: q.description,
            required: q.required ?? true,
            options: q.options,
          })
        );

        // Add questions to the form
        newQuestions.forEach((q) => {
          addQuestion(q.type, q);
        });

        // Keep the AI description for reference
        toast.success(`Added ${newQuestions.length} questions to your form`);
      } else {
        toast.error(response.error || "Failed to generate questions");
      }
    } catch (error) {
      toast.error("An error occurred while generating questions");
      console.error(error);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Handle image file selection - opens cropper dialog
  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const { isValid, error } = validateImageFile(file);
      if (!isValid) {
        toast.error("Image upload failed", {
          description: error,
        });
        return;
      }
      setFileToCrop(file);
      setCropperDialogOpen(true);
    }
    // Reset the input
    event.target.value = '';
  };

  // Handle crop complete - upload cropped image
  const handleCropComplete = async (croppedImageDataUrl: string) => {
    try {
      // Convert data URL to File
      const response = await fetch(croppedImageDataUrl);
      const blob = await response.blob();
      const croppedFile = new File([blob], fileToCrop?.name || 'cropped-image.jpg', {
        type: 'image/jpeg',
      });

      // Upload cropped file to server using FormData
      const formData = new FormData();
      formData.append('image', croppedFile);
      formData.append('uploadType', 'forms');

      const token = localStorage.getItem('token') || sessionStorage.getItem('authToken');
      const uploadResponse = await fetch('http://localhost:5000/api/forms/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await uploadResponse.json();

      if (result.success) {
        setFormImage(result.imageUrl);
        toast.success("Image cropped and uploaded successfully");
      } else {
        toast.error("Image upload failed", {
          description: result.message || "Unknown error",
        });
      }
    } catch (error) {
      console.error('Error uploading cropped image:', error);
      toast.error("Image upload failed", {
        description: "Network error occurred",
      });
    } finally {
      setCropperDialogOpen(false);
      setFileToCrop(null);
    }
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setCropperDialogOpen(false);
    setFileToCrop(null);
  };

  return (
    //Form Builder Container background u 500
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-lime-500">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4 justify-between">
            {/* Left Section - Back and Title */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                onClick={onBack}
                className="hover:bg-green-50 shrink-0 h-8 w-8 sm:w-auto sm:h-9 p-0 sm:px-4"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="hidden sm:block h-8 w-px bg-gray-200" />
              <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                <h1 className="text-sm sm:text-lg truncate text-gray-700">
                  {loading ? "Saving..." : formTitle || "New Form"}
                </h1>
              </div>
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <>
                {!isPublished && (
                  <Dialog
                    open={saveDialogOpen}
                    onOpenChange={setSaveDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={loading}
                        size="sm"
                        className="h-8 w-8 sm:w-auto sm:h-9 p-0 sm:px-4"
                      >
                        <Save className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">
                          {loading ? "Saving..." : "Save"}
                        </span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Save as Draft</DialogTitle>
                        <DialogDescription>
                          Your form will be saved as a draft and you can continue
                          editing it later.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setSaveDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            setSaveDialogOpen(false);
                            handleSaveForm();
                          }}
                          disabled={loading}
                        >
                          {loading ? "Saving..." : "Save Draft"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                <Dialog
                  open={previewDialogOpen}
                  onOpenChange={setPreviewDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 sm:w-auto sm:h-9 p-0 sm:px-4"
                    >
                      <Eye className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Form View</DialogTitle>
                      <DialogDescription>
                        This is how respondents will see your feedback form
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      {/* Preview Form */}
                      <div className="bg-white rounded-lg border shadow-sm">
                        {/* Form Header */}
                        {formImage && (
                          <div className="w-full">
                            <EnhancedImage
                              src={formImage}
                              alt={formTitle || "Form header"}
                              className="w-full h-48 object-cover rounded-t-lg"
                            />
                          </div>
                        )}

                        <div className="p-6 space-y-6">
                          {/* Title and Description */}
                          <div className="space-y-3">
                            <h1 className="text-3xl">{formTitle}</h1>
                            {formDescription && (
                              <p className="text-gray-600">{formDescription}</p>
                            )}
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Badge variant="secondary">{formCategory}</Badge>
                            </div>
                          </div>

                          <Separator />

                          {/* Questions */}
                          <div className="space-y-6">
                            {questions.map((question, index) => (
                              <div key={question.id} className="space-y-3">
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500 shrink-0">
                                    {index + 1}.
                                  </span>
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-start gap-2">
                                      <Label className="text-base">
                                        {question.question}
                                        {question.required && (
                                          <span className="text-red-500 ml-1">
                                            *
                                          </span>
                                        )}
                                      </Label>
                                    </div>
                                    {question.description && (
                                      <p className="text-sm text-gray-500">
                                        {question.description}
                                      </p>
                                    )}

                                    {/* Question Input Based on Type */}
                                    <div className="pt-2">
                                      {question.type === "rating" && (
                                        <div className="flex gap-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                              key={star}
                                              className="w-8 h-8 text-gray-300 hover:text-yellow-400 cursor-pointer transition-colors"
                                            />
                                          ))}
                                        </div>
                                      )}

                                      {question.type === "multiple-choice" && (
                                        <div className="space-y-2">
                                          {question.options?.map(
                                            (option, i) => (
                                              <label
                                                key={i}
                                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                                              >
                                                <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                                                <span>{option}</span>
                                              </label>
                                            )
                                          )}
                                        </div>
                                      )}

                                      {question.type === "checkbox" && (
                                        <div className="space-y-2">
                                          {question.options?.map(
                                            (option, i) => (
                                              <label
                                                key={i}
                                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                                              >
                                                <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                                                <span>{option}</span>
                                              </label>
                                            )
                                          )}
                                        </div>
                                      )}

                                      {question.type === "dropdown" && (
                                        <Select disabled>
                                          <SelectTrigger className="w-full max-w-md">
                                            <SelectValue placeholder="Select an option" />
                                          </SelectTrigger>
                                        </Select>
                                      )}

                                      {question.type === "linear-scale" && (
                                        <div className="flex flex-col gap-3">
                                          <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                            <span className="text-sm text-gray-500 shrink-0">
                                              1
                                            </span>
                                            <div className="flex gap-2">
                                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                                                (num) => (
                                                  <button
                                                    key={num}
                                                    className="w-10 h-10 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-green-50 hover:border-green-400 transition-colors shrink-0"
                                                  >
                                                    {num}
                                                  </button>
                                                )
                                              )}
                                            </div>
                                            <span className="text-sm text-gray-500 shrink-0">
                                              10
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      {question.type === "text" && (
                                        <Input
                                          placeholder="Your answer"
                                          className="max-w-md"
                                        />
                                      )}

                                      {question.type === "textarea" && (
                                        <Textarea
                                          placeholder="Your answer"
                                          rows={4}
                                          className="resize-none"
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Submit Button Preview */}
                          <div className="flex justify-end pt-4 border-t">
                            <Button
                              className="bg-green-500 hover:bg-green-600"
                              disabled
                            >
                              Submit Feedback
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={publishDialogOpen}
                  onOpenChange={(open) => {
                    setPublishDialogOpen(open);
                    if (!open) {
                      // Delay reset to allow focus to be properly restored
                      setTimeout(() => {
                        resetWizard();
                      }, 100);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="bg-green-500 hover:bg-green-600 h-8 w-8 sm:w-auto sm:h-9 p-0 sm:px-4"
                      size="sm"
                      disabled={!formTitle.trim() || questions.length === 0}
                    >
                      <SendHorizontal className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">
                        {isPublished ? "Update" : "Publish"}
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-lg">
                        {isPublished
                          ? "Update Feedback Form"
                          : "Publish Feedback Form"}
                      </DialogTitle>
                      <DialogDescription>
                        {isPublished
                          ? "Review your changes before updating the form"
                          : "Configure your form settings before publishing"}
                      </DialogDescription>
                      {/* Wizard Progress */}
                      <div className="flex items-center justify-center space-x-4 py-4">
                        {Array.from(
                          { length: totalWizardSteps },
                          (_, i) => i + 1
                        ).map((step) => (
                          <div key={step} className="flex items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                step === currentWizardStep
                                  ? "bg-green-500 text-white"
                                  : step < currentWizardStep
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-200 text-gray-500"
                              }`}
                            >
                              {step}
                            </div>
                            {step < totalWizardSteps && (
                              <div
                                className={`w-12 h-0.5 mx-2 ${
                                  step < currentWizardStep
                                    ? "bg-green-500"
                                    : "bg-gray-200"
                                }`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Step Titles */}
                      <div className="text-center">
                        <h3 className="text-lg font-semibold">
                          {currentWizardStep === 1 && "Target Audience"}
                          {currentWizardStep === 2 && "Schedule (Optional)"}
                          {currentWizardStep === 3 && "Share Responses"}
                          {currentWizardStep === 4 && "Summary & Publish"}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {currentWizardStep === 1 &&
                            "Select who will receive this feedback form"}
                          {currentWizardStep === 2 &&
                            "Set when respondents can submit their feedback"}
                          {currentWizardStep === 3 &&
                            "Select instructors to share responses with"}
                          {currentWizardStep === 4 &&
                            "Review your settings and publish the form"}
                        </p>
                      </div>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Step 1: Target Audience */}
                      {currentWizardStep === 1 && (
                        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-blue-700">
                              <Target className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Target Audience
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 space-y-4">
                            {/* Main Audience Type Selection */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">
                                Select Respondents
                              </Label>
                              <Select
                                value={selectedAudienceType}
                                onValueChange={(value) => {
                                  setSelectedAudienceType(value);
                                  setSelectedDepartment("");
                                  setSelectedCourseYearSection("");
                                  setFormTarget(value);
                                }}
                              >
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="Select audience" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Students">Students</SelectItem>
                                  <SelectItem value="Instructors">
                                    Instructors
                                  </SelectItem>
                                  <SelectItem value="Alumni">Alumni</SelectItem>
                                  <SelectItem value="Employers">
                                    Employers
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Department Selection for Students */}
                            {selectedAudienceType === "Students" && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Department
                                </Label>
                                <Select
                                  value={selectedDepartment}
                                  onValueChange={(value) => {
                                    setSelectedDepartment(value);
                                    setSelectedCourseYearSection("");
                                  }}
                                >
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {loadingStudentDepartments ? (
                                      <SelectItem value="loading" disabled>
                                        Loading departments...
                                      </SelectItem>
                                    ) : studentDepartments.length > 0 ? (
                                      studentDepartments.map((dept) => (
                                        <SelectItem key={dept} value={dept}>
                                          {dept}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <>
                                        <SelectItem value="Senior High Department">
                                          Senior High Department
                                        </SelectItem>
                                        <SelectItem value="College Department">
                                          College Department
                                        </SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Course and Section Selection */}
                            {selectedAudienceType !== "All Users" && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  {selectedAudienceType === "Students" &&
                                    "Course and Section"}
                                  {selectedAudienceType === "Instructors" &&
                                    "Department"}
                                  {selectedAudienceType === "Alumni" && "Company"}
                                  {selectedAudienceType === "Employers" &&
                                    "Company"}
                                </Label>
                                <Select
                                  value={selectedCourseYearSection}
                                  onValueChange={(value) => {
                                    setSelectedCourseYearSection(value);
                                    setFormTarget(
                                      `${selectedAudienceType} - ${value}`
                                    );
                                  }}
                                >
                                  <SelectTrigger className="h-10">
                                    <SelectValue
                                      placeholder={
                                        selectedAudienceType === "Students"
                                          ? "Select course year section"
                                          : selectedAudienceType === "Instructors"
                                          ? "Select department"
                                          : "Select company"
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedAudienceType === "Students" &&
                                      courseYearSections
                                        .map((section) => (
                                          <SelectItem key={section} value={section}>
                                            {section}
                                          </SelectItem>
                                        ))}
                                    {selectedAudienceType === "Instructors" &&
                                      instructorDepartments.map((dept) => (
                                        <SelectItem key={dept} value={dept}>
                                          {dept}
                                        </SelectItem>
                                      ))}
                                    {selectedAudienceType === "Alumni" &&
                                      alumniCompanies.map((company) => (
                                        <SelectItem key={company} value={company}>
                                          {company}
                                        </SelectItem>
                                      ))}
                                    {selectedAudienceType === "Employers" &&
                                      employerCompanies.map((company) => (
                                        <SelectItem key={company} value={company}>
                                          {company}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Final Target Display */}
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                              <span className="text-sm text-blue-700 font-medium">
                                Final Target:
                              </span>
                              <span className="text-sm font-semibold text-blue-900">
                                {formTarget}
                              </span>
                            </div>

                            {/* Recipients Preview with Search */}
                            {selectedAudienceType !== "All Users" &&
                              ((selectedAudienceType === "Students" &&
                                selectedDepartment &&
                                selectedCourseYearSection) ||
                                (selectedAudienceType !== "Students" &&
                                  selectedCourseYearSection)) && (
                              <RecipientSelector
                                recipients={recipients}
                                filteredRecipients={filteredRecipients}
                                selectedRecipients={selectedRecipients}
                                selectAllRecipients={selectAllRecipients}
                                searchTerm={searchTerm}
                                onToggleRecipient={toggleRecipient}
                                onToggleAllRecipients={toggleAllRecipients}
                                onSearchTermChange={setSearchTerm}
                                formTarget={formTarget}
                              />
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Step 2: Schedule */}
                      {currentWizardStep === 2 && (
                        <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-purple-700">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Schedule
                              </span>
                              <span className="text-xs text-purple-600">
                                (Optional)
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">
                                  Start Date
                                </Label>
                                <Input
                                  type="date"
                                  value={submissionSchedule.startDate}
                                  onChange={(e) =>
                                    setSubmissionSchedule((prev) => ({
                                      ...prev,
                                      startDate: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">
                                  Start Time
                                </Label>
                                <Input
                                  type="time"
                                  value={submissionSchedule.startTime}
                                  onChange={(e) =>
                                    setSubmissionSchedule((prev) => ({
                                      ...prev,
                                      startTime: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">
                                  End Date
                                </Label>
                                <Input
                                  type="date"
                                  value={submissionSchedule.endDate}
                                  onChange={(e) =>
                                    setSubmissionSchedule((prev) => ({
                                      ...prev,
                                      endDate: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">
                                  End Time
                                </Label>
                                <Input
                                  type="time"
                                  value={submissionSchedule.endTime}
                                  onChange={(e) =>
                                    setSubmissionSchedule((prev) => ({
                                      ...prev,
                                      endTime: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-sm"
                                />
                              </div>
                            </div>
                          </CardContent>

                          {/* Schedule Preview */}
                          {(submissionSchedule.startDate ||
                            submissionSchedule.endDate) && (
                            <Card className="border-purple-200 bg-purple-50/50">
                              <CardContent className="py-3">
                                <div className="flex items-center gap-3">
                                  <Clock className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm font-medium text-purple-900">
                                      Schedule Active
                                    </p>
                                    <p className="text-sm text-purple-700">
                                      {submissionSchedule.startDate &&
                                      submissionSchedule.endDate
                                        ? `From ${new Date(
                                            submissionSchedule.startDate +
                                              "T" +
                                              (submissionSchedule.startTime ||
                                                "00:00")
                                          ).toLocaleString()} to ${new Date(
                                            submissionSchedule.endDate +
                                              "T" +
                                              (submissionSchedule.endTime ||
                                                "23:59")
                                          ).toLocaleString()}`
                                        : submissionSchedule.startDate
                                        ? `Opens ${new Date(
                                            submissionSchedule.startDate +
                                              "T" +
                                              (submissionSchedule.startTime ||
                                                "00:00")
                                          ).toLocaleString()}`
                                        : `Closes ${new Date(
                                            submissionSchedule.endDate +
                                              "T" +
                                              (submissionSchedule.endTime ||
                                                "23:59")
                                          ).toLocaleString()}`}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Card>
                      )}

                      {/* Step 3: Share Responses */}
                      {currentWizardStep === 3 && (
                        <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-yellow-50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-orange-700">
                              <SendHorizontal className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Share Responses
                              </span>
                              <span className="text-xs text-orange-600">
                                (Optional)
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 space-y-4">
                            <div className="space-y-3">
                              <Label className="text-sm font-medium">
                                Select Instructors to Share Responses With
                              </Label>
                              <p className="text-xs text-gray-600">
                                Choose instructors who will receive access to view
                                the responses for this feedback form. This is
                                particularly useful for forms about subjects or
                                instructors.
                              </p>

                              {/* Search Bar */}
                              <div className="space-y-2">
                                <Input
                                  placeholder="Search instructors by name..."
                                  className="h-9"
                                  value={instructorSearchTerm}
                                  onChange={(e) =>
                                    setInstructorSearchTerm(e.target.value)
                                  }
                                />
                              </div>

                              {/* Instructors List */}
                              <div className="border rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
                                {instructors.length > 0 ? (
                                  <div className="space-y-2">
                                    {filteredInstructors.map((instructor) => (
                                      <div
                                        key={instructor.id}
                                        className="flex items-center gap-2"
                                      >
                                        <Checkbox
                                          id={`instructor-${instructor.id}`}
                                          checked={selectedInstructors.has(
                                            instructor.id
                                          )}
                                          onCheckedChange={() =>
                                            toggleInstructor(instructor.id)
                                          }
                                        />
                                        <Label
                                          htmlFor={`instructor-${instructor.id}`}
                                          className="text-sm flex-1"
                                        >
                                          {instructor.fullName}{" "}
                                          <span className="text-gray-500">
                                            ({instructor.department})
                                          </span>
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500">
                                    No instructors found.
                                  </p>
                                )}
                              </div>

                              {/* Selection Summary */}
                              {selectedInstructors.size > 0 && (
                                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border">
                                  <span className="text-sm text-orange-700 font-medium">
                                    Selected Instructors:
                                  </span>
                                  <span className="text-sm font-semibold text-orange-900">
                                    {selectedInstructors.size} instructor
                                    {selectedInstructors.size !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Step 4: Summary */}
                      {currentWizardStep === 4 && (
                        <Card className="border-green-100 bg-gradient-to-br from-green-50 to-lime-50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2 text-green-700">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Form Summary
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <h3 className="text-base font-semibold">
                                {formTitle}
                              </h3>
                              {formDescription && (
                                <p className="text-sm text-gray-600">
                                  {formDescription}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-4">
                                <span>
                                  <span className="text-gray-500">Category:</span>{" "}
                                  <span className="font-medium">
                                    {formCategory}
                                  </span>
                                </span>
                                <span>
                                  <span className="text-gray-500">
                                    Questions:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {questions.length}
                                  </span>
                                </span>
                                <span>
                                  <span className="text-gray-500">Target:</span>{" "}
                                  <span className="font-medium">
                                    {formTarget}
                                  </span>
                                </span>
                                {selectedInstructors.size > 0 && (
                                  <span>
                                    <span className="text-gray-500">
                                      Shared with:
                                    </span>{" "}
                                    <span className="font-medium">
                                      {selectedInstructors.size} instructor
                                      {selectedInstructors.size !== 1 ? "s" : ""}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Wizard Navigation */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex-1">
                          {currentWizardStep === 1 &&
                            (!formTarget ||
                              !formTitle.trim() ||
                              questions.length === 0) && (
                              <div className="text-sm text-red-600 space-y-1">
                                {!formTitle.trim() && (
                                  <p>• Please enter a form title</p>
                                )}
                                {questions.length === 0 && (
                                  <p>• Please add at least one question</p>
                                )}
                                {!formTarget && (
                                  <p>• Please select a target audience</p>
                                )}
                              </div>
                            )}
                          {currentWizardStep === 1 &&
                            formTarget &&
                            formTitle.trim() &&
                            questions.length > 0 && (
                              <p className="text-sm text-blue-900">
                                <strong>Ready to proceed!</strong> Target
                                audience configured.
                              </p>
                            )}
                          {currentWizardStep === 2 && (
                            <p className="text-sm text-purple-900">
                              <strong>Optional:</strong> Set submission
                              schedule or proceed to summary.
                            </p>
                          )}
                          {currentWizardStep === 3 && (
                            <p className="text-sm text-orange-900">
                              <strong>Optional:</strong> Select instructors
                              to share responses with or proceed to summary.
                            </p>
                          )}
                          {currentWizardStep === 4 && (
                            <p className="text-sm text-green-900">
                              <strong>
                                {isPublished
                                  ? "Ready to update!"
                                  : "Ready to publish!"}
                              </strong>{" "}
                              Review your settings and publish the form.
                            </p>
                          )}
                        </div>
                        <div className="flex gap-3 ml-4">
                          {currentWizardStep > 1 && (
                            <Button
                              variant="outline"
                              onClick={prevWizardStep}
                            >
                              Previous
                            </Button>
                          )}
                          {currentWizardStep < totalWizardSteps ? (
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={nextWizardStep}
                              disabled={
                                currentWizardStep === 1 &&
                                (!formTarget ||
                                  !formTitle.trim() ||
                                  questions.length === 0)
                              }
                            >
                              Next
                            </Button>
                          ) : (
                            <Button
                              className="bg-green-600 hover:bg-green-700"
                              onClick={handlePublishForm}
                              disabled={
                                loading ||
                                !formTarget ||
                                !formTitle.trim() ||
                                questions.length === 0
                              }
                            >
                              {loading
                                ? "Saving..."
                                : isPublished
                                ? "Update Now"
                                : "Publish Now"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Form Settings Section */}
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <Card className="border-green-200 shadow-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-green-600" />
                      <CardTitle>Form Settings</CardTitle>
                    </div>
                    {settingsOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6 pt-6">
                  {/* Form Title */}
                  <div className="space-y-2">
                    <Label>Form Title *</Label>
                    <Input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Name your feedback form"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Form Description</Label>
                    <Textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Describe your form (optional)"
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* AI Question Generation */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                       
                    Detailed Description
                    </Label>
                    <p className="text-xs text-gray-500">
                      Describe the purpose of your form and let AI generate relevant questions
                    </p>
                    <Textarea
                      value={aiDescription}
                      onChange={(e) => setAiDescription(e.target.value)}
                      placeholder="Describe the purpose of your form"
                      rows={3}
                      className="resize-none"
                    />
                    <Button
                      onClick={handleGenerateQuestions}
                      disabled={isGeneratingQuestions || !aiDescription.trim()}
                      className="px-8"
                    >
                      {isGeneratingQuestions ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Questions...
                        </>
                      ) : (
                        <>
                         
                          Save
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Form Image */}
                  <div className="space-y-2">
                    <Label>Form Image (Optional)</Label>
                    <p className="text-xs text-gray-500">
                      Add a header image to personalize your feedback form
                    </p>
                    <p className="text-xs text-gray-400">
                      Accepted formats: JPEG, PNG, GIF, WebP (max 5MB)
                    </p>

                    {!formImage ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 transition-colors">
                        <label
                          htmlFor="form-image-upload"
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col items-center justify-center py-8 px-4">
                            <Upload className="w-10 h-10 text-gray-400 mb-2" />
                            <p className="text-sm">
                              <span className="text-green-600">
                                Click to upload
                              </span>{" "}
                              or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              JPEG, PNG, GIF, WebP • Max 500KB
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Recommended: 800×200px for best display
                            </p>
                            <p className="text-xs text-green-600 mt-2">
                              ✨ You can crop your image after uploading
                            </p>
                          </div>
                          <input
                            id="form-image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageFileSelect}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="relative rounded-lg overflow-hidden border-2 border-green-200">
                        <EnhancedImage
                          src={formImage}
                          alt="Form header"
                          className="w-full h-48 object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={removeImage}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Category</Label>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-lg">
                              Manage Categories
                            </DialogTitle>
                            <DialogDescription>
                              Add or remove form categories
                            </DialogDescription>
                          </DialogHeader>
                          <CategoryManager
                            categories={databaseCategories}
                            customCategories={customCategories}
                            loadingCategoryOperation={loadingCategoryOperation}
                            onAddCategory={addCategory}
                            onRemoveCategory={removeCategory}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Select
                      value={formCategory}
                      onValueChange={setFormCategory}
                      disabled={loadingCategories}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {customCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Form Header Preview */}
          <Card className="border-green-200 shadow-sm">
            <CardContent className="pt-6">
              {formImage && (
                <div className="mb-6 -mt-6 -mx-6">
                  <img
                    src={formImage}
                    alt="Form header"
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                </div>
              )}
              <div className="space-y-2">
                <h1 className="text-3xl">{formTitle}</h1>
                {formDescription && (
                  <p className="text-gray-600">{formDescription}</p>
                )}
                <div className="flex gap-2 pt-2 flex-wrap">
                  <Badge variant="secondary">{formCategory}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          {questions.length === 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6 text-center">
                <p className="text-gray-600">
                  No questions yet. Add your first question below.
                </p>
              </CardContent>
            </Card>
          )}
          {questions.map((question, index) => (
            <Card
              key={question.id}
              className={`transition-all ${
                activeQuestion === question.id
                  ? "border-green-500 border-2 shadow-md"
                  : "border-gray-200"
              }`}
              onClick={() => setActiveQuestion(question.id)}
            >
              <QuestionCard
                question={question}
                index={index}
                isActive={activeQuestion === question.id}
                questionTypes={questionTypes}
                onUpdate={updateQuestion}
                onDelete={deleteQuestion}
                onDuplicate={duplicateQuestion}
                onMove={moveQuestion}
                onAddOption={addOption}
                onUpdateOption={updateOption}
                onDeleteOption={deleteOption}
                onSetActive={setActiveQuestion}
              />
            </Card>
          ))}

          {/* Add Question Button */}
          <Card className="border-dashed border-2 border-gray-300 hover:border-green-400 transition-colors cursor-pointer bg-white/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {questionTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.value}
                        variant="outline"
                        onClick={() => addQuestion(type.value)}
                        className="hover:bg-green-50 hover:border-green-400"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {type.label}
                      </Button>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-500">
                  Click a question type to add it to your form
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Cropper Dialog */}
      <Dialog open={cropperDialogOpen} onOpenChange={setCropperDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
            <DialogDescription>
              Adjust the crop box to select the part of the image you want to use. Drag the box to move it, or drag the handles to resize it.
            </DialogDescription>
          </DialogHeader>
          {fileToCrop && (
            <ImageCropper
              imageFile={fileToCrop}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
              aspectRatio={4}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
