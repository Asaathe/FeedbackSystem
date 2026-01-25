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
import { Switch } from "../ui/switch";
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Save,
  ArrowLeft,
  FileText,
  Target,
  CheckSquare,
  Upload,
  X,
  Settings,
  Copy,
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
import {
  getForms,
  getForm,
  createForm,
  updateForm,
  deleteForm,
  duplicateForm,
  getFormTemplates,
  getFilteredUsers,
  getFormCategories,
  addFormCategory,
  updateFormCategory,
  deleteFormCategory,
  assignFormToUsers,
  deployForm,
  getAlumniCompanies,
  getEmployerCompanies,
} from "../../services/formManagementService";
import { isAuthenticated, getUserRole } from "../../utils/auth";
import { Checkbox } from "../ui/checkbox";
import { EnhancedImage, validateImageFile } from "../../utils/imageUtils";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

interface FormQuestion {
  id: string;
  type:
    | "multiple-choice"
    | "rating"
    | "text"
    | "textarea"
    | "checkbox"
    | "dropdown"
    | "linear-scale";
  question: string;
  description?: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

interface FormBuilderProps {
  onBack: () => void;
  formId?: string;
  isCustomFormTab?: boolean;
}

const questionTypes = [
  { value: "text", label: "Short Text", icon: Type },
  { value: "textarea", label: "Long Text", icon: AlignLeft },
  { value: "multiple-choice", label: "Multiple Choice", icon: CheckCircle2 },
  { value: "checkbox", label: "Checkboxes", icon: CheckSquare },
  { value: "dropdown", label: "Dropdown", icon: List },
  { value: "rating", label: "Star Rating", icon: Star },
  { value: "linear-scale", label: "Linear Scale", icon: Sliders },
];

export function FormBuilder({
  onBack,
  formId,
  isCustomFormTab,
}: FormBuilderProps) {
  // Form Settings State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formTarget, setFormTarget] = useState<string>("All Users");
  const [formImage, setFormImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  // Dynamic Categories and Audiences State
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [databaseCategories, setDatabaseCategories] = useState<
    { id: number; name: string; description?: string }[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [loadingCategoryOperation, setLoadingCategoryOperation] =
    useState<boolean>(false);
  const [customAudiences, setCustomAudiences] = useState<string[]>([
    "Students",
    "Instructors",
    "Alumni",
    "Employers",
  ]);

  // Course Year Section options from signup page (Students)
  const [courseYearSections, setCourseYearSections] = useState<string[]>([
    "All Students",
    // Grade 11
    "ABM11-LOVE", "ABM11-HOPE", "ABM11-FAITH",
    "HUMSS11-LOVE", "HUMSS11-HOPE", "HUMSS11-FAITH", "HUMSS11-JOY", "HUMSS11-GENEROSITY", "HUMSS11-HUMILITY", "HUMSS11-INTEGRITY", "HUMSS11-WISDOM",
    "STEM11-HOPE", "STEM11-FAITH", "STEM11-JOY", "STEM11-GENEROSITY",
    "ICT11-LOVE", "ICT11-HOPE",
    // Grade 12
    "ABM12-LOVE", "ABM12-HOPE", "ABM12-FAITH",
    "HUMSS12-LOVE", "HUMSS12-HOPE", "HUMSS12-FAITH", "HUMSS12-JOY", "HUMSS12-GENEROSITY", "HUMSS12-HUMILITY",
    "STEM12-LOVE", "STEM12-HOPE", "STEM12-FAITH", "STEM12-JOY", "STEM12-GENEROSITY",
    "ICT12-LOVE", "ICT12-HOPE",
    // College - BSIT
    "BSIT-1A", "BSIT-1B", "BSIT-1C", "BSIT-2A", "BSIT-2B", "BSIT-2C", "BSIT-3A", "BSIT-3B", "BSIT-3C", "BSIT-4A", "BSIT-4B", "BSIT-4C",
    // College - BSBA
    "BSBA-1A", "BSBA-2A", "BSBA-3A", "BSBA-4A",
    // College - BSCS
    "BSCS-1A", "BSCS-2A", "BSCS-3A", "BSCS-4A",
    // College - BSEN
    "BSEN-1A", "BSEN-2A", "BSEN-3A", "BSEN-4A",
    // College - BSOA
    "BSOA-1A", "BSOA-2A", "BSOA-3A", "BSOA-4A",
    // College - BSAIS
    "BSAIS-1A", "BSAIS-2A", "BSAIS-3A", "BSAIS-4A",
    // College - BTVTEd
    "BTVTEd-1A", "BTVTEd-2A", "BTVTEd-3A", "BTVTEd-4A",
  ]);

  // Current selected audience type and course year section
  const [selectedAudienceType, setSelectedAudienceType] =
    useState<string>("All Users");
  const [selectedCourseYearSection, setSelectedCourseYearSection] = useState<string>("");

  // Dynamic audience options based on user type
  const [instructorDepartments, setInstructorDepartments] = useState<string[]>([
    "Senior High Department",
    "College Department",
  ]);
  const [alumniCompanies, setAlumniCompanies] = useState<string[]>([]);
  const [employerCompanies, setEmployerCompanies] = useState<string[]>([]);

  // Recipients management
  const [recipients, setRecipients] = useState<
    Array<{ id: number; name: string; details: string }>
  >([]);
  const [filteredRecipients, setFilteredRecipients] = useState<
    Array<{ id: number; name: string; details: string }>
  >([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<number>>(
    new Set()
  );
  const [selectAllRecipients, setSelectAllRecipients] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Submission Schedule State
  const [submissionSchedule, setSubmissionSchedule] = useState({
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  });

  // Questions State
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  // Load existing form data when formId is provided
  useEffect(() => {
    const loadExistingForm = async () => {
      if (formId) {
        console.log("🔄 Loading existing form with ID:", formId);
        try {
          // First check localStorage for unsaved changes
          const savedFormData = localStorage.getItem(`form_${formId}`);
          console.log("📦 LocalStorage data found:", !!savedFormData);
          if (savedFormData) {
            console.log("📦 Loading from localStorage");
            const formData = JSON.parse(savedFormData);
            setFormTitle(formData.title || "");
            setFormDescription(formData.description || "");
            setFormCategory(formData.category || "Academic");
            setFormTarget(formData.target || "All Users");
            setFormImage(formData.image || null);
            setCustomCategories(formData.customCategories || []);
            setCustomAudiences(
              formData.customAudiences || [
                "All Users",
                "Students",
                "Alumni",
                "Instructors",
              ]
            );
            setSubmissionSchedule(
              formData.submissionSchedule || {
                startDate: "",
                endDate: "",
                startTime: "",
                endTime: "",
              }
            );
            setQuestions(formData.questions || []);
            setActiveQuestion(formData.questions?.[0]?.id || null);
            console.log("✅ Form loaded from localStorage");
          } else {
            // Load from API if no localStorage data
            console.log("🌐 Loading from API");
            const result = await getForm(formId);
            console.log("📡 API result:", result);
            if (result.success && result.form) {
              const form = result.form;
              console.log("📋 Form data:", form);
              setFormTitle(form.title || "");
              setFormDescription(form.description || "");
              setFormCategory(form.category || "Academic");
              setFormTarget(form.target_audience || "All Users");
              setFormImage(form.image_url || null);
              setIsPublished(form.status === "active");

              // Parse target_audience to set audience selection fields
              const target = form.target_audience || "All Users";
              if (target === "All Users") {
                setSelectedAudienceType("All Users");
                setSelectedCourseYearSection("");
              } else if (target.includes(" - ")) {
                const [audienceType, courseYearSection] = target.split(" - ");
                setSelectedAudienceType(audienceType);
                setSelectedCourseYearSection(courseYearSection);
              } else {
                setSelectedAudienceType(target);
                setSelectedCourseYearSection("");
              }

              // Load submission schedule if available
              console.log("Loading schedule from form:", {
                start_date: form.start_date,
                end_date: form.end_date,
                status: form.status
              });
              setSubmissionSchedule({
                startDate: form.start_date || "",
                endDate: form.end_date || "",
                startTime: "",
                endTime: "",
              });
              console.log("Set submissionSchedule to:", {
                startDate: form.start_date || "",
                endDate: form.end_date || "",
              });

              // Convert API questions to FormQuestion format
              if (form.questions && form.questions.length > 0) {
                const apiQuestions = form.questions.map(
                  (q: any, index: number) => ({
                    id: q.id?.toString() || `q_${index + 1}`,
                    type: q.question_type || q.type || "text",
                    question: q.question_text || q.question || "",
                    description: q.description || "",
                    required: q.required || false,
                    options: q.options
                      ? q.options.map((opt: any) => opt.option_text).filter((opt: string) => opt && opt.trim() !== '')
                      : undefined,
                    min: q.min_value,
                    max: q.max_value,
                  })
                );
                setQuestions(apiQuestions);
                setActiveQuestion(apiQuestions[0]?.id || null);
              } else {
                // No questions found
                setQuestions([]);
                setActiveQuestion(null);
              }
              console.log("✅ Form loaded from API");
            } else {
              console.error("❌ API call failed:", result.message);
              toast.error("Failed to load form data");
            }
          }
        } catch (error) {
          console.error("💥 Exception loading form data:", error);
          toast.error("Failed to load form data");
        }
      }
    };

    loadExistingForm();
  }, [formId]);

  // Load categories from database
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const result = await getFormCategories();

        if (result.success && result.categories.length > 0) {
          setDatabaseCategories(result.categories);
          setCustomCategories(result.categories.map((cat) => cat.name));

          // Set default category if not already set
          if (!formCategory && result.categories.length > 0) {
            setFormCategory(result.categories[0].name);
          }
        } else {
          // No categories in database
          setCustomCategories([]);
          setDatabaseCategories([]);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        toast.error("Failed to load categories");

        // No fallback categories on error
        setCustomCategories([]);
        setDatabaseCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);
  // Load companies for alumni and employers
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const alumniResult = await getAlumniCompanies();
        if (alumniResult.success) {
          setAlumniCompanies(alumniResult.companies || []);
        }
        const employerResult = await getEmployerCompanies();
        if (employerResult.success) {
          setEmployerCompanies(employerResult.companies || []);
        }
      } catch (error) {
        console.error("Error loading companies:", error);
      }
    };
    loadCompanies();
  }, []);

  // Dialog States
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Loading State
  const [loading, setLoading] = useState(false);

  // Image Upload Handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const { isValid, error } = validateImageFile(file);
      if (!isValid) {
        toast.error("Image upload failed", {
          description: error,
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success("Image uploaded successfully");
    }
  };

  const removeImage = () => {
    setFormImage(null);
    setImageFile(null);
    toast.success("Image removed");
  };

  // Category and Audience Management
  const addCategory = async (category: string) => {
    if (category.trim() && !customCategories.includes(category.trim())) {
      try {
        setLoadingCategoryOperation(true);
        const result = await addFormCategory(category.trim(), "");
        if (result.success && result.category) {
          setDatabaseCategories([...databaseCategories, result.category]);
          setCustomCategories([...customCategories, result.category.name]);
          toast.success(`Category "${category.trim()}" added`);
        } else {
          toast.error(result.message || "Failed to add category");
        }
      } catch (error) {
        console.error("Error adding category:", error);
        toast.error("Failed to add category");
      } finally {
        setLoadingCategoryOperation(false);
      }
    }
  };

  const removeCategory = async (category: string) => {
    const categoryToDelete = databaseCategories.find(
      (cat) => cat.name === category
    );
    if (categoryToDelete) {
      try {
        setLoadingCategoryOperation(true);
        const result = await deleteFormCategory(categoryToDelete.id);
        if (result.success) {
          setDatabaseCategories(
            databaseCategories.filter((cat) => cat.id !== categoryToDelete.id)
          );
          setCustomCategories(customCategories.filter((c) => c !== category));
          if (formCategory === category) {
            const remaining = customCategories.filter((c) => c !== category);
            setFormCategory(remaining.length > 0 ? remaining[0] : "");
          }
          toast.success(`Category "${category}" removed`);
        } else {
          toast.error(result.message || "Failed to remove category");
        }
      } catch (error) {
        console.error("Error removing category:", error);
        toast.error("Failed to remove category");
      } finally {
        setLoadingCategoryOperation(false);
      }
    } else {
      toast.error("Category not found");
    }
  };

  // Question Management
  const addQuestion = (type: FormQuestion["type"] = "text") => {
    const newQuestion: FormQuestion = {
      id: Date.now().toString(),
      type: type,
      question: "",
      required: false,
      ...(type === "multiple-choice" ||
      type === "checkbox" ||
      type === "dropdown"
        ? { options: [""] }
        : {}),
    };
    setQuestions([...questions, newQuestion]);
    setActiveQuestion(newQuestion.id);
    toast.success(`Added ${type} question`);
  };

  const duplicateQuestion = (id: string) => {
    const question = questions.find((q) => q.id === id);
    if (question) {
      const newQuestion = {
        ...question,
        id: Date.now().toString(),
        question: question.question + " (Copy)",
        options: question.options ? [...question.options] : undefined,
      };
      const index = questions.findIndex((q) => q.id === id);
      const newQuestions = [...questions];
      newQuestions.splice(index + 1, 0, newQuestion);
      setQuestions(newQuestions);
      setActiveQuestion(newQuestion.id);
      toast.success("Question duplicated");
    }
  };

  const updateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
    setActiveQuestion(null);
    toast.success("Question deleted");
  };

  const moveQuestion = (id: string, direction: "up" | "down") => {
    const index = questions.findIndex((q) => q.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    ) {
      return;
    }
    const newQuestions = [...questions];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[newIndex]] = [
      newQuestions[newIndex],
      newQuestions[index],
    ];
    setQuestions(newQuestions);
  };

