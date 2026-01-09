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
const db = require("./db");

const app = express();
const port = process.env.PORT || 5000;

// CRITICAL: Handle CORS preflight FIRST - before any other middleware
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, X-Auth-Token');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    return res.sendStatus(200);
  }
  next();
});
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  console.warn('Using default JWT secret - set JWT_SECRET environment variable for production');
  return "your-super-secret-jwt-key-change-in-production";
})();
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
        connectSrc: ["'self'", "https://localhost:5000", "https://yourdomain.com"],
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
    crossOriginEmbedderPolicy: false, // Allow embedding for development
  })
);

// Force development mode for local testing
const isDevelopment = process.env.NODE_ENV !== 'production';

// HTTPS enforcement middleware (for production)
app.use((req, res, next) => {
  // Skip HTTPS redirect in development
  if (isDevelopment) {
    return next();
  }
  
  // Check if request is already HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }
  
  // Redirect to HTTPS
  const host = req.get('Host');
  const httpsUrl = `https://${host}${req.originalUrl}`;
  return res.redirect(301, httpsUrl);
});

// Add security headers
app.use((req, res, next) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
});

// Enhanced CORS configuration - simplified for development
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // Also allow any localhost origin for development
    if (!origin || origin.match(/^http:\/\/localhost(:\d+)?$/) || origin.match(/^http:\/\/127\.0\.0\.1(:\d+)?$/)) {
      callback(null, true);
    } else {
      // In production, only allow specified domains
      const allowedOrigins = process.env.CORS_ORIGIN ?
        process.env.CORS_ORIGIN.split(',') :
        [];
      
      if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-Auth-Token'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiting for form submissions
const formSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 form submissions per hour
  message: {
    success: false,
    message: "Too many form submissions, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for general API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
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
  console.log('Server verifyToken: authHeader:', authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const token = authHeader.substring(7);
  console.log('Server verifyToken: extracted token:', token ? `${token.substring(0, 20)}...` : 'null');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Server verifyToken: decoded token:', decoded);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.log('Server verifyToken: error:', error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Name formatting function to enforce proper capitalization
const formatName = (name) => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return input.trim().replace(/[<>]/g, "");
};

// Password strength validation
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

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper functions for role-specific data insertion
const insertStudentData = (userId, data) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO students (user_id, studentID, course_yr_section, contact_number, subjects)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(query, [
      userId,
      data.studentId,
      data.courseYrSection,
      data.contactNumber,
      data.subjects,
    ], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const insertInstructorData = (userId, data) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO instructors (user_id, instructor_id, department, subject_taught)
      VALUES (?, ?, ?, ?)
    `;
    db.query(query, [
      userId,
      data.instructorId,
      data.department,
      data.subjectTaught,
    ], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const insertAlumniData = (userId, data) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO alumni (user_id, grad_year, degree, jobtitle, contact, company)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [
      userId,
      data.gradYear,
      data.degree,
      data.jobTitle,
      data.contact,
      data.company,
    ], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

const insertEmployerData = (userId, data) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO employers (user_id, companyname, industry, location, contact)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(query, [
      userId,
      data.companyName,
      data.industry,
      data.location,
      data.contactNumber,
    ], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!" });
});

// Database status route
app.get("/api/db-status", (req, res) => {
  db.query("SELECT COUNT(*) as userCount FROM users", (err, results) => {
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

// Signup route with validation
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
    // Role-specific validations
    body("student_id").if(body("role").equals("student")).notEmpty().withMessage("Student ID is required"),
    body("course_year_section").if(body("role").equals("student")).notEmpty().withMessage("Course Year Section is required"),
    body("instructor_id").if(body("role").equals("instructor")).notEmpty().withMessage("Instructor ID is required"),
    body("department").if(body("role").equals("instructor")).notEmpty().withMessage("Department is required"),
    body("company_name").if(body("role").equals("employer")).notEmpty().withMessage("Company name is required"),
    body("industry").if(body("role").equals("employer")).notEmpty().withMessage("Industry is required"),
    body("degree").if(body("role").equals("alumni")).notEmpty().withMessage("Degree is required"),
    body("alumni_company_name").if(body("role").equals("alumni")).notEmpty().withMessage("Company name is required"),
    body("instructorId").optional().trim().isLength({ max: 50 }),
    body("department").optional().trim().isLength({ max: 100 }),
    body("specialization").optional().trim().isLength({ max: 255 }),
    body("gradYear").optional().isInt({ min: 1900, max: new Date().getFullYear() + 10 }),
    body("degree").optional().trim().isLength({ max: 255 }),
    body("jobTitle").optional().trim().isLength({ max: 255 }),
    body("company").optional().trim().isLength({ max: 255 }),
    body("industry").optional().trim().isLength({ max: 100 }),
    body("location").optional().trim().isLength({ max: 255 }),
    body("alumniGraduationDate").optional().isISO8601(),
    body("companyName").optional().trim().isLength({ max: 255 }),
    body("employerIndustry").optional().trim().isLength({ max: 100 }),
    body("position").optional().trim().isLength({ max: 255 }),
    body("employerContactNumber").optional().trim().isLength({ max: 20 }),
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

      // Additional password strength validation
      const passwordError = validatePassword(password);
      if (passwordError) {
        return res.status(400).json({
          success: false,
          message: passwordError,
        });
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedFullName = sanitizeInput(fullName);
      
      // Format name to enforce proper capitalization
      const formattedFullName = formatName(sanitizedFullName);

      // Role-specific data will be collected later in profile update

      // Check if user already exists
      const checkUserQuery = "SELECT * FROM users WHERE email = ?";
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

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user into users table
        const insertUserQuery = `
          INSERT INTO users (email, password_hash, full_name, role, status, registration_date)
          VALUES (?, ?, ?, ?, 'pending', NOW())
        `;

        db.query(
          insertUserQuery,
          [
            sanitizedEmail,
            hashedPassword,
            formattedFullName,
            role,
          ],
          async (err, result) => {
            if (err) {
              console.error("Database error:", err);
              return res.status(500).json({
                success: false,
                message: "Failed to create user",
              });
            }

            const userId = result.insertId;

            // Insert role-specific data
            try {
              switch (role) {
                case 'student':
                  await insertStudentData(userId, {
                    studentId: student_id,
                    courseYrSection: course_year_section,
                    contactNumber: null,
                  });
                  break;
                case 'instructor':
                  await insertInstructorData(userId, {
                    instructorId: instructor_id,
                    department: department,
                    specialization: null,
                  });
                  break;
                case 'employer':
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
                case 'alumni':
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
              // Continue with signup even if role data fails, but log it
            }

            // Generate JWT token
            const token = generateToken(userId);

            res.status(201).json({
              success: true,
              message: "User created successfully. Please wait for admin approval.",
              token: token,
              user: {
                id: userId,
                email: sanitizedEmail,
                fullName: formattedFullName,
                role: role,
                status: 'active', // New users are active after signup
              },
            });
          }
        );
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Login route with validation
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

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);

      // Find user by email with role-specific data
      const findUserQuery = `
        SELECT
            u.id, u.email, u.password_hash, u.full_name, u.role, u.status,
            s.studentID, s.course_yr_section, s.contact_number, s.subjects,
            i.instructor_id, i.department, i.subject_taught,
            a.grad_year, a.degree, a.jobtitle, a.contact, a.company,
            e.companyname, e.industry, e.location, e.contact
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN instructors i ON u.id = i.user_id
        LEFT JOIN alumni a ON u.id = a.user_id
        LEFT JOIN employers e ON u.id = e.user_id
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

        // Check if user is active
        if (user.status !== 'active') {
          return res.status(401).json({
            success: false,
            message: "Unauthorized Access",
          });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password",
          });
        }

        // Generate JWT token
        const token = generateToken(user.id);

        // Build user response with role-specific data
        const userResponse = {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        };

        // Add role-specific fields
        switch (user.role) {
          case 'student':
            userResponse.studentId = user.studentID;
            userResponse.courseYrSection = user.course_yr_section;
            userResponse.contactNumber = user.contact_number;
            userResponse.subjects = user.subjects;
            break;
          case 'instructor':
            userResponse.instructorId = user.instructor_id;
            userResponse.department = user.department;
            userResponse.subjectTaught = user.subject_taught;
            break;
          case 'alumni':
            userResponse.gradYear = user.grad_year;
            userResponse.degree = user.degree;
            userResponse.jobTitle = user.jobtitle;
            userResponse.contact = user.contact;
            userResponse.company = user.company;
            break;
          case 'employer':
            userResponse.companyName = user.companyname;
            userResponse.industry = user.industry;
            userResponse.location = user.location;
            userResponse.contact = user.contact;
            break;
        }

        // Return user information and token
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
  }
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
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN instructors i ON u.id = i.user_id
    LEFT JOIN alumni a ON u.id = a.user_id
    LEFT JOIN employers e ON u.id = e.user_id
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

    // Build user response with role-specific data
    const userResponse = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      status: user.status,
    };

    // Add role-specific fields
    switch (user.role) {
      case 'student':
        userResponse.studentId = user.studentID;
        userResponse.courseYrSection = user.course_yr_section;
        userResponse.contactNumber = user.contact_number;
        userResponse.subjects = user.subjects;
        break;
      case 'instructor':
        userResponse.instructorId = user.instructor_id;
        userResponse.department = user.department;
        userResponse.subjectTaught = user.subject_taught;
        break;
      case 'alumni':
        userResponse.gradYear = user.grad_year;
        userResponse.degree = user.degree;
        userResponse.jobTitle = user.jobtitle;
        userResponse.contact = user.contact;
        userResponse.company = user.company;
        break;
      case 'employer':
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

// Logout route (for token blacklisting in production)
app.post("/api/auth/logout", verifyToken, (req, res) => {
  // In production, you would add the token to a blacklist
  // For now, we'll just return success
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// Token refresh route
app.post("/api/auth/refresh", verifyToken, (req, res) => {
  const userId = req.userId;
  
  // Generate new token
  const newToken = generateToken(userId);
  
  // Get user data
  const findUserQuery = `
    SELECT
      u.id, u.email, u.full_name, u.role, u.status,
      s.studentID, s.course_yr_section, s.contact_number, s.subjects,
      i.instructor_id, i.department, i.subject_taught,
      a.grad_year, a.degree, a.jobtitle, a.contact, a.company,
      e.companyname, e.industry, e.location, e.contact
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN instructors i ON u.id = i.user_id
    LEFT JOIN alumni a ON u.id = a.user_id
    LEFT JOIN employers e ON u.id = e.user_id
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
    
    // Build user response with role-specific data
    const userResponse = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      status: user.status,
    };
    
    // Add role-specific fields
    switch (user.role) {
      case 'student':
        userResponse.studentId = user.studentID;
        userResponse.courseYrSection = user.course_yr_section;
        userResponse.contactNumber = user.contact_number;
        userResponse.subjects = user.subjects;
        break;
      case 'instructor':
        userResponse.instructorId = user.instructor_id;
        userResponse.department = user.department;
        userResponse.subjectTaught = user.subject_taught;
        break;
      case 'alumni':
        userResponse.gradYear = user.grad_year;
        userResponse.degree = user.degree;
        userResponse.jobTitle = user.jobtitle;
        userResponse.contact = user.contact;
        userResponse.company = user.company;
        break;
      case 'employer':
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

// Get users filtered by role and specific criteria for form targeting
app.get("/api/users/filter", verifyToken, (req, res) => {
  try {
    const { role, course, year, section, grade } = req.query;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role parameter is required"
      });
    }

    let query = `
      SELECT
        u.id, u.email, u.full_name, u.role, u.status,
        s.studentID, s.course_yr_section,
        i.instructor_id, i.department,
        a.degree, a.company,
        e.companyname, e.industry
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN instructors i ON u.id = i.user_id
      LEFT JOIN alumni a ON u.id = a.user_id
      LEFT JOIN employers e ON u.id = e.user_id
      WHERE u.role = ? AND u.status = 'active'
    `;

    const params = [role];

    // Add role-specific filters
    if (role === 'student') {
      if (course && year && section) {
        // College students: course_yr_section like "BSIT 4-B"
        query += " AND s.course_yr_section = ?";
        params.push(`${course} ${year}-${section}`);
      } else if (grade && section) {
        // High school students: course_yr_section like "Grade 11-A"
        query += " AND s.course_yr_section = ?";
        params.push(`${grade}-${section}`);
      }
    } else if (role === 'instructor') {
      if (course) {
        query += " AND i.department = ?";
        params.push(course); // Using course param for department
      }
    }
    // Add more role-specific filters as needed

    query += " ORDER BY u.full_name";

    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      // Format users data
      const users = results.map(user => ({
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status,
        // Role-specific data
        ...(user.studentID && { studentId: user.studentID, courseYrSection: user.course_yr_section }),
        ...(user.instructor_id && { instructorId: user.instructor_id, department: user.department }),
        ...(user.degree && { degree: user.degree, alumniCompany: user.company }),
        ...(user.companyname && { companyName: user.companyname, industry: user.industry }),
      }));

      res.json({
        success: true,
        users,
        count: users.length
      });
    });
  } catch (error) {
    console.error("Get filtered users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get users with filtering and pagination
app.get("/api/users", verifyToken, (req, res) => {
  try {
    const { search = '', role = 'all', status = 'all', page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT
        u.id, u.email, u.full_name, u.role, u.status, u.registration_date as created_at,
        s.studentID, s.course_yr_section,
        i.instructor_id, i.department,
        a.degree, a.company,
        e.companyname, e.industry
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN instructors i ON u.id = i.user_id
      LEFT JOIN alumni a ON u.id = a.user_id
      LEFT JOIN employers e ON u.id = e.user_id
      WHERE 1=1
    `;

    const params = [];

    if (search) {
      query += ` AND (u.full_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role !== 'all') {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (status !== 'all') {
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

      // Get total count for pagination
      let countQuery = `SELECT COUNT(*) as total FROM users u WHERE 1=1`;
      const countParams = [];

      if (search) {
        countQuery += ` AND (u.full_name LIKE ? OR u.email LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`);
      }

      if (role !== 'all') {
        countQuery += ` AND u.role = ?`;
        countParams.push(role);
      }

      if (status !== 'all') {
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

        // Format users data
        const users = results.map(user => ({
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role,
          department: user.department || 'N/A', // Default department
          status: user.status,
          createdAt: user.created_at,
          // Role-specific data
          ...(user.studentID && { studentId: user.studentID, courseYrSection: user.course_yr_section }),
          ...(user.instructor_id && { instructorId: user.instructor_id }),
          ...(user.degree && { degree: user.degree, alumniCompany: user.company }),
          ...(user.companyname && { companyName: user.companyname, industry: user.industry }),
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

    // Get current user role
    const userQuery = "SELECT role FROM users WHERE id = ?";
    db.query(userQuery, [userId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const userRole = results[0].role;

      // Update role-specific data
      switch (userRole) {
        case 'student':
          if (updateData.studentId || updateData.courseYrSection || updateData.contactNumber || updateData.subjects) {
            const studentData = {
              studentId: updateData.studentId,
              courseYrSection: updateData.courseYrSection,
              contactNumber: updateData.contactNumber,
              subjects: updateData.subjects,
            };

            // Insert or update student data
            const studentQuery = `
              INSERT INTO students (user_id, studentID, course_yr_section, contact_number, subjects)
              VALUES (?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE
                studentID = VALUES(studentID),
                course_yr_section = VALUES(course_yr_section),
                contact_number = VALUES(contact_number),
                subjects = VALUES(subjects)
            `;

            db.query(studentQuery, [
              userId,
              studentData.studentId,
              studentData.courseYrSection,
              studentData.contactNumber,
              studentData.subjects,
            ], (err) => {
              if (err) {
                console.error("Student update error:", err);
                return res.status(500).json({ success: false, message: "Failed to update student data" });
              }

              res.json({ success: true, message: "Profile updated successfully" });
            });
          } else {
            res.json({ success: true, message: "Profile updated successfully" });
          }
          break;

        case 'instructor':
          if (updateData.instructorId || updateData.department || updateData.subjectTaught) {
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

            db.query(instructorQuery, [
              userId,
              instructorData.instructorId,
              instructorData.department,
              instructorData.subjectTaught,
            ], (err) => {
              if (err) {
                console.error("Instructor update error:", err);
                return res.status(500).json({ success: false, message: "Failed to update instructor data" });
              }

              res.json({ success: true, message: "Profile updated successfully" });
            });
          } else {
            res.json({ success: true, message: "Profile updated successfully" });
          }
          break;

        case 'alumni':
          if (updateData.gradYear || updateData.degree || updateData.jobTitle ||
              updateData.company || updateData.contact) {
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

            db.query(alumniQuery, [
              userId,
              alumniData.gradYear,
              alumniData.degree,
              alumniData.jobTitle,
              alumniData.contact,
              alumniData.company,
            ], (err) => {
              if (err) {
                console.error("Alumni update error:", err);
                return res.status(500).json({ success: false, message: "Failed to update alumni data" });
              }

              res.json({ success: true, message: "Profile updated successfully" });
            });
          } else {
            res.json({ success: true, message: "Profile updated successfully" });
          }
          break;

        case 'employer':
          if (updateData.companyName || updateData.industry || updateData.location || updateData.contactNumber) {
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

            db.query(employerQuery, [
              userId,
              employerData.companyName,
              employerData.industry,
              employerData.location,
              employerData.contactNumber,
            ], (err) => {
              if (err) {
                console.error("Employer update error:", err);
                return res.status(500).json({ success: false, message: "Failed to update employer data" });
              }

              res.json({ success: true, message: "Profile updated successfully" });
            });
          } else {
            res.json({ success: true, message: "Profile updated successfully" });
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
      year,
      employeeId,
      companyName,
      graduationYear,
      phoneNumber,
      address,
    } = req.body;

    // Check if user already exists
    const checkUserQuery = "SELECT * FROM users WHERE email = ?";
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

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user
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

          // Insert role-specific data
          try {
            switch (role) {
              case 'student':
                if (studentId || year) {
                  await insertStudentData(userId, {
                    studentId: studentId || null,
                    courseYrSection: year || null,
                    contactNumber: phoneNumber || null,
                  });
                }
                break;
              case 'instructor':
              case 'staff':
                if (employeeId || department) {
                  await insertInstructorData(userId, {
                    instructorId: employeeId || null,
                    department: department || null,
                    specialization: null,
                  });
                }
                break;
              case 'employer':
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
              case 'alumni':
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
              message: "User created successfully. Account is pending approval.",
              user: {
                id: userId,
                email,
                fullName,
                role,
                status: 'pending',
              },
            });
          } catch (roleError) {
            console.error("Role-specific data insertion error:", roleError);
            res.status(201).json({
              success: true,
              message: "User created successfully. Account is pending approval.",
              user: {
                id: userId,
                email,
                fullName,
                role,
                status: 'pending',
              },
            });
          }
        }
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

      // Get updated user data
      const userQuery = `
        SELECT
          u.id, u.email, u.full_name, u.role, u.status,
          s.studentID, s.course_yr_section,
          i.instructor_id, i.department,
          a.degree, a.company,
          e.companyname, e.industry
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN instructors i ON u.id = i.user_id
        LEFT JOIN alumni a ON u.id = a.user_id
        LEFT JOIN employers e ON u.id = e.user_id
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
          department: user.department || 'N/A',
          status: user.status,
          ...(user.studentID && { studentId: user.studentID, courseYrSection: user.course_yr_section }),
          ...(user.instructor_id && { instructorId: user.instructor_id }),
          ...(user.degree && { degree: user.degree, alumniCompany: user.company }),
          ...(user.companyname && { companyName: user.companyname, industry: user.industry }),
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

    // Option 1: Delete the user
    const deleteQuery = "DELETE FROM users WHERE id = ?";
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

    // Option 2: Set status to 'rejected' instead of deleting
    // const updateQuery = "UPDATE Users SET status = 'rejected' WHERE id = ?";
    // db.query(updateQuery, [userId], (err, result) => {
    //   ...
    // });
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

    // Update basic user info
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

        // Update role-specific data if provided
        const role = updateData.role;
        if (role) {
          switch (role) {
            case 'student':
              if (updateData.studentId || updateData.courseYrSection) {
                const studentQuery = `
                  INSERT INTO students (user_id, studentID, course_yr_section)
                  VALUES (?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                    studentID = VALUES(studentID),
                    course_yr_section = VALUES(course_yr_section)
                `;
                db.query(studentQuery, [
                  userId,
                  updateData.studentId,
                  updateData.courseYrSection,
                ], (studentErr) => {
                  if (studentErr) console.error("Student update error:", studentErr);
                });
              }
              break;
            case 'instructor':
            case 'staff':
              if (updateData.employeeId || updateData.department) {
                const instructorQuery = `
                  INSERT INTO instructors (user_id, instructor_id, department)
                  VALUES (?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                    instructor_id = VALUES(instructor_id),
                    department = VALUES(department)
                `;
                db.query(instructorQuery, [
                  userId,
                  updateData.employeeId,
                  updateData.department,
                ], (instructorErr) => {
                  if (instructorErr) console.error("Instructor update error:", instructorErr);
                });
              }
              break;
            case 'employer':
              if (updateData.companyName || updateData.industry) {
                const employerQuery = `
                  INSERT INTO employers (user_id, companyname, industry)
                  VALUES (?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                    companyname = VALUES(companyname),
                    industry = VALUES(industry)
                `;
                db.query(employerQuery, [
                  userId,
                  updateData.companyName,
                  updateData.industry,
                ], (employerErr) => {
                  if (employerErr) console.error("Employer update error:", employerErr);
                });
              }
              break;
            case 'alumni':
              if (updateData.degree || updateData.company) {
                const alumniQuery = `
                  INSERT INTO alumni (user_id, degree, company)
                  VALUES (?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                    degree = VALUES(degree),
                    company = VALUES(company)
                `;
                db.query(alumniQuery, [
                  userId,
                  updateData.degree,
                  updateData.company,
                ], (alumniErr) => {
                  if (alumniErr) console.error("Alumni update error:", alumniErr);
                });
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

    // First check if user exists
    const checkUserQuery = "SELECT id, role FROM users WHERE id = ?";
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

      // Delete from role-specific tables first (due to foreign key constraints)
      const deleteRoleSpecificData = (callback) => {
        switch (userRole) {
          case 'student':
            db.query("DELETE FROM students WHERE user_id = ?", [userId], callback);
            break;
          case 'instructor':
          case 'staff':
            db.query("DELETE FROM instructors WHERE user_id = ?", [userId], callback);
            break;
          case 'employer':
            db.query("DELETE FROM employers WHERE user_id = ?", [userId], callback);
            break;
          case 'alumni':
            db.query("DELETE FROM alumni WHERE user_id = ?", [userId], callback);
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

        // Delete from users table
        const deleteUserQuery = "DELETE FROM users WHERE id = ?";
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
  const { type = 'all', status = 'all', search = '', page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = `
    SELECT f.*, u.full_name as creator_name,
           COUNT(DISTINCT fr.id) as submission_count
    FROM Forms f
    LEFT JOIN Users u ON f.created_by = u.id
    LEFT JOIN Form_Responses fr ON f.id = fr.form_id
    WHERE 1=1
  `;
  const params = [];

  if (type !== 'all') {
    if (type === 'templates') {
      query += ` AND f.is_template = TRUE`;
    } else {
      query += ` AND f.is_template = FALSE`;
    }
  }

  if (status !== 'all') {
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
      return res.status(500).json({ success: false, message: "Database error" });
    }

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM Forms f WHERE 1=1`;
    const countParams = [];

    if (type !== 'all') {
      if (type === 'templates') {
        countQuery += ` AND f.is_template = TRUE`;
      } else {
        countQuery += ` AND f.is_template = FALSE`;
      }
    }

    if (status !== 'all') {
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
        return res.status(500).json({ success: false, message: "Database error" });
      }

      const total = countResults[0].total;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        forms: results,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages }
      });
    });
  });
});

// Get single form with questions
app.get("/api/forms/:id", verifyToken, (req, res) => {
  const formId = req.params.id;
  
  // Get form details
  const formQuery = `
    SELECT f.*, u.full_name as creator_name
    FROM Forms f
    LEFT JOIN Users u ON f.created_by = u.id
    WHERE f.id = ?
  `;

  db.query(formQuery, [formId], (err, formResults) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (formResults.length === 0) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    const form = formResults[0];

    // Get questions with options
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
        return res.status(500).json({ success: false, message: "Database error" });
      }

      // Parse options JSON
      const questions = questionsResults.map(q => ({
        ...q,
        options: q.options_json ? JSON.parse(`[${q.options_json}]`) : []
      }));

      res.json({
        success: true,
        form: { ...form, questions }
      });
    });
  });
});

// Create new form
app.post("/api/forms", verifyToken, (req, res) => {
  const { title, description, category, targetAudience, startDate, endDate, questions, imageUrl, isTemplate = false } = req.body;
  const createdBy = req.userId;

  // Validate required fields
  if (!title || !category || !targetAudience) {
    return res.status(400).json({
      success: false,
      message: "Title, category, and target audience are required"
    });
  }

  // Insert form
  const formQuery = `
    INSERT INTO Forms (title, description, category, target_audience, start_date, end_date, image_url, is_template, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(formQuery, [title, description, category, targetAudience, startDate, endDate, imageUrl, isTemplate, createdBy], (err, result) => {
    if (err) {
      console.error("Form creation error:", err);
      return res.status(500).json({ success: false, message: "Failed to create form" });
    }

    const formId = result.insertId;

    // Insert questions if provided
    if (questions && questions.length > 0) {
      const questionPromises = questions.map((q, index) => {
        return new Promise((resolve, reject) => {
          // Validate question
          if (!q.question || !q.type) {
            reject(new Error("Question text and type are required"));
            return;
          }

          const questionQuery = `
            INSERT INTO Questions (form_id, question_text, question_type, description, required, min_value, max_value, order_index)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;

          db.query(questionQuery, [
            formId,
            q.question,
            q.type,
            q.description || null,
            q.required || false,
            q.min || null,
            q.max || null,
            index
          ], (qErr, qResult) => {
            if (qErr) {
              console.error("Question creation error:", qErr);
              reject(qErr);
            } else {
              const questionId = qResult.insertId;

              // Insert options if they exist
              if (q.options && q.options.length > 0) {
                const optionPromises = q.options.map((opt, optIndex) => {
                  return new Promise((optResolve, optReject) => {
                    // Handle both string options and option objects
                    const optionText = typeof opt === 'string' ? opt : opt.option_text || opt.text || opt.label;
                    
                    if (!optionText) {
                      optReject(new Error("Option text is required"));
                      return;
                    }

                    db.query(
                      "INSERT INTO Question_Options (question_id, option_text, order_index) VALUES (?, ?, ?)",
                      [questionId, optionText, optIndex],
                      (optErr) => optErr ? optReject(optErr) : optResolve()
                    );
                  });
                });

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
          });
        });
      });

      Promise.all(questionPromises)
        .then(() => {
          console.log(`✅ Form ${formId} created with ${questions.length} questions`);
          res.status(201).json({
            success: true,
            message: "Form created successfully",
            formId,
            questionCount: questions.length
          });
        })
        .catch((error) => {
          console.error("Questions creation error:", error);
          // Rollback form creation if questions fail
          db.query("DELETE FROM Forms WHERE id = ?", [formId]);
          res.status(500).json({
            success: false,
            message: "Failed to create form questions",
            error: error.message
          });
        });
    } else {
      console.log(`✅ Form ${formId} created without questions`);
      res.status(201).json({
        success: true,
        message: "Form created successfully",
        formId,
        questionCount: 0
      });
    }
  });
});

// Update form
app.patch("/api/forms/:id", verifyToken, (req, res) => {
  const formId = req.params.id;
  const updates = req.body;

  // Build update query dynamically
  const updateFields = [];
  const updateValues = [];

  const allowedFields = ['title', 'description', 'category', 'target_audience', 'status', 'image_url', 'start_date', 'end_date'];

  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      updateValues.push(updates[field]);
    }
  });

  if (updateFields.length === 0) {
    return res.status(400).json({ success: false, message: "No valid fields to update" });
  }

  const updateQuery = `UPDATE Forms SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`;
  updateValues.push(formId);

  db.query(updateQuery, updateValues, (err, result) => {
    if (err) {
      console.error("Form update error:", err);
      return res.status(500).json({ success: false, message: "Failed to update form" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    res.json({ success: true, message: "Form updated successfully" });
  });
});

// Delete form
app.delete("/api/forms/:id", verifyToken, (req, res) => {
  const formId = req.params.id;

  db.query("DELETE FROM Forms WHERE id = ?", [formId], (err, result) => {
    if (err) {
      console.error("Form deletion error:", err);
      return res.status(500).json({ success: false, message: "Failed to delete form" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Form not found" });
    }

    res.json({ success: true, message: "Form deleted successfully" });
  });
});

// Duplicate form
app.post("/api/forms/:id/duplicate", verifyToken, (req, res) => {
  const originalFormId = req.params.id;
  const userId = req.userId;

  // First, get the original form
  db.query("SELECT * FROM Forms WHERE id = ?", [originalFormId], (err, formResults) => {
    if (err || formResults.length === 0) {
      return res.status(404).json({ success: false, message: "Original form not found" });
    }

    const originalForm = formResults[0];

    // Create duplicate
    const duplicateQuery = `
      INSERT INTO Forms (title, description, category, target_audience, status, image_url, start_date, end_date, is_template, created_by)
      VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)
    `;

    db.query(duplicateQuery, [
      originalForm.title + ' (Copy)',
      originalForm.description,
      originalForm.category,
      originalForm.target_audience,
      originalForm.image_url,
      originalForm.start_date,
      originalForm.end_date,
      originalForm.is_template,
      userId
    ], (dupErr, dupResult) => {
      if (dupErr) {
        console.error("Duplicate error:", dupErr);
        return res.status(500).json({ success: false, message: "Failed to duplicate form" });
      }

      const newFormId = dupResult.insertId;

      // Copy questions (simplified - in production you'd copy all questions and options)
      res.status(201).json({ success: true, message: "Form duplicated successfully", formId: newFormId });
    });
  });
});

// Deploy form
app.post("/api/forms/:id/deploy", verifyToken, (req, res) => {
  const formId = req.params.id;
  const { startDate, endDate, targetFilters } = req.body;
  const deployedBy = req.userId;

  const deployQuery = `
    INSERT INTO Form_Deployments (form_id, deployed_by, start_date, end_date, target_filters)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(deployQuery, [formId, deployedBy, startDate, endDate, JSON.stringify(targetFilters)], (err, result) => {
    if (err) {
      console.error("Deploy error:", err);
      return res.status(500).json({ success: false, message: "Failed to deploy form" });
    }

    // Update form status to active
    db.query("UPDATE Forms SET status = 'active' WHERE id = ?", [formId]);

    res.json({ success: true, message: "Form deployed successfully" });
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
      return res.status(500).json({ success: false, message: "Database error" });
    }

    res.json({ success: true, templates: results });
  });
});

// Image upload endpoint
const multer = require("multer");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

app.post("/api/upload/image", verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: imageUrl });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// FORM RESPONSE SUBMISSION ENDPOINTS
// ============================================================

// Submit form response
app.post("/api/forms/:formId/submit", verifyToken, formSubmissionLimiter, (req, res) => {
  const formId = req.params.formId;
  const userId = req.userId;
  const { responses } = req.body;

  console.log(`📤 Submitting form ${formId} for user ${userId}`);
  console.log('📝 Responses:', responses);

  // Validate that responses is provided
  if (!responses || typeof responses !== 'object') {
    return res.status(400).json({
      success: false,
      message: "Responses data is required"
    });
  }

  // Check if form exists and is active
  const checkFormQuery = "SELECT id, title, status FROM Forms WHERE id = ?";
  db.query(checkFormQuery, [formId], (err, formResults) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error"
      });
    }

    if (formResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Form not found"
      });
    }

    const form = formResults[0];
    
    // Check if form is active
    if (form.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: "This form is not currently accepting responses"
      });
    }

    // Check if user already submitted this form
    const checkSubmissionQuery = "SELECT id FROM Form_Responses WHERE form_id = ? AND user_id = ?";
    db.query(checkSubmissionQuery, [formId, userId], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Database error:", checkErr);
        return res.status(500).json({
          success: false,
          message: "Database error"
        });
      }

      if (checkResults.length > 0) {
        return res.status(400).json({
          success: false,
          message: "You have already submitted this form"
        });
      }

      // Validate responses against form questions
      const validateResponsesQuery = `
        SELECT q.id, q.question_text, q.question_type, q.required, qo.option_text
        FROM Questions q
        LEFT JOIN Question_Options qo ON q.id = qo.question_id
        WHERE q.form_id = ?
        ORDER BY q.order_index, qo.order_index
      `;

      db.query(validateResponsesQuery, [formId], (validateErr, questionResults) => {
        if (validateErr) {
          console.error("Validation error:", validateErr);
          return res.status(500).json({
            success: false,
            message: "Failed to validate form responses"
          });
        }

        // Group questions and options
        const questions = new Map();
        questionResults.forEach(row => {
          if (!questions.has(row.id)) {
            questions.set(row.id, {
              id: row.id,
              question_text: row.question_text,
              question_type: row.question_type,
              required: row.required,
              options: []
            });
          }
          if (row.option_text) {
            questions.get(row.id).options.push(row.option_text);
          }
        });

        // Validate responses
        const validationErrors = [];
        questions.forEach(question => {
          const response = responses[question.id];
          
          if (question.required && (response === undefined || response === null || response === '')) {
            validationErrors.push(`Question "${question.question_text}" is required`);
          }
          
          // Validate choice-based questions
          if (['multiple-choice', 'checkbox', 'dropdown'].includes(question.question_type)) {
            if (response !== undefined && question.options.length > 0) {
              const responseArray = Array.isArray(response) ? response : [response];
              const invalidOptions = responseArray.filter(opt => !question.options.includes(opt));
              if (invalidOptions.length > 0) {
                validationErrors.push(`Invalid option(s) for question "${question.question_text}": ${invalidOptions.join(', ')}`);
              }
            }
          }
        });

        if (validationErrors.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: validationErrors
          });
        }

        // Insert the form response
        const insertResponseQuery = `
          INSERT INTO Form_Responses (form_id, user_id, response_data)
          VALUES (?, ?, ?)
        `;

        db.query(insertResponseQuery, [formId, userId, JSON.stringify(responses)], (insertErr, insertResult) => {
          if (insertErr) {
            console.error("Database error:", insertErr);
            return res.status(500).json({
              success: false,
              message: "Failed to submit form response"
            });
          }

          console.log(`✅ Form ${formId} submitted successfully with response ID: ${insertResult.insertId}`);

          res.json({
            success: true,
            message: "Form submitted successfully",
            responseId: insertResult.insertId
          });
        });
      });
    });
  });
});

// Get user's submitted responses
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
        message: "Database error"
      });
    }

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM Form_Responses WHERE user_id = ?";
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
          message: "Database error"
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
          totalPages
        }
      });
    });
  });
});

