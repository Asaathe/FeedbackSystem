// JWT Configuration
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Warn if using default secret in production
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.warn(
    "⚠️  WARNING: Using default JWT secret - set JWT_SECRET environment variable for production"
  );
}

/**
 * Generate JWT token for user
 * @param {number} userId - User ID
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Decode JWT token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded token or null if invalid
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  generateToken,
  verifyToken,
  decodeToken,
};
