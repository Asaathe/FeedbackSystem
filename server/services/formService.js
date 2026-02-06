// Form Service
const db = require("../config/database");
const { queryDatabase, executeTransaction } = require("../utils/helpers");
const { formatFormResponse, formatQuestionResponse, formatPagination } = require("../utils/formatting");
const { validateFormData, validateQuestion } = require("../utils/validation");

/**
 * Get all forms with filtering and pagination
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Result with forms and pagination
 */
const getAllForms = async (filters = {}) => {
  try {
    const {
      type = "all",
      status = "all",
      search = "",
      page = 1,
      limit = 10,
    } = filters;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    // Filter by type (templates vs custom)
    if (type === "templates") {
      conditions.push("f.is_template = TRUE");
    } else if (type === "custom") {
      conditions.push("f.is_template = FALSE");
    }

    // Filter by status
    if (status !== "all") {
      conditions.push("f.status = ?");
      params.push(status);
    }

    // Search filter
    if (search) {
      conditions.push("(f.title LIKE ? OR f.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM Forms f
      ${whereClause}
    `;
    const countResult = await queryDatabase(db, countQuery, params);
    const total = countResult[0].total;

    // Get forms with pagination
    const formsQuery = `
      SELECT 
        f.*,
        u.full_name as creator_name,
        (SELECT COUNT(*) FROM Questions WHERE form_id = f.id) as question_count,
        (SELECT COUNT(*) FROM Form_Responses WHERE form_id = f.id) as submission_count
      FROM Forms f
      LEFT JOIN Users u ON f.created_by = u.id
      ${whereClause}
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const forms = await queryDatabase(db, formsQuery, [...params, limit, offset]);

    return {
      success: true,
      forms: forms.map(formatFormResponse),
      pagination: formatPagination(total, page, limit),
    };
  } catch (error) {
    console.error("Get forms error:", error);
    return { success: false, message: "Failed to get forms", forms: [] };
  }
};

/**
 * Get single form by ID
 * @param {number} formId - Form ID
 * @returns {Promise<object>} Result with form data
 */
const getFormById = async (formId) => {
  try {
    // Get form details
    const forms = await queryDatabase(
      db,
      `
      SELECT 
        f.*,
        u.full_name as creator_name,
        (SELECT COUNT(*) FROM Questions WHERE form_id = f.id) as question_count,
        (SELECT COUNT(*) FROM Form_Responses WHERE form_id = f.id) as submission_count
      FROM Forms f
      LEFT JOIN Users u ON f.created_by = u.id
      WHERE f.id = ?
    `,
      [formId]
    );

    if (forms.length === 0) {
      return { success: false, message: "Form not found" };
    }

    const form = formatFormResponse(forms[0]);

    // Get questions
    const questions = await queryDatabase(
      db,
      `
      SELECT 
        q.*
      FROM Questions q
      WHERE q.form_id = ?
      ORDER BY q.order_index ASC
    `,
      [formId]
    );

    // Get options for each question
    for (const question of questions) {
      const options = await queryDatabase(
        db,
        `
        SELECT 
          id,
          option_text,
          order_index
        FROM Question_Options
        WHERE question_id = ?
        ORDER BY order_index ASC
      `,
        [question.id]
      );
      question.options = options;
    }

    form.questions = questions.map(formatQuestionResponse);

    return { success: true, form };
  } catch (error) {
    console.error("Get form error:", error);
    return { success: false, message: "Failed to get form" };
  }
};

/**
 * Create new form
 * @param {object} formData - Form data
 * @param {number} userId - User ID creating the form
 * @returns {Promise<object>} Result with success status and form ID
 */
const createForm = async (formData, userId) => {
  try {
    const {
      title,
      description,
      category,
      targetAudience,
      startDate,
      endDate,
      questions = [],
      imageUrl,
      isTemplate = false,
    } = formData;

    // Validate form data
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(", ") };
    }

    // Validate questions
    for (const question of questions) {
      const questionValidation = validateQuestion(question);
      if (!questionValidation.isValid) {
        return {
          success: false,
          message: `Question validation failed: ${questionValidation.errors.join(", ")}`,
        };
      }
    }

    // Insert form
    const insertResult = await queryDatabase(
      db,
      `
      INSERT INTO Forms (
        title, description, category, target_audience, 
        start_date, end_date, image_url, is_template, 
        status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, NOW(), NOW())
    `,
      [
        title,
        description,
        category,
        targetAudience,
        startDate || null,
        endDate || null,
        imageUrl || null,
        isTemplate,
        userId,
      ]
    );

    const formId = insertResult.insertId;

    // Insert questions
    if (questions.length > 0) {
      for (const question of questions) {
        const questionResult = await queryDatabase(
          db,
          `
          INSERT INTO Questions (
            form_id, question_text, question_type, description, 
            required, order_index, min_value, max_value
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            formId,
            question.question,
            question.type,
            question.description || null,
            question.required ? 1 : 0,
            question.order_index || 0,
            question.min || question.minValue || null,
            question.max || question.maxValue || null,
          ]
        );

        const questionId = questionResult.insertId;

        // Insert options for choice-based questions
        if (
          ["multiple-choice", "checkbox", "dropdown"].includes(question.type) &&
          question.options &&
          question.options.length > 0
        ) {
          for (const option of question.options) {
            await queryDatabase(
              db,
              `
              INSERT INTO Question_Options (question_id, option_text, order_index)
              VALUES (?, ?, ?)
            `,
              [questionId, option.option_text || option, option.order_index || 0]
            );
          }
        }
      }
    }

    return {
      success: true,
      message: "Form created successfully",
      formId,
    };
  } catch (error) {
    console.error("Create form error:", error);
    return { success: false, message: "Failed to create form" };
  }
};

/**
 * Update existing form
 * @param {number} formId - Form ID
 * @param {object} updates - Fields to update
 * @param {number} userId - User ID making the update
 * @returns {Promise<object>} Result with success status
 */
const updateForm = async (formId, updates, userId) => {
  try {
    // Check if user owns the form
    const forms = await queryDatabase(
      db,
      "SELECT created_by FROM Forms WHERE id = ?",
      [formId]
    );

    if (forms.length === 0) {
      return { success: false, message: "Form not found" };
    }

    if (forms[0].created_by !== userId) {
      return { success: false, message: "Access denied" };
    }

    // Build update query
    const allowedFields = [
      "title",
      "description",
      "category",
      "target_audience",
      "start_date",
      "end_date",
      "image_url",
      "status",
    ];
    const updateFields = [];
    const updateValues = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return { success: false, message: "No valid fields to update" };
    }

    updateFields.push("updated_at = NOW()");
    updateValues.push(formId);

    await queryDatabase(
      db,
      `UPDATE Forms SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    return { success: true, message: "Form updated successfully" };
  } catch (error) {
    console.error("Update form error:", error);
    return { success: false, message: "Failed to update form" };
  }
};

/**
 * Delete form
 * @param {number} formId - Form ID
 * @param {number} userId - User ID deleting the form
 * @returns {Promise<object>} Result with success status
 */
const deleteForm = async (formId, userId) => {
  try {
    // Check if user owns the form
    const forms = await queryDatabase(
      db,
      "SELECT created_by FROM Forms WHERE id = ?",
      [formId]
    );

    if (forms.length === 0) {
      return { success: false, message: "Form not found" };
    }

    if (forms[0].created_by !== userId) {
      return { success: false, message: "Access denied" };
    }

    // Delete form (cascade will handle related records)
    await queryDatabase(db, "DELETE FROM Forms WHERE id = ?", [formId]);

    return { success: true, message: "Form deleted successfully" };
  } catch (error) {
    console.error("Delete form error:", error);
    return { success: false, message: "Failed to delete form" };
  }
};

/**
 * Duplicate form
 * @param {number} formId - Form ID to duplicate
 * @param {number} userId - User ID duplicating the form
 * @returns {Promise<object>} Result with success status and new form ID
 */
const duplicateForm = async (formId, userId) => {
  try {
    // Get original form
    const originalForm = await getFormById(formId);
    if (!originalForm.success) {
      return { success: false, message: "Form not found" };
    }

    const form = originalForm.form;

    // Create new form with copied data
    const newFormData = {
      title: `${form.title} (Copy)`,
      description: form.description,
      category: form.category,
      targetAudience: form.target_audience,
      startDate: form.start_date,
      endDate: form.end_date,
      questions: form.questions,
      imageUrl: form.image_url,
      isTemplate: false,
    };

    const result = await createForm(newFormData, userId);

    if (result.success) {
      return {
        success: true,
        message: "Form duplicated successfully",
        formId: result.formId,
      };
    }

    return result;
  } catch (error) {
    console.error("Duplicate form error:", error);
    return { success: false, message: "Failed to duplicate form" };
  }
};

/**
 * Save form as template
 * @param {number} formId - Form ID
 * @param {number} userId - User ID saving as template
 * @returns {Promise<object>} Result with success status
 */
const saveAsTemplate = async (formId, userId) => {
  try {
    // Check if user owns the form
    const forms = await queryDatabase(
      db,
      "SELECT created_by FROM Forms WHERE id = ?",
      [formId]
    );

    if (forms.length === 0) {
      return { success: false, message: "Form not found" };
    }

    if (forms[0].created_by !== userId) {
      return { success: false, message: "Access denied" };
    }

    // Update form to be a template
    await queryDatabase(
      db,
      "UPDATE Forms SET is_template = TRUE, status = 'active' WHERE id = ?",
      [formId]
    );

    return {
      success: true,
      message: "Form saved as template successfully",
      templateId: formId,
    };
  } catch (error) {
    console.error("Save as template error:", error);
    return { success: false, message: "Failed to save as template" };
  }
};

/**
 * Deploy form (change status to active and create assignments)
 */
const deployForm = async (formId, userId, deploymentData = {}) => {
  try {
    // Check if form exists and user owns it
    const forms = await queryDatabase(
      db,
      "SELECT * FROM Forms WHERE id = ?",
      [formId]
    );

    if (forms.length === 0) {
      return { success: false, message: "Form not found" };
    }

    if (forms[0].created_by !== userId) {
      return { success: false, message: "Access denied" };
    }

    const form = forms[0];
    const { targetFilters, startDate, endDate } = deploymentData;

    // Update form status to active and set dates
    await queryDatabase(
      db,
      "UPDATE Forms SET status = 'active', start_date = ?, end_date = ?, updated_at = NOW() WHERE id = ?",
      [startDate || form.start_date, endDate || form.end_date, formId]
    );

    // Remove all existing assignments for this form before creating new ones
    await queryDatabase(
      db,
      "DELETE FROM form_assignments WHERE form_id = ?",
      [formId]
    );

    // Create assignment records for all matching users
    let assignedCount = 0;

    if (targetFilters && targetFilters.target_audience) {
      const targetAudience = targetFilters.target_audience;

      // Build query to get users matching target audience
      let userQuery = "";
      let queryParams = [];

      if (targetAudience === "All Users") {
        userQuery = `
          SELECT u.id
          FROM Users u
          WHERE u.status = 'active'
        `;
      } else if (targetAudience === "Students") {
        userQuery = `
          SELECT u.id
          FROM Users u
          LEFT JOIN students s ON u.id = s.user_id
          LEFT JOIN course_management cm ON s.program_id = cm.id
          WHERE u.role = 'student' AND u.status = 'active'
        `;
      } else if (targetAudience === "Instructors") {
        userQuery = `
          SELECT u.id
          FROM Users u
          LEFT JOIN instructors i ON u.id = i.user_id
          WHERE u.role = 'instructor' AND u.status = 'active'
        `;
      } else if (targetAudience === "Alumni") {
        userQuery = `
          SELECT u.id
          FROM Users u
          LEFT JOIN alumni a ON u.id = a.user_id
          WHERE u.role = 'alumni' AND u.status = 'active'
        `;
      } else if (targetAudience.startsWith("Students - ")) {
        // Specific course/year/section
        const courseSection = targetAudience.replace("Students - ", "");
        userQuery = `
          SELECT u.id
          FROM Users u
          LEFT JOIN students s ON u.id = s.user_id
          LEFT JOIN course_management cm ON s.program_id = cm.id
          WHERE u.role = 'student' AND u.status = 'active' AND cm.course_section = ?
        `;
        queryParams.push(courseSection);
      } else if (targetAudience.startsWith("Instructors - ")) {
        // Specific department
        const department = targetAudience.replace("Instructors - ", "");
        userQuery = `
          SELECT u.id
          FROM Users u
          LEFT JOIN instructors i ON u.id = i.user_id
          WHERE u.role = 'instructor' AND u.status = 'active' AND i.department = ?
        `;
        queryParams.push(department);
      } else if (targetAudience.startsWith("Alumni - ")) {
        // Specific company
        const company = targetAudience.replace("Alumni - ", "");
        userQuery = `
          SELECT u.id
          FROM Users u
          LEFT JOIN alumni a ON u.id = a.user_id
          WHERE u.role = 'alumni' AND u.status = 'active' AND a.company = ?
        `;
        queryParams.push(company);
      }

      if (userQuery) {
        const users = await queryDatabase(db, userQuery, queryParams);

        // Create assignment records for each user
        if (users.length > 0) {
          const assignments = users.map(user => [formId, user.id, new Date()]);
          
          await queryDatabase(
            db,
            "INSERT IGNORE INTO form_assignments (form_id, user_id, assigned_at) VALUES ?",
            [assignments]
          );
          
          assignedCount = users.length;
        }
      }
    }

    return {
      success: true,
      message: `Form deployed successfully and assigned to ${assignedCount} users`,
      formId,
      assignedCount,
    };
  } catch (error) {
    console.error("Deploy form error:", error);
    console.error("Error details:", {
      formId,
      userId,
      deploymentData,
      errorMessage: error.message,
      errorCode: error.code,
      sqlMessage: error.sqlMessage
    });
    return { 
      success: false, 
      message: error.sqlMessage || error.message || "Failed to deploy form" 
    };
  }
};

/**
 * Get all form categories
 */
const getFormCategories = async () => {
  try {
    const categories = await queryDatabase(
      db,
      "SELECT * FROM form_categories ORDER BY name ASC"
    );
    return { success: true, categories };
  } catch (error) {
    console.error("Get form categories error:", error);
    return { success: false, message: "Failed to get categories", categories: [] };
  }
};

/**
 * Add a new form category
 */
const addFormCategory = async (name) => {
  try {
    // Check if category already exists
    const existing = await queryDatabase(
      db,
      "SELECT * FROM form_categories WHERE name = ?",
      [name]
    );
    if (existing.length > 0) {
      return { success: false, message: "Category already exists" };
    }
    const result = await queryDatabase(
      db,
      "INSERT INTO form_categories (name) VALUES (?)",
      [name]
    );
    return {
      success: true,
      message: "Category added successfully",
      category: { id: result.insertId, name },
    };
  } catch (error) {
    console.error("Add form category error:", error);
    return { success: false, message: "Failed to add category" };
  }
};

/**
 * Delete a form category
 */
const deleteFormCategory = async (id) => {
  try {
    await queryDatabase(
      db,
      "DELETE FROM form_categories WHERE id = ?",
      [id]
    );
    return { success: true, message: "Category deleted successfully" };
  } catch (error) {
    console.error("Delete form category error:", error);
    return { success: false, message: "Failed to delete category" };
  }
};

module.exports = {
  getAllForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  duplicateForm,
  saveAsTemplate,
  deployForm,
  getFormCategories,
  addFormCategory,
  deleteFormCategory,
};
