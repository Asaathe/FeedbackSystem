const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

// In-memory storage for backup metadata (in production, this could be a JSON file)
let backups = [];

// Function to add a backup (for persistence)
const addBackup = (backup) => {
  backups.push(backup);
};

/**
 * Get all backups
 */
const getAllBackups = async (req, res) => {
  try {
    return res.json({
      success: true,
      backups: backups
    });
  } catch (error) {
    console.error("Get backups error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      backups: []
    });
  }
};

/**
 * Create a new backup
 */
const createBackup = async (req, res) => {
  try {
    const { name, tables, format = 'sql', type = 'custom' } = req.body;
    const userId = req.user?.id;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Backup name is required"
      });
    }

    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one table must be selected"
      });
    }

    const backupId = uuidv4();
    const now = new Date();

    // Create backup metadata
    const backup = {
      id: backupId,
      name: name.trim(),
      type,
      status: 'in_progress',
      format,
      tables,
      file_size: 0,
      created_by: userId,
      created_at: now.toISOString(),
      completed_at: null
    };

    // Add to in-memory storage
    addBackup(backup);

    try {
      // Generate backup file content
      let fileContent = '';
      let fileSize = 0;

      if (format === 'sql') {
        fileContent = await generateSQLBackupContent(tables);
      } else if (format === 'csv') {
        fileContent = await generateCSVBackupContent(tables);
      }

      fileSize = Buffer.byteLength(fileContent, 'utf8');

      // Update backup as completed
      backup.status = 'completed';
      backup.file_size = fileSize;
      backup.completed_at = now.toISOString();

      return res.json({
        success: true,
        message: "Backup created successfully",
        backup
      });

    } catch (backupError) {
      console.error("Error generating backup:", backupError);

      // Update backup as failed
      backup.status = 'failed';

      return res.status(500).json({
        success: false,
        message: "Failed to generate backup file"
      });
    }

  } catch (error) {
    console.error("Create backup error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * Download backup file
 */
const downloadBackup = async (req, res) => {
  try {
    const { id } = req.params;

    // Find backup in memory
    const backup = backups.find(b => b.id === id);

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup not found"
      });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: "Backup is not ready for download"
      });
    }

    try {
      // Generate backup content on-the-fly
      let fileContent = '';

      console.log(`Generating ${backup.format} backup for tables:`, backup.tables);

      if (backup.format === 'sql') {
        fileContent = await generateSQLBackupContent(backup.tables);
        console.log(`Generated ${backup.format} backup with ${fileContent.length} characters`);
      console.log(`First 200 characters:`, fileContent.substring(0, 200).replace(/\n/g, '\\n'));
      } else if (backup.format === 'csv') {
        fileContent = await generateCSVBackupContent(backup.tables);
        console.log(`Generated CSV backup with ${fileContent.length} characters`);
      }

      // Set headers for file download
      let fileName = backup.name.replace(/[^a-zA-Z0-9-_]/g, '_');

      if (backup.format === 'sql') {
        fileName += '.sql';
      } else if (backup.format === 'csv') {
        fileName += (backup.tables.length > 1 ? '_backup.csv' : '.csv');
      }

      console.log(`Sending ${backup.format} file: ${fileName} (${fileContent.length} bytes)`);

      // Set explicit headers to prevent compression and force download
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Encoding', 'identity');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Length', Buffer.byteLength(fileContent, 'utf8'));

      // Send the content directly
      res.send(fileContent);

    } catch (generateError) {
      console.error("Error generating backup content:", generateError);
      return res.status(500).json({
        success: false,
        message: "Error generating backup file"
      });
    }

  } catch (error) {
    console.error("Download backup error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * Delete backup
 */
const deleteBackup = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Attempting to delete backup with id: ${id}`);

    if (!id) {
      console.error("No backup ID provided");
      return res.status(400).json({
        success: false,
        message: "Backup ID is required"
      });
    }

    // Find backup in memory
    const backupIndex = backups.findIndex(b => b.id === id);
    console.log(`Backup index found: ${backupIndex}, total backups: ${backups.length}`);

    if (backupIndex === -1) {
      console.log(`Backup with id ${id} not found`);
      return res.status(404).json({
        success: false,
        message: "Backup not found"
      });
    }

    // Remove from in-memory storage
    const deletedBackup = backups.splice(backupIndex, 1);
    console.log(`Deleted backup: ${deletedBackup[0]?.name}`);

    return res.json({
      success: true,
      message: "Backup deleted successfully"
    });

  } catch (error) {
    console.error("Delete backup error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Server error occurred while deleting backup"
    });
  }
};

/**
 * Restore from backup
 */
const restoreBackup = async (req, res) => {
  try {
    const { id } = req.params;

    // Find backup in memory
    const backup = backups.find(b => b.id === id);

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: "Backup not found"
      });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: "Cannot restore from incomplete backup"
      });
    }

    // For now, just return success - actual restoration would be complex
    // In a real implementation, you'd need to:
    // 1. Parse the backup content
    // 2. Execute the SQL statements or import CSV data
    // 3. Handle potential conflicts and errors

    return res.json({
      success: true,
      message: "Backup restoration initiated. This feature is under development."
    });

  } catch (error) {
    console.error("Restore backup error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * Generate SQL backup content - automatically chooses method based on environment
 */
async function generateSQLBackupContent(tables) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;

  // Use manual generation for production/cloud environments
  if (isProduction || isRailway) {
    console.log('Production environment detected - using manual SQL generation');
    return await generateManualSQLBackupContent(tables);
  }

  // Try mysqldump for local development
  try {
    console.log('Development environment - attempting mysqldump...');
    return await generateMysqldumpBackupContent(tables);
  } catch (error) {
    console.log('mysqldump failed, falling back to manual generation:', error.message);
    return await generateManualSQLBackupContent(tables);
  }
}

/**
 * Generate SQL backup content using mysqldump (development only)
 */
async function generateMysqldumpBackupContent(tables) {
  // Get database connection details from environment
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'feedback_system';

  console.log(`Generating mysqldump for tables: ${tables.join(', ')}`);

  // Construct mysqldump command
  const tableArgs = tables.map(table => `\`${table}\``).join(' ');
  const dumpCommand = `mysqldump -h ${dbHost} -u ${dbUser} ${dbPassword ? `-p${dbPassword}` : ''} --single-transaction --quick --no-create-db --skip-comments ${dbName} ${tableArgs}`;

  console.log(`Executing mysqldump command (development mode)`);

  // Execute mysqldump
  const { stdout, stderr } = await execPromise(dumpCommand);

  if (stderr && !stderr.includes('Warning') && !stderr.includes('Using a password')) {
    console.error('mysqldump stderr:', stderr);
    throw new Error(`mysqldump failed: ${stderr}`);
  }

  // Add header comments
  let sqlContent = `-- FeedbACTS System Backup\n`;
  sqlContent += `-- Generated on ${new Date().toISOString()}\n`;
  sqlContent += `-- Database: ${dbName}\n`;
  sqlContent += `-- Tables: ${tables.join(', ')}\n`;
  sqlContent += `-- Generated using mysqldump (development)\n\n`;

  // Add USE statement
  sqlContent += `USE \`${dbName}\`;\n\n`;

  // Add the mysqldump output
  sqlContent += stdout;

  console.log(`mysqldump completed successfully, generated ${sqlContent.length} characters`);

  return sqlContent;
}

/**
 * Generate SQL backup content manually (production-safe approach)
 */
async function generateManualSQLBackupContent(tables) {
  try {
    const dbName = process.env.DB_NAME || 'feedback_system';
    let sqlContent = `-- FeedbACTS System Backup (Production Mode)\n`;
    sqlContent += `-- Generated on ${new Date().toISOString()}\n`;
    sqlContent += `-- Database: ${dbName}\n`;
    sqlContent += `-- Tables: ${tables.join(', ')}\n`;
    sqlContent += `-- Generated using Node.js manual generation\n\n`;

    sqlContent += `SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`;
    sqlContent += `SET AUTOCOMMIT = 0;\n`;
    sqlContent += `START TRANSACTION;\n\n`;
    sqlContent += `USE \`${dbName}\`;\n\n`;

    for (const tableName of tables) {
      try {
        console.log(`Processing table: ${tableName}`);

        // Get table structure first
        const structureQuery = `SHOW CREATE TABLE \`${tableName}\``;
        const structureResults = await new Promise((resolve, reject) => {
          db.query(structureQuery, (err, results) => {
            if (err) {
              console.error(`Error getting structure for ${tableName}:`, err);
              reject(err);
            } else {
              resolve(results);
            }
          });
        });

        sqlContent += `--\n`;
        sqlContent += `-- Table structure for table \`${tableName}\`\n`;
        sqlContent += `--\n\n`;
        sqlContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
        sqlContent += structureResults[0]['Create Table'] + ';\n\n';

        // Get table data in batches to handle large tables
        const countQuery = `SELECT COUNT(*) as total FROM \`${tableName}\``;
        const countResult = await new Promise((resolve, reject) => {
          db.query(countQuery, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });

        const totalRows = countResult[0].total;
        console.log(`Table ${tableName} has ${totalRows} rows`);

        if (totalRows > 0) {
          sqlContent += `--\n`;
          sqlContent += `-- Dumping data for table \`${tableName}\`\n`;
          sqlContent += `-- ${totalRows} rows\n`;
          sqlContent += `--\n\n`;

          // Process in batches of 1000 rows for memory efficiency
          const batchSize = 1000;
          let offset = 0;

          while (offset < totalRows) {
            const dataQuery = `SELECT * FROM \`${tableName}\` LIMIT ${batchSize} OFFSET ${offset}`;
            const dataResults = await new Promise((resolve, reject) => {
              db.query(dataQuery, (err, results) => {
                if (err) reject(err);
                else resolve(results);
              });
            });

            if (dataResults.length > 0) {
              // Get column names (only once per table)
              if (offset === 0) {
                const columns = Object.keys(dataResults[0]);
                const columnList = columns.map(col => `\`${col}\``).join(', ');
                sqlContent += `INSERT INTO \`${tableName}\` (${columnList}) VALUES\n`;
              }

              const values = dataResults.map(row => {
                const columns = Object.keys(row);
                const rowValues = columns.map(col => {
                  const value = row[col];
                  if (value === null) return 'NULL';
                  if (typeof value === 'string') {
                    // Escape single quotes, backslashes, and handle newlines
                    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}'`;
                  }
                  if (typeof value === 'boolean') return value ? '1' : '0';
                  if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
                  return String(value);
                });
                return `(${rowValues.join(', ')})`;
              });

              sqlContent += values.join(',\n') + ';\n';
            }

            offset += batchSize;
          }

          sqlContent += '\n';
        }

      } catch (tableError) {
        console.error(`Error processing table ${tableName}:`, tableError);
        // Continue with other tables but log the error
        sqlContent += `-- ERROR: Failed to backup table ${tableName}: ${tableError.message}\n\n`;
      }
    }

    sqlContent += `--\n`;
    sqlContent += `-- Commit transaction\n`;
    sqlContent += `--\n\n`;
    sqlContent += `COMMIT;\n`;

    console.log(`Manual SQL generation completed, generated ${sqlContent.length} characters`);

    return sqlContent;

  } catch (error) {
    console.error('Error generating manual SQL backup:', error);
    throw error;
  }
}

/**
 * Generate CSV backup content
 */
async function generateCSVBackupContent(tables) {
  try {
    let csvContent = `FeedbACTS System Backup\n`;
    csvContent += `Generated on ${new Date().toISOString()}\n`;
    csvContent += `Tables: ${tables.join(', ')}\n\n`;

    for (const tableName of tables) {
      try {
        const dataQuery = `SELECT * FROM \`${tableName}\``;
        const results = await new Promise((resolve, reject) => {
          db.query(dataQuery, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });

        if (results.length > 0) {
          csvContent += `=== TABLE: ${tableName} ===\n`;
          csvContent += convertToCSV(results) + '\n\n';
        }

      } catch (tableError) {
        console.error(`Error processing table ${tableName} for CSV:`, tableError);
        // Continue with other tables
      }
    }

    return csvContent;

  } catch (error) {
    console.error('Error generating CSV backup:', error);
    throw error;
  }
}

/**
 * Convert array of objects to CSV string
 */
function convertToCSV(data) {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.map(header => `"${header.replace(/"/g, '""')}"`).join(','));

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null) return 'NULL';

      let stringValue = String(value);

      // Escape double quotes and wrap in quotes if contains comma, newline, or quote
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r') || stringValue.includes('"')) {
        stringValue = `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

module.exports = {
  getAllBackups,
  createBackup,
  downloadBackup,
  deleteBackup,
  restoreBackup,
  generateSQLBackupContent,
  generateCSVBackupContent
};