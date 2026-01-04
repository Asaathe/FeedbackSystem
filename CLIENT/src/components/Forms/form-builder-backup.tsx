import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../Reusable_components/card";
import { Button } from "../Reusable_components/button";
import { Input } from "../Reusable_components/input";
import { Textarea } from "../Reusable_components/textarea";
import { Label } from "../Reusable_components/label";
import { Badge } from "../Reusable_components/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Reusable_components/select";
import { Switch } from "../Reusable_components/switch";
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Save,
  ArrowLeft,
  Users,
  Calendar as CalendarIcon,
  FileText,
  Target,
  Search,
  CheckSquare,
  Upload,
  X,
  Image as ImageIcon,
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
  SendHorizontal
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Reusable_components/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../Reusable_components/dialog";
import { toast } from "sonner";
import { Checkbox } from "../Reusable_components/checkbox";
import { ScrollArea } from "../Reusable_components/scroll-area";
import { Separator } from "../Reusable_components/separator";
import { Popover, PopoverContent, PopoverTrigger } from "../Reusable_components/popover";
import { Calendar } from "../Reusable_components/calendar";
import { format } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../Reusable_components/collapsible";
import { formApi, FormData as FormApiData, QuestionData } from "../../services/formApi";

// ============================================================
// TODO: BACKEND - Form Builder
// ============================================================
// Create/Update Form:
// - POST /api/forms (create new)
// - PATCH /api/forms/:id (update existing)
//   Request: {
//     title, description, formType, targetAudience,
//     startDate, endDate, isRecurring, recurrencePattern,
//     questions: [{ type, question, required, options, min, max }],
//     imageUrl (from separate upload)
//   }
//   Response: { id, message: 'Form created/updated successfully' }
//
// Get Form for Editing:
// - GET /api/forms/:id
//   Response: Complete form data including all questions
//
// Upload Form Image:
// - POST /api/upload/image
//   Request: FormData with file
//   Response: { url: 'uploaded_image_url' }
//
// Form Assignment/Targeting:
// - POST /api/forms/:id/assign
//   Request: { targetUsers: [......], filters: {...} }
//   Response: { assignedCount, message }
// ============================================================

interface FormQuestion {
  id: string;
  type: 'multiple-choice' | 'rating' | 'text' | 'textarea' | 'checkbox' | 'dropdown' | 'linear-scale';
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
}

