// Database Setup Script
// This script ensures the database and tables are properly created
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  port: process.env.DB_PORT || 3306,
});

const dbName = process.env.DB_NAME || "feedback_system";

// Core tables required by the application, in dependency order.
// Table names match the casing used throughout the application code
// (e.g. authService.js queries `Users`, `Forms`, `Questions`, `Form_Responses`).
const CORE_TABLES_SQL = [
  // Users — primary identity table; must be created before any FK-dependent tables
  `CREATE TABLE IF NOT EXISTS \`Users\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`email\` varchar(255) NOT NULL,
    \`password_hash\` varchar(255) NOT NULL,
    \`full_name\` varchar(255) NOT NULL,
    \`role\` enum('admin','student','alumni','employer','instructor') NOT NULL,
    \`status\` enum('active','inactive','pending') NOT NULL DEFAULT 'pending',
    \`registration_date\` datetime DEFAULT NULL,
    \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
    \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`email\` (\`email\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // students — role-specific profile for student users
  `CREATE TABLE IF NOT EXISTS \`students\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`user_id\` int(11) NOT NULL,
    \`studentID\` varchar(50) DEFAULT NULL,
    \`program_id\` int(11) DEFAULT NULL,
    \`contact_number\` varchar(20) DEFAULT NULL,
    \`image\` varchar(500) DEFAULT NULL,
    \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`idx_students_user_id\` (\`user_id\`),
    CONSTRAINT \`fk_students_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`Users\` (\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // instructors — role-specific profile for instructor users
  `CREATE TABLE IF NOT EXISTS \`instructors\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`user_id\` int(11) NOT NULL,
    \`instructor_id\` varchar(50) DEFAULT NULL,
    \`department\` varchar(255) DEFAULT NULL,
    \`subject_taught\` text DEFAULT NULL,
    \`school_role\` varchar(255) DEFAULT NULL,
    \`image\` varchar(500) DEFAULT NULL,
    \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`idx_instructors_user_id\` (\`user_id\`),
    CONSTRAINT \`fk_instructors_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`Users\` (\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // alumni — role-specific profile for alumni users
  `CREATE TABLE IF NOT EXISTS \`alumni\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`user_id\` int(11) NOT NULL,
    \`grad_year\` year(4) DEFAULT NULL,
    \`degree\` varchar(100) DEFAULT NULL,
    \`jobtitle\` varchar(255) DEFAULT NULL,
    \`contact\` varchar(20) DEFAULT NULL,
    \`company\` varchar(255) DEFAULT NULL,
    \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`idx_alumni_user_id\` (\`user_id\`),
    CONSTRAINT \`fk_alumni_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`Users\` (\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // employers — role-specific profile for employer users
  `CREATE TABLE IF NOT EXISTS \`employers\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`user_id\` int(11) NOT NULL,
    \`companyname\` varchar(255) DEFAULT NULL,
    \`industry\` varchar(255) DEFAULT NULL,
    \`location\` varchar(255) DEFAULT NULL,
    \`contact\` varchar(20) DEFAULT NULL,
    \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`idx_employers_user_id\` (\`user_id\`),
    CONSTRAINT \`fk_employers_user_id\` FOREIGN KEY (\`user_id\`) REFERENCES \`Users\` (\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // Forms — feedback/evaluation form definitions
  `CREATE TABLE IF NOT EXISTS \`Forms\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`title\` varchar(255) NOT NULL,
    \`description\` text DEFAULT NULL,
    \`created_by\` int(11) NOT NULL,
    \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
    \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`idx_forms_created_by\` (\`created_by\`),
    CONSTRAINT \`fk_forms_created_by\` FOREIGN KEY (\`created_by\`) REFERENCES \`Users\` (\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // Questions — individual questions belonging to a Form
  `CREATE TABLE IF NOT EXISTS \`Questions\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`form_id\` int(11) NOT NULL,
    \`question_text\` text NOT NULL,
    \`question_type\` enum('text','textarea','multiple-choice','checkbox','dropdown','rating','linear-scale') NOT NULL,
    \`options\` json DEFAULT NULL,
    \`required\` tinyint(1) NOT NULL DEFAULT 0,
    \`order_index\` int(11) NOT NULL DEFAULT 0,
    \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`idx_questions_form_id\` (\`form_id\`),
    CONSTRAINT \`fk_questions_form_id\` FOREIGN KEY (\`form_id\`) REFERENCES \`Forms\` (\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // Form_Responses — submitted responses to a Form by a user
  `CREATE TABLE IF NOT EXISTS \`Form_Responses\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`form_id\` int(11) NOT NULL,
    \`respondent_id\` int(11) NOT NULL,
    \`response_data\` json NOT NULL,
    \`submitted_at\` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`idx_form_responses_form_id\` (\`form_id\`),
    KEY \`idx_form_responses_respondent_id\` (\`respondent_id\`),
    CONSTRAINT \`fk_form_responses_form_id\` FOREIGN KEY (\`form_id\`) REFERENCES \`Forms\` (\`id\`) ON DELETE CASCADE,
    CONSTRAINT \`fk_form_responses_respondent_id\` FOREIGN KEY (\`respondent_id\`) REFERENCES \`Users\` (\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
];

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
          console.log(`📋 Found ${tables.length} existing tables:`, tables.join(", ") || "(none)");
          resolve(tables);
        }
      });
    });

    // Check if critical tables exist
    const criticalTables = ['Users', 'Forms', 'Questions', 'Form_Responses'];
    const existingCriticalTables = criticalTables.filter(table => existingTables.includes(table));
    
    if (existingCriticalTables.length > 0) {
      console.log(`⚠️  Found existing critical tables: ${existingCriticalTables.join(", ")}`);
      console.log("💡 The setup script will safely skip creating tables that already exist.");
    }

    // Create core tables using the inline CORE_TABLES_SQL definitions
    console.log("🏗️  Creating core tables...");
    for (let i = 0; i < CORE_TABLES_SQL.length; i++) {
      const statement = CORE_TABLES_SQL[i];
      // Extract table name for logging (matches the first backtick-quoted identifier after CREATE TABLE IF NOT EXISTS)
      const tableNameMatch = statement.match(/CREATE TABLE IF NOT EXISTS `([^`]+)`/i);
      const tableName = tableNameMatch ? tableNameMatch[1] : `table ${i + 1}`;

      try {
        await new Promise((resolve, reject) => {
          db.query(statement, (err) => {
            if (err) {
              if (err.message.includes("already exists")) {
                console.log(`ℹ️  Table '${tableName}' already exists — skipping`);
                resolve();
              } else {
                console.error(`❌ Failed to create table '${tableName}':`, err.message);
                reject(err);
              }
            } else {
              console.log(`✅ Table '${tableName}' ready`);
              resolve();
            }
          });
        });
      } catch (err) {
        console.log(`⚠️  Table '${tableName}' skipped or failed:`, err.message);
      }
    }

    // Test the connection with a simple query against the Users table
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