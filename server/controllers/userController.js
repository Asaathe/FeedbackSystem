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
      program_id,
      instructorId,
      employeeId,
      companyName,
      graduationYear,
      status,
    } = req.body;

    // First check if user exists
    const existingUsers = await queryDatabase(
      db,
      "SELECT * FROM users WHERE id = ?",
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
    if (fullName || email || status) {
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
      if (status) {
        updateFields.push("status = ?");
        updateValues.push(status);
      }

      if (updateFields.length > 0) {
        updateValues.push(id);
        await queryDatabase(
          db,
          `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
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
        const studentUpdateFields = [];
        const studentUpdateValues = [];

        if (studentId) {
          studentUpdateFields.push("studentID = ?");
          studentUpdateValues.push(studentId);
        }
        if (program_id) {
          studentUpdateFields.push("program_id = ?");
          studentUpdateValues.push(program_id);
        }
        if (phoneNumber) {
          studentUpdateFields.push("contact_number = ?");
          studentUpdateValues.push(phoneNumber);
        }

        if (studentUpdateFields.length > 0) {
          studentUpdateValues.push(id);
          await queryDatabase(
            db,
            `UPDATE students SET ${studentUpdateFields.join(", ")} WHERE user_id = ?`,
            studentUpdateValues
          );
        }
      } else {
        // Create new student record
        await queryDatabase(
          db,
          `INSERT INTO students (user_id, studentID, program_id, contact_number)
           VALUES (?, ?, ?, ?)`,
          [id, studentId || null, program_id || null, phoneNumber || null]
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
        const instructorUpdateFields = [];
        const instructorUpdateValues = [];

        if (instructorId || employeeId) {
          instructorUpdateFields.push("instructor_id = ?");
          instructorUpdateValues.push(instructorId || employeeId);
        }
        if (department) {
          instructorUpdateFields.push("department = ?");
          instructorUpdateValues.push(department);
        }

        if (instructorUpdateFields.length > 0) {
          instructorUpdateValues.push(id);
          await queryDatabase(
            db,
            `UPDATE instructors SET ${instructorUpdateFields.join(", ")} WHERE user_id = ?`,
            instructorUpdateValues
          );
        }
      } else {
        // Create new instructor record
        await queryDatabase(
          db,
          `INSERT INTO instructors (user_id, instructor_id, department)
           VALUES (?, ?, ?)`,
          [id, instructorId || employeeId || null, department || null]
        );
      }
    } else if (role === 'alumni') {
      // Check if alumni record exists
      const alumniRecords = await queryDatabase(
        db,
        "SELECT * FROM alumni WHERE user_id = ?",
        [id]
      );

      if (alumniRecords.length > 0) {
        // Update existing alumni record
        const alumniUpdateFields = [];
        const alumniUpdateValues = [];

        if (graduationYear) {
          alumniUpdateFields.push("grad_year = ?");
          alumniUpdateValues.push(graduationYear);
        }
        if (phoneNumber) {
          alumniUpdateFields.push("contact = ?");
          alumniUpdateValues.push(phoneNumber);
        }

        if (alumniUpdateFields.length > 0) {
          alumniUpdateValues.push(id);
          await queryDatabase(
            db,
            `UPDATE alumni SET ${alumniUpdateFields.join(", ")} WHERE user_id = ?`,
            alumniUpdateValues
          );
        }
      } else {
        // Create new alumni record
        await queryDatabase(
          db,
          `INSERT INTO alumni (user_id, grad_year, contact)
           VALUES (?, ?, ?)`,
          [id, graduationYear || null, phoneNumber || null]
        );
      }
    } else if (role === 'employer') {
      // Check if employer record exists
      const employerRecords = await queryDatabase(
        db,
        "SELECT * FROM employers WHERE user_id = ?",
        [id]
      );

      if (employerRecords.length > 0) {
        // Update existing employer record
        const employerUpdateFields = [];
        const employerUpdateValues = [];

        if (companyName) {
          employerUpdateFields.push("companyname = ?");
          employerUpdateValues.push(companyName);
        }
        if (phoneNumber) {
          employerUpdateFields.push("contact = ?");
          employerUpdateValues.push(phoneNumber);
        }

        if (employerUpdateFields.length > 0) {
          employerUpdateValues.push(id);
          await queryDatabase(
            db,
            `UPDATE employers SET ${employerUpdateFields.join(", ")} WHERE user_id = ?`,
            employerUpdateValues
          );
        }
      } else {
        // Create new employer record
        await queryDatabase(
          db,
          `INSERT INTO employers (user_id, companyname, contact)
           VALUES (?, ?, ?)`,
          [id, companyName || null, phoneNumber || null]
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
