// Student Promotion Service
const db = require("../config/database");
const { queryDatabase, queryDatabaseTransaction } = require("../utils/helpers");

/**
 * Get students eligible for promotion based on current program
 * @param {object} filters - Optional filters
 * @returns {Promise<object>} List of eligible students
 */
const getEligibleStudents = async (filters = {}) => {
  try {
    const { department, programCode, yearLevel, section, courseSection } = filters;
    
    let query = `
      SELECT
        u.id as user_id,
        u.email,
        u.full_name,
        u.status as user_status,
        s.id as student_id,
        s.studentID,
        s.image as profile_image,
        s.program_id,
        s.academic_year,
        s.promotion_date,
        cm.program_name,
        cm.program_code,
        cm.year_level,
        cm.section,
        cm.course_section,
        cm.department,
        cm.status as program_status
      FROM users u
      INNER JOIN students s ON u.id = s.user_id
      INNER JOIN course_management cm ON s.program_id = cm.id
      WHERE u.role = 'student'
        AND u.status = 'active'
        AND cm.status = 'active'
    `;
    
    const params = [];
    
    if (courseSection) {
      query += ' AND cm.course_section = ?';
      params.push(courseSection);
    }
    if (department) {
      query += ' AND cm.department = ?';
      params.push(department);
    }
    if (programCode) {
      query += ' AND cm.program_code = ?';
      params.push(programCode);
    }
    if (yearLevel) {
      query += ' AND cm.year_level = ?';
      params.push(parseInt(yearLevel));
    }
    if (section) {
      query += ' AND cm.section = ?';
      params.push(section);
    }
    
    query += ' ORDER BY cm.department, cm.program_code, cm.year_level, cm.section, u.full_name';
    
    const students = await queryDatabase(db, query, params);
    return {
      success: true,
      students: students,
      count: students.length
    };
  } catch (error) {
    console.error("Get eligible students error:", error);
    throw error;
  }
};

/**
 * Get available target programs for promotion
 * @param {number} currentProgramId - Current program ID
 * @returns {Promise<object>} Available target programs
 */
const getTargetPrograms = async (currentProgramId) => {
  try {
    // Get current program details
    const currentProgramQuery = 'SELECT * FROM course_management WHERE id = ?';
    const currentPrograms = await queryDatabase(db, currentProgramQuery, [currentProgramId]);
    
    if (currentPrograms.length === 0) {
      return {
        success: false,
        message: "Current program not found",
        programs: []
      };
    }
    
    const currentProgram = currentPrograms[0];
    
    // Calculate target year level
    let targetYearLevel = currentProgram.year_level + 1;
    
    // Handle Senior High (11, 12) to College transition
    if (currentProgram.year_level === 12) {
      targetYearLevel = 1; // Move to first year College
    }
    
    // For College, max year is 4
    if (currentProgram.department === 'College' && targetYearLevel > 4) {
      // Cannot promote beyond year 4 - this would be graduation
      return {
        success: true,
        programs: [],
        message: "Students are at final year - consider graduation instead"
      };
    }
    
    // Find matching programs at target year level
    const targetQuery = `
      SELECT * FROM course_management 
      WHERE department = ? 
        AND program_code = ?
        AND year_level = ?
        AND status = 'active'
      ORDER BY section
    `;
    
    const targetPrograms = await queryDatabase(db, targetQuery, [
      currentProgram.department,
      currentProgram.program_code,
      targetYearLevel
    ]);
    
    // If no exact match, get all programs at target year
    if (targetPrograms.length === 0) {
      const allTargetQuery = `
        SELECT * FROM course_management 
        WHERE department = ? 
          AND year_level = ?
          AND status = 'active'
        ORDER BY program_code, section
      `;
      
      const allTargets = await queryDatabase(db, allTargetQuery, [
        currentProgram.department,
        targetYearLevel
      ]);
      
      return {
        success: true,
        programs: allTargets,
        currentProgram: currentProgram
      };
    }
    
    return {
      success: true,
      programs: targetPrograms,
      currentProgram: currentProgram
    };
  } catch (error) {
    console.error("Get target programs error:", error);
    throw error;
  }
};

