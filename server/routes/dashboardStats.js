const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { verifyToken } = require("../middleware/auth");

router.get("/", verifyToken, async (req, res) => {
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

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;