// User Controller
const { body, validationResult } = require("express-validator");
const userService = require("../services/userService");
const db = require("../config/database");
const { queryDatabase } = require("../utils/helpers");
const fs = require("fs");
const path = require("path");

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
      schoolRole,
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

      console.log('Student update - profilePicture:', profilePicture);
      console.log('Student update - studentRecords:', studentRecords);

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
        if (profilePicture === '') {
          // User wants to remove the profile picture
          studentUpdateFields.push("image = ?");
          studentUpdateValues.push(null);
          
          // Delete old image if exists
          if (studentRecords[0].image) {
            const oldImagePath = path.join(__dirname, '../public', studentRecords[0].image);
            if (fs.existsSync(oldImagePath)) {
              try {
                fs.unlinkSync(oldImagePath);
              } catch (err) {
                console.error('Failed to delete old image:', err);
              }
            }
          }
        } else if (profilePicture) {
          // Delete old image if exists and new image is being uploaded
          if (studentRecords[0].image) {
            const oldImagePath = path.join(__dirname, '../public', studentRecords[0].image);
            if (fs.existsSync(oldImagePath)) {
              try {
                fs.unlinkSync(oldImagePath);
              } catch (err) {
                console.error('Failed to delete old image:', err);
              }
            }
          }
          studentUpdateFields.push("image = ?");
          studentUpdateValues.push(profilePicture);
          console.log('Adding image to student update:', profilePicture);
        }

        console.log('Student update fields:', studentUpdateFields);
        console.log('Student update values:', studentUpdateValues);

        if (studentUpdateFields.length > 0) {
          studentUpdateValues.push(id);
          await queryDatabase(
            db,
            `UPDATE students SET ${studentUpdateFields.join(", ")} WHERE user_id = ?`,
            studentUpdateValues
          );
          console.log('Student updated successfully');
        }
      } else {
        // Create new student record
        await queryDatabase(
          db,
          `INSERT INTO students (user_id, studentID, program_id, contact_number, image)
           VALUES (?, ?, ?, ?, ?)`,
          [id, studentId || null, program_id || null, phoneNumber || null, profilePicture || null]
        );
        console.log('Student record created');
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
        if (schoolRole !== undefined) {
          instructorUpdateFields.push("school_role = ?");
          instructorUpdateValues.push(schoolRole);
        }
        if (profilePicture === '') {
          // User wants to remove the profile picture
          instructorUpdateFields.push("image = ?");
          instructorUpdateValues.push(null);
          
          // Delete old image if exists
          if (instructorRecords[0].image) {
            const oldImagePath = path.join(__dirname, '../public', instructorRecords[0].image);
            if (fs.existsSync(oldImagePath)) {
              try {
                fs.unlinkSync(oldImagePath);
              } catch (err) {
                console.error('Failed to delete old image:', err);
              }
            }
          }
        } else if (profilePicture) {
          // Delete old image if exists and new image is being uploaded
          if (instructorRecords[0].image) {
            const oldImagePath = path.join(__dirname, '../public', instructorRecords[0].image);
            if (fs.existsSync(oldImagePath)) {
              try {
                fs.unlinkSync(oldImagePath);
              } catch (err) {
                console.error('Failed to delete old image:', err);
              }
            }
          }
          instructorUpdateFields.push("image = ?");
          instructorUpdateValues.push(profilePicture);
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
          `INSERT INTO instructors (user_id, instructor_id, department, school_role, image)
           VALUES (?, ?, ?, ?, ?)`,
          [id, instructorId || employeeId || null, department || null, schoolRole || null, profilePicture || null]
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
        if (profilePicture === '') {
          // User wants to remove the profile picture
          alumniUpdateFields.push("image = ?");
          alumniUpdateValues.push(null);
          
          // Delete old image if exists
          if (alumniRecords[0].image) {
            const oldImagePath = path.join(__dirname, '../public', alumniRecords[0].image);
            if (fs.existsSync(oldImagePath)) {
              try {
                fs.unlinkSync(oldImagePath);
              } catch (err) {
                console.error('Failed to delete old image:', err);
              }
            }
          }
        } else if (profilePicture) {
          // Delete old image if exists and new image is being uploaded
          if (alumniRecords[0].image) {
            const oldImagePath = path.join(__dirname, '../public', alumniRecords[0].image);
            if (fs.existsSync(oldImagePath)) {
              try {
                fs.unlinkSync(oldImagePath);
              } catch (err) {
                console.error('Failed to delete old image:', err);
              }
            }
          }
          alumniUpdateFields.push("image = ?");
          alumniUpdateValues.push(profilePicture);
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
          `INSERT INTO alumni (user_id, grad_year, contact, image)
           VALUES (?, ?, ?, ?)`,
          [id, graduationYear || null, phoneNumber || null, profilePicture || null]
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
        if (profilePicture === '') {
          // User wants to remove the profile picture
          employerUpdateFields.push("image = ?");
          employerUpdateValues.push(null);
          
          // Delete old image if exists
          if (employerRecords[0].image) {
            const oldImagePath = path.join(__dirname, '../public', employerRecords[0].image);
            if (fs.existsSync(oldImagePath)) {
              try {
                fs.unlinkSync(oldImagePath);
              } catch (err) {
                console.error('Failed to delete old image:', err);
              }
            }
          }
        } else if (profilePicture) {
          // Delete old image if exists and new image is being uploaded
          if (employerRecords[0].image) {
            const oldImagePath = path.join(__dirname, '../public', employerRecords[0].image);
            if (fs.existsSync(oldImagePath)) {
              try {
                fs.unlinkSync(oldImagePath);
              } catch (err) {
                console.error('Failed to delete old image:', err);
              }
            }
          }
          employerUpdateFields.push("image = ?");
          employerUpdateValues.push(profilePicture);
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
          `INSERT INTO employers (user_id, companyname, contact, image)
           VALUES (?, ?, ?, ?)`,
          [id, companyName || null, phoneNumber || null, profilePicture || null]
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

/**
 * Get employment info for current alumni user
 */
const getEmploymentInfo = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get employment record from separate table
    let employmentRecords = [];
    try {
      employmentRecords = await queryDatabase(
        db,
        "SELECT * FROM alumni_employment WHERE alumni_user_id = ?",
        [userId]
      );
    } catch (err) {
      console.log("Employment table not found:", err.message);
      return res.status(200).json({
        success: true,
        data: null,
        message: "Employment table not configured yet"
      });
    }
    
    if (employmentRecords.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No employment information found"
      });
    }
    
    const employment = employmentRecords[0];
    return res.status(200).json({
      success: true,
      data: {
        companyName: employment.company_name,
        jobTitle: employment.job_title,
        employmentStatus: employment.employment_status,
        industryType: employment.industry_type,
        companyAddress: employment.company_address,
        supervisorName: employment.supervisor_name,
        supervisorEmail: employment.supervisor_email,
        yearStarted: employment.year_started,
        employmentType: employment.employment_type,
        monthlySalary: employment.monthly_salary,
        isRelevantToDegree: employment.is_relevant_to_degree,
        lastUpdateSent: employment.last_update_sent,
        lastUpdateReceived: employment.last_update_received
      }
    });
  } catch (error) {
    console.error("Get employment info controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Update employment info for current alumni user
 */
const updateEmploymentInfo = async (req, res) => {
  try {
    const userId = req.userId;
    const { 
      companyName, 
      jobTitle, 
      employmentStatus, 
      industryType, 
      companyAddress, 
      supervisorName, 
      supervisorEmail, 
      yearStarted,
      employmentType,
      monthlySalary,
      isRelevantToDegree,
      lastUpdateReceived
    } = req.body;
    
    // Check if employment table exists
    let existingRecords = [];
    try {
      existingRecords = await queryDatabase(
        db,
        "SELECT id FROM alumni_employment WHERE alumni_user_id = ?",
        [userId]
      );
    } catch (err) {
      console.log("Employment table not found:", err.message);
      return res.status(500).json({
        success: false,
        message: "Employment table not configured. Please run the database migration."
      });
    }
    
    if (existingRecords.length > 0) {
      // Update existing employment record
      await queryDatabase(
        db,
        `UPDATE alumni_employment SET 
          company_name = ?,
          job_title = ?,
          employment_status = ?,
          industry_type = ?,
          company_address = ?,
          supervisor_name = ?,
          supervisor_email = ?,
          year_started = ?,
          employment_type = ?,
          monthly_salary = ?,
          is_relevant_to_degree = ?,
          last_update_received = ?,
          update_status = 'scheduled',
          next_email_date = DATE_ADD(NOW(), INTERVAL 1 DAY)
        WHERE alumni_user_id = ?`,
        [
          companyName || null,
          jobTitle || null,
          employmentStatus || null,
          industryType || null,
          companyAddress || null,
          supervisorName || null,
          supervisorEmail || null,
          yearStarted || null,
          employmentType || null,
          monthlySalary || null,
          isRelevantToDegree || null,
          lastUpdateReceived || null,
          userId
        ]
      );
    } else {
      // Create new employment record
      await queryDatabase(
        db,
        `INSERT INTO alumni_employment (alumni_user_id, company_name, job_title, employment_status, industry_type, company_address, supervisor_name, supervisor_email, year_started, employment_type, monthly_salary, is_relevant_to_degree, last_update_received, update_status, next_email_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', DATE_ADD(NOW(), INTERVAL 1 DAY))`,
        [
          userId,
          companyName || null,
          jobTitle || null,
          employmentStatus || null,
          industryType || null,
          companyAddress || null,
          supervisorName || null,
          supervisorEmail || null,
          yearStarted || null,
          employmentType || null,
          monthlySalary || null,
          isRelevantToDegree || null,
          lastUpdateReceived || null
        ]
      );
    }
    
    return res.status(200).json({
      success: true,
      message: "Employment information updated successfully"
    });
  } catch (error) {
    console.error("Update employment info controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Confirm employment info for current alumni user (when no changes)
 */
const confirmEmploymentInfo = async (req, res) => {
  try {
    const userId = req.userId;
    const { lastUpdateReceived } = req.body;
    
    // Update the last_update_received timestamp and status
    await queryDatabase(
      db,
      `UPDATE alumni_employment SET last_update_received = ?, update_status = 'scheduled', next_email_date = DATE_ADD(NOW(), INTERVAL 1 DAY) WHERE alumni_user_id = ?`,
      [lastUpdateReceived || new Date().toISOString(), userId]
    );
    
    return res.status(200).json({
      success: true,
      message: "Employment information confirmed successfully"
    });
  } catch (error) {
    console.error("Confirm employment info controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Send annual employment update request email
 */
const sendEmploymentUpdateRequest = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user email and name
    const userRecords = await queryDatabase(
      db,
      "SELECT full_name, email FROM users WHERE id = ?",
      [userId]
    );
    
    if (userRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const user = userRecords[0];
    const emailService = require("../utils/emailService");
    
    // Send employment update request email
    const subject = "Employment Information Update - ACTS Computer College";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Employment Information Update</h2>
        <p>Dear ${user.full_name},</p>
        <p>Good day.</p>
        <p>We hope this message finds you well.</p>
        <p>We are reaching out from <strong>ACTS Computer College</strong> as part of our ongoing effort to stay connected with our alumni and track their career journeys.</p>
        <p>We would greatly appreciate if you could take a few moments to update your current employment information. Your participation helps us:</p>
        <ul>
          <li>Measure the success of our graduates in the workforce</li>
          <li>Improve our career services and connections</li>
          <li>Maintain an accurate alumni directory</li>
          <li>Connect you with relevant career opportunities</li>
        </ul>
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/alumni-employment" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Update Employment Information
          </a>
        </div>
        <p>Or copy this link: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/alumni-employment</p>
        <p style="margin-top: 20px;">If your employment information has not changed, you can simply confirm your existing information.</p>
        <p>Should you have any questions or require further information, please feel free to contact us at feedbacts@gmail.com.</p>
        <p>Thank you very much for your time and continued support.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This is an automated message from ACTS Computer College - FeedbACTS System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `;
    
    const emailSent = await emailService.sendEmail(user.email, subject, html);
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send update request email"
      });
    }
    
    // Update the last_update_sent timestamp
    await queryDatabase(
      db,
      `UPDATE alumni_employment SET last_update_sent = ? WHERE alumni_user_id = ?`,
      [new Date().toISOString(), userId]
    );
    
    return res.status(200).json({
      success: true,
      message: "Employment update request sent successfully"
    });
  } catch (error) {
    console.error("Send employment update request controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Send annual employment update notification email (automatic)
 */
const sendAnnualUpdateNotification = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user email and name
    const userRecords = await queryDatabase(
      db,
      "SELECT full_name, email FROM users WHERE id = ?",
      [userId]
    );
    
    if (userRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    const user = userRecords[0];
    const emailService = require("../utils/emailService");
    
    // Send annual employment update notification email
    const subject = "Employment Information Update - ACTS Computer College";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #26d826;">Employment Information Update</h2>
        <p>Dear ${user.full_name},</p>
        <p>Good day.</p>
        <p>We hope this message finds you well.</p>
        <p>We are reaching out from <strong>ACTS Computer College</strong> to kindly remind you to update your employment information. It has been some time since your last update, and we would appreciate if you could take a few moments to review and confirm your current employment details.</p>
        <p>Your continued participation helps us:</p>
        <ul>
          <li>Track the career progression of our alumni</li>
          <li>Maintain accurate employment statistics</li>
          <li>Connect you with relevant career opportunities</li>
          <li>Improve our alumni network</li>
        </ul>
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/alumni-employment" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Update Employment Information
          </a>
        </div>
        <p>Or copy this link: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/alumni-employment</p>
        <p style="margin-top: 20px;">If your employment information has not changed, you can simply confirm your existing information.</p>
        <p>Should you have any questions or require further information, please feel free to contact us at feedbacts@gmail.com.</p>
        <p>Thank you very much for your time and continued support.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This is an automated message from ACTS Computer College - FeedbACTS System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `;
    
    const emailSent = await emailService.sendEmail(user.email, subject, html);
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send annual update notification email"
      });
    }
    
    // Also create an in-app notification
    const notificationService = require("../services/notificationService");
    await notificationService.createNotification({
      user_id: userId,
      type: 'EMPLOYMENT_UPDATE_REQUIRED',
      title: 'Annual Employment Update Required',
      message: 'It\'s been over 11 months since your last employment update. Please review and update your employment information.',
      related_employment_id: null
    });
    
    return res.status(200).json({
      success: true,
      message: "Annual update notification sent successfully"
    });
  } catch (error) {
    console.error("Send annual update notification controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Get all alumni data for dashboard
 */
const getAlumniData = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user info
    const userRecords = await queryDatabase(
      db,
      "SELECT full_name, email FROM users WHERE id = ?",
      [userId]
    );
    
    if (userRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Get employment record from separate table
    let employmentRecords = [];
    try {
      employmentRecords = await queryDatabase(
        db,
        "SELECT * FROM alumni_employment WHERE alumni_user_id = ?",
        [userId]
      );
    } catch (err) {
      console.log("Employment table query failed:", err.message);
    }
    
    const employment = employmentRecords.length > 0 ? employmentRecords[0] : null;
    
    // Get alumni record from alumni table
    let alumniRecords = [];
    try {
      alumniRecords = await queryDatabase(
        db,
        "SELECT * FROM alumni WHERE user_id = ?",
        [userId]
      );
    } catch (err) {
      console.log("Alumni table query failed:", err.message);
    }
    
    const alumni = alumniRecords.length > 0 ? alumniRecords[0] : null;
    
    // Get count of alumni network - check if alumni table exists
    let networkCount = [{ count: 0 }];
    try {
      networkCount = await queryDatabase(
        db,
        "SELECT COUNT(*) as count FROM alumni"
      );
    } catch (err) {
      console.log("Alumni table query failed, using default count");
    }
    
    // Get form stats - count completed responses
    let completedForms = [{ count: 0 }];
    try {
      completedForms = await queryDatabase(
        db,
        "SELECT COUNT(*) as count FROM form_responses WHERE user_id = ?",
        [userId]
      );
    } catch (err) {
      console.log("Form responses table query failed:", err.message);
    }
    
    // Get pending forms count - set to 0 for now (can be enhanced later)
    const pendingForms = [{ count: 0 }];
    
    // Build response data
    const data = {
      stats: {
        graduationYear: alumni ? String(alumni.grad_year) : '',
        program: alumni ? alumni.degree : '',
        currentEmployment: employment && employment.job_title 
          ? `${employment.job_title}${employment.company_name ? ' at ' + employment.company_name : ''}` 
          : '',
        feedbackSubmitted: completedForms[0]?.count || 0
      },
      employment: employment ? {
        companyName: employment.company_name,
        jobTitle: employment.job_title,
        employmentStatus: employment.employment_status,
        industryType: employment.industry_type,
        companyAddress: employment.company_address,
        supervisorName: employment.supervisor_name,
        supervisorEmail: employment.supervisor_email,
        yearStarted: employment.year_started
      } : null,
      alumniNetworkCount: networkCount[0]?.count || 0,
      careerImpact: [],
      recentActivity: [],
      skills: [],
      engagement: []
    };
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Get alumni data controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

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
  getEmploymentInfo,
  updateEmploymentInfo,
  confirmEmploymentInfo,
  sendEmploymentUpdateRequest,
  sendAnnualUpdateNotification,
  getAlumniData
};