/**
 * Promote students to a new program/year
 * @param {Array} studentIds - Array of student IDs to promote
 * @ newProgramId -param {number} Target program ID
 * @param {number} promotedBy - Admin user ID performing the promotion
 * @param {string} notes - Optional notes
 * @returns {Promise<object>} Promotion result
 */
const promoteStudents = async (studentIds, newProgramId, promotedBy, notes = '') => {
  try {
    // Get new program details
    const newProgramResult = await queryDatabase(db, 'SELECT * FROM course_management WHERE id = ?', [newProgramId]);
    
    if (newProgramResult.length === 0) {
      throw new Error("Target program not found");
    }
    
    const newProgram = newProgramResult[0];
    const promotedStudents = [];
    const errors = [];
    
    for (const studentId of studentIds) {
      try {
        // Get current student data with user status and role
        const students = await queryDatabase(
          db,
          `SELECT s.*, u.id as user_id, u.status as user_status, u.role as user_role 
           FROM students s 
           INNER JOIN users u ON s.user_id = u.id 
           WHERE s.id = ?`,
          [studentId]
        );
        
        if (students.length === 0) {
          errors.push({ studentId, error: "Student not found" });
          continue;
        }
        
        const student = students[0];
        const previousProgramId = student.program_id;
        
        // VALIDATION 1: Check if student is active
        if (student.user_status !== 'active') {
          errors.push({ studentId, error: `Cannot promote inactive student (ID: ${studentId})` });
          continue;
        }
        
        // VALIDATION 2: Check if student is alumni (already graduated)
        if (student.user_role === 'alumni') {
          errors.push({ studentId, error: `Cannot promote alumni student (ID: ${studentId}) - Already graduated` });
          continue;
        }
        
        // VALIDATION 3: Check for duplicate promotion in current academic year
        const currentYear = new Date().getFullYear();
        const duplicateCheckQuery = `
          SELECT COUNT(*) as count FROM student_promotion_history 
          WHERE student_id = ? 
            AND promotion_type = 'academic_year'
            AND YEAR(promotion_date) = ?
        `;
        const duplicateCheck = await queryDatabase(db, duplicateCheckQuery, [studentId, currentYear]);
        
        if (duplicateCheck[0].count > 0) {
          errors.push({ studentId, error: `Student (ID: ${studentId}) has already been promoted in ${currentYear}` });
          continue;
        }
        
        // Update student program
        await queryDatabase(
          db,
          'UPDATE students SET program_id = ?, previous_program_id = ?, academic_year = ?, promotion_date = CURDATE() WHERE id = ?',
          [newProgramId, previousProgramId, newProgram.year_level, studentId]
        );
        
        // Insert promotion history
        await queryDatabase(
          db,
          `INSERT INTO student_promotion_history 
           (student_id, user_id, previous_program_id, new_program_id, promotion_type, promotion_date, promoted_by, notes) 
           VALUES (?, ?, ?, ?, 'academic_year', CURDATE(), ?, ?)`,
          [studentId, student.user_id, previousProgramId, newProgramId, promotedBy, notes]
        );
        
        promotedStudents.push({
          studentId,
          userId: student.user_id,
          previousProgramId,
          newProgramId
        });
        
      } catch (studentError) {
        errors.push({ studentId, error: studentError.message });
      }
    }
    
    return {
      success: true,
      promoted: promotedStudents.length,
      errors: errors,
      details: promotedStudents
    };
    
  } catch (error) {
    console.error("Promote students error:", error);
    throw error;
  }
};

/**
 * Graduate students (convert to alumni)
 * @param {Array} studentIds - Array of student IDs to graduate
 * @param {number} graduationYear - Year of graduation
 * @param {number} promotedBy - Admin user ID
 * @param {object} graduationData - Additional graduation data
 * @returns {Promise<object>} Graduation result
 */
