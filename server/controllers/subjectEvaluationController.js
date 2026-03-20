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
          FROM instructor_feedback ifb
          WHERE ifb.instructor_id = u.id
        ), 0) as total_feedbacks,
        COALESCE((
          SELECT AVG(ifb.overall_rating)
          FROM instructor_feedback ifb
          WHERE ifb.instructor_id = u.id AND ifb.overall_rating IS NOT NULL
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
            FROM instructor_feedback ifb
            WHERE ifb.instructor_id = u.id
          ), 0) as total_feedbacks,
          COALESCE((
            SELECT AVG(ifb.overall_rating)
            FROM instructor_feedback ifb
            WHERE ifb.instructor_id = u.id AND ifb.overall_rating IS NOT NULL
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
        COALESCE(
          (
            SELECT AVG(COALESCE(sf.overall_rating, 
              CAST(JSON_UNQUOTE(JSON_EXTRACT(sf.category_averages, '$.overall.average')) AS DECIMAL(10,2))
            ))
            FROM subject_feedback sf
            WHERE (sf.section_id = so.id OR (sf.section_id IS NULL AND sf.subject_id = so.subject_id AND sf.instructor_id = so.instructor_id))
          ),
          0
        ) as subject_avg,
        (SELECT COUNT(DISTINCT st.user_id) FROM students st 
         INNER JOIN users u2 ON st.user_id = u2.id 
         WHERE st.program_id = so.program_id AND u2.status = 'active') as student_count,
        COALESCE((
          SELECT COUNT(*)
          FROM subject_feedback sf
          WHERE (sf.section_id = so.id OR (sf.section_id IS NULL AND sf.subject_id = so.subject_id AND sf.instructor_id = so.instructor_id))
        ), 0) as subject_feedback_count,
        COALESCE((
          SELECT COUNT(*)
          FROM instructor_feedback ifb
          WHERE (ifb.section_id = so.id OR (ifb.section_id IS NULL AND ifb.subject_id = so.subject_id AND ifb.instructor_id = so.instructor_id))
        ), 0) as instructor_feedback_count
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
      // Get all subject offerings for this instructor
      const baseQuery = `
        SELECT 
          so.id as subject_instructor_id,
          so.id as offering_id,
          ef.id as form_id,
          so.subject_id,
          es.subject_code,
          COALESCE(f.title, es.subject_name) as form_name,
          es.description,
          es.department as category,
          so.status,
          so.semester,
          so.academic_year,
          so.instructor_id,
          u.full_name as instructor_name,
          i.image as instructor_image,
          f.start_date,
          f.end_date,
          COALESCE((
            SELECT MAX(sr.shared_at)
            FROM shared_responses sr
            WHERE sr.form_id = ef.form_id AND sr.shared_with_instructor_id = so.instructor_id
          ), NULL) as shared_at,
          COALESCE((
            SELECT AVG(sf.overall_rating)
            FROM subject_feedback sf
            WHERE (sf.section_id = so.id OR (sf.section_id IS NULL AND sf.subject_id = so.subject_id AND sf.instructor_id = so.instructor_id))
            AND sf.overall_rating IS NOT NULL
          ), 0) as avg_rating,
          COALESCE((
            SELECT COUNT(*)
            FROM subject_feedback sf
            WHERE (sf.section_id = so.id OR (sf.section_id IS NULL AND sf.subject_id = so.subject_id AND sf.instructor_id = so.instructor_id))
          ), 0) as response_count,
          COALESCE((
            SELECT COUNT(*)
            FROM subject_feedback sf
            WHERE (sf.section_id = so.id OR (sf.section_id IS NULL AND sf.subject_id = so.subject_id AND sf.instructor_id = so.instructor_id))
          ), 0) as total_responses
        FROM subject_offerings so
        LEFT JOIN evaluation_subjects es ON so.subject_id = es.id
        LEFT JOIN evaluation_forms ef ON ef.subject_id = so.subject_id AND ef.instructor_id = so.instructor_id AND ef.academic_year = so.academic_year AND ef.semester = so.semester
        LEFT JOIN Forms f ON ef.form_id = f.id
        LEFT JOIN course_management c ON so.program_id = c.id
        LEFT JOIN users u ON so.instructor_id = u.id
        LEFT JOIN instructors i ON u.id = i.user_id
        WHERE so.instructor_id = ?
        ORDER BY so.academic_year DESC, so.semester DESC, es.subject_code
      `;
      
      db.query(baseQuery, [userId], (err, results) => {
        if (err) {
          console.error("Error fetching instructor subjects:", err);
          return res.status(500).json({ success: false, message: "Failed to fetch subjects" });
        }
        
        // Get instructor details for the response
        const instructorQuery = `
          SELECT 
            u.id as user_id,
            u.full_name,
            u.email,
            i.department,
            i.school_role as instructor_id,
            i.image
          FROM users u
          LEFT JOIN instructors i ON u.id = i.user_id
          WHERE u.id = ?
        `;
        
        db.query(instructorQuery, [userId], (err2, instructorResults) => {
          if (err2) {
            console.error("Error fetching instructor details:", err2);
            return res.status(500).json({ success: false, message: "Failed to fetch instructor details" });
          }
          
          const instructor = instructorResults.length > 0 ? instructorResults[0] : null;
          
          // Log for debugging
          console.log("Instructor subjects query results:", {
            userId,
            acadYear,
            sem,
            totalResults: results.length,
            firstResult: results[0]
          });
          
          return res.status(200).json({ success: true, instructor, subjects: results });
        });
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
        ), 0) as subject_feedback_count,
        COALESCE((
          SELECT COUNT(*)
          FROM instructor_feedback ifb
          WHERE ifb.section_id = so.id
        ), 0) as instructor_feedback_count,
        COALESCE(
          (
            SELECT AVG(COALESCE(sf.overall_rating, 
              CAST(JSON_UNQUOTE(JSON_EXTRACT(sf.category_averages, '$.overall.average')) AS DECIMAL(10,2))
            ))
            FROM subject_feedback sf
            WHERE sf.section_id = so.id
          ),
          0
        ) as subject_avg,
        COALESCE(
          (
            SELECT AVG(COALESCE(ifb.overall_rating, 
              CAST(JSON_UNQUOTE(JSON_EXTRACT(ifb.category_averages, '$.overall.average')) AS DECIMAL(10,2))
            ))
            FROM instructor_feedback ifb
            WHERE ifb.section_id = so.id
          ),
          0
        ) as instructor_avg
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

/**
 * Get feedback category breakdown with rubric-style results
 * Separates instructor_feedback and subject_feedback data
 * Includes all categories and subcategories from the feedback template
 */
const getFeedbackCategoryBreakdown = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { feedback_type } = req.query; // 'instructor' or 'subject'
    
    // Get current settings
    const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
    const settings = await new Promise((resolve, reject) => {
      db.query(settingsQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    // Get subject info
    const subjectQuery = `
      SELECT 
        so.id as section_id,
        so.subject_id,
        es.subject_code,
        es.subject_name,
        so.section,
        so.year_level,
        so.instructor_id,
        u.full_name as instructor_name
      FROM subject_offerings so
      LEFT JOIN evaluation_subjects es ON so.subject_id = es.id
      LEFT JOIN users u ON so.instructor_id = u.id
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
      return res.status(200).json({ success: true, data: null });
    }
    
    const subject = subjectInfo[0];
    
    // Get feedback template categories (parent categories and subcategories)
    const categoriesQuery = `
      SELECT 
        c.id as category_id,
        c.category_name,
        c.parent_category_id,
        c.feedback_type
      FROM feedback_template_categories c
      WHERE c.is_active = 1
      ORDER BY c.parent_category_id IS NOT NULL, c.parent_category_id, c.display_order, c.id
    `;
    
    const templateCategories = await new Promise((resolve, reject) => {
      db.query(categoriesQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    // Separate parent categories and subcategories
    const parentCategories = templateCategories.filter(c => !c.parent_category_id);
    const subcategoriesByParent = {};
    templateCategories.filter(c => c.parent_category_id).forEach(cat => {
      if (!subcategoriesByParent[cat.parent_category_id]) {
        subcategoriesByParent[cat.parent_category_id] = [];
      }
      subcategoriesByParent[cat.parent_category_id].push(cat);
    });
    
    // Build results object
    const result = {
      section_id: subject.section_id,
      subject_code: subject.subject_code,
      subject_name: subject.subject_name,
      section: subject.section,
      year_level: subject.year_level,
      instructor_name: subject.instructor_name,
      categories_template: parentCategories.map(p => ({
        id: p.category_id,
        name: p.category_name,
        feedback_type: p.feedback_type,
        subcategories: subcategoriesByParent[p.category_id] || []
      })),
      instructor_breakdown: null,
      subject_breakdown: null
    };
    
    // Function to get category averages from feedback responses using category_averages JSON column
    const getCategoryAverages = async (tableName, feedbackType) => {
      // Get all responses for this section including category_averages
      const responsesQuery = `SELECT responses, overall_rating, category_averages FROM ${tableName} WHERE section_id = ?`;
      const responses = await new Promise((resolve, reject) => {
        db.query(responsesQuery, [subjectId], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      const totalResponses = responses.length;
      const overallSum = responses.reduce((sum, r) => sum + (parseFloat(r.overall_rating) || 0), 0);
      const overallAvg = totalResponses > 0 ? (overallSum / totalResponses).toFixed(2) : 'N/A';
      
      // Get feedback type filter value
      const typeFilter = feedbackType === 'instructor' ? 'instructor' : 'subject';
      
      // Get parent categories filtered by feedback type (these are the ones stored in category_averages)
      const filteredParentCategories = parentCategories.filter(cat => 
        cat.feedback_type === typeFilter || cat.feedback_type === 'both'
      );
      
      // Build a mapping from category ID to category name for this feedback type
      // Note: templateCategories uses 'category_id' from the query alias, not 'id'
      const categoryIdToName = {};
      const categoryNameToId = {};
      filteredParentCategories.forEach(cat => {
        const catId = cat.category_id || cat.id;
        categoryIdToName[catId] = cat.category_name;
        categoryNameToId[cat.category_name] = catId;
      });
      
      // Initialize all parent categories from categories_template with null
      // Use parentCategories to get all main categories displayed in the template
      const categorySums = {};
      parentCategories.forEach(cat => {
        categorySums[cat.category_name] = null;
      });
      
      // Process responses - use category_averages JSON if available
      responses.forEach(response => {
        try {
          // Try to use category_averages JSON column first
          if (response.category_averages) {
            const catAvgs = typeof response.category_averages === 'string' 
              ? JSON.parse(response.category_averages) 
              : response.category_averages;
            
            if (catAvgs && typeof catAvgs === 'object') {
              Object.entries(catAvgs).forEach(([key, value]) => {
                // Skip 'overall' key
                if (key === 'overall') return;
                
                // The key is a category ID (e.g., "64", "65")
                // The value is an object with: name, average, count, questions
                const keyNum = parseInt(key);
                
                if (!isNaN(keyNum) && typeof value === 'object' && value !== null) {
                  // Use the name directly from category_averages
                  const catName = value.name;
                  const avgValue = value.average;
                  
                  if (catName && avgValue !== undefined && typeof avgValue === 'number') {
                    if (categorySums[catName] === null) {
                      categorySums[catName] = { sum: avgValue, count: 1 };
                    } else {
                      categorySums[catName].sum += avgValue;
                      categorySums[catName].count += 1;
                    }
                  }
                }
              });
            }
          }
          // Fallback to questions if category_averages is not available
          else if (response.responses) {
            const parsed = typeof response.responses === 'string' ? JSON.parse(response.responses) : response.responses;
            if (parsed && parsed.questions) {
              // Map questions to parent categories by index order
              const questionKeys = Object.keys(parsed.questions).sort();
              questionKeys.forEach((qKey, index) => {
                if (index < filteredParentCategories.length) {
                  const value = parsed.questions[qKey];
                  if (typeof value === 'number') {
                    const catName = filteredParentCategories[index].category_name;
                    if (categorySums[catName] === null) {
                      categorySums[catName] = { sum: value, count: 1 };
                    } else {
                      categorySums[catName].sum += value;
                      categorySums[catName].count += 1;
                    }
                  }
                }
              });
            }
          }
        } catch (e) {}
      });
      
      // Calculate averages for each category
      const categories = {};
      let totalCatAvg = 0;
      let catCount = 0;
      
      Object.keys(categorySums).forEach(catName => {
        const data = categorySums[catName];
        if (data !== null) {
          const avg = data.sum / data.count;
          categories[catName] = parseFloat(avg.toFixed(2));
          totalCatAvg += avg;
          catCount++;
        } else {
          categories[catName] = null;
        }
      });
      
      // Calculate overall from categories
      const calculatedOverall = catCount > 0 ? (totalCatAvg / catCount).toFixed(2) : overallAvg;
      
      return {
        total_responses: totalResponses,
        overall_average: calculatedOverall,
        categories: categories
      };
    };
    
    // Get instructor feedback breakdown
    if (!feedback_type || feedback_type === 'instructor') {
      result.instructor_breakdown = await getCategoryAverages('instructor_feedback', 'instructor');
    }
    
    // Get subject feedback breakdown
    if (!feedback_type || feedback_type === 'subject') {
      result.subject_breakdown = await getCategoryAverages('subject_feedback', 'subject');
    }
    
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Get feedback category breakdown error:", error);
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
  getEvaluationResultsBySection,
  getFeedbackCategoryBreakdown
};
