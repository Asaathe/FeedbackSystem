// Database Configuration
const mysql = require("mysql");

const dbConfig = {
  host: process.env.DB_HOST ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  charset: "utf8mb4",
  maxAllowedPacket: 16777216,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 10000,
  reconnect: true,
  // Retry settings
  reconnectAttempts: 10,
  reconnectDelay: 1000
};

// Create connection pool (more resilient than single connection)
const pool = mysql.createPool(dbConfig);

// Test the connection on startup
const testConnection = () => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("Database connection failed:", err.message);
      console.error("Make sure XAMPP MySQL is running and database exists!");
    } else {
      console.log("Connected to MySQL database");
      connection.release();
    }
  });
};

// Initial connection test
testConnection();

// Handle connection errors and reconnect
pool.on("error", (err) => {
  console.error("Database pool error:", err.code);
  if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET" || err.code === "ECONNREFUSED") {
    console.log("Database connection lost. Attempting to reconnect...");
    // Force a new connection test
    setTimeout(testConnection, 1000);
  }
});

// Helper to get a fresh connection
const getFreshConnection = () => {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      ...dbConfig,
      reconnect: true
    });
    
    connection.connect((err) => {
      if (err) {
        connection.destroy();
        reject(err);
      } else {
        resolve(connection);
      }
    });
  });
};

// Query wrapper that handles reconnection
const queryWithRetry = (sql, params, retries = 3) => {
  return new Promise((resolve, reject) => {
    const attempt = (attemptNumber) => {
      pool.query(sql, params, (err, results) => {
        if (err) {
          if (attemptNumber < retries && (err.code === "ECONNRESET" || err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNREFUSED")) {
            console.log(`Query failed, retrying (${attemptNumber + 1}/${retries})...`);
            setTimeout(() => attempt(attemptNumber + 1), 500);
          } else {
            reject(err);
          }
        } else {
          resolve(results);
        }
      });
    };
    attempt(0);
  });
};

module.exports = pool;
module.exports.queryWithRetry = queryWithRetry;
module.exports.getFreshConnection = getFreshConnection;
