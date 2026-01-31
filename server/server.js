const express = require("express");
const cors = require("cors");
const path = require("path");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const { body, validationResult } = require("express-validator");
const crypto = require("crypto");
const multer = require("multer");
const fs = require("fs");
const db = require("./db");

const app = express();
const port = process.env.PORT || 5000;

// CRITICAL: Handle CORS preflight FIRST - before any other middleware
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Auth-Token",
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Max-Age", "86400");
    return res.sendStatus(200);
  }
  next();
});

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.warn(
    "Using default JWT secret - set JWT_SECRET environment variable for production",
  );
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "http://localhost:5000",
          "https://yourdomain.com",
        ],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// Force development mode for local testing
const isDevelopment = process.env.NODE_ENV !== "production";

// HTTPS enforcement middleware (for production)
app.use((req, res, next) => {
  if (isDevelopment) {
    return next();
  }

  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    return next();
  }

  const host = req.get("Host");
  const httpsUrl = `https://${host}${req.originalUrl}`;
  return res.redirect(301, httpsUrl);
});

// Add security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin ||
      origin.match(/^http:\/\/localhost(:\d+)?$/) ||
      origin.match(/^https:\/\/localhost(:\d+)?$/) ||
      origin.match(/^http:\/\/127\.0\.0\.1(:\d+)?$/) ||
      origin.match(/^https:\/\/127\.0\.0\.1(:\d+)?$/)
    ) {
      callback(null, true);
    } else {
      const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",")
        : [];

      if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-CSRF-Token",
    "X-Auth-Token",
  ],
  exposedHeaders: ["Authorization"],
  maxAge: 86400,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));


// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const formSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many form submissions, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

