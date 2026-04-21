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
        `SELECT SUM(submission_count) as total FROM forms`,
        [],
        (err, results) => err ? reject(err) : resolve(results)
      );
    });

    // Get forms by category
    const formsByCategory = await new Promise((resolve, reject) => {
      db.query(
        `SELECT COALESCE(category, 'General') as category, status, COUNT(*) as count, SUM(submission_count) as submissions FROM forms GROUP BY COALESCE(category, 'General'), status`,
        [],
        (err, results) => err ? reject(err) : resolve(results)
      );
    });

    // Get recent forms
    const recentForms = await new Promise((resolve, reject) => {
      db.query(
        `SELECT id, title, target_audience, status, submission_count, start_date, end_date FROM forms WHERE status = 'active' ORDER BY created_at DESC LIMIT 5`,
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