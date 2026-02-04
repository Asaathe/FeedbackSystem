// Form Routes
const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");
const responseController = require("../controllers/responseController");
const { verifyToken } = require("../middleware/auth");

// Public routes
router.get("/", verifyToken, formController.getAllForms);
router.get("/:id", verifyToken, formController.getFormById);

// Response routes
router.get("/:id/responses", verifyToken, responseController.getFormResponses);
router.get("/:id/submission-status", verifyToken, responseController.getFormSubmissionStatus);
router.post("/:id/submit", verifyToken, responseController.submitFormResponse);
router.get("/my-responses", verifyToken, responseController.getMyResponses);

// Deploy route
router.post("/:id/deploy", verifyToken, formController.deployForm);

// Protected routes
router.post("/", verifyToken, formController.validateFormCreation, formController.createForm);
router.patch("/:id", verifyToken, formController.validateFormUpdate, formController.updateForm);
router.delete("/:id", verifyToken, formController.deleteForm);
router.post("/:id/duplicate", verifyToken, formController.duplicateForm);
router.post("/:id/save-as-template", verifyToken, formController.saveAsTemplate);

module.exports = router;
