// Database Setup Script
// This script ensures the database and tables are properly created
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

async function setupDatabase() {
  try {
    console.log("🚀 Starting database setup...");
    
    // Connect to MySQL server (without specifying database)
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

    // Create database if it doesn't exist
    console.log("📁 Creating database...");
    await new Promise((resolve, reject) => {
      db.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
        if (err) {
          console.error("❌ Failed to create database:", err.message);
          reject(err);
        } else {
          console.log(`✅ Database '${dbName}' ready`);
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

    // Check for existing tables to avoid conflicts
    console.log("🔍 Checking for existing tables...");
    const existingTables = await new Promise((resolve, reject) => {
      db.query("SHOW TABLES", (err, results) => {
        if (err) {
          console.error("❌ Failed to check existing tables:", err.message);
          reject(err);
        } else {
          const tables = results.map(row => Object.values(row)[0]);
          console.log(`📋 Found ${tables.length} existing tables:`, tables.join(", "));
          resolve(tables);
        }
      });
    });

    // Check if critical tables exist
    const criticalTables = ['Forms', 'Questions', 'Form_Responses', 'Users'];
    const existingCriticalTables = criticalTables.filter(table => existingTables.includes(table));
    
    if (existingCriticalTables.length > 0) {
      console.log(`⚠️  Found existing critical tables: ${existingCriticalTables.join(", ")}`);
      console.log("💡 The setup script will safely skip creating tables that already exist.");
    }

    // Read and execute the schema file
    const schemaPath = path.join(__dirname, "schema/feedback_system.sql");
    console.log("📋 Reading schema file...");
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schemaSQL = fs.readFileSync(schemaPath, "utf8");
    console.log("🏗️  Executing schema...");

    // Split SQL into individual statements
    const statements = schemaSQL
      .split(";")
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await new Promise((resolve, reject) => {
          db.query(statement, (err) => {
            if (err) {
              // Skip DELIMITER statements and comments
              if (statement.includes("DELIMITER") || statement.trim().startsWith("--") || statement.trim().startsWith("/*")) {
                resolve();
              } else if (err.message.includes("already exists")) {
                // Table already exists - this is safe, continue
                console.log(`ℹ️  Statement ${i + 1} skipped (table already exists):`, err.message);
                resolve();
              } else {
                console.error(`❌ Error executing statement ${i + 1}:`, err.message);
                console.error("Statement:", statement.substring(0, 100) + "...");
                reject(err);
              }
            } else {
              resolve();
            }
          });
        });
      } catch (err) {
        // Continue with other statements even if one fails
        console.log(`⚠️  Statement ${i + 1} skipped or failed:`, err.message);
      }
    }

    console.log("✅ Schema execution completed");

    // Test the connection with a simple query
    console.log("🧪 Testing database connection...");
    await new Promise((resolve, reject) => {
      db.query("SELECT COUNT(*) as userCount FROM Users", (err, results) => {
        if (err) {
          console.error("❌ Database test failed:", err.message);
          reject(err);
        } else {
          console.log(`✅ Database test successful - Found ${results[0].userCount} users`);
          resolve();
        }
      });
    });

    console.log("🎉 Database setup completed successfully!");
    console.log("💡 You can now start the server with: npm start");

  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    process.exit(1);
  } finally {
    db.end();
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };