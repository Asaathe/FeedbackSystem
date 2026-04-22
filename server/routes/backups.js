const express = require("express");
const router = express.Router();
const backupController = require("../controllers/backupController");
const { verifyToken, requireAdmin } = require("../middleware/auth");

/**
 * Get all backups
 * GET /api/backups
 */
router.get("/", verifyToken, requireAdmin, backupController.getAllBackups);

/**
 * Create a new backup
 * POST /api/backups/create
 */
router.post("/create", verifyToken, requireAdmin, backupController.createBackup);

/**
 * Download backup file
 * GET /api/backups/:id/download
 */
router.get("/:id/download", verifyToken, requireAdmin, backupController.downloadBackup);

/**
 * Delete backup
 * DELETE /api/backups/:id
 */
router.delete("/:id", verifyToken, requireAdmin, backupController.deleteBackup);

/**
 * Restore from backup
 * POST /api/backups/:id/restore
 */
router.post("/:id/restore", verifyToken, requireAdmin, backupController.restoreBackup);

module.exports = router;