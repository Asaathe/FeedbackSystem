// Authentication Service
const bcrypt = require("bcryptjs");
const db = require("../config/database");
const { generateToken, verifyToken } = require("../config/jwt");
const { sanitizeInput, formatName, isValidEmail, validatePassword } = require("../utils/validation");
const { queryDatabase } = require("../utils/helpers");

/**
 * Register a new user
 * @param {object} userData - User registration data
 * @returns {Promise<object>} Result with success status and user data
 */
const registerUser = async (userData) => {
  try {
    const {
      email,
      password,
      fullName,
      role,
      student_id,
      course_year_section,
      instructor_id,
      department,
      company_name,
      industry,
      degree,
      alumni_company_name,
    } = userData;

    // Validate input
    if (!isValidEmail(email)) {
      return { success: false, message: "Invalid email address" };
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return { success: false, message: passwordError };
    }

    const sanitizedEmail = sanitizeInput(email);
    const sanitizedFullName = sanitizeInput(fullName);
    const formattedFullName = formatName(sanitizedFullName);

    // Check if user already exists
    const existingUsers = await queryDatabase(
      db,
      "SELECT * FROM Users WHERE email = ?",
      [sanitizedEmail]
    );

    if (existingUsers.length > 0) {
      return { success: false, message: "User already exists with this email" };
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user
    const insertResult = await queryDatabase(
      db,
      `INSERT INTO users (email, password_hash, full_name, role, status, registration_date)
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [sanitizedEmail, hashedPassword, formattedFullName, role]
    );

    const userId = insertResult.insertId;

    // Insert role-specific data
    switch (role) {
      case "student":
        await queryDatabase(
          db,
          `INSERT INTO students (user_id, studentID, course_yr_section, department, contact_number, subjects)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId,
            student_id,
            course_year_section,
            department,
            userData.contactNumber || "",
            userData.subjects || "",
          ]
        );
        break;

      case "instructor":
        await queryDatabase(
          db,
          `INSERT INTO instructors (user_id, instructor_id, department, subject_taught)
           VALUES (?, ?, ?, ?)`,
          [userId, instructor_id, department, userData.subjectTaught || ""]
        );
        break;

      case "alumni":
        await queryDatabase(
          db,
          `INSERT INTO alumni (user_id, grad_year, degree, jobtitle, contact, company)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId,
            userData.gradYear,
            degree,
            userData.jobTitle,
            userData.contact,
            alumni_company_name,
          ]
        );
        break;

      case "employer":
        await queryDatabase(
          db,
          `INSERT INTO employers (user_id, companyname, industry, location, contact)
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            company_name,
            industry,
            userData.location || "",
            userData.contactNumber || "",
          ]
        );
        break;
    }

    // Generate token
    const token = generateToken(userId);

    return {
      success: true,
      message: "User registered successfully",
      userId,
      token,
      user: {
        id: userId,
        email: sanitizedEmail,
        fullName: formattedFullName,
        role,
      },
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, message: "Registration failed" };
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Result with success status and user data
 */
const loginUser = async (email, password) => {
  try {
    // Find user
    const users = await queryDatabase(
      db,
      "SELECT * FROM Users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return { success: false, message: "Invalid email or password" };
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return { success: false, message: "Invalid email or password" };
    }

    // Check account status
    if (user.status !== "active") {
      return { success: false, message: "Account is not active" };
    }

    // Generate token
    const token = generateToken(user.id);

    return {
      success: true,
      message: "Login successful",
      userId: user.id,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        status: user.status,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Login failed" };
  }
};

/**
 * Verify JWT token and get user data
 * @param {string} token - JWT token
 * @returns {Promise<object>} Result with success status and user data
 */
const verifyUserToken = async (token) => {
  try {
    const decoded = verifyToken(token);

    // Get user data
    const users = await queryDatabase(
      db,
      "SELECT id, email, full_name, role, status FROM Users WHERE id = ?",
      [decoded.userId]
    );

    if (users.length === 0) {
      return { success: false, message: "User not found" };
    }

    const user = users[0];

    if (user.status !== "active") {
      return { success: false, message: "Account is not active" };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return { success: false, message: "Invalid or expired token" };
  }
};

/**
 * Get user profile by ID
 * @param {number} userId - User ID
 * @returns {Promise<object>} Result with success status and user data
 */
const getUserProfile = async (userId) => {
  try {
    const users = await queryDatabase(
      db,
      "SELECT id, email, full_name, role, status, registration_date FROM Users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return { success: false, message: "User not found" };
    }

    const user = users[0];

    // Get role-specific data
    let roleData = {};
    switch (user.role) {
      case "student":
        const students = await queryDatabase(
          db,
          "SELECT * FROM students WHERE user_id = ?",
          [userId]
        );
        if (students.length > 0) {
          roleData = students[0];
        }
        break;

      case "instructor":
        const instructors = await queryDatabase(
          db,
          "SELECT * FROM instructors WHERE user_id = ?",
          [userId]
        );
        if (instructors.length > 0) {
          roleData = instructors[0];
        }
        break;

      case "alumni":
        const alumni = await queryDatabase(
          db,
          "SELECT * FROM alumni WHERE user_id = ?",
          [userId]
        );
        if (alumni.length > 0) {
          roleData = alumni[0];
        }
        break;

      case "employer":
        const employers = await queryDatabase(
          db,
          "SELECT * FROM employers WHERE user_id = ?",
          [userId]
        );
        if (employers.length > 0) {
          roleData = employers[0];
        }
        break;
    }

    return {
      success: true,
      user: {
        ...user,
        ...roleData,
      },
    };
  } catch (error) {
    console.error("Get profile error:", error);
    return { success: false, message: "Failed to get user profile" };
  }
};

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Result with success status
 */
const updateUserProfile = async (userId, updates) => {
  try {
    const allowedFields = ["full_name", "email"];
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

    updateValues.push(userId);

    await queryDatabase(
      db,
      `UPDATE Users SET ${updateFields.join(", ")} WHERE id = ?`,
      updateValues
    );

    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, message: "Failed to update profile" };
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyUserToken,
  getUserProfile,
  updateUserProfile,
};
