// Form Categories Routes
const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");
const { verifyToken } = require("../middleware/auth");

// Get all categories
router.get("/", verifyToken, formController.getFormCategories);

// Add a new category
router.post("/", verifyToken, formController.addFormCategory);

// Delete a category
router.delete("/:id", verifyToken, formController.deleteFormCategory);

module.exports = router;
