// Database connection module
const mysql = require("mysql");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "feedback_system",
  port: process.env.DB_PORT || 3306,
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    console.error(
      "Make sure XAMPP MySQL is running and database 'feedback_system' exists!"
    );
  } else {
    console.log("✅ Connected to MySQL database 'feedback_system'");
  }
});

module.exports = db;