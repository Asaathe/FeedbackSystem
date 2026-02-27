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
        // Get current student data
        const students = await queryDatabase(
          db,
          'SELECT s.*, u.id as user_id FROM students s INNER JOIN users u ON s.user_id = u.id WHERE s.id = ?',
          [studentId]
        );
        
        if (students.length === 0) {
          errors.push({ studentId, error: "Student not found" });
          continue;
        }
        
        const student = students[0];
        const previousProgramId = student.program_id;
        
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
        // Get current student data
        const students = await queryDatabase(
          db,
          'SELECT s.*, u.id as user_id, u.full_name, u.email FROM students s INNER JOIN users u ON s.user_id = u.id WHERE s.id = ?',
          [studentId]
        );
        
        if (students.length === 0) {
          errors.push({ studentId, error: "Student not found" });
          continue;
        }
        
        const student = students[0];
        
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
        u.full_name as student_name,
        u.email as student_email,
        s.studentID,
        sph.promotion_type,
        sph.promotion_date,
        sph.notes,
        sph.created_at,
        cm_old.program_code as old_program_code,
        cm_old.year_level as old_year_level,
        cm_old.section as old_section,
        cm_new.program_code as new_program_code,
        cm_new.year_level as new_year_level,
        cm_new.section as new_section,
        promoter.full_name as promoted_by_name
      FROM student_promotion_history sph
      INNER JOIN users u ON sph.user_id = u.id
      INNER JOIN students s ON sph.student_id = s.id
      LEFT JOIN course_management cm_old ON sph.previous_program_id = cm_old.id
      LEFT JOIN course_management cm_new ON sph.new_program_id = cm_new.id
      INNER JOIN users promoter ON sph.promoted_by = promoter.id
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

module.exports = {
  getEligibleStudents,
  getTargetPrograms,
  promoteStudents,
  graduateStudents,
  getPromotionHistory,
  getAllPrograms
};
