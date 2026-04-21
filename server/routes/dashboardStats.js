const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { verifyToken } = require("../middleware/auth");

// Simple in-memory cache for dashboard stats
const dashboardCache = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes
};

// Function to invalidate cache
const invalidateDashboardCache = () => {
  dashboardCache.data = null;
  dashboardCache.timestamp = 0;
};

module.exports = { dashboardCache, invalidateDashboardCache };

// Note: Ensure these indexes exist for optimal performance:
// CREATE INDEX idx_forms_status_created_at ON forms (status, created_at DESC);
// CREATE INDEX idx_form_responses_form_id_submitted_at ON form_responses (form_id, submitted_at DESC);

router.get("/", verifyToken, async (req, res) => {
  // Check cache first
  const now = Date.now();
  if (dashboardCache.data && (now - dashboardCache.timestamp) < dashboardCache.ttl) {
    console.log('Serving dashboard stats from cache');
    return res.json({ success: true, stats: dashboardCache.data });
  }
  try {
    // Get total users by role (exclude admin)
    const usersByRole = await new Promise((resolve, reject) => {
      db.query(
        `SELECT role, COUNT(*) as count FROM users WHERE status = 'active' AND role != 'admin' GROUP BY role`,
        [],
        (err, results) => err ? reject(err) : resolve(results)
      );
    });

    // Get active forms count
    const activeFormsCount = await new Promise((resolve, reject) => {
      db.query(
        `SELECT COUNT(*) as count FROM forms WHERE status = 'active'`,
        [],
        (err, results) => err ? reject(err) : resolve(results)
      );
    });

    // Get total feedback count
    const totalFeedback = await new Promise((resolve, reject) => {
      db.query(
        `SELECT COUNT(*) as total FROM form_responses`,
        [],
        (err, results) => err ? reject(err) : resolve(results)
      );
    });

    // Get forms by category
    const formsByCategory = await new Promise((resolve, reject) => {
      db.query(
        `SELECT COALESCE(f.category, 'General') as category, f.status, COUNT(DISTINCT f.id) as count, COUNT(fr.id) as submissions FROM forms f LEFT JOIN form_responses fr ON f.id = fr.form_id GROUP BY COALESCE(f.category, 'General'), f.status`,
        [],
        (err, results) => err ? reject(err) : resolve(results)
      );
    });

    // Get recent forms
    const recentForms = await new Promise((resolve, reject) => {
      db.query(
        `SELECT f.id, f.title, f.target_audience, f.status, COUNT(fr.id) as submission_count, f.start_date, f.end_date FROM forms f LEFT JOIN form_responses fr ON f.id = fr.form_id WHERE f.status = 'active' GROUP BY f.id ORDER BY f.created_at DESC LIMIT 5`,
        [],
        (err, results) => err ? reject(err) : resolve(results)
      );
    });

    const stats = {
      total: usersByRole.reduce((sum, r) => sum + parseInt(r.count), 0),
      byRole: usersByRole,
      activeForms: activeFormsCount[0]?.count || 0,
      totalFeedback: totalFeedback[0]?.total || 0,
      formsByCategory,
      recentForms
    };

    // Cache the results
    dashboardCache.data = stats;
    dashboardCache.timestamp = Date.now();

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;