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

console.log('DB Config:', dbConfig);

// Create connection without database first
const tempConnection = mysql.createConnection({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  port: dbConfig.port,
});

// Create connection with database
const connection = mysql.createConnection(dbConfig);

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to MySQL server...');
    await new Promise((resolve, reject) => {
      tempConnection.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Connected to MySQL server successfully');

    // Create database if it doesn't exist
    console.log('📦 Creating database if not exists...');
    await new Promise((resolve, reject) => {
      tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    console.log('✅ Database created/verified');

    tempConnection.end();

    console.log('🔄 Connecting to database...');
    await new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('✅ Connected to database successfully');

    // Create Users table first
    console.log('👤 Creating Users table...');
    await new Promise((resolve, reject) => {
      connection.query(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        role ENUM('admin', 'student', 'alumni', 'employer', 'instructor') NOT NULL,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
        INDEX idx_email (email),
        INDEX idx_role (role)
      )`, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    console.log('✅ Users table created');

    // Read and execute user schema
    console.log('👥 Creating user profile tables...');
    const userSchemaPath = path.join(__dirname, 'user-schema.sql');
    let userSchema = '';
    try {
      userSchema = fs.readFileSync(userSchemaPath, 'utf8');
    } catch (err) {
      console.error('❌ Error reading user-schema.sql:', err.message);
      throw err;
    }
    const userStatements = userSchema.split(';').filter(stmt => stmt.trim() && stmt.includes('CREATE TABLE'));
    console.log(`Found ${userStatements.length} statements to execute`);
    for (const statement of userStatements) {
      if (statement.trim()) {
        console.log('Executing user schema:', statement.substring(0, 100) + '...');
        await new Promise((resolve, reject) => {
          connection.query(statement, (err, results) => {
            if (err && !err.message.includes('already exists')) {
              console.error('❌ Error executing user schema statement:', err.message);
              reject(err);
            } else {
              if (err) {
                console.log('Ignored error:', err.message);
              }
              resolve(results);
            }
          });
        });
      }
    }
    console.log('✅ User profile tables created');

    // Add image column if not exists
    console.log('🖼️ Adding image columns...');
    for (const table of ['students', 'alumni', 'employers', 'instructors']) {
      await new Promise((resolve, reject) => {
        connection.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS image VARCHAR(500)`, (err, results) => {
          if (err && !err.message.includes('Duplicate column name')) {
            console.error('Error altering table:', err.message);
            reject(err);
          } else {
            resolve(results);
          }
        });
      });
    }
    console.log('✅ Image columns added');


    // Create Forms table
    console.log('📝 Creating Forms table...');
    await new Promise((resolve, reject) => {
      connection.query(`CREATE TABLE IF NOT EXISTS Forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) NOT NULL,
        target_audience VARCHAR(100) NOT NULL,
        status ENUM('draft', 'active', 'inactive', 'archived') NOT NULL DEFAULT 'draft',
        image_url VARCHAR(500),
        is_template BOOLEAN NOT NULL DEFAULT FALSE,
        start_date DATE,
        end_date DATE,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        submission_count INT DEFAULT 0,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_category (category),
        INDEX idx_target_audience (target_audience),
        INDEX idx_status (status),
        INDEX idx_is_template (is_template),
        INDEX idx_created_by (created_by),
        INDEX idx_dates (start_date, end_date)
      )`, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    console.log('✅ Forms table created');

    // Read and execute schema
    console.log('📋 Creating database tables...');
    const schemaPath = path.join(__dirname, 'forms-schema.sql');
    let schema = '';
    try {
      schema = fs.readFileSync(schemaPath, 'utf8');
    } catch (err) {
      console.log('⚠️ forms-schema.sql not found, skipping additional table creation');
    }

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
             console.log('Executing:', statement.substring(0, 100) + '...');
             await new Promise((resolve, reject) => {
               connection.query(statement, (err, results) => {
                 if (err && !err.message.includes('already exists') && !err.message.includes('Duplicate entry')) {
                   console.error('❌ Error executing statement:', err.message);
                   console.error('Statement:', statement.substring(0, 200) + '...');
                   reject(err);
                 } else {
                   if (err) {
                     console.log('Ignored error:', err.message);
                   }
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
        `INSERT INTO users (email, password_hash, full_name, role, status)
         VALUES (?, ?, ?, ?, 'active')
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
        'SELECT id FROM users WHERE email = ?',
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

    // Create sample users
    console.log('👤 Creating sample users...');
    const sampleUsers = [
      { email: 'student@acts.edu', password: 'student123', full_name: 'John Doe', role: 'student', profile: { table: 'students', data: { studentID: 'STU001', course_yr_section: '2023-A', contact_number: '123-456-7890', subjects: 'Computer Science', image: null } } },
      { email: 'alumni@acts.edu', password: 'alumni123', full_name: 'Jane Smith', role: 'alumni', profile: { table: 'alumni', data: { grad_year: 2020, degree: 'BSc Computer Science', jobtitle: 'Software Engineer', contact: '987-654-3210', company: 'Tech Innovations', image: null } } },
      { email: 'employer@acts.edu', password: 'employer123', full_name: 'Bob Johnson', role: 'employer', profile: { table: 'employers', data: { companyname: 'Global Solutions Inc.', industry: 'Consulting', location: 'New York', contact: '555-123-4567', image: null } } },
      { email: 'instructor@acts.edu', password: 'instructor123', full_name: 'Dr. Alice Brown', role: 'instructor', profile: { table: 'instructors', data: { instructor_id: 'INS001', department: 'Computer Science', subject_taught: 'Introduction to Programming, Data Structures and Algorithms, Database Systems', image: null } } }
    ];

    for (const user of sampleUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      await new Promise((resolve, reject) => {
        connection.query(
          `INSERT INTO users (email, password_hash, full_name, role, status)
           VALUES (?, ?, ?, ?, 'active')
           ON DUPLICATE KEY UPDATE email = VALUES(email)`,
          [user.email, hashedPassword, user.full_name, user.role],
          (err, results) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
      });
      // Get user ID
      const userRecord = await new Promise((resolve, reject) => {
        connection.query('SELECT id FROM users WHERE email = ?', [user.email], (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        });
      });
      // Insert profile
      const profileData = { ...user.profile.data, user_id: userRecord.id };
      const columns = Object.keys(profileData).join(', ');
      const placeholders = Object.keys(profileData).map(() => '?').join(', ');
      const values = Object.values(profileData);
      await new Promise((resolve, reject) => {
        connection.query(
          `INSERT INTO ${user.profile.table} (${columns}) VALUES (${placeholders})
           ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
          values,
          (err, results) => {
            if (err && !err.message.includes('Duplicate entry')) {
              console.error(`Error inserting profile for ${user.email}:`, err.message);
              reject(err);
            } else {
              if (err) {
                console.log('Ignored duplicate profile error for', user.email);
              }
              resolve(results);
            }
          }
        );
      });
    }
    console.log('✅ Sample users created');

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
    console.log('4. Sample logins:');
    console.log('   - Student: student@acts.edu / student123');
    console.log('   - Alumni: alumni@acts.edu / alumni123');
    console.log('   - Employer: employer@acts.edu / employer123');
    console.log('   - Instructor: instructor@acts.edu / instructor123');
    console.log('5. Create and deploy feedback forms');
    console.log('6. Test form submissions from student accounts');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    connection.end();
  }
}

// Run setup
setupDatabase();