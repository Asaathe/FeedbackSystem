// Database Setup Script for FeedbACTS System
// This script initializes the database with required tables and sample data

const mysql = require('mysql');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'feedback_system',
  port: process.env.DB_PORT || 3306,
};

// Create connection
const connection = mysql.createConnection(dbConfig);

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to database...');
    await new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Connected to database successfully');

    // Read and execute schema
    console.log('📋 Creating database tables...');
    const schemaPath = path.join(__dirname, 'forms-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split schema by DELIMITER blocks to handle stored procedures properly
    const schemaParts = schema.split(/DELIMITER\s+([^*]+)/);
    
    for (let i = 0; i < schemaParts.length; i++) {
      const part = schemaParts[i].trim();
      if (!part || part.startsWith('--')) continue;
      
      // Check if this is a delimiter change or a SQL statement
      if (i % 2 === 1) {
        // This is a delimiter (// or ;)
        continue;
      } else {
        // This is a SQL statement or procedure
        const statements = part.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'));
        
        for (const statement of statements) {
          if (statement.trim()) {
            await new Promise((resolve, reject) => {
              connection.query(statement, (err, results) => {
                if (err && !err.message.includes('already exists') && !err.message.includes('Duplicate entry')) {
                  console.error('❌ Error executing statement:', err.message);
                  console.error('Statement:', statement.substring(0, 200) + '...');
                  reject(err);
                } else {
                  resolve(results);
                }
              });
            });
          }
        }
      }
    }
    console.log('✅ Database tables created successfully');

    // Create admin user
    console.log('👤 Creating admin user...');
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    await new Promise((resolve, reject) => {
      connection.query(
        `INSERT INTO Users (email, password_hash, full_name, role, status, created_at) 
         VALUES (?, ?, ?, ?, 'active', NOW())
         ON DUPLICATE KEY UPDATE email = VALUES(email)`,
        ['admin@acts.edu', adminPassword, 'System Administrator', 'admin'],
        (err, results) => {
          if (err) reject(err);
          else {
            console.log('✅ Admin user created/updated');
            resolve(results);
          }
        }
      );
    });

    // Get admin user ID
    console.log('🔍 Getting admin user ID...');
    const adminUser = await new Promise((resolve, reject) => {
      connection.query(
        'SELECT id FROM Users WHERE email = ?',
        ['admin@acts.edu'],
        (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        }
      );
    });

    if (!adminUser || !adminUser.id) {
      throw new Error('Failed to get admin user ID');
    }
    console.log('✅ Admin user ID:', adminUser.id);

    // Create sample form
    console.log('📝 Creating sample feedback form...');
    await new Promise((resolve, reject) => {
      connection.query(
        `INSERT INTO Forms (title, description, category, target_audience, status, is_template, created_by) 
         VALUES (?, ?, ?, ?, 'active', TRUE, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title)`,
        [
          'Student Course Evaluation',
          'Please evaluate your instructor and course experience',
          'Academic',
          'Students',
          adminUser.id
        ],
        (err, results) => {
          if (err) reject(err);
          else {
            console.log('✅ Sample form created');
            resolve(results);
          }
        }
      );
    });

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Start the client: npm run dev (in CLIENT directory)');
    console.log('3. Login with admin@acts.edu / admin123');
    console.log('4. Create and deploy feedback forms');
    console.log('5. Test form submissions from student accounts');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    connection.end();
  }
}

// Run setup
setupDatabase();