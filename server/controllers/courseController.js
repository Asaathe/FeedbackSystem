// Course Sections Controller
// Now uses subjects table instead of course_sections
const db = require("../config/database");

/**
 * Get all course sections (from subjects table)
 */
const getAllSections = async (req, res) => {
  try {
    // Get from subjects table
    const query = "SELECT * FROM subjects WHERE status = 'active' ORDER BY subject_code, section";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching course sections:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch course sections",
        });
      }

      // Group by department or subject_code
      const grouped = results.reduce((acc, section) => {
        const key = section.department || 'General';
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(section);
        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        courses: results,
        grouped,
      });
    });
  } catch (error) {
    console.error("Get all sections error:", error);
    return res.status(200).json({
      success: true,
      courses: [],
      grouped: {},
    });
  }
};

/**
 * Create a new course section (inserts into subjects table)
 */
const createSection = async (req, res) => {
  try {
    const { value, label, category, subcategory, course_code, course_name, section, year_level, department, instructor_id } = req.body;

    // DEBUG: Log incoming request body
    console.log("[DEBUG] Create Section - Request body:", JSON.stringify(req.body, null, 2));

    // Map old schema fields to new schema if needed
    const subjectCode = course_code || value;
    const subjectName = course_name || label;
    const dept = department || category || 'General';

    if (!subjectCode || !subjectName) {
      return res.status(400).json({
        success: false,
        message: "Subject code and name are required",
      });
    }

    const query = "INSERT INTO subjects (subject_code, subject_name, section, year_level, department, status) VALUES (?, ?, ?, ?, ?, 'active')";
    db.query(query, [subjectCode, subjectName, section || 'A', year_level || 1, dept || 'General'], (err, result) => {
      if (err) {
        console.error("Error creating course section:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({
            success: false,
            message: "Course section already exists",
          });
        }
        return res.status(500).json({
          success: false,
          message: "Failed to create course section",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Course section created successfully",
        id: result.insertId,
      });
    });
  } catch (error) {
    console.error("Create section error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Update a course section (updates subjects table)
 */
const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { course_code, course_name, section, year_level, department, status } = req.body;

    // Map to subjects table fields
    const query = "UPDATE subjects SET subject_code = ?, subject_name = ?, section = ?, year_level = ?, department = ?, status = ? WHERE id = ?";
    db.query(query, [course_code, course_name, section, year_level, department, status || 'active', id], (err, result) => {
      if (err) {
        console.error("Error updating course section:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to update course section",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Course section not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Course section updated successfully",
      });
    });
  } catch (error) {
    console.error("Update section error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Toggle course section status (activate/deactivate)
 */
const toggleSectionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // First get the current status
    const selectQuery = "SELECT status FROM subjects WHERE id = ?";
    db.query(selectQuery, [id], (err, results) => {
      if (err) {
        console.error("Error fetching course section:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to toggle course section status",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Course section not found",
        });
      }

      const currentStatus = results[0].status;
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      const updateQuery = "UPDATE subjects SET status = ? WHERE id = ?";
      db.query(updateQuery, [newStatus, id], (err, result) => {
        if (err) {
          console.error("Error toggling course section status:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to toggle course section status",
          });
        }

        return res.status(200).json({
          success: true,
          message: newStatus === 'active' ? "Course section activated successfully" : "Course section deactivated successfully",
        });
      });
    });
  } catch (error) {
    console.error("Toggle section status error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Delete a course section (soft delete - set status to inactive)
 */
const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    const query = "UPDATE subjects SET status = 'inactive' WHERE id = ?";
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error("Error deleting course section:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to delete course section",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Course section not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Course section deleted successfully",
      });
    });
  } catch (error) {
    console.error("Delete section error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Assign student to section (uses student_enrollments table)
 */
const assignStudentToSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id, form_id } = req.body;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // Use student_enrollments table instead of course_sections
    // First check if enrollment already exists
    const checkQuery = "SELECT id FROM student_enrollments WHERE subject_id = ? AND student_id = ?";
    db.query(checkQuery, [id, student_id], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking existing assignment:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (checkResults.length > 0) {
        return res.status(400).json({ success: false, message: "Student already enrolled in this section" });
      }

      // Insert into student_enrollments
      const insertQuery = "INSERT INTO student_enrollments (student_id, subject_id, status) VALUES (?, ?, 'enrolled')";
      db.query(insertQuery, [student_id, id], (insertErr, result) => {
        if (insertErr) {
          console.error("Error enrolling student:", insertErr);
          return res.status(500).json({ success: false, message: "Failed to enroll student" });
        }
        return res.status(201).json({ success: true, message: "Student enrolled successfully" });
      });
    });
  } catch (error) {
    console.error("Assign student error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Remove student from section (uses student_enrollments table)
 */
const removeStudentFromSection = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    // Delete from student_enrollments
    const query = "DELETE FROM student_enrollments WHERE subject_id = ? AND student_id = ?";
    db.query(query, [id, studentId], (err, result) => {
      if (err) {
        console.error("Error removing student:", err);
        return res.status(500).json({ success: false, message: "Failed to remove student" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Enrollment not found" });
      }

      return res.status(200).json({ success: true, message: "Student removed successfully" });
    });
  } catch (error) {
    console.error("Remove student error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get students in a section (uses student_enrollments and subjects tables)
 */
const getSectionStudents = async (req, res) => {
  try {
    const { id } = req.params;

    // Get students from student_enrollments
    const query = `
      SELECT u.id as user_id, u.full_name, u.email, s.studentID 
      FROM student_enrollments se
      INNER JOIN users u ON se.student_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      WHERE se.subject_id = ?
    `;
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error("Error fetching section students:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch students" });
      }

      return res.status(200).json({ success: true, students: results });
    });
  } catch (error) {
    console.error("Get section students error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getAllSections,
  createSection,
  updateSection,
  deleteSection,
  toggleSectionStatus,
  assignStudentToSection,
  removeStudentFromSection,
  getSectionStudents,
};
