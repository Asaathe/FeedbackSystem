// Subject Evaluation Controller
// Handles instructor course assignments and student enrollments
const db = require("../config/database");

/**
 * Get all instructor courses
 */
const getInstructorCourses = async (req, res) => {
  try {
    const query = `
      SELECT 
        ic.id,
        ic.instructor_id,
        ic.subject_id,
        s.subject_code,
        s.subject_name,
        s.department,
        s.units,
        u.full_name as instructor_name
      FROM instructor_courses ic
      INNER JOIN subjects s ON ic.subject_id = s.id
      LEFT JOIN users u ON ic.instructor_id = u.id
      WHERE s.status = 'active'
      ORDER BY s.subject_code
    `;
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching instructor courses:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch instructor courses" });
      }
      return res.status(200).json({ success: true, courses: results });
    });
  } catch (error) {
    console.error("Get instructor courses error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Assign instructor to a subject
 */
const assignInstructorToSubject = async (req, res) => {
  try {
    const { instructor_id, subject_id, course_section_id } = req.body;
    
    // Support both subject_id and course_section_id
    const subjectId = subject_id || course_section_id;
    
    if (!instructor_id || !subjectId) {
      return res.status(400).json({ 
        success: false, 
        message: "Instructor ID and Subject ID are required" 
      });
    }

    // Check if assignment already exists
    const checkQuery = "SELECT id FROM instructor_courses WHERE instructor_id = ? AND subject_id = ?";
    db.query(checkQuery, [instructor_id, subjectId], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking existing assignment:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (checkResults.length > 0) {
        return res.status(400).json({ success: false, message: "Instructor already assigned to this subject" });
      }

      // Insert the assignment
      const insertQuery = "INSERT INTO instructor_courses (instructor_id, subject_id) VALUES (?, ?)";
      db.query(insertQuery, [instructor_id, subjectId], (insertErr, result) => {
        if (insertErr) {
          console.error("Error assigning instructor:", insertErr);
          return res.status(500).json({ success: false, message: "Failed to assign instructor" });
        }
        
        // Note: instructor_courses table tracks assignments - subjects table has no instructor_id
        
        return res.status(201).json({ success: true, message: "Instructor assigned successfully" });
      });
    });
  } catch (error) {
    console.error("Assign instructor error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get subjects for the logged-in student
 */
const getMySubjects = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current semester and academic year from settings
    const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
    let semester = '1st Semester';
    let academicYear = '2025-2026';
    
    db.query(settingsQuery, (settingsErr, settingsResults) => {
      if (settingsErr) {
        console.error("Error fetching settings:", settingsErr);
      } else if (settingsResults.length > 0) {
        settingsResults.forEach((setting) => {
          if (setting.setting_key === 'current_semester') {
            semester = setting.setting_value;
          } else if (setting.setting_key === 'current_academic_year') {
            academicYear = setting.setting_value;
          }
        });
      }
      
      // Now get the student's enrolled subjects with instructor info
      const query = `
        SELECT 
          s.id as subject_id,
          s.subject_code,
          s.subject_name,
          s.department,
          s.units,
          se.id as enrollment_id,
          se.student_id,
          se.status as enrollment_status,
          se.created_at as enrolled_at,
          COALESCE(si.id, ic.id) as subject_instructor_id,
          COALESCE(inst.id, inst2.id) as instructor_record_id,
          COALESCE(si.instructor_id, ic.instructor_id) as instructor_user_id,
          COALESCE(u.full_name, u2.full_name, usr.full_name) as instructor_name,
          COALESCE(u.email, u2.email, usr.email) as instructor_email,
          COALESCE(inst.department, inst2.department) as instructor_department,
          COALESCE(inst.image, inst2.image) as instructor_image
        FROM student_enrollments se
        INNER JOIN subjects s ON se.subject_id = s.id
        -- Try subject_instructors first (si.instructor_id is a user_id)
        LEFT JOIN subject_instructors si ON s.id = si.subject_id
        LEFT JOIN instructors inst ON si.instructor_id = inst.user_id
        LEFT JOIN users u ON inst.user_id = u.id
        -- Also try instructor_courses (ic.instructor_id is a user_id)
        LEFT JOIN instructor_courses ic ON s.id = ic.subject_id
        LEFT JOIN instructors inst2 ON ic.instructor_id = inst2.user_id
        LEFT JOIN users u2 ON inst2.user_id = u2.id
        -- Also try direct user lookup for cases where instructor_id is a user_id
        LEFT JOIN users usr ON COALESCE(si.instructor_id, ic.instructor_id) = usr.id
        WHERE se.student_id = ? 
          AND se.status = 'enrolled'
          AND s.status = 'active'
        ORDER BY s.subject_code
      `;
      
      console.log("=== getMySubjects Debug ===");
      console.log("UserId:", userId);
      console.log("Semester:", semester, "Academic Year:", academicYear);
      console.log("Query:", query);
      
      db.query(query, [userId], (err, results) => {
        if (err) {
          console.error("Error fetching student subjects:", err);
          return res.status(500).json({ success: false, message: "Failed to fetch subjects" });
        }
        
        console.log("Query results:", results);
        
        if (results && results.length > 0) {
          console.log("First result instructor fields:", {
            instructor_id: results[0].instructor_user_id,
            instructor_record_id: results[0].instructor_record_id,
            instructor_name: results[0].instructor_name,
            instructor_image: results[0].instructor_image,
            subject_instructor_id: results[0].subject_instructor_id
          });
        }
        
        // Transform results to match frontend interface
        const subjects = results.map((row) => ({
          subject_id: row.subject_id,
          subject_code: row.subject_code,
          subject_name: row.subject_name,
          department: row.department,
          units: row.units,
          subject_instructor_id: row.subject_instructor_id || null,
          semester: semester,
          academic_year: academicYear,
          course_section_id: row.subject_id,
          instructor_id: row.instructor_user_id || row.instructor_record_id || null,
          instructor_name: row.instructor_name || null,
          instructor_email: row.instructor_email || null,
          instructor_department: row.instructor_department || null,
          instructor_image: row.instructor_image || null,
          enrollment_id: row.enrollment_id,
          enrolled_at: row.enrolled_at
        }));
        
        return res.status(200).json({ success: true, subjects, debug: { instructor_image: results[0]?.instructor_image } });
      });
    });
  } catch (error) {
    console.error("Get my subjects error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Remove instructor from a subject
 */
const removeInstructorFromSubject = async (req, res) => {
  try {
    const { id } = req.params;

    // First get the subject_id to update the subjects table
    const selectQuery = "SELECT subject_id, instructor_id FROM instructor_courses WHERE id = ?";
    db.query(selectQuery, [id], (err, results) => {
      if (err) {
        console.error("Error fetching assignment:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }

      const { subject_id, instructor_id } = results[0];

      // Delete the assignment
      const deleteQuery = "DELETE FROM instructor_courses WHERE id = ?";
      db.query(deleteQuery, [id], (deleteErr) => {
        if (deleteErr) {
          console.error("Error removing instructor:", deleteErr);
          return res.status(500).json({ success: false, message: "Failed to remove instructor" });
        }

        // Update the subjects table to remove instructor_id if it matches
        const updateQuery = "UPDATE subjects SET instructor_id = NULL WHERE id = ? AND instructor_id = ?";
        db.query(updateQuery, [subject_id, instructor_id], (updateErr) => {
          if (updateErr) {
            console.error("Error updating subject:", updateErr);
          }
        });

        return res.status(200).json({ success: true, message: "Instructor removed successfully" });
      });
    });
  } catch (error) {
    console.error("Remove instructor error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get all student enrollments
 */
const getStudentEnrollments = async (req, res) => {
  try {
    const query = `
      SELECT 
        se.id,
        se.student_id,
        se.subject_id,
        se.status,
        se.created_at,
        s.subject_code,
        s.subject_name,
        s.department,
        u.full_name as student_name,
        u.email as student_email,
        st.studentID
      FROM student_enrollments se
      INNER JOIN subjects s ON se.subject_id = s.id
      INNER JOIN users u ON se.student_id = u.id
      LEFT JOIN students st ON u.id = st.user_id
      WHERE se.status = 'enrolled' AND s.status = 'active'
      ORDER BY s.subject_code, u.full_name
    `;
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching student enrollments:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch enrollments" });
      }
      return res.status(200).json({ success: true, enrollments: results });
    });
  } catch (error) {
    console.error("Get enrollments error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Enroll a student in a subject
 */
const enrollStudent = async (req, res) => {
  try {
    const { student_id, subject_id, subject_instructor_id, course_section_id } = req.body;
    
    // Support both subject_id and course_section_id
    const subjectId = subject_id || course_section_id;

    if (!student_id || !subjectId) {
      return res.status(400).json({ 
        success: false, 
        message: "Student ID and Subject ID are required" 
      });
    }

    // Check if enrollment already exists
    const checkQuery = "SELECT id FROM student_enrollments WHERE student_id = ? AND subject_id = ? AND status = 'enrolled'";
    db.query(checkQuery, [student_id, subjectId], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking existing enrollment:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (checkResults.length > 0) {
        return res.status(400).json({ success: false, message: "Student already enrolled in this subject" });
      }

      // Insert the enrollment
      const insertQuery = "INSERT INTO student_enrollments (student_id, subject_id, status) VALUES (?, ?, 'enrolled')";
      db.query(insertQuery, [student_id, subjectId], (insertErr, result) => {
        if (insertErr) {
          console.error("Error enrolling student:", insertErr);
          return res.status(500).json({ success: false, message: "Failed to enroll student" });
        }
        return res.status(201).json({ success: true, message: "Student enrolled successfully" });
      });
    });
  } catch (error) {
    console.error("Enroll student error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Unenroll a student from a subject
 */
const unenrollStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete - update status to unenrolled
    const query = "UPDATE student_enrollments SET status = 'unenrolled' WHERE id = ?";
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error("Error unenrolling student:", err);
        return res.status(500).json({ success: false, message: "Failed to unenroll student" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Enrollment not found" });
      }

      return res.status(200).json({ success: true, message: "Student unenrolled successfully" });
    });
  } catch (error) {
    console.error("Unenroll student error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get all instructors (for subject-evaluation.tsx)
 */
const getAllInstructors = async (req, res) => {
  try {
    // Get all users with instructor role joined with instructors table
    const query = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        i.department,
        i.instructor_id,
        i.image,
        i.school_role
      FROM users u
      LEFT JOIN instructors i ON u.id = i.user_id
      WHERE u.role = 'instructor'
      ORDER BY u.full_name
    `;
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching instructors:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch instructors" });
      }
      
      console.log("Found instructors:", results.length);
      console.log("Instructors data:", JSON.stringify(results));
      
      // Get subject counts from instructor_courses table
      const subjectCountQuery = `
        SELECT instructor_id, COUNT(*) as total_subjects 
        FROM instructor_courses 
        GROUP BY instructor_id
      `;
      db.query(subjectCountQuery, (countErr, subjectCounts) => {
        if (countErr) {
          console.error("Error fetching subject counts:", countErr);
        }
        console.log("Subject counts:", subjectCounts);
        
        // Get feedback counts from Form_Responses table
        const feedbackCountQuery = `
          SELECT user_id as instructor_id, COUNT(*) as total_feedbacks 
          FROM Form_Responses 
          GROUP BY user_id
        `;
        db.query(feedbackCountQuery, (fbErr, feedbackCounts) => {
          if (fbErr) {
            console.error("Error fetching feedback counts:", fbErr);
            feedbackCounts = [];
          }
          console.log("Feedback counts:", feedbackCounts);
          
          // Use overall rating from responses if available
          const avgRatings = [];
          
          // Merge all data
          const subjectCountMap = new Map((subjectCounts || []).map(sc => [sc.instructor_id, sc.total_subjects]));
          const feedbackCountMap = new Map((feedbackCounts || []).map(fc => [fc.instructor_id, fc.total_feedbacks]));
          const avgRatingMap = new Map((avgRatings || []).map(ar => [ar.instructor_id, parseFloat(ar.avg_rating) || 0]));
          
          const enrichedInstructors = results.map(instructor => ({
            ...instructor,
            total_subjects: subjectCountMap.get(instructor.user_id) || 0,
            total_feedbacks: feedbackCountMap.get(instructor.user_id) || 0,
            avg_rating: avgRatingMap.get(instructor.user_id) || 0
          }));
          
          console.log("Enriched instructors:", JSON.stringify(enrichedInstructors));
          return res.status(200).json({ success: true, instructors: enrichedInstructors });
        });
      });
    });
  } catch (error) {
    console.error("Get all instructors error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get subjects assigned to a specific instructor
 */
const getInstructorSubjects = async (req, res) => {
  try {
    const { instructorId } = req.params;
    
    const query = `
      SELECT 
        ic.id,
        ic.instructor_id,
        ic.subject_id as section_id,
        s.subject_code,
        s.subject_name,
        s.department,
        s.units,
        s.status,
        '-' as section,
        '1' as year_level,
        (SELECT COUNT(*) FROM student_enrollments se WHERE se.subject_id = s.id AND se.status = 'enrolled') as student_count,
        0 as feedback_count,
        0 as avg_rating
      FROM instructor_courses ic
      INNER JOIN subjects s ON ic.subject_id = s.id
      WHERE ic.instructor_id = ?
      ORDER BY s.subject_code
    `;
    db.query(query, [instructorId], (err, results) => {
      if (err) {
        console.error("Error fetching instructor subjects:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch instructor subjects" });
      }
      return res.status(200).json({ success: true, subjects: results });
    });
  } catch (error) {
    console.error("Get instructor subjects error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get all subject-instructors (for EvaluationTargetSelector.tsx)
 */
const getSubjectInstructors = async (req, res) => {
  try {
    // First, try subject_instructors table with debug
    const debugQuery = `SELECT si.*, s.subject_code, s.subject_name, s.id as s_id FROM subject_instructors si LEFT JOIN subjects s ON si.subject_id = s.id`;
    
    db.query(debugQuery, (debugErr, debugResults) => {
      if (debugErr) {
        console.error("Debug query error:", debugErr);
      } else {
        console.log("Subject instructors debug:", debugResults);
      }
    });
    
    // Get subject-instructors with subject and instructor details
    // Note: Using evaluation_subjects table for proper subject data
    const query = `
      SELECT DISTINCT
        si.id,
        si.subject_id,
        COALESCE(es.subject_name, CONCAT('Subject ', si.subject_id)) as subject_name,
        COALESCE(es.subject_code, 'N/A') as subject_code,
        si.instructor_id,
        u.full_name as instructor_name,
        COALESCE(si.semester, '1st Semester') as semester,
        COALESCE(si.academic_year, '2025-2026') as academic_year,
        '' as course_section
      FROM subject_instructors si
      LEFT JOIN users u ON si.instructor_id = u.id
      LEFT JOIN evaluation_subjects es ON si.subject_id = es.id
      ORDER BY es.subject_code, u.full_name
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching subject-instructors:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch subject-instructors" });
      }
      
      console.log("Subject-instructors data:", results);
      
      // If no results from subject_instructors, try instructor_courses as fallback
      if (results.length === 0) {
        const fallbackQuery = `
          SELECT DISTINCT
            ic.id,
            ic.subject_id,
            COALESCE(es.subject_name, CONCAT('Subject ', ic.subject_id)) as subject_name,
            COALESCE(es.subject_code, 'N/A') as subject_code,
            ic.instructor_id,
            u.full_name as instructor_name,
            '1st Semester' as semester,
            '2025-2026' as academic_year,
            '' as course_section
          FROM instructor_courses ic
          LEFT JOIN users u ON ic.instructor_id = u.id
          LEFT JOIN evaluation_subjects es ON ic.subject_id = es.id
          ORDER BY es.subject_code, u.full_name
        `;
        
        db.query(fallbackQuery, (fallbackErr, fallbackResults) => {
          if (fallbackErr) {
            console.error("Fallback query error:", fallbackErr);
            return res.status(200).json({ success: true, subjectInstructors: [] });
          }
          console.log("Fallback (instructor_courses) data:", fallbackResults);
          return res.status(200).json({ success: true, subjectInstructors: fallbackResults });
        });
      } else {
        return res.status(200).json({ success: true, subjectInstructors: results });
      }
    });
  } catch (error) {
    console.error("Get subject-instructors error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Search subjects by code or name (for searchable dropdown)
 */
const searchSubjects = async (req, res) => {
  try {
    const { search } = req.query;
    const searchTerm = search || '';
    
    // Get subjects with their assigned instructors
    const query = `
      SELECT DISTINCT
        s.id as subject_id,
        s.subject_code,
        s.subject_name,
        s.department,
        s.units,
        COALESCE(si.instructor_id, ic.instructor_id) as instructor_id,
        COALESCE(u.full_name, u2.full_name) as instructor_name,
        COALESCE(si.semester, '1st Semester') as semester,
        COALESCE(si.academic_year, '2025-2026') as academic_year,
        COUNT(DISTINCT se.student_id) as enrolled_students_count
      FROM subjects s
      LEFT JOIN subject_instructors si ON s.id = si.subject_id
      LEFT JOIN users u ON si.instructor_id = u.id
      LEFT JOIN instructor_courses ic ON s.id = ic.subject_id
      LEFT JOIN users u2 ON ic.instructor_id = u2.id
      LEFT JOIN student_enrollments se ON s.id = se.subject_id AND se.status = 'enrolled'
      WHERE s.status = 'active'
        AND (
          s.subject_code LIKE ? 
          OR s.subject_name LIKE ?
        )
      GROUP BY s.id, s.subject_code, s.subject_name, s.department, s.units, 
               si.instructor_id, ic.instructor_id, u.full_name, u2.full_name,
               si.semester, si.academic_year
      ORDER BY s.subject_code
      LIMIT 50
    `;
    
    const searchPattern = `%${searchTerm}%`;
    db.query(query, [searchPattern, searchPattern], (err, results) => {
      if (err) {
        console.error("Error searching subjects:", err);
        return res.status(500).json({ success: false, message: "Failed to search subjects" });
      }
      
      console.log("Search subjects results:", results.length);
      return res.status(200).json({ success: true, subjects: results });
    });
  } catch (error) {
    console.error("Search subjects error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get instructor details with their subjects (for instructor evaluation)
 */
const getInstructorDetails = async (req, res) => {
  try {
    const { instructorId } = req.params;
    
    if (!instructorId) {
      return res.status(400).json({ success: false, message: "Instructor ID is required" });
    }
    
    // Get instructor details
    const instructorQuery = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        i.department,
        i.instructor_id,
        i.image
      FROM users u
      LEFT JOIN instructors i ON u.id = i.user_id
      WHERE u.id = ? AND u.role = 'instructor'
    `;
    
    db.query(instructorQuery, [instructorId], (err, instructorResults) => {
      if (err) {
        console.error("Error fetching instructor details:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch instructor" });
      }
      
      if (instructorResults.length === 0) {
        return res.status(404).json({ success: false, message: "Instructor not found" });
      }
      
      const instructor = instructorResults[0];
      
      // Get all subjects handled by this instructor
      const subjectsQuery = `
        SELECT 
          s.id as subject_id,
          s.subject_code,
          s.subject_name,
          s.department,
          s.units,
          COALESCE(si.semester, '1st Semester') as semester,
          COALESCE(si.academic_year, '2025-2026') as academic_year,
          COUNT(DISTINCT se.student_id) as enrolled_students_count
        FROM subjects s
        LEFT JOIN subject_instructors si ON s.id = si.subject_id AND si.instructor_id = ?
        LEFT JOIN instructor_courses ic ON s.id = ic.subject_id AND ic.instructor_id = ?
        LEFT JOIN student_enrollments se ON s.id = se.subject_id AND se.status = 'enrolled'
        WHERE s.status = 'active'
          AND (
            si.instructor_id = ? 
            OR ic.instructor_id = ?
          )
        GROUP BY s.id, s.subject_code, s.subject_name, s.department, s.units, si.semester, si.academic_year
        ORDER BY s.subject_code
      `;
      
      db.query(subjectsQuery, [instructorId, instructorId, instructorId, instructorId], (subjectErr, subjectResults) => {
        if (subjectErr) {
          console.error("Error fetching instructor subjects:", subjectErr);
          return res.status(500).json({ success: false, message: "Failed to fetch subjects" });
        }
        
        // Calculate total enrolled students across all subjects
        const totalStudents = subjectResults.reduce((sum, s) => sum + (s.enrolled_students_count || 0), 0);
        
        return res.status(200).json({ 
          success: true, 
          instructor: {
            ...instructor,
            total_subjects: subjectResults.length,
            total_enrolled_students: totalStudents
          },
          subjects: subjectResults 
        });
      });
    });
  } catch (error) {
    console.error("Get instructor details error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get students by selected subject (for subject evaluation)
 */
const getStudentsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.body;
    
    if (!subjectId) {
      return res.status(400).json({ success: false, message: "Subject ID is required" });
    }
    
    console.log("Getting students for subject:", subjectId);
    
    const query = `
      SELECT DISTINCT 
        u.id,
        u.full_name,
        u.email,
        COALESCE(cm.course_section, 'N/A') as course_section,
        COALESCE(cm.department, 'N/A') as department
      FROM student_enrollments se
      INNER JOIN users u ON se.student_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN course_management cm ON s.program_id = cm.id
      WHERE se.subject_id = ?
        AND se.status = 'enrolled'
      ORDER BY u.full_name
    `;
    
    db.query(query, [subjectId], (err, results) => {
      if (err) {
        console.error("Error fetching students by subject:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch students" });
      }
      
      console.log("Students by subject:", results.length);
      return res.status(200).json({ success: true, students: results });
    });
  } catch (error) {
    console.error("Get students by subject error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get students by instructor (for instructor evaluation)
 */
const getStudentsByInstructor = async (req, res) => {
  try {
    const { instructorId } = req.body;
    
    if (!instructorId) {
      return res.status(400).json({ success: false, message: "Instructor ID is required" });
    }
    
    console.log("Getting students for instructor:", instructorId);
    
    // Get students enrolled in subjects taught by this instructor
    const query = `
      SELECT DISTINCT 
        u.id,
        u.full_name,
        u.email,
        COALESCE(cm.course_section, 'N/A') as course_section,
        COALESCE(cm.department, 'N/A') as department
      FROM student_enrollments se
      INNER JOIN users u ON se.student_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN course_management cm ON s.program_id = cm.id
      WHERE se.subject_id IN (
        SELECT subject_id FROM subject_instructors WHERE instructor_id = ?
        UNION
        SELECT subject_id FROM instructor_courses WHERE instructor_id = ?
      )
        AND se.status = 'enrolled'
      ORDER BY u.full_name
    `;
    
    db.query(query, [instructorId, instructorId], (err, results) => {
      if (err) {
        console.error("Error fetching students by instructor:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch students" });
      }
      
      console.log("Students by instructor:", results.length);
      return res.status(200).json({ success: true, students: results });
    });
  } catch (error) {
    console.error("Get students by instructor error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get students by selected subject-instructor targets (for recipient selection in form builder)
 */
const getStudentsByTargets = async (req, res) => {
  try {
    const { targetIds, evaluationType, academicYear, semester } = req.body;
    
    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      return res.status(400).json({ success: false, message: "Target IDs are required" });
    }
    
    if (!evaluationType) {
      return res.status(400).json({ success: false, message: "Evaluation type is required" });
    }
    
    console.log("Getting students for targets:", { targetIds, evaluationType, academicYear, semester });
    
    if (evaluationType === 'subject') {
      // Get students enrolled in the selected subjects
      // First get the subject_ids from the selected subject_instructors
      const subjectIdsQuery = `
        SELECT DISTINCT subject_id FROM subject_instructors WHERE id IN (?)
        UNION
        SELECT DISTINCT subject_id FROM instructor_courses WHERE id IN (?)
      `;
      
      db.query(subjectIdsQuery, [targetIds, targetIds], (err, subjectIdResults) => {
        if (err) {
          console.error("Error getting subject IDs:", err);
          return res.status(500).json({ success: false, message: "Failed to fetch students" });
        }
        
        const subjectIdList = subjectIdResults.map(r => r.subject_id);
        console.log("Subject IDs:", subjectIdList);
        
        if (subjectIdList.length === 0) {
          return res.status(200).json({ success: true, students: [] });
        }
        
        // Now get students enrolled in those subjects - join with students table for course info
        const studentQuery = `
          SELECT DISTINCT 
            u.id,
            u.full_name,
            u.email,
            COALESCE(cm.course_section, 'N/A') as course_section,
            COALESCE(cm.department, 'N/A') as department
          FROM student_enrollments se
          INNER JOIN users u ON se.student_id = u.id
          LEFT JOIN students s ON u.id = s.user_id
          LEFT JOIN course_management cm ON s.program_id = cm.id
          WHERE se.subject_id IN (?)
          AND se.status = 'enrolled'
          ORDER BY u.full_name
        `;
        
        db.query(studentQuery, [subjectIdList], (studentErr, studentResults) => {
          if (studentErr) {
            console.error("Error fetching students by subject:", studentErr);
            return res.status(500).json({ success: false, message: "Failed to fetch students" });
          }
          
          console.log("Students by subject:", studentResults);
          return res.status(200).json({ success: true, students: studentResults });
        });
      });
    } else if (evaluationType === 'instructor') {
      // Get students enrolled in subjects taught by the selected instructors
      // First get instructor_ids from the selected targets
      const instructorIdsQuery = `
        SELECT DISTINCT instructor_id FROM subject_instructors WHERE id IN (?)
        UNION
        SELECT DISTINCT instructor_id FROM instructor_courses WHERE id IN (?)
      `;
      
      db.query(instructorIdsQuery, [targetIds, targetIds], (err, instructorIdResults) => {
        if (err) {
          console.error("Error getting instructor IDs:", err);
          return res.status(500).json({ success: false, message: "Failed to fetch students" });
        }
        
        const instructorIdList = instructorIdResults.map(r => r.instructor_id);
        console.log("Instructor IDs:", instructorIdList);
        
        if (instructorIdList.length === 0) {
          return res.status(200).json({ success: true, students: [] });
        }
        
        // Now get students enrolled in subjects taught by these instructors
        const studentQuery = `
          SELECT DISTINCT 
            u.id,
            u.full_name,
            u.email,
            COALESCE(cm.course_section, 'N/A') as course_section,
            COALESCE(cm.department, 'N/A') as department
          FROM student_enrollments se
          INNER JOIN users u ON se.student_id = u.id
          LEFT JOIN students s ON u.id = s.user_id
          LEFT JOIN course_management cm ON s.program_id = cm.id
          WHERE se.subject_id IN (
            SELECT subject_id FROM subject_instructors WHERE instructor_id IN (?)
            UNION
            SELECT subject_id FROM instructor_courses WHERE instructor_id IN (?)
          )
          AND se.status = 'enrolled'
          ORDER BY u.full_name
        `;
        
        db.query(studentQuery, [instructorIdList, instructorIdList], (studentErr, studentResults) => {
          if (studentErr) {
            console.error("Error fetching students by instructor:", studentErr);
            return res.status(500).json({ success: false, message: "Failed to fetch students" });
          }
          
          console.log("Students by instructor:", studentResults);
          return res.status(200).json({ success: true, students: studentResults });
        });
      });
    } else {
      // Get students enrolled in subjects taught by the selected instructors
      // First get instructor_ids from the selected targets
      const instructorIdsQuery = `
        SELECT DISTINCT instructor_id FROM subject_instructors WHERE id IN (?)
        UNION
        SELECT DISTINCT instructor_id FROM instructor_courses WHERE id IN (?)
      `;
      
      db.query(instructorIdsQuery, [targetIds, targetIds], (err, instructorIdResults) => {
        if (err) {
          console.error("Error getting instructor IDs:", err);
          return res.status(500).json({ success: false, message: "Failed to fetch students" });
        }
        
        const instructorIdList = instructorIdResults.map(r => r.instructor_id);
        console.log("Instructor IDs:", instructorIdList);
        
        if (instructorIdList.length === 0) {
          return res.status(200).json({ success: true, students: [] });
        }
        
        // Now get students enrolled in subjects taught by these instructors
        const studentQuery = `
          SELECT DISTINCT 
            u.id,
            u.full_name,
            u.email,
            COALESCE(cm.course_section, 'N/A') as course_section,
            COALESCE(cm.department, 'N/A') as department
          FROM student_enrollments se
          INNER JOIN users u ON se.student_id = u.id
          LEFT JOIN students s ON u.id = s.user_id
          LEFT JOIN course_management cm ON s.program_id = cm.id
          WHERE se.subject_id IN (
            SELECT subject_id FROM subject_instructors WHERE instructor_id IN (?)
            UNION
            SELECT subject_id FROM instructor_courses WHERE instructor_id IN (?)
          )
          AND se.status = 'enrolled'
          ORDER BY u.full_name
        `;
        
        db.query(studentQuery, [instructorIdList, instructorIdList], (studentErr, studentResults) => {
          if (studentErr) {
            console.error("Error fetching students by instructor:", studentErr);
            return res.status(500).json({ success: false, message: "Failed to fetch students" });
          }
          
          console.log("Students by instructor:", studentResults);
          return res.status(200).json({ success: true, students: studentResults });
        });
      });
    }
  } catch (error) {
    console.error("Get students by targets error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Assign form to subject (for evaluation form deployment)
 * Accepts either subject_id or subject_instructor_id
 */
const assignFormToSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { form_id, subject_id, subject_instructor_id, evaluation_type, start_date, end_date } = req.body;
    
    if (!form_id) {
      return res.status(400).json({ success: false, message: "Form ID is required" });
    }
    
    let targetSubjectId = subject_id ? parseInt(subject_id) : null;
    let targetSubjectInstructorId = subject_instructor_id ? parseInt(subject_instructor_id) : (id ? parseInt(id) : null);
    
    console.log("Assigning form to subject:", { targetSubjectId, targetSubjectInstructorId, form_id, evaluation_type });
    console.log("🔍 [assignFormToSubject] Request params:", req.params);
    console.log("🔍 [assignFormToSubject] Request body:", req.body);
    
    // If we have subject_id but not subject_instructor_id, we need to find the subject_instructor
    if (targetSubjectId && !targetSubjectInstructorId) {
      // First check if this is a subject_instructor ID passed as id param
      const checkSubjectInstructorQuery = "SELECT * FROM subject_instructors WHERE id = ?";
      db.query(checkSubjectInstructorQuery, [targetSubjectId], (err, siResults) => {
        if (err) {
          console.error("Error checking subject_instructor:", err);
          return res.status(500).json({ success: false, message: "Database error" });
        }
        
        if (siResults.length > 0) {
          // The id is actually a subject_instructor_id
          targetSubjectInstructorId = targetSubjectId;
          targetSubjectId = siResults[0].subject_id;
          proceedWithAssignment();
        } else {
          // The id is a subject_id - need to find corresponding subject_instructor
          const findSubjectInstructorQuery = "SELECT * FROM subject_instructors WHERE subject_id = ? LIMIT 1";
          db.query(findSubjectInstructorQuery, [targetSubjectId], (findErr, findResults) => {
            if (findErr) {
              console.error("Error finding subject_instructor:", findErr);
              return res.status(500).json({ success: false, message: "Database error" });
            }
            
            if (findResults.length === 0) {
              // No subject_instructor exists for this subject - create a temporary mapping
              // We'll use the subject_id directly in the assignment table
              console.log("No subject_instructor found, using subject_id directly");
              targetSubjectInstructorId = null;
              proceedWithAssignment();
            } else {
              targetSubjectInstructorId = findResults[0].id;
              proceedWithAssignment();
            }
          });
        }
      });
    } else {
      // We have subject_instructor_id directly (either from body or id param)
      proceedWithAssignment();
    }
    
    function proceedWithAssignment() {
      // Insert the assignment - store both subject_id and subject_instructor_id for reference
      const insertQuery = `
        INSERT INTO subject_evaluation_forms 
        (subject_id, subject_instructor_id, form_id, evaluation_type, start_date, end_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
          subject_instructor_id = VALUES(subject_instructor_id),
          evaluation_type = VALUES(evaluation_type),
          start_date = VALUES(start_date),
          end_date = VALUES(end_date)
      `;
      
      db.query(insertQuery, [targetSubjectId, targetSubjectInstructorId, form_id, evaluation_type || 'both', start_date, end_date], (insertErr) => {
        if (insertErr) {
          console.error("Error assigning form:", insertErr);
          // If table doesn't exist, try creating it
          if (insertErr.code === 'ER_NO_SUCH_TABLE') {
            return createAssignmentTableAndRetry(req, res, targetSubjectId, targetSubjectInstructorId, form_id, evaluation_type, start_date, end_date);
          }
          return res.status(500).json({ success: false, message: "Failed to assign form" });
        }
        
        return res.status(200).json({ success: true, message: "Form assigned successfully" });
      });
    }
  } catch (error) {
    console.error("Assign form to subject error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Helper function to create table if it doesn't exist
const createAssignmentTableAndRetry = async (req, res, subjectId, subjectInstructorId, form_id, evaluation_type, start_date, end_date) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS subject_evaluation_forms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject_id INT,
      subject_instructor_id INT,
      form_id INT NOT NULL,
      evaluation_type VARCHAR(20) DEFAULT 'both',
      start_date DATE,
      end_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_assignment (subject_id, subject_instructor_id, form_id)
    )
  `;
  
  db.query(createTableQuery, (createErr) => {
    if (createErr) {
      console.error("Error creating table:", createErr);
      return res.status(500).json({ success: false, message: "Failed to create assignment table" });
    }
    
    // Retry the insert
    const insertQuery = `
      INSERT INTO subject_evaluation_forms 
      (subject_id, subject_instructor_id, form_id, evaluation_type, start_date, end_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        evaluation_type = VALUES(evaluation_type),
        start_date = VALUES(start_date),
        end_date = VALUES(end_date)
    `;
    
    db.query(insertQuery, [subjectId, subjectInstructorId, form_id, evaluation_type || 'both', start_date, end_date], (insertErr) => {
      if (insertErr) {
        console.error("Error assigning form (retry):", insertErr);
        return res.status(500).json({ success: false, message: "Failed to assign form" });
      }
      
      return res.status(200).json({ success: true, message: "Form assigned successfully" });
    });
  });
};

module.exports = {
  getInstructorCourses,
  assignInstructorToSubject,
  removeInstructorFromSubject,
  getStudentEnrollments,
  enrollStudent,
  unenrollStudent,
  getAllInstructors,
  getInstructorSubjects,
  getMySubjects,
  getSubjectInstructors,
  getStudentsByTargets,
  assignFormToSubject,
  searchSubjects,
  getInstructorDetails,
  getStudentsBySubject,
  getStudentsByInstructor
};
