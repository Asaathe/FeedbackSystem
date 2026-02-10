// Migration Script: Add start_time and end_time to form_deployments table
const mysql = require("mysql");
const fs = require("fs");
const path = require("path");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  port: process.env.DB_PORT || 3306,
});

const dbName = process.env.DB_NAME || "feedback_system";

async function runMigration() {
  try {
    console.log("🚀 Starting migration: Add start_time and end_time to form_deployments...");

    // Connect to MySQL server
    await new Promise((resolve, reject) => {
      db.connect((err) => {
        if (err) {
          console.error("❌ Failed to connect to MySQL server:", err.message);
          reject(err);
        } else {
          console.log("✅ Connected to MySQL server");
          resolve();
        }
      });
    });

    // Use the database
    await new Promise((resolve, reject) => {
      db.query(`USE ${dbName}`, (err) => {
        if (err) {
          console.error("❌ Failed to use database:", err.message);
          reject(err);
        } else {
          console.log(`✅ Using database '${dbName}'`);
          resolve();
        }
      });
    });

    // Check if columns already exist
    const columns = await new Promise((resolve, reject) => {
      db.query("SHOW COLUMNS FROM form_deployments", (err, results) => {
        if (err) {
          console.error("❌ Failed to check columns:", err.message);
          reject(err);
        } else {
          const columnNames = results.map(row => row.Field);
          resolve(columnNames);
        }
      });
    });

    console.log("📋 Current columns in form_deployments:", columns);

    // Add start_time column if it doesn't exist
    if (!columns.includes('start_time')) {
      console.log("➕ Adding start_time column...");
      await new Promise((resolve, reject) => {
        db.query(
          "ALTER TABLE form_deployments ADD COLUMN start_time TIME DEFAULT NULL AFTER start_date",
          (err) => {
            if (err) {
              console.error("❌ Failed to add start_time column:", err.message);
              reject(err);
            } else {
              console.log("✅ start_time column added");
              resolve();
            }
          }
        );
      });
    } else {
      console.log("ℹ️  start_time column already exists, skipping...");
    }

    // Add end_time column if it doesn't exist
    if (!columns.includes('end_time')) {
      console.log("➕ Adding end_time column...");
      await new Promise((resolve, reject) => {
        db.query(
          "ALTER TABLE form_deployments ADD COLUMN end_time TIME DEFAULT NULL AFTER end_date",
          (err) => {
            if (err) {
              console.error("❌ Failed to add end_time column:", err.message);
              reject(err);
            } else {
              console.log("✅ end_time column added");
              resolve();
            }
          }
        );
      });
    } else {
      console.log("ℹ️  end_time column already exists, skipping...");
    }

    // Add index for time-based queries if it doesn't exist
    const indexes = await new Promise((resolve, reject) => {
      db.query("SHOW INDEX FROM form_deployments", (err, results) => {
        if (err) {
          console.error("❌ Failed to check indexes:", err.message);
          reject(err);
        } else {
          const indexNames = results.map(row => row.Key_name);
          resolve(indexNames);
        }
      });
    });

    if (!indexes.includes('idx_time_range')) {
      console.log("➕ Adding idx_time_range index...");
      await new Promise((resolve, reject) => {
        db.query(
          "ALTER TABLE form_deployments ADD INDEX idx_time_range (start_time, end_time)",
          (err) => {
            if (err) {
              console.error("❌ Failed to add idx_time_range index:", err.message);
              reject(err);
            } else {
              console.log("✅ idx_time_range index added");
              resolve();
            }
          }
        );
      });
    } else {
      console.log("ℹ️  idx_time_range index already exists, skipping...");
    }

    console.log("🎉 Migration completed successfully!");
    console.log("💡 The form_deployments table now has start_time and end_time columns.");

  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    db.end();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
