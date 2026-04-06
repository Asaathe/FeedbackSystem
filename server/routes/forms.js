// Form Routes
const express = require("express");
const router = express.Router();
const path = require('path');
const fs = require('fs');
const formController = require("../controllers/formController");
const responseController = require("../controllers/responseController");
const { verifyToken } = require("../middleware/auth");
const { uploadSingleImage, handleUploadError, uploadToCloudinary } = require("../middleware/uploadMiddleware");

// Image upload route
router.post("/upload-image", verifyToken, uploadSingleImage('image'), handleUploadError, async (req, res) => {
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

  try {
    const uploadType = req.body.uploadType || 'forms';
    const cloudinaryResult = await uploadToCloudinary(req.file, uploadType, null);

    // Clean up temp file
    const tempPath = path.join(__dirname, '../temp', req.file.filename);
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }

    console.log("Cloudinary URL:", cloudinaryResult.url);

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: cloudinaryResult.url,
      publicId: cloudinaryResult.publicId,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to upload image to Cloudinary"
    });
  }
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

// ✅ PUBLIC ROUTES FIRST - THESE MUST COME BEFORE ANY DYNAMIC /:id ROUTES!
// Public route to get form details for external feedback (e.g., from email links) - NO authentication required
router.get("/public/:id", async (req, res) => {
  const { id } = req.params;

  console.log("=== Public form fetch ===");
  console.log("Form ID:", id);
  console.log("Current timestamp:", new Date().toISOString());

  try {
    // Import the database
    const db = require("../config/database");
    const { queryDatabase } = require("../utils/helpers");

    // Get the form
    const forms = await queryDatabase(db, "SELECT * FROM forms WHERE id = ?", [id]);

    if (!forms || forms.length === 0) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const form = forms[0];

    // SKIP ALL DATE VALIDATION - Just check if form exists

    // Get form questions with options
    let questions = [];
    try {
      // Get questions with their options
      const questionsData = await queryDatabase(
        db,
        `SELECT q.id, q.form_id, q.section_id, q.question_text, q.question_type,
                q.description, q.required, q.order_index, q.min_value, q.max_value,
                qo.id as option_id, qo.option_text, qo.order_index as option_order
         FROM questions q
         LEFT JOIN question_options qo ON q.id = qo.question_id
         WHERE q.form_id = ?
         ORDER BY q.order_index ASC, qo.order_index ASC`,
        [id]
      );

      console.log("[DEBUG Public] Raw questions data:", questionsData.length, "records");
      console.log("[DEBUG Public] First few records:", questionsData.slice(0, 3));

      // Group questions and their options
      const questionMap = new Map();

      questionsData.forEach(row => {
        const questionId = row.id;

        if (!questionMap.has(questionId)) {
          questionMap.set(questionId, {
            id: row.id,
            question: row.question_text,
            type: row.question_type,
            description: row.description || '',
            required: row.required === 1 || row.required === true,
            order_index: row.order_index,
            min: row.min_value,
            max: row.max_value,
            sectionId: row.section_id,
            options: []
          });
        }

        // Add option if it exists
        if (row.option_id && row.option_text) {
          const question = questionMap.get(questionId);
          question.options.push({
            id: row.option_id,
            option_text: row.option_text,
            order_index: row.option_order
          });
        }
      });

      questions = Array.from(questionMap.values());
      console.log("[DEBUG Public] Processed questions:", questions.length);
    } catch (questionsError) {
      console.error("[DEBUG Public] Error fetching questions:", questionsError);
      // Continue with empty questions array
    }

    // Return form data
    const formData = {
      id: form.id,
      title: form.title,
      description: form.description,
      category: form.category_id,
      start_date: form.start_date,
      end_date: form.end_date,
      image_url: form.image_url,
      questions: questions || []
    };

    console.log("Public form fetched successfully!");
    return res.status(200).json({
      success: true,
      form: formData
    });
  } catch (error) {
    console.error("Public form fetch error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Public route for external feedback (e.g., from email links) - NO authentication required
router.post("/public/submit", async (req, res) => {
  const { formId, responses, supervisorEmail, supervisorName, companyName, alumnusName } = req.body;

  console.log("=== Public feedback submission ===");
  console.log("Form ID:", formId);
  console.log("Supervisor:", supervisorName, supervisorEmail);

  // MINIMAL VALIDATION - just check required fields
  if (!formId || !responses) {
    console.log("❌ Missing required fields");
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  try {
    // Import database
    const db = require("../config/database");
    const { queryDatabase } = require("../utils/helpers");

    // Prepare response data
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

    // INSERT RESPONSE - Use system admin user ID (1) for external submissions
    const result = await queryDatabase(db,
      "INSERT INTO form_responses (form_id, user_id, response_data, submitted_at) VALUES (?, 1, ?, NOW())",
      [formId, responseData]
    );

    console.log("✅ External feedback submitted successfully! Response ID:", result.insertId);
    return res.status(200).json({
      success: true,
      message: "Feedback submitted successfully",
      responseId: result.insertId
    });

  } catch (error) {
    console.error("❌ Public submission error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Public route for external feedback (e.g., from email links) - NO authentication required
// Share responses with instructors route
router.post("/:id/share-responses", verifyToken, formController.shareResponsesWithInstructors);

// ✅ PROTECTED ROUTES - these come AFTER public routes
router.get("/", verifyToken, formController.getAllforms);

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