app.use(generalLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Utility functions
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Server verifyToken: authHeader:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const token = authHeader.substring(7);
  console.log(
    "Server verifyToken: extracted token:",
    token ? `${token.substring(0, 20)}...` : "null",
  );

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Server verifyToken: decoded token:", decoded);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.log("Server verifyToken: error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

const formatName = (name) => {
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return input.trim().replace(/[<>]/g, "");
};

const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return "Password must be at least 8 characters long";
  }
  if (!hasUpperCase) {
    return "Password must contain at least one uppercase letter";
  }
  if (!hasLowerCase) {
    return "Password must contain at least one lowercase letter";
  }
  if (!hasNumbers) {
    return "Password must contain at least one number";
  }
  if (!hasSpecialChar) {
    return "Password must contain at least one special character";
  }
  return null;
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper functions for role-specific data insertion
const insertStudentData = (userId, data) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO students (user_id, studentID, course_yr_section, department, contact_number, subjects)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(
      query,
      [
        userId,
        data.studentId,
        data.courseYrSection,
        data.department,
        data.contactNumber,
        data.subjects,
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
};

const insertInstructorData = (userId, data) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO instructors (user_id, instructor_id, department, subject_taught)
      VALUES (?, ?, ?, ?)
    `;
    db.query(
      query,
      [userId, data.instructorId, data.department, data.subjectTaught],
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
};

const insertAlumniData = (userId, data) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO alumni (user_id, grad_year, degree, jobtitle, contact, company)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(
      query,
      [
        userId,
        data.gradYear,
        data.degree,
        data.jobTitle,
        data.contact,
        data.company,
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
};

const insertEmployerData = (userId, data) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO employers (user_id, companyname, industry, location, contact)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(
      query,
      [
        userId,
        data.companyName,
        data.industry,
        data.location,
        data.contactNumber,
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      },
    );
  });
};

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

// Database status route
app.get("/api/db-status", (req, res) => {
  db.query("SELECT COUNT(*) as userCount FROM Users", (err, results) => {
    if (err) {
      res.json({
        status: "error",
        message: err.message,
        connected: false,
      });
    } else {
      res.json({
        status: "success",
        message: "Database connected successfully",
        connected: true,
        userCount: results[0].userCount,
      });
    }
  });
});

// Signup route
app.post(
  "/api/auth/signup",
  authLimiter,
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Invalid email address"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("fullName")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Full name must be at least 2 characters"),
    body("role")
      .isIn(["student", "instructor", "alumni", "employer"])
      .withMessage("Invalid role"),
    body("student_id")
      .if(body("role").equals("student"))
      .notEmpty()
      .withMessage("Student ID is required"),
    body("course_year_section")
      .if(body("role").equals("student"))
      .notEmpty()
      .withMessage("Course Year Section is required"),
    body("instructor_id")
      .if(body("role").equals("instructor"))
      .notEmpty()
      .withMessage("Instructor ID is required"),
    body("department")
      .if(body("role").equals("instructor"))
      .notEmpty()
      .withMessage("Department is required"),
    body("company_name")
      .if(body("role").equals("employer"))
      .notEmpty()
      .withMessage("Company name is required"),
    body("industry")
      .if(body("role").equals("employer"))
      .notEmpty()
      .withMessage("Industry is required"),
    body("degree")
      .if(body("role").equals("alumni"))
      .notEmpty()
      .withMessage("Degree is required"),
    body("alumni_company_name")
      .if(body("role").equals("alumni"))
      .notEmpty()
      .withMessage("Company name is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        email,
        password,
        fullName,
        role,
        student_id,
        course_year_section,
        instructor_id,
        department,
        company_name,
        industry,
        degree,
        alumni_company_name,
      } = req.body;

      const passwordError = validatePassword(password);
      if (passwordError) {
        return res.status(400).json({
          success: false,
          message: passwordError,
        });
      }

      const sanitizedEmail = sanitizeInput(email);
      const sanitizedFullName = sanitizeInput(fullName);
      const formattedFullName = formatName(sanitizedFullName);

      const checkUserQuery = "SELECT * FROM Users WHERE email = ?";
      db.query(checkUserQuery, [sanitizedEmail], async (err, results) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({
            success: false,
            message: "Database error",
          });
        }

        if (results.length > 0) {
          return res.status(400).json({
            success: false,
            message: "User already exists with this email",
          });
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insertUserQuery = `
          INSERT INTO users (email, password_hash, full_name, role, status, registration_date)
          VALUES (?, ?, ?, ?, 'pending', NOW())
        `;

        db.query(
          insertUserQuery,
          [sanitizedEmail, hashedPassword, formattedFullName, role],
          async (err, result) => {
            if (err) {
              console.error("Database error:", err);
              return res.status(500).json({
                success: false,
                message: "Failed to create user",
              });
            }

            const userId = result.insertId;

            try {
              switch (role) {
                case "student":
                  await insertStudentData(userId, {
                    studentId: student_id,
                    courseYrSection: course_year_section,
                    contactNumber: null,
                  });
                  break;
                case "instructor":
                  await insertInstructorData(userId, {
                    instructorId: instructor_id,
                    department: department,
                    specialization: null,
                  });
                  break;
                case "employer":
                  await insertEmployerData(userId, {
                    companyName: company_name,
                    industry: industry,
                    position: null,
                    companySize: null,
                    website: null,
                    location: null,
                    contactNumber: null,
                  });
                  break;
                case "alumni":
                  await insertAlumniData(userId, {
                    gradYear: null,
                    degree: degree,
                    jobTitle: null,
                    company: alumni_company_name,
                    industry: null,
                    location: null,
                    graduationDate: null,
                  });
                  break;
              }
            } catch (roleError) {
              console.error("Role-specific data insertion error:", roleError);
            }

            const token = generateToken(userId);

            res.status(201).json({
              success: true,
              message:
                "User created successfully. Please wait for admin approval.",
              token: token,
              user: {
                id: userId,
                email: sanitizedEmail,
                fullName: formattedFullName,
                role: role,
                status: "pending",
              },
            });
          },
        );
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Login route
app.post(
  "/api/auth/login",
  authLimiter,
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Invalid email address"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;
      const sanitizedEmail = sanitizeInput(email);

      const findUserQuery = `
        SELECT
            u.id, u.email, u.password_hash, u.full_name, u.role, u.status,
            s.studentID, s.course_yr_section, s.contact_number, s.subjects,
            i.instructor_id, i.department, i.subject_taught,
            a.grad_year, a.degree, a.jobtitle, a.contact, a.company,
            e.companyname, e.industry, e.location, e.contact
        FROM Users u
        LEFT JOIN Students s ON u.id = s.user_id
        LEFT JOIN Instructors i ON u.id = i.user_id
        LEFT JOIN Alumni a ON u.id = a.user_id
        LEFT JOIN Employers e ON u.id = e.user_id
        WHERE u.email = ?
      `;

      db.query(findUserQuery, [sanitizedEmail], async (err, results) => {
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
            message: "Invalid email or password",
          });
        }

        const user = results[0];

        if (user.status !== "active") {
          return res.status(401).json({
            success: false,
            message: "Unauthorized Access",
          });
        }

        const isPasswordValid = await bcrypt.compare(
          password,
          user.password_hash,
        );
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password",
          });
        }

        const token = generateToken(user.id);
        const userResponse = {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        };

        switch (user.role) {
          case "student":
            userResponse.studentId = user.studentID;
            userResponse.courseYrSection = user.course_yr_section;
            userResponse.contactNumber = user.contact_number;
            userResponse.subjects = user.subjects;
            break;
          case "instructor":
            userResponse.instructorId = user.instructor_id;
            userResponse.department = user.department;
            userResponse.subjectTaught = user.subject_taught;
            break;
          case "alumni":
            userResponse.gradYear = user.grad_year;
            userResponse.degree = user.degree;
            userResponse.jobTitle = user.jobtitle;
            userResponse.contact = user.contact;
            userResponse.company = user.company;
            break;
          case "employer":
            userResponse.companyName = user.companyname;
            userResponse.industry = user.industry;
            userResponse.location = user.location;
            userResponse.contact = user.contact;
            break;
        }

        res.json({
          success: true,
          message: "Login successful",
          token: token,
          user: userResponse,
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

// Token verification route
app.get("/api/auth/verify", verifyToken, (req, res) => {
  const findUserQuery = `
    SELECT
      u.id, u.email, u.full_name, u.role, u.status,
      s.studentID, s.course_yr_section, s.contact_number, s.subjects,
      i.instructor_id, i.department, i.subject_taught,
      a.grad_year, a.degree, a.jobtitle, a.contact, a.company,
      e.companyname, e.industry, e.location, e.contact
    FROM Users u
    LEFT JOIN Students s ON u.id = s.user_id
    LEFT JOIN Instructors i ON u.id = i.user_id
    LEFT JOIN Alumni a ON u.id = a.user_id
    LEFT JOIN Employers e ON u.id = e.user_id
    WHERE u.id = ?
  `;

  db.query(findUserQuery, [req.userId], (err, results) => {
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

    const user = results[0];
    const userResponse = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      status: user.status,
    };

    switch (user.role) {
      case "student":
        userResponse.studentId = user.studentID;
        userResponse.courseYrSection = user.course_yr_section;
        userResponse.contactNumber = user.contact_number;
        userResponse.subjects = user.subjects;
        break;
      case "instructor":
        userResponse.instructorId = user.instructor_id;
        userResponse.department = user.department;
        userResponse.subjectTaught = user.subject_taught;
        break;
      case "alumni":
        userResponse.gradYear = user.grad_year;
        userResponse.degree = user.degree;
        userResponse.jobTitle = user.jobtitle;
        userResponse.contact = user.contact;
        userResponse.company = user.company;
        break;
      case "employer":
        userResponse.companyName = user.companyname;
        userResponse.industry = user.industry;
        userResponse.location = user.location;
        userResponse.contact = user.contact;
        break;
    }

    res.json({
      success: true,
      user: userResponse,
    });
  });
});

// Logout route
app.post("/api/auth/logout", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// Token refresh route
app.post("/api/auth/refresh", verifyToken, (req, res) => {
  const userId = req.userId;
  const newToken = generateToken(userId);

  const findUserQuery = `
    SELECT
      u.id, u.email, u.full_name, u.role, u.status,
      s.studentID, s.course_yr_section, s.contact_number, s.subjects,
      i.instructor_id, i.department, i.subject_taught,
      a.grad_year, a.degree, a.jobtitle, a.contact, a.company,
      e.companyname, e.industry, e.location, e.contact
    FROM Users u
    LEFT JOIN Students s ON u.id = s.user_id
    LEFT JOIN Instructors i ON u.id = i.user_id
    LEFT JOIN Alumni a ON u.id = a.user_id
    LEFT JOIN Employers e ON u.id = e.user_id
    WHERE u.id = ?
  `;

  db.query(findUserQuery, [userId], (err, results) => {
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

    const user = results[0];

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: "Account is pending approval",
      });
    }
    const userResponse = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      status: user.status,
    };

    switch (user.role) {
      case "student":
        userResponse.studentId = user.studentID;
        userResponse.courseYrSection = user.course_yr_section;
        userResponse.contactNumber = user.contact_number;
        userResponse.subjects = user.subjects;
        break;
      case "instructor":
        userResponse.instructorId = user.instructor_id;
        userResponse.department = user.department;
        userResponse.subjectTaught = user.subject_taught;
        break;
      case "alumni":
        userResponse.gradYear = user.grad_year;
        userResponse.degree = user.degree;
        userResponse.jobTitle = user.jobtitle;
        userResponse.contact = user.contact;
        userResponse.company = user.company;
        break;
      case "employer":
        userResponse.companyName = user.companyname;
        userResponse.industry = user.industry;
        userResponse.location = user.location;
        userResponse.contact = user.contact;
        break;
    }

    res.json({
      success: true,
      message: "Token refreshed successfully",
      token: newToken,
      user: userResponse,
    });
  });
});

// Get users filtered by role
app.get("/api/users/filter", verifyToken, (req, res) => {
  try {
    const { role, course_year_section, department, company } = req.query;

    console.log("Filtering users with params:", {
      role,
      course_year_section,
      department,
      company,
    });

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role parameter is required",
      });
    }

    let query;
    let params = [];

    if (role === "student" || role === "students") {
      query = `
        SELECT
          u.id,
          u.email,
          u.full_name as name,
          u.role,
          u.status,
          s.studentID,
          s.course_yr_section
        FROM Users u
        JOIN Students s ON u.id = s.user_id
        WHERE u.role = 'student' AND u.status = 'active'
      `;

      if (course_year_section) {
        query += " AND s.course_yr_section = ?";
        params.push(course_year_section);
      }
    } else if (role === "instructor" || role === "instructors") {
      query = `
        SELECT
          u.id,
          u.email,
          u.full_name as name,
          u.role,
          u.status,
          i.instructor_id,
          i.department,
          i.subject_taught
        FROM Users u
        JOIN Instructors i ON u.id = i.user_id
        WHERE u.role = 'instructor' AND u.status = 'active'
      `;

      if (department) {
        query += " AND i.department = ?";
        params.push(department);
      }
    } else if (role === "alumni" || role === "alumni") {
      query = `
        SELECT
          u.id,
          u.email,
          u.full_name as name,
          u.role,
          u.status,
          a.grad_year,
          a.degree,
          a.jobtitle,
          a.company,
          a.contact
        FROM Users u
        JOIN Alumni a ON u.id = a.user_id
        WHERE u.role = 'alumni' AND u.status = 'active'
      `;

      if (company) {
        query += " AND a.company = ?";
        params.push(company);
      }
    } else if (role === "all") {
      query = `
        SELECT
          u.id,
          u.email,
          u.full_name as name,
          u.role,
          u.status
        FROM Users u
        WHERE u.status = 'active'
      `;
    } else {
      query = `
        SELECT
          u.id,
          u.email,
          u.full_name as name,
          u.role,
          u.status
        FROM Users u
        WHERE u.role = ? AND u.status = 'active'
      `;
      params.push(role);
    }

    query += " ORDER BY u.full_name";

    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
          error: err.message,
        });
      }

      console.log(` Found ${results.length} users`);

      const users = results.map((user) => {
        const formattedUser = {
          id: user.id,
          name: user.full_name || user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        };

        if (user.studentID) {
          formattedUser.details = user.course_yr_section || "No section";
          formattedUser.studentId = user.studentID;
          formattedUser.course_yr_section = user.course_yr_section;
        } else if (user.instructor_id) {
          formattedUser.details = user.department || "No department";
          formattedUser.instructorId = user.instructor_id;
          formattedUser.department = user.department;
          formattedUser.subjectTaught = user.subject_taught;
        } else if (user.company) {
          formattedUser.details = user.company || "No company";
          formattedUser.company = user.company;
          formattedUser.degree = user.degree;
          formattedUser.jobTitle = user.jobtitle;
        } else {
          formattedUser.details = "N/A";
        }

        return formattedUser;
      });

      res.json({
        success: true,
        users,
        count: users.length,
      });
    });
  } catch (error) {
    console.error(" Get filtered users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get unique companies for alumni filtering
app.get("/api/alumni/companies", verifyToken, (req, res) => {
  try {
    const query = `
      SELECT DISTINCT a.company
      FROM Alumni a
      JOIN Users u ON a.user_id = u.id
      WHERE u.status = 'active' AND a.company IS NOT NULL AND a.company != ''
      ORDER BY a.company
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      const companies = results
        .map((row) => row.company)
        .filter((company) => company);

      res.json({
        success: true,
        companies,
      });
    });
  } catch (error) {
    console.error("Get alumni companies error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get unique companies for employer filtering
app.get("/api/employers/companies", verifyToken, (req, res) => {
  try {
    const query = `
      SELECT DISTINCT e.companyname
      FROM Employers e
      JOIN Users u ON e.user_id = u.id
      WHERE u.status = 'active' AND e.companyname IS NOT NULL AND e.companyname != ''
      ORDER BY e.companyname
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      const companies = results
        .map((row) => row.companyname)
        .filter((company) => company);

      res.json({
        success: true,
        companies,
      });
    });
  } catch (error) {
    console.error("Get employer companies error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get unique departments for instructor filtering
app.get("/api/instructors/departments", verifyToken, (req, res) => {
  try {
    const query = `
      SELECT DISTINCT i.department
      FROM Instructors i
      JOIN Users u ON i.user_id = u.id
      WHERE u.status = 'active' AND i.department IS NOT NULL AND i.department != ''
      ORDER BY i.department
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      const departments = results
        .map((row) => row.department)
        .filter((dept) => dept);

      res.json({
        success: true,
        departments,
      });
    });
  } catch (error) {
    console.error("Get instructor departments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get unique course_year_sections for student filtering
app.get("/api/students/sections", verifyToken, (req, res) => {
  try {
    const query = `
      SELECT DISTINCT s.course_yr_section
      FROM Students s
      JOIN Users u ON s.user_id = u.id
      WHERE u.status = 'active' AND s.course_yr_section IS NOT NULL AND s.course_yr_section != ''
      ORDER BY s.course_yr_section
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      const sections = results
        .map((row) => row.course_yr_section)
        .filter((section) => section);

      res.json({
        success: true,
        sections,
      });
    });
  } catch (error) {
    console.error("Get student sections error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get users with filtering and pagination
app.get("/api/users", verifyToken, (req, res) => {
  try {
    const {
      search = "",
      role = "all",
      status = "all",
      page = 1,
      limit = 10,
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT
        u.id, u.email, u.full_name, u.role, u.status, u.registration_date as created_at,
        s.studentID, s.course_yr_section, s.department as student_department,
        i.instructor_id, i.department,
        a.degree, a.company,
        e.companyname, e.industry
      FROM Users u
      LEFT JOIN Students s ON u.id = s.user_id
      LEFT JOIN Instructors i ON u.id = i.user_id
      LEFT JOIN Alumni a ON u.id = a.user_id
      LEFT JOIN Employers e ON u.id = e.user_id
      WHERE u.role != 'admin'
    `;

    const params = [];

    if (search) {
      query += ` AND (u.full_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role !== "all") {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (status !== "all") {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY u.registration_date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      let countQuery = `SELECT COUNT(*) as total FROM Users u WHERE u.role != 'admin'`;
      const countParams = [];

      if (search) {
        countQuery += ` AND (u.full_name LIKE ? OR u.email LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`);
      }

      if (role !== "all") {
        countQuery += ` AND u.role = ?`;
        countParams.push(role);
      }

      if (status !== "all") {
        countQuery += ` AND u.status = ?`;
        countParams.push(status);
      }

      db.query(countQuery, countParams, (countErr, countResults) => {
        if (countErr) {
          console.error("Count error:", countErr);
          return res.status(500).json({
            success: false,
            message: "Database error",
          });
        }

        const total = countResults[0].total;
        const totalPages = Math.ceil(total / parseInt(limit));

        const users = results.map((user) => ({
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role,
          department: user.student_department || user.department || "N/A",
          status: user.status,
          createdAt: user.created_at,
          ...(user.studentID && {
            studentId: user.studentID,
            courseYrSection: user.course_yr_section,
          }),
          ...(user.instructor_id && { instructorId: user.instructor_id }),
          ...(user.degree && {
            degree: user.degree,
            alumniCompany: user.company,
          }),
          ...(user.companyname && {
            companyName: user.companyname,
            industry: user.industry,
          }),
        }));

        res.json({
          success: true,
          users,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
          },
        });
      });
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Profile update endpoint
app.patch("/api/users/me/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const updateData = req.body;

    const userQuery = "SELECT role FROM Users WHERE id = ?";
    db.query(userQuery, [userId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const userRole = results[0].role;

      switch (userRole) {
        case "student":
          if (
            updateData.studentId ||
            updateData.courseYrSection ||
            updateData.contactNumber ||
            updateData.subjects
          ) {
            const studentData = {
              studentId: updateData.studentId,
              courseYrSection: updateData.courseYrSection,
              contactNumber: updateData.contactNumber,
              subjects: updateData.subjects,
            };

            const studentQuery = `
              INSERT INTO students (user_id, studentID, course_yr_section, contact_number, subjects)
              VALUES (?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                studentID = VALUES(studentID),
                course_yr_section = VALUES(course_yr_section),
                contact_number = VALUES(contact_number),
                subjects = VALUES(subjects)
            `;

            db.query(
              studentQuery,
              [
                userId,
                studentData.studentId,
                studentData.courseYrSection,
                studentData.contactNumber,
                studentData.subjects,
              ],
              (err) => {
                if (err) {
                  console.error("Student update error:", err);
                  return res
                    .status(500)
                    .json({
                      success: false,
                      message: "Failed to update student data",
                    });
                }

                res.json({
                  success: true,
                  message: "Profile updated successfully",
                });
              },
            );
          } else {
            res.json({
              success: true,
              message: "Profile updated successfully",
            });
          }
          break;

        case "instructor":
          if (
            updateData.instructorId ||
            updateData.department ||
            updateData.subjectTaught
          ) {
            const instructorData = {
              instructorId: updateData.instructorId,
              department: updateData.department,
              subjectTaught: updateData.subjectTaught,
            };

            const instructorQuery = `
              INSERT INTO instructors (user_id, instructor_id, department, subject_taught)
              VALUES (?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                instructor_id = VALUES(instructor_id),
                department = VALUES(department),
                subject_taught = VALUES(subject_taught)
            `;

            db.query(
              instructorQuery,
              [
                userId,
                instructorData.instructorId,
                instructorData.department,
                instructorData.subjectTaught,
              ],
              (err) => {
                if (err) {
                  console.error("Instructor update error:", err);
                  return res
                    .status(500)
                    .json({
                      success: false,
                      message: "Failed to update instructor data",
                    });
                }

                res.json({
                  success: true,
                  message: "Profile updated successfully",
                });
              },
            );
          } else {
            res.json({
              success: true,
              message: "Profile updated successfully",
            });
          }
          break;

        case "alumni":
          if (
            updateData.gradYear ||
            updateData.degree ||
            updateData.jobTitle ||
            updateData.company ||
            updateData.contact
          ) {
            const alumniData = {
              gradYear: updateData.gradYear,
              degree: updateData.degree,
              jobTitle: updateData.jobTitle,
              contact: updateData.contact,
              company: updateData.company,
            };

            const alumniQuery = `
              INSERT INTO alumni (user_id, grad_year, degree, jobtitle, contact, company)
              VALUES (?, ?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                grad_year = VALUES(grad_year),
                degree = VALUES(degree),
                jobtitle = VALUES(jobtitle),
                contact = VALUES(contact),
                company = VALUES(company)
            `;

            db.query(
              alumniQuery,
              [
                userId,
                alumniData.gradYear,
                alumniData.degree,
                alumniData.jobTitle,
                alumniData.contact,
                alumniData.company,
              ],
              (err) => {
                if (err) {
                  console.error("Alumni update error:", err);
                  return res
                    .status(500)
                    .json({
                      success: false,
                      message: "Failed to update alumni data",
                    });
                }

                res.json({
                  success: true,
                  message: "Profile updated successfully",
                });
              },
            );
          } else {
            res.json({
              success: true,
              message: "Profile updated successfully",
            });
          }
          break;

        case "employer":
          if (
            updateData.companyName ||
            updateData.industry ||
            updateData.location ||
            updateData.contactNumber
          ) {
            const employerData = {
              companyName: updateData.companyName,
              industry: updateData.industry,
              location: updateData.location,
              contactNumber: updateData.contactNumber,
            };

            const employerQuery = `
              INSERT INTO employers (user_id, companyname, industry, location, contact)
              VALUES (?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                companyname = VALUES(companyname),
                industry = VALUES(industry),
                location = VALUES(location),
                contact = VALUES(contact)
            `;

            db.query(
              employerQuery,
              [
                userId,
                employerData.companyName,
                employerData.industry,
                employerData.location,
                employerData.contactNumber,
              ],
              (err) => {
                if (err) {
                  console.error("Employer update error:", err);
                  return res
                    .status(500)
                    .json({
                      success: false,
                      message: "Failed to update employer data",
                    });
                }

                res.json({
                  success: true,
                  message: "Profile updated successfully",
                });
              },
            );
          } else {
            res.json({
              success: true,
              message: "Profile updated successfully",
            });
          }
          break;

        default:
          res.json({ success: true, message: "Profile updated successfully" });
      }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Create user (admin manual addition)
app.post("/api/users/create", verifyToken, async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      role,
      department,
      studentId,
      course_year_section,
      employeeId,
      companyName,
      graduationYear,
      phoneNumber,
      address,
    } = req.body;

    const checkUserQuery = "SELECT * FROM Users WHERE email = ?";
    db.query(checkUserQuery, [email], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (results.length > 0) {
        return res.status(400).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const insertUserQuery = `
        INSERT INTO users (email, password_hash, full_name, role, status, registration_date)
        VALUES (?, ?, ?, ?, 'pending', NOW())
      `;

      db.query(
        insertUserQuery,
        [email, hashedPassword, fullName, role],
        async (err, result) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
              success: false,
              message: "Failed to create user",
            });
          }

          const userId = result.insertId;

          try {
            switch (role) {
              case "student":
                if (studentId || course_year_section) {
                  await insertStudentData(userId, {
                    studentId: studentId || null,
                    courseYrSection: course_year_section || null,
                    department: department || null,
                    contactNumber: phoneNumber || null,
                    subjects: null,
                  });
                }
                break;
              case "instructor":
              case "staff":
                if (employeeId || department) {
                  await insertInstructorData(userId, {
                    instructorId: employeeId || null,
                    department: department || null,
                    specialization: null,
                  });
                }
                break;
              case "employer":
                if (companyName) {
                  await insertEmployerData(userId, {
                    companyName,
                    industry: null,
                    position: null,
                    companySize: null,
                    website: null,
                    location: address || null,
                    contactNumber: phoneNumber || null,
                  });
                }
                break;
              case "alumni":
                if (graduationYear) {
                  await insertAlumniData(userId, {
                    gradYear: graduationYear,
                    degree: null,
                    jobTitle: null,
                    company: null,
                    industry: null,
                    location: address || null,
                    graduationDate: null,
                  });
                }
                break;
            }

            res.status(201).json({
              success: true,
              message:
                "User created successfully. Account is pending approval.",
              user: {
                id: userId,
                email,
                fullName,
                role,
                status: "pending",
              },
            });
          } catch (roleError) {
            console.error("Role-specific data insertion error:", roleError);
            res.status(201).json({
              success: true,
              message:
                "User created successfully. Account is pending approval.",
              user: {
                id: userId,
                email,
                fullName,
                role,
                status: "pending",
              },
            });
          }
        },
      );
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Approve user account
app.patch("/api/users/:id/approve", verifyToken, (req, res) => {
  try {
    const userId = req.params.id;

    const updateQuery = "UPDATE users SET status = 'active' WHERE id = ?";
    db.query(updateQuery, [userId], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const userQuery = `
        SELECT
          u.id, u.email, u.full_name, u.role, u.status,
          s.studentID, s.course_yr_section,
          i.instructor_id, i.department,
          a.degree, a.company,
          e.companyname, e.industry
        FROM Users u
        LEFT JOIN Students s ON u.id = s.user_id
        LEFT JOIN Instructors i ON u.id = i.user_id
        LEFT JOIN Alumni a ON u.id = a.user_id
        LEFT JOIN Employers e ON u.id = e.user_id
        WHERE u.id = ?
      `;

      db.query(userQuery, [userId], (userErr, userResults) => {
        if (userErr) {
          console.error("User fetch error:", userErr);
          return res.status(500).json({
            success: false,
            message: "Database error",
          });
        }

        const user = userResults[0];
        const userResponse = {
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role,
          department: user.department || "N/A",
          status: user.status,
          ...(user.studentID && {
            studentId: user.studentID,
            courseYrSection: user.course_yr_section,
          }),
          ...(user.instructor_id && { instructorId: user.instructor_id }),
          ...(user.degree && {
            degree: user.degree,
            alumniCompany: user.company,
          }),
          ...(user.companyname && {
            companyName: user.companyname,
            industry: user.industry,
          }),
        };

        res.json({
          success: true,
          message: "User account approved",
          user: userResponse,
        });
      });
    });
  } catch (error) {
    console.error("Approve user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Reject user account
app.patch("/api/users/:id/reject", verifyToken, (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;

    const deleteQuery = "DELETE FROM Users WHERE id = ?";
    db.query(deleteQuery, [userId], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User account rejected and removed",
      });
    });
  } catch (error) {
    console.error("Reject user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update user information
app.patch("/api/users/:id", verifyToken, (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    const updateFields = [];
    const updateValues = [];

    if (updateData.fullName) {
      updateFields.push("full_name = ?");
      updateValues.push(updateData.fullName);
    }
    if (updateData.email) {
      updateFields.push("email = ?");
      updateValues.push(updateData.email);
    }
    if (updateData.role) {
      updateFields.push("role = ?");
      updateValues.push(updateData.role);
    }
    if (updateData.status) {
      updateFields.push("status = ?");
      updateValues.push(updateData.status);
    }

    if (updateFields.length > 0) {
      const updateQuery = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
      updateValues.push(userId);

      db.query(updateQuery, updateValues, (err) => {
        if (err) {
          console.error("User update error:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to update user",
          });
        }

        const role = updateData.role;
        if (role) {
          switch (role) {
            case "student":
              if (updateData.studentId || updateData.courseYrSection) {
                const studentQuery = `
                  INSERT INTO students (user_id, studentID, course_yr_section)
                  VALUES (?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                    studentID = VALUES(studentID),
                    course_yr_section = VALUES(course_yr_section)
                `;
                db.query(
                  studentQuery,
                  [userId, updateData.studentId, updateData.courseYrSection],
                  (studentErr) => {
                    if (studentErr)
                      console.error("Student update error:", studentErr);
                  },
                );
              }
              break;
            case "instructor":
            case "staff":
              if (updateData.employeeId || updateData.department) {
                const instructorQuery = `
                  INSERT INTO instructors (user_id, instructor_id, department)
                  VALUES (?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                    instructor_id = VALUES(instructor_id),
                    department = VALUES(department)
                `;
                db.query(
                  instructorQuery,
                  [userId, updateData.employeeId, updateData.department],
                  (instructorErr) => {
                    if (instructorErr)
                      console.error("Instructor update error:", instructorErr);
                  },
                );
              }
              break;
            case "employer":
              if (updateData.companyName || updateData.industry) {
                const employerQuery = `
                  INSERT INTO employers (user_id, companyname, industry)
                  VALUES (?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                    companyname = VALUES(companyname),
                    industry = VALUES(industry)
                `;
                db.query(
                  employerQuery,
                  [userId, updateData.companyName, updateData.industry],
                  (employerErr) => {
                    if (employerErr)
                      console.error("Employer update error:", employerErr);
                  },
                );
              }
              break;
            case "alumni":
              if (updateData.degree || updateData.company) {
                const alumniQuery = `
                  INSERT INTO alumni (user_id, degree, company)
                  VALUES (?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                    degree = VALUES(degree),
                    company = VALUES(company)
                `;
                db.query(
                  alumniQuery,
                  [userId, updateData.degree, updateData.company],
                  (alumniErr) => {
                    if (alumniErr)
                      console.error("Alumni update error:", alumniErr);
                  },
                );
              }
              break;
          }
        }

        res.json({
          success: true,
          message: "User updated successfully",
        });
      });
    } else {
      res.json({
        success: true,
        message: "No changes to update",
      });
    }
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Delete user
app.delete("/api/users/:id", verifyToken, (req, res) => {
  try {
    const userId = req.params.id;

    const checkUserQuery = "SELECT id, role FROM Users WHERE id = ?";
    db.query(checkUserQuery, [userId], (err, results) => {
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

      const deleteRoleSpecificData = (callback) => {
        switch (userRole) {
          case "student":
            db.query(
              "DELETE FROM Students WHERE user_id = ?",
              [userId],
              callback,
            );
            break;
          case "instructor":
          case "staff":
            db.query(
              "DELETE FROM Instructors WHERE user_id = ?",
              [userId],
              callback,
            );
            break;
          case "employer":
            db.query(
              "DELETE FROM Employers WHERE user_id = ?",
              [userId],
              callback,
            );
            break;
          case "alumni":
            db.query(
              "DELETE FROM Alumni WHERE user_id = ?",
              [userId],
              callback,
            );
            break;
          default:
            callback(null);
        }
      };

      deleteRoleSpecificData((roleErr) => {
        if (roleErr) {
          console.error("Role-specific data deletion error:", roleErr);
          return res.status(500).json({
            success: false,
            message: "Failed to delete user data",
          });
        }

        const deleteUserQuery = "DELETE FROM Users WHERE id = ?";
        db.query(deleteUserQuery, [userId], (deleteErr, result) => {
          if (deleteErr) {
            console.error("User deletion error:", deleteErr);
            return res.status(500).json({
              success: false,
              message: "Failed to delete user",
            });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({
              success: false,
              message: "User not found",
            });
          }

          res.json({
            success: true,
            message: "User deleted successfully",
          });
        });
      });
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ============================================================
// FORM MANAGEMENT ENDPOINTS
// ============================================================

// Get all forms with filtering
app.get("/api/forms", verifyToken, (req, res) => {
  const {
    type = "all",
    status = "all",
    search = "",
    page = 1,
    limit = 10,
  } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT f.*, u.full_name as creator_name,
           COUNT(DISTINCT fr.id) as submission_count,
           COUNT(DISTINCT q.id) as question_count
    FROM Forms f
    LEFT JOIN Users u ON f.created_by = u.id
    LEFT JOIN Form_Responses fr ON f.id = fr.form_id
    LEFT JOIN Questions q ON f.id = q.form_id
    WHERE 1=1
  `;
  const params = [];

  if (type !== "all") {
    if (type === "templates") {
      query += ` AND f.is_template = TRUE`;
    } else {
      query += ` AND f.is_template = FALSE`;
    }
  }

  if (status !== "all") {
    query += ` AND f.status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (f.title LIKE ? OR f.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` GROUP BY f.id ORDER BY f.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    let countQuery = `SELECT COUNT(*) as total FROM Forms f WHERE 1=1`;
    const countParams = [];

    if (type !== "all") {
      if (type === "templates") {
        countQuery += ` AND f.is_template = TRUE`;
      } else {
        countQuery += ` AND f.is_template = FALSE`;
      }
    }

    if (status !== "all") {
      countQuery += ` AND f.status = ?`;
      countParams.push(status);
    }

    if (search) {
      countQuery += ` AND (f.title LIKE ? OR f.description LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    db.query(countQuery, countParams, (countErr, countResults) => {
      if (countErr) {
        console.error("Count error:", countErr);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }

      const total = countResults[0].total;
      const totalPages = Math.ceil(total / parseInt(limit));

      console.log("Forms API response:", {
        success: true,
        formCount: results.length,
        forms: results.map((f) => ({
          id: f.id,
          title: f.title,
          status: f.status,
          submission_count: f.submission_count,
          question_count: f.question_count,
          has_image_url: !!f.image_url,
          image_url_type: typeof f.image_url,
          image_url_length: f.image_url?.length,
          image_url_preview: f.image_url
            ? f.image_url.substring(0, 50) + "..."
            : "none",
        })),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
        },
      });

      res.json({
        success: true,
        forms: results,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
        },
      });
    });
  });
});

// Get single form with questions
app.get("/api/forms/:id", verifyToken, (req, res) => {
  const formId = req.params.id;

  const formQuery = `
    SELECT f.*, u.full_name as creator_name,
           COALESCE(
             CASE WHEN f.status = 'active' THEN DATE_FORMAT(fd.start_date, '%Y-%m-%d') END,
             DATE_FORMAT(f.start_date, '%Y-%m-%d')
           ) as start_date,
           COALESCE(
             CASE WHEN f.status = 'active' THEN DATE_FORMAT(fd.end_date, '%Y-%m-%d') END,
             DATE_FORMAT(f.end_date, '%Y-%m-%d')
           ) as end_date,
           fd.start_date as deployment_start_date,
           fd.end_date as deployment_end_date
    FROM Forms f
    LEFT JOIN Users u ON f.created_by = u.id
    LEFT JOIN Form_Deployments fd ON f.id = fd.form_id AND fd.deployment_status = 'active'
    WHERE f.id = ?
  `;

  db.query(formQuery, [formId], (err, formResults) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (formResults.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    const form = formResults[0];

    const questionsQuery = `
      SELECT q.*,
             GROUP_CONCAT(
               JSON_OBJECT('id', qo.id, 'option_text', qo.option_text, 'order_index', qo.order_index)
               ORDER BY qo.order_index
             ) as options_json
      FROM Questions q
      LEFT JOIN Question_Options qo ON q.id = qo.question_id
      WHERE q.form_id = ?
      GROUP BY q.id
      ORDER BY q.order_index
    `;

    db.query(questionsQuery, [formId], (questionsErr, questionsResults) => {
      if (questionsErr) {
        console.error("Questions error:", questionsErr);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }

      const questions = questionsResults.map((q) => ({
        id: q.id,
        type: q.question_type,
        question: q.question_text,
        description: q.description,
        required: q.required === 1 || q.required === true,
        options: q.options_json ? JSON.parse(`[${q.options_json}]`) : [],
        min: q.min_value,
        max: q.max_value,
      }));

      res.json({
        success: true,
        form: { ...form, questions },
      });
    });
  });
});

// Create new form
app.post("/api/forms", verifyToken, (req, res) => {
  const {
    title,
    description,
    category,
    targetAudience,
    startDate,
    endDate,
    questions,
    imageUrl,
    isTemplate = false,
  } = req.body;
  const createdBy = req.userId;

  if (!title || !category || !targetAudience) {
    return res.status(400).json({
      success: false,
      message: "Title, category, and target audience are required",
    });
  }

  const formQuery = `
    INSERT INTO Forms (title, description, category, target_audience, start_date, end_date, image_url, is_template, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
  `;

  db.query(
    formQuery,
    [
      title,
      description,
      category,
      targetAudience,
      startDate,
      endDate,
      imageUrl,
      isTemplate,
      createdBy,
    ],
    (err, result) => {
      if (err) {
        console.error("Form creation error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to create form" });
      }

      const formId = result.insertId;

      if (questions && questions.length > 0) {
        const questionPromises = questions.map((q, index) => {
          return new Promise((resolve, reject) => {
            if (!q.question || !q.type) {
              reject(new Error("Question text and type are required"));
              return;
            }

            const questionQuery = `
            INSERT INTO Questions (form_id, question_text, question_type, description, required, min_value, max_value, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;

            db.query(
              questionQuery,
              [
                formId,
                q.question,
                q.type,
                q.description || null,
                (q.required === true || q.required === 1) ? 1 : 0,
                q.min || null,
                q.max || null,
                index,
              ],
              (qErr, qResult) => {
                if (qErr) {
                  console.error(`Question ${index + 1} creation error:`, qErr);
                  reject(qErr);
                } else {
                  const questionId = qResult.insertId;

                  if (q.options && q.options.length > 0) {
                    const validOptions = q.options.filter((opt) => {
                      const optionText =
                        typeof opt === "string"
                          ? opt
                          : opt.option_text || opt.text || opt.label;
                      return optionText && optionText.trim().length > 0;
                    });

                    if (validOptions.length > 0) {
                      const optionPromises = validOptions.map((opt, optIndex) => {
                        return new Promise((optResolve, optReject) => {
                          const optionText =
                            typeof opt === "string"
                              ? opt
                              : opt.option_text || opt.text || opt.label;

                          db.query(
                            "INSERT INTO Question_Options (question_id, option_text, order_index) VALUES (?, ?, ?)",
                            [questionId, optionText, optIndex],
                            (optErr) => {
                              if (optErr) {
                                console.error(`Option ${optIndex + 1} creation error:`, optErr);
                                optReject(optErr);
                              } else {
                                optResolve();
                              }
                            }
                          );
                        });
                      });

                      Promise.all(optionPromises)
                        .then(() => resolve())
                        .catch((optError) => reject(optError));
                    } else {
                      resolve();
                    }
                  } else {
                    resolve();
                  }
                }
              },
            );
          });
        });

        Promise.all(questionPromises)
          .then(() => {
            res.status(201).json({
              success: true,
              message: "Form created successfully",
              formId,
              questionCount: questions.length,
            });
          })
          .catch((error) => {
            db.query("DELETE FROM Forms WHERE id = ?", [formId], (deleteErr) => {
              if (deleteErr) {
                console.error("Failed to rollback form creation:", deleteErr);
              }
            });
            res.status(500).json({
              success: false,
              message: "Failed to create form questions",
              error: error.message,
            });
          });
      } else {
        res.status(201).json({
          success: true,
          message: "Form created successfully",
          formId,
          questionCount: 0,
        });
      }
    },
  );
});

// Update form - FIXED VERSION
app.patch("/api/forms/:id", verifyToken, (req, res) => {
  const formId = req.params.id;
  const updates = req.body;

  console.log(`🔄 Updating form ${formId} with data:`, updates);

  const fieldMapping = {
    targetAudience: 'target_audience',
    imageUrl: 'image_url',
    startDate: 'start_date',
    endDate: 'end_date'
  };

  Object.keys(fieldMapping).forEach(clientField => {
    if (updates[clientField] !== undefined) {
      updates[fieldMapping[clientField]] = updates[clientField];
      delete updates[clientField];
    }
  });

  const targetAudienceChanged = updates.target_audience !== undefined;
  let oldTargetAudience = null;

  const updateFields = [];
  const updateValues = [];

  const allowedFields = [
    "title",
    "description",
    "category",
    "target_audience",
    "status",
    "image_url",
    "start_date",
    "end_date",
  ];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      updateValues.push(updates[field]);
    }
  });

  const questions = updates.questions;
  delete updates.questions;

  if (updateFields.length === 0 && !questions) {
    return res
      .status(400)
      .json({ success: false, message: "No valid fields to update" });
  }

  const updateQuestions = (callback) => {
    if (!questions || !Array.isArray(questions)) {
      callback();
      return;
    }

    db.beginTransaction((transactionErr) => {
      if (transactionErr) {
        console.error("Transaction start error:", transactionErr);
        callback();
        return;
      }

      db.query(
        "DELETE FROM Question_Options WHERE question_id IN (SELECT id FROM Questions WHERE form_id = ?)",
        [formId],
        (deleteOptionsErr) => {
          if (deleteOptionsErr) {
            console.error("Delete options error:", deleteOptionsErr);
            db.rollback(() => callback());
            return;
          }

          db.query(
            "DELETE FROM Questions WHERE form_id = ?",
            [formId],
            (deleteQuestionsErr) => {
              if (deleteQuestionsErr) {
                console.error("Delete questions error:", deleteQuestionsErr);
                db.rollback(() => callback());
                return;
              }

              if (questions.length === 0) {
                db.commit((commitErr) => {
                  if (commitErr) {
                    console.error("Commit error:", commitErr);
                  }
                  callback();
                });
                return;
              }

              const questionPromises = questions.map((q, index) => {
                return new Promise((resolve, reject) => {
                  if (!q.question || !q.type) {
                    reject(new Error("Question text and type are required"));
                    return;
                  }

                  const questionQuery = `
                INSERT INTO Questions (form_id, question_text, question_type, description, required, min_value, max_value, order_index)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `;

                  db.query(
                    questionQuery,
                    [
                      formId,
                      q.question,
                      q.type,
                      q.description || null,
                      (q.required === true || q.required === 1) ? 1 : 0,
                      q.min || null,
                      q.max || null,
                      index,
                    ],
                    (qErr, qResult) => {
                      if (qErr) {
                        console.error("Question creation error:", qErr);
                        reject(qErr);
                      } else {
                        const questionId = qResult.insertId;

                        if (q.options && q.options.length > 0) {
                          const optionPromises = q.options.map(
                            (opt, optIndex) => {
                              return new Promise((optResolve, optReject) => {
                                const optionText =
                                  typeof opt === "string"
                                    ? opt
                                    : (opt && (opt.option_text || opt.text || opt.label));

                                if (!optionText) {
                                  console.error("Invalid option object:", opt);
                                  optReject(new Error("Option text is required"));
                                  return;
                                }

                                db.query(
                                  "INSERT INTO Question_Options (question_id, option_text, order_index) VALUES (?, ?, ?)",
                                  [questionId, optionText, optIndex],
                                  (optErr) =>
                                    optErr ? optReject(optErr) : optResolve(),
                                );
                              });
                            },
                          );

                          Promise.all(optionPromises)
                            .then(() => resolve())
                            .catch((optError) => {
                              console.error("Option creation error:", optError);
                              reject(optError);
                            });
                        } else {
                          resolve();
                        }
                      }
                    },
                  );
                });
              });

              Promise.all(questionPromises)
                .then(() => {
                  db.commit((commitErr) => {
                    if (commitErr) {
                      console.error("Commit error:", commitErr);
                      db.rollback(() => callback());
                    } else {
                      console.log(`✅ Questions updated for form ${formId}`);
                      callback();
                    }
                  });
                })
                .catch((error) => {
                  console.error("Questions update error:", error);
                  db.rollback(() => callback());
                });
            }
          );
        }
      );
    });
  };

  const reassignFormToNewAudience = (callback) => {
    console.log(`🔄 Reassigning form ${formId} from "${oldTargetAudience}" to "${updates.target_audience}"`);

    const roleMapping = {
      'Students': 'student',
      'Instructors': 'instructor',
      'Alumni': 'alumni',
      'Staff': 'employer',
      'All Users': 'all'
    };

    const oldRole = roleMapping[oldTargetAudience] || 'all';
    const newRole = roleMapping[updates.target_audience] || 'all';

    let deleteQuery = "DELETE FROM Form_Assignments WHERE form_id = ?";
    let deleteParams = [formId];

    if (oldRole !== 'all') {
      deleteQuery += " AND user_id IN (SELECT id FROM Users WHERE role = ?)";
      deleteParams.push(oldRole);
    }

    db.query(deleteQuery, deleteParams, (deleteErr) => {
      if (deleteErr) {
        console.error("Error deleting old assignments:", deleteErr);
      }

      if (newRole === 'all') {
        db.query("SELECT id FROM Users", (userErr, userResults) => {
          if (userErr) {
            console.error("Error fetching users:", userErr);
            callback();
            return;
          }

          if (userResults.length === 0) {
            callback();
            return;
          }

          const assignmentValues = userResults.map(user => [formId, user.id, 'pending']);
          db.query("INSERT INTO Form_Assignments (form_id, user_id, status) VALUES ?", [assignmentValues], (assignErr) => {
            if (assignErr) {
              console.error("Error creating assignments:", assignErr);
            } else {
              console.log(`✅ Reassigned form to ${userResults.length} users`);
            }
            callback();
          });
        });
      } else {
        db.query("SELECT id FROM Users WHERE role = ?", [newRole], (userErr, userResults) => {
          if (userErr) {
            console.error("Error fetching users:", userErr);
            callback();
            return;
          }

          if (userResults.length === 0) {
            callback();
            return;
          }

          const assignmentValues = userResults.map(user => [formId, user.id, 'pending']);
          db.query("INSERT INTO Form_Assignments (form_id, user_id, status) VALUES ?", [assignmentValues], (assignErr) => {
            if (assignErr) {
              console.error("Error creating assignments:", assignErr);
            } else {
              console.log(`✅ Reassigned form to ${userResults.length} users with role ${newRole}`);
            }
            callback();
          });
        });
      }
    });
  };

  const performUpdate = () => {
    if (updateFields.length > 0) {
      const updateQuery = `UPDATE Forms SET ${updateFields.join(", ")}, updated_at = NOW() WHERE id = ?`;
      const finalUpdateValues = [...updateValues, formId];

      db.query(updateQuery, finalUpdateValues, (err, result) => {
        if (err) {
          console.error("Form update error:", err);
          return res
            .status(500)
            .json({ success: false, message: "Failed to update form" });
        }

        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Form not found" });
        }

        console.log(`✅ Form ${formId} basic info updated successfully`);

        if (questions && Array.isArray(questions)) {
          updateQuestions(() => {
            if (targetAudienceChanged && oldTargetAudience !== updates.target_audience) {
              reassignFormToNewAudience(() => {
                res.json({ success: true, message: "Form updated successfully with questions and reassigned" });
              });
            } else {
              res.json({ success: true, message: "Form updated successfully with questions" });
            }
          });
        } else {
          if (targetAudienceChanged && oldTargetAudience !== updates.target_audience) {
            reassignFormToNewAudience(() => {
              res.json({ success: true, message: "Form updated and reassigned successfully" });
            });
          } else {
            res.json({ success: true, message: "Form updated successfully" });
          }
        }
      });
    } else if (questions && Array.isArray(questions)) {
      updateQuestions(() => {
        res.json({ success: true, message: "Form questions updated successfully" });
      });
    } else {
      res.status(400).json({ success: false, message: "No valid fields to update" });
    }
  };

  const getCurrentFormAndUpdate = () => {
    if (targetAudienceChanged) {
      db.query("SELECT target_audience FROM Forms WHERE id = ?", [formId], (err, results) => {
        if (err) {
          console.error("Error fetching current form:", err);
          return res.status(500).json({ success: false, message: "Database error" });
        }

        if (results.length === 0) {
          return res.status(404).json({ success: false, message: "Form not found" });
        }

        oldTargetAudience = results[0].target_audience;
        performUpdate();
      });
    } else {
      performUpdate();
    }
  };

  getCurrentFormAndUpdate();
});

// Delete form
app.delete("/api/forms/:id", verifyToken, (req, res) => {
  const formId = req.params.id;

  db.query("DELETE FROM Forms WHERE id = ?", [formId], (err, result) => {
    if (err) {
      console.error("Form deletion error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete form" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    res.json({ success: true, message: "Form deleted successfully" });
  });
});

// Duplicate form
app.post("/api/forms/:id/duplicate", verifyToken, (req, res) => {
  const originalFormId = req.params.id;
  const userId = req.userId;

  db.query(
    "SELECT * FROM Forms WHERE id = ?",
    [originalFormId],
    (err, formResults) => {
      if (err || formResults.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Original form not found" });
      }

      const originalForm = formResults[0];

      const duplicateQuery = `
      INSERT INTO Forms (title, description, category, target_audience, status, image_url, start_date, end_date, is_template, created_by)
      VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)
    `;

      db.query(
        duplicateQuery,
        [
          originalForm.title + " (Copy)",
          originalForm.description,
          originalForm.category,
          "All Users", // Don't copy target_audience, set to default
          originalForm.image_url,
          originalForm.start_date,
          originalForm.end_date,
          originalForm.is_template,
          userId,
        ],
        (dupErr, dupResult) => {
          if (dupErr) {
            console.error("Duplicate error:", dupErr);
            return res
              .status(500)
              .json({ success: false, message: "Failed to duplicate form" });
          }

          const newFormId = dupResult.insertId;

          // Now duplicate questions
          db.query(
            "SELECT * FROM Questions WHERE form_id = ? ORDER BY order_index",
            [originalFormId],
            (qErr, questions) => {
              if (qErr) {
                console.error("Error fetching questions:", qErr);
                return res
                  .status(500)
                  .json({ success: false, message: "Failed to duplicate questions" });
              }

              if (questions.length === 0) {
                // No questions to duplicate
                return res
                  .status(201)
                  .json({
                    success: true,
                    message: "Form duplicated successfully",
                    formId: newFormId,
                  });
              }

              let questionsProcessed = 0;
              const totalQuestions = questions.length;

              questions.forEach((question) => {
                const insertQuestionQuery = `
                  INSERT INTO Questions (form_id, question_text, question_type, description, required, min_value, max_value, order_index)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;

                db.query(
                  insertQuestionQuery,
                  [
                    newFormId,
                    question.question_text,
                    question.question_type,
                    question.description,
                    question.required,
                    question.min_value,
                    question.max_value,
                    question.order_index,
                  ],
                  (qInsErr, qInsResult) => {
                    if (qInsErr) {
                      console.error("Error inserting question:", qInsErr);
                      return res
                        .status(500)
                        .json({ success: false, message: "Failed to duplicate questions" });
                    }

                    const newQuestionId = qInsResult.insertId;

                    // Duplicate options for this question
                    db.query(
                      "SELECT * FROM Question_Options WHERE question_id = ? ORDER BY order_index",
                      [question.id],
                      (optErr, options) => {
                        if (optErr) {
                          console.error("Error fetching options:", optErr);
                          return res
                            .status(500)
                            .json({ success: false, message: "Failed to duplicate options" });
                        }

                        if (options.length > 0) {
                          const insertOptionsQuery = `
                            INSERT INTO Question_Options (question_id, option_text, order_index)
                            VALUES ${options.map(() => "(?, ?, ?)").join(", ")}
                          `;

                          const optionValues = [];
                          options.forEach((option) => {
                            optionValues.push(newQuestionId, option.option_text, option.order_index);
                          });

                          db.query(insertOptionsQuery, optionValues, (optInsErr) => {
                            if (optInsErr) {
                              console.error("Error inserting options:", optInsErr);
                              return res
                                .status(500)
                                .json({ success: false, message: "Failed to duplicate options" });
                            }

                            checkCompletion();
                          });
                        } else {
                          checkCompletion();
                        }
                      }
                    );
                  }
                );
              });

              const checkCompletion = () => {
                questionsProcessed++;
                if (questionsProcessed === totalQuestions) {
                  res
                    .status(201)
                    .json({
                      success: true,
                      message: "Form duplicated successfully",
                      formId: newFormId,
                    });
                }
              };
            }
          );
        },
      );
    },
  );
});

// Save form as template
app.post("/api/forms/:id/save-as-template", verifyToken, (req, res) => {
  const formId = req.params.id;
  const userId = req.userId;

  console.log(
    `🔄 Save as template request for form ${formId} by user ${userId}`,
  );

  db.query("SELECT * FROM Forms WHERE id = ?", [formId], (err, formResults) => {
    if (err) {
      console.error("Database error fetching form:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (formResults.length === 0) {
      console.log(`❌ Form ${formId} not found`);
      return res
        .status(404)
        .json({ success: false, message: "Original form not found" });
    }

    const originalForm = formResults[0];

    const updateOriginalQuery =
      "UPDATE Forms SET is_template = TRUE, status = 'template' WHERE id = ?";
    db.query(updateOriginalQuery, [formId], (updateErr, updateResult) => {
      if (updateErr) {
        console.error("Original form update error:", updateErr);
        return res
          .status(500)
          .json({
            success: false,
            message: "Failed to update form to template",
          });
      }

      console.log(`✅ Form ${formId} saved as template successfully`);

      res.json({
        success: true,
        message: "Form saved as template successfully",
        templateId: formId,
      });
    });
  });
});

// Deploy form - FIXED VERSION
app.post("/api/forms/:id/deploy", verifyToken, (req, res) => {
  const formId = req.params.id;
  const { startDate, endDate, targetFilters } = req.body;
  const deployedBy = req.userId;

  console.log(`🚀 Deploying form ${formId} with data:`, {
    startDate,
    endDate,
    targetFilters,
  });

  db.beginTransaction((err) => {
    if (err) {
      console.error("Transaction start error:", err);
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to start deployment transaction",
        });
    }

    const checkQuery = `SELECT id FROM Form_Deployments WHERE form_id = ? LIMIT 1`;

    db.query(checkQuery, [formId], (checkErr, checkResult) => {
      if (checkErr) {
        console.error("💥 Deployment check error:", checkErr);
        db.rollback(() => {
          res.status(500).json({
            success: false,
            message: "Failed to check existing deployment",
            error: checkErr.message,
          });
        });
        return;
      }

      const deploymentExists = checkResult.length > 0;
      let deployQuery;
      let queryParams;

      if (deploymentExists) {
        deployQuery = `
          UPDATE Form_Deployments
          SET start_date = ?, end_date = ?, target_filters = ?, deployment_status = 'active'
          WHERE form_id = ?
        `;
        queryParams = [startDate, endDate, JSON.stringify(targetFilters), formId];
      } else {
        deployQuery = `
          INSERT INTO Form_Deployments (form_id, deployed_by, start_date, end_date, target_filters)
          VALUES (?, ?, ?, ?, ?)
        `;
        queryParams = [formId, deployedBy, startDate, endDate, JSON.stringify(targetFilters)];
      }

      db.query(deployQuery, queryParams, (err, result) => {
        if (err) {
          console.error("💥 Deployment insertion error:", err);
          db.rollback(() => {
            res
              .status(500)
              .json({
                success: false,
                message: "Failed to create deployment record",
                error: err.message,
              });
          });
          return;
        }

        console.log(
          `✅ Deployment record ${deploymentExists ? 'updated' : 'created'} with ID: ${result.insertId || 'existing'}`,
        );

        db.query(
          "UPDATE Forms SET status = 'active' WHERE id = ?",
          [formId],
          (updateErr, updateResult) => {
            if (updateErr) {
              console.error("💥 Form status update error:", updateErr);
              db.rollback(() => {
                res
                  .status(500)
                  .json({
                    success: false,
                    message: "Failed to update form status",
                    error: updateErr.message,
                  });
              });
              return;
            }

            console.log(`✅ Form ${formId} status updated to active`);

            const targetAudience = targetFilters?.target_audience;
            if (targetAudience) {
              console.log(
                `👥 Assigning form ${formId} to users with target audience: ${targetAudience}`,
              );

              let userQuery = `SELECT DISTINCT u.id FROM Users u WHERE u.status = 'active'`;
              const queryParams = [];

              if (targetAudience && targetAudience !== "All Users") {
                if (targetAudience.startsWith("Students - ")) {
                  const targetPart = targetAudience
                    .replace("Students - ", "")
                    .trim();

                  if (targetPart.startsWith("College ")) {
                    const courseName = targetPart
                      .replace("College ", "")
                      .trim();

                    userQuery = `
                    SELECT DISTINCT u.id
                    FROM Users u
                    JOIN Students s ON u.id = s.user_id
                    WHERE u.status = 'active'
                      AND u.role = 'student'
                      AND s.course_yr_section LIKE ?
                  `;
                    queryParams.push(`${courseName}%`);
                  } else if (targetPart.includes("-")) {
                    userQuery = `
                    SELECT DISTINCT u.id
                    FROM Users u
                    JOIN Students s ON u.id = s.user_id
                    WHERE u.status = 'active'
                      AND u.role = 'student'
                      AND s.course_yr_section = ?
                  `;
                    queryParams.push(targetPart);
                  } else if (targetPart.startsWith("Grade ")) {
                    userQuery = `
                    SELECT DISTINCT u.id
                    FROM Users u
                    JOIN Students s ON u.id = s.user_id
                    WHERE u.status = 'active'
                      AND u.role = 'student'
                      AND s.course_yr_section LIKE ?
                  `;
                    queryParams.push(`${targetPart}%`);
                  } else {
                    userQuery = `
                    SELECT DISTINCT u.id
                    FROM Users u
                    WHERE u.status = 'active'
                      AND u.role = 'student'
                  `;
                  }
                } else if (targetAudience.startsWith("Instructors - ")) {
                  const dept = targetAudience
                    .replace("Instructors - ", "")
                    .trim();

                  userQuery = `
                  SELECT DISTINCT u.id
                  FROM Users u
                  JOIN Instructors i ON u.id = i.user_id
                  WHERE u.status = 'active'
                    AND u.role = 'instructor'
                    AND i.department = ?
                `;
                  queryParams.push(dept);
                } else if (targetAudience === "Students") {
                  userQuery += " AND u.role = 'student'";
                } else if (targetAudience === "Instructors") {
                  userQuery += " AND u.role = 'instructor'";
                } else if (targetAudience === "Alumni") {
                  userQuery += " AND u.role = 'alumni'";
                } else if (targetAudience === "Staff") {
                  userQuery += " AND u.role = 'staff'";
                }
              }

              db.query(userQuery, queryParams, (userErr, userResults) => {
                if (userErr) {
                  console.error("❌ User query error:", userErr);
                  db.commit((commitErr) => {
                    if (commitErr) {
                      console.error("💥 Transaction commit error:", commitErr);
                      db.rollback(() => {
                        res
                          .status(500)
                          .json({
                            success: false,
                            message: "Failed to commit deployment transaction",
                          });
                      });
                      return;
                    }

                    res.json({
                      success: true,
                      message: "Form deployed successfully (assignment may have failed)",
                      deploymentId: result.insertId,
                    });
                  });
                  return;
                }

                console.log(`✅ Found ${userResults.length} users for assignment`);

                if (userResults.length === 0) {
                  db.commit((commitErr) => {
                    if (commitErr) {
                      console.error("💥 Transaction commit error:", commitErr);
                      db.rollback(() => {
                        res
                          .status(500)
                          .json({
                            success: false,
                            message: "Failed to commit deployment transaction",
                          });
                      });
                      return;
                    }

                    res.json({
                      success: true,
                      message: "Form deployed successfully (no users to assign)",
                      deploymentId: result.insertId,
                    });
                  });
                  return;
                }

                const userIdsToAssign = userResults.map((u) => u.id);

                const checkQuery = `
                SELECT user_id FROM Form_Assignments
                WHERE form_id = ? AND user_id IN (?)
              `;

                db.query(
                  checkQuery,
                  [formId, userIdsToAssign],
                  (checkErr, existingAssignments) => {
                    if (checkErr) {
                      console.error("Check assignments error:", checkErr);
                      db.commit((commitErr) => {
                        if (commitErr) {
                          console.error("💥 Transaction commit error:", commitErr);
                          db.rollback(() => {
                            res
                              .status(500)
                              .json({
                                success: false,
                                message: "Failed to commit deployment transaction",
                              });
                          });
                          return;
                        }

                        res.json({
                          success: true,
                          message: "Form deployed successfully (assignment check failed)",
                          deploymentId: result.insertId,
                        });
                      });
                      return;
                    }

                    const existingUserIds = existingAssignments.map(
                      (a) => a.user_id,
                    );
                    const newUserIds = userIdsToAssign.filter(
                      (id) => !existingUserIds.includes(id),
                    );

                    if (newUserIds.length === 0) {
                      db.commit((commitErr) => {
                        if (commitErr) {
                          console.error("💥 Transaction commit error:", commitErr);
                          db.rollback(() => {
                            res
                              .status(500)
                              .json({
                                success: false,
                                message: "Failed to commit deployment transaction",
                              });
                          });
                          return;
                        }

                        res.json({
                          success: true,
                          message: "Form deployed successfully (already assigned to all users)",
                          deploymentId: result.insertId,
                        });
                      });
                      return;
                    }

                    const assignmentValues = newUserIds.map((userId) => [
                      formId,
                      userId,
                      "pending",
                    ]);
                    const insertQuery = `
                  INSERT INTO Form_Assignments (form_id, user_id, status)
                  VALUES ?
                `;

                    db.query(
                      insertQuery,
                      [assignmentValues],
                      (insertErr, insertResult) => {
                        if (insertErr) {
                          console.error("Insert assignments error:", insertErr);
                          db.commit((commitErr) => {
                            if (commitErr) {
                              console.error("💥 Transaction commit error:", commitErr);
                              db.rollback(() => {
                                res
                                  .status(500)
                                  .json({
                                    success: false,
                                    message: "Failed to commit deployment transaction",
                                  });
                              });
                              return;
                            }

                            res.json({
                              success: true,
                              message: "Form deployed successfully (assignment failed)",
                              deploymentId: result.insertId,
                            });
                          });
                          return;
                        }

                        console.log(`✅ Created ${insertResult.affectedRows} form assignments`);

                        db.commit((commitErr) => {
                          if (commitErr) {
                            console.error("💥 Transaction commit error:", commitErr);
                            db.rollback(() => {
                              res
                                .status(500)
                                .json({
                                  success: false,
                                  message: "Failed to commit deployment transaction",
                                });
                            });
                            return;
                          }

                          res.json({
                            success: true,
                            message: `Form deployed successfully and assigned to ${insertResult.affectedRows} users`,
                            deploymentId: result.insertId,
                            assignedCount: insertResult.affectedRows,
                          });
                        });
                      },
                    );
                  },
                );
              });
            } else {
              console.log("⚠️ No target audience specified for assignment");

              db.commit((commitErr) => {
                if (commitErr) {
                  console.error("💥 Transaction commit error:", commitErr);
                  db.rollback(() => {
                    res
                      .status(500)
                      .json({
                        success: false,
                        message: "Failed to commit deployment transaction",
                      });
                  });
                  return;
                }

                res.json({
                  success: true,
                  message: "Form deployed successfully",
                  deploymentId: result.insertId,
                });
              });
            }
          }
        );
      });
    });
  });
});

// Get form templates
app.get("/api/forms/templates", verifyToken, (req, res) => {
  const query = `
    SELECT f.*, u.full_name as creator_name,
           COUNT(DISTINCT q.id) as question_count
    FROM Forms f
    LEFT JOIN Users u ON f.created_by = u.id
    LEFT JOIN Questions q ON f.id = q.form_id
    WHERE f.is_template = TRUE
    GROUP BY f.id
    ORDER BY f.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Templates error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    res.json({ success: true, templates: results });
  });
});

// ============================================================
// FORM ASSIGNMENT ENDPOINTS
// ============================================================

// Create form assignments
app.post("/api/forms/:formId/assign", verifyToken, async (req, res) => {
  const formId = req.params.formId;
  const { userIds, targetAudience = "All Users", filters } = req.body;
  const assignedBy = req.userId;

  console.log(`📋 Creating assignments for form ${formId}`);
  console.log("Target audience:", targetAudience);
  console.log("User IDs:", userIds);

  try {
    const formCheckQuery = "SELECT id, title, status FROM Forms WHERE id = ?";
    db.query(formCheckQuery, [formId], (err, formResults) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }

      if (formResults.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Form not found" });
      }

      if (!userIds || userIds.length === 0) {
        let userQuery = `SELECT DISTINCT u.id FROM Users u WHERE u.status = 'active'`;
        const queryParams = [];

        if (targetAudience && targetAudience !== "All Users") {
          if (targetAudience.startsWith("Students - ")) {
            const targetPart = targetAudience.replace("Students - ", "").trim();

            if (targetPart.startsWith("College ")) {
              const courseName = targetPart.replace("College ", "").trim();
              userQuery = `
                SELECT DISTINCT u.id
                FROM Users u
                JOIN Students s ON u.id = s.user_id
                WHERE u.status = 'active'
                  AND u.role = 'student'
                  AND s.course_yr_section LIKE ?
              `;
              queryParams.push(`${courseName}%`);
            } else if (targetPart.includes("-")) {
              userQuery = `
                SELECT DISTINCT u.id
                FROM Users u
                JOIN Students s ON u.id = s.user_id
                WHERE u.status = 'active'
                  AND u.role = 'student'
                  AND s.course_yr_section = ?
              `;
              queryParams.push(targetPart);
            } else if (targetPart.startsWith("Grade ")) {
              userQuery = `
                SELECT DISTINCT u.id
                FROM Users u
                JOIN Students s ON u.id = s.user_id
                WHERE u.status = 'active'
                  AND u.role = 'student'
                  AND s.course_yr_section LIKE ?
              `;
              queryParams.push(`${targetPart}%`);
            } else {
              userQuery = `
                SELECT DISTINCT u.id
                FROM Users u
                WHERE u.status = 'active'
                  AND u.role = 'student'
              `;
            }
          } else if (targetAudience.startsWith("Instructors - ")) {
            const dept = targetAudience.replace("Instructors - ", "").trim();
            userQuery = `
              SELECT DISTINCT u.id
              FROM Users u
              JOIN Instructors i ON u.id = i.user_id
              WHERE u.status = 'active'
                AND u.role = 'instructor'
                AND i.department = ?
            `;
            queryParams.push(dept);
          } else if (targetAudience === "Students") {
            userQuery += " AND u.role = 'student'";
          } else if (targetAudience === "Instructors") {
            userQuery += " AND u.role = 'instructor'";
          } else if (targetAudience === "Alumni") {
            userQuery += " AND u.role = 'alumni'";
          } else if (targetAudience === "Staff") {
            userQuery += " AND u.role = 'staff'";
          }
        }

        db.query(userQuery, queryParams, (userErr, userResults) => {
          if (userErr) {
            console.error("❌ User query error:", userErr);
            return res
              .status(500)
              .json({ success: false, message: "Failed to fetch users" });
          }

          console.log(`✅ Found ${userResults.length} users for assignment`);

          if (userResults.length === 0) {
            return res.status(200).json({
              success: true,
              message: "No users found matching the criteria",
              assignedCount: 0,
            });
          }

          const userIdsToAssign = userResults.map((u) => u.id);
          createAssignments(formId, userIdsToAssign, assignedBy, res);
        });
      } else {
        createAssignments(formId, userIds, assignedBy, res);
      }
    });
  } catch (error) {
    console.error("Assignment error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Helper function to create assignments
function createAssignments(formId, userIds, assignedBy, res) {
  if (!userIds || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No users to assign",
    });
  }

  const checkQuery = `
    SELECT user_id FROM Form_Assignments 
    WHERE form_id = ? AND user_id IN (?)
  `;

  db.query(checkQuery, [formId, userIds], (checkErr, existingAssignments) => {
    if (checkErr) {
      console.error("Check assignments error:", checkErr);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    const existingUserIds = existingAssignments.map((a) => a.user_id);
    const newUserIds = userIds.filter((id) => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return res.json({
        success: true,
        message: "All users already assigned to this form",
        assignedCount: 0,
        existingCount: existingUserIds.length,
      });
    }

    const assignmentValues = newUserIds.map((userId) => [
      formId,
      userId,
      "pending",
    ]);
    const insertQuery = `
      INSERT INTO Form_Assignments (form_id, user_id, status)
      VALUES ?
    `;

    db.query(insertQuery, [assignmentValues], (insertErr, insertResult) => {
      if (insertErr) {
        console.error("Insert assignments error:", insertErr);
        return res
          .status(500)
          .json({ success: false, message: "Failed to create assignments" });
      }

      console.log(`✅ Created ${insertResult.affectedRows} form assignments`);

      res.json({
        success: true,
        message: `Form assigned to ${insertResult.affectedRows} users`,
        assignedCount: insertResult.affectedRows,
        existingCount: existingUserIds.length,
      });
    });
  });
}

// Get assigned forms for a user
app.get("/api/users/assigned-forms", verifyToken, (req, res) => {
  const userId = req.userId;
  const { status = "all" } = req.query;

  console.log(`📋 Fetching assigned forms for user ${userId}`);

  let query = `
    SELECT
      f.id,
      f.title,
      f.description,
      f.category,
      f.target_audience,
      f.status as form_status,
      f.image_url,
      f.start_date,
      COALESCE(fd.end_date, f.end_date, DATE_ADD(fa.assigned_at, INTERVAL 7 DAY)) as end_date,
      f.created_at,
      fa.assigned_at,
      fa.status as assignment_status,
      u.full_name as creator_name,
      COUNT(DISTINCT q.id) as question_count,
      CASE
        WHEN fr.id IS NOT NULL THEN TRUE
        ELSE FALSE
      END as has_responded
    FROM Form_Assignments fa
    JOIN Forms f ON fa.form_id = f.id
    LEFT JOIN Form_Deployments fd ON f.id = fd.form_id
    LEFT JOIN Users u ON f.created_by = u.id
    LEFT JOIN Form_Responses fr ON f.id = fr.form_id AND fr.user_id = fa.user_id
    LEFT JOIN Questions q ON f.id = q.form_id
    WHERE fa.user_id = ?
  `;

  const params = [userId];

  if (status !== "all") {
    query += " AND fa.status = ?";
    params.push(status);
  }

  query += " AND f.status = 'active'";
  query += " GROUP BY f.id, fa.assigned_at, fa.status, u.full_name, fr.id";
  query += " ORDER BY fa.assigned_at DESC";

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    console.log(`✅ Found ${results.length} assigned forms for user ${userId}`);

    res.json({
      success: true,
      forms: results,
    });
  });
});

// Update assignment status
app.patch("/api/forms/:formId/assignment-status", verifyToken, (req, res) => {
  const formId = req.params.formId;
  const userId = req.userId;
  const { status } = req.body;

  const updateQuery = `
    UPDATE Form_Assignments 
    SET status = ? 
    WHERE form_id = ? AND user_id = ?
  `;

  db.query(updateQuery, [status, formId, userId], (err, result) => {
    if (err) {
      console.error("Update assignment error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Assignment not found" });
    }

    res.json({
      success: true,
      message: "Assignment status updated",
    });
  });
});

// Get assignment statistics for a form
app.get("/api/forms/:formId/assignment-stats", verifyToken, (req, res) => {
  const formId = req.params.formId;

  const statsQuery = `
    SELECT 
      COUNT(*) as total_assigned,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
    FROM Form_Assignments
    WHERE form_id = ?
  `;

  db.query(statsQuery, [formId], (err, results) => {
    if (err) {
      console.error("Stats error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    res.json({
      success: true,
      stats: results[0],
    });
  });
});

// ============================================================
// IMAGE UPLOAD ENDPOINTS
// ============================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

app.post(
  "/api/upload/image",
  verifyToken,
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: imageUrl });
  },
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================================================
// FORM CATEGORY MANAGEMENT ENDPOINTS
// ============================================================

app.get("/api/form-categories", verifyToken, (req, res) => {
  const query =
    "SELECT id, name, description FROM Form_Categories ORDER BY name";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    res.json({ success: true, categories: results });
  });
});

app.post("/api/form-categories", verifyToken, (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Category name is required" });
  }

  const checkQuery = "SELECT id FROM Form_Categories WHERE name = ?";
  db.query(checkQuery, [name.trim()], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Database error:", checkErr);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (checkResults.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Category already exists" });
    }

    const insertQuery =
      "INSERT INTO Form_Categories (name, description) VALUES (?, ?)";
    db.query(
      insertQuery,
      [name.trim(), description || null],
      (insertErr, insertResult) => {
        if (insertErr) {
          console.error("Database error:", insertErr);
          return res
            .status(500)
            .json({ success: false, message: "Failed to add category" });
        }

        res.status(201).json({
          success: true,
          message: "Category added successfully",
          category: {
            id: insertResult.insertId,
            name: name.trim(),
            description: description || null,
          },
        });
      },
    );
  });
});

app.patch("/api/form-categories/:id", verifyToken, (req, res) => {
  const categoryId = req.params.id;
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Category name is required" });
  }

  const checkQuery = "SELECT id FROM Form_Categories WHERE id = ?";
  db.query(checkQuery, [categoryId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Database error:", checkErr);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (checkResults.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    const updateQuery =
      "UPDATE Form_Categories SET name = ?, description = ? WHERE id = ?";
    db.query(
      updateQuery,
      [name.trim(), description || null, categoryId],
      (updateErr, updateResult) => {
        if (updateErr) {
          console.error("Database error:", updateErr);
          return res
            .status(500)
            .json({ success: false, message: "Failed to update category" });
        }

        if (updateResult.affectedRows === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Category not found" });
        }

        res.json({
          success: true,
          message: "Category updated successfully",
          category: {
            id: categoryId,
            name: name.trim(),
            description: description || null,
          },
        });
      },
    );
  });
});

app.delete("/api/form-categories/:id", verifyToken, (req, res) => {
  const categoryId = req.params.id;

  const checkQuery = "SELECT id FROM Form_Categories WHERE id = ?";
  db.query(checkQuery, [categoryId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error("Database error:", checkErr);
      return res
        .status(500)
        .json({ success: false, message: "Database error" });
    }

    if (checkResults.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    const usageQuery =
      "SELECT COUNT(*) as count FROM Forms WHERE category = (SELECT name FROM Form_Categories WHERE id = ?)";
    db.query(usageQuery, [categoryId], (usageErr, usageResults) => {
      if (usageErr) {
        console.error("Database error:", usageErr);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }

      const usageCount = usageResults[0].count;
      if (usageCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category as it's used by ${usageCount} form(s)`,
        });
      }

      const deleteQuery = "DELETE FROM Form_Categories WHERE id = ?";
      db.query(deleteQuery, [categoryId], (deleteErr, deleteResult) => {
        if (deleteErr) {
          console.error("Database error:", deleteErr);
          return res
            .status(500)
            .json({ success: false, message: "Failed to delete category" });
        }

        if (deleteResult.affectedRows === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Category not found" });
        }

        res.json({
          success: true,
          message: "Category deleted successfully",
        });
      });
    });
  });
});

// ============================================================
// FORM RESPONSE SUBMISSION ENDPOINTS
// ============================================================

app.post(
  "/api/forms/:formId/submit",
  verifyToken,
  formSubmissionLimiter,
  (req, res) => {
    const formId = req.params.formId;
    const userId = req.userId;
    const { responses } = req.body;

    console.log(`📤 Submitting form ${formId} for user ${userId}`);

    if (!responses || typeof responses !== "object") {
      return res.status(400).json({
        success: false,
        message: "Responses data is required",
      });
    }

    const checkFormQuery = "SELECT id, title, status FROM Forms WHERE id = ?";
    db.query(checkFormQuery, [formId], (err, formResults) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (formResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Form not found",
        });
      }

      const form = formResults[0];

      if (form.status !== "active") {
        return res.status(400).json({
          success: false,
          message: "This form is not currently accepting responses",
        });
      }

      const checkSubmissionQuery =
        "SELECT id FROM Form_Responses WHERE form_id = ? AND user_id = ?";
      db.query(
        checkSubmissionQuery,
        [formId, userId],
        (checkErr, checkResults) => {
          if (checkErr) {
            console.error("Database error:", checkErr);
            return res.status(500).json({
              success: false,
              message: "Database error",
            });
          }

          if (checkResults.length > 0) {
            return res.status(400).json({
              success: false,
              message: "You have already submitted this form",
            });
          }

          const validateResponsesQuery = `
        SELECT q.id, q.question_text, q.question_type, q.required, qo.option_text
        FROM Questions q
        LEFT JOIN Question_Options qo ON q.id = qo.question_id
        WHERE q.form_id = ?
        ORDER BY q.order_index, qo.order_index
      `;

          db.query(
            validateResponsesQuery,
            [formId],
            (validateErr, questionResults) => {
              if (validateErr) {
                console.error("Validation error:", validateErr);
                return res.status(500).json({
                  success: false,
                  message: "Failed to validate form responses",
                });
              }

              const questions = new Map();
              questionResults.forEach((row) => {
                if (!questions.has(row.id)) {
                  questions.set(row.id, {
                    id: row.id,
                    question_text: row.question_text,
                    question_type: row.question_type,
                    required: row.required,
                    options: [],
                  });
                }
                if (row.option_text) {
                  questions.get(row.id).options.push(row.option_text);
                }
              });

              const validationErrors = [];
              questions.forEach((question) => {
                const response = responses[question.id];

                if (
                  question.required &&
                  (response === undefined ||
                    response === null ||
                    response === "")
                ) {
                  validationErrors.push(
                    `Question "${question.question_text}" is required`,
                  );
                }

                if (
                  ["multiple-choice", "checkbox", "dropdown"].includes(
                    question.question_type,
                  )
                ) {
                  if (response !== undefined && question.options.length > 0) {
                    const responseArray = Array.isArray(response)
                      ? response
                      : [response];
                    const invalidOptions = responseArray.filter(
                      (opt) => !question.options.includes(opt),
                    );
                    if (invalidOptions.length > 0) {
                      validationErrors.push(
                        `Invalid option(s) for question "${question.question_text}": ${invalidOptions.join(", ")}`,
                      );
                    }
                  }
                }
              });

              if (validationErrors.length > 0) {
                return res.status(400).json({
                  success: false,
                  message: "Validation failed",
                  errors: validationErrors,
                });
              }

              const insertResponseQuery = `
          INSERT INTO Form_Responses (form_id, user_id, response_data)
          VALUES (?, ?, ?)
        `;

              db.query(
                insertResponseQuery,
                [formId, userId, JSON.stringify(responses)],
                (insertErr, insertResult) => {
                  if (insertErr) {
                    console.error("Database error:", insertErr);
                    return res.status(500).json({
                      success: false,
                      message: "Failed to submit form response",
                    });
                  }

                  console.log(
                    `✅ Form ${formId} submitted successfully with response ID: ${insertResult.insertId}`,
                  );

                  const updateAssignmentQuery = `
            UPDATE Form_Assignments
            SET status = 'completed'
            WHERE form_id = ? AND user_id = ?
          `;

                  db.query(
                    updateAssignmentQuery,
                    [formId, userId],
                    (updateErr, updateResult) => {
                      if (updateErr) {
                        console.error(
                          "Assignment status update error:",
                          updateErr,
                        );
                      } else {
                        console.log(
                          `✅ Assignment status updated to completed for user ${userId}, form ${formId}`,
                        );
                      }

                      res.json({
                        success: true,
                        message: "Form submitted successfully",
                        responseId: insertResult.insertId,
                      });
                    },
                  );
                },
              );
            },
          );
        },
      );
    });
  },
);

