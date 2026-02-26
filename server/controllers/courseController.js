// Course Sections Controller
const db = require("../config/database");

/**
 * Get all course sections
 */
const getAllSections = async (req, res) => {
  try {
    // First, try to get with the new schema (for subject evaluation)
    const newSchemaQuery = "SELECT * FROM course_sections WHERE status = 'active' ORDER BY course_code, section";
    db.query(newSchemaQuery, (err, results) => {
      if (err) {
        // If new schema fails, try old schema
        const oldSchemaQuery = "SELECT * FROM course_sections WHERE is_active = TRUE ORDER BY category, subcategory, value";
        db.query(oldSchemaQuery, (oldErr, oldResults) => {
          if (oldErr) {
            console.error("Error fetching course sections:", oldErr);
            return res.status(500).json({
              success: false,
              message: "Failed to fetch course sections",
            });
          }

          // Group by category
          const grouped = oldResults.reduce((acc, section) => {
            if (!acc[section.category]) {
              acc[section.category] = [];
            }
            acc[section.category].push(section);
            return acc;
          }, {});

          return res.status(200).json({
            success: true,
            courses: oldResults,
            grouped,
          });
        });
      } else if (results.length > 0) {
        // New schema has data
        return res.status(200).json({
          success: true,
          courses: results,
          grouped: results,
        });
      } else {
        // New schema exists but empty, try old schema
        const oldSchemaQuery = "SELECT * FROM course_sections WHERE is_active = TRUE ORDER BY category, subcategory, value";
        db.query(oldSchemaQuery, (oldErr, oldResults) => {
          if (oldErr) {
            console.error("Error fetching course sections:", oldErr);
            return res.status(200).json({
              success: true,
              courses: [],
              grouped: {},
            });
          }

          // Group by category
          const grouped = oldResults.reduce((acc, section) => {
            if (!acc[section.category]) {
              acc[section.category] = [];
            }
            acc[section.category].push(section);
            return acc;
          }, {});

          return res.status(200).json({
            success: true,
            courses: oldResults,
            grouped,
          });
        });
      }
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
 * Create a new course section
 */
const createSection = async (req, res) => {
  try {
    const { value, label, category, subcategory, course_code, course_name, section, year_level, department, instructor_id } = req.body;

    // DEBUG: Log incoming request body
    console.log("[DEBUG] Create Section - Request body:", JSON.stringify(req.body, null, 2));

    // Check if it's using new schema (with course_code)
    if (course_code) {
      const query = "INSERT INTO course_sections (course_code, course_name, section, year_level, department, instructor_id, status) VALUES (?, ?, ?, ?, ?, ?, 'active')";
      db.query(query, [course_code, course_name || '', section || 'A', year_level || 1, department || 'College', instructor_id || 0], (err, result) => {
        if (err) {
          console.error("Error creating course section:", err);
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
    } else if (!value || !label || !category) {
      return res.status(400).json({
        success: false,
        message: "Value, label, and category are required",
      });
    } else {
      // Old schema
      const query = "INSERT INTO course_sections (value, label, category, subcategory) VALUES (?, ?, ?, ?)";
      db.query(query, [value, label, category, subcategory || null], (err, result) => {
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
    }
  } catch (error) {
    console.error("Create section error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Update a course section
 */
const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { value, label, category, subcategory, is_active } = req.body;

    const query = "UPDATE course_sections SET value = ?, label = ?, category = ?, subcategory = ?, is_active = ? WHERE id = ?";
    db.query(query, [value, label, category, subcategory || null, is_active, id], (err, result) => {
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
    const selectQuery = "SELECT is_active FROM course_sections WHERE id = ?";
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

      const currentStatus = results[0].is_active;
      const newStatus = currentStatus ? 0 : 1;

      const updateQuery = "UPDATE course_sections SET is_active = ? WHERE id = ?";
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
          message: newStatus ? "Course section activated successfully" : "Course section deactivated successfully",
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
 * Delete a course section (soft delete - set is_active to false)
 */
const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    const query = "UPDATE course_sections SET is_active = FALSE WHERE id = ?";
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
 * Assign student to section (for subject evaluation)
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

    // Check if student is already assigned
    const checkQuery = "SELECT id FROM course_sections WHERE id = ? AND student_id = ?";
    db.query(checkQuery, [id, student_id], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking existing assignment:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (checkResults.length > 0) {
        return res.status(400).json({ success: false, message: "Student already assigned to this section" });
      }

      // Try to update existing row first
      const updateQuery = "UPDATE course_sections SET student_id = ? WHERE id = ?";
      db.query(updateQuery, [student_id, id], (updateErr, result) => {
        if (updateErr) {
          console.error("Error assigning student:", updateErr);
          // Try inserting a new row instead
          const insertQuery = "INSERT INTO course_sections (course_code, course_name, section, year_level, department, instructor_id, student_id, form_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')";
          db.query(insertQuery, ['', '', 'A', 1, 'College', 0, student_id, form_id || null], (insertErr) => {
            if (insertErr) {
              console.error("Error inserting student:", insertErr);
              return res.status(500).json({ success: false, message: "Failed to assign student" });
            }
            return res.status(201).json({ success: true, message: "Student assigned successfully" });
          });
        } else if (result.affectedRows > 0) {
          return res.status(200).json({ success: true, message: "Student assigned successfully" });
        } else {
          // No row to update, try insert
          const insertQuery = "INSERT INTO course_sections (course_code, course_name, section, year_level, department, instructor_id, student_id, form_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')";
          db.query(insertQuery, ['', '', 'A', 1, 'College', 0, student_id, form_id || null], (insertErr) => {
            if (insertErr) {
              console.error("Error inserting student:", insertErr);
              return res.status(500).json({ success: false, message: "Failed to assign student" });
            }
            return res.status(201).json({ success: true, message: "Student assigned successfully" });
          });
        }
      });
    });
  } catch (error) {
    console.error("Assign student error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Remove student from section
 */
const removeStudentFromSection = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    const query = "UPDATE course_sections SET student_id = NULL WHERE id = ? AND student_id = ?";
    db.query(query, [id, studentId], (err, result) => {
      if (err) {
        console.error("Error removing student:", err);
        return res.status(500).json({ success: false, message: "Failed to remove student" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }

      return res.status(200).json({ success: true, message: "Student removed successfully" });
    });
  } catch (error) {
    console.error("Remove student error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get students in a section
 */
const getSectionStudents = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT u.id as user_id, u.full_name, u.email, s.studentID 
      FROM course_sections cs
      INNER JOIN users u ON cs.student_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      WHERE cs.id = ?
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
