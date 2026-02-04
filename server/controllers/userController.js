// User Controller
const { body, validationResult } = require("express-validator");
const userService = require("../services/userService");
const db = require("../config/database");
const { queryDatabase } = require("../utils/helpers");

/**
 * Get filtered users
 */
const getFilteredUsers = async (req, res) => {
  try {
    const filters = req.query;

    const result = await userService.getFilteredUsers(filters);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get filtered users controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      users: [],
      count: 0,
    });
  }
};

/**
 * Get assigned forms for user
 */
const getAssignedForms = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await userService.getAssignedForms(userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get assigned forms controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      forms: [],
    });
  }
};

/**
 * Get user's form responses
 */
const getUserResponses = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await userService.getUserResponses(userId);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get user responses controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      responses: [],
    });
  }
};

/**
 * Get all users (admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const filters = req.query;

    const result = await userService.getAllUsers(filters);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Get all users controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      users: [],
    });
  }
};

/**
 * Update user status (admin only)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const result = await userService.updateUserStatus(id, status);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Update user status controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Delete user (admin only)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await userService.deleteUser(id);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Delete user controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Approve user (set status to active)
 */
const approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await userService.updateUserStatus(id, 'active');

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Approve user controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Reject user (set status to inactive)
 */
const rejectUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await userService.updateUserStatus(id, 'inactive');

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Reject user controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Update user (admin only) - updates user profile and role-specific data
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      role,
      department,
      phoneNumber,
      address,
      profilePicture,
      studentId,
      course_year_section,
      instructorId,
      employeeId,
      companyName,
      graduationYear,
    } = req.body;

    // First check if user exists
    const existingUsers = await queryDatabase(
      db,
      "SELECT * FROM Users WHERE id = ?",
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUser = existingUsers[0];

    // Update users table
    if (fullName || email) {
      const updateFields = [];
      const updateValues = [];

      if (fullName) {
        updateFields.push("full_name = ?");
        updateValues.push(fullName);
      }
      if (email) {
        updateFields.push("email = ?");
        updateValues.push(email);
      }

      if (updateFields.length > 0) {
        updateValues.push(id);
        await queryDatabase(
          db,
          `UPDATE Users SET ${updateFields.join(", ")} WHERE id = ?`,
          updateValues
        );
      }
    }

    // Update role-specific data
    if (role === 'student') {
      // Check if student record exists
      const studentRecords = await queryDatabase(
        db,
        "SELECT * FROM students WHERE user_id = ?",
        [id]
      );

      if (studentRecords.length > 0) {
        // Update existing student record
        await queryDatabase(
          db,
          `UPDATE students SET 
            studentID = ?, 
            course_yr_section = ?, 
            department = ?,
            contact_number = ?
          WHERE user_id = ?`,
          [
            studentId || studentRecords[0].studentID,
            course_year_section || studentRecords[0].course_yr_section,
            department || studentRecords[0].department,
            phoneNumber || studentRecords[0].contact_number,
            id
          ]
        );
      } else {
        // Create new student record
        await queryDatabase(
          db,
          `INSERT INTO students (user_id, studentID, course_yr_section, department, contact_number)
           VALUES (?, ?, ?, ?, ?)`,
          [id, studentId, course_year_section, department, phoneNumber]
        );
      }
    } else if (role === 'instructor') {
      // Check if instructor record exists
      const instructorRecords = await queryDatabase(
        db,
        "SELECT * FROM instructors WHERE user_id = ?",
        [id]
      );

      if (instructorRecords.length > 0) {
        // Update existing instructor record
        await queryDatabase(
          db,
          `UPDATE instructors SET 
            instructor_id = ?, 
            department = ?
          WHERE user_id = ?`,
          [instructorId || employeeId || instructorRecords[0].instructor_id, department || instructorRecords[0].department, id]
        );
      } else {
        // Create new instructor record
        await queryDatabase(
          db,
          `INSERT INTO instructors (user_id, instructor_id, department)
           VALUES (?, ?, ?)`,
          [id, instructorId || employeeId, department]
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update user controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Validate user filter input
 */
const validateUserFilter = [
  body("role")
    .optional()
    .isIn(["student", "instructor", "alumni", "employer", "admin"])
    .withMessage("Invalid role"),
  body("course").optional().trim(),
  body("year").optional().trim(),
  body("section").optional().trim(),
  body("grade").optional().trim(),
  body("course_year_section").optional().trim(),
  body("department").optional().trim(),
  body("company").optional().trim(),
];

/**
 * Validate user status update input
 */
const validateUserStatusUpdate = [
  body("status")
    .isIn(["active", "inactive", "pending", "suspended"])
    .withMessage("Invalid status"),
];

module.exports = {
  getFilteredUsers,
  getAssignedForms,
  getUserResponses,
  getAllUsers,
  updateUser,
  updateUserStatus,
  deleteUser,
  validateUserFilter,
  validateUserStatusUpdate,
  approveUser,
  rejectUser,
};
