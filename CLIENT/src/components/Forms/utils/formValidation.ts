import { FormState, FormQuestion, ValidationResult } from "../types/form";

/**
 * Validates form state before saving or publishing
 */
export function validateForm(form: Partial<FormState>): ValidationResult {
  const errors: string[] = [];

  if (!form.title?.trim()) {
    errors.push("Please enter a form title");
  }

  if (!form.category) {
    errors.push("Please select a category");
  }

  if (!form.targetAudience || form.targetAudience === "") {
    errors.push("Please select a target audience");
  }

  if (form.questions && form.questions.length === 0) {
    errors.push("Please add at least one question to your form");
  }

  // Validate questions
  if (form.questions) {
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.question.trim()) {
        errors.push(`Question ${i + 1} must have text`);
      }
      if (!q.type) {
        errors.push(`Question ${i + 1} must have a type`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a single question
 */
export function validateQuestion(question: FormQuestion): ValidationResult {
  const errors: string[] = [];

  if (!question.question.trim()) {
    errors.push("Question text is required");
  }

  if (!question.type) {
    errors.push("Question type is required");
  }

  // Validate options for choice-based questions
  if (
    question.type === "multiple-choice" ||
    question.type === "checkbox" ||
    question.type === "dropdown"
  ) {
    if (!question.options || question.options.length === 0) {
      errors.push("At least one option is required");
    } else {
      const validOptions = question.options.filter(
        (opt) => opt && opt.trim() !== ""
      );
      if (validOptions.length === 0) {
        errors.push("At least one valid option is required");
      }
    }
  }

  // Validate min/max for linear scale
  if (question.type === "linear-scale") {
    if (question.min !== undefined && question.max !== undefined) {
      if (question.min >= question.max) {
        errors.push("Minimum value must be less than maximum value");
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Cleans question data before sending to API
 */
export function cleanQuestions(questions: FormQuestion[]): FormQuestion[] {
  return questions.map((q) => ({
    ...q,
    options:
      q.options && q.options.filter((opt) => opt && opt.trim() !== "")
        ? q.options.filter((opt) => opt && opt.trim() !== "")
        : undefined,
  }));
}

/**
 * Converts API question data to FormQuestion format
 */
export function convertApiQuestionToFormQuestion(
  q: any,
  index: number
): FormQuestion {
  return {
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
  };
}

/**
 * Determines department based on course year section
 */
export function getDepartmentFromSection(section: string): string {
  if (
    section.startsWith("ABM") ||
    section.startsWith("HUMSS") ||
    section.startsWith("STEM") ||
    section.startsWith("ICT")
  ) {
    return "Senior High Department";
  } else if (
    section.startsWith("BS") ||
    section.startsWith("BTVTEd")
  ) {
    return "College Department";
  }
  return "";
}

/**
 * Parses target audience string to extract audience type and section
 */
export function parseTargetAudience(
  target: string
): { audienceType: string; section: string } {
  if (target === "All Users") {
    return { audienceType: "All Users", section: "" };
  }

  if (target.includes(" - ")) {
    const parts = target.split(" - ");
    const audienceType = parts[0];
    const section = parts[parts.length - 1];
    return { audienceType, section };
  }

  return { audienceType: target, section: "" };
}

/**
 * Formats user details based on role
 */
export function formatUserDetails(user: any): string {
  if (user.role === "student") {
    return user.course_yr_section || "No section";
  } else if (user.role === "instructor") {
    return user.department || "No department";
  } else if (user.role === "alumni") {
    return user.company || "No company";
  }
  return "N/A";
}

/**
 * Filters students by department
 */
export function filterStudentsByDepartment(
  students: any[],
  department: string
): any[] {
  if (department === "Senior High Department") {
    return students.filter((user) => {
      const section = user.details || "";
      return (
        section.startsWith("ABM") ||
        section.startsWith("HUMSS") ||
        section.startsWith("STEM") ||
        section.startsWith("ICT")
      );
    });
  } else if (department === "College Department") {
    return students.filter((user) => {
      const section = user.details || "";
      return (
        section.startsWith("BSIT") ||
        section.startsWith("BSBA") ||
        section.startsWith("BSCS") ||
        section.startsWith("BSEN") ||
        section.startsWith("BSOA") ||
        section.startsWith("BSAIS") ||
        section.startsWith("BTVTEd")
      );
    });
  }
  return students;
}
