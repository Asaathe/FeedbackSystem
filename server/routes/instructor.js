// Instructor Routes
const express = require("express");
const router = express.Router();
const responseController = require("../controllers/responseController");
const { verifyToken } = require("../middleware/auth");

// Get shared responses for instructor
router.get("/shared-responses", verifyToken, responseController.getSharedResponses);

// Get detailed responses for a shared form
router.get("/shared-responses/:sharedId/responses", verifyToken, responseController.getSharedResponsesDetails);

module.exports = router;