  const addOption = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      const optionNumber = (question.options?.length || 0) + 1;
      const newOptions = [
        ...(question.options || []),
        `Option ${optionNumber}`,
      ];
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string
  ) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const deleteOption = (questionId: string, optionIndex: number) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.options && question.options.length > 1) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const saveForm = async () => {
    // Validate required fields
    if (!formTitle.trim()) {
      toast.error("Please enter a form title");
      return;
    }
    if (!formCategory) {
      toast.error("Please select a category");
      return;
    }
    if (!formTarget || formTarget === "") {
      toast.error("Please select a target audience");
      return;
    }

    try {
      setLoading(true);

      // Clean questions data before sending
      const cleanedQuestions = questions.map(q => ({
        ...q,
        options: q.options && q.options.filter(opt => opt && opt.trim() !== '') || undefined
      }));

      const formData = {
        title: formTitle,
        description: formDescription,
        category: formCategory,
        targetAudience: formTarget,
        questions: cleanedQuestions,
        question_count: cleanedQuestions.length,
        total_questions: cleanedQuestions.length,
        questions_count: cleanedQuestions.length,
        imageUrl: formImage || undefined,
        isTemplate: false,
        status: "draft",
      };

      console.log("Saving form with data:", formData);
      console.log("Image URL being saved:", formData.imageUrl);
      const result = formId
        ? await updateForm(formId, formData)
        : await createForm(formData);

      if (result.success) {
        toast.success(formId ? "Form saved as draft" : "Form saved as draft");
        setTimeout(() => {
          onBack();
        }, 1000);
      } else {
        toast.error(result.message || "Failed to save form");
      }
    } catch (err) {
      console.error("Error saving form:", err);
      toast.error("Failed to save form");
    } finally {
      setLoading(false);
    }
  };

  // Publish Form Function
  const publishForm = async () => {
    // Validate required fields
    if (!formTitle.trim()) {
      toast.error("Please enter a form title");
      return;
    }
    if (!formCategory) {
      toast.error("Please select a category");
      return;
    }
    if (!formTarget || formTarget === "") {
      toast.error("Please select a target audience");
      return;
    }

    if (questions.length === 0) {
      toast.error("Please add at least one question to your form");
      return;
    }

    // Validate questions
    for (const q of questions) {
      if (!q.question.trim()) {
        toast.error("All questions must have text");
        return;
      }
      if (!q.type) {
        toast.error("All questions must have a type");
        return;
      }
    }

    try {
      setLoading(true);

     // ALWAYS include questions when publishing
const formData = {
  title: formTitle,
  description: formDescription,
  category: formCategory,
  targetAudience: formTarget,
  startDate: submissionSchedule.startDate || undefined,
  endDate: submissionSchedule.endDate || undefined,
  questions: questions,
  question_count: questions.length,
  total_questions: questions.length,
  questions_count: questions.length,
  imageUrl: formImage || undefined,
  isTemplate: false,
  status: "active", // Set to active when publishing
};

      const saveResult = formId
        ? await updateForm(formId, formData)
        : await createForm(formData);

      if (!saveResult.success) {
        toast.error(saveResult.message || "Failed to save form");
        return;
      }

      const currentFormId = formId || (saveResult as any).formId;

      if (!currentFormId) {
        toast.error("Failed to get form ID");
        return;
      }

      // Check if specific recipients are selected (not all recipients)
      const hasSpecificRecipients = selectedRecipients.size > 0 && selectedRecipients.size < recipients.length;

      let result;
      if (hasSpecificRecipients) {
        // Assign to specific users
        const selectedUserIds = Array.from(selectedRecipients).map(id => parseInt(id.toString()));
        result = await assignFormToUsers(currentFormId, selectedUserIds, formTarget);
      } else {
        // Deploy to group
        result = await deployForm(currentFormId, {
          startDate: submissionSchedule.startDate || new Date().toISOString().split('T')[0],
          endDate: submissionSchedule.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          targetFilters: {
            roles: formTarget === 'All Users' ? ['all'] : [formTarget.toLowerCase().replace(' ', '')],
            target_audience: formTarget
          }
        });
      }

      if (result.success) {
        toast.success(result.message);
        setPublishDialogOpen(false);
        setTimeout(() => {
          onBack();
        }, 1500);
      } else {
        toast.error(result.message || 'Failed to deploy form');
      }
    } catch (err) {
      console.error("Error publishing form:", err);
      toast.error("Failed to publish form");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch recipients based on selection
  const fetchRecipients = async (
    audienceType: string,
    courseYearSection: string
  ) => {
    try {
      // Map audience type to the correct role format for the backend
      const roleMap: Record<string, string> = {
        "Students": "student",
        "Instructors": "instructor",
        "Alumni": "alumni",
        "All Users": "all"
      };

      let filters: any = { role: roleMap[audienceType] || audienceType.toLowerCase() };

      if (audienceType === "Students") {
        if (courseYearSection && courseYearSection !== "All Students") {
          filters.course_year_section = courseYearSection;
        }
      } else if (audienceType === "Instructors") {
        if (courseYearSection) {
          filters.department = courseYearSection;
        }
      } else if (audienceType === "Alumni") {
        if (courseYearSection) {
          filters.company = courseYearSection;
        }
      }

      // Update formTarget based on the selection
      if (audienceType === "All Users") {
        setFormTarget("All Users");
      } else if (courseYearSection) {
        setFormTarget(`${audienceType} - ${courseYearSection}`);
      } else {
        setFormTarget(audienceType);
      }

      console.log("Fetching recipients with filters:", filters);
      const result = await getFilteredUsers(filters);
      console.log("API response:", result);
      if (result.success && result.users && result.users.length > 0) {
        const formattedUsers = result.users.map((user) => ({
          id: user.id,
          name: user.name,
          details:
            user.role === "student"
              ? user.course_yr_section || "No section"
              : user.role === "instructor"
              ? user.department || "No department"
              : user.role === "alumni"
              ? user.company || "No company"
              : "N/A",
        }));

        console.log("Formatted users:", formattedUsers);
        setRecipients(formattedUsers);
        setFilteredRecipients(formattedUsers);
        setSelectedRecipients(new Set(formattedUsers.map((u) => u.id)));
        setSelectAllRecipients(true);
      } else {
        console.warn(
          "No users found matching the criteria:",
          filters,
          "Response:",
          result
        );
        console.warn(
          "Note: Ensure the backend API is querying the correct table based on the user role."
        );
        console.warn(
          "For students, it should query the 'students' table and join with the 'users' table."
        );

        // Clear recipients when no users are found
        setRecipients([]);
        setFilteredRecipients([]);
        setSelectedRecipients(new Set());
        setSelectAllRecipients(true);
      }
    } catch (error) {
      console.error("Error fetching recipients:", error);
      setRecipients([]);
      setFilteredRecipients([]);
      setSelectedRecipients(new Set());
      setSelectAllRecipients(true);
    }
  };

  // Effect to fetch recipients when selection changes
  useEffect(() => {
    if (selectedAudienceType !== "All Users" && selectedCourseYearSection) {
      fetchRecipients(selectedAudienceType, selectedCourseYearSection);
    } else if (selectedAudienceType !== "All Users" && !selectedCourseYearSection) {
      // Clear recipients when course/year/section is not selected
      setRecipients([]);
      setFilteredRecipients([]);
      setSelectedRecipients(new Set());
      setSelectAllRecipients(true);
    } else if (selectedAudienceType === "All Users") {
      setFormTarget("All Users");
    }
  }, [selectedAudienceType, selectedCourseYearSection]);

  // Effect to filter recipients based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRecipients(recipients);
    } else {
      const filtered = recipients.filter((recipient) =>
        recipient.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRecipients(filtered);
    }
  }, [searchTerm, recipients]);


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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-lime-50">
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
                          Your form will be saved as a draft and you can continue editing it later.
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
                            saveForm();
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
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                                              {[
                                                1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
                                              ].map((num) => (
                                                <button
                                                  key={num}
                                                  className="w-10 h-10 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-green-50 hover:border-green-400 transition-colors shrink-0"
                                                >
                                                  {num}
                                                </button>
                                              ))}
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
                  onOpenChange={setPublishDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="bg-green-500 hover:bg-green-600 h-8 w-8 sm:w-auto sm:h-9 p-0 sm:px-4"
                      size="sm"
                      disabled={!formTitle.trim() || questions.length === 0}
                    >
                      <SendHorizontal className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">{isPublished ? "Update" : "Publish"}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{isPublished ? "Update Feedback Form" : "Publish Feedback Form"}</DialogTitle>
                      <DialogDescription>
                        {isPublished ? "Review your changes before updating the form" : "Review your form before publishing"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      {/* Configuration Grid */}
                      <div className="grid grid-cols-1 gap-4">
                        {/* Target Audience Card */}
                        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-blue-700">
                                <Target className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  Target Audience
                                </span>
                              </div>
                              <div>
                                <span className="text-sm font-medium">
                                  Target Audience
                                </span>
                              </div>
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
                                  setSelectedCourseYearSection("");
                                  setFormTarget(value);
                                }}
                              >
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="Select audience" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Students">
                                    Students
                                  </SelectItem>
                                  <SelectItem value="Instructors">
                                    Instructors
                                  </SelectItem>
                                  <SelectItem value="Alumni">Alumni</SelectItem>
                                  <SelectItem value="Employers">Employers</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Course Year Section Selection */}
                            {selectedAudienceType !== "All Users" && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  {selectedAudienceType === "Students" && "Course Year Section"}
                                  {selectedAudienceType === "Instructors" && "Department"}
                                  {selectedAudienceType === "Alumni" && "Company"}
                                  {selectedAudienceType === "Employers" && "Company"}
                                </Label>
                                <Select
                                  value={selectedCourseYearSection}
                                  onValueChange={(value) => {
                                    setSelectedCourseYearSection(value);
                                    setFormTarget(`${selectedAudienceType} - ${value}`);
                                  }}
                                >
                                  <SelectTrigger className="h-10">
                                    <SelectValue placeholder={
                                      selectedAudienceType === "Students" 
                                        ? "Select course year section"
                                        : selectedAudienceType === "Instructors"
                                        ? "Select department"
                                        : "Select company"
                                    } />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedAudienceType === "Students" && (
                                      courseYearSections.map((section) => (
                                        <SelectItem key={section} value={section}>
                                          {section}
                                        </SelectItem>
                                      ))
                                    )}
                                    {selectedAudienceType === "Instructors" && (
                                      instructorDepartments.map((dept) => (
                                        <SelectItem key={dept} value={dept}>
                                          {dept}
                                        </SelectItem>
                                      ))
                                    )}
                                    {selectedAudienceType === "Alumni" && (
                                      alumniCompanies.map((company) => (
                                        <SelectItem key={company} value={company}>
                                          {company}
                                        </SelectItem>
                                      ))
                                    )}
                                    {selectedAudienceType === "Employers" && (
                                      employerCompanies.map((company) => (
                                        <SelectItem key={company} value={company}>
                                          {company}
                                        </SelectItem>
                                      ))
                                    )}
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
                            {selectedAudienceType !== "All Users" && selectedCourseYearSection && (
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-between p-3 h-auto border rounded-lg hover:bg-gray-50"
                                  >
                                    <span className="text-sm">
                                      Preview Recipients ({filteredRecipients.length} of {recipients.length})
                                    </span>
                                    <ChevronDown className="w-4 h-4" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-3 pt-3">
                                  <div className="text-sm text-gray-600">
                                    <p>
                                      Recipients for{" "}
                                      <strong>{formTarget}</strong>.
                                    </p>
                                    <p className="mt-2">
                                      Use the search bar below to exclude specific users.
                                    </p>
                                  </div>

                                  {/* Search Bar */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">
                                      Search and Exclude Users
                                    </Label>
                                    <Input
                                      placeholder="Search users by name..."
                                      className="h-9"
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="select-all-recipients"
                                      checked={selectAllRecipients}
                                      onCheckedChange={(checked) => {
                                        setSelectAllRecipients(!!checked);
                                        if (checked) {
                                          setSelectedRecipients(
                                            new Set(
                                              recipients.map((r) => r.id)
                                            )
                                          );
                                        } else {
                                          setSelectedRecipients(new Set());
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor="select-all-recipients"
                                      className="text-sm"
                                    >
                                      Send to all users in this group
                                    </Label>
                                  </div>

                                  {/* Recipients list with checkboxes */}
                                  {filteredRecipients.length > 5 ? (
                                    <ScrollArea className="border rounded-lg p-3 bg-gray-50 max-h-24">
                                      {recipients.length > 0 ? (
                                        <div className="space-y-2">
                                          {filteredRecipients.map((recipient) => (
                                            <div
                                              key={recipient.id}
                                              className="flex items-center gap-2"
                                            >
                                              <Checkbox
                                                id={`recipient-${recipient.id}`}
                                                checked={selectedRecipients.has(recipient.id)}
                                                onCheckedChange={(checked) => {
                                                  const newSelected = new Set(selectedRecipients);
                                                  if (checked) {
                                                    newSelected.add(recipient.id);
                                                  } else {
                                                    newSelected.delete(recipient.id);
                                                  }
                                                  setSelectedRecipients(newSelected);
                                                  setSelectAllRecipients(
                                                    newSelected.size === recipients.length
                                                  );
                                                }}
                                              />
                                              <Label
                                                htmlFor={`recipient-${recipient.id}`}
                                                className="text-sm flex-1"
                                              >
                                                {recipient.name}{" "}
                                                <span className="text-gray-500">
                                                  ({recipient.details})
                                                </span>
                                              </Label>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-500">
                                          {searchTerm ? `No users found matching "${searchTerm}"` : "No users found in this group."}
                                        </p>
                                      )}
                                    </ScrollArea>
                                  ) : (
                                    <div className="border rounded-lg p-3 bg-gray-50">
                                      {recipients.length > 0 ? (
                                        <div className="space-y-2">
                                          {filteredRecipients.map((recipient) => (
                                            <div
                                              key={recipient.id}
                                              className="flex items-center gap-2"
                                            >
                                              <Checkbox
                                                id={`recipient-${recipient.id}`}
                                                checked={selectedRecipients.has(recipient.id)}
                                                onCheckedChange={(checked) => {
                                                  const newSelected = new Set(selectedRecipients);
                                                  if (checked) {
                                                    newSelected.add(recipient.id);
                                                  } else {
                                                    newSelected.delete(recipient.id);
                                                  }
                                                  setSelectedRecipients(newSelected);
                                                  setSelectAllRecipients(
                                                    newSelected.size === recipients.length
                                                  );
                                                }}
                                              />
                                              <Label
                                                htmlFor={`recipient-${recipient.id}`}
                                                className="text-sm flex-1"
                                              >
                                                {recipient.name}{" "}
                                                <span className="text-gray-500">
                                                  ({recipient.details})
                                                </span>
                                              </Label>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-500">
                                          {searchTerm ? `No users found matching "${searchTerm}"` : "No users found in this group."}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                          </CardContent>
                        </Card>

                        {/* Submission Schedule Card */}
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
                        </Card>
                      </div>

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

                      {/* Form Summary */}
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
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex-1">
                          {(!formTarget || !formTitle.trim() || questions.length === 0) && (
                            <div className="text-sm text-red-600 space-y-1">
                              {!formTitle.trim() && <p>• Please enter a form title</p>}
                              {questions.length === 0 && <p>• Please add at least one question</p>}
                              {!formTarget && <p>• Please select a target audience</p>}
                            </div>
                          )}
                          {formTarget && formTitle.trim() && questions.length > 0 && (
                            <p className="text-sm text-blue-900">
                              <strong>{isPublished ? "Ready to update!" : "Ready to publish!"}</strong> This form will
                              be available to {formTarget.toLowerCase()}.
                            </p>
                          )}
                        </div>
                        <div className="flex gap-3 ml-4">
                          <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={publishForm}
                            disabled={loading || !formTarget || !formTitle.trim() || questions.length === 0}
                          >
                            {loading ? "Saving..." : (isPublished ? "Update Now" : "Publish Now")}
                          </Button>
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
                              JPEG, PNG, GIF, WebP • Max 5MB
                            </p>
                          </div>
                          <input
                            id="form-image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
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
                          <div className="space-y-4 py-4">
                            <div className="flex gap-2">
                              <Input
                                placeholder="New category name"
                                id="new-category-input"
                                className="flex-1"
                              />
                              <Button
                                onClick={() => {
                                  const input = document.getElementById(
                                    "new-category-input"
                                  ) as HTMLInputElement;
                                  if (input?.value.trim()) {
                                    addCategory(input.value.trim());
                                    input.value = "";
                                  }
                                }}
                                size="sm"
                                disabled={loadingCategoryOperation}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {customCategories.map((cat) => (
                                <div
                                  key={cat}
                                  className="flex items-center justify-between p-2 rounded border"
                                >
                                  <span className="text-sm">{cat}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => removeCategory(cat)}
                                    disabled={
                                      customCategories.length <= 1 ||
                                      loadingCategoryOperation
                                    }
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Select
                      value={formCategory}
                      onValueChange={setFormCategory}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {customCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
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
                 <p className="text-gray-600">No questions yet. Add your first question below.</p>
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
              <CardContent className="pt-4 sm:pt-6">
                <div className="space-y-4">
                  {/* Question Header */}
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex items-center gap-1 sm:gap-2 mt-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="cursor-move h-6 w-6 sm:h-8 sm:w-8 shrink-0"
                      >
                        <GripVertical className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      </Button>
                      <span className="text-xs sm:text-sm text-gray-500 min-w-[1.5rem] sm:min-w-[2rem]">
                        Q{index + 1}
                      </span>
                    </div>
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={question.question}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              question: e.target.value,
                            })
                          }
                          placeholder="Enter your question"
                          className="flex-1 text-sm sm:text-base"
                        />
                        <Select
                          value={question.type}
                          onValueChange={(value) => {
                            const newType = value as FormQuestion["type"];
                            const updates: Partial<FormQuestion> = {
                              type: newType,
                            };
                            if (
                              newType === "multiple-choice" ||
                              newType === "checkbox" ||
                              newType === "dropdown"
                            ) {
                              updates.options = ["Option 1"];
                            } else {
                              updates.options = undefined;
                            }
                            updateQuestion(question.id, updates);
                          }}
                        >
                          <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {questionTypes.map((type) => {
                              const Icon = type.icon;
                              return (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="w-4 h-4" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Description */}
                      {activeQuestion === question.id && (
                        <Input
                          value={question.description || ""}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              description: e.target.value,
                            })
                          }
                          placeholder="Add a description (optional)"
                          className="text-sm"
                        />
                      )}

                      {/* Options for choice-based questions */}
                      {(question.type === "multiple-choice" ||
                        question.type === "checkbox" ||
                        question.type === "dropdown") && (
                        <div className="space-y-2 pl-0 sm:pl-4">
                          {question.options?.map((option, optIdx) => (
                            <div
                              key={optIdx}
                              className="flex items-center gap-2"
                            >
                              <div
                                className={`w-4 h-4 shrink-0 ${
                                  question.type === "multiple-choice"
                                    ? "rounded-full"
                                    : "rounded"
                                } border-2 border-gray-300`}
                              />
                              <Input
                                value={option}
                                onChange={(e) =>
                                  updateOption(
                                    question.id,
                                    optIdx,
                                    e.target.value
                                  )
                                }
                                placeholder={`Enter option ${optIdx + 1}`}
                                className="flex-1 text-sm"
                              />
                              {question.options &&
                                question.options.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                                    onClick={() =>
                                      deleteOption(question.id, optIdx)
                                    }
                                  >
                                    <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                  </Button>
                                )}
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => addOption(question.id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 text-xs sm:text-sm"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Add Option
                          </Button>
                        </div>
                      )}

                      {/* Preview for non-editable types */}
                      {question.type !== "multiple-choice" &&
                        question.type !== "checkbox" &&
                        question.type !== "dropdown" && (
                          <div className="pl-0 sm:pl-4">
                            {renderQuestionPreview(question)}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Question Actions */}
                  {activeQuestion === question.id && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t">
                      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveQuestion(question.id, "up")}
                          disabled={index === 0}
                          className="shrink-0"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveQuestion(question.id, "down")}
                          disabled={index === questions.length - 1}
                          className="shrink-0"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Separator
                          orientation="vertical"
                          className="h-6 mx-1 sm:mx-2"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateQuestion(question.id)}
                          className="shrink-0"
                        >
                          <Copy className="w-4 h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Duplicate</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQuestion(question.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                        >
                          <Trash2 className="w-4 h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <Label className="text-sm">Required</Label>
                        <Switch
                          checked={question.required}
                          onCheckedChange={(checked) =>
                            updateQuestion(question.id, { required: checked })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
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
                        onClick={() =>
                          addQuestion(type.value as FormQuestion["type"])
                        }
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
    </div>
  );
}