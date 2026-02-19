import { useState, useCallback } from "react";
import { toast } from "sonner";
import { FormQuestion, FormSection, QuestionType } from "../types/form";

export function useQuestions() {
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Helper to get the next global order index
  const getNextOrder = useCallback(() => {
    const maxQuestionOrder = questions.reduce((max, q) => {
      const qOrder = q.order ?? -1;
      return qOrder > max ? qOrder : max;
    }, -1);
    const maxSectionOrder = sections.reduce((max, s) => {
      return s.order > max ? s.order : max;
    }, -1);
    return Math.max(maxQuestionOrder, maxSectionOrder) + 1;
  }, [questions, sections]);

  // Add a new section
  const addSection = useCallback((title: string = "New Section", description?: string) => {
    // Generate a unique ID using timestamp + random suffix to avoid collisions
    const uniqueId = `section_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newSection: FormSection = {
      id: uniqueId,
      title,
      description,
      order: getNextOrder(),
    };
    setSections(prev => [...prev, newSection]);
    setActiveSection(newSection.id);
    toast.success("Section added");
    return newSection;
  }, [getNextOrder]);

  // Update a section
  const updateSection = useCallback((id: string, updates: Partial<FormSection>) => {
    setSections(prev =>
      prev.map(s => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  // Delete a section
  const deleteSection = useCallback((id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    // Remove section reference from questions in this section
    setQuestions(prev =>
      prev.map(q => (q.sectionId === id ? { ...q, sectionId: undefined } : q))
    );
    if (activeSection === id) {
      setActiveSection(null);
    }
    toast.success("Section deleted");
  }, [activeSection]);

  // Move a section up or down (swaps order with adjacent section or standalone question)
  const moveSection = useCallback((id: string, direction: "up" | "down") => {
    const section = sections.find(s => s.id === id);
    if (!section) return;
    
    const currentOrder = section.order;
    
    // Get all items (sections and standalone questions) with their orders
    const standaloneQuestions = questions.filter(q => !q.sectionId);
    const allItems: Array<{ type: 'section'; id: string; order: number } | { type: 'question'; id: string; order: number }> = [
      ...sections.map(s => ({ type: 'section' as const, id: s.id, order: s.order })),
      ...standaloneQuestions.map(q => ({ type: 'question' as const, id: q.id, order: q.order ?? 0 }))
    ];
    
    // Sort by order
    allItems.sort((a, b) => a.order - b.order);
    
    const currentIndex = allItems.findIndex(item => item.type === 'section' && item.id === id);
    
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === allItems.length - 1)
    ) {
      return;
    }
    
    const adjacentIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const adjacentItem = allItems[adjacentIndex];
    
    // Swap orders
    const newOrder = adjacentItem.order;
    
    if (adjacentItem.type === 'section') {
      // Swap with another section
      setSections(prev => prev.map(s => {
        if (s.id === id) return { ...s, order: newOrder };
        if (s.id === adjacentItem.id) return { ...s, order: currentOrder };
        return s;
      }));
    } else {
      // Swap with a standalone question
      setSections(prev => prev.map(s => {
        if (s.id === id) return { ...s, order: newOrder };
        return s;
      }));
      setQuestions(prev => prev.map(q => {
        if (q.id === adjacentItem.id) return { ...q, order: currentOrder };
        return q;
      }));
    }
  }, [sections, questions]);

  // Add a new question
  const addQuestion = useCallback((type: QuestionType = "text", data?: Partial<FormQuestion>) => {
    // Only set order for standalone questions (not in a section)
    const questionOrder = data?.sectionId ? undefined : (data?.order ?? getNextOrder());
    // Generate a unique ID using timestamp + random suffix to avoid collisions
    const uniqueId = data?.id || `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newQuestion: FormQuestion = {
      id: uniqueId,
      type: type,
      question: data?.question || "",
      description: data?.description,
      required: data?.required ?? false,
      options: data?.options,
      min: data?.min,
      max: data?.max,
      sectionId: data?.sectionId, // Support section assignment
      order: questionOrder, // Global order for standalone questions
      ...(type === "multiple-choice" ||
      type === "checkbox" ||
      type === "dropdown"
        ? { options: data?.options || [""] }
        : {}),
    };
    setQuestions(prevQuestions => [...prevQuestions, newQuestion]);
    setActiveQuestion(newQuestion.id);
    if (!data) {
      toast.success(`Added ${type} question`);
    }
  }, []);

  // Duplicate a question
  const duplicateQuestion = useCallback(
    (id: string) => {
      const question = questions.find((q) => q.id === id);
      if (question) {
        // Generate a unique ID using timestamp + random suffix to avoid collisions
        const newQuestion = {
          ...question,
          id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
    },
    [questions]
  );

  // Update a question
  const updateQuestion = useCallback(
    (id: string, updates: Partial<FormQuestion>) => {
      setQuestions(
        questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
      );
    },
    [questions]
  );

  // Delete a question
  const deleteQuestion = useCallback(
    (id: string) => {
      setQuestions(questions.filter((q) => q.id !== id));
      setActiveQuestion(null);
      toast.success("Question deleted");
    },
    [questions]
  );

  // Move a question up or down (handles both section questions and standalone questions)
  const moveQuestion = useCallback(
    (id: string, direction: "up" | "down") => {
      const question = questions.find(q => q.id === id);
      if (!question) return;
      
      // If question is in a section, move within that section's questions
      if (question.sectionId) {
        const sectionQuestions = questions.filter(q => q.sectionId === question.sectionId);
        const index = sectionQuestions.findIndex(q => q.id === id);
        if (
          (direction === "up" && index === 0) ||
          (direction === "down" && index === sectionQuestions.length - 1)
        ) {
          return;
        }
        const newQuestions = [...questions];
        const sectionQuestionIds = sectionQuestions.map(q => q.id);
        const currentGlobalIndex = newQuestions.findIndex(q => q.id === id);
        const adjacentSectionQuestion = direction === "up" 
          ? sectionQuestions[index - 1] 
          : sectionQuestions[index + 1];
        const adjacentGlobalIndex = newQuestions.findIndex(q => q.id === adjacentSectionQuestion.id);
        
        [newQuestions[currentGlobalIndex], newQuestions[adjacentGlobalIndex]] = [
          newQuestions[adjacentGlobalIndex],
          newQuestions[currentGlobalIndex],
        ];
        setQuestions(newQuestions);
      } else {
        // Standalone question - swap order with adjacent item (section or standalone question)
        const currentOrder = question.order ?? 0;
        
        // Get all items (sections and standalone questions) with their orders
        const standaloneQuestions = questions.filter(q => !q.sectionId);
        const allItems: Array<{ type: 'section'; id: string; order: number } | { type: 'question'; id: string; order: number }> = [
          ...sections.map(s => ({ type: 'section' as const, id: s.id, order: s.order })),
          ...standaloneQuestions.map(q => ({ type: 'question' as const, id: q.id, order: q.order ?? 0 }))
        ];
        
        // Sort by order
        allItems.sort((a, b) => a.order - b.order);
        
        const currentIndex = allItems.findIndex(item => item.type === 'question' && item.id === id);
        
        if (
          (direction === "up" && currentIndex === 0) ||
          (direction === "down" && currentIndex === allItems.length - 1)
        ) {
          return;
        }
        
        const adjacentIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
        const adjacentItem = allItems[adjacentIndex];
        
        // Swap orders
        const newOrder = adjacentItem.order;
        
        if (adjacentItem.type === 'section') {
          // Swap with a section
          setQuestions(prev => prev.map(q => {
            if (q.id === id) return { ...q, order: newOrder };
            return q;
          }));
          setSections(prev => prev.map(s => {
            if (s.id === adjacentItem.id) return { ...s, order: currentOrder };
            return s;
          }));
        } else {
          // Swap with another standalone question
          setQuestions(prev => prev.map(q => {
            if (q.id === id) return { ...q, order: newOrder };
            if (q.id === adjacentItem.id) return { ...q, order: currentOrder };
            return q;
          }));
        }
      }
    },
    [questions, sections]
  );

  // Add an option to a question
  const addOption = useCallback(
    (questionId: string) => {
      const question = questions.find((q) => q.id === questionId);
      if (question) {
        const optionNumber = (question.options?.length || 0) + 1;
        const newOptions = [
          ...(question.options || []),
          `Option ${optionNumber}`,
        ];
        updateQuestion(questionId, { options: newOptions });
      }
    },
    [questions, updateQuestion]
  );

  // Update an option in a question
  const updateOption = useCallback(
    (questionId: string, optionIndex: number, value: string) => {
      const question = questions.find((q) => q.id === questionId);
      if (question && question.options) {
        const newOptions = [...question.options];
        newOptions[optionIndex] = value;
        updateQuestion(questionId, { options: newOptions });
      }
    },
    [questions, updateQuestion]
  );

  // Delete an option from a question
  const deleteOption = useCallback(
    (questionId: string, optionIndex: number) => {
      const question = questions.find((q) => q.id === questionId);
      if (question && question.options && question.options.length > 1) {
        const newOptions = question.options.filter((_, i) => i !== optionIndex);
        updateQuestion(questionId, { options: newOptions });
      }
    },
    [questions, updateQuestion]
  );

  // Load questions from API data
  const loadQuestions = useCallback((apiQuestions: any[]) => {
    if (apiQuestions && apiQuestions.length > 0) {
      // First, convert to questions and filter out duplicates by ID
      const questionsMap = new Map<string, FormQuestion>();
      apiQuestions.forEach((q: any, index: number) => {
        const id = q.id?.toString() || `q_${index + 1}`;
        // Only add if not already present (first occurrence wins)
        if (id && !questionsMap.has(id)) {
          questionsMap.set(id, {
            id,
            type: q.question_type || q.type || "text",
            question: q.question_text || q.question || "",
            description: q.description || "",
            required: q.required || false,
            options: q.options
              ? q.options
                  .map((opt: any) => opt.option_text)
                  .filter((opt: string) => opt && opt.trim() !== "")
              : undefined,
            min: q.min_value,
            max: q.max_value,
            sectionId: q.sectionId?.toString() || q.section_id?.toString() || undefined,
            order: q.order ?? q.order_index ?? index, // Load order for standalone questions
          });
        }
      });
      const questions = Array.from(questionsMap.values());
      setQuestions(questions);
      setActiveQuestion(questions[0]?.id || null);
    } else {
      setQuestions([]);
      setActiveQuestion(null);
    }
  }, []);

  // Load sections from API data
  const loadSections = useCallback((apiSections: any[]) => {
    if (apiSections && apiSections.length > 0) {
      // First, convert to sections and filter out duplicates by ID
      const sectionsMap = new Map<string, FormSection>();
      apiSections.forEach((s: any) => {
        const id = s.id?.toString() || s.id;
        // Only add if not already present (first occurrence wins)
        if (id && !sectionsMap.has(id)) {
          sectionsMap.set(id, {
            id,
            title: s.title || "",
            description: s.description || "",
            order: s.order ?? s.order_index ?? 0,
          });
        }
      });
      setSections(Array.from(sectionsMap.values()));
    } else {
      setSections([]);
    }
  }, []);

  // Clear all questions
  const clearQuestions = useCallback(() => {
    setQuestions([]);
    setActiveQuestion(null);
  }, []);

  // Get questions for a specific section
  const getQuestionsBySection = useCallback((sectionId: string | null) => {
    return questions.filter(q => q.sectionId === sectionId);
  }, [questions]);

  // Get questions without a section
  const getStandaloneQuestions = useCallback(() => {
    return questions.filter(q => !q.sectionId);
  }, [questions]);

  // Assign question to section
  const assignQuestionToSection = useCallback((questionId: string, sectionId: string | null) => {
    setQuestions(prev =>
      prev.map(q => (q.id === questionId ? { ...q, sectionId: sectionId || undefined } : q))
    );
  }, []);

  return {
    // State
    questions,
    sections,
    activeQuestion,
    activeSection,
    setActiveQuestion,
    setActiveSection,
    // Section Actions
    addSection,
    updateSection,
    deleteSection,
    moveSection,
    // Question Actions
    addQuestion,
    duplicateQuestion,
    updateQuestion,
    deleteQuestion,
    moveQuestion,
    addOption,
    updateOption,
    deleteOption,
    loadQuestions,
    loadSections,
    clearQuestions,
    // Helper Functions
    getQuestionsBySection,
    getStandaloneQuestions,
    assignQuestionToSection,
  };
}
