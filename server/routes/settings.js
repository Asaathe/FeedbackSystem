const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { verifyToken, requireAdmin } = require("../middleware/auth");

/**
 * Get all system settings
 * GET /api/settings
 */
router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const query = "SELECT * FROM system_settings ORDER BY department, setting_key";
    
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching settings:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      return res.json({ success: true, settings: results });
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Get current semester and academic year for a department
 * GET /api/settings/current-semester?department=College
 */
router.get("/current-semester", async (req, res) => {
  try {
    const { department } = req.query;
    
    // If no department provided, return settings for both departments
    if (!department) {
      const collegeQuery = "SELECT * FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year') AND (department = 'College' OR department IS NULL) ORDER BY department, setting_key";
      
      db.query(collegeQuery, (err, results) => {
        if (err) {
          console.error("Error fetching current semester:", err);
          return res.status(500).json({ success: false, message: "Database error" });
        }
        
        // Organize results by department
        const collegeSettings = results.filter(s => s.department === 'College');
        const generalSettings = results.filter(s => s.department === null);
        
        const collegeSemester = collegeSettings.find(s => s.setting_key === 'current_semester');
        const collegeYear = collegeSettings.find(s => s.setting_key === 'current_academic_year');
        
        const seniorHighSemester = generalSettings.find(s => s.setting_key === 'current_semester');
        const seniorHighYear = generalSettings.find(s => s.setting_key === 'current_academic_year');
        
        return res.json({
          success: true,
          data: {
            college: {
              semester: collegeSemester?.setting_value || '1st',
              academic_year: collegeYear?.setting_value || '2025-2026'
            },
            seniorHigh: {
              semester: seniorHighSemester?.setting_value || '1st',
              academic_year: seniorHighYear?.setting_value || '2025-2026'
            }
          }
        });
      });
    } else {
      // Get settings for specific department
      const query = "SELECT * FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year') AND (department = ? OR department IS NULL) ORDER BY department DESC";
      
      db.query(query, [department], (err, results) => {
        if (err) {
          console.error("Error fetching current semester:", err);
          return res.status(500).json({ success: false, message: "Database error" });
        }
        
        // Department-specific settings take priority over general settings
        const deptSettings = results.find(s => s.department === department);
        const generalSettings = results.find(s => s.department === null);
        
        const semester = deptSettings?.setting_key === 'current_semester' 
          ? deptSettings.setting_value 
          : generalSettings?.setting_value || '1st';
          
        const academicYear = deptSettings?.setting_key === 'current_academic_year'
          ? deptSettings.setting_value
          : (results.find(s => s.setting_key === 'current_academic_year')?.setting_value || '2025-2026');
        
        return res.json({
          success: true,
          data: {
            department,
            semester,
            academic_year: academicYear
          }
        });
      });
    }
  } catch (error) {
    console.error("Get current semester error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Get settings by department
 * GET /api/settings/department/:department
 */
router.get("/department/:department", verifyToken, async (req, res) => {
  try {
    const { department } = req.params;
    
    const query = "SELECT * FROM system_settings WHERE department = ? OR department IS NULL ORDER BY setting_key";
    
    db.query(query, [department], (err, results) => {
      if (err) {
        console.error("Error fetching department settings:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      // Organize settings as key-value pairs
      const settings = {};
      results.forEach(row => {
        settings[row.setting_key] = row.setting_value;
      });
      
      return res.json({ success: true, settings, department });
    });
  } catch (error) {
    console.error("Get department settings error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Update a system setting
 * PUT /api/settings/:key
 */
router.put("/:key", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, department } = req.body;
    
    if (!value) {
      return res.status(400).json({ success: false, message: "Value is required" });
    }
    
    // Determine which department to update
    const dept = department || null;
    
    // Check if setting exists
    const checkQuery = "SELECT * FROM system_settings WHERE setting_key = ? AND (department = ? OR (department IS NULL AND ? IS NULL))";
    
    db.query(checkQuery, [key, dept, dept], (err, results) => {
      if (err) {
        console.error("Error checking setting:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (results.length > 0) {
        // Update existing setting
        const updateQuery = "UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ? AND (department = ? OR (department IS NULL AND ? IS NULL))";
        
        db.query(updateQuery, [value, key, dept, dept], (updateErr) => {
          if (updateErr) {
            console.error("Error updating setting:", updateErr);
            return res.status(500).json({ success: false, message: "Database error" });
          }
          
          return res.json({ success: true, message: "Setting updated successfully" });
        });
      } else {
        // Insert new setting
        const insertQuery = "INSERT INTO system_settings (setting_key, setting_value, department) VALUES (?, ?, ?)";
        
        db.query(insertQuery, [key, value, dept], (insertErr) => {
          if (insertErr) {
            console.error("Error inserting setting:", insertErr);
            return res.status(500).json({ success: false, message: "Database error" });
          }
          
          return res.json({ success: true, message: "Setting created successfully" });
        });
      }
    });
  } catch (error) {
    console.error("Update setting error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Update multiple settings at once
 * PUT /api/settings/bulk
 */
router.put("/bulk/update", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ success: false, message: "Settings array is required" });
    }
    
    const results = [];
    
    for (const setting of settings) {
      const { key, value, department } = setting;
      const dept = department || null;
      
      await new Promise((resolve, reject) => {
        const checkQuery = "SELECT * FROM system_settings WHERE setting_key = ? AND (department = ? OR (department IS NULL AND ? IS NULL))";
        
        db.query(checkQuery, [key, dept, dept], (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (rows.length > 0) {
            const updateQuery = "UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ? AND (department = ? OR (department IS NULL AND ? IS NULL))";
            db.query(updateQuery, [value, key, dept, dept], (updateErr) => {
              if (updateErr) reject(updateErr);
              else resolve(true);
            });
          } else {
            const insertQuery = "INSERT INTO system_settings (setting_key, setting_value, department) VALUES (?, ?, ?)";
            db.query(insertQuery, [key, value, dept], (insertErr) => {
              if (insertErr) reject(insertErr);
              else resolve(true);
            });
          }
        });
      });
      
      results.push({ key, value, department: dept, status: 'success' });
    }
    
    return res.json({ success: true, message: "Settings updated successfully", results });
  } catch (error) {
    console.error("Bulk update settings error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Delete a system setting
 * DELETE /api/settings/:key
 */
router.delete("/:key", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { department } = req.query;
    
    const dept = department || null;
    
    const query = "DELETE FROM system_settings WHERE setting_key = ? AND (department = ? OR (department IS NULL AND ? IS NULL))";
    
    db.query(query, [key, dept, dept], (err, result) => {
      if (err) {
        console.error("Error deleting setting:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Setting not found" });
      }
      
      return res.json({ success: true, message: "Setting deleted successfully" });
    });
  } catch (error) {
    console.error("Delete setting error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
