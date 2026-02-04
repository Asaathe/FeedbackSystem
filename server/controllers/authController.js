// Authentication Controller
const { body, validationResult } = require("express-validator");
const authService = require("../services/authService");

/**
 * Register new user
 */
const register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const result = await authService.registerUser(req.body);

    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Register controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await authService.loginUser(email, password);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(401).json(result);
    }
  } catch (error) {
    console.error("Login controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await authService.getUserProfile(userId);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    console.error("Get profile controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const updates = req.body;

    const result = await authService.updateUserProfile(userId, updates);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Update profile controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Validate registration input
 */
const validateRegistration = [
  body("email").isEmail().normalizeEmail().withMessage("Invalid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("fullName")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Full name must be at least 2 characters"),
  body("role")
    .isIn(["student", "instructor", "alumni", "employer"])
    .withMessage("Invalid role"),
  body("student_id")
    .if(body("role").equals("student"))
    .notEmpty()
    .withMessage("Student ID is required"),
  body("course_year_section")
    .if(body("role").equals("student"))
    .notEmpty()
    .withMessage("Course Year Section is required"),
  body("instructor_id")
    .if(body("role").equals("instructor"))
    .notEmpty()
    .withMessage("Instructor ID is required"),
  body("department")
    .if(body("role").equals("instructor"))
    .notEmpty()
    .withMessage("Department is required"),
  body("company_name")
    .if(body("role").equals("employer"))
    .notEmpty()
    .withMessage("Company name is required"),
  body("industry")
    .if(body("role").equals("employer"))
    .notEmpty()
    .withMessage("Industry is required"),
  body("degree")
    .if(body("role").equals("alumni"))
    .notEmpty()
    .withMessage("Degree is required"),
  body("alumni_company_name")
    .if(body("role").equals("alumni"))
    .notEmpty()
    .withMessage("Company name is required"),
];

/**
 * Validate login input
 */
const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Invalid email address"),
  body("password").notEmpty().withMessage("Password is required"),
];

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  validateRegistration,
  validateLogin,
};
