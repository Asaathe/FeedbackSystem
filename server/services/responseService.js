// Response Service
const db = require("../config/database");
const { queryDatabase } = require("../utils/helpers");

/**
 * Submit form response
 * @param {number} formId - Form ID
 * @param {number} userId - User ID submitting response
 * @param {array} answers - Array of answers
 * @returns {Promise<object>} Result with success status
 */
const submitFormResponse = async (formId, userId, answers) => {
  try {
    // Check if form exists and is active
    const forms = await queryDatabase(
      db,
      "SELECT * FROM Forms WHERE id = ? AND status = 'active'",
      [formId]
    );

    if (forms.length === 0) {
      return { success: false, message: "Form not found or not active" };
    }

    const form = forms[0];

    // Check if user has already submitted
    const existingResponses = await queryDatabase(
      db,
      "SELECT * FROM Form_Responses WHERE form_id = ? AND user_id = ?",
      [formId, userId]
    );

    if (existingResponses.length > 0) {
      return { success: false, message: "You have already submitted this form" };
    }

    // Check form date constraints
    const now = new Date();
    if (form.start_date && new Date(form.start_date) > now) {
      return { success: false, message: "Form is not yet open for submission" };
    }

    if (form.end_date && new Date(form.end_date) < now) {
      return { success: false, message: "Form submission period has ended" };
    }

    // Insert response
    const insertResult = await queryDatabase(
      db,
      `
      INSERT INTO Form_Responses (form_id, user_id, response_data, submitted_at)
      VALUES (?, ?, ?, NOW())
    `,
      [formId, userId, JSON.stringify(answers)]
    );

    return {
      success: true,
      message: "Response submitted successfully",
      responseId: insertResult.insertId,
    };
  } catch (error) {
    console.error("Submit response error:", error);
    return { success: false, message: "Failed to submit response" };
  }
};

/**
 * Get responses for a form
 * @param {number} formId - Form ID
 * @param {number} userId - User ID requesting responses
 * @returns {Promise<object>} Result with responses
 */
const getFormResponses = async (formId, userId) => {
  try {
    console.log("Get form responses for formId:", formId, "userId:", userId);

    // Check if user owns the form
    const forms = await queryDatabase(
      db,
      "SELECT created_by FROM Forms WHERE id = ?",
      [formId]
    );

    console.log("Form lookup result:", forms);

    if (forms.length === 0) {
      return { success: false, message: "Form not found", responses: [] };
    }

    if (forms[0].created_by !== userId) {
      console.log("Access denied: form owner is", forms[0].created_by, "requesting user is", userId);
      return { success: false, message: "Access denied", responses: [] };
    }

    // Get responses
    const responses = await queryDatabase(
      db,
      `
      SELECT 
        fr.*,
        u.email,
        u.full_name,
        u.role
      FROM Form_Responses fr
      LEFT JOIN Users u ON fr.user_id = u.id
      WHERE fr.form_id = ?
      ORDER BY fr.submitted_at DESC
    `,
      [formId]
    );

    console.log("Responses found:", responses.length);
    for (const r of responses) {
      console.log("Response", r.id, "answers raw:", r.answers, "type:", typeof r.answers);
    }

    return {
      success: true,
      responses: responses.map((r) => ({
        id: r.id,
        form_id: r.form_id,
        user_id: r.user_id,
        email: r.email,
        full_name: r.full_name,
        role: r.role,
        answers: r.response_data ? JSON.parse(r.response_data) : {},
        submitted_at: r.submitted_at,
      })),
    };
  } catch (error) {
    console.error("Get form responses error:", error);
    return { success: false, message: "Failed to get responses", responses: [] };
  }
};

/**
 * Get form submission status for a user
 * @param {number} formId - Form ID
 * @param {number} userId - User ID
 * @returns {Promise<object>} Result with submission status
 */
const getFormSubmissionStatus = async (formId, userId) => {
  try {
    // Get form details
    const forms = await queryDatabase(
      db,
      "SELECT * FROM Forms WHERE id = ?",
      [formId]
    );

    if (forms.length === 0) {
      return {
        success: false,
        canSubmit: false,
        form: null,
        issues: [{ type: "not_found", message: "Form not found" }],
      };
    }

    const form = forms[0];
    const issues = [];

    // Check if form is active
    if (form.status !== "active") {
      issues.push({
        type: "form_status",
        message: "Form is not active",
        currentStatus: form.status,
      });
    }

    // Check date constraints
    const now = new Date();
    if (form.start_date && new Date(form.start_date) > now) {
      issues.push({
        type: "not_started",
        message: "Form is not yet open for submission",
        startDate: form.start_date,
      });
    }

    if (form.end_date && new Date(form.end_date) < now) {
      issues.push({
        type: "expired",
        message: "Form submission period has ended",
        endDate: form.end_date,
      });
    }

    // Check if already submitted
    const existingResponses = await queryDatabase(
      db,
      "SELECT * FROM Form_Responses WHERE form_id = ? AND user_id = ?",
      [formId, userId]
    );

    if (existingResponses.length > 0) {
      issues.push({
        type: "already_submitted",
        message: "You have already submitted this form",
        submittedAt: existingResponses[0].submitted_at,
      });
    }

    return {
      success: true,
      canSubmit: issues.length === 0,
      form: {
        id: form.id,
        title: form.title,
        status: form.status,
        startDate: form.start_date,
        endDate: form.end_date,
      },
      issues,
    };
  } catch (error) {
    console.error("Get submission status error:", error);
    return {
      success: false,
      canSubmit: false,
      form: null,
      issues: [{ type: "error", message: "Failed to check submission status" }],
    };
  }
};

