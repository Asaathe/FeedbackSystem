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
  const crypto = require('crypto');
  const path = require('path');
  const fs = require('fs');
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
    // Import database
    const db = require("../config/database");
    const { queryDatabase } = require("../utils/helpers");

    // Generate secure token (32 chars for shorter URLs)
    const token = crypto.randomBytes(16).toString('hex');
    console.log("Generated secure token:", token);

    // Extract formId from feedbackLink
    const formIdMatch = feedbackLink.match(/\/feedback\/(\d+)/);
    const formId = formIdMatch ? formIdMatch[1] : null;

    if (!formId) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback link format"
      });
    }

    // Store invitation data with token
    const invitationData = {
      token,
      form_id: formId,
      supervisor_email: supervisorEmail,
      supervisor_name: supervisorName,
      company_name: companyName,
      alumnus_name: finalAlumnusName,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      used: false
    };

    console.log("Storing invitation data:", invitationData);

    // Insert invitation (ignore if token already exists)
    const insertResult = await queryDatabase(db,
      `INSERT INTO feedback_invitations
       (token, form_id, supervisor_email, supervisor_name, company_name, alumnus_name, created_at, expires_at, used)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       supervisor_email = VALUES(supervisor_email),
       supervisor_name = VALUES(supervisor_name),
       company_name = VALUES(company_name),
       alumnus_name = VALUES(alumnus_name)`,
      [
        invitationData.token,
        invitationData.form_id,
        invitationData.supervisor_email,
        invitationData.supervisor_name,
        invitationData.company_name,
        invitationData.alumnus_name,
        invitationData.created_at,
        invitationData.expires_at,
        invitationData.used
      ]
    );

    console.log("Invitation stored successfully, result:", insertResult);

    // Create secure short link using token
    const shortLink = `${process.env.PUBLIC_DOMAIN || 'https://feedbacts.online'}/feedback/t/${token}`;
    console.log("Secure short feedback link:", shortLink);

    console.log("Calling emailService.sendFeedbackInvitation...");
    const result = await emailService.sendFeedbackInvitation(
      supervisorEmail,
      supervisorName,
      companyName,
      finalAlumnusName,
      formTitle,
      shortLink // Use short link instead of long parameterized URL
    );

    console.log("Email service result:", result);
    if (result) {
      res.status(200).json({
        success: true,
        message: "Feedback invitation sent successfully",
        shortLink: shortLink
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

// Token-based form loading for secure short links
router.get("/public/t/:token", async (req, res) => {
  const { token } = req.params;

  console.log("=== Token-based form access ===");
  console.log("Full URL:", req.url);
  console.log("Token:", token);
  console.log("Token length:", token.length, "(expected: 32)");

  try {
    // Import database
    const db = require("../config/database");
    const { queryDatabase } = require("../utils/helpers");

    // Get invitation data by token
    console.log("Looking up token in database...");
    const invitations = await queryDatabase(db,
      `SELECT * FROM feedback_invitations
       WHERE token = ? AND used = false AND expires_at > NOW()`,
      [token]
    );

    console.log("Database query result:", invitations);

    if (!invitations || invitations.length === 0) {
      console.log("No valid invitations found for token:", token);

      // Check if token exists at all (for debugging)
      const allTokens = await queryDatabase(db,
        `SELECT token, used, expires_at, created_at FROM feedback_invitations WHERE token = ?`,
        [token]
      );
      console.log("Token exists in database:", allTokens);

      return res.status(404).json({
        success: false,
        message: "Invalid or expired invitation link"
      });
    }

    const invitation = invitations[0];
    console.log("Valid invitation found for form:", invitation.form_id);

    // Get the form data (reuse existing logic)
    const forms = await queryDatabase(db, "SELECT * FROM forms WHERE id = ?", [invitation.form_id]);

    if (!forms || forms.length === 0) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const form = forms[0];

    // Get form questions with options
    let questions = [];
    try {
      const questionsData = await queryDatabase(
        db,
        `SELECT q.id, q.form_id, q.section_id, q.question_text, q.question_type,
                q.description, q.required, q.order_index, q.min_value, q.max_value,
                qo.id as option_id, qo.option_text, qo.order_index as option_order
         FROM questions q
         LEFT JOIN question_options qo ON q.id = qo.question_id
         WHERE q.form_id = ?
         ORDER BY q.order_index ASC, qo.order_index ASC`,
        [invitation.form_id]
      );

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
    } catch (questionsError) {
      console.error("[DEBUG Token] Error fetching questions:", questionsError);
    }

    // Return form data with invitation info
    const formData = {
      id: form.id,
      title: form.title,
      description: form.description,
      category: form.category_id,
      start_date: form.start_date,
      end_date: form.end_date,
      image_url: form.image_url,
      questions: questions || [],
      // Include invitation data for pre-filling
      invitation: {
        supervisorEmail: invitation.supervisor_email,
        supervisorName: invitation.supervisor_name,
        companyName: invitation.company_name,
        alumnusName: invitation.alumnus_name,
        token: token
      }
    };

    console.log("Token-based form fetched successfully!");
    return res.status(200).json({
      success: true,
      form: formData
    });
  } catch (error) {
    console.error("Token-based form access error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Catch token-based feedback URLs and serve embedded page
router.get("/feedback/t/:token", (req, res) => {
  const token = req.params.token;
  console.log("🎯 SERVER HANDLING TOKEN URL:", token);

  // Create a simple HTML page that redirects with the token
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Redirecting to Feedback...</title>
    <script>
        // Set token in sessionStorage and redirect
        sessionStorage.setItem('external_feedback_token', '${token}');
        window.location.href = '${process.env.PUBLIC_DOMAIN || 'https://feedbacts.online'}';
    </script>
</head>
<body>
    <p>Redirecting to feedback form...</p>
</body>
</html>`;

  console.log("Serving redirect page with token:", token);
  res.send(html);
});

// Public route for external feedback (e.g., from email links) - NO authentication required
router.post("/public/submit", async (req, res) => {
  const { formId, responses, supervisorEmail, supervisorName, companyName, alumnusName, token } = req.body;

  console.log("=== Public feedback submission ===");
  console.log("Form ID:", formId);
  console.log("Token:", token ? "Present" : "Not provided");
  console.log("Supervisor:", supervisorName, supervisorEmail);

  // MINIMAL VALIDATION - just check required fields
  if (!responses) {
    console.log("❌ Missing required fields");
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  let finalFormId = formId;
  let finalSupervisorEmail = supervisorEmail;
  let finalSupervisorName = supervisorName;
  let finalCompanyName = companyName;
  let finalAlumnusName = alumnusName;

  // If token provided, get data from invitation
  if (token) {
    try {
      const db = require("../config/database");
      const { queryDatabase } = require("../utils/helpers");

      const invitations = await queryDatabase(db,
        `SELECT * FROM feedback_invitations
         WHERE token = ? AND used = false AND expires_at > NOW()`,
        [token]
      );

      if (invitations && invitations.length > 0) {
        const invitation = invitations[0];
        finalFormId = invitation.form_id;
        finalSupervisorEmail = invitation.supervisor_email;
        finalSupervisorName = invitation.supervisor_name;
        finalCompanyName = invitation.company_name;
        finalAlumnusName = invitation.alumnus_name;

        // Mark invitation as used
        await queryDatabase(db,
          "UPDATE feedback_invitations SET used = true WHERE token = ?",
          [token]
        );

        console.log("✅ Token validated and invitation marked as used");
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired invitation token"
        });
      }
    } catch (tokenError) {
      console.error("Token validation error:", tokenError);
      return res.status(500).json({
        success: false,
        message: "Token validation failed"
      });
    }
  } else if (!formId || !supervisorEmail || !supervisorName) {
    // For backward compatibility, require these if no token
    console.log("❌ Missing required fields for legacy submission");
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
        submittedAt: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Manila'
        })
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
