// Form Routes
const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");
const responseController = require("../controllers/responseController");
const { verifyToken } = require("../middleware/auth");

// Share responses with instructors route
router.post("/:id/share-responses", verifyToken, formController.shareResponsesWithInstructors);

// Public routes
router.get("/", verifyToken, formController.getAllForms);

// Response routes - must be before /:id to avoid route conflicts
router.get("/my-responses", verifyToken, responseController.getMyResponses);
router.get("/:id/responses", verifyToken, responseController.getFormResponses);
router.get("/:id/submission-status", verifyToken, responseController.getFormSubmissionStatus);
router.post("/:id/submit", verifyToken, responseController.submitFormResponse);

// Deploy route
router.post("/:id/deploy", verifyToken, formController.deployForm);

// Form by ID - must be after more specific routes
router.get("/:id", verifyToken, formController.getFormById);

// Protected routes
router.post("/", verifyToken, formController.createForm);
router.patch("/:id", verifyToken, formController.updateForm);
router.delete("/:id", verifyToken, formController.deleteForm);
router.post("/:id/duplicate", verifyToken, formController.duplicateForm);
router.post("/:id/save-as-template", verifyToken, formController.saveAsTemplate);

module.exports = router;
