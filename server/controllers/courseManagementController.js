// Course Management Controller
const db = require("../config/database");

/**
 * Get all course management records
 */
const getAllPrograms = async (req, res) => {
  try {
    const query = "SELECT * FROM course_management ORDER BY department, program_code, year_level, section";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching course management:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch programs",
        });
      }

      return res.status(200).json({
        success: true,
        programs: results,
      });
    });
  } catch (error) {
    console.error("Get all programs error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Create a new program
 */
const createProgram = async (req, res) => {
  try {
    const { department, program_name, program_code, year_level, section, status } = req.body;

    // DEBUG: Log incoming request body
    console.log("[DEBUG] Create Program - Request body:", JSON.stringify(req.body, null, 2));

    if (!department || !program_name || !program_code || !year_level || !section) {
      return res.status(400).json({
        success: false,
        message: "Department, program name, program code, year level, and section are required",
      });
    }

    const query = "INSERT INTO course_management (department, program_name, program_code, year_level, section, status) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(query, [department, program_name, program_code, year_level, section, status || 'active'], (err, result) => {
      if (err) {
        console.error("Error creating program:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({
            success: false,
            message: "Program with this combination already exists",
          });
        }
        return res.status(500).json({
          success: false,
          message: "Failed to create program",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Program created successfully",
        id: result.insertId,
      });
    });
  } catch (error) {
    console.error("Create program error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Update a program
 */
const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const { department, program_name, program_code, year_level, section, status } = req.body;

    const query = "UPDATE course_management SET department = ?, program_name = ?, program_code = ?, year_level = ?, section = ?, status = ? WHERE id = ?";
    db.query(query, [department, program_name, program_code, year_level, section, status, id], (err, result) => {
      if (err) {
        console.error("Error updating program:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to update program",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Program not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Program updated successfully",
      });
    });
  } catch (error) {
    console.error("Update program error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Toggle program status (active/inactive)
 */
const toggleProgramStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Get current status
    const selectQuery = "SELECT status FROM course_management WHERE id = ?";
    db.query(selectQuery, [id], (err, results) => {
      if (err) {
        console.error("Error fetching program:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to toggle program status",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Program not found",
        });
      }

      const currentStatus = results[0].status;
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      const updateQuery = "UPDATE course_management SET status = ? WHERE id = ?";
      db.query(updateQuery, [newStatus, id], (err, result) => {
        if (err) {
          console.error("Error toggling program status:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to toggle program status",
          });
        }

        return res.status(200).json({
          success: true,
          message: newStatus === 'active' ? "Program activated successfully" : "Program deactivated successfully",
        });
      });
    });
  } catch (error) {
    console.error("Toggle program status error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Delete a program (soft delete - set status to inactive)
 */
const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;

    const query = "UPDATE course_management SET status = 'inactive' WHERE id = ?";
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error("Error deleting program:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to delete program",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Program not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Program deleted successfully",
      });
    });
  } catch (error) {
    console.error("Delete program error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get unique departments from course management
 */
const getDepartments = async (req, res) => {
  try {
    const query = "SELECT DISTINCT department FROM course_management WHERE status = 'active' ORDER BY department";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching departments:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch departments",
        });
      }

      return res.status(200).json({
        success: true,
        departments: results.map(row => row.department),
      });
    });
  } catch (error) {
    console.error("Get departments error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get course sections (display_label) from course_management for student selection
 */
const getCourseSections = async (req, res) => {
  try {
    const { department } = req.query;
    let query = "SELECT DISTINCT course_section, department, program_code, year_level, section FROM course_management WHERE status = 'active'";
    const params = [];
    
    if (department) {
      query += " AND department = ?";
      params.push(department);
    }
    
    query += " ORDER BY department, program_code, year_level, section";
    
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Error fetching course sections:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch course sections",
        });
      }

      return res.status(200).json({
        success: true,
        courses: results.map(row => ({
          value: row.course_section,
          department: row.department,
          program_code: row.program_code,
          year_level: row.year_level,
          section: row.section
        })),
      });
    });
  } catch (error) {
    console.error("Get course sections error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAllPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  toggleProgramStatus,
  getDepartments,
  getCourseSections,
};
