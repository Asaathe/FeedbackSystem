// User Service
const db = require("../config/database");
const { queryDatabase } = require("../utils/helpers");
const { formatUserResponse } = require("../utils/formatting");

/**
 * Get filtered users based on criteria
 * @param {object} filters - Filter criteria
 * @returns {Promise<object>} Result with users and count
 */
const getFilteredUsers = async (filters) => {
  try {
    const {
      role,
      course,
      year,
      section,
      grade,
      course_year_section,
      department,
      company,
    } = filters;

    // Build WHERE clause
    const conditions = ["u.status = 'active'"];
    const params = [];

    if (role) {
      conditions.push("u.role = ?");
      params.push(role);
    }

    // Role-specific filters
    if (role === "student") {
      if (course_year_section) {
        conditions.push("cm.course_section = ?");
        params.push(course_year_section);
      }
      if (course) {
        conditions.push("cm.course_section LIKE ?");
        params.push(`%${course}%`);
      }
      if (year) {
        conditions.push("cm.course_section LIKE ?");
        params.push(`%${year}%`);
      }
      if (section) {
        conditions.push("cm.course_section LIKE ?");
        params.push(`%${section}%`);
      }
      if (grade) {
        conditions.push("cm.course_section LIKE ?");
        params.push(`%${grade}%`);
      }
      if (department) {
        conditions.push("cm.department = ?");
        params.push(department);
      }
    }

    if (role === "instructor") {
      if (department) {
        conditions.push("i.department = ?");
        params.push(department);
      }
    }

    if (role === "employer") {
      if (company) {
        conditions.push("e.companyname LIKE ?");
        params.push(`%${company}%`);
      }
    }

    const whereClause = conditions.join(" AND ");

    // Build query based on role
    let query = "";
    if (role === "student") {
      query = `
        SELECT 
          u.id, u.email, u.full_name, u.role, u.status,
          s.studentID, s.program_id, s.contact_number, s.image as profilePicture,
          cm.course_section, cm.department as course_department
        FROM Users u
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN course_management cm ON s.program_id = cm.id
        WHERE ${whereClause}
      `;
    } else if (role === "instructor") {
      query = `
        SELECT 
          u.id, u.email, u.full_name, u.role, u.status,
          i.instructor_id, i.department, i.subject_taught
        FROM Users u
        LEFT JOIN instructors i ON u.id = i.user_id
        WHERE ${whereClause}
      `;
    } else if (role === "employer") {
      query = `
        SELECT 
          u.id, u.email, u.full_name, u.role, u.status,
          e.companyname, e.industry, e.location, e.contact
        FROM Users u
        LEFT JOIN employers e ON u.id = e.user_id
        WHERE ${whereClause}
      `;
    } else if (role === "alumni") {
      query = `
        SELECT 
          u.id, u_name, u.role.email, u.full, u.status,
          a.grad_year, a.degree, a.jobtitle, a.contact, a.company
        FROM Users u
        LEFT JOIN alumni a ON u.id = a.user_id
        WHERE ${whereClause}
      `;
    } else {
      // Default query - include profile picture from students table for all users
      query = `
        SELECT 
          u.id, u.email, u.full_name, u.role, u.status,
          s.image as profilePicture
        FROM Users u
        LEFT JOIN students s ON u.id = s.user_id
        WHERE ${whereClause}
      `;
    }

    const users = await queryDatabase(db, query, params);

    return {
      success: true,
      users: users.map(formatUserResponse),
      count: users.length,
    };
  } catch (error) {
    console.error("Get filtered users error:", error);
    return { success: false, message: "Failed to get users", users: [], count: 0 };
  }
};

/**
 * Get assigned forms for a user
 * @param {number} userId - User ID
 * @returns {Promise<object>} Result with assigned forms
 */
const getAssignedForms = async (userId) => {
  try {
    // Get user role
    const users = await queryDatabase(
      db,
      "SELECT role FROM Users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return { success: false, message: "User not found", forms: [] };
    }

    const userRole = users[0].role;

    // Map role to target audience
    const roleMapping = {
      student: "Students",
      instructor: "Instructors",
      alumni: "Alumni",
      employer: "Staff",
      admin: "Staff",
    };

    const targetAudience = roleMapping[userRole] || "All Users";

    // Get forms from form_assignments table
    const forms = await queryDatabase(
      db,
      `
      SELECT 
        f.*,
        u.full_name as creator_name,
        (SELECT COUNT(*) FROM Questions WHERE form_id = f.id) as question_count,
        (SELECT COUNT(*) FROM Form_Responses WHERE form_id = f.id AND user_id = ?) as submission_count,
        fa.status as assignment_status,
        fa.assigned_at
      FROM form_assignments fa
      LEFT JOIN Forms f ON fa.form_id = f.id
      LEFT JOIN Users u ON f.created_by = u.id
      WHERE fa.user_id = ?
        AND f.status = 'active'
      ORDER BY fa.assigned_at DESC
    `,
      [userId, userId]
    );

    return {
      success: true,
      forms: forms.map((form) => ({
        id: form.id,
        title: form.title,
        description: form.description,
        category: form.category,
        target_audience: form.target_audience,
        status: form.status,
        image_url: form.image_url,
        submission_count: form.submission_count || 0,
        question_count: form.question_count || 0,
        created_at: form.created_at,
        end_date: form.end_date,
        creator_name: form.creator_name,
        assignment_status: form.assignment_status || "pending",
        assigned_at: form.assigned_at,
      })),
    };
  } catch (error) {
    console.error("Get assigned forms error:", error);
    return { success: false, message: "Failed to get assigned forms", forms: [] };
  }
};

