const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { verifyToken, requireAdmin } = require("../middleware/auth");
const semesterService = require("../services/semesterService");
const { getCurrentSettings } = require("../utils/settingsHelper");

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
 * Uses academic_periods table with auto-detection based on current date
 * Returns null values when no active period is found
 */
router.get("/current-semester", async (req, res) => {
  try {
    const { department } = req.query;
    
    // If no department provided, return settings for both departments
    if (!department) {
      // Use getCurrentSettings which checks academic_periods first
      // Returns null if no active period found (no fallback to system_settings)
      const settings = await getCurrentSettings();
      
      return res.json({
        success: true,
        data: {
          college: settings.college,
          seniorHigh: settings.seniorHigh,
          source: settings.source
        }
      });
    } else {
      // Get settings for specific department using getCurrentSettings
      const settings = await getCurrentSettings(department);
      
      return res.json({
        success: true,
        data: {
          department: settings.department,
          semester: settings.semester,
          academic_year: settings.academic_year,
          period_id: settings.period_id,
          period_type: settings.period_type,
          source: settings.source
        }
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

// =============================================
// Academic Period Management Routes
// =============================================

/**
 * Get all academic periods
 * GET /api/settings/academic-periods?department=College&status=active
 */
router.get("/academic-periods", verifyToken, async (req, res) => {
  try {
    const { department, status, academic_year, period_type } = req.query;
    
    const result = await semesterService.getAcademicPeriods({
      department,
      status,
      academic_year,
      period_type
    });
    
    return res.json(result);
  } catch (error) {
    console.error("Get academic periods error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Get single academic period by ID
 * GET /api/settings/academic-periods/:id
 */
router.get("/academic-periods/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await semesterService.getPeriodById(id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    return res.json(result);
  } catch (error) {
    console.error("Get academic period error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Create a new academic period
 * POST /api/settings/academic-periods
 */
router.post("/academic-periods", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { 
      department, 
      period_type, 
      academic_year, 
      period_number, 
      start_date, 
      end_date, 
      auto_transition,
      transition_time
    } = req.body;
    
    if (!department || !period_type || !academic_year || !period_number || !start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        message: "Department, period type, academic year, period number, start date, and end date are required" 
      });
    }
    
    const result = await semesterService.createAcademicPeriod({
      department,
      period_type,
      academic_year,
      period_number,
      start_date,
      end_date,
      auto_transition: auto_transition || false,
      transition_time: transition_time || '00:00:00',
      created_by: req.user?.id
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(201).json(result);
  } catch (error) {
    console.error("Create academic period error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Update an academic period
 * PUT /api/settings/academic-periods/:id
 */
router.put("/academic-periods/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      period_number, 
      start_date, 
      end_date, 
      auto_transition, 
      transition_time,
      status
    } = req.body;
    
    const result = await semesterService.updateAcademicPeriod(id, {
      period_number,
      start_date,
      end_date,
      auto_transition,
      transition_time,
      status
    });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.json(result);
  } catch (error) {
    console.error("Update academic period error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Delete an academic period
 * DELETE /api/settings/academic-periods/:id
 */
router.delete("/academic-periods/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await semesterService.deleteAcademicPeriod(id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.json(result);
  } catch (error) {
    console.error("Delete academic period error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Set current period (trigger semester transition)
 * POST /api/settings/academic-periods/:id/set-current
 */
router.post("/academic-periods/:id/set-current", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reset_type = 'both' } = req.body;
    
    if (!['subjects', 'evaluations', 'both'].includes(reset_type)) {
      return res.status(400).json({ 
        success: false, 
        message: "Reset type must be 'subjects', 'evaluations', or 'both'" 
      });
    }
    
    const result = await semesterService.setCurrentPeriod(id, reset_type, req.user?.id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.json(result);
  } catch (error) {
    console.error("Set current period error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Get semester status for a department
 * GET /api/settings/semester-status?department=College
 */
router.get("/semester-status", verifyToken, async (req, res) => {
  try {
    const { department } = req.query;
    
    if (!department) {
      return res.status(400).json({ 
        success: false, 
        message: "Department parameter is required" 
      });
    }
    
    const result = await semesterService.getSemesterStatus(department);
    return res.json(result);
  } catch (error) {
    console.error("Get semester status error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Get semester transition history
 * GET /api/settings/semester-history?department=College
 */
router.get("/semester-history", verifyToken, async (req, res) => {
  try {
    const { department, limit = 20 } = req.query;
    
    const result = await semesterService.getTransitionHistory({
      department,
      limit: parseInt(limit)
    });
    
    return res.json(result);
  } catch (error) {
    console.error("Get semester history error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// =============================================
// End Academic Period Management Routes
// =============================================

module.exports = router;
