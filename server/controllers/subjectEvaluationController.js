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
        0 as total_feedbacks,
        0 as avg_rating
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
          0 as total_feedbacks,
          0 as avg_rating
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
        0 as avg_rating,
        (SELECT COUNT(DISTINCT st.user_id) FROM students st 
         INNER JOIN users u2 ON st.user_id = u2.id 
         WHERE st.program_id = so.program_id AND u2.status = 'active') as student_count
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
         WHERE st.program_id = so.program_id AND u2.status = 'active') as student_count
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
  assignFormToSubject
};