const graduateStudents = async (studentIds, graduationYear, promotedBy, graduationData = {}) => {
  try {
    const graduatedStudents = [];
    const errors = [];
    
    for (const studentId of studentIds) {
      try {
        // Get current student data with user status and role
        const students = await queryDatabase(
          db,
          `SELECT s.*, u.id as user_id, u.full_name, u.email, u.status as user_status, u.role as user_role 
           FROM students s 
           INNER JOIN users u ON s.user_id = u.id 
           WHERE s.id = ?`,
          [studentId]
        );
        
        if (students.length === 0) {
          errors.push({ studentId, error: "Student not found" });
          continue;
        }
        
        const student = students[0];
        
        // VALIDATION 1: Check if student is active
        if (student.user_status !== 'active') {
          errors.push({ studentId, error: `Cannot graduate inactive student (ID: ${studentId})` });
          continue;
        }
        
        // VALIDATION 2: Check if student is already an alumni
        if (student.user_role === 'alumni') {
          errors.push({ studentId, error: `Student (ID: ${studentId}) is already an alumni - Cannot graduate again` });
          continue;
        }
        
        // VALIDATION 3: Check for duplicate graduation
        const duplicateGradCheck = await queryDatabase(
          db,
          `SELECT COUNT(*) as count FROM graduation_records WHERE student_id = ? AND graduation_year = ?`,
          [studentId, graduationYear]
        );
        
        if (duplicateGradCheck[0].count > 0) {
          errors.push({ studentId, error: `Student (ID: ${studentId}) has already graduated in ${graduationYear}` });
          continue;
        }
        
        // Insert into graduation_records
        await queryDatabase(
          db,
          `INSERT INTO graduation_records 
           (student_id, user_id, program_id, graduation_year, degree, honors, ceremony_date) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            studentId,
            student.user_id,
            student.program_id,
            graduationYear,
            graduationData.degree || null,
            graduationData.honors || null,
            graduationData.ceremonyDate || null
          ]
        );
        
        // Insert into alumni table
        await queryDatabase(
          db,
          `INSERT INTO alumni (user_id, grad_year, degree, jobtitle, contact, image) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            student.user_id,
            graduationYear,
            graduationData.degree || null,
            graduationData.jobtitle || null,
            student.contact_number || null,
            student.image || null
          ]
        );
        
        // Update user role to alumni
        await queryDatabase(
          db,
          "UPDATE users SET role = 'alumni' WHERE id = ?",
          [student.user_id]
        );
        
        // Create employment tracking record for the new alumni
        // Use graduationDate if provided, otherwise default to current date
        const empGradDate = graduationData.graduationDate || new Date().toISOString().split('T')[0];
        await queryDatabase(
          db,
          `INSERT INTO alumni_employment (alumni_user_id, update_status, created_at, graduation_date) 
           VALUES (?, 'pending', NOW(), ?)`,
          [student.user_id, empGradDate]
        );
        
        // Insert promotion history as graduation type
        await queryDatabase(
          db,
          `INSERT INTO student_promotion_history 
           (student_id, user_id, previous_program_id, new_program_id, promotion_type, promotion_date, promoted_by, notes) 
           VALUES (?, ?, ?, NULL, 'graduation', CURDATE(), ?, ?)`,
          [studentId, student.user_id, student.program_id, promotedBy, graduationData.notes || 'Graduated']
        );
        
        // Update student record to mark as graduated
        await queryDatabase(
          db,
          'UPDATE students SET program_id = NULL, academic_year = NULL, promotion_date = CURDATE() WHERE id = ?',
          [studentId]
        );
        
        graduatedStudents.push({
          studentId,
          userId: student.user_id,
          name: student.full_name,
          email: student.email
        });
        
      } catch (studentError) {
        errors.push({ studentId, error: studentError.message });
      }
    }
    
    return {
      success: true,
      graduated: graduatedStudents.length,
      errors: errors,
      details: graduatedStudents
    };
    
  } catch (error) {
    console.error("Graduate students error:", error);
    throw error;
  }
};

/**
 * Get promotion history
 * @param {object} filters - Optional filters
 * @returns {Promise<object>} Promotion history
 */
