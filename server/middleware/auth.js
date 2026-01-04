// Authentication Middleware
// This file contains middleware functions for JWT authentication and authorization

const jwt = require("jsonwebtoken");
const mysql = require("mysql");

// Database connection (same as in server.js)
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "feedback_system",
  port: process.env.DB_PORT || 3306,
});

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

// JWT Verification Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Admin Authorization Middleware
const requireAdmin = (req, res, next) => {
  // For now, we'll assume the first user (ID=1) is admin
  // In production, you'd have a proper admin role system
  if (req.userId !== 1) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
};

// Form Ownership Middleware
const requireFormOwnership = (req, res, next) => {
  const formId = req.params.id || req.params.formId;
  
  if (!formId) {
    return res.status(400).json({
      success: false,
      message: "Form ID required",
    });
  }

  // Check if user owns the form
  const query = "SELECT created_by FROM Forms WHERE id = ?";
  
  db.query(query, [formId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    if (results[0].created_by !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied - you can only modify your own forms",
      });
    }

    next();
  });
};

// Role-based Authorization Middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Get user role from database
    const query = "SELECT role FROM Users WHERE id = ?";
    
    db.query(query, [req.userId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const userRole = results[0].role;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
        });
      }

      next();
    });
  };
};

// Form Access Middleware
const requireFormAccess = (req, res, next) => {
  const formId = req.params.id || req.params.formId;
  
  if (!formId) {
    return res.status(400).json({
      success: false,
      message: "Form ID required",
    });
  }

  // Check if form exists and is accessible
  const query = `
    SELECT f.*, 
           CASE 
             WHEN f.is_template = TRUE THEN 'template'
             WHEN f.status = 'active' THEN 'active'
             WHEN f.status = 'draft' AND f.created_by = ? THEN 'owner'
             ELSE 'no_access'
           END as access_level
    FROM Forms f 
    WHERE f.id = ?
  `;
  
  db.query(query, [req.userId, formId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    const form = results[0];
    
    if (form.access_level === 'no_access') {
      return res.status(403).json({
        success: false,
        message: "Access denied - form is not available",
      });
    }

    req.form = form;
    next();
  });
};

// Export middleware functions
module.exports = {
  verifyToken,
  requireAdmin,
  requireFormOwnership,
  requireRole,
  requireFormAccess
};