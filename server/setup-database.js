// Database Setup Script
// This script ensures the database and tables are properly created.
// Core tables are defined inline; additional migrations are read from
// the /server/migrations/ directory if it exists.
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const dbName = process.env.DB_NAME || "railway";

// ---------------------------------------------------------------------------
// Core schema — defined inline so the script has no external file dependencies
// ---------------------------------------------------------------------------
const CORE_TABLES_SQL = [
  // Users
  `CREATE TABLE IF NOT EXISTS \`users\` (
    \`id\`                INT(11)       NOT NULL AUTO_INCREMENT,
    \`name\`              VARCHAR(255)  NOT NULL,
    \`email\`             VARCHAR(255)  NOT NULL,
    \`password\`          VARCHAR(255)  NOT NULL,
    \`role\`              ENUM('admin','student','alumni','employer','instructor') NOT NULL DEFAULT 'student',
    \`department\`        VARCHAR(255)  DEFAULT NULL,
    \`created_at\`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`uq_users_email\` (\`email\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // Forms
  `CREATE TABLE IF NOT EXISTS \`forms\` (
    \`id\`                INT(11)       NOT NULL AUTO_INCREMENT,
    \`title\`             VARCHAR(255)  NOT NULL,
    \`description\`       TEXT          DEFAULT NULL,
    \`created_by\`        INT(11)       NOT NULL,
    \`created_at\`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`idx_forms_created_by\` (\`created_by\`),
    CONSTRAINT \`fk_forms_created_by\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // Questions
  `CREATE TABLE IF NOT EXISTS \`questions\` (
    \`id\`                INT(11)       NOT NULL AUTO_INCREMENT,
    \`form_id\`           INT(11)       NOT NULL,
    \`question_text\`     TEXT          NOT NULL,
    \`question_type\`     ENUM('text','textarea','multiple-choice','checkbox','dropdown','rating','linear-scale') NOT NULL DEFAULT 'text',
    \`options\`           JSON          DEFAULT NULL,
    \`required\`          TINYINT(1)    NOT NULL DEFAULT 0,
    \`order_index\`       INT(11)       NOT NULL DEFAULT 0,
    \`created_at\`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`idx_questions_form_id\` (\`form_id\`),
    CONSTRAINT \`fk_questions_form_id\` FOREIGN KEY (\`form_id\`) REFERENCES \`forms\` (\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  // Form_Responses
  `CREATE TABLE IF NOT EXISTS \`form_responses\` (
    \`id\`                INT(11)       NOT NULL AUTO_INCREMENT,
    \`form_id\`           INT(11)       NOT NULL,
    \`respondent_id\`     INT(11)       NOT NULL,
    \`response_data\`     JSON          NOT NULL,
    \`submitted_at\`      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    KEY \`idx_form_responses_form_id\`      (\`form_id\`),
    KEY \`idx_form_responses_respondent_id\` (\`respondent_id\`),
    CONSTRAINT \`fk_form_responses_form_id\`      FOREIGN KEY (\`form_id\`)      REFERENCES \`forms\` (\`id\`) ON DELETE CASCADE,
    CONSTRAINT \`fk_form_responses_respondent_id\` FOREIGN KEY (\`respondent_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Execute a single SQL statement, gracefully skipping errors that indicate
 * the change has already been applied (duplicate column, duplicate index,
 * table already exists, etc.).
 */
async function executeStatement(connection, statement, label) {
  const trimmed = statement.trim();
  if (!trimmed || trimmed.startsWith("--") || trimmed.startsWith("/*")) {
    return; // skip comments / empty
  }
  if (trimmed.toUpperCase().startsWith("DELIMITER")) {
    return; // skip DELIMITER directives
  }
  // SELECT statements used as status checks in migrations — run but ignore results
  if (trimmed.toUpperCase().startsWith("SELECT")) {
    try {
      await connection.query(trimmed);
    } catch (_) {
      // ignore
    }
    return;
  }

  try {
    await connection.query(trimmed);
  } catch (err) {
    const msg = err.message || "";
    // Errors that mean "already done" — safe to skip
    if (
      msg.includes("already exists") ||          // table / database already exists
      err.code === "ER_TABLE_EXISTS_ERROR" ||
      err.code === "ER_DUP_FIELDNAME" ||          // column already added
      err.code === "ER_DUP_KEYNAME" ||            // index already exists
      err.code === "ER_CANT_DROP_FIELD_OR_KEY"    // DROP of non-existent key
    ) {
      console.log(`ℹ️  [${label}] Skipped (already applied): ${msg.split("\n")[0]}`);
    } else {
      console.error(`❌ [${label}] Error: ${msg}`);
      console.error(`   Statement: ${trimmed.substring(0, 120)}`);
      // Non-fatal for migrations — log and continue
    }
  }
}

/**
 * Split a SQL file into individual statements on semicolons, then execute
 * each one via executeStatement.
 */
async function executeSQLBlock(connection, sql, label) {
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (let i = 0; i < statements.length; i++) {
    await executeStatement(connection, statements[i], `${label} #${i + 1}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function setupDatabase() {
  let connection;

  try {
    console.log("🚀 Starting database setup...");

    // Connect without selecting a database first
    connection = await mysql.createConnection({
      host:     process.env.DB_HOST     || "localhost",
      user:     process.env.DB_USER     || "root",
      password: process.env.DB_PASSWORD || "",
      port:     parseInt(process.env.DB_PORT || "3306", 10),
      multipleStatements: false, // execute one statement at a time for safety
    });
    console.log("✅ Connected to MySQL server");

    // Ensure the target database exists
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`
    );
    console.log(`✅ Database '${dbName}' ready`);

    await connection.query(`USE \`${dbName}\``);
    console.log(`✅ Using database '${dbName}'`);

    // ------------------------------------------------------------------
    // 1. Create core tables
    // ------------------------------------------------------------------
    console.log("🏗️  Creating core tables...");
    for (const sql of CORE_TABLES_SQL) {
      // Extract table name for logging
      const match = sql.match(/CREATE TABLE IF NOT EXISTS `(\w+)`/i);
      const tableName = match ? match[1] : "unknown";
      await executeStatement(connection, sql, `core:${tableName}`);
      console.log(`   ✔ ${tableName}`);
    }
    console.log("✅ Core tables ready");

    // ------------------------------------------------------------------
    // 2. Apply migrations from /server/migrations/
    // ------------------------------------------------------------------
    const migrationsDir = path.join(__dirname, "migrations");
    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith(".sql"))
        .sort(); // alphabetical order ensures consistent application

      if (migrationFiles.length === 0) {
        console.log("ℹ️  No migration files found in migrations/");
      } else {
        console.log(`📦 Applying ${migrationFiles.length} migration(s)...`);
        for (const file of migrationFiles) {
          const filePath = path.join(migrationsDir, file);
          console.log(`   ▶ ${file}`);
          const sql = fs.readFileSync(filePath, "utf8");
          await executeSQLBlock(connection, sql, file);
          console.log(`   ✔ ${file} done`);
        }
        console.log("✅ Migrations applied");
      }
    } else {
      console.log("ℹ️  No migrations/ directory found — skipping migrations");
    }

    // ------------------------------------------------------------------
    // 3. Smoke-test: verify the Users table is queryable
    // ------------------------------------------------------------------
    console.log("🧪 Testing database...");
    const [rows] = await connection.query(
      "SELECT COUNT(*) AS userCount FROM `users`"
    );
    console.log(
      `✅ Database test successful — ${rows[0].userCount} user(s) in table`
    );

    console.log("🎉 Database setup completed successfully!");
    console.log("💡 You can now start the server with: npm start");
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