const getPromotionHistory = async (filters = {}) => {
  try {
    const { studentId, userId, promotionType, startDate, endDate, limit = 50, offset = 0 } = filters;
    
    let query = `
      SELECT 
        sph.id,
        sph.student_id,
        COALESCE(u.full_name, 'Unknown') as student_name,
        COALESCE(u.email, '') as student_email,
        COALESCE(s.studentID, '') as studentID,
        sph.promotion_type,
        sph.promotion_date,
        sph.notes,
        sph.created_at,
        COALESCE(cm_old.program_code, '') as old_program_code,
        COALESCE(cm_old.year_level, 0) as old_year_level,
        COALESCE(cm_old.section, '') as old_section,
        COALESCE(cm_new.program_code, '') as new_program_code,
        COALESCE(cm_new.year_level, 0) as new_year_level,
        COALESCE(cm_new.section, '') as new_section,
        COALESCE(promoter.full_name, 'Unknown') as promoted_by_name
      FROM student_promotion_history sph
      LEFT JOIN users u ON sph.user_id = u.id
      LEFT JOIN students s ON sph.student_id = s.id
      LEFT JOIN course_management cm_old ON sph.previous_program_id = cm_old.id
      LEFT JOIN course_management cm_new ON sph.new_program_id = cm_new.id
      LEFT JOIN users promoter ON sph.promoted_by = promoter.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (studentId) {
      query += ' AND sph.student_id = ?';
      params.push(studentId);
    }
    if (userId) {
      query += ' AND sph.user_id = ?';
      params.push(userId);
    }
    if (promotionType) {
      query += ' AND sph.promotion_type = ?';
      params.push(promotionType);
    }
    if (startDate) {
      query += ' AND sph.promotion_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND sph.promotion_date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY sph.promotion_date DESC, sph.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const history = await queryDatabase(db, query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM student_promotion_history sph
      WHERE 1=1
    `;
    const countParams = [];
    
    if (studentId) {
      countQuery += ' AND sph.student_id = ?';
      countParams.push(studentId);
    }
    if (promotionType) {
      countQuery += ' AND sph.promotion_type = ?';
      countParams.push(promotionType);
    }
    
    const countResult = await queryDatabase(db, countQuery, countParams);
    
    return {
      success: true,
      history: history,
      count: history.length,
      total: countResult[0].total
    };
  } catch (error) {
    console.error("Get promotion history error:", error);
    throw error;
  }
};

/**
 * Get all programs for admin selection
 * @returns {Promise<object>} All programs
 */
const getAllPrograms = async () => {
  try {
    const query = `
      SELECT * FROM course_management 
      WHERE status = 'active'
      ORDER BY department, program_code, year_level, section
    `;
    
    const programs = await queryDatabase(db, query, []);
    
    // Group by department
    const grouped = programs.reduce((acc, program) => {
      if (!acc[program.department]) {
        acc[program.department] = {};
      }
      if (!acc[program.department][program.program_code]) {
        acc[program.department][program.program_code] = [];
      }
      acc[program.department][program.program_code].push(program);
      return acc;
    }, {});
    
    return {
      success: true,
      programs: programs,
      grouped: grouped
    };
  } catch (error) {
    console.error("Get all programs error:", error);
    throw error;
  }
};

/**
 * Preview promotion - validate and show what will happen before actual promotion
 * @param {Array} studentIds - Array of student IDs to preview
 * @param {number} newProgramId - Target program ID
 * @returns {Promise<object>} Preview with warnings and validation results
 */
