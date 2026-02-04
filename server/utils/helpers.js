// Helper Utility Functions

/**
 * Create a standardized API response
 * @param {boolean} success - Whether the operation was successful
 * @param {string} message - Response message
 * @param {object} data - Additional data to include
 * @returns {object} Standardized response object
 */
const createResponse = (success, message, data = {}) => {
  return {
    success,
    message,
    ...data,
  };
};

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {object} errors - Additional error details
 * @returns {object} Error response object
 */
const createErrorResponse = (message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

/**
 * Create a success response
 * @param {string} message - Success message
 * @param {object} data - Additional data to include
 * @returns {object} Success response object
 */
const createSuccessResponse = (message, data = {}) => {
  return {
    success: true,
    message,
    ...data,
  };
};

/**
 * Wrap database query in a Promise
 * @param {object} db - Database connection
 * @param {string} query - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise} Promise that resolves with query results
 */
const queryDatabase = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

/**
 * Execute multiple database queries in a transaction
 * @param {object} db - Database connection
 * @param {array} queries - Array of {query, params} objects
 * @returns {Promise} Promise that resolves with all results
 */
const executeTransaction = async (db, queries) => {
  return new Promise((resolve, reject) => {
    db.beginTransaction((err) => {
      if (err) {
        return reject(err);
      }

      const results = [];
      let currentIndex = 0;

      const executeNext = () => {
        if (currentIndex >= queries.length) {
          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => reject(commitErr));
            }
            resolve(results);
          });
          return;
        }

        const { query, params } = queries[currentIndex];
        db.query(query, params, (queryErr, result) => {
          if (queryErr) {
            return db.rollback(() => reject(queryErr));
          }

          results.push(result);
          currentIndex++;
          executeNext();
        });
      };

      executeNext();
    });
  });
};

/**
 * Generate a unique ID
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
const generateUniqueId = (prefix = "id") => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after sleep
 */
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry a function with exponential backoff
 * @param {function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} Promise that resolves with function result
 */
const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await sleep(delay * Math.pow(2, i));
      }
    }
  }

  throw lastError;
};

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "object" && Object.keys(value).length === 0) return true;
  return false;
};

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));

  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
};

/**
 * Merge multiple objects
 * @param {...object} objects - Objects to merge
 * @returns {object} Merged object
 */
const mergeObjects = (...objects) => {
  return objects.reduce((result, obj) => {
    return { ...result, ...obj };
  }, {});
};

/**
 * Get nested object property safely
 * @param {object} obj - Object to get property from
 * @param {string} path - Dot-separated path to property
 * @param {*} defaultValue - Default value if property doesn't exist
 * @returns {*} Property value or default
 */
const getNestedProperty = (obj, path, defaultValue = null) => {
  const keys = path.split(".");
  let result = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }

  return result !== undefined ? result : defaultValue;
};

/**
 * Log with timestamp
 * @param {string} level - Log level (info, warn, error)
 * @param {...any} args - Arguments to log
 */
const logWithTimestamp = (level, ...args) => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  switch (level) {
    case "error":
      console.error(prefix, ...args);
      break;
    case "warn":
      console.warn(prefix, ...args);
      break;
    default:
      console.log(prefix, ...args);
  }
};

module.exports = {
  createResponse,
  createErrorResponse,
  createSuccessResponse,
  queryDatabase,
  executeTransaction,
  generateUniqueId,
  sleep,
  retryWithBackoff,
  isEmpty,
  deepClone,
  mergeObjects,
  getNestedProperty,
  logWithTimestamp,
};