/**
 * Get shared responses for instructor
 * @param {number} userId - User ID
 * @returns {Promise<object>} Result with shared responses
 */
const getSharedResponses = async (userId) => {
  try {
    // Get user role
    const users = await queryDatabase(
      db,
      "SELECT role FROM Users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return { success: false, message: "User not found", responses: [] };
    }

    const userRole = users[0].role;

    // Only instructors and admins can see shared responses
    if (userRole !== "instructor" && userRole !== "admin") {
      return { success: false, message: "Access denied", responses: [] };
    }

    // Get shared responses (forms shared with instructors)
    const responses = await queryDatabase(
      db,
      `
      SELECT 
        f.id as form_id,
        f.title as form_title,
        f.category,
        COUNT(fr.id) as total_responses,
        GROUP_CONCAT(DISTINCT s.course_yr_section) as sections
      FROM Forms f
      LEFT JOIN Form_Responses fr ON f.id = fr.form_id
      LEFT JOIN Users u ON fr.user_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      WHERE f.status = 'active'
        AND f.target_audience IN ('Students', 'All Users')
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `
    );

    return {
      success: true,
      responses: responses.map((r) => ({
        id: r.form_id,
        formId: r.form_id,
        formTitle: r.form_title,
        category: r.category,
        sections: r.sections ? r.sections.split(",") : [],
        totalResponses: r.total_responses || 0,
        sharedBy: "Administrator",
        sharedDate: new Date().toISOString(),
      })),
    };
  } catch (error) {
    console.error("Get shared responses error:", error);
    return { success: false, message: "Failed to get shared responses", responses: [] };
  }
};

/**
 * Get detailed responses for a shared form
 * @param {number} sharedId - Shared form ID
 * @param {number} userId - User ID
 * @returns {Promise<object>} Result with detailed responses
 */
const getSharedResponsesDetails = async (sharedId, userId) => {
  try {
    // Check if user is instructor or admin
    const users = await queryDatabase(
      db,
      "SELECT role FROM Users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return { success: false, message: "User not found", responses: [] };
    }

    const userRole = users[0].role;

    if (userRole !== "instructor" && userRole !== "admin") {
      return { success: false, message: "Access denied", responses: [] };
    }

    // Get detailed responses
    const responses = await queryDatabase(
      db,
      `
      SELECT 
        fr.id,
        fr.answers,
        fr.submitted_at,
        u.email,
        u.full_name,
        s.course_yr_section,
        s.department
      FROM Form_Responses fr
      LEFT JOIN Users u ON fr.user_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      WHERE fr.form_id = ?
      ORDER BY fr.submitted_at DESC
    `,
      [sharedId]
    );

    return {
      success: true,
      responses: responses.map((r) => ({
        id: r.id,
        answers: r.response_data ? JSON.parse(r.response_data) : {},
        submittedDate: r.submitted_at,
        email: r.email,
        fullName: r.full_name,
        courseSection: r.course_yr_section,
        department: r.department,
      })),
    };
  } catch (error) {
    console.error("Get shared responses details error:", error);
    return { success: false, message: "Failed to get response details", responses: [] };
  }
};

/**
 * Delete form response
 * @param {number} responseId - Response ID
 * @param {number} userId - User ID deleting response
 * @returns {Promise<object>} Result with success status
 */
const deleteResponse = async (responseId, userId) => {
  try {
    // Check if response exists and belongs to user
    const responses = await queryDatabase(
      db,
      "SELECT * FROM Form_Responses WHERE id = ?",
      [responseId]
    );

    if (responses.length === 0) {
      return { success: false, message: "Response not found" };
    }

    if (responses[0].user_id !== userId) {
      return { success: false, message: "Access denied" };
    }

    // Delete response
    await queryDatabase(db, "DELETE FROM Form_Responses WHERE id = ?", [responseId]);

    return { success: true, message: "Response deleted successfully" };
  } catch (error) {
    console.error("Delete response error:", error);
    return { success: false, message: "Failed to delete response" };
  }
};

/**
 * Get user's own responses
 * @param {number} userId - User ID
 * @returns {Promise<object>} Result with user's responses
 */
const getUserResponses = async (userId) => {
  try {
    const responses = await queryDatabase(
      db,
      `
      SELECT 
        fr.*,
        f.title as form_title,
        f.category
      FROM Form_Responses fr
      LEFT JOIN Forms f ON fr.form_id = f.id
      WHERE fr.user_id = ?
      ORDER BY fr.submitted_at DESC
    `,
      [userId]
    );

    return {
      success: true,
      responses: responses.map((r) => ({
        id: r.id,
        form_id: r.form_id,
        form_title: r.form_title,
        category: r.category,
        answers: r.response_data ? JSON.parse(r.response_data) : {},
        submitted_at: r.submitted_at,
      })),
    };
  } catch (error) {
    console.error("Get user responses error:", error);
    return { success: false, message: "Failed to get user responses", responses: [] };
  }
};

module.exports = {
  submitFormResponse,
  getFormResponses,
  getFormSubmissionStatus,
  getUserResponses,
  getSharedResponses,
  getSharedResponsesDetails,
  deleteResponse,
};
