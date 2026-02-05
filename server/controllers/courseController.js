// Course Sections Controller
const db = require("../config/database");

/**
 * Get all course sections
 */
const getAllSections = async (req, res) => {
  try {
    const query = "SELECT * FROM course_sections WHERE is_active = TRUE ORDER BY category, subcategory, value";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching course sections:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch course sections",
        });
      }

      // Group by category
      const grouped = results.reduce((acc, section) => {
        if (!acc[section.category]) {
          acc[section.category] = [];
        }
        acc[section.category].push(section);
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
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Create a new course section
 */
const createSection = async (req, res) => {
  try {
    const { value, label, category, subcategory } = req.body;

    // DEBUG: Log incoming request body
    console.log("[DEBUG] Create Section - Request body:", JSON.stringify(req.body, null, 2));

    if (!value || !label || !category) {
      return res.status(400).json({
        success: false,
        message: "Value, label, and category are required",
      });
    }

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

module.exports = {
  getAllSections,
  createSection,
  updateSection,
  deleteSection,
  toggleSectionStatus,
};