const previewPromotion = async (studentIds, newProgramId) => {
  try {
    // Get target program details
    const targetProgramResult = await queryDatabase(db, 'SELECT * FROM course_management WHERE id = ?', [newProgramId]);
    
    if (targetProgramResult.length === 0) {
      return {
        success: false,
        message: "Target program not found",
        students: [],
        warnings: [],
        errors: []
      };
    }
    
    const targetProgram = targetProgramResult[0];
    const studentPreviews = [];
    const warnings = [];
    const errors = [];
    const currentYear = new Date().getFullYear();
    
    for (const studentId of studentIds) {
      const studentData = await queryDatabase(
        db,
        `SELECT s.*, u.id as user_id, u.full_name, u.email, u.status as user_status, u.role as user_role,
                cm.program_code, cm.program_name, cm.year_level, cm.section, cm.course_section
         FROM students s 
         INNER JOIN users u ON s.user_id = u.id 
         LEFT JOIN course_management cm ON s.program_id = cm.id
         WHERE s.id = ?`,
        [studentId]
      );
      
      if (studentData.length === 0) {
        errors.push({ studentId, error: "Student not found" });
        continue;
      }
      
      const student = studentData[0];
      const preview = {
        studentId,
        studentName: student.full_name,
        studentEmail: student.email,
        currentProgram: student.program_code ? `${student.program_code} - Year ${student.year_level} (${student.section})` : "N/A",
        currentYearLevel: student.year_level,
        targetProgram: `${targetProgram.program_code} - Year ${targetProgram.year_level} (${targetProgram.section})`,
        targetYearLevel: targetProgram.year_level,
        targetSection: targetProgram.section,
        warnings: [],
        canPromote: true,
        blockReason: null
      };
      
      // Validation 1: Check if student is active
      if (student.user_status !== 'active') {
        preview.canPromote = false;
        preview.blockReason = "Student is inactive";
        preview.warnings.push("⚠ Student account is inactive");
      }
      
      // Validation 2: Check if student is alumni
      if (student.user_role === 'alumni') {
        preview.canPromote = false;
        preview.blockReason = "Student is already an alumni";
        preview.warnings.push("⚠ Student has already graduated (alumni)");
      }
      
      // Validation 3: Check for duplicate promotion this year
      const dupCheck = await queryDatabase(
        db,
        `SELECT COUNT(*) as count FROM student_promotion_history 
         WHERE student_id = ? AND promotion_type = 'academic_year' AND YEAR(promotion_date) = ?`,
        [studentId, currentYear]
      );
      if (dupCheck[0].count > 0) {
        preview.canPromote = false;
        preview.blockReason = "Already promoted this year";
        preview.warnings.push(`⚠ Student was already promoted in ${currentYear}`);
      }
      
      // BLOCKING: Same section check - cannot promote to same exact program/section
      if (student.program_id === newProgramId) {
        preview.canPromote = false;
        preview.blockReason = "Already in target section";
        preview.warnings.push("⚠ Student is already in the target program/section - cannot promote to same section");
      }
      
      // Warning 2: Year level mismatch (e.g., Year 4 → Year 1 or backwards)
      if (targetProgram.year_level < student.year_level) {
        preview.warnings.push("⚠ Target year is lower than current year (demotion)");
      }
      
      // Warning 3: Large year jump (more than 1 year)
      if (Math.abs(targetProgram.year_level - student.year_level) > 1) {
        preview.warnings.push("⚠ Large year level jump (more than 1 year)");
      }
      
      // Warning 4: Department mismatch
      if (student.program_code && !targetProgram.program_code.startsWith(student.program_code.substring(0, 3))) {
        preview.warnings.push("⚠ Target program is in different department");
      }
      
      // Warning 5: Check if target section already has many students (capacity warning)
      const sectionCount = await queryDatabase(
        db,
        `SELECT COUNT(*) as count FROM students s 
         INNER JOIN course_management cm ON s.program_id = cm.id 
         WHERE cm.id = ?`,
        [newProgramId]
      );
      if (sectionCount[0].count >= 50) {
        preview.warnings.push("⚠ Target section may be at capacity");
      }
      
      studentPreviews.push(preview);
    }
    
    // Summary warnings
    const blockedCount = studentPreviews.filter(s => !s.canPromote).length;
    const warningCount = studentPreviews.filter(s => s.warnings.length > 0 && s.canPromote).length;
    
    if (blockedCount > 0) {
      warnings.push(`${blockedCount} student(s) cannot be promoted due to blocking issues`);
    }
    if (warningCount > 0) {
      warnings.push(`${warningCount} student(s) have warnings that should be reviewed`);
    }
    
    return {
      success: true,
      targetProgram: {
        id: targetProgram.id,
        programCode: targetProgram.program_code,
        programName: targetProgram.program_name,
        yearLevel: targetProgram.year_level,
        section: targetProgram.section,
        courseSection: targetProgram.course_section
      },
      students: studentPreviews,
      summary: {
        total: studentPreviews.length,
        canPromote: studentPreviews.filter(s => s.canPromote).length,
        blocked: blockedCount,
        withWarnings: warningCount
      },
      warnings: warnings,
      errors: errors
    };
    
  } catch (error) {
    console.error("Preview promotion error:", error);
    throw error;
  }
};

/**
 * Undo a promotion - revert student to previous program
 * @param {number} historyId - The promotion history ID to undo
 * @param {number} studentId - The student ID
 * @param {number} undoneBy - Admin user ID performing the undo
 * @returns {Promise<object>} Undo result
 */