app.get("/api/forms/my-responses", verifyToken, (req, res) => {
  const userId = req.userId;
  const { page = 1, limit = 10, formId } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT 
      fr.id,
      fr.form_id,
      fr.submitted_at,
      f.title as form_title,
      f.category,
      f.description as form_description
    FROM Form_Responses fr
    JOIN Forms f ON fr.form_id = f.id
    WHERE fr.user_id = ?
  `;

  const params = [userId];

  if (formId) {
    query += " AND fr.form_id = ?";
    params.push(formId);
  }

  query += " ORDER BY fr.submitted_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), offset);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    let countQuery =
      "SELECT COUNT(*) as total FROM Form_Responses WHERE user_id = ?";
    const countParams = [userId];

    if (formId) {
      countQuery += " AND form_id = ?";
      countParams.push(formId);
    }

    db.query(countQuery, countParams, (countErr, countResults) => {
      if (countErr) {
        console.error("Count error:", countErr);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      const total = countResults[0].total;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        responses: results,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
        },
      });
    });
  });
});

app.get("/api/forms/:formId/responses", verifyToken, (req, res) => {
  const formId = req.params.formId;
  const userId = req.userId;
  const { page = 1, limit = 10, search = "" } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const checkPermissionQuery = `
    SELECT f.id, f.title, f.created_by, u.full_name as creator_name
    FROM Forms f
    LEFT JOIN Users u ON f.created_by = u.id
    WHERE f.id = ? AND (f.created_by = ? OR ? IN (
      SELECT id FROM Users WHERE role = 'admin'
    ))
  `;

  db.query(
    checkPermissionQuery,
    [formId, userId, userId],
    (err, permissionResults) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (permissionResults.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to view these responses",
        });
      }

      let query = `
      SELECT 
        fr.id,
        fr.user_id,
        fr.submitted_at,
        fr.response_data,
        u.full_name as respondent_name,
        u.email as respondent_email,
        u.role as respondent_role
      FROM Form_Responses fr
      LEFT JOIN Users u ON fr.user_id = u.id
      WHERE fr.form_id = ?
    `;

      const params = [formId];

      if (search) {
        query += " AND (u.full_name LIKE ? OR u.email LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }

      query += " ORDER BY fr.submitted_at DESC LIMIT ? OFFSET ?";
      params.push(parseInt(limit), offset);

      db.query(query, params, (responseErr, responseResults) => {
        if (responseErr) {
          console.error("Database error:", responseErr);
          return res.status(500).json({
            success: false,
            message: "Database error",
          });
        }

        let countQuery =
          "SELECT COUNT(*) as total FROM Form_Responses WHERE form_id = ?";
        const countParams = [formId];

        if (search) {
          countQuery +=
            " AND user_id IN (SELECT id FROM Users WHERE full_name LIKE ? OR email LIKE ?)";
          countParams.push(`%${search}%`, `%${search}%`);
        }

        db.query(countQuery, countParams, (countErr, countResults) => {
          if (countErr) {
            console.error("Count error:", countErr);
            return res.status(500).json({
              success: false,
              message: "Database error",
            });
          }

          const total = countResults[0].total;
          const totalPages = Math.ceil(total / parseInt(limit));

          res.json({
            success: true,
            responses: responseResults.map((response) => ({
              ...response,
              response_data: JSON.parse(response.response_data),
            })),
            form: permissionResults[0],
            pagination: {
              total,
              page: parseInt(page),
              limit: parseInt(limit),
              totalPages,
            },
          });
        });
      });
    },
  );
});

app.get("/api/forms/:formId/summary", verifyToken, (req, res) => {
  const formId = req.params.formId;
  const userId = req.userId;

  const checkPermissionQuery =
    "SELECT id, title, created_by FROM Forms WHERE id = ? AND (created_by = ? OR ? IN (SELECT id FROM Users WHERE role = 'admin'))";

  db.query(
    checkPermissionQuery,
    [formId, userId, userId],
    (err, permissionResults) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (permissionResults.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to view this form summary",
        });
      }

      const statsQuery = `
      SELECT 
        COUNT(DISTINCT fr.id) as total_responses,
        COUNT(DISTINCT fa.id) as total_assignments,
        ROUND(
          (COUNT(DISTINCT fr.id) * 100.0 / NULLIF(COUNT(DISTINCT fa.id), 0)), 
          2
        ) as completion_rate,
        MIN(fr.submitted_at) as first_response,
        MAX(fr.submitted_at) as last_response
      FROM Forms f
      LEFT JOIN Form_Assignments fa ON f.id = fa.form_id
      LEFT JOIN Form_Responses fr ON f.id = fr.form_id
      WHERE f.id = ?
      GROUP BY f.id
    `;

      db.query(statsQuery, [formId], (statsErr, statsResults) => {
        if (statsErr) {
          console.error("Stats error:", statsErr);
          return res.status(500).json({
            success: false,
            message: "Database error",
          });
        }

        const stats = statsResults[0] || {
          total_responses: 0,
          total_assignments: 0,
          completion_rate: 0,
          first_response: null,
          last_response: null,
        };

        const roleQuery = `
        SELECT 
          u.role,
          COUNT(fr.id) as response_count
        FROM Form_Responses fr
        JOIN Users u ON fr.user_id = u.id
        WHERE fr.form_id = ?
        GROUP BY u.role
      `;

        db.query(roleQuery, [formId], (roleErr, roleResults) => {
          if (roleErr) {
            console.error("Role breakdown error:", roleErr);
            return res.status(500).json({
              success: false,
              message: "Database error",
            });
          }

          res.json({
            success: true,
            form: permissionResults[0],
            summary: {
              ...stats,
              role_breakdown: roleResults,
            },
          });
        });
      });
    },
  );
});

app.get("/api/forms/assigned-forms", verifyToken, (req, res) => {
  const userId = req.userId;
  const { status = "all", category } = req.query;

  const getUserRoleQuery = "SELECT role FROM Users WHERE id = ?";

  db.query(getUserRoleQuery, [userId], (err, userResults) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    if (userResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userRole = userResults[0].role;

    let query = `
      SELECT DISTINCT
        f.id,
        f.title,
        f.description,
        f.category,
        f.target_audience,
        f.status,
        f.image_url,
        f.start_date,
        f.end_date,
        f.created_at,
        fa.assigned_at,
        fa.status as assignment_status,
        u.full_name as creator_name
      FROM Forms f
      JOIN Form_Assignments fa ON f.id = fa.form_id
      LEFT JOIN Users u ON f.created_by = u.id
      WHERE fa.user_id = ?
    `;

    const params = [userId];

    if (status !== "all") {
      query += " AND f.status = ?";
      params.push(status);
    }

    if (category) {
      query += " AND f.category = ?";
      params.push(category);
    }

    query += " AND (f.status = 'active' OR fa.user_id = ?)";
    params.push(userId);

    query += " ORDER BY fa.assigned_at DESC";

    db.query(query, params, (formsErr, formsResults) => {
      if (formsErr) {
        console.error("Database error:", formsErr);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      res.json({
        success: true,
        forms: formsResults,
      });
    });
  });
});

// ============================================================

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Express error:", error);

  const errorId = Math.random().toString(36).substr(2, 9);
  console.error(`Error ID: ${errorId}`, {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  if (process.env.NODE_ENV === "production") {
    res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again later.",
      errorId: errorId,
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
      errorId: errorId,
    });
  }
});

// ============================================================
// SHARED RESPONSES ENDPOINTS
// ============================================================

// Share form responses with instructors
app.post("/api/forms/:formId/share-responses", verifyToken, (req, res) => {
  const formId = req.params.formId;
  const userId = req.userId;
  const { instructorIds } = req.body;

  // Verify user is admin or form creator
  const checkPermissionQuery = `
    SELECT f.id, f.created_by
    FROM Forms f
    WHERE f.id = ? AND (f.created_by = ? OR ? IN (
      SELECT id FROM Users WHERE role = 'admin'
    ))
  `;

  db.query(
    checkPermissionQuery,
    [formId, userId, userId],
    (err, permissionResults) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (permissionResults.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to share this form",
        });
      }

      // Delete existing shares for this form
      const deleteExistingQuery = `
        DELETE FROM Shared_Responses WHERE form_id = ?
      `;

      db.query(deleteExistingQuery, [formId], (deleteErr) => {
        if (deleteErr) {
          console.error("Database error:", deleteErr);
          return res.status(500).json({
            success: false,
            message: "Database error",
          });
        }

        // Insert new shares
        if (!instructorIds || instructorIds.length === 0) {
          return res.json({
            success: true,
            message: "Form responses shared successfully",
            sharedWith: 0,
          });
        }

        const insertSharesQuery = `
          INSERT INTO Shared_Responses (form_id, shared_with_instructor_id, shared_by)
          VALUES ?
        `;

        const values = instructorIds.map((id) => `(${formId}, ${id}, ${userId})`).join(', ');

        db.query(insertSharesQuery.replace('?', values), (insertErr) => {
          if (insertErr) {
            console.error("Database error:", insertErr);
            return res.status(500).json({
              success: false,
              message: "Database error",
            });
          }

          res.json({
            success: true,
            message: `Form responses shared with ${instructorIds.length} instructor(s)`,
            sharedWith: instructorIds.length,
          });
        });
      });
    }
  );
});

// Get shared responses for instructor
app.get("/api/instructor/shared-responses", verifyToken, (req, res) => {
  const userId = req.userId;

  // Verify user is instructor
  const checkRoleQuery = `
    SELECT role FROM Users WHERE id = ?
  `;

  db.query(checkRoleQuery, [userId], (err, roleResults) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    if (roleResults.length === 0 || roleResults[0].role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only instructors can view shared responses.",
      });
    }

    // Get shared forms with their responses
    const query = `
      SELECT 
        sr.id,
        sr.form_id,
        f.title as form_title,
        f.category,
        f.target_audience,
        sr.shared_by,
        u.full_name as shared_by_name,
        sr.shared_at,
        COUNT(DISTINCT fr.id) as total_responses
      FROM Shared_Responses sr
      JOIN Forms f ON sr.form_id = f.id
      JOIN Users u ON sr.shared_by = u.id
      LEFT JOIN Form_Responses fr ON f.id = fr.form_id
      WHERE sr.shared_with_instructor_id = ?
      GROUP BY sr.id, sr.form_id, f.title, f.category, f.target_audience, sr.shared_by, u.full_name, sr.shared_at
      ORDER BY sr.shared_at DESC
    `;

    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      // For each shared form, get the responses (anonymized)
      const responsesWithDetails = results.map((sharedForm) => {
        return {
          id: sharedForm.id.toString(),
          formId: sharedForm.form_id.toString(),
          formTitle: sharedForm.form_title,
          courseCode: sharedForm.category || '',
          section: sharedForm.target_audience || '',
          sharedBy: sharedForm.shared_by_name || 'Administrator',
          sharedDate: new Date(sharedForm.shared_at).toLocaleDateString(),
          totalResponses: sharedForm.total_responses || 0,
          responses: [], // Will be loaded separately when viewing
        };
      });

      res.json({
        success: true,
        responses: responsesWithDetails,
      });
    });
  });
});

// Get responses for a specific shared form (anonymized)
app.get("/api/instructor/shared-responses/:sharedId/responses", verifyToken, (req, res) => {
  const userId = req.userId;
  const sharedId = req.params.sharedId;

  // Verify user is instructor and has access to this shared form
  const checkAccessQuery = `
    SELECT sr.form_id, f.title as form_title
    FROM Shared_Responses sr
    JOIN Forms f ON sr.form_id = f.id
    WHERE sr.id = ? AND sr.shared_with_instructor_id = ?
  `;

  db.query(checkAccessQuery, [sharedId, userId], (err, accessResults) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    if (accessResults.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to these responses",
      });
    }

    const formId = accessResults[0].form_id;

    // Get questions for this form
    const questionsQuery = `
      SELECT id, question_text, question_type
      FROM Questions
      WHERE form_id = ?
      ORDER BY order_index
    `;

    db.query(questionsQuery, [formId], (questionsErr, questionsResults) => {
      if (questionsErr) {
        console.error("Database error:", questionsErr);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      // Get responses (anonymized - no user info)
      const responsesQuery = `
        SELECT 
          fr.id,
          fr.submitted_at,
          fr.response_data
        FROM Form_Responses fr
        WHERE fr.form_id = ?
        ORDER BY fr.submitted_at DESC
      `;

      db.query(responsesQuery, [formId], (responsesErr, responsesResults) => {
        if (responsesErr) {
          console.error("Database error:", responsesErr);
          return res.status(500).json({
            success: false,
            message: "Database error",
          });
        }

        // Map responses with questions (anonymized)
        const mappedResponses = responsesResults.map((response) => {
          const responseData = JSON.parse(response.response_data);
          const answers = questionsResults.map((question) => {
            const answer = responseData[question.id.toString()];
            let answerText = '';
            let rating = undefined;
            
            if (Array.isArray(answer)) {
              // Checkbox question - join selected values
              answerText = answer.join(', ');
            } else if (typeof answer === 'object' && answer !== null) {
              // Object with value/text or rating
              answerText = answer.value || answer.text || '';
              rating = answer.rating !== undefined ? parseInt(answer.rating) : undefined;
            } else if (answer !== undefined && answer !== null) {
              // Simple value
              answerText = answer.toString();
            }
            
            return {
              question: question.question_text,
              answer: answerText,
              rating: rating,
            };
          });

          return {
            id: response.id.toString(),
            answers: answers,
            submittedDate: new Date(response.submitted_at).toLocaleDateString(),
          };
        });

        res.json({
          success: true,
          responses: mappedResponses,
        });
      });
    });
  });
});

app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors || [err.message],
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (err.name === "ForbiddenError") {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  next(err);
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(port, () => {
  console.log(` Starting server...`);
  console.log(` Secure server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Server startup complete`);
});

module.exports = app;