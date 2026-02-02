import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { createForm, updateForm } from "../../../services/formManagementService";

interface AutoSaveDraftOptions {
  formId?: string;
  formTitle: string;
  formDescription: string;
  formCategory: string;
  formTarget: string;
  formImage: string | null;
  submissionSchedule: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
  questions: any[];
  enabled?: boolean;
}

export interface DraftData {
  formId?: string;
  title: string;
  description: string;
  category: string;
  target: string;
  image: string | null;
  submissionSchedule: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
  questions: any[];
  savedAt: number;
  isDirty: boolean;
}

export function useAutoSaveDraft({
  formId,
  formTitle,
  formDescription,
  formCategory,
  formTarget,
  formImage,
  submissionSchedule,
  questions,
  enabled = true,
}: AutoSaveDraftOptions) {
  const lastSavedDataRef = useRef<string>("");
  const isOnlineRef = useRef<boolean>(true);
  const isSavingRef = useRef<boolean>(false);

  // Generate a unique key for localStorage
  const getStorageKey = useCallback(() => {
    return formId ? `form_draft_${formId}` : `form_draft_new`;
  }, [formId]);

  // Save draft to database as draft status
  const saveDraftToDatabase = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    // Only save if there's meaningful content
    const hasContent = 
      formTitle.trim() !== "" ||
      formDescription.trim() !== "" ||
      questions.length > 0;

    if (!hasContent) return;

    try {
      isSavingRef.current = true;

      const formData = {
        title: formTitle || "Untitled Draft",
        description: formDescription,
        category: formCategory || "Academic",
        targetAudience: formTarget || "All Users",
        questions: questions,
        question_count: questions.length,
        total_questions: questions.length,
        questions_count: questions.length,
        imageUrl: formImage || undefined,
        isTemplate: false,
        status: "draft",
      };

      let result;
      if (formId) {
        // Update existing form
        result = await updateForm(formId, formData);
      } else {
        // Create new form as draft
        result = await createForm(formData);
      }

      if (result.success) {
        console.log("Draft saved to database:", formId || "new form");
        // Also save to localStorage as backup
        saveDraftToLocalStorage();
      }
    } catch (error) {
      console.error("Failed to save draft to database:", error);
      // Fallback to localStorage if database save fails
      saveDraftToLocalStorage();
    } finally {
      isSavingRef.current = false;
    }
  }, [
    enabled,
    formId,
    formTitle,
    formDescription,
    formCategory,
    formTarget,
    formImage,
    questions,
  ]);

  // Save draft to localStorage (backup)
  const saveDraftToLocalStorage = useCallback(() => {
    const draftData: DraftData = {
      formId,
      title: formTitle,
      description: formDescription,
      category: formCategory,
      target: formTarget,
      image: formImage,
      submissionSchedule,
      questions,
      savedAt: Date.now(),
      isDirty: true,
    };

    const currentData = JSON.stringify(draftData);
    
    // Only save if data has changed
    if (currentData !== lastSavedDataRef.current) {
      const key = getStorageKey();
      localStorage.setItem(key, currentData);
      lastSavedDataRef.current = currentData;
      
      // Show subtle auto-save indicator (optional)
      console.log("Draft auto-saved to localStorage at:", new Date().toLocaleTimeString());
    }
  }, [
    formId,
    formTitle,
    formDescription,
    formCategory,
    formTarget,
    formImage,
    submissionSchedule,
    questions,
    getStorageKey,
  ]);

  // Check if there's a saved draft
  const hasDraft = useCallback(() => {
    const key = getStorageKey();
    const savedDraft = localStorage.getItem(key);
    return savedDraft !== null;
  }, [getStorageKey]);

  // Get saved draft data
  const getDraft = useCallback((): DraftData | null => {
    const key = getStorageKey();
    const savedDraft = localStorage.getItem(key);
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (error) {
        console.error("Failed to parse draft data:", error);
        return null;
      }
    }
    return null;
  }, [getStorageKey]);

  // Clear saved draft
  const clearDraft = useCallback(() => {
    const key = getStorageKey();
    localStorage.removeItem(key);
  }, [getStorageKey]);

  // Handle beforeunload event (browser close/refresh)
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Check if there are unsaved changes
      const hasUnsavedChanges = 
        formTitle.trim() !== "" ||
        formDescription.trim() !== "" ||
        questions.length > 0;

      if (hasUnsavedChanges) {
        // Save draft to database before unloading
        saveDraftToDatabase();
        
        // Show browser warning (optional - may be blocked by some browsers)
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, formTitle, formDescription, questions, saveDraftToDatabase]);

  // Handle visibility change (tab switch)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Save draft to database when tab is hidden
        saveDraftToDatabase();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, saveDraftToDatabase]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      isOnlineRef.current = true;
      toast.success("Connection restored", {
        description: "Your changes are being synced",
      });
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      toast.error("Connection lost", {
        description: "Your work is being saved locally",
      });
      // Save draft immediately when offline
      saveDraftToDatabase();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [saveDraftToDatabase]);

  return {
    hasDraft,
    getDraft,
    clearDraft,
    saveDraftToDatabase,
    isOnline: isOnlineRef.current,
  };
}
