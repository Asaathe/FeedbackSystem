import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getForm,
  createForm,
  updateForm,
  getFormCategories,
  addFormCategory,
  deleteFormCategory,
} from "../../../services/formManagementService";
import { validateImageFile, getImageRecommendations, IMAGE_VALIDATION } from "../../../utils/imageUtils";
import { FormState, DatabaseCategory, SubmissionSchedule } from "../types/form";
import { parseTargetAudience } from "../utils/formValidation";

// Helper function to get draft storage key
const getDraftStorageKey = (formId?: string) => {
  return formId ? `form_draft_${formId}` : `form_draft_new`;
};

interface UseFormSettingsProps {
  formId?: string;
}

export function useFormSettings({ formId }: UseFormSettingsProps) {
  // Form Settings State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formTarget, setFormTarget] = useState<string>("All Users");
  const [formImage, setFormImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [aiDescription, setAiDescription] = useState("");

  // Categories State
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [databaseCategories, setDatabaseCategories] = useState<
    DatabaseCategory[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [loadingCategoryOperation, setLoadingCategoryOperation] =
    useState<boolean>(false);

  // Submission Schedule State
  const [submissionSchedule, setSubmissionSchedule] =
    useState<SubmissionSchedule>({
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
    });

  // Loading State
  const [loading, setLoading] = useState(false);

  // Load existing form data when formId is provided
  useEffect(() => {
    const loadExistingForm = async () => {
      if (formId) {
        try {
          // First check localStorage for unsaved changes
          const savedFormData = localStorage.getItem(`form_${formId}`);
          if (savedFormData) {
            const formData = JSON.parse(savedFormData);
            setFormTitle(formData.title || "");
            setFormDescription(formData.description || "");
            setFormCategory(formData.category || "Academic");
            setFormTarget(formData.target || "All Users");
            setFormImage(formData.image || null);
            setCustomCategories(formData.customCategories || []);
            setAiDescription(formData.aiDescription || "");
            setSubmissionSchedule(
              formData.submissionSchedule || {
                startDate: "",
                endDate: "",
                startTime: "",
                endTime: "",
              }
            );
          } else {
            // Load from API if no localStorage data
            const result = await getForm(formId);
            if (result.success && result.form) {
              const form = result.form;
              setFormTitle(form.title || "");
              setFormDescription(form.description || "");
              setFormCategory(form.category || "Academic");
              setFormTarget(form.target_audience || "All Users");
              setFormImage(form.image_url || null);
              setIsPublished(form.status === "active");
              setAiDescription(form.ai_description || "");

              // Load submission schedule if available
              setSubmissionSchedule({
                startDate: form.start_date || "",
                endDate: form.end_date || "",
                startTime: "",
                endTime: "",
              });
            } else {
              toast.error("Failed to load form data");
            }
          }
        } catch (error) {
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
          setCustomCategories([]);
          setDatabaseCategories([]);
        }
      } catch (error) {
        toast.error("Failed to load categories");
        setCustomCategories([]);
        setDatabaseCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [formCategory]);

  // Image Upload Handler - Now uses FormData for file upload
  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        
        // Upload file to server using FormData
        const formData = new FormData();
        formData.append('image', file);
        formData.append('uploadType', 'forms');

        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('authToken');
          const response = await fetch('http://localhost:5000/api/forms/upload-image', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });

          const result = await response.json();

          if (result.success) {
            setFormImage(result.imageUrl);
            toast.success("Image uploaded successfully");
          } else {
            toast.error("Image upload failed", {
              description: result.message || "Unknown error",
            });
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error("Image upload failed", {
            description: "Network error occurred",
          });
        }
      }
    },
    []
  );

  const removeImage = useCallback(() => {
    setFormImage(null);
    setImageFile(null);
    toast.success("Image removed");
  }, []);

  // Category Management
  const addCategory = useCallback(
    async (category: string) => {
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
          toast.error("Failed to add category");
        } finally {
          setLoadingCategoryOperation(false);
        }
      }
    },
    [customCategories, databaseCategories]
  );

  const removeCategory = useCallback(
    async (category: string) => {
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
          toast.error("Failed to remove category");
        } finally {
          setLoadingCategoryOperation(false);
        }
      } else {
        toast.error("Category not found");
      }
    },
    [databaseCategories, customCategories, formCategory]
  );

  // Save Form
  const saveForm = useCallback(
    async (questions: any[]) => {
      // Validate required fields
      if (!formTitle.trim()) {
        toast.error("Please enter a form title");
        return false;
      }
      if (!formCategory) {
        toast.error("Please select a category");
        return false;
      }
      if (!formTarget || formTarget === "") {
        toast.error("Please select a target audience");
        return false;
      }

      try {
        setLoading(true);

        const formData = {
          title: formTitle,
          description: formDescription,
          category: formCategory,
          targetAudience: formTarget,
          questions: questions,
          question_count: questions.length,
          total_questions: questions.length,
          questions_count: questions.length,
          imageUrl: formImage || undefined,
          isTemplate: false,
          status: "draft",
          aiDescription: aiDescription,
        };

        const result = formId
          ? await updateForm(formId, formData)
          : await createForm(formData);

        if (result.success) {
          // Clear draft after successful save
          const draftKey = getDraftStorageKey(formId);
          localStorage.removeItem(draftKey);
          
          toast.success(formId ? "Form saved as draft" : "Form saved as draft");
          return true;
        } else {
          toast.error(result.message || "Failed to save form");
          return false;
        }
      } catch (err) {
        toast.error("Failed to save form");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [formTitle, formDescription, formCategory, formTarget, formImage, formId, aiDescription]
  );

  // Publish Form
  const publishForm = useCallback(
    async (
      questions: any[],
      selectedRecipients: Set<number>,
      recipients: any[],
      selectedInstructors: Set<number>
    ) => {
      // Validate required fields
      if (!formTitle.trim()) {
        toast.error("Please enter a form title");
        return false;
      }
      if (!formCategory) {
        toast.error("Please select a category");
        return false;
      }
      if (!formTarget || formTarget === "") {
        toast.error("Please select a target audience");
        return false;
      }

      if (questions.length === 0) {
        toast.error("Please add at least one question to your form");
        return false;
      }

      // Validate questions
      for (const q of questions) {
        if (!q.question.trim()) {
          toast.error("All questions must have text");
          return false;
        }
        if (!q.type) {
          toast.error("All questions must have a type");
          return false;
        }
      }

      try {
        setLoading(true);

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
          status: "active",
          aiDescription: aiDescription,
        };

        const saveResult = formId
          ? await updateForm(formId, formData)
          : await createForm(formData);

        if (!saveResult.success) {
          toast.error(saveResult.message || "Failed to save form");
          return false;
        }

        const currentFormId = formId || (saveResult as any).formId;

        if (!currentFormId) {
          toast.error("Failed to get form ID");
          return false;
        }

        // Clear draft after successful publish
        const draftKey = getDraftStorageKey(currentFormId);
        localStorage.removeItem(draftKey);

        // Note: Recipient assignment and deployment logic should be handled by caller
        // This hook returns the formId for the caller to use

        // Share responses with selected instructors if any
        if (selectedInstructors.size > 0) {
          try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('authToken');
            if (!token) {
              toast.error('Authentication required');
              return false;
            }

            const instructorIdsArray = Array.from(selectedInstructors);
            const response = await fetch(`http://localhost:5000/api/forms/${currentFormId}/share-responses`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ instructorIds: instructorIdsArray }),
            });

            if (!response.ok) {
              toast.error('Failed to share responses');
              return false;
            }

            const result = await response.json();
            if (result.success) {
              toast.success(
                `Responses shared with ${selectedInstructors.size} instructor${selectedInstructors.size !== 1 ? "s" : ""}.`
              );
            } else {
              toast.error(result.message || 'Failed to share responses');
              return false;
            }
          } catch (error) {
            console.error('Error sharing responses:', error);
            toast.error('Failed to share responses');
            return false;
          }
        }

        return { success: true, formId: currentFormId };
      } catch (err) {
        toast.error("Failed to publish form");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      formTitle,
      formDescription,
      formCategory,
      formTarget,
      formImage,
      submissionSchedule,
      formId,
      aiDescription,
    ]
  );

  return {
    // State
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
    setCustomCategories,
    databaseCategories,
    loadingCategories,
    loadingCategoryOperation,
    submissionSchedule,
    setSubmissionSchedule,
    loading,
    setLoading,
    aiDescription,
    setAiDescription,
    // Actions
    handleImageUpload,
    removeImage,
    addCategory,
    removeCategory,
    saveForm,
    publishForm,
  };
}