const undoPromotion = async (historyId, studentId, undoneBy) => {
  try {
    // Get the promotion history record
    const historyQuery = `
      SELECT sph.*, s.program_id as current_program_id
      FROM student_promotion_history sph
      INNER JOIN students s ON sph.student_id = s.id
      WHERE sph.id = ? AND sph.student_id = ?
    `;
    
    const historyRecords = await queryDatabase(db, historyQuery, [historyId, studentId]);
    
    if (historyRecords.length === 0) {
      return {
        success: false,
        message: "Promotion history not found"
      };
    }
    
    const historyRecord = historyRecords[0];
    
    // Get the previous program ID from history, not from current students table
    const previousProgramId = historyRecord.previous_program_id;
    
    // Check if this is a graduation undo
    if (historyRecord.promotion_type === 'graduation') {
      console.log('Starting graduation undo for studentId:', studentId, 'historyId:', historyId);

      // For graduation, we need to:
      // 1. Change user role back from 'alumni' to 'student'
      // 2. Delete the alumni record
      // 3. Restore the student's program

      // Get the student info
      const studentQuery = `SELECT * FROM students WHERE id = ?`;
      const students = await queryDatabase(db, studentQuery, [studentId]);
      console.log('Found students:', students.length);

      if (students.length === 0) {
        return {
          success: false,
          message: "Student not found"
        };
      }

      const student = students[0];
      console.log('Student found:', student.user_id);

      // Restore user role to student
      console.log('Restoring user role to student');
      await queryDatabase(
        db,
        "UPDATE users SET role = 'student' WHERE id = ?",
        [student.user_id]
      );

      // Delete alumni record
      console.log('Deleting alumni record');
      await queryDatabase(
        db,
        "DELETE FROM alumni WHERE user_id = ?",
        [student.user_id]
      );

      // Delete graduation record
      console.log('Deleting graduation record');
      await queryDatabase(
        db,
        "DELETE FROM graduation_records WHERE student_id = ?",
        [studentId]
      );

      // Delete alumni employment tracking record
      console.log('Deleting alumni employment record');
      await queryDatabase(
        db,
        "DELETE FROM alumni_employment WHERE alumni_user_id = ?",
        [student.user_id]
      );

      // Restore student's program from history record
      if (historyRecord.previous_program_id) {
        console.log('Restoring student program from history:', historyRecord.previous_program_id);
        await queryDatabase(
          db,
          "UPDATE students SET program_id = ?, academic_year = ? WHERE id = ?",
          [historyRecord.previous_program_id, historyRecord.old_year_level || 4, studentId]
        );
      }

      // Delete the history record since we're undoing the graduation
      console.log('Deleting promotion history record');
      await queryDatabase(
        db,
        "DELETE FROM student_promotion_history WHERE id = ?",
        [historyId]
      );

      console.log('Graduation undo completed successfully');
      return {
        success: true,
        message: "Successfully reverted graduation"
      };
    }
    
    // For regular promotions, revert to previous program
    // Try to get previous program from history, or look it up by old program code and year
    let prevProgramId = historyRecord.previous_program_id;
    
    // If no previous_program_id in history, try to find it by old program code and year
    if (!prevProgramId && historyRecord.old_program_code && historyRecord.old_year_level) {
      const findPrevProgramQuery = `
        SELECT id FROM course_management 
        WHERE program_code = ? AND year_level = ? AND status = 'active'
        LIMIT 1
      `;
      const prevPrograms = await queryDatabase(db, findPrevProgramQuery, [
        historyRecord.old_program_code, 
        historyRecord.old_year_level
      ]);
      if (prevPrograms.length > 0) {
        prevProgramId = prevPrograms[0].id;
      }
    }
    
    if (!prevProgramId) {
      return {
        success: false,
        message: "Cannot undo - no previous program found"
      };
    }
    
    // Get previous program details
    const prevProgramQuery = 'SELECT * FROM course_management WHERE id = ?';
    const prevPrograms = await queryDatabase(db, prevProgramQuery, [prevProgramId]);
    
    if (prevPrograms.length === 0) {
      return {
        success: false,
        message: "Previous program no longer exists"
      };
    }
    
    const prevProgram = prevPrograms[0];
    
    // Update student back to previous program
    await queryDatabase(
      db,
      "UPDATE students SET program_id = ?, academic_year = ?, previous_program_id = NULL, promotion_date = NULL WHERE id = ?",
      [prevProgramId, prevProgram.year_level, studentId]
    );
    
    // Delete the history record since we're undoing the promotion
    await queryDatabase(
      db,
      "DELETE FROM student_promotion_history WHERE id = ?",
      [historyId]
    );
    
    return {
      success: true,
      message: "Successfully reverted promotion"
    };
    
  } catch (error) {
    console.error("Undo promotion error:", error);
    throw error;
  }
};

