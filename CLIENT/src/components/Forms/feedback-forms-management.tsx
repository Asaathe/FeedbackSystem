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
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  FileText,
  Star,
  Send,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import { toast } from "sonner";
import {
  getForms,
  getForm,
  createForm,
  updateForm,
  deleteForm,
  duplicateForm,
  getFormTemplates,
  saveAsTemplate,
  deployForm,
  FormData,
} from "../../services/formManagementService";
import { isAuthenticated, getUserRole } from "../../utils/auth";
import { formatImageUrl, EnhancedImage } from "../../utils/imageUtils";

interface FeedbackFormsManagementProps {
  onNavigateToBuilder?: (formId?: string) => void;
  onNavigateToResponses?: (formId: string) => void;
}

const categories = [
  "Academic",
  "Facilities",
  "Services",
  "Alumni",
  "Career Support",
  "General Feedback",
];

const targetAudienceOptions = [
  "All Users",
  "Students",
  "Alumni",
  "Instructors",
];

interface FeedbackFormsManagementProps {
  onNavigateToBuilder?: (formId?: string) => void;
  onNavigateToEdit?: (formId: string) => void;
}

export function FeedbackFormsManagement({
  onNavigateToBuilder,
  onNavigateToResponses,
}: FeedbackFormsManagementProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTarget, setSelectedTarget] = useState("all");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FormData | null>(null);

  // Load question count cache from localStorage on component mount
  const [formQuestionCache, setFormQuestionCache] = useState<
    Record<string, number>
  >(() => {
    try {
      const saved = localStorage.getItem("form_question_cache");
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error("Error loading form question cache:", error);
      return {};
    }
  });

  // Save question count cache to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "form_question_cache",
        JSON.stringify(formQuestionCache)
      );
    } catch (error) {
      console.error("Error saving form question cache:", error);
    }
  }, [formQuestionCache]);

  const [loading, setLoading] = useState(true);
  const [savingAsTemplate, setSavingAsTemplate] = useState<string | null>(null);
  const [deployingForm, setDeployingForm] = useState<string | null>(null);
  const [customForms, setCustomForms] = useState<FormData[]>([]);
  const [templateForms, setTemplateForms] = useState<FormData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("custom");

  // Form state for editing forms
  const [editFormTitle, setEditFormTitle] = useState("");
  const [editFormDescription, setEditFormDescription] = useState("");
  const [editFormCategory, setEditFormCategory] = useState("Academic");
  const [editFormTarget, setEditFormTarget] = useState("All Users");

  // Load forms on component mount
  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoading(true);
    setError(null);

    // Check if user is authenticated
    if (!isAuthenticated()) {
      setError("Please log in to manage feedback forms.");
      setLoading(false);
      return;
    }

    // Check if user has admin role
    const userRole = getUserRole();
    if (userRole !== "admin") {
      setError(
        `Only administrators can manage feedback forms. Your current role is: ${
          userRole || "unknown"
        }.`
      );
      setLoading(false);
      return;
    }

    try {
      // Load custom forms (non-template forms)
      const customResult = await getForms("custom", "all", "", 1, 100);
      console.log("Forms list load result:", customResult);
      console.log("Loaded forms data:", customResult.forms);

      if (customResult.forms && customResult.forms.length > 0) {
        console.log(
          "Form data details:",
          customResult.forms.map((f) => ({
            id: f.id,
            title: f.title,
            question_count: f.question_count,
            submission_count: f.submission_count,
            hasQuestions: !!f.questions,
            questionsLength: f.questions?.length,
            image_url: f.image_url,
            image_url_type: typeof f.image_url,
            is_template: f.is_template,
            status: f.status,
            target_audience: f.target_audience, // Added for debugging
          }))
        );
      } else {
        console.log("No custom forms loaded");
      }

      if (customResult.success) {
        console.log("Loaded forms:", customResult.forms);
        // Filter out templates from custom forms
        const customFormsOnly = customResult.forms.filter(
          (f) => !f.is_template
        );
        setCustomForms(customFormsOnly);
      } else {
        setError(
          "Unable to load feedback forms. Please check your connection and try again."
        );
      }

      // Load templates
      const templates = await getFormTemplates();
      console.log("Loaded templates:", templates);
      setTemplateForms(templates);
    } catch (err) {
      console.error("Error loading forms:", err);
      setError(
        "Failed to connect to the server. Please check your internet connection."
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter forms based on search and filters
  const filteredCustomForms = customForms.filter((form) => {
    const matchesSearch =
      form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || form.category === selectedCategory;
    const matchesTarget =
      selectedTarget === "all" || form.target_audience === selectedTarget;
    return matchesSearch && matchesCategory && matchesTarget;
  });

  const filteredTemplateForms = templateForms.filter((form) => {
    const matchesSearch =
      form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || form.category === selectedCategory;
    const matchesTarget =
      selectedTarget === "all" || form.target_audience === selectedTarget;
    return matchesSearch && matchesCategory && matchesTarget;
  });

  const handlePreviewForm = async (form: FormData) => {
    try {
      const result = await getForm(form.id);
      if (result.success && result.form) {
        setSelectedForm(result.form);
        setPreviewDialogOpen(true);
      } else {
        toast.error("Failed to load form for preview");
      }
    } catch (error) {
      console.error("Error loading form for preview:", error);
      toast.error("Failed to load form for preview");
    }
  };

  const handleDuplicateForm = async (formId: string) => {
    try {
      const result = await duplicateForm(formId);
      if (result.success) {
        toast.success(result.message);
        // Reload forms to show the duplicated one
        await loadForms();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error duplicating form:", error);
      toast.error("An error occurred while duplicating the form");
    }
  };

  const handleDeleteForm = async (formId: string) => {
    try {
      const result = await deleteForm(formId);
      if (result.success) {
        toast.success(result.message);
        // Reload forms to remove the deleted one
        await loadForms();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error deleting form:", error);
      toast.error("An error occurred while deleting the form");
    }
  };

  const handleSaveAsTemplate = async (formId: string) => {
    try {
      setSavingAsTemplate(formId);
      const result = await saveAsTemplate(formId);
      if (result.success) {
        toast.success(result.message);
        // Reload forms to show the template in the templates tab and remove from custom forms
        await loadForms();
        // Switch to templates tab
        setActiveTab("templates");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error saving as template:", error);
      toast.error("An error occurred while saving as template");
    } finally {
      setSavingAsTemplate(null);
    }
  };

  const handleDeployForm = async (formId: string) => {
    try {
      setDeployingForm(formId);
      
      // Call the deployment API
      const result = await deployForm(formId, {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        targetFilters: {
          roles: ['student'],
          target_audience: 'Students'
        }
      });
      
      if (result.success) {
        toast.success(result.message);
        // Reload forms to show the updated status
        await loadForms();
      } else {
        toast.error(result.message || 'Failed to deploy form');
      }
    } catch (error) {
      console.error("Error deploying form:", error);
      toast.error("An error occurred while deploying the form");
    } finally {
      setDeployingForm(null);
    }
  };

  const handleEditForm = (form: FormData) => {
    setSelectedForm(form);
    setEditFormTitle(form.title);
    setEditFormDescription(form.description);
    setEditFormCategory(form.category);
    setEditFormTarget(form.target_audience);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedForm) return;

    if (!editFormTitle.trim()) {
      toast.error("Please enter a form title");
      return;
    }

    setLoading(true);

    try {
      const result = await updateForm(selectedForm.id, {
        title: editFormTitle,
        description: editFormDescription,
        category: editFormCategory,
        targetAudience: editFormTarget,
      });

      if (result.success) {
        toast.success(result.message);
        setEditDialogOpen(false);
        // Reload forms to show the updated one
        await loadForms();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error updating form:", error);
      toast.error("An error occurred while updating the form");
    } finally {
      setLoading(false);
    }
  };

  // Update question cache when forms are loaded
  useEffect(() => {
    // Update cache with question counts from loaded forms
    const newCache: Record<string, number> = {};
    [...customForms, ...templateForms].forEach((form) => {
      const questionCount = getQuestionCount(form);
      if (questionCount > 0) {
        newCache[form.id] = questionCount;
      }
    });
    setFormQuestionCache((prev) => ({ ...prev, ...newCache }));
  }, [customForms, templateForms]);

  // Function to get question count with cache fallback
  const getQuestionCount = (form: FormData): number => {
    // First check if we have cached data for this form
    if (formQuestionCache[form.id] !== undefined) {
      return formQuestionCache[form.id];
    }

    // Then check the form data
    if (form.questions && form.questions.length > 0) {
      return form.questions.length;
    }

    if (form.question_count > 0) {
      return form.question_count;
    }

    return 0;
  };

  // Function to update question cache
  const updateQuestionCache = (formId: string, questionCount: number) => {
    setFormQuestionCache((prev) => ({
      ...prev,
      [formId]: questionCount,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl">Feedback Forms</h2>
          <p className="text-gray-600">Create and manage feedback forms</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-green-500 hover:bg-green-600"
            onClick={() => onNavigateToBuilder?.()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Form
          </Button>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Form View</DialogTitle>
            <DialogDescription>
              View of: {selectedForm?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-4 py-4">
              <div className="bg-gradient-to-r from-green-50 to-lime-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-semibold">{selectedForm.title}</h3>
                <p className="text-gray-600 mt-1">{selectedForm.description}</p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary">{selectedForm.category}</Badge>
                  <Badge variant="outline">
                    Target: {selectedForm.target_audience}
                  </Badge>
                  <Badge variant="outline">
                    {selectedForm.questions?.length ||
                      selectedForm.question_count ||
                      0}{" "}
                    Questions
                  </Badge>
                  <Badge variant="outline">Status: {selectedForm.status}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Questions:</h4>
                {selectedForm.questions?.slice(0, 5).map((question, idx) => (
                  <div key={idx} className="p-3 border rounded-lg bg-gray-50">
                    <p className="text-sm">
                      {idx + 1}. {question.question}
                    </p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {question.type}
                    </Badge>
                  </div>
                )) ||
                  Array.from({
                    length: Math.min(selectedForm.question_count || 0, 5),
                  }).map((_, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-gray-50">
                      <p className="text-sm">
                        {idx + 1}. Sample question text would appear here...
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        Question Type
                      </Badge>
                    </div>
                  ))}
                {(selectedForm.questions?.length ||
                  selectedForm.question_count ||
                  0) > 5 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    ... and{" "}
                    {(selectedForm.questions?.length ||
                      selectedForm.question_count ||
                      0) - 5}{" "}
                    more questions
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPreviewDialogOpen(false)}
                >
                  Close View
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Form</DialogTitle>
            <DialogDescription>Update form details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Form Title</Label>
              <Input
                value={editFormTitle}
                onChange={(e) => setEditFormTitle(e.target.value)}
                placeholder="Enter form title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editFormDescription}
                onChange={(e) => setEditFormDescription(e.target.value)}
                placeholder="Brief description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editFormCategory}
                  onValueChange={setEditFormCategory}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select
                  value={editFormTarget}
                  onValueChange={setEditFormTarget}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {targetAudienceOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-500 hover:bg-blue-600"
                onClick={handleSaveEdit}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedTarget} onValueChange={setSelectedTarget}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Targets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Targets</SelectItem>
            {targetAudienceOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <p className="mt-2 text-gray-600">Loading forms...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={loadForms} variant="outline">
              Try Again
            </Button>
            <Button
              onClick={() => (window.location.href = "/login")}
              variant="default"
            >
              Go to Login
            </Button>
          </div>
        </div>
      ) : (
        /* Tabs for Custom and Template Forms */
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="custom">
              Custom Forms ({filteredCustomForms.length})
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Star className="w-4 h-4 mr-2" />
              Templates ({filteredTemplateForms.length})
            </TabsTrigger>
          </TabsList>

          {/* Custom Forms Tab */}
          <TabsContent value="custom" className="space-y-6 mt-6">
            {filteredCustomForms.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No custom forms found
                </h3>
                <p className="text-gray-500 mb-4">
                  Create your first feedback form to get started
                </p>
                <Button
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => onNavigateToBuilder?.()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Form
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomForms.map((form) => (
                  <Card
                    key={form.id}
                    className="border-green-100 hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    {/* Image or Placeholder */}
                    <div className="w-full h-40 overflow-hidden bg-gradient-to-br from-green-100 to-lime-100">
                      <EnhancedImage
                        src={form.image_url}
                        alt={form.title || "Form image"}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {form.title}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            {form.description}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onNavigateToBuilder?.(form.id)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePreviewForm(form)}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicateForm(form.id)}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSaveAsTemplate(form.id)}
                              disabled={savingAsTemplate === form.id}
                            >
                              <Star className="w-4 h-4 mr-2" />
                              {savingAsTemplate === form.id
                                ? "Saving..."
                                : "Save as Template"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteForm(form.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Badge
                          variant="secondary"
                          className={
                            form.status === "active"
                              ? "bg-green-100 text-green-700"
                              : form.status === "draft"
                              ? "bg-yellow-100 text-yellow-700"
                              : form.status === "template"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {form.status}
                        </Badge>
                        <Badge variant="outline" className="border-green-200">
                          {form.category}
                        </Badge>
                        <Badge variant="outline" className="border-blue-200">
                          {form.target_audience}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Responses</p>
                          <p className="font-medium">{form.submission_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Questions</p>
                          <p className="font-medium">
                            {getQuestionCount(form) > 0
                              ? getQuestionCount(form)
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-green-200 hover:bg-green-50"
                          onClick={() => onNavigateToResponses?.(form.id)}
                        >
                          Responses
                        </Button>
                        <Button
                          className="flex-1 bg-green-500 hover:bg-green-600"
                          onClick={() => onNavigateToBuilder?.(form.id)}
                        >
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Template Forms Tab */}
          <TabsContent value="templates" className="space-y-4 mt-6">
            {filteredTemplateForms.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No templates found
                </h3>
                <p className="text-gray-500">Template forms will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplateForms.map((template) => (
                  <Card
                    key={template.id}
                    className="border-purple-100 hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-purple-50/30 overflow-hidden"
                  >
                    {/* Add image display here */}
                    <div className="w-full h-40 overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                      <EnhancedImage
                        src={template.image_url}
                        alt={template.title || "Template image"}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">
                              {template.title}
                            </CardTitle>
                            <Star className="w-4 h-4 text-purple-500 fill-purple-500" />
                          </div>
                          <p className="text-sm text-gray-500">
                            {template.description}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handlePreviewForm(template)}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicateForm(template.id)}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteForm(template.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-700"
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Template
                        </Badge>
                        <Badge variant="outline" className="border-purple-200">
                          {template.category}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-500">Questions</p>
                        <p className="font-medium">
                          {getQuestionCount(template) > 0
                            ? getQuestionCount(template)
                            : "N/A"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-purple-200 hover:bg-purple-50"
                          onClick={() => handlePreviewForm(template)}
                        >
                          View
                        </Button>
                       
                        <Button
                          className="flex-1 bg-purple-500 hover:bg-purple-600"
                          onClick={() => onNavigateToBuilder?.(template.id)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
