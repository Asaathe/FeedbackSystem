// Form Routes
const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");
const responseController = require("../controllers/responseController");
const { verifyToken } = require("../middleware/auth");
const { uploadSingleImage, handleUploadError, getFileUrl } = require("../middleware/uploadMiddleware");

// Image upload route
router.post("/upload-image", verifyToken, uploadSingleImage('image'), handleUploadError, (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded"
    });
  }

  const imageUrl = getFileUrl(req.file, 'forms');

  res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    imageUrl: imageUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
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
