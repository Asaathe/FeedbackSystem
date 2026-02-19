// Rate Limiting Configuration for Production Deployment
const rateLimit = require("express-rate-limit");

// Rate limiting configuration from environment
// Default values optimized for high-traffic deployment with many users
const RATE_LIMIT_WINDOW_MS =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS =
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 2000; // Increased to 2000 for high-traffic deployment

/**
 * Rate limiter for authentication endpoints
 * Limits: 20 requests per 15 minutes (slightly more for deployment)
 */
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 20,
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
 * Limits: 2000 requests per hour for high-traffic feedback system
 */
const formSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2000,
  message: {
    success: false,
    message: "Too many form submissions, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General rate limiter for all endpoints
 * Limits: 2000 requests per 15 minutes for high-traffic deployment
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
 * Limits: 3000 requests per 15 minutes for deployment with many users
 */
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 3000,
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
