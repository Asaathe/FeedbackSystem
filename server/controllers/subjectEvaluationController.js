// Subject Evaluation Controller
// REWRITTEN - Now uses subject_offerings and evaluation_subjects instead of legacy tables
// Legacy tables removed: subjects, subject_evaluation_forms, subject_evaluation_responses, subject_instructors, student_enrollments

const db = require("../config/database");

/**
 * Get all instructors with their subjects (for subject-evaluation.tsx)
 */
const getAllInstructors = async (req, res) => {
  try {
    const { academic_year, semester } = req.query;
    
    // Get current settings if not provided
    let acadYear = academic_year;
    let sem = semester;
    
    if (!acadYear || !sem) {
      const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
      const settings = await new Promise((resolve, reject) => {
        db.query(settingsQuery, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      settings.forEach(s => {
        if (s.setting_key === 'current_academic_year') acadYear = s.setting_value;
        if (s.setting_key === 'current_semester') sem = s.setting_value;
      });
    }
    
    // Query using subject_offerings and evaluation_subjects
    const query = `
      SELECT DISTINCT
        u.id as user_id,
        u.full_name,
        u.email,
        i.department,
        i.school_role,
        u.id as instructor_id,
        i.image
      FROM subject_offerings so
      INNER JOIN evaluation_subjects es ON so.subject_id = es.id
      INNER JOIN users u ON so.instructor_id = u.id
      LEFT JOIN instructors i ON u.id = i.user_id
      WHERE so.academic_year = ? AND so.semester = ?
      ORDER BY u.full_name
    `;
    
    // Get all instructors who have subject offerings, regardless of semester
    // Using subject_feedback and instructor_feedback tables for feedback counts
    // Fallback to subject_id if section_id is NULL for backward compatibility
    const offeringQuery = `
      SELECT DISTINCT
        u.id as user_id,
        u.full_name,
        u.email,
        i.department,
        i.school_role,
        u.id as instructor_id,
        i.image,
        (SELECT COUNT(DISTINCT so2.id) FROM subject_offerings so2 WHERE so2.instructor_id = u.id AND so2.status = 'active') as total_subjects,
        COALESCE((
          SELECT COUNT(*)
          FROM subject_feedback sf
          WHERE sf.instructor_id = u.id
        ), 0) + COALESCE((
          SELECT COUNT(*)
          FROM instructor_feedback ifb
          WHERE ifb.instructor_id = u.id
        ), 0) as total_feedbacks,
        COALESCE((
          SELECT AVG(sf.overall_rating)
          FROM subject_feedback sf
          WHERE sf.instructor_id = u.id AND sf.overall_rating IS NOT NULL
        ), 0) as avg_rating
      FROM subject_offerings so
      INNER JOIN users u ON so.instructor_id = u.id
      LEFT JOIN instructors i ON u.id = i.user_id
      WHERE so.instructor_id IS NOT NULL AND so.status = 'active'
      ORDER BY u.full_name
    `;
    
    db.query(offeringQuery, (err, results) => {
      if (err) {
        console.error("Error fetching instructors:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch instructors" });
      }
      
      // Always include fallback - get all instructors from the instructors table
      // Fallback to subject_id if section_id is NULL for backward compatibility
      const fallbackQuery = `
        SELECT 
          u.id as user_id,
          u.full_name,
          u.email,
          i.department,
          i.school_role,
          u.id as instructor_id,
          i.image,
          (SELECT COUNT(DISTINCT so2.id) FROM subject_offerings so2 WHERE so2.instructor_id = u.id AND so2.status = 'active') as total_subjects,
          COALESCE((
            SELECT COUNT(*)
            FROM subject_feedback sf
            WHERE sf.instructor_id = u.id
          ), 0) + COALESCE((
            SELECT COUNT(*)
            FROM instructor_feedback ifb
            WHERE ifb.instructor_id = u.id
          ), 0) as total_feedbacks,
          COALESCE((
            SELECT AVG(sf.overall_rating)
            FROM subject_feedback sf
            WHERE sf.instructor_id = u.id AND sf.overall_rating IS NOT NULL
          ), 0) as avg_rating
        FROM users u
        LEFT JOIN instructors i ON u.id = i.user_id
        WHERE u.role = 'instructor' AND u.status = 'active'
        ORDER BY u.full_name
      `;
      
      return db.query(fallbackQuery, (fallbackErr, fallbackResults) => {
        if (fallbackErr) {
          console.error("Error in fallback query:", fallbackErr);
          return res.status(200).json({ success: true, instructors: results });
        }
        
        // Combine both results, removing duplicates
        const combined = [...results];
        fallbackResults.forEach(fb => {
          if (!combined.find(c => c.user_id === fb.user_id)) {
            combined.push(fb);
          }
        });
        
        return res.status(200).json({ success: true, instructors: combined });
      });
    });
  } catch (error) {
    console.error("Get all instructors error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get all subjects with their instructors (for subject-evaluation.tsx - By Subjects view)
 */
const getAllSubjects = async (req, res) => {
  try {
    const { academic_year, semester } = req.query;
    
    // Get current settings if not provided
    let acadYear = academic_year;
    let sem = semester;
    
    if (!acadYear || !sem) {
      const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
      const settings = await new Promise((resolve, reject) => {
        db.query(settingsQuery, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      settings.forEach(s => {
        if (s.setting_key === 'current_academic_year') acadYear = s.setting_value;
        if (s.setting_key === 'current_semester') sem = s.setting_value;
      });
    }
    
    // Query from subject_offerings - show ALL offerings regardless of semester
    // Using both subject_feedback and instructor_feedback tables for feedback counts and ratings
    // Fallback to subject_id if section_id is NULL for backward compatibility
    const query = `
      SELECT 
        so.id as section_id,
        so.id as offering_id,
        so.subject_id,
        es.subject_code,
        es.subject_name,
        es.department,
        so.program_id,
        c.program_name,
        c.course_section,
        so.year_level,
        so.section,
        so.academic_year,
        so.semester,
        so.instructor_id,
        COALESCE(u.full_name, 'Unknown Instructor') as instructor_name,
        i.image as instructor_image,
        COALESCE(((
          SELECT AVG(sf.overall_rating)
          FROM subject_feedback sf
          WHERE (sf.section_id = so.id OR (sf.section_id IS NULL AND sf.subject_id = so.subject_id AND sf.instructor_id = so.instructor_id))
          AND sf.overall_rating IS NOT NULL
        ) + (
          SELECT AVG(ifb.overall_rating)
          FROM instructor_feedback ifb
          WHERE (ifb.section_id = so.id OR (ifb.section_id IS NULL AND ifb.subject_id = so.subject_id AND ifb.instructor_id = so.instructor_id))
          AND ifb.overall_rating IS NOT NULL
        )) / 2, 0) as avg_rating,
        (SELECT COUNT(DISTINCT st.user_id) FROM students st 
         INNER JOIN users u2 ON st.user_id = u2.id 
         WHERE st.program_id = so.program_id AND u2.status = 'active') as student_count,
        COALESCE((
          SELECT COUNT(*)
          FROM subject_feedback sf
          WHERE (sf.section_id = so.id OR (sf.section_id IS NULL AND sf.subject_id = so.subject_id AND sf.instructor_id = so.instructor_id))
        ), 0) + COALESCE((
          SELECT COUNT(*)
          FROM instructor_feedback ifb
          WHERE (ifb.section_id = so.id OR (ifb.section_id IS NULL AND ifb.subject_id = so.subject_id AND ifb.instructor_id = so.instructor_id))
        ), 0) as feedback_count
      FROM subject_offerings so
      LEFT JOIN evaluation_subjects es ON so.subject_id = es.id
      LEFT JOIN course_management c ON so.program_id = c.id
      LEFT JOIN users u ON so.instructor_id = u.id
      LEFT JOIN instructors i ON u.id = i.user_id
      WHERE so.status = 'active'
      ORDER BY so.academic_year DESC, so.semester DESC, es.subject_code, c.course_section
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching subjects:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch subjects" });
      }
      
      // Return results from subject_offerings
      return res.status(200).json({ success: true, subjects: results });
    });
  } catch (error) {
    console.error("Get all subjects error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get subjects for the logged-in student
 */
const getMySubjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const { academic_year, semester } = req.query;
    
    // Get user role
    const userQuery = "SELECT role FROM users WHERE id = ?";
    const userResults = await new Promise((resolve, reject) => {
      db.query(userQuery, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (!userResults.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const userRole = userResults[0].role;
    
    // Get current settings if not provided
    let acadYear = academic_year;
    let sem = semester;
    
    if (!acadYear || !sem) {
      const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
      const settings = await new Promise((resolve, reject) => {
        db.query(settingsQuery, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      settings.forEach(s => {
        if (s.setting_key === 'current_academic_year') acadYear = s.setting_value;
        if (s.setting_key === 'current_semester') sem = s.setting_value;
      });
    }
    
    // If user is an instructor, get their subjects from subject_offerings
    if (userRole === 'instructor') {
      const query = `
        SELECT 
          so.id as offering_id,
          so.subject_id,
          es.subject_code,
          es.subject_name,
          es.department,
          so.program_id,
          c.course_section,
          so.year_level,
          so.section,
          so.academic_year,
          so.semester,
          so.instructor_id,
          u.full_name as instructor_name,
          i.image as instructor_image
        FROM subject_offerings so
        LEFT JOIN evaluation_subjects es ON so.subject_id = es.id
        LEFT JOIN course_management c ON so.program_id = c.id
        LEFT JOIN users u ON so.instructor_id = u.id
        LEFT JOIN instructors i ON u.id = i.user_id
        WHERE so.instructor_id = ? AND so.academic_year = ? AND so.semester = ? AND so.status = 'active'
        ORDER BY es.subject_code
      `;
      
      db.query(query, [userId, acadYear, sem], (err, results) => {
        if (err) {
          console.error("Error fetching instructor subjects:", err);
          return res.status(500).json({ success: false, message: "Failed to fetch subjects" });
        }
        return res.status(200).json({ success: true, subjects: results });
      });
      return;
    }
    
    // For students, get their enrolled subjects from subject_offerings via program_id
    const studentQuery = "SELECT program_id FROM students WHERE user_id = ?";
    const studentResults = await new Promise((resolve, reject) => {
      db.query(studentQuery, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (!studentResults.length || !studentResults[0].program_id) {
      return res.status(200).json({ success: true, subjects: [] });
    }
    
    const programId = studentResults[0].program_id;
    
    const query = `
      SELECT 
        so.id as offering_id,
        so.subject_id,
        es.subject_code,
        es.subject_name,
        es.department,
        so.program_id,
        c.course_section,
        so.year_level,
        so.section,
        so.academic_year,
        so.semester,
        so.instructor_id,
        u.full_name as instructor_name,
        i.image as instructor_image
      FROM subject_offerings so
      LEFT JOIN evaluation_subjects es ON so.subject_id = es.id
      LEFT JOIN course_management c ON so.program_id = c.id
      LEFT JOIN users u ON so.instructor_id = u.id
      LEFT JOIN instructors i ON u.id = i.user_id
      WHERE so.program_id = ? AND so.academic_year = ? AND so.semester = ? AND so.status = 'active'
      ORDER BY es.subject_code
    `;
    
    db.query(query, [programId, acadYear, sem], (err, results) => {
      if (err) {
        console.error("Error fetching student subjects:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch subjects" });
      }
      return res.status(200).json({ success: true, subjects: results });
    });
  } catch (error) {
    console.error("Get my subjects error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Search subjects by code or name (for searchable dropdown)
 */
const searchSubjects = async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search) {
      return res.status(200).json({ success: true, subjects: [] });
    }
    
    const query = `
      SELECT 
        es.id,
        es.subject_code,
        es.subject_name,
        es.department,
        es.units
      FROM evaluation_subjects es
      WHERE es.status = 'active' 
        AND (es.subject_code LIKE ? OR es.subject_name LIKE ?)
      ORDER BY es.subject_code
      LIMIT 20
    `;
    
    const searchPattern = `%${search}%`;
    db.query(query, [searchPattern, searchPattern], (err, results) => {
      if (err) {
        console.error("Error searching subjects:", err);
        return res.status(500).json({ success: false, message: "Failed to search subjects" });
      }
      return res.status(200).json({ success: true, subjects: results });
    });
  } catch (error) {
    console.error("Search subjects error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get instructor details with their subjects
 */
const getInstructorDetails = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { academic_year, semester } = req.query;
    
    // Get current settings if not provided
    let acadYear = academic_year;
    let sem = semester;
    
    if (!acadYear || !sem) {
      const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
      const settings = await new Promise((resolve, reject) => {
        db.query(settingsQuery, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      settings.forEach(s => {
        if (s.setting_key === 'current_academic_year') acadYear = s.setting_value;
        if (s.setting_key === 'current_semester') sem = s.setting_value;
      });
    }
    
    // Get instructor info
    const instructorQuery = `
      SELECT u.id, u.full_name, i.department, i.school_role, i.image
      FROM users u
      LEFT JOIN instructors i ON u.id = i.user_id
      WHERE u.id = ? AND u.role = 'instructor'
    `;
    
    const instructorResults = await new Promise((resolve, reject) => {
      db.query(instructorQuery, [instructorId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (!instructorResults.length) {
      return res.status(404).json({ success: false, message: "Instructor not found" });
    }
    
    const instructor = instructorResults[0];
    
    // Get instructor's subjects from subject_offerings
    const subjectsQuery = `
      SELECT 
        so.id as offering_id,
        so.subject_id,
        es.subject_code,
        es.subject_name,
        es.department,
        so.program_id,
        c.course_section,
        so.year_level,
        so.section,
        (SELECT COUNT(DISTINCT st.user_id) FROM students st 
         INNER JOIN users u2 ON st.user_id = u2.id 
         WHERE st.program_id = so.program_id AND u2.status = 'active') as student_count
      FROM subject_offerings so
      LEFT JOIN evaluation_subjects es ON so.subject_id = es.id
      LEFT JOIN course_management c ON so.program_id = c.id
      WHERE so.instructor_id = ? AND so.academic_year = ? AND so.semester = ? AND so.status = 'active'
      ORDER BY es.subject_code
    `;
    
    db.query(subjectsQuery, [instructorId, acadYear, sem], (err, subjects) => {
      if (err) {
        console.error("Error fetching instructor subjects:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch subjects" });
      }
      
      const totalStudents = subjects.reduce((sum, s) => sum + (s.student_count || 0), 0);
      
      return res.status(200).json({
        success: true,
        instructor: {
          ...instructor,
          total_subjects: subjects.length,
          total_enrolled_students: totalStudents
        },
        subjects
      });
    });
  } catch (error) {
    console.error("Get instructor details error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get students for evaluation (for selecting target students)
 */
const getEvaluationStudents = async (req, res) => {
  try {
    const { targetType, targetIds, academic_year, semester } = req.query;
    
    // Get current settings if not provided
    let acadYear = academic_year;
    let sem = semester;
    
    if (!acadYear || !sem) {
      const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
      const settings = await new Promise((resolve, reject) => {
        db.query(settingsQuery, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      settings.forEach(s => {
        if (s.setting_key === 'current_academic_year') acadYear = s.setting_value;
        if (s.setting_key === 'current_semester') sem = s.setting_value;
      });
    }
    
    let students = [];
    
    if (targetType === 'subject') {
      // Get students in specific subjects
      const subjectIds = targetIds.split(',').map(id => parseInt(id));
      const placeholders = subjectIds.map(() => '?').join(',');
      
      const query = `
        SELECT DISTINCT
          u.id as student_id,
          u.full_name,
          u.email,
          st.studentID,
          cm.course_section,
          cm.department
        FROM subject_offerings so
        INNER JOIN students st ON so.program_id = st.program_id
        INNER JOIN users u ON st.user_id = u.id
        LEFT JOIN course_management cm ON st.program_id = cm.id
        WHERE so.subject_id IN (${placeholders}) 
          AND so.academic_year = ? 
          AND so.semester = ? 
          AND u.status = 'active'
        ORDER BY u.full_name
      `;
      
      students = await new Promise((resolve, reject) => {
        db.query(query, [...subjectIds, acadYear, sem], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
    } else if (targetType === 'instructor') {
      // Get students in subjects taught by specific instructors
      const instructorIds = targetIds.split(',').map(id => parseInt(id));
      const placeholders = instructorIds.map(() => '?').join(',');
      
      const query = `
        SELECT DISTINCT
          u.id as student_id,
          u.full_name,
          u.email,
          st.studentID,
          cm.course_section,
          cm.department
        FROM subject_offerings so
        INNER JOIN students st ON so.program_id = st.program_id
        INNER JOIN users u ON st.user_id = u.id
        LEFT JOIN course_management cm ON st.program_id = cm.id
        WHERE so.instructor_id IN (${placeholders}) 
          AND so.academic_year = ? 
          AND so.semester = ? 
          AND u.status = 'active'
        ORDER BY u.full_name
      `;
      
      students = await new Promise((resolve, reject) => {
        db.query(query, [...instructorIds, acadYear, sem], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
    } else {
      // Get all active students
      const query = `
        SELECT 
          u.id as student_id,
          u.full_name,
          u.email,
          st.studentID,
          cm.course_section,
          cm.department
        FROM students st
        INNER JOIN users u ON st.user_id = u.id
        LEFT JOIN course_management cm ON st.program_id = cm.id
        WHERE u.status = 'active'
        ORDER BY u.full_name
      `;
      
      students = await new Promise((resolve, reject) => {
        db.query(query, [], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
    }
    
    return res.status(200).json({ success: true, students });
  } catch (error) {
    console.error("Get evaluation students error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get dashboard stats for instructor
 */
const getInstructorDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current settings
    const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
    const settings = await new Promise((resolve, reject) => {
      db.query(settingsQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    let semester = '1st';
    let academicYear = '2025-2026';
    
    settings.forEach(s => {
      if (s.setting_key === 'current_semester') semester = s.setting_value;
      if (s.setting_key === 'current_academic_year') academicYear = s.setting_value;
    });
    
    // Get instructor's subjects count
    const subjectsQuery = `
      SELECT COUNT(DISTINCT so.subject_id) as total_courses
      FROM subject_offerings so
      INNER JOIN evaluation_subjects es ON so.subject_id = es.id
      WHERE so.instructor_id = ? AND so.academic_year = ? AND so.semester = ?
    `;
    
    const subjectsResult = await new Promise((resolve, reject) => {
      db.query(subjectsQuery, [userId, academicYear, semester], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    // Get total students
    const studentsQuery = `
      SELECT COUNT(DISTINCT st.user_id) as total_students
      FROM subject_offerings so
      INNER JOIN students st ON so.program_id = st.program_id
      INNER JOIN users u ON st.user_id = u.id
      WHERE so.instructor_id = ? AND u.status = 'active'
    `;
    
    const studentsResult = await new Promise((resolve, reject) => {
      db.query(studentsQuery, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    return res.status(200).json({
      success: true,
      stats: {
        total_students: studentsResult[0]?.total_students || 0,
        total_courses: subjectsResult[0]?.total_courses || 0,
        total_feedbacks: 0,
        avg_rating: 0
      }
    });
  } catch (error) {
    console.error("Get instructor dashboard stats error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Assign form to subject (for evaluation form deployment)
 * DEPRECATED - Use Forms system instead
 */
const assignFormToSubject = async (req, res) => {
  return res.status(410).json({ 
    success: false, 
    message: "This endpoint is deprecated. Use the Forms system (/api/forms) for creating and managing evaluation forms."
  });
};

/**
 * Get subjects for a specific instructor (for subject-evaluation.tsx)
 */
const getInstructorSubjects = async (req, res) => {
  try {
    const { instructorId } = req.params;
    
    // Get all subjects for this instructor, regardless of semester
    const query = `
      SELECT 
        so.id as offering_id,
        so.subject_id,
        es.subject_code,
        es.subject_name,
        es.department,
        so.program_id,
        c.course_section,
        so.year_level,
        so.section,
        so.academic_year,
        so.semester,
        (SELECT COUNT(DISTINCT st.user_id) FROM students st 
         INNER JOIN users u2 ON st.user_id = u2.id 
         WHERE st.program_id = so.program_id AND u2.status = 'active') as student_count,
        COALESCE((
          SELECT COUNT(*)
          FROM subject_feedback sf
          WHERE sf.section_id = so.id
        ), 0) + COALESCE((
          SELECT COUNT(*)
          FROM instructor_feedback ifb
          WHERE ifb.section_id = so.id
        ), 0) as feedback_count,
        COALESCE((
          SELECT AVG(sf.overall_rating)
          FROM subject_feedback sf
          WHERE sf.section_id = so.id AND sf.overall_rating IS NOT NULL
        ), 0) as subject_avg,
        COALESCE((
          SELECT AVG(ifb.overall_rating)
          FROM instructor_feedback ifb
          WHERE ifb.section_id = so.id AND ifb.overall_rating IS NOT NULL
        ), 0) as instructor_avg
      FROM subject_offerings so
      LEFT JOIN evaluation_subjects es ON so.subject_id = es.id
      LEFT JOIN course_management c ON so.program_id = c.id
      WHERE so.instructor_id = ? AND so.status = 'active'
      ORDER BY so.academic_year DESC, so.semester DESC, es.subject_code
    `;
    
    db.query(query, [instructorId], (err, subjects) => {
      if (err) {
        console.error("Error fetching instructor subjects:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch subjects" });
      }
      
      return res.status(200).json({ success: true, subjects });
    });
  } catch (error) {
    console.error("Get instructor subjects error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get subject evaluation results with individual responses
 */
const getSubjectEvaluationResults = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { academic_year, semester } = req.query;
    
    console.log('getSubjectEvaluationResults called with subjectId:', subjectId);
    
    // Get current settings if not provided
    let acadYear = academic_year;
    let sem = semester;
    
    if (!acadYear || !sem) {
      const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
      const settings = await new Promise((resolve, reject) => {
        db.query(settingsQuery, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      settings.forEach(s => {
        if (s.setting_key === 'current_academic_year') acadYear = s.setting_value;
        if (s.setting_key === 'current_semester') sem = s.setting_value;
      });
    }
    
    // Get subject feedback for this section
    // Query by section_id first, then fallback to subject_id for backward compatibility
    const subjectFeedbackQuery = `
      SELECT 
        sf.id as response_id,
        sf.student_id as respondent_id,
        u.full_name as respondent_name,
        sf.overall_rating as overall_score,
        sf.responses as question_responses,
        sf.submitted_at,
        sf.subject_id,
        'subject' as feedback_type
      FROM subject_feedback sf
      LEFT JOIN users u ON sf.student_id = u.id
      WHERE sf.section_id = ?
      ORDER BY sf.submitted_at DESC
    `;
    
    const subjectFeedbackResults = await new Promise((resolve, reject) => {
      db.query(subjectFeedbackQuery, [subjectId], (err, results) => {
        if (err) {
          console.error('Error fetching subject feedback:', err);
          reject(err);
        } else {
          console.log('Subject feedback results:', results.length);
          resolve(results);
        }
      });
    });
    
    // Get instructor feedback for this section
    const instructorFeedbackQuery = `
      SELECT 
        ifb.id as response_id,
        ifb.student_id as respondent_id,
        u.full_name as respondent_name,
        ifb.overall_rating as overall_score,
        ifb.responses as question_responses,
        ifb.submitted_at,
        ifb.subject_id,
        'instructor' as feedback_type
      FROM instructor_feedback ifb
      LEFT JOIN users u ON ifb.student_id = u.id
      WHERE ifb.section_id = ?
      ORDER BY ifb.submitted_at DESC
    `;
    
    const instructorFeedbackResults = await new Promise((resolve, reject) => {
      db.query(instructorFeedbackQuery, [subjectId], (err, results) => {
        if (err) {
          console.error('Error fetching instructor feedback:', err);
          reject(err);
        } else {
          console.log('Instructor feedback results:', results.length);
          resolve(results);
        }
      });
    });
    
    // Combine both results
    const combinedResults = [...subjectFeedbackResults, ...instructorFeedbackResults];
    console.log('Combined results:', combinedResults.length);
    
    // If no results from section_id, try fallback to subject_id
    if (combinedResults.length === 0) {
      // Try subject_feedback with subject_id fallback
      const fallbackSubjectQuery = `
        SELECT 
          sf.id as response_id,
          sf.student_id as respondent_id,
          u.full_name as respondent_name,
          sf.overall_rating as overall_score,
          sf.responses as question_responses,
          sf.submitted_at,
          sf.subject_id,
          'subject' as feedback_type
        FROM subject_feedback sf
        LEFT JOIN users u ON sf.student_id = u.id
        WHERE sf.subject_id = ? AND sf.section_id IS NULL
        ORDER BY sf.submitted_at DESC
      `;
      
      const fallbackInstructorQuery = `
        SELECT 
          ifb.id as response_id,
          ifb.student_id as respondent_id,
          u.full_name as respondent_name,
          ifb.overall_rating as overall_score,
          ifb.responses as question_responses,
          ifb.submitted_at,
          ifb.subject_id,
          'instructor' as feedback_type
        FROM instructor_feedback ifb
        LEFT JOIN users u ON ifb.student_id = u.id
        WHERE ifb.subject_id = ? AND ifb.section_id IS NULL
        ORDER BY ifb.submitted_at DESC
      `;
      
      const [fbSubject, fbInstructor] = await Promise.all([
        new Promise((resolve, reject) => {
          db.query(fallbackSubjectQuery, [subjectId], (err, results) => {
            if (err) reject(err); else resolve(results);
          });
        }),
        new Promise((resolve, reject) => {
          db.query(fallbackInstructorQuery, [subjectId], (err, results) => {
            if (err) reject(err); else resolve(results);
          });
        })
      ]);
      
      combinedResults.push(...fbSubject, ...fbInstructor);
    }
    
    // Get statistics from both tables
    const [subjectStats, instructorStats] = await Promise.all([
      new Promise((resolve, reject) => {
        const statsQuery = `SELECT COUNT(*) as count, AVG(overall_rating) as avg FROM subject_feedback WHERE section_id = ? AND overall_rating IS NOT NULL`;
        db.query(statsQuery, [subjectId], (err, results) => {
          if (err) reject(err); else resolve(results[0]);
        });
      }),
      new Promise((resolve, reject) => {
        const statsQuery = `SELECT COUNT(*) as count, AVG(overall_rating) as avg FROM instructor_feedback WHERE section_id = ? AND overall_rating IS NOT NULL`;
        db.query(statsQuery, [subjectId], (err, results) => {
          if (err) reject(err); else resolve(results[0]);
        });
      })
    ]);
    
    // Use combined results
    const responses = combinedResults;
    
    // Parse responses - overall_rating is already a number, but responses (question_responses) is a JSON string
    const parsedResponses = responses.map(r => {
      let parsedQuestionResponses = r.question_responses;
      // Parse if it's a string (JSON)
      if (typeof r.question_responses === 'string') {
        try {
          parsedQuestionResponses = JSON.parse(r.question_responses);
        } catch (e) {
          parsedQuestionResponses = {};
        }
      }
      return {
        ...r,
        overall_score: r.overall_rating ? parseFloat(r.overall_rating) : null,
        question_responses: parsedQuestionResponses,
        form_title: r.feedback_type === 'instructor' ? 'Instructor Evaluation' : 'Subject Evaluation'
      };
    });
    
    // Calculate combined statistics
    const totalResponses = (subjectStats?.count || 0) + (instructorStats?.count || 0);
    const avgRating = totalResponses > 0 
      ? ((subjectStats?.avg || 0) * (subjectStats?.count || 0) + (instructorStats?.avg || 0) * (instructorStats?.count || 0)) / totalResponses 
      : 0;
    
    return res.status(200).json({
      success: true,
      responses: parsedResponses,
      statistics: {
        total_responses: totalResponses,
        avg_rating: avgRating || 0,
        min_rating: 0,
        max_rating: 0
      }
    });
  } catch (error) {
    console.error("Get subject evaluation results error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get evaluation results by section with question category averages
 */
const getEvaluationResultsBySection = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { academic_year, semester } = req.query;
    
    // Get current settings if not provided
    let acadYear = academic_year;
    let sem = semester;
    
    if (!acadYear || !sem) {
      const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
      const settings = await new Promise((resolve, reject) => {
        db.query(settingsQuery, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      settings.forEach(s => {
        if (s.setting_key === 'current_academic_year') acadYear = s.setting_value;
        if (s.setting_key === 'current_semester') sem = s.setting_value;
      });
    }
    
    // Get subject info using section_id
    const subjectQuery = `
      SELECT 
        so.id as section_id,
        so.subject_id,
        es.subject_code,
        es.subject_name,
        so.section,
        so.program_id,
        c.program_name,
        c.course_section,
        so.year_level,
        (SELECT COUNT(DISTINCT st.user_id) FROM students st 
         INNER JOIN users u2 ON st.user_id = u2.id 
         WHERE st.program_id = so.program_id AND u2.status = 'active') as total_enrolled
      FROM subject_offerings so
      LEFT JOIN evaluation_subjects es ON so.subject_id = es.id
      LEFT JOIN course_management c ON so.program_id = c.id
      WHERE so.id = ?
      LIMIT 1
    `;
    
    const subjectInfo = await new Promise((resolve, reject) => {
      db.query(subjectQuery, [subjectId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (!subjectInfo.length) {
      return res.status(200).json({ success: true, results: [] });
    }
    
    // Get responses count and average from both tables
    const [subjectCount, instructorCount, subjectAvg, instructorAvg] = await Promise.all([
      new Promise((resolve, reject) => {
        db.query(
          `SELECT COUNT(*) as cnt FROM subject_feedback WHERE section_id = ?`,
          [subjectId],
          (err, results) => err ? reject(err) : resolve(results[0]?.cnt || 0)
        );
      }),
      new Promise((resolve, reject) => {
        db.query(
          `SELECT COUNT(*) as cnt FROM instructor_feedback WHERE section_id = ?`,
          [subjectId],
          (err, results) => err ? reject(err) : resolve(results[0]?.cnt || 0)
        );
      }),
      new Promise((resolve, reject) => {
        db.query(
          `SELECT AVG(overall_rating) as avg FROM subject_feedback WHERE section_id = ? AND overall_rating IS NOT NULL`,
          [subjectId],
          (err, results) => err ? reject(err) : resolve(results[0]?.avg || 0)
        );
      }),
      new Promise((resolve, reject) => {
        db.query(
          `SELECT AVG(overall_rating) as avg FROM instructor_feedback WHERE section_id = ? AND overall_rating IS NOT NULL`,
          [subjectId],
          (err, results) => err ? reject(err) : resolve(results[0]?.avg || 0)
        );
      })
    ]);
    
    const totalResponses = subjectCount + instructorCount;
    const combinedAvg = totalResponses > 0 
      ? ((subjectAvg * subjectCount) + (instructorAvg * instructorCount)) / totalResponses 
      : 0;
    
    // Get sample responses for question averages - query tables separately
    let questionAverages = {};
    
    try {
      const subjectSampleQuery = "SELECT responses FROM subject_feedback WHERE section_id = ? LIMIT 1";
      const subjectSample = await new Promise((resolve, reject) => {
        db.query(subjectSampleQuery, [subjectId], (err, results) => {
          if (err) console.log('subject sample error:', err);
          else resolve(results || []);
        });
      });
      
      if (subjectSample.length > 0 && subjectSample[0]?.responses) {
        const parsed = typeof subjectSample[0].responses === 'string' ? JSON.parse(subjectSample[0].responses) : subjectSample[0].responses;
        if (parsed?.questions) {
          Object.entries(parsed.questions).forEach(([key, value]) => {
            if (typeof value === 'number') questionAverages[key] = value.toFixed(2);
          });
        }
        if (parsed?.overall_score !== undefined && Object.keys(questionAverages).length === 0) {
          questionAverages['Q1'] = parsed.overall_score ? parseFloat(parsed.overall_score).toFixed(2) : 'N/A';
          questionAverages['Q2'] = 'N/A';
          questionAverages['Q3'] = 'N/A';
        }
      }
    } catch (e) { console.log('subject sample error:', e.message); }
    
    if (Object.keys(questionAverages).length === 0) {
      try {
        const instructorSampleQuery = "SELECT responses FROM instructor_feedback WHERE section_id = ? LIMIT 1";
        const instructorSample = await new Promise((resolve, reject) => {
          db.query(instructorSampleQuery, [subjectId], (err, results) => {
            if (err) console.log('instructor sample error:', err);
            else resolve(results || []);
          });
        });
        
        if (instructorSample.length > 0 && instructorSample[0]?.responses) {
          const parsed = typeof instructorSample[0].responses === 'string' ? JSON.parse(instructorSample[0].responses) : instructorSample[0].responses;
          if (parsed?.questions) {
            Object.entries(parsed.questions).forEach(([key, value]) => {
              if (typeof value === 'number') questionAverages[key] = value.toFixed(2);
            });
          }
          if (parsed?.overall_score !== undefined && Object.keys(questionAverages).length === 0) {
            questionAverages['Q1'] = parsed.overall_score ? parseFloat(parsed.overall_score).toFixed(2) : 'N/A';
            questionAverages['Q2'] = 'N/A';
            questionAverages['Q3'] = 'N/A';
          }
        }
      } catch (e) { console.log('instructor sample error:', e.message); }
    }
    
    if (Object.keys(questionAverages).length === 0) {
      questionAverages['Q1'] = combinedAvg ? parseFloat(combinedAvg).toFixed(2) : 'N/A';
      questionAverages['Q2'] = 'N/A';
      questionAverages['Q3'] = 'N/A';
    }
    
    const result = {
      respondents: subjectInfo[0].program_name || 'General',
      total_enrolled: subjectInfo[0].total_enrolled || 0,
      total_responses: totalResponses,
      q1: questionAverages['Q1'] || '-',
      q2: questionAverages['Q2'] || '-',
      q3: questionAverages['Q3'] || '-',
      average: combinedAvg ? parseFloat(combinedAvg).toFixed(2) : 'N/A',
      question_averages: questionAverages
    };
    
    return res.status(200).json({
      success: true,
      results: [result]
    });
  } catch (error) {
    console.error("Get evaluation results by section error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Export all functions
module.exports = {
  getAllInstructors,
  getAllSubjects,
  getMySubjects,
  searchSubjects,
  getInstructorDetails,
  getInstructorSubjects,
  getEvaluationStudents,
  getInstructorDashboardStats,
  assignFormToSubject,
  getSubjectEvaluationResults,
  getEvaluationResultsBySection
};
