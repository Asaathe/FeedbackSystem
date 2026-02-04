// Database Configuration
const mysql = require("mysql");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "feedback_system",
  port: process.env.DB_PORT || 3306,
  charset: "utf8mb4",
  maxAllowedPacket: 16777216,
};

// Create database connection
const db = mysql.createConnection(dbConfig);

// Connect to database
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    console.error(
      "Make sure XAMPP MySQL is running and database 'feedback_system' exists!"
    );
  } else {
    console.log("Connected to MySQL database 'feedback_system'");
  }
});

// Handle connection errors
db.on("error", (err) => {
  console.error("Database error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("Database connection lost. Attempting to reconnect...");
    db.connect();
  }
});

module.exports = db;
