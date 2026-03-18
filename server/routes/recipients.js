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

// Get companies from alumni employment (for employer feedback)
router.get("/alumni-employment/companies", verifyToken, async (req, res) => {
  const db = require("../config/database");
  try {
    const query = "SELECT DISTINCT company_name FROM alumni_employment WHERE company_name IS NOT NULL AND company_name != '' ORDER BY company_name";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching companies from alumni employment:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch companies",
        });
      }
      return res.status(200).json({
        success: true,
        companies: results.map(r => r.company_name),
      });
    });
  } catch (error) {
    console.error("Get companies from alumni employment error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get supervisors by company from alumni employment
router.get("/alumni-employment/supervisors", verifyToken, async (req, res) => {
  const db = require("../config/database");
  const { company } = req.query;
  
  try {
    let query = `
      SELECT 
        ae.id,
        ae.alumni_user_id,
        ae.company_name,
        ae.supervisor_name,
        ae.supervisor_email,
        u.full_name as alumni_name,
        u.id as user_id
      FROM alumni_employment ae
      LEFT JOIN users u ON ae.alumni_user_id = u.id
      WHERE ae.supervisor_email IS NOT NULL 
        AND ae.supervisor_email != ''
    `;
    
    if (company) {
      query += ` AND ae.company_name = '${company}'`;
    }
    
    query += " ORDER BY ae.company_name, ae.supervisor_name";
    
    console.log("=== Supervisors query ===");
    console.log("Query:", query);
    
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching supervisors:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch supervisors",
        });
      }
      console.log("Supervisors results:", JSON.stringify(results, null, 2));
      return res.status(200).json({
        success: true,
        supervisors: results,
      });
    });
  } catch (error) {
    console.error("Get supervisors error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get alumni by company from alumni employment (for employer preview recipients)
router.get("/alumni-employment/alumni-by-company", verifyToken, async (req, res) => {
  const db = require("../config/database");
  const { company } = req.query;
  
  try {
    let query = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.status,
        ae.company_name,
        ae.job_title
      FROM alumni_employment ae
      LEFT JOIN users u ON ae.alumni_user_id = u.id
      WHERE u.status = 'active'
    `;
    
    if (company) {
      query += ` AND ae.company_name = '${company}'`;
    }
    
    query += " ORDER BY u.full_name";
    
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching alumni by company:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch alumni",
        });
      }
      return res.status(200).json({
        success: true,
        users: results,
      });
    });
  } catch (error) {
    console.error("Get alumni by company error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get alumni degrees (for recipient filtering)
router.get("/alumni/degrees", verifyToken, async (req, res) => {
  const db = require("../config/database");
  try {
    const query = "SELECT DISTINCT degree FROM alumni WHERE degree IS NOT NULL AND degree != '' ORDER BY degree";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching alumni degrees:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch degrees",
        });
      }
      return res.status(200).json({
        success: true,
        degrees: results.map(r => r.degree),
      });
    });
  } catch (error) {
    console.error("Get alumni degrees error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get alumni graduation years (for recipient filtering)
router.get("/alumni/graduation-years", verifyToken, async (req, res) => {
  const db = require("../config/database");
  try {
    const query = "SELECT DISTINCT grad_year FROM alumni WHERE grad_year IS NOT NULL AND grad_year != '' ORDER BY grad_year DESC";
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching alumni graduation years:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch graduation years",
        });
      }
      return res.status(200).json({
        success: true,
        graduationYears: results.map(r => r.grad_year),
      });
    });
  } catch (error) {
    console.error("Get alumni graduation years error:", error);
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
    const query = `
      SELECT DISTINCT cm.course_section
      FROM students s
      LEFT JOIN course_management cm ON s.program_id = cm.id
      WHERE cm.course_section IS NOT NULL AND cm.course_section != ''
      ORDER BY cm.course_section
    `;
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
        sections: results.map(r => r.course_section),
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
