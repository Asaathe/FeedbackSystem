// Validation Utility Functions

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format name (capitalize first letter of each word)
 * @param {string} name - Name to format
 * @returns {string} Formatted name
 */
const formatName = (name) => {
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {string|null} Error message or null if valid
 */
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return "Password must be at least 8 characters long";
  }
  if (!hasUpperCase) {
    return "Password must contain at least one uppercase letter";
  }
  if (!hasLowerCase) {
    return "Password must contain at least one lowercase letter";
  }
  if (!hasNumbers) {
    return "Password must contain at least one number";
  }
  if (!hasSpecialChar) {
    return "Password must contain at least one special character";
  }
  return null;
};

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return input.trim().replace(/[<>]/g, "");
};

/**
 * Validate form data
 * @param {object} formData - Form data to validate
 * @returns {object} Validation result with isValid and errors
 */
const validateFormData = (formData) => {
  const errors = [];

  if (!formData.title || formData.title.trim().length < 3) {
    errors.push("Title must be at least 3 characters long");
  }

  if (!formData.category) {
    errors.push("Category is required");
  }

  if (!formData.targetAudience) {
    errors.push("Target audience is required");
  }

  if (formData.questions && Array.isArray(formData.questions)) {
    formData.questions.forEach((question, index) => {
      if (!question.question || question.question.trim().length < 3) {
        errors.push(`Question ${index + 1} must be at least 3 characters long`);
      }
      if (!question.type) {
        errors.push(`Question ${index + 1} must have a type`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate question data
 * @param {object} question - Question data to validate
 * @returns {object} Validation result with isValid and errors
 */
const validateQuestion = (question) => {
  const errors = [];

  if (!question.question || question.question.trim().length < 3) {
    errors.push("Question text must be at least 3 characters long");
  }

  const validTypes = [
    "text",
    "textarea",
    "multiple-choice",
    "checkbox",
    "dropdown",
    "rating",
    "linear-scale",
  ];

  if (!question.type || !validTypes.includes(question.type)) {
    errors.push(`Invalid question type. Must be one of: ${validTypes.join(", ")}`);
  }

  // For choice-based questions, validate options
  if (
    ["multiple-choice", "checkbox", "dropdown"].includes(question.type) &&
    (!question.options || question.options.length < 2)
  ) {
    errors.push("Choice-based questions must have at least 2 options");
  }

  // For rating questions, validate min/max
  if (question.type === "rating") {
    if (question.min && question.max && question.min >= question.max) {
      errors.push("Rating min must be less than max");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate user data
 * @param {object} userData - User data to validate
 * @returns {object} Validation result with isValid and errors
 */
const validateUserData = (userData) => {
  const errors = [];

  if (!userData.email || !isValidEmail(userData.email)) {
    errors.push("Valid email is required");
  }

  if (!userData.fullName || userData.fullName.trim().length < 2) {
    errors.push("Full name must be at least 2 characters long");
  }

  if (!userData.password) {
    errors.push("Password is required");
  } else {
    const passwordError = validatePassword(userData.password);
    if (passwordError) {
      errors.push(passwordError);
    }
  }

  const validRoles = ["student", "instructor", "alumni", "employer", "admin"];
  if (!userData.role || !validRoles.includes(userData.role)) {
    errors.push(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  isValidEmail,
  validatePassword,
  sanitizeInput,
  formatName,
  validateFormData,
  validateQuestion,
  validateUserData,
};
