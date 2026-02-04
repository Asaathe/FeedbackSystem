// FeedbACTS System - Main Server File
// Environment variables are loaded via process.env (configured in .env)

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const authRoutes = require("./routes/auth");
const formRoutes = require("./routes/forms");
const formCategoriesRoutes = require("./routes/formCategories");
const userRoutes = require("./routes/users");
const courseRoutes = require("./routes/courses");
const recipientRoutes = require("./routes/recipients");
const instructorRoutes = require("./routes/instructor");

const app = express();
const port = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// CORS configuration - allow all origins for development
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Authorization"],
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5000"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  crossOriginEmbedderPolicy: false,
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many auth attempts, try again later" },
  skipSuccessfulRequests: true,
});

const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many form submissions" },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skipSuccessfulRequests: true,
});

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================
// ROUTES
// ============================================

// Health check endpoints
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

app.get("/api/db-status", (req, res) => {
  const db = require("./config/database");
  db.query("SELECT COUNT(*) as userCount FROM Users", (err, results) => {
    if (err) {
      res.json({ status: "error", message: err.message, connected: false });
    } else {
      res.json({ status: "success", message: "Database connected", connected: true });
    }
  });
});

// API routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/forms", formLimiter, formRoutes);
app.use("/api/form-categories", formCategoriesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api", recipientRoutes);
app.use("/api/instructor", instructorRoutes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../CLIENT/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../CLIENT/build", "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
