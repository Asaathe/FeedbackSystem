// Form Routes
const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");
const responseController = require("../controllers/responseController");
const { verifyToken } = require("../middleware/auth");
const { uploadSingleImage, handleUploadError, getFileUrl } = require("../middleware/uploadMiddleware");

// Image upload route
router.post("/upload-image", verifyToken, uploadSingleImage('image'), handleUploadError, (req, res) => {
  console.log("=== /api/forms/upload-image called ===");
  console.log("Request file:", req.file);
  console.log("Request body:", req.body);
  
  if (!req.file) {
    console.log("No file uploaded!");
    return res.status(400).json({
      success: false,
      message: "No file uploaded"
    });
  }

  const imageUrl = getFileUrl(req.file, 'forms');
  console.log("Image URL:", imageUrl);

  res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    imageUrl: imageUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// Send feedback invitation to employer/supervisor
router.post("/send-feedback-invitation", verifyToken, async (req, res) => {
  const emailService = require("../utils/emailService");
  const { supervisorEmail, supervisorName, companyName, alumnusName, formTitle, feedbackLink } = req.body;
  
  console.log("=== /api/forms/send-feedback-invitation called ===");
  console.log("Request body:", req.body);

  // Make alumnusName optional - use a default if not provided
  const finalAlumnusName = alumnusName || "the alumnus";

  if (!supervisorEmail || !supervisorName || !companyName || !formTitle || !feedbackLink) {
    console.log("Missing required fields!");
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  try {
    console.log("Calling emailService.sendFeedbackInvitation...");
    const result = await emailService.sendFeedbackInvitation(
      supervisorEmail,
      supervisorName,
      companyName,
      finalAlumnusName,
      formTitle,
      feedbackLink
    );

    console.log("Email service result:", result);
    if (result) {
      res.status(200).json({
        success: true,
        message: "Feedback invitation sent successfully"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send feedback invitation"
      });
    }
  } catch (error) {
    console.error("Error sending feedback invitation:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Share responses with instructors route
router.post("/:id/share-responses", verifyToken, formController.shareResponsesWithInstructors);

// Public routes
router.get("/", verifyToken, formController.getAllForms);

// Response routes - must be before /:id to avoid route conflicts
router.get("/my-responses", verifyToken, responseController.getMyResponses);
router.get("/:id/responses", verifyToken, responseController.getFormResponses);
router.get("/:id/submission-status", verifyToken, responseController.getFormSubmissionStatus);
router.post("/:id/submit", verifyToken, responseController.submitFormResponse);

// Public route for external feedback (e.g., from email links) - NO authentication required
router.post("/public/submit", async (req, res) => {
  const { formId, responses, supervisorEmail, supervisorName, companyName, alumnusName } = req.body;
  
  console.log("=== Public feedback submission ===");
  console.log("Form ID:", formId);
  console.log("Supervisor:", supervisorName, supervisorEmail);
  
  if (!formId || !responses) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }
  
  // Import the database
  const db = require("../config/database");
  const { queryDatabase } = require("../utils/helpers");
  
  try {
    // First, get the form to verify it exists and check dates
    const forms = await queryDatabase(db, "SELECT * FROM forms WHERE id = ?", [formId]);
    
    if (!forms || forms.length === 0) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }
    
    const form = forms[0];
    
    // Check form date constraints - only use form_deployments table
    const now = new Date();
    console.log("[DEBUG Public] Current time:", now.toISOString());
    
    // Check form_deployments for schedule
    const deployments = await queryDatabase(
      db,
      "SELECT * FROM form_deployments WHERE form_id = ? AND deployment_status = 'active' ORDER BY created_at DESC LIMIT 1",
      [formId]
    );
    
    console.log("[DEBUG Public] Deployments found:", deployments.length);
    
    // If there's an active deployment, check its dates
    if (deployments.length > 0) {
      const deployment = deployments[0];
      console.log("[DEBUG Public] Deployment:", deployment);
      
      if (deployment.start_date) {
        const startTime = deployment.start_time || '00:00:00';
        // Create date with explicit timezone handling - append +08:00 to ensure correct parsing
        const startDateStr = `${deployment.start_date}T${startTime}:00+08:00`;
        const startDate = new Date(startDateStr);
        console.log("[DEBUG Public] Parsed startDate:", startDate.toISOString(), "now:", now.toISOString());
        // Compare with current time
        if (startDate > now) {
          console.log("[DEBUG Public] Form not yet open - blocking submission");
          return res.status(400).json({ success: false, message: "Form is not yet open for submission" });
        }
      }
      
      if (deployment.end_date) {
        const endTime = deployment.end_time || '23:59:59';
        // Create date with explicit timezone handling
        const endDateStr = `${deployment.end_date}T${endTime}:00+08:00`;
        const endDate = new Date(endDateStr);
        console.log("[DEBUG Public] Parsed endDate:", endDate.toISOString(), "now:", now.toISOString());
        // Compare with current time
        if (endDate < now) {
          console.log("[DEBUG Public] Form has ended - blocking submission");
          return res.status(400).json({ success: false, message: "Form submission period has ended" });
        }
      }
    } else {
      console.log("[DEBUG Public] No active deployment found - allowing submission");
    }
    // If no active deployment, allow submission (form is always open)
    
    // Insert the response - we'll store supervisor info in a special way
    const insertQuery = `
      INSERT INTO form_responses 
      (form_id, user_id, responses, submitted_at, submission_type, external_email, external_name)
      VALUES (?, NULL, ?, NOW(), 'external', ?, ?)
    `;
    
    const responseData = JSON.stringify({
      ...responses,
      _externalFeedback: {
        supervisorEmail,
        supervisorName,
        companyName,
        alumnusName,
        submittedAt: new Date().toISOString()
      }
    });
    
    const result = await queryDatabase(db, insertQuery, [formId, responseData, supervisorEmail || null, supervisorName || null]);
    
    console.log("External feedback submitted successfully!");
    return res.status(200).json({ 
      success: true, 
      message: "Feedback submitted successfully",
      responseId: result.insertId 
    });
  } catch (error) {
    console.error("Public submission error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

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
