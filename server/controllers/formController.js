// Form Controller
const { body, validationResult } = require("express-validator");
const formService = require("../services/formService");

/**
 * Get all forms
 */
const getAllForms = async (req, res) => {
  try {
    const { type, status, search, page, limit } = req.query;

    const result = await formService.getAllForms({
      type,
      status,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get all forms controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      forms: [],
    });
  }
};

/**
 * Get single form by ID
 */
const getFormById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await formService.getFormById(id);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    console.error("Get form controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Create new form
 */
const createForm = async (req, res) => {
  try {
    const userId = req.userId;
    const formData = req.body;

    const result = await formService.createForm(formData, userId);

    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Create form controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Update form
 */
const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updates = req.body;

    const result = await formService.updateForm(id, updates, userId);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Update form controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Delete form
 */
const deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await formService.deleteForm(id, userId);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Delete form controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Duplicate form
 */
const duplicateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await formService.duplicateForm(id, userId);

    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Duplicate form controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Save form as template
 */
const saveAsTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const result = await formService.saveAsTemplate(id, userId);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Save as template controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Deploy form (change status to active)
 */
const deployForm = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const deploymentData = req.body;

    const result = await formService.deployForm(id, userId, deploymentData);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Deploy form controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Validate form creation input
 */
const validateFormCreation = [
  body("title")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters"),
  body("category").notEmpty().withMessage("Category is required"),
  body("targetAudience")
    .notEmpty()
    .withMessage("Target audience is required"),
];

/**
 * Validate form update input
 */
const validateFormUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage("Title must be at least 3 characters"),
  body("category").optional().notEmpty().withMessage("Category is required"),
  body("targetAudience")
    .optional()
    .notEmpty()
    .withMessage("Target audience is required"),
];

/**
 * Get all form categories
 */
const getFormCategories = async (req, res) => {
  try {
    const result = await formService.getFormCategories();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Get form categories controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      categories: [],
    });
  }
};

/**
 * Add a new form category
 */
const addFormCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }
    const result = await formService.addFormCategory(name);
    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Add form category controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Delete a form category
 */
const deleteFormCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await formService.deleteFormCategory(id);
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Delete form category controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Assign form to specific users
 */
const assignFormToUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds, targetAudience, startDate, endDate, department, courseYearSection } = req.body;

    console.log('📋 Server: assignFormToUsers called with:', {
      id,
      userIds,
      targetAudience,
      startDate,
      endDate,
      department,
      courseYearSection,
    });
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User IDs are required",
      });
    }

    const db = require("../config/database");
    
    // Check if form exists
    const formCheck = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM Forms WHERE id = ?", [id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!formCheck || formCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    const form = formCheck[0];

    // Insert form assignments (only form_id, user_id, assigned_at)
    const assignments = userIds.map(userId => [id, userId, new Date()]);
    
    await new Promise((resolve, reject) => {
      db.query(
        "INSERT IGNORE INTO form_assignments (form_id, user_id, assigned_at) VALUES ?",
        [assignments],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    // Create deployment record to store deployment data
    const deploymentFilters = {
      target_audience: targetAudience,
      department: department || null,
      course_year_section: courseYearSection || null,
      company: null,
    };

    const deploymentStartDate = startDate || form.start_date;
    const deploymentEndDate = endDate || form.end_date;

    console.log('📋 Server: Deployment values to store:', {
      deploymentStartDate,
      deploymentEndDate,
      formStartDate: form.start_date,
      formEndDate: form.end_date,
    });

    await new Promise((resolve, reject) => {
      db.query(
        `
        INSERT INTO form_deployments (
          form_id, deployed_by, start_date, end_date, target_filters, deployment_status
        ) VALUES (?, ?, ?, ?, ?, 'active')
        ON DUPLICATE KEY UPDATE
          start_date = VALUES(start_date),
          end_date = VALUES(end_date),
          target_filters = VALUES(target_filters),
          deployment_status = VALUES(deployment_status)
        `,
        [
          id,
          req.userId,
          deploymentStartDate,
          deploymentEndDate,
          JSON.stringify(deploymentFilters)
        ],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    return res.status(200).json({
      success: true,
      message: `Form assigned to ${userIds.length} users`,
      assignedCount: userIds.length,
    });
  } catch (error) {
    console.error("Assign form to users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign form to users",
    });
  }
};

/**
 * Share form responses with instructors
 */
const shareResponsesWithInstructors = async (req, res) => {
  try {
    const { id } = req.params;
    const { instructorIds } = req.body;
    const userId = req.userId;

    if (!instructorIds || !Array.isArray(instructorIds) || instructorIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Instructor IDs are required",
      });
    }

    const db = require("../config/database");

    // Check if form exists
    const formCheck = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM Forms WHERE id = ?", [id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!formCheck || formCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    // Check if user owns the form
    if (formCheck[0].created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Insert shared_responses records
    const shares = instructorIds.map(instructorId => [id, instructorId, userId, new Date()]);

    await new Promise((resolve, reject) => {
      db.query(
        "INSERT IGNORE INTO shared_responses (form_id, shared_with_instructor_id, shared_by, shared_at) VALUES ?",
        [shares],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    return res.status(200).json({
      success: true,
      message: `Responses shared with ${instructorIds.length} instructor${instructorIds.length !== 1 ? "s" : ""}`,
    });
  } catch (error) {
    console.error("Share responses controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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
  shareResponsesWithInstructors,
};
