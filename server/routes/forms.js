// Form Routes
const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");
const responseController = require("../controllers/responseController");
const { verifyToken } = require("../middleware/auth");

// Public routes
router.get("/", verifyToken, formController.getAllForms);

// Response routes - must be before /:id to avoid route conflicts
router.get("/my-responses", verifyToken, responseController.getMyResponses);
router.get("/:id/responses", verifyToken, responseController.getFormResponses);
router.get("/:id/submission-status", verifyToken, responseController.getFormSubmissionStatus);
router.post("/:id/submit", verifyToken, responseController.submitFormResponse);

// Deploy route
router.post("/:id/deploy", verifyToken, formController.deployForm);

// Assign form to users route
router.post("/:id/assign", verifyToken, formController.assignFormToUsers);

// Form by ID - must be after more specific routes
router.get("/:id", verifyToken, formController.getFormById);

// Assign form to users route
router.post("/:id/assign", verifyToken, formController.assignFormToUsers);

// Protected routes
router.post("/", verifyToken, formController.validateFormCreation, formController.createForm);
router.patch("/:id", verifyToken, formController.validateFormUpdate, formController.updateForm);
router.delete("/:id", verifyToken, formController.deleteForm);
router.post("/:id/duplicate", verifyToken, formController.duplicateForm);
router.post("/:id/save-as-template", verifyToken, formController.saveAsTemplate);

module.exports = router;
