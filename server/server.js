// FeedbACTS System - Main Server File
// Environment variables are loaded via process.env (configured in .env)

require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const path = require("path");
const fs = require("fs");

// Create temp directory for multer uploads
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log(`Created temp directory: ${tempDir}`);
}

const authRoutes = require("./routes/auth");
const formRoutes = require("./routes/forms");
const formCategoriesRoutes = require("./routes/formCategories");
const userRoutes = require("./routes/users");
// const courseRoutes = require("./routes/courses"); // DEPRECATED - using subject_offerings instead
const courseManagementRoutes = require("./routes/courseManagement");
const recipientRoutes = require("./routes/recipients");
const instructorRoutes = require("./routes/instructor");
const studentPromotionRoutes = require("./routes/studentPromotion");
const settingsRoutes = require("./routes/settings");
const notificationRoutes = require("./routes/notifications");

const app = express();

// Port configuration - use Railway's PORT env var or default to 8080
const port = process.env.PORT || 8080;

// Trust proxy for Railway deployment (handles X-Forwarded-For headers)
app.set('trust proxy', 1);

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
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:5173"],
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
  max: 500,
  message: { success: false, message: "Too many form submissions" },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
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
  db.query("SELECT COUNT(*) as userCount FROM users", (err, results) => {
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
// app.use("/api/courses", courseRoutes); // DEPRECATED
app.use("/api/programs", courseManagementRoutes);
app.use("/api/students", studentPromotionRoutes);
app.use("/api", recipientRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/settings", settingsRoutes);

// Notifications routes
app.use("/api/notifications", notificationRoutes);

// Subject Evaluation routes (for subject-assignment)
const subjectEvaluationRoutes = require("./routes/subjectEvaluation");
app.use("/api/subject-evaluation", subjectEvaluationRoutes);

// Subject Management routes
const subjectRoutes = require("./routes/subjects");
app.use("/api/subjects", subjectRoutes);

// Evaluation Form routes - DISABLED (using subject_offerings instead)
// const evaluationFormRoutes = require("./routes/evaluationForms");
// app.use("/api/evaluation-forms", evaluationFormRoutes);

// Feedback Template routes
const feedbackTemplateRoutes = require("./routes/feedbackTemplates");
app.use("/api/feedback-templates", feedbackTemplateRoutes);

// Alumni Employment Tracker routes
const employmentTrackerRoutes = require("./routes/employmentTracker");
app.use("/api/employment-tracker", employmentTrackerRoutes);



// Serve static files in production only if the build folder exists
const clientBuildPath = path.join(__dirname, "../CLIENT/build");
const clientBuildExists = fs.existsSync(clientBuildPath);

if (process.env.NODE_ENV === "production" && clientBuildExists) {
  app.use(express.static(clientBuildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
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

// ============================================
// SCHEDULED TASKS - Employment Update Scheduler
// ============================================
// Run daily at midnight to check for alumni due for employment update
const employmentUpdateScheduler = require('./services/employmentUpdateScheduler');

// Schedule the job to run every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Running daily employment update check...');
  try {
    const result = await employmentUpdateScheduler.checkAndScheduleEmploymentUpdates();
    console.log(`[CRON] Employment update check completed: ${result.sent} sent, ${result.failed} failed`);
  } catch (error) {
    console.error('[CRON] Employment update check failed:', error);
  }
});

console.log('[CRON] Employment update scheduler initialized - runs daily at midnight');

// ============================================
// SCHEDULED TASKS - Academic Period Auto-Transition
// ============================================
const semesterService = require('./services/semesterService');

cron.schedule('1 0 * * *', async () => {
  console.log('[CRON] Checking academic period auto-transitions...');
  try {
    const result = await semesterService.checkAutoTransitions();
    console.log(`[CRON] Auto-transition check completed: ${result.processed} periods processed`);
  } catch (error) {
    console.error('[CRON] Auto-transition check failed:', error);
  }
});

console.log('[CRON] Academic period auto-transition scheduler initialized - runs daily at 12:01 AM');

module.exports = app;
