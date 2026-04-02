// Database Setup Script
// This script ensures the database and tables are properly created
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const dbName = process.env.DB_NAME || "feedback_system";

async function setupDatabase() {
  let db;
  try {
    console.log("🚀 Starting database setup...");

    // Connect to MySQL server (without specifying database)
    db = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      port: process.env.DB_PORT || 3306,
    });
    console.log("✅ Connected to MySQL server");

    // Create database if it doesn't exist
    console.log("📁 Creating database...");
    await db.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database '${dbName}' ready`);

    // Use the database
    await db.query(`USE ${dbName}`);
    console.log(`✅ Using database '${dbName}'`);

    // Check for existing tables to avoid conflicts
    console.log("🔍 Checking for existing tables...");
    const [tableRows] = await db.query("SHOW TABLES");
    const existingTables = tableRows.map(row => Object.values(row)[0]);
    console.log(`📋 Found ${existingTables.length} existing tables:`, existingTables.join(", "));

    // Check if critical tables exist
    const criticalTables = ['Forms', 'Questions', 'Form_Responses', 'Users'];
    const existingCriticalTables = criticalTables.filter(table => existingTables.includes(table));

    if (existingCriticalTables.length > 0) {
      console.log(`⚠️  Found existing critical tables: ${existingCriticalTables.join(", ")}`);
      console.log("💡 The setup script will safely skip creating tables that already exist.");
    }

    // Read and execute the schema files
    const schemaFiles = [
      "schema/feedback_system.sql",
      "schema/academic_periods.sql",
      "schema/add_archived_to_feedback.sql"
    ];

    for (const schemaFile of schemaFiles) {
      const schemaPath = path.join(__dirname, schemaFile);
      console.log(`📋 Reading ${schemaFile}...`);

      if (!fs.existsSync(schemaPath)) {
        console.log(`⚠️  Schema file not found: ${schemaPath} - skipping`);
        continue;
      }

      const schemaSQL = fs.readFileSync(schemaPath, "utf8");
      console.log(`🏗️  Executing ${schemaFile}...`);

      // Split SQL into individual statements
      const statements = schemaSQL
        .split(";")
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        try {
          // Skip DELIMITER statements and comments
          if (statement.includes("DELIMITER") || statement.trim().startsWith("--") || statement.trim().startsWith("/*")) {
            continue;
          }
          await db.query(statement);
        } catch (err) {
          if (err.message.includes("already exists")) {
            // Table already exists - this is safe, continue
            console.log(`ℹ️  Statement ${i + 1} skipped (table already exists):`, err.message);
          } else {
            console.log(`⚠️  Statement ${i + 1} skipped or failed:`, err.message);
          }
        }
      }

      console.log(`✅ ${schemaFile} execution completed`);
    }

    // Test the connection with a simple query
    console.log("🧪 Testing database connection...");
    const [testRows] = await db.query("SELECT COUNT(*) as userCount FROM Users");
    console.log(`✅ Database test successful - Found ${testRows[0].userCount} users`);

    console.log("🎉 Database setup completed successfully!");
    console.log("💡 You can now start the server with: npm start");

  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    process.exit(1);
  } finally {
    if (db) await db.end();
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };