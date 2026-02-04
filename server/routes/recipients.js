// Recipients Routes - For form recipient selection
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");

// Get alumni companies (for recipient filtering)
router.get("/alumni/companies", verifyToken, async (req, res) => {
  const db = require("../config/database");
  try {
    const query = "SELECT DISTINCT company FROM alumni WHERE company IS NOT NULL AND company != '' ORDER BY company";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching alumni companies:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch companies",
        });
      }
      return res.status(200).json({
        success: true,
        companies: results.map(r => r.company),
      });
    });
  } catch (error) {
    console.error("Get alumni companies error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get employer companies (for recipient filtering)
router.get("/employers/companies", verifyToken, async (req, res) => {
  const db = require("../config/database");
  try {
    const query = "SELECT DISTINCT companyname FROM employers WHERE companyname IS NOT NULL AND companyname != '' ORDER BY companyname";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching employer companies:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch companies",
        });
      }
      return res.status(200).json({
        success: true,
        companies: results.map(r => r.companyname),
      });
    });
  } catch (error) {
    console.error("Get employer companies error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get instructors departments
router.get("/instructors/departments", async (req, res) => {
  const db = require("../config/database");
  try {
    const query = "SELECT DISTINCT department FROM instructors WHERE department IS NOT NULL AND department != '' ORDER BY department";
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
        departments: results.map(r => r.department),
      });
    });
  } catch (error) {
    console.error("Get departments error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get students sections
router.get("/students/sections", async (req, res) => {
  const db = require("../config/database");
  try {
    const query = "SELECT DISTINCT course_yr_section FROM students WHERE course_yr_section IS NOT NULL AND course_yr_section != '' ORDER BY course_yr_section";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching sections:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch sections",
        });
      }
      return res.status(200).json({
        success: true,
        sections: results.map(r => r.course_yr_section),
      });
    });
  } catch (error) {
    console.error("Get sections error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
