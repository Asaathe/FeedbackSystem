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

// Admin Authorization Middleware - Legacy function for backward compatibility
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
    // Get user role from database with additional security checks
    const query = `
      SELECT u.role, u.status, u.email_verified, u.last_login
      FROM Users u
      WHERE u.id = ? AND u.status = 'active'
    `;
    
    db.query(query, [req.userId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: "User not found or inactive",
        });
      }

      const user = results[0];
      const userRole = user.role;
      
      // Additional security checks
      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: "Account is not active",
        });
      }

      if (!allowedRoles.includes(userRole)) {
        // Log unauthorized access attempt
        console.warn(`Unauthorized access attempt: User ${req.userId} (${userRole}) tried to access restricted resource`);
        return res.status(403).json({
          success: false,
          message: "Insufficient permissions",
          code: "INSUFFICIENT_ROLE_PERMISSIONS"
        });
      }

      // Add user info to request for downstream use
      req.user = {
        id: req.userId,
        role: userRole,
        email: user.email,
        lastLogin: user.last_login
      };

      next();
    });
  };
};

// User management permissions
const requireUserManagementAccess = (req, res, next) => {
  return requireRole(['admin', 'staff'])(req, res, next);
};

// Form management permissions
const requireFormManagementAccess = (req, res, next) => {
  return requireRole(['admin', 'instructor', 'staff'])(req, res, next);
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
  requireFormAccess,
  requireUserManagementAccess,
  requireFormManagementAccess
};