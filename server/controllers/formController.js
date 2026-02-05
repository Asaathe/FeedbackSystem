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
  body("description")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters"),
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
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters"),
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
    const { userIds } = req.body;
    
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

    // Insert form assignments (only form_id, user_id, assigned_at)
    const assignments = userIds.map(userId => [id, userId, new Date()]);
    
    await new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO form_assignments (form_id, user_id, assigned_at) VALUES ?",
        [assignments],
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

module.exports = {
  getAllForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  duplicateForm,
  saveAsTemplate,
  deployForm,
  assignFormToUsers,
  validateFormCreation,
  validateFormUpdate,
  getFormCategories,
  addFormCategory,
  deleteFormCategory,
};