/**
 * Bulk undo promotions - revert multiple students to previous programs
 * @param {Array} historyIds - Array of history IDs to undo
 * @param {number} undoneBy - Admin user ID performing the undo
 * @returns {Promise<object>} Bulk undo result
 */
const bulkUndoPromotion = async (historyIds, undoneBy) => {
  try {
    const results = {
      success: true,
      undone: 0,
      failed: 0,
      errors: []
    };

    for (const historyId of historyIds) {
      try {
        // Get the promotion history record
        const historyQuery = `
          SELECT sph.*, s.program_id as current_program_id, s.previous_program_id 
          FROM student_promotion_history sph
          INNER JOIN students s ON sph.student_id = s.id
          WHERE sph.id = ?
        `;
        
        const historyRecords = await queryDatabase(db, historyQuery, [historyId]);
        
        if (historyRecords.length === 0) {
          results.failed++;
          results.errors.push({ historyId, error: "History not found" });
          continue;
        }
        
        const historyRecord = historyRecords[0];
        const studentId = historyRecord.student_id;
        
        // Skip graduations
        if (historyRecord.promotion_type === 'graduation') {
          results.failed++;
          results.errors.push({ historyId, error: "Cannot undo graduation" });
          continue;
        }
        
        // For regular promotions, revert to previous program
        // Try to get previous program from history, or look it up by old program code and year
        let prevProgramId = historyRecord.previous_program_id;
        
        // If no previous_program_id in history, try to find it by old program code and year
        if (!prevProgramId && historyRecord.old_program_code && historyRecord.old_year_level) {
          const findPrevProgramQuery = `
            SELECT id FROM course_management 
            WHERE program_code = ? AND year_level = ? AND status = 'active'
            LIMIT 1
          `;
          const foundPrograms = await queryDatabase(db, findPrevProgramQuery, [
            historyRecord.old_program_code, 
            historyRecord.old_year_level
          ]);
          if (foundPrograms.length > 0) {
            prevProgramId = foundPrograms[0].id;
          }
        }
        
        if (!prevProgramId) {
          results.failed++;
          results.errors.push({ historyId, error: "No previous program found" });
          continue;
        }
        
        // Get previous program details
        const prevProgramQuery = 'SELECT * FROM course_management WHERE id = ?';
        const prevPrograms = await queryDatabase(db, prevProgramQuery, [prevProgramId]);
        
        if (prevPrograms.length === 0) {
          results.failed++;
          results.errors.push({ historyId, error: "Previous program no longer exists" });
          continue;
        }
        
        const prevProgram = prevPrograms[0];
        
        // Update student back to previous program
        await queryDatabase(
          db,
          "UPDATE students SET program_id = ?, academic_year = ?, previous_program_id = NULL, promotion_date = NULL WHERE id = ?",
          [prevProgramId, prevProgram.year_level, studentId]
        );
        
        results.undone++;
        
        // Delete the history record since we're undoing the promotion
        await queryDatabase(
          db,
          "DELETE FROM student_promotion_history WHERE id = ?",
          [historyId]
        );
        
      } catch (itemError) {
        results.failed++;
        results.errors.push({ historyId, error: itemError.message });
      }
    }

    return results;
    
  } catch (error) {
    console.error("Bulk undo promotion error:", error);
    throw error;
  }
};

module.exports = {
  getEligibleStudents,
  getTargetPrograms,
  promoteStudents,
  graduateStudents,
  getPromotionHistory,
  getAllPrograms,
  previewPromotion,
  undoPromotion,
  bulkUndoPromotion
};
