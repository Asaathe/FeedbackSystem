// Formatting Utility Functions

/**
 * Format name to title case
 * @param {string} name - Name to format
 * @returns {string} Formatted name
 */
const formatName = (name) => {
  if (!name || typeof name !== "string") return "";
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type: 'short', 'long', 'time'
 * @returns {string} Formatted date
 */
const formatDate = (date, format = "short") => {
  if (!date) return "";

  const d = new Date(date);
  if (isNaN(d.getTime())) return "";

  const options = {
    short: { year: "numeric", month: "short", day: "numeric" },
    long: {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    time: { hour: "2-digit", minute: "2-digit" },
  };

  return d.toLocaleDateString("en-US", options[format] || options.short);
};

/**
 * Format form data for API response
 * @param {object} form - Form data from database
 * @returns {object} Formatted form data
 */
const formatFormResponse = (form) => {
  return {
    id: form.id,
    title: form.title,
    description: form.description,
    ai_description: form.ai_description || "",
    category: form.category,
    target_audience: form.target_audience,
    status: form.status,
    image_url: form.image_url,
    submission_count: form.submission_count || 0,
    created_at: form.created_at,
    updated_at: form.updated_at,
    question_count: form.question_count || 0,
    creator_name: form.creator_name,
    is_template: form.is_template || false,
    start_date: form.start_date,
    end_date: form.end_date,
    created_by: form.created_by,
  };
};

/**
 * Format question data for API response
 * @param {object} question - Question data from database
 * @returns {object} Formatted question data
 */
const formatQuestionResponse = (question) => {
  return {
    id: question.id,
    question: question.question_text || question.question,
    type: question.question_type || question.type,
    description: question.description,
    required: question.required === 1 || question.required === true,
    order_index: question.order_index,
    options: question.options || [],
    min: question.min_value || question.min,
    max: question.max_value || question.max,
  };
};

/**
 * Format user data for API response
 * @param {object} user - User data from database
 * @returns {object} Formatted user data
 */
const formatUserResponse = (user) => {
  const formatted = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    status: user.status,
    createdAt: user.registration_date || user.created_at,
  };

  // Add lastLogin only if it exists in the user object
  if (user.last_login !== undefined) {
    formatted.lastLogin = user.last_login;
  }

  // Add role-specific fields for students
  if (user.role === 'student') {
    if (user.studentID !== undefined) formatted.studentId = user.studentID;
    if (user.program_id !== undefined) formatted.programId = user.program_id;
    if (user.course_section !== undefined) formatted.courseYrSection = user.course_section;
    if (user.course_department !== undefined) formatted.department = user.course_department;
    if (user.contact_number !== undefined) formatted.contactNumber = user.contact_number;
    if (user.course_section !== undefined) formatted.display_label = user.course_section;
  }

  // Add role-specific fields for instructors
  if (user.role === 'instructor') {
    if (user.instructor_id !== undefined) formatted.instructorId = user.instructor_id;
    if (user.department !== undefined) formatted.department = user.department;
  }

  // Add role-specific fields for alumni
  if (user.role === 'alumni') {
    if (user.grad_year !== undefined) formatted.gradYear = user.grad_year;
    if (user.degree !== undefined) formatted.degree = user.degree;
    if (user.company !== undefined) formatted.alumniCompany = user.company;
  }

  // Add role-specific fields for employers
  if (user.role === 'employer') {
    if (user.companyname !== undefined) formatted.companyName = user.companyname;
    if (user.industry !== undefined) formatted.industry = user.industry;
  }

  return formatted;
};

/**
 * Format pagination metadata
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Pagination metadata
 */
const formatPagination = (total, page, limit) => {
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
const truncateText = (text, maxLength = 100, suffix = "...") => {
  if (!text || typeof text !== "string") return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + suffix;
};

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Sanitize and format form input
 * @param {object} data - Raw form data
 * @returns {object} Sanitized and formatted data
 */
const sanitizeFormData = (data) => {
  const sanitized = {};

  // Sanitize string fields
  const stringFields = ["title", "description", "category", "targetAudience"];
  stringFields.forEach((field) => {
    if (data[field]) {
      sanitized[field] = data[field].trim();
    }
  });

  // Handle questions array
  if (data.questions && Array.isArray(data.questions)) {
    sanitized.questions = data.questions.map((q) => ({
      question: q.question ? q.question.trim() : "",
      type: q.type,
      description: q.description ? q.description.trim() : "",
      required: Boolean(q.required),
      order_index: q.order_index || 0,
      options: q.options || [],
      min: q.min,
      max: q.max,
    }));
  }

  // Handle boolean fields
  const booleanFields = ["isTemplate", "is_template"];
  booleanFields.forEach((field) => {
    if (data[field] !== undefined) {
      sanitized[field] = Boolean(data[field]);
    }
  });

  // Handle date fields
  const dateFields = ["startDate", "endDate", "start_date", "end_date"];
  dateFields.forEach((field) => {
    if (data[field]) {
      sanitized[field] = data[field];
    }
  });

  return sanitized;
};

module.exports = {
  formatName,
  formatDate,
  formatFormResponse,
  formatQuestionResponse,
  formatUserResponse,
  formatPagination,
  truncateText,
  formatFileSize,
  sanitizeFormData,
};
