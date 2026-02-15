// Form-related type definitions

export type QuestionType =
  | "multiple-choice"
  | "rating"
  | "text"
  | "textarea"
  | "checkbox"
  | "dropdown"
  | "linear-scale";

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
}

export interface FormQuestion {
  id: string;
  type: QuestionType;
  question: string;
  description?: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  sectionId?: string;
  order?: number; // Global order for standalone questions (used for interleaving with sections)
}

export interface SubmissionSchedule {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

export interface Recipient {
  id: number;
  fullName: string;
  details: string;
}

export interface Instructor {
  id: number;
  fullName: string;
  department: string;
}

export interface DatabaseCategory {
  id: number;
  name: string;
  description?: string;
}

export interface FormState {
  title: string;
  description: string;
  category: string;
  targetAudience: string;
  image: string | null;
  imageFile: File | null;
  questions: FormQuestion[];
  submissionSchedule: SubmissionSchedule;
  isPublished: boolean;
}

export interface AudienceSelection {
  audienceType: string;
  department: string;
  courseYearSection: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface QuestionTypeConfig {
  value: QuestionType;
  label: string;
  icon: any;
}

export interface FormFilters {
  role: string;
  course?: string;
  year?: string;
  section?: string;
  grade?: string;
  course_year_section?: string;
  department?: string;
  company?: string;
}
