import { useState, useCallback } from "react";
import { toast } from "sonner";
import { FormQuestion, QuestionType } from "../types/form";

export function useQuestions() {
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  // Add a new question
  const addQuestion = useCallback((type: QuestionType = "text") => {
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
  }, [questions]);

  // Duplicate a question
  const duplicateQuestion = useCallback(
    (id: string) => {
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

  // Move a question up or down
  const moveQuestion = useCallback(
    (id: string, direction: "up" | "down") => {
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
    },
    [questions]
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
      const questions = apiQuestions.map((q: any, index: number) => ({
        id: q.id?.toString() || `q_${index + 1}`,
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
      }));
      setQuestions(questions);
      setActiveQuestion(questions[0]?.id || null);
    } else {
      setQuestions([]);
      setActiveQuestion(null);
    }
  }, []);

  // Clear all questions
  const clearQuestions = useCallback(() => {
    setQuestions([]);
    setActiveQuestion(null);
  }, []);

  return {
    // State
    questions,
    activeQuestion,
    setActiveQuestion,
    // Actions
    addQuestion,
    duplicateQuestion,
    updateQuestion,
    deleteQuestion,
    moveQuestion,
    addOption,
    updateOption,
    deleteOption,
    loadQuestions,
    clearQuestions,
  };
}