// Get form responses for analysis (form owners/admins)
app.get("/api/forms/:formId/responses", verifyToken, (req, res) => {
  const formId = req.params.formId;
  const userId = req.userId;
  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Check if user has permission to view responses (form owner or admin)
  const checkPermissionQuery = `
    SELECT f.id, f.title, f.created_by, u.full_name as creator_name
    FROM Forms f
    LEFT JOIN Users u ON f.created_by = u.id
    WHERE f.id = ? AND (f.created_by = ? OR ? IN (
      SELECT id FROM Users WHERE role = 'admin'
    ))
  `;

  db.query(checkPermissionQuery, [formId, userId, userId], (err, permissionResults) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error"
      });
    }

    if (permissionResults.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view these responses"
      });
    }

    // Get form responses
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
          message: "Database error"
        });
      }

      // Get total count for pagination
      let countQuery = "SELECT COUNT(*) as total FROM Form_Responses WHERE form_id = ?";
      const countParams = [formId];

      if (search) {
        countQuery += " AND user_id IN (SELECT id FROM Users WHERE full_name LIKE ? OR email LIKE ?)";
        countParams.push(`%${search}%`, `%${search}%`);
      }

      db.query(countQuery, countParams, (countErr, countResults) => {
        if (countErr) {
          console.error("Count error:", countErr);
          return res.status(500).json({
            success: false,
            message: "Database error"
          });
        }

        const total = countResults[0].total;
        const totalPages = Math.ceil(total / parseInt(limit));

        res.json({
          success: true,
          responses: responseResults.map(response => ({
            ...response,
            response_data: JSON.parse(response.response_data)
          })),
          form: permissionResults[0],
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages
          }
        });
      });
    });
  });
});