/**
 * Get user's form responses
 * @param {number} userId - User ID
 * @returns {Promise<object>} Result with responses
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
        submitted_at: r.submitted_at,
        answers: r.answers ? JSON.parse(r.answers) : [],
      })),
    };
  } catch (error) {
    console.error("Get user responses error:", error);
    return { success: false, message: "Failed to get responses", responses: [] };
  }
};

/**
 * Get all users (admin only)
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Result with users
 */
const getAllUsers = async (filters = {}) => {
  try {
    const { role, status, search = "", page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    // Always exclude admin users from the list
    conditions.push("u.role != ?");
    params.push("admin");

    if (role) {
      conditions.push("u.role = ?");
      params.push(role);
    }

    if (status) {
      conditions.push("u.status = ?");
      params.push(status);
    }

    if (search) {
      conditions.push("(u.email LIKE ? OR u.full_name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    // Build a version of the WHERE clause for count query (without LIMIT/OFFSET)
    const countConditions = [...conditions];
    const countParams = [...params];
    const countWhereClause = countConditions.length > 0 ? `WHERE ${countConditions.join(" AND ")}` : "";
    
    const countQuery = `SELECT COUNT(*) as total FROM Users u ${countWhereClause}`;
    const countResult = await queryDatabase(db, countQuery, countParams);
    const total = countResult[0].total;

    // Build query based on role to include role-specific data
    let usersQuery = "";
    if (role === "student") {
      usersQuery = `
        SELECT 
          u.id, u.email, u.full_name, u.role, u.status, u.registration_date,
          s.studentID, s.program_id, s.contact_number, s.image as profilePicture,
          cm.course_section, cm.department as course_department
        FROM Users u
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN course_management cm ON s.program_id = cm.id
        ${whereClause}
        ORDER BY u.registration_date DESC
        LIMIT ? OFFSET ?
      `;
      const users = await queryDatabase(db, usersQuery, [...params, Number(limit), Number(offset)]);
      return {
        success: true,
        users: users.map(formatUserResponse),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      };
    } else if (role === "instructor") {
      // Build WHERE clause for instructor query (use main conditions)
      const instructorConditions = [...conditions];
      const instructorParams = [...params];
      const instructorWhereClause =
        instructorConditions.length > 0 ? `WHERE ${instructorConditions.join(" AND ")}` : "";
      
      usersQuery = `
        SELECT 
          u.id, u.email, u.full_name, u.role, u.status, u.registration_date,
          i.instructor_id, i.department, i.subject_taught, i.image as profilePicture
        FROM Users u
        LEFT JOIN instructors i ON u.id = i.user_id
        ${instructorWhereClause}
        ORDER BY u.registration_date DESC
        LIMIT ? OFFSET ?
      `;
      
      instructorParams.push(Number(limit), Number(offset));
      const users = await queryDatabase(db, usersQuery, instructorParams);
      return {
        success: true,
        users: users.map(formatUserResponse),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      };
    } else {
      // Default query for other roles or no specific role - include student data for all users
      usersQuery = `
        SELECT 
          u.id, u.email, u.full_name, u.role, u.status, u.registration_date,
          s.studentID, s.program_id, s.contact_number, s.image as profilePicture,
          cm.course_section, cm.department as course_department
        FROM Users u
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN course_management cm ON s.program_id = cm.id
        ${whereClause}
        ORDER BY u.registration_date DESC
        LIMIT ? OFFSET ?
      `;

      const users = await queryDatabase(db, usersQuery, [...params, Number(limit), Number(offset)]);
      return {
        success: true,
        users: users.map(formatUserResponse),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      };
    }
  } catch (error) {
    console.error("Get all users error:", error);
    return { success: false, message: "Failed to get users", users: [] };
  }
};

/**
 * Update user status (admin only)
 * @param {number} userId - User ID
 * @param {string} status - New status
 * @returns {Promise<object>} Result with success status
 */
const updateUserStatus = async (userId, status) => {
  try {
    await queryDatabase(
      db,
      "UPDATE Users SET status = ? WHERE id = ?",
      [status, userId]
    );

    return { success: true, message: "User status updated successfully" };
  } catch (error) {
    console.error("Update user status error:", error);
    return { success: false, message: "Failed to update user status" };
  }
};

/**
 * Delete user (admin only)
 * @param {number} userId - User ID
 * @returns {Promise<object>} Result with success status
 */
const deleteUser = async (userId) => {
  try {
    await queryDatabase(db, "DELETE FROM Users WHERE id = ?", [userId]);

    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    console.error("Delete user error:", error);
    return { success: false, message: "Failed to delete user" };
  }
};

module.exports = {
  getFilteredUsers,
  getAssignedForms,
  getUserResponses,
  getAllUsers,
  updateUserStatus,
  deleteUser,
};
