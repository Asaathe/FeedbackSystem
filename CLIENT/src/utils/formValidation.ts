export interface ValidationError {
  field: string;
  message: string;
}

export interface FormQuestion {
  id: string;
  type: 'multiple-choice' | 'rating' | 'text' | 'textarea' | 'checkbox' | 'dropdown' | 'linear-scale';
  question: string;
  description?: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

export interface FormData {
  title: string;
  description?: string;
  category: string;
  targetAudience: string;
  startDate?: string;
  endDate?: string;
  questions: FormQuestion[];
  imageUrl?: string;
  isTemplate?: boolean;
}

export const validateForm = (formData: FormData, isDraft: boolean = false): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Title validation - required for both draft and publish
  if (!formData.title?.trim()) {
    errors.push({ field: 'title', message: 'Form title is required' });
  } else if (formData.title.length > 255) {
    errors.push({ field: 'title', message: 'Form title must be less than 255 characters' });
  }

  // Description validation - optional but with length limit
  if (formData.description && formData.description.length > 1000) {
    errors.push({ field: 'description', message: 'Description must be less than 1000 characters' });
  }

  // Category validation - required for publish
  if (!isDraft && !formData.category) {
    errors.push({ field: 'category', message: 'Category is required' });
  }

  // Target audience validation - required for publish
  if (!isDraft && !formData.targetAudience) {
    errors.push({ field: 'targetAudience', message: 'Target audience is required' });
  }

  // Questions validation
  if (!formData.questions || formData.questions.length === 0) {
    if (!isDraft) {
      errors.push({ field: 'questions', message: 'Form must have at least one question' });
    }
  } else {
    formData.questions.forEach((question: FormQuestion, index: number) => {
      // Question text validation
      if (!question.question?.trim()) {
        errors.push({
          field: `questions[${index}].question`,
          message: `Question ${index + 1} text is required`
        });
      } else if (question.question.length > 500) {
        errors.push({
          field: `questions[${index}].question`,
          message: `Question ${index + 1} must be less than 500 characters`
        });
      }

      // Description validation
      if (question.description && question.description.length > 300) {
        errors.push({
          field: `questions[${index}].description`,
          message: `Question ${index + 1} description must be less than 300 characters`
        });
      }

      // Options validation for choice-based questions
      if (['multiple-choice', 'checkbox', 'dropdown'].includes(question.type)) {
        if (!question.options || question.options.length < 2) {
          errors.push({
            field: `questions[${index}].options`,
            message: `Question ${index + 1} must have at least 2 options`
          });
        } else {
          // Check for empty options
          question.options.forEach((option: string, optIndex: number) => {
            if (!option?.trim()) {
              errors.push({
                field: `questions[${index}].options[${optIndex}]`,
                message: `Option ${optIndex + 1} in question ${index + 1} cannot be empty`
              });
            } else if (option.length > 200) {
              errors.push({
                field: `questions[${index}].options[${optIndex}]`,
                message: `Option ${optIndex + 1} in question ${index + 1} must be less than 200 characters`
              });
            }
          });

          // Check for duplicate options
          const uniqueOptions = new Set(question.options.map(opt => opt.trim().toLowerCase()));
          if (uniqueOptions.size !== question.options.length) {
            errors.push({
              field: `questions[${index}].options`,
              message: `Question ${index + 1} has duplicate options`
            });
          }
        }
      }

      // Linear scale validation
      if (question.type === 'linear-scale') {
        if (question.min === undefined || question.max === undefined) {
          errors.push({
            field: `questions[${index}].scale`,
            message: `Question ${index + 1} must have min and max values`
          });
        } else if (!Number.isInteger(question.min) || !Number.isInteger(question.max)) {
          errors.push({
            field: `questions[${index}].scale`,
            message: `Question ${index + 1} min and max values must be integers`
          });
        } else if (question.min >= question.max) {
          errors.push({
            field: `questions[${index}].scale`,
            message: `Min value must be less than max value in question ${index + 1}`
          });
        } else if (question.min < 0 || question.max > 10) {
          errors.push({
            field: `questions[${index}].scale`,
            message: `Linear scale values must be between 0 and 10 in question ${index + 1}`
          });
        }
      }

      // Rating scale validation
      if (question.type === 'rating') {
        // Rating questions are typically 1-5 stars, no additional validation needed
      }
    });
  }

  // Date validation for publish
  if (!isDraft) {
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (startDate >= endDate) {
        errors.push({
          field: 'dates',
          message: 'End date must be after start date'
        });
      }

      const now = new Date();
      if (startDate < now) {
        errors.push({
          field: 'startDate',
          message: 'Start date cannot be in the past'
        });
      }
    }
  }

  return errors;
};

// Validate individual question
export const validateQuestion = (question: FormQuestion): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!question.question?.trim()) {
    errors.push({ field: 'question', message: 'Question text is required' });
  }

  if (['multiple-choice', 'checkbox', 'dropdown'].includes(question.type)) {
    if (!question.options || question.options.length < 2) {
      errors.push({ field: 'options', message: 'Must have at least 2 options' });
    }
  }

  if (question.type === 'linear-scale') {
    if (question.min === undefined || question.max === undefined) {
      errors.push({ field: 'scale', message: 'Must have min and max values' });
    }
  }

  return errors;
};

// Sanitize form data before submission
export const sanitizeFormData = (formData: FormData): FormData => {
  return {
    ...formData,
    title: formData.title?.trim() || '',
    description: formData.description?.trim(),
    category: formData.category?.trim() || '',
    targetAudience: formData.targetAudience?.trim() || '',
    questions: formData.questions.map(q => ({
      ...q,
      question: q.question?.trim() || '',
      description: q.description?.trim(),
      options: q.options?.map(opt => opt?.trim() || '').filter(opt => opt.length > 0),
    })),
  };
};