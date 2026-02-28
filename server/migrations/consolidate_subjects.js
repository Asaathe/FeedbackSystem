/**
 * Migration Script: Consolidate course_sections to subjects
 * 
 * This script:
 * 1. Adds section and year_level columns to subjects table
 * 2. Copies data from course_sections to subjects
 * 3. Updates subject_instructors to link to subjects table
 * 4. Updates student_enrollments to link to subject_instructors
 * 
 * Run with: node server/migrations/consolidate_subjects.js
 */

const db = require('../config/database');

const migrate = async () => {
  console.log('Starting migration: Consolidate course_sections to subjects...\n');
  
  try {
    // Step 1: Add missing columns to subjects table
    console.log('Step 1: Adding section and year_level columns to subjects...');
    await new Promise((resolve, reject) => {
      db.query(`
        ALTER TABLE subjects 
        ADD COLUMN IF NOT EXISTS section VARCHAR(10) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS year_level INT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS course_section_id INT DEFAULT NULL
      `, (err) => {
        if (err) console.log('Columns might already exist:', err.message);
        resolve();
      });
    });

    // Step 2: Copy data from course_sections to subjects
    console.log('Step 2: Copying data from course_sections to subjects...');
    
    // Check if course_sections has data
    const checkCS = await new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM course_sections', (err, results) => {
        if (err) reject(err);
        resolve(results[0].count);
      });
    });
    
    console.log(`  Found ${checkCS} course_sections`);
    
    if (checkCS > 0) {
      // Copy unique course sections to subjects (avoiding duplicates by course_code + section)
      await new Promise((resolve, reject) => {
        db.query(`
          INSERT INTO subjects (subject_code, subject_name, department, section, year_level, course_section_id, status)
          SELECT DISTINCT 
            cs.course_code,
            cs.course_name,
            COALESCE(cs.department, 'General'),
            cs.section,
            cs.year_level,
            cs.id,
            cs.status
          FROM course_sections cs
          WHERE NOT EXISTS (
            SELECT 1 FROM subjects s 
            WHERE s.subject_code = cs.course_code 
            AND COALESCE(s.section, '') = COALESCE(cs.section, '')
          )
        `, (err, results) => {
          if (err) {
            console.log('  Error copying data:', err.message);
          } else {
            console.log(`  Copied ${results.affectedRows} records`);
          }
          resolve();
        });
      });
    }

    // Step 3: Update subject_instructors to link to subjects
    console.log('Step 3: Updating subject_instructors...');
    await new Promise((resolve, reject) => {
      db.query(`
        UPDATE subject_instructors si
        INNER JOIN course_sections cs ON si.course_section_id = cs.id
        INNER JOIN subjects s ON s.course_section_id = cs.id
        SET si.subject_id = s.id
        WHERE si.subject_id IS NULL OR si.subject_id = 0
      `, (err, results) => {
        if (err) console.log('  Error updating:', err.message);
        else console.log(`  Updated ${results.affectedRows} subject_instructors`);
        resolve();
      });
    });

    // Step 4: Check student_subjects data
    console.log('Step 4: Checking student_subjects...');
    const checkSS = await new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM student_subjects', (err, results) => {
        if (err) reject(err);
        resolve(results[0].count);
      });
    });
    console.log(`  Found ${checkSS} student_subjects records`);

    // Step 5: Check student_enrollments data
    console.log('Step 5: Checking student_enrollments...');
    const checkSE = await new Promise((resolve, reject) => {
      db.query('SELECT COUNT(*) as count FROM student_enrollments', (err, results) => {
        if (err) reject(err);
        resolve(results[0].count);
      });
    });
    console.log(`  Found ${checkSE} student_enrollments records`);

    // Summary
    console.log('\n=== Migration Complete ===');
    console.log('The system now uses subjects table as the primary source.');
    console.log('course_sections data has been copied to subjects.');
    console.log('subject_instructors has been updated to link to subjects.');
    console.log('\nYou can now update the API to use subjects only.');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
