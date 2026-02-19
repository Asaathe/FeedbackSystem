// Rate Limiting Configuration
const rateLimit = require("express-rate-limit");

// Rate limiting configuration from environment
const RATE_LIMIT_WINDOW_MS =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS =
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500; // Increased to 500 for university systems

/**
 * Rate limiter for authentication endpoints
 * Limits: 10 requests per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 10,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter for form submissions
 * Limits: 500 requests per hour for university systems with many students
 */
const formSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500,
  message: {
    success: false,
    message: "Too many form submissions, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General rate limiter for all endpoints
 * Limits: 100 requests per 15 minutes
 */
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter for API endpoints
 * Limits: 200 requests per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

module.exports = {
  authLimiter,
  formSubmissionLimiter,
  generalLimiter,
  apiLimiter,
};