// Get form summary/analytics
app.get("/api/forms/:formId/summary", verifyToken, (req, res) => {
  const formId = req.params.formId;
  const userId = req.userId;

  // Check permission
  const checkPermissionQuery = "SELECT id, title, created_by FROM Forms WHERE id = ? AND (created_by = ? OR ? IN (SELECT id FROM Users WHERE role = 'admin'))";
  
  db.query(checkPermissionQuery, [formId, userId, userId], (err, permissionResults) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error"
      });
    }

    if (permissionResults.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this form summary"
      });
    }

    // Get form statistics
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
          message: "Database error"
        });
      }

      const stats = statsResults[0] || {
        total_responses: 0,
        total_assignments: 0,
        completion_rate: 0,
        first_response: null,
        last_response: null
      };

      // Get response breakdown by role
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
            message: "Database error"
          });
        }

        res.json({
          success: true,
          form: permissionResults[0],
          summary: {
            ...stats,
            role_breakdown: roleResults
          }
        });
      });
    });
  });
});

// Get assigned forms for user
app.get("/api/forms/assigned-forms", verifyToken, (req, res) => {
  const userId = req.userId;
  const { status = 'all', category } = req.query;

  // Get user's role
  const getUserRoleQuery = "SELECT role FROM Users WHERE id = ?";
  
  db.query(getUserRoleQuery, [userId], (err, userResults) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({
        success: false,
        message: "Database error"
      });
    }

    if (userResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const userRole = userResults[0].role;

    // Get assigned forms based on user role and status
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

    // Filter by form status if specified
    if (status !== 'all') {
      query += " AND f.status = ?";
      params.push(status);
    }

    // Filter by category if specified
    if (category) {
      query += " AND f.category = ?";
      params.push(category);
    }

    // Only show active forms or forms assigned to this user
    query += " AND (f.status = 'active' OR fa.user_id = ?)";
    params.push(userId);

    query += " ORDER BY fa.assigned_at DESC";

    db.query(query, params, (formsErr, formsResults) => {
      if (formsErr) {
        console.error("Database error:", formsErr);
        return res.status(500).json({
          success: false,
          message: "Database error"
        });
      }

      res.json({
        success: true,
        forms: formsResults
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

  // Log error details for debugging (but don't expose to client)
  const errorId = Math.random().toString(36).substr(2, 9);
  console.error(`Error ID: ${errorId}`, {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  if (process.env.NODE_ENV === "production") {
    res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again later.",
      errorId: errorId // Provide error ID for support
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
      errorId: errorId
    });
  }
});

// Specific error handlers for common issues
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors || [err.message]
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }
  
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      message: "Access denied"
    });
  }
  
  next(err);
});

// 404 handler - Express 4.x compatible
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Routes are handled directly in this file

app.listen(port, () => {
  console.log(`🔒 Secure server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