const questionTypes = [
  { value: 'text', label: 'Short Text', icon: Type },
  { value: 'textarea', label: 'Long Text', icon: AlignLeft },
  { value: 'multiple-choice', label: 'Multiple Choice', icon: CheckCircle2 },
  { value: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
  { value: 'dropdown', label: 'Dropdown', icon: List },
  { value: 'rating', label: 'Star Rating', icon: Star },
  { value: 'linear-scale', label: 'Linear Scale', icon: Sliders },
];

const filterOptions = {
  Students: {
    type: 'Course/Section',
    options: ['BSIT 3-A', 'BSIT 3-B', 'BSCS 2-A', 'BSCS 2-B', 'BSIT 4-A', 'BSIS 3-A'],
  },
  Alumni: {
    type: 'Graduation Year/Program',
    options: ['2024 - BSIT', '2024 - BSCS', '2023 - BSIT', '2023 - BSCS', '2022 - BSIT'],
  },
  Instructors: {
    type: 'Department/Course',
    options: ['Computer Science Dept', 'IT Dept', 'Engineering Dept', 'Business Dept'],
  },
  'Non-Teaching Staff': {
    type: 'Department/Unit',
    options: ['Library', 'Registrar', 'IT Services', 'Finance', 'HR Department'],
  },
};

const mockUsers = {
  Students: [
    { id: '1', name: 'Juan Dela Cruz', section: 'BSIT 3-A', email: 'juan.delacruz@university.edu' },
    { id: '2', name: 'Maria Santos', section: 'BSIT 3-A', email: 'maria.santos@university.edu' },
    { id: '3', name: 'Pedro Garcia', section: 'BSIT 3-B', email: 'pedro.garcia@university.edu' },
    { id: '4', name: 'Ana Reyes', section: 'BSCS 2-A', email: 'ana.reyes@university.edu' },
    { id: '5', name: 'Jose Ramos', section: 'BSCS 2-B', email: 'jose.ramos@university.edu' },
    { id: '6', name: 'Sofia Torres', section: 'BSIT 4-A', email: 'sofia.torres@university.edu' },
  ],
  Alumni: [
    { id: '7', name: 'Miguel Hernandez', section: '2024 - BSIT', email: 'miguel.h@alumni.edu' },
    { id: '8', name: 'Carmen Lopez', section: '2024 - BSCS', email: 'carmen.l@alumni.edu' },
    { id: '9', name: 'Ricardo Martinez', section: '2023 - BSIT', email: 'ricardo.m@alumni.edu' },
  ],
  Instructors: [
    { id: '10', name: 'Dr. Robert Chen', section: 'Computer Science Dept', email: 'r.chen@university.edu' },
    { id: '11', name: 'Prof. Lisa Anderson', section: 'IT Dept', email: 'l.anderson@university.edu' },
    { id: '12', name: 'Dr. James Wilson', section: 'Engineering Dept', email: 'j.wilson@university.edu' },
  ],
  'Non-Teaching Staff': [
    { id: '13', name: 'Sarah Johnson', section: 'Library', email: 's.johnson@university.edu' },
    { id: '14', name: 'Mark Thompson', section: 'Registrar', email: 'm.thompson@university.edu' },
    { id: '15', name: 'Emily Davis', section: 'IT Services', email: 'e.davis@university.edu' },
  ],
};

export function FormBuilder({ onBack, formId }: FormBuilderProps) {
  // Form Settings State
  const [formTitle, setFormTitle] = useState('Untitled Feedback Form');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Academic');
  const [formTarget, setFormTarget] = useState('Students');
  const [formImage, setFormImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [settingsOpen, setSettingsOpen] = useState(true);

  // Categories Management
  const [categories, setCategories] = useState(['Academic', 'Facilities', 'Services', 'Alumni', 'Career Support']);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Target Audience
  const [selectedRole, setSelectedRole] = useState('Students');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [manageUsersDialogOpen, setManageUsersDialogOpen] = useState(false);

  // Questions State
  const [questions, setQuestions] = useState<FormQuestion[]>([
    {
      id: '1',
      type: 'rating',
      question: 'How would you rate the overall quality?',
      required: true,
    },
  ]);
  const [activeQuestion, setActiveQuestion] = useState<string | null>('1');

  // Publish Dialog
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  // Preview Dialog
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Loading and Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load form data if editing existing form
  useEffect(() => {
    if (formId) {
      loadFormData(formId);
    }
  }, [formId]);

  // Load form categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Load form data for editing
  const loadFormData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading form data for ID:', id);
      
      const response = await formApi.getForm(id);
      console.log('Form load response:', response);
      
      if (response.success && response.form) {
        const form = response.form;
        setFormTitle(form.title || '');
        setFormDescription(form.description || '');
        setFormCategory(form.category || 'Academic');
        setFormTarget(form.target_audience || 'Students');
        setFormImage(form.image_url || null);
        setStartDate(form.start_date ? new Date(form.start_date) : undefined);
        setEndDate(form.end_date ? new Date(form.end_date) : undefined);
        
        // Convert questions to our format
        if (form.questions && form.questions.length > 0) {
          const formattedQuestions = form.questions.map((q: any) => ({
            id: q.id.toString(),
            type: q.question_type,
            question: q.question_text,
            description: q.description || '',
            required: q.required || false,
            options: q.options || [],
            min: q.min_value,
            max: q.max_value,
          }));
          setQuestions(formattedQuestions);
        } else {
          setQuestions([]);
        }
        
        toast.success('Form loaded successfully');
      } else {
        throw new Error(response.message || 'Failed to load form');
      }
    } catch (err) {
      console.error('Error loading form:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load form';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load form categories
  const loadCategories = async () => {
    try {
      const response = await formApi.getCategories();
      if (response.success && response.categories) {
        setCategories(response.categories.map((cat: any) => cat.name));
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  // Save form as draft
  const saveDraft = async () => {
    try {
      setLoading(true);
      
      // Upload image if exists
      let imageUrl = formImage;
      if (imageFile) {
        const uploadResponse = await formApi.uploadImage(imageFile);
        if (uploadResponse.success) {
          imageUrl = uploadResponse.url;
        }
      }

      const formData: FormApiData = {
        title: formTitle,
        description: formDescription,
        category: formCategory,
        targetAudience: formTarget,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        questions: questions.map((q, index) => ({
          question: q.question,
          type: q.type,
          description: q.description || '',
          required: q.required,
          options: q.options || [],
          min: q.min,
          max: q.max,
          orderIndex: index,
        })),
        imageUrl: imageUrl || undefined,
        isTemplate: false,
        status: 'draft',
      };

      let response;
      if (formId) {
        response = await formApi.updateForm(formId, formData);
      } else {
        response = await formApi.createForm(formData);
      }

      if (response.success) {
        toast.success(formId ? 'Form updated successfully' : 'Form saved as draft');
        if (!formId && response.formId) {
          // Navigate to edit the new form
          // This would typically be handled by the parent component
        }
      }
    } catch (err) {
      console.error('Error saving form:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save form');
    } finally {
      setLoading(false);
    }
  };

  // Publish form
  const publishForm = async () => {
    try {
      setLoading(true);
      
      // Upload image if exists
      let imageUrl = formImage;
      if (imageFile) {
        const uploadResponse = await formApi.uploadImage(imageFile);
        if (uploadResponse.success) {
          imageUrl = uploadResponse.url;
        }
      }

      const formData: FormApiData = {
        title: formTitle,
        description: formDescription,
        category: formCategory,
        targetAudience: formTarget,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        questions: questions.map((q, index) => ({
          question: q.question,
          type: q.type,
          description: q.description || '',
          required: q.required,
          options: q.options || [],
          min: q.min,
          max: q.max,
          orderIndex: index,
        })),
        imageUrl: imageUrl || undefined,
        isTemplate: false,
        status: 'active',
      };

      let response;
      if (formId) {
        response = await formApi.updateForm(formId, formData);
      } else {
        response = await formApi.createForm(formData);
      }

      if (response.success) {
        // Deploy the form
        const deploymentData = {
          startDate: startDate ? startDate.toISOString().split('T')[0] : '',
          endDate: endDate ? endDate.toISOString().split('T')[0] : '',
          targetFilters: {
            roles: [formTarget.toLowerCase()],
            target_audience: formTarget.toLowerCase()
          }
        };

        await formApi.deployForm(String(response.formId || formId || ''), deploymentData);
        
        toast.success('Form published successfully');
        onBack();
      }
    } catch (err) {
      console.error('Error publishing form:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to publish form');
    } finally {
      setLoading(false);
    }
  };

  // Image Upload Handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large", {
          description: "Please upload an image smaller than 5MB",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error("Invalid file type", {
          description: "Please upload an image file",
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

  // Question Management
  const addQuestion = (type: FormQuestion['type'] = 'text') => {
    const newQuestion: FormQuestion = {
      id: Date.now().toString(),
      type: type,
      question: 'Untitled Question',
      required: false,
      ...(type === 'multiple-choice' || type === 'checkbox' || type === 'dropdown' 
        ? { options: ['Option 1'] } 
        : {}),
    };
    setQuestions([...questions, newQuestion]);
    setActiveQuestion(newQuestion.id);
  };

  const duplicateQuestion = (id: string) => {
    const question = questions.find(q => q.id === id);
    if (question) {
      const newQuestion = { 
        ...question, 
        id: Date.now().toString(),
        question: question.question + ' (Copy)'
      };
      const index = questions.findIndex(q => q.id === id);
      const newQuestions = [...questions];
      newQuestions.splice(index + 1, 0, newQuestion);
      setQuestions(newQuestions);
      setActiveQuestion(newQuestion.id);
    }
  };

  const updateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id: string) => {
    if (questions.length === 1) {
      toast.error("Cannot delete", { description: "Form must have at least one question" });
      return;
    }
    setQuestions(questions.filter(q => q.id !== id));
    setActiveQuestion(null);
    toast.success("Question deleted");
  };

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    const index = questions.findIndex(q => q.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) {
      return;
    }
    const newQuestions = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions);
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const optionNumber = (question.options?.length || 0) + 1;
      const newOptions = [...(question.options || []), `Option ${optionNumber}`];
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const deleteOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options && question.options.length > 1) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      updateQuestion(questionId, { options: newOptions });
    }
  };

  // User Management
  const getFilteredUsers = () => {
    const users = mockUsers[selectedRole as keyof typeof mockUsers] || [];
    if (selectedFilters.length === 0) return users;
    return users.filter(user => selectedFilters.includes(user.section));
  };

  const getNotificationText = () => {
    const totalUsers = getFilteredUsers().length;
    const selectedCount = selectedUsers.length;
    
    if (selectedCount > 0) {
      return `${selectedCount} selected ${selectedRole.toLowerCase()}`;
    } else if (selectedFilters.length > 0) {
      return `${totalUsers} ${selectedRole.toLowerCase()} from ${selectedFilters.join(', ')}`;
    } else {
      return `All ${selectedRole.toLowerCase()}`;
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllFilteredUsers = () => {
    const filteredUsers = getFilteredUsers();
    const allIds = filteredUsers.map(u => u.id);
    setSelectedUsers(allIds);
  };

  const clearUserSelection = () => {
    setSelectedUsers([]);
  };

  // Render Question Preview
  const renderQuestionPreview = (question: FormQuestion) => {
    switch (question.type) {
      case 'rating':
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
        );
      case 'multiple-choice':
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
      case 'checkbox':
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
      case 'dropdown':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
          </Select>
        );
      case 'linear-scale':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">1</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <div key={num} className="w-8 h-8 border-2 border-gray-300 rounded flex items-center justify-center text-xs">
                  {num}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500">10</span>
          </div>
        );
      case 'text':
        return <Input placeholder="Short answer text" disabled className="max-w-md" />;
      case 'textarea':
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
                  {loading ? 'Loading...' : (formTitle || "Untitled Form")}
                </h1>
              </div>
            </div>
            
            {/* Right Section - Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={loading}
                size="sm"
                className="h-8 w-8 sm:w-auto sm:h-9 p-0 sm:px-4"
              >
                <Save className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{loading ? "Saving..." : "Save Draft"}</span>
              </Button>
              <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 sm:w-auto sm:h-9 p-0 sm:px-4"
                  >
                    <Eye className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Preview</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-modern">
                  <DialogHeader>
                    <DialogTitle>Form Preview</DialogTitle>
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
                          <img src={formImage} alt="Form header" className="w-full h-48 object-cover rounded-t-lg" />
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
                            <Badge variant="outline">For {formTarget}</Badge>
                            {(startDate || endDate) && (
                              <Badge variant="outline">
                                <CalendarIcon className="w-3 h-3 mr-1" />
                                {startDate && endDate 
                                  ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`
                                  : startDate 
                                  ? `From ${format(startDate, "MMM d")}`
                                  : endDate 
                                  ? `Until ${format(endDate, "MMM d")}`
                                  : ''
                                }
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Separator />

                        {/* Questions */}
                        <div className="space-y-6">
                          {questions.map((question, index) => (
                            <div key={question.id} className="space-y-3">
                              <div className="flex items-start gap-2">
                                <span className="text-gray-500 shrink-0">{index + 1}.</span>
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-start gap-2">
                                    <Label className="text-base">
                                      {question.question}
                                      {question.required && (
                                        <span className="text-red-500 ml-1">*</span>
                                      )}
                                    </Label>
                                  </div>
                                  {question.description && (
                                    <p className="text-sm text-gray-500">{question.description}</p>
                                  )}
                                  
                                  {/* Question Input Based on Type */}
                                  <div className="pt-2">
                                    {question.type === 'rating' && (
                                      <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star 
                                            key={star} 
                                            className="w-8 h-8 text-gray-300 hover:text-yellow-400 cursor-pointer transition-colors" 
                                          />
                                        ))}
                                      </div>
                                    )}
                                    
                                    {question.type === 'multiple-choice' && (
                                      <div className="space-y-2">
                                        {question.options?.map((option, i) => (
                                          <label key={i} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                                            <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                                            <span>{option}</span>
                                          </label>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {question.type === 'checkbox' && (
                                      <div className="space-y-2">
                                        {question.options?.map((option, i) => (
                                          <label key={i} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                                            <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                                            <span>{option}</span>
                                          </label>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {question.type === 'dropdown' && (
                                      <Select disabled>
                                        <SelectTrigger className="w-full max-w-md">
                                          <SelectValue placeholder="Select an option" />
                                        </SelectTrigger>
                                      </Select>
                                    )}
                                    
                                    {question.type === 'linear-scale' && (
                                      <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                          <span className="text-sm text-gray-500 shrink-0">1</span>
                                          <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                              <button
                                                key={num}
                                                className="w-10 h-10 border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-green-50 hover:border-green-400 transition-colors shrink-0"
                                              >
                                                {num}
                                              </button>
                                            ))}
                                          </div>
                                          <span className="text-sm text-gray-500 shrink-0">10</span>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {question.type === 'text' && (
                                      <Input placeholder="Your answer" className="max-w-md" />
                                    )}
                                    
                                    {question.type === 'textarea' && (
                                      <Textarea placeholder="Your answer" rows={4} className="resize-none" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Submit Button Preview */}
                        <div className="flex justify-end pt-4 border-t">
                          <Button className="bg-green-500 hover:bg-green-600" disabled>
                            Submit Feedback
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-green-500 hover:bg-green-600 h-8 w-8 sm:w-auto sm:h-9 p-0 sm:px-4" 
                    size="sm"
                  >
                    <SendHorizontal className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Publish</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-modern">
                  <DialogHeader>
                    <DialogTitle>Publish Feedback Form</DialogTitle>
                    <DialogDescription>
                      Review your form and select recipients before publishing
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 py-4">
                    {/* Form Summary */}
                    <Card className="border-green-100 bg-gradient-to-br from-green-50 to-lime-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2 text-green-700 mb-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-xs uppercase tracking-wide">Form Summary</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h3 className="text-lg mb-1">{formTitle}</h3>
                          {formDescription && (
                            <p className="text-sm text-gray-600">{formDescription}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Target className="w-4 h-4 text-gray-500" />
                            <div>
                              <span className="text-gray-500">Category:</span>
                              <span className="ml-1">{formCategory}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon className="w-4 h-4 text-gray-500" />
                            <div>
                              <span className="text-gray-500">Duration:</span>
                              <span className="ml-1">
                                {startDate && endDate 
                                  ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d")}`
                                  : 'Not set'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-white">{formCategory}</Badge>
                          <Badge variant="outline" className="bg-white">Target: {formTarget}</Badge>
                          <Badge variant="outline" className="bg-white">{questions.length} Questions</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Separator />

                    {/* Recipients */}
                    <div className="space-y-3">
                      <Label>Select Recipients</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Select value={selectedRole} onValueChange={(value) => {
                            setSelectedRole(value);
                            setSelectedFilters([]);
                            setSelectedUsers([]);
                          }}>
                            <SelectTrigger className="pl-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Students">Students</SelectItem>
                              <SelectItem value="Alumni">Alumni</SelectItem>
                              <SelectItem value="Instructors">Instructors</SelectItem>
                              <SelectItem value="Non-Teaching Staff">Non-Teaching Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setManageUsersDialogOpen(true)}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>

                    {/* Filters */}
                    {filterOptions[selectedRole as keyof typeof filterOptions] && (
                      <div className="space-y-2">
                        <Label className="text-sm">
                          Filter by {filterOptions[selectedRole as keyof typeof filterOptions].type}
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {filterOptions[selectedRole as keyof typeof filterOptions].options.map((option) => (
                            <Badge
                              key={option}
                              variant={selectedFilters.includes(option) ? "default" : "outline"}
                              className={`cursor-pointer transition-colors ${
                                selectedFilters.includes(option)
                                  ? 'bg-green-500 hover:bg-green-600'
                                  : 'hover:bg-green-50'
                              }`}
                              onClick={() => {
                                setSelectedFilters(prev =>
                                  prev.includes(option)
                                    ? prev.filter(f => f !== option)
                                    : [...prev, option]
                                );
                                setSelectedUsers([]);
                              }}
                            >
                              {option}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-sm text-blue-900">
                        <span>{getNotificationText()}</span> will be notified when the form is published.
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          toast.success('Form saved as draft');
                          setPublishDialogOpen(false);
                        }}
                      >
                        Save as Draft
                      </Button>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={publishForm}
                        disabled={loading}
                      >
                        {loading ? "Publishing..." : "Publish Now"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
                      placeholder="Enter form title"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Form Description</Label>
                    <Textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Provide instructions or context for your form respondents..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  {/* Form Image */}
                  <div className="space-y-2">
                    <Label>Form Image (Optional)</Label>
                    <p className="text-xs text-gray-500">Add a header image to personalize your feedback form</p>
                    
                    {!formImage ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 transition-colors">
                        <label htmlFor="form-image-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center justify-center py-8 px-4">
                            <Upload className="w-10 h-10 text-gray-400 mb-2" />
                            <p className="text-sm">
                              <span className="text-green-600">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
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
                        <img 
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

                  {/* Category and Target */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <div className="flex gap-2">
                        <Select value={formCategory} onValueChange={setFormCategory}>
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage Categories</DialogTitle>
                              <DialogDescription>Add or remove feedback form categories</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="New category name"
                                  value={newCategory}
                                  onChange={(e) => setNewCategory(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && newCategory.trim()) {
                                      if (!categories.includes(newCategory.trim())) {
                                        setCategories([...categories, newCategory.trim()]);
                                        setNewCategory('');
                                        toast.success("Category added");
                                      }
                                    }
                                  }}
                                />
                                <Button
                                  onClick={() => {
                                    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
                                      setCategories([...categories, newCategory.trim()]);
                                      setNewCategory('');
                                      toast.success("Category added");
                                    }
                                  }}
                                  className="bg-green-500 hover:bg-green-600"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                              <ScrollArea className="h-48">
                                <div className="space-y-2">
                                  {categories.map((cat, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded border">
                                      <span>{cat}</span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                                        onClick={() => {
                                          setCategories(categories.filter((_, i) => i !== idx));
                                          if (formCategory === cat) setFormCategory(categories[0] || '');
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Target Audience *</Label>
                      <Select value={formTarget} onValueChange={setFormTarget}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Students">Students</SelectItem>
                          <SelectItem value="Alumni">Alumni</SelectItem>
                          <SelectItem value="Instructors">Instructors</SelectItem>
                          <SelectItem value="Staff">Staff</SelectItem>
                          <SelectItem value="All">All Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-2">
                    <Label>Submission Schedule</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Start Date & Time</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "PPP") : <span className="text-gray-500">Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Input 
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">End Date & Time</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP") : <span className="text-gray-500">Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Input 
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
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
                  <img src={formImage} alt="Form header" className="w-full h-48 object-cover rounded-t-lg" />
                </div>
              )}
              <div className="space-y-2">
                <h1 className="text-3xl">{formTitle}</h1>
                {formDescription && (
                  <p className="text-gray-600">{formDescription}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Badge variant="secondary">{formCategory}</Badge>
                  <Badge variant="outline">For {formTarget}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          {questions.map((question, index) => (
            <Card 
              key={question.id} 
              className={`transition-all ${activeQuestion === question.id ? 'border-green-500 border-2 shadow-md' : 'border-gray-200'}`}
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
                      <span className="text-xs sm:text-sm text-gray-500 min-w-[1.5rem] sm:min-w-[2rem]">Q{index + 1}</span>
                    </div>
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={question.question}
                          onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                          placeholder="Question text"
                          className="flex-1 text-sm sm:text-base"
                        />
                        <Select
                          value={question.type}
                          onValueChange={(value) => {
                            const newType = value as FormQuestion['type'];
                            const updates: Partial<FormQuestion> = { type: newType };
                            if (newType === 'multiple-choice' || newType === 'checkbox' || newType === 'dropdown') {
                              updates.options = ['Option 1'];
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
                          value={question.description || ''}
                          onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                          placeholder="Description (optional)"
                          className="text-sm"
                        />
                      )}

                      {/* Options for choice-based questions */}
                      {(question.type === 'multiple-choice' || question.type === 'checkbox' || question.type === 'dropdown') && (
                        <div className="space-y-2 pl-0 sm:pl-4">
                          {question.options?.map((option, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <div className={`w-4 h-4 shrink-0 ${question.type === 'multiple-choice' ? 'rounded-full' : 'rounded'} border-2 border-gray-300`} />
                              <Input
                                value={option}
                                onChange={(e) => updateOption(question.id, optIdx, e.target.value)}
                                placeholder={`Option ${optIdx + 1}`}
                                className="flex-1 text-sm"
                              />
                              {question.options && question.options.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                                  onClick={() => deleteOption(question.id, optIdx)}
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
                      {question.type !== 'multiple-choice' && question.type !== 'checkbox' && question.type !== 'dropdown' && (
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
                          onClick={() => moveQuestion(question.id, 'up')}
                          disabled={index === 0}
                          className="shrink-0"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveQuestion(question.id, 'down')}
                          disabled={index === questions.length - 1}
                          className="shrink-0"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Separator orientation="vertical" className="h-6 mx-1 sm:mx-2" />
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
                          onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
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
                        onClick={() => addQuestion(type.value as FormQuestion['type'])}
                        className="hover:bg-green-50 hover:border-green-400"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {type.label}
                      </Button>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-500">Click a question type to add it to your form</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Manage Users Dialog */}
      <Dialog open={manageUsersDialogOpen} onOpenChange={setManageUsersDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Manage {selectedRole}</DialogTitle>
            <DialogDescription>
              Select specific users to receive this feedback form
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={`Search ${selectedRole.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {selectedFilters.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Filtered by:</span>
                {selectedFilters.map(filter => (
                  <Badge key={filter} variant="secondary" className="bg-green-100 text-green-700">
                    {filter}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pb-2 border-b">
              <div className="text-sm text-gray-600">
                {selectedUsers.length} of {getFilteredUsers().length} selected
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllFilteredUsers}
                  className="text-green-600 hover:bg-green-50"
                >
                  <CheckSquare className="w-4 h-4 mr-1" />
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearUserSelection}
                >
                  Clear
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {getFilteredUsers()
                  .filter(user =>
                    searchQuery === '' ||
                    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleUserSelection(user.id)}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                      <div className="flex-1">
                        <p>{user.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{user.email}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {user.section}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setManageUsersDialogOpen(false);
                  setSearchQuery('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={() => {
                  setManageUsersDialogOpen(false);
                  setSearchQuery('');
                  toast.success(`${selectedUsers.length} ${selectedRole.toLowerCase()} selected`);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
