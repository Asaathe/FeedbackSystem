// Subject Evaluation Routes
const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/auth");
const db = require("../config/database");
const { getCurrentSettings, getYearLevelRange, getDepartmentFromYearLevel } = require("../utils/settingsHelper");

// ============================================================
// Subject Management (New Schema - Recommended)
// Uses: subjects, subject_instructors, student_subjects tables
// ============================================================

/**
 * Get all subjects from the subjects table
 * GET /api/subject-evaluation/subjects
 */
router.get("/subjects", verifyToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM subject_instructors WHERE subject_id = s.id) as instructor_count
      FROM subjects s
      WHERE s.status = 'active'
      ORDER BY s.subject_code
    `;
    
    db.query(query, (err, subjects) => {
      if (err) {
        console.error("Error fetching subjects:", err);
        return res.status(200).json({ success: true, subjects: [] });
      }
      return res.status(200).json({ success: true, subjects: subjects || [] });
    });
  } catch (error) {
    console.error("Get subjects error:", error);
    return res.status(200).json({ success: true, subjects: [] });
  }
});

/**
 * Create a new subject
 * POST /api/subject-evaluation/subjects
 */
router.post("/subjects", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { subject_code, subject_name, department, units } = req.body;
    
    if (!subject_code || !subject_name) {
      return res.status(400).json({ success: false, message: "Subject code and name are required" });
    }
    
    const query = `
      INSERT INTO subjects (subject_code, subject_name, department, units, status) 
      VALUES (?, ?, COALESCE(?, 'General'), COALESCE(?, 3), 'active')
    `;
    
    db.query(query, [subject_code, subject_name, department, units], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: "Subject code already exists" });
        }
        console.error("Error creating subject:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      return res.status(201).json({ success: true, message: "Subject created successfully", subject_id: result.insertId });
    });
  } catch (error) {
    console.error("Create subject error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Assign instructor to subject (create subject_instructor record)
 * POST /api/subject-evaluation/subject-instructors
 */
router.post("/subject-instructors", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { subject_id, instructor_id, semester, academic_year, course_section_id } = req.body;
    
    if (!subject_id || !instructor_id) {
      return res.status(400).json({ success: false, message: "Subject and Instructor are required" });
    }
    
    const query = `
      INSERT INTO subject_instructors (subject_id, instructor_id, semester, academic_year, course_section_id, status) 
      VALUES (?, ?, ?, ?, ?, 'active')
    `;
    
    db.query(query, [subject_id, instructor_id, semester || '1st', academic_year || new Date().getFullYear().toString(), course_section_id || null], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: "Instructor already assigned to this subject for the specified semester/year" });
        }
        console.error("Error assigning instructor:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      return res.status(201).json({ success: true, message: "Instructor assigned successfully", id: result.insertId });
    });
  } catch (error) {
    console.error("Assign instructor error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Assign form to subject (deploy evaluation form to all instructors of a subject)
 * PUT /api/subject-evaluation/subjects/:subjectId/assign-form
 */
router.put("/subjects/:subjectId/assign-form", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { form_id, evaluation_type, start_date, end_date } = req.body;
    
    if (!form_id) {
      return res.status(400).json({ success: false, message: "Form ID is required" });
    }
    
    // First, check if subject_instructors exist for this subject
    const checkQuery = `SELECT id, course_section_id FROM subject_instructors WHERE subject_id = ?`;
    
    db.query(checkQuery, [subjectId], (err, results) => {
      if (err) {
        console.error("Error checking subject_instructors:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (results.length > 0) {
        // Subject instructors already exist - update them with the form
        const updateQuery = `
          UPDATE subject_instructors 
          SET form_id = ?, evaluation_type = ?, start_date = ?, end_date = ?, updated_at = NOW()
          WHERE subject_id = ?
        `;
        
        db.query(updateQuery, [form_id, evaluation_type || 'both', start_date || null, end_date || null, subjectId], (err, updateResult) => {
          if (err) {
            console.error("Error assigning form:", err);
            return res.status(500).json({ success: false, message: "Database error" });
          }
          return res.status(200).json({ success: true, message: "Form assigned to existing subject-instructor(s)" });
        });
      } else {
        // No subject_instructors exist - create one using the subject's instructor_id
        const getInstructorQuery = `SELECT instructor_id FROM subjects WHERE id = ?`;
        db.query(getInstructorQuery, [subjectId], (err2, subjResults) => {
          if (err2) {
            console.error("Error getting subject:", err2);
            return res.status(500).json({ success: false, message: "Database error" });
          }
          
          if (subjResults.length === 0 || !subjResults[0].instructor_id) {
            return res.status(404).json({ success: false, message: "No instructors assigned to this subject" });
          }
          
          // Find any existing course_section for this subject's year/section, or use a default
          const findCourseQuery = `SELECT id FROM course_management WHERE year_level = 4 AND section = 'A' LIMIT 1`;
          
          db.query(findCourseQuery, [], (err3, courseResults) => {
            if (err3) {
              console.error("Error finding course:", err3);
              return res.status(500).json({ success: false, message: "Database error" });
            }
            
            const courseSectionId = courseResults.length > 0 ? courseResults[0].id : 1; // Default to id 1
            
            // Create subject_instructor
            const insertQuery = `
              INSERT INTO subject_instructors (subject_id, instructor_id, course_section_id, semester, academic_year, form_id, evaluation_type, status)
              VALUES (?, ?, ?, '1st', '2024-2025', ?, ?, 'active')
            `;
            
            db.query(insertQuery, [subjectId, subjResults[0].instructor_id, courseSectionId, form_id, evaluation_type || 'both'], (err4, insertResult) => {
              if (err4) {
                console.error("Error creating subject_instructor:", err4);
                return res.status(500).json({ success: false, message: "Database error" });
              }
              return res.status(200).json({ success: true, message: "Form assigned to subject (new instructor created)" });
            });
          });
        });
      }
    });
  } catch (error) {
    console.error("Assign form error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Assign form to subject-instructor (deploy evaluation form)
 * PUT /api/subject-evaluation/subject-instructors/:id/assign-form
 */
router.put("/subject-instructors/:id/assign-form", async (req, res) => {
  try {
    const { id } = req.params;
    const { form_id, evaluation_type, start_date, end_date } = req.body;
    
    if (!form_id) {
      return res.status(400).json({ success: false, message: "Form ID is required" });
    }
    
    const query = `
      UPDATE subject_instructors 
      SET form_id = ?, evaluation_type = ?, start_date = ?, end_date = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    db.query(query, [form_id, evaluation_type || 'both', start_date || null, end_date || null, id], (err, result) => {
      if (err) {
        console.error("Error assigning form:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Subject-instructor not found" });
      }
      return res.status(200).json({ success: true, message: "Form assigned successfully" });
    });
  } catch (error) {
    console.error("Assign form error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Submit evaluation response
 * POST /api/subject-evaluation/evaluation-submissions
 */
router.post("/evaluation-submissions", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject_instructor_id, student_subject_id, form_id, response_data, subject_rating, instructor_rating } = req.body;
    
    if (!subject_instructor_id || !form_id || !response_data) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    
    // First, save the form response
    const insertResponseQuery = `
      INSERT INTO form_responses (form_id, user_id, response_data) 
      VALUES (?, ?, ?)
    `;
    
    db.query(insertResponseQuery, [form_id, userId, JSON.stringify(response_data)], (err, responseResult) => {
      if (err) {
        console.error("Error saving response:", err);
        return res.status(500).json({ success: false, message: "Failed to save response" });
      }
      
      const responseId = responseResult.insertId;
      
      // Get student_subject details if not provided
      let studentSubjectId = student_subject_id;
      let studentId = userId;
      
      if (!studentSubjectId) {
        // Try to find the student's subject enrollment
        const findEnrollmentQuery = `
          SELECT id, student_id FROM student_subjects 
          WHERE subject_instructor_id = ? AND student_id = ?
          LIMIT 1
        `;
        db.query(findEnrollmentQuery, [subject_instructor_id, userId], (enrollErr, enrollResults) => {
          if (enrollErr || !enrollResults.length) {
            // Insert into student_subjects if not found
            const insertStudentSubjectQuery = `
              INSERT INTO student_subjects (student_id, subject_instructor_id, academic_year)
              VALUES (?, ?, ?)
            `;
            db.query(insertStudentSubjectQuery, [userId, subject_instructor_id, new Date().getFullYear().toString() + '-' + (new Date().getFullYear() + 1).toString()], (insertErr, insertResult) => {
              studentSubjectId = insertResult.insertId;
              saveSubmission();
            });
          } else {
            studentSubjectId = enrollResults[0].id;
            studentId = enrollResults[0].student_id;
            saveSubmission();
          }
        });
      } else {
        saveSubmission();
      }
      
      function saveSubmission() {
        // Get subject_instructor details
        const getSiQuery = `
          SELECT subject_id, instructor_id, semester, academic_year 
          FROM subject_instructors WHERE id = ?
        `;
        db.query(getSiQuery, [subject_instructor_id], (siErr, siResults) => {
          if (siErr || !siResults.length) {
            return res.status(404).json({ success: false, message: "Subject-instructor not found" });
          }
          
          const si = siResults[0];
          
          // Insert into subject_evaluation_submissions (new table)
          const insertSubmissionQuery = `
            INSERT INTO subject_evaluation_submissions 
            (response_id, student_subject_id, subject_instructor_id, subject_id, instructor_id, student_id, semester, academic_year, evaluation_type, subject_rating, instructor_rating)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          db.query(insertSubmissionQuery, [
            responseId, 
            studentSubjectId || null, 
            subject_instructor_id, 
            si.subject_id, 
            si.instructor_id, 
            studentId,
            si.semester, 
            si.academic_year,
            subject_rating ? 'subject' : (instructor_rating ? 'instructor' : 'both'),
            subject_rating || null,
            instructor_rating || null
          ], (subErr, subResult) => {
            if (subErr) {
              console.error("Error saving submission:", subErr);
              return res.status(500).json({ success: false, message: "Failed to save submission" });
            }
            return res.status(201).json({ success: true, message: "Evaluation submitted successfully" });
          });
        });
      }
    });
  } catch (error) {
    console.error("Submit evaluation error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Get subject-instructor assignments
 * GET /api/subject-evaluation/subject-instructors
 */
router.get("/subject-instructors", verifyToken, async (req, res) => {
  try {
    const { subject_id, instructor_id, department, current } = req.query;
    
    // Get current semester/academic year if requested
    let currentSettings = null;
    let fallbackSettings = { college: { semester: '1st', academic_year: '2025-2026' }, seniorHigh: { semester: '1st', academic_year: '2025-2026' } };
    
    try {
      if (current === 'true') {
        currentSettings = await getCurrentSettings();
      }
      fallbackSettings = await getCurrentSettings();
    } catch (e) {
      console.error("Error getting settings:", e);
    }
    
    // First try to get from subject_instructors table
    let conditions = [];
    let params = [];
    
    if (subject_id) {
      conditions.push("si.subject_id = ?");
      params.push(subject_id);
    }
    if (instructor_id) {
      conditions.push("si.instructor_id = ?");
      params.push(instructor_id);
    }
    if (department) {
      conditions.push("s.department = ?");
      params.push(department);
    }
    
    // Filter by current semester/academic year if requested
    if (currentSettings) {
      // Add OR condition for both departments
      conditions.push(`(si.academic_year = ? OR si.academic_year = ?)`);
      params.push(currentSettings.college.academic_year, currentSettings.seniorHigh.academic_year);
    }
    
    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    
    const query = `
      SELECT 
        si.id,
        si.subject_id,
        si.instructor_id,
        si.semester,
        si.academic_year,
        si.status,
        si.form_id,
        s.subject_code,
        s.subject_name,
        s.department,
        u.full_name as instructor_name,
        u.email as instructor_email,
        f.title as form_title,
        f.description as form_description
      FROM subject_instructors si
      INNER JOIN subjects s ON si.subject_id = s.id
      LEFT JOIN users u ON si.instructor_id = u.id
      LEFT JOIN forms f ON si.form_id = f.id
      ${whereClause}
      ORDER BY s.subject_code, si.semester, si.academic_year
    `;
    
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Error fetching subject-instructors:", err);
        return res.status(200).json({ success: true, subjectInstructors: [] });
      }
      
      // If no results from subject_instructors, try to get from subjects table directly
      if (!results || results.length === 0) {
        // Use pre-fetched settings
        const semester = fallbackSettings.college.semester;
        const academicYear = fallbackSettings.college.academic_year;
        
        let deptFilter = "";
        if (department) {
          deptFilter = " AND s.department = ?";
        }
        
        const subjectsQuery = `
          SELECT 
            s.id as subject_id,
            s.instructor_id,
            s.subject_code,
            s.subject_name,
            s.department,
            u.full_name as instructor_name,
            u.email as instructor_email,
            ? as semester,
            ? as academic_year,
            'active' as status
          FROM subjects s
          LEFT JOIN users u ON s.instructor_id = u.id
          WHERE s.instructor_id IS NOT NULL AND s.status = 'active'${deptFilter}
          ORDER BY s.subject_code
        `;
        
        db.query(subjectsQuery, [semester, academicYear, department || ''], (subjErr, subjResults) => {
          if (subjErr) {
            console.error("Error fetching subjects:", subjErr);
            return res.status(200).json({ success: true, subjectInstructors: [] });
          }
          // Map subjects to match the subject_instructors structure
          const mappedResults = subjResults.map((s) => ({
            id: s.subject_id, // Use subject_id as id
            subject_id: s.subject_id,
            instructor_id: s.instructor_id,
            semester: s.semester,
            academic_year: s.academic_year,
            status: s.status,
            subject_code: s.subject_code,
            subject_name: s.subject_name,
            department: s.department,
            instructor_name: s.instructor_name,
            instructor_email: s.instructor_email,
          }));
          return res.status(200).json({ success: true, subjectInstructors: mappedResults || [] });
        });
      } else {
        return res.status(200).json({ success: true, subjectInstructors: results || [] });
      }
    });
  } catch (error) {
    console.error("Get subject-instructors error:", error);
    return res.status(200).json({ success: true, subjectInstructors: [] });
  }
});

// ============================================================
// Course Sections (Legacy - for backward compatibility)
// ============================================================

/**
 * Get all course sections (subjects)
 * GET /api/subject-evaluation/course-sections
 */
router.get("/course-sections", verifyToken, async (req, res) => {
  try {
    // Fetch from subjects table - include instructor_id from subjects table as fallback
    const query = `
      SELECT 
        s.id,
        s.subject_code,
        s.subject_name,
        s.subject_code as course_code,
        s.subject_name as course_name,
        s.section,
        s.year_level,
        s.department,
        COALESCE(si.instructor_id, s.instructor_id) as instructor_id,
        s.status,
        u.full_name as instructor_name
      FROM subjects s
      LEFT JOIN subject_instructors si ON s.id = si.subject_id
      LEFT JOIN users u ON COALESCE(si.instructor_id, s.instructor_id) = u.id
      WHERE s.status = 'active'
      ORDER BY s.subject_code, s.year_level, s.section
    `;
    
    db.query(query, (err, sections) => {
      if (err) {
        console.error("Error fetching course sections:", err);
        return res.status(200).json({ success: true, sections: [] });
      }
      return res.status(200).json({ success: true, sections: sections || [] });
    });
  } catch (error) {
    console.error("Get course sections error:", error);
    return res.status(200).json({ success: true, sections: [] });
  }
});

/**
 * Create a new course section (subject)
 * POST /api/subject-evaluation/course-sections
 */
router.post("/course-sections", verifyToken, requireAdmin, async (req, res) => {
  try {
    // Accept both course_code/course_name and subject_code/subject_name
    const { course_code, course_name, subject_code, subject_name, section, year_level, department } = req.body;
    
    // Use either naming convention
    const code = course_code || subject_code;
    const name = course_name || subject_name;
    
    if (!code || !name) {
      return res.status(400).json({ success: false, message: "Course code and name are required" });
    }
    
    const query = `
      INSERT INTO subjects (subject_code, subject_name, section, year_level, department, status) 
      VALUES (?, ?, ?, ?, ?, 'active')
    `;
    db.query(query, [code, name, section || null, year_level || null, department || 'General'], (err, result) => {
      if (err) {
        console.error("Error creating course section:", err);
        return res.status(500).json({ success: false, message: "Failed to create subject" });
      }
      return res.status(201).json({ success: true, message: "Subject created successfully" });
    });
  } catch (error) {
    console.error("Create course section error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Update a course section (subject)
 * PUT /api/subject-evaluation/course-sections/:id
 */
router.put("/course-sections/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // Accept both course_code/course_name and subject_code/subject_name
    const { course_code, course_name, subject_code, subject_name } = req.body;
    
    // Use either naming convention
    const code = course_code || subject_code;
    const name = course_name || subject_name;
    
    if (!code || !name) {
      return res.status(400).json({ success: false, message: "Course code and name are required" });
    }
    
    const query = `
      UPDATE subjects 
      SET subject_code = ?, subject_name = ? 
      WHERE id = ?
    `;
    db.query(query, [code, name, id], (err, result) => {
      if (err) {
        console.error("Error updating course section:", err);
        return res.status(500).json({ success: false, message: "Failed to update subject" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Subject not found" });
      }
      return res.status(200).json({ success: true, message: "Subject updated successfully" });
    });
  } catch (error) {
    console.error("Update course section error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Delete a course section (subject)
 * DELETE /api/subject-evaluation/course-sections/:id
 */
router.delete("/course-sections/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `DELETE FROM subjects WHERE id = ?`;
    db.query(query, [id], (err, result) => {
      if (err) {
        console.error("Error deleting course section:", err);
        return res.status(500).json({ success: false, message: "Failed to delete subject" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Subject not found" });
      }
      return res.status(200).json({ success: true, message: "Subject deleted successfully" });
    });
  } catch (error) {
    console.error("Delete course section error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Get all instructors with their subjects and feedback statistics
 * GET /api/subject-evaluation/instructors
 */
router.get("/instructors", verifyToken, requireAdmin, async (req, res) => {
  try {
    // Get instructors with subject count and feedback stats from subject_instructors table
    const query = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        i.department,
        i.school_role,
        i.instructor_id,
        i.image,
        COALESCE(
          (SELECT COUNT(DISTINCT si.id) 
           FROM subject_instructors si 
           WHERE si.instructor_id = u.id AND si.status = 'active'),
          0
        ) as total_subjects,
        COALESCE(
          (SELECT COUNT(*) 
           FROM subject_evaluation_submissions ses 
           WHERE ses.instructor_id = u.id),
          0
        ) as total_feedbacks,
        COALESCE(
          (SELECT AVG((COALESCE(ses.subject_rating, 0) + COALESCE(ses.instructor_rating, 0)) / 2) 
           FROM subject_evaluation_submissions ses 
           WHERE ses.instructor_id = u.id),
          0
        ) as avg_rating
      FROM users u
      INNER JOIN instructors i ON u.id = i.user_id
      WHERE u.role = 'instructor' AND u.status = 'active'
      ORDER BY u.full_name ASC
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching instructors:", err);
        return res.status(200).json({
          success: true,
          instructors: [],
        });
      }

      return res.status(200).json({
        success: true,
        instructors: results || [],
      });
    });
  } catch (error) {
    console.error("Get instructors error:", error);
    return res.status(200).json({
      success: true,
      instructors: [],
    });
  }
});

/**
 * Get subjects for a specific instructor
 * GET /api/subject-evaluation/instructors/:instructorId/subjects
 */
router.get("/instructors/:instructorId/subjects", verifyToken, async (req, res) => {
  try {
    const { instructorId } = req.params;
    
    // Get instructor details
    const instructorQuery = `
      SELECT u.id as user_id, u.full_name, u.email, i.department, i.instructor_id, i.image
      FROM users u
      INNER JOIN instructors i ON u.id = i.user_id
      WHERE u.id = ? AND u.role = 'instructor'
    `;
    
    db.query(instructorQuery, [instructorId], (err, instructorResults) => {
      if (err) {
        console.error("Error fetching instructor:", err);
        return res.status(200).json({
          success: true,
          instructor: null,
          subjects: [],
        });
      }

      if (instructorResults.length === 0) {
        return res.status(200).json({
          success: true,
          instructor: null,
          subjects: [],
        });
      }

      // Get subjects from subject_instructors table (primary) and subjects table (fallback)
      // This ensures we get all subjects assigned to the instructor
      const subjectsQuery = `
        SELECT 
          COALESCE(si.id, s.id) as section_id,
          s.subject_name,
          s.subject_code,
          s.section,
          s.year_level,
          s.department,
          (SELECT COUNT(*) FROM student_subjects ss WHERE ss.subject_instructor_id = si.id) as student_count,
          (SELECT COUNT(*) FROM subject_evaluation_submissions ses WHERE ses.subject_instructor_id = si.id) as feedback_count,
          COALESCE(
            (SELECT AVG((COALESCE(ses.subject_rating, 0) + COALESCE(ses.instructor_rating, 0)) / 2) 
             FROM subject_evaluation_submissions ses 
             WHERE ses.subject_instructor_id = si.id), 
            0
          ) as avg_rating
        FROM subject_instructors si
        INNER JOIN subjects s ON si.subject_id = s.id
        WHERE si.instructor_id = ? AND si.status = 'active'
        GROUP BY si.id, s.id, s.subject_name, s.subject_code, s.section, s.year_level, s.department
        ORDER BY s.subject_code ASC
      `;

      db.query(subjectsQuery, [instructorId], (err, subjectResults) => {
        if (err) {
          console.error("Error fetching subjects:", err);
          return res.status(200).json({
            success: true,
            instructor: instructorResults[0],
            subjects: [],
          });
        }

        // If no results from subject_instructors, try fallback to subjects table
        if (!subjectResults || subjectResults.length === 0) {
          const fallbackQuery = `
            SELECT 
              s.id as section_id,
              s.subject_name,
              s.subject_code,
              s.section,
              s.year_level,
              s.department,
              0 as student_count,
              0 as feedback_count,
              0.0 as avg_rating
            FROM subjects s
            WHERE s.instructor_id = ? AND s.status = 'active'
            ORDER BY s.subject_code ASC
          `;
          
          db.query(fallbackQuery, [instructorId], (fbErr, fbResults) => {
            if (fbErr) {
              console.error("Error fetching fallback subjects:", fbErr);
              return res.status(200).json({
                success: true,
                instructor: instructorResults[0],
                subjects: [],
              });
            }
            return res.status(200).json({
              success: true,
              instructor: instructorResults[0],
              subjects: fbResults || [],
            });
          });
        } else {
          return res.status(200).json({
            success: true,
            instructor: instructorResults[0],
            subjects: subjectResults || [],
          });
        }
      });
    });
  } catch (error) {
    console.error("Get subjects error:", error);
    return res.status(200).json({
      success: true,
      instructor: null,
      subjects: [],
    });
  }
});

/**
 * Get feedback results for a specific subject
 * GET /api/subject-evaluation/subjects/:subjectId/feedback
 */
router.get("/subjects/:subjectId/feedback", verifyToken, async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // First, get the subject_instructors and their form_ids for this subject
    const getSiQuery = `
      SELECT id, form_id, instructor_id 
      FROM subject_instructors 
      WHERE subject_id = ? AND status = 'active'
    `;
    
    db.query(getSiQuery, [subjectId], (siErr, siResults) => {
      if (siErr) {
        console.error("Error fetching subject_instructors:", siErr);
        return res.status(200).json({
          success: true,
          feedback: [],
          statistics: { total_responses: 0, avg_rating: 0, rating_distribution: {5:0,4:0,3:0,2:0,1:0} },
        });
      }
      
      // If no subject_instructors found, return empty
      if (!siResults || siResults.length === 0) {
        return res.status(200).json({
          success: true,
          feedback: [],
          statistics: { total_responses: 0, avg_rating: 0, rating_distribution: {5:0,4:0,3:0,2:0,1:0} },
        });
      }
      
      const formIds = siResults.map(si => si.form_id).filter(f => f);
      const siIds = siResults.map(si => si.id);
      
      // If no forms assigned, return empty
      if (formIds.length === 0) {
        return res.status(200).json({
          success: true,
          feedback: [],
          statistics: { total_responses: 0, avg_rating: 0, rating_distribution: {5:0,4:0,3:0,2:0,1:0} },
        });
      }
      
      // Get form responses for these forms
      const placeholders = formIds.map(() => '?').join(',');
      const query = `
        SELECT 
          fr.id as response_id,
          fr.response_data,
          fr.submitted_at,
          u.full_name as student_name,
          u.email as student_email,
          ses.subject_rating,
          ses.instructor_rating
        FROM form_responses fr
        LEFT JOIN users u ON fr.user_id = u.id
        LEFT JOIN subject_evaluation_submissions ses ON fr.id = ses.response_id
        WHERE fr.form_id IN (${placeholders})
        ORDER BY fr.submitted_at DESC
      `;
      
      db.query(query, formIds, (err, results) => {
        if (err) {
          console.error("Error fetching feedback:", err);
          return res.status(200).json({
            success: true,
            feedback: [],
            statistics: { total_responses: 0, avg_rating: 0, rating_distribution: {5:0,4:0,3:0,2:0,1:0} },
          });
        }

        // Calculate statistics from subject_evaluation_submissions ratings
        const ratings = [];
        const feedbackData = results.map(r => {
          let parsedData = r.response_data;
          if (typeof parsedData === 'string') {
            try {
              parsedData = JSON.parse(parsedData);
            } catch (e) {
              parsedData = [parsedData];
            }
          }
          
          // Extract rating values from response_data
          if (Array.isArray(parsedData)) {
            parsedData.forEach(val => {
              const numVal = parseFloat(val);
              if (!isNaN(numVal) && numVal >= 1 && numVal <= 5) {
                ratings.push(numVal);
              }
            });
          }
          
          // Also add explicit ratings from subject_evaluation_submissions
          if (r.subject_rating) {
            const sr = parseFloat(r.subject_rating);
            if (!isNaN(sr) && sr >= 1 && sr <= 5) ratings.push(sr);
          }
          if (r.instructor_rating) {
            const ir = parseFloat(r.instructor_rating);
            if (!isNaN(ir) && ir >= 1 && ir <= 5) ratings.push(ir);
          }
          
          return {
            response_id: r.response_id,
            response_data: parsedData,
            submitted_at: r.submitted_at,
            student_name: r.student_name || 'Anonymous',
            student_email: r.student_email
          };
        });

        const avgRating = ratings.length > 0 
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) 
          : 0;

        const ratingDistribution = {
          5: ratings.filter(r => r === 5).length,
          4: ratings.filter(r => r === 4).length,
          3: ratings.filter(r => r === 3).length,
          2: ratings.filter(r => r === 2).length,
          1: ratings.filter(r => r === 1).length,
        };

        return res.status(200).json({
          success: true,
          feedback: feedbackData,
          statistics: {
            total_responses: results.length,
            avg_rating: avgRating,
            rating_distribution: ratingDistribution,
          },
        });
      });
    });
  } catch (error) {
    console.error("Get feedback error:", error);
    return res.status(200).json({
      success: true,
      feedback: [],
      statistics: { total_responses: 0, avg_rating: 0, rating_distribution: {5:0,4:0,3:0,2:0,1:0} },
    });
  }
});

/**
 * Get feedback stats for instructor dashboard
 * GET /api/subject-evaluation/my-stats
 */
router.get("/my-stats", verifyToken, async (req, res) => {
  try {
    const instructorId = req.userId;
    
    // Get stats using subjects and subject_instructors tables
    const statsQuery = `
      SELECT 
        COALESCE(
          (SELECT COUNT(DISTINCT ss.student_id) 
           FROM student_subjects ss
           INNER JOIN subject_instructors si ON ss.subject_instructor_id = si.id
           WHERE si.instructor_id = ?), 0) +
        COALESCE(
          (SELECT COUNT(DISTINCT se.student_id) 
           FROM subject_enrollments se
           INNER JOIN subjects s ON se.subject_id = s.id
           WHERE s.instructor_id = ?), 0) as total_students,
        
        COALESCE(
          (SELECT COUNT(*) 
           FROM subject_instructors si
           WHERE si.instructor_id = ? AND si.status = 'active'), 0) +
        COALESCE(
          (SELECT COUNT(*) 
           FROM subjects s
           WHERE s.instructor_id = ? AND s.status = 'active'), 0) as total_courses,
        
        COALESCE(
          (SELECT SUM(total_responses) 
           FROM subject_evaluation_summary
           WHERE instructor_id = ?), 0) as total_feedbacks,
        
        COALESCE(
          (SELECT AVG(overall_rating) 
           FROM subject_evaluation_summary
           WHERE instructor_id = ? AND total_responses > 0), 0) as avg_rating
    `;
    
    db.query(statsQuery, [instructorId, instructorId, instructorId, instructorId, instructorId, instructorId], (err, results) => {
      if (err) {
        console.error("Error fetching stats:", err);
        return res.status(200).json({
          success: true,
          stats: { total_students: 0, total_courses: 0, total_feedbacks: 0, avg_rating: 0 },
        });
      }

      const stats = results[0] || {};
      return res.status(200).json({
        success: true,
        stats: {
          total_students: parseInt(stats.total_students) || 0,
          total_courses: parseInt(stats.total_courses) || 0,
          total_feedbacks: parseInt(stats.total_feedbacks) || 0,
          avg_rating: parseFloat(stats.avg_rating) || 0
        },
      });
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return res.status(200).json({
      success: true,
      stats: { total_students: 0, total_courses: 0, total_feedbacks: 0, avg_rating: 0 },
    });
  }
});

// ============================================================
// Instructor Courses Routes (links instructors to subjects)
// ============================================================

/**
 * Get all instructor courses
 * GET /api/subject-evaluation/instructor-courses
 */
router.get("/instructor-courses", verifyToken, async (req, res) => {
  try {
    // Use subjects table directly - instructor_id is stored in subjects
    const query = `
      SELECT 
        s.id,
        s.subject_code,
        s.subject_name,
        s.section,
        s.year_level,
        s.department,
        s.instructor_id,
        u.full_name as instructor_name,
        (SELECT COUNT(*) FROM subjects s2 WHERE s2.instructor_id = s.instructor_id AND s2.status = 'active') as instructor_count
      FROM subjects s
      LEFT JOIN users u ON s.instructor_id = u.id
      WHERE s.status = 'active'
      ORDER BY s.subject_code, s.year_level, s.section
    `;
    
    db.query(query, (err, courses) => {
      if (err) {
        console.error("Error fetching instructor courses:", err);
        return res.status(200).json({ success: true, courses: [] });
      }
      
      // Group by instructor
      const instructorCoursesMap = {};
      courses.forEach(c => {
        if (c.instructor_id) {
          if (!instructorCoursesMap[c.instructor_id]) {
            instructorCoursesMap[c.instructor_id] = [];
          }
          instructorCoursesMap[c.instructor_id].push({
            id: c.id,
            instructor_id: c.instructor_id,
            subject_code: c.subject_code,
            subject_name: c.subject_name,
            course_code: c.subject_code,
            course_name: c.subject_name,
            section: c.section,
            year_level: c.year_level,
            department: c.department,
            student_id: null
          });
        }
      });
      
      // Convert to array format for frontend
      const result = [];
      Object.keys(instructorCoursesMap).forEach(instructorId => {
        instructorCoursesMap[instructorId].forEach(ic => {
          result.push(ic);
        });
      });
      
      return res.status(200).json({ success: true, courses: result });
    });
  } catch (error) {
    console.error("Get instructor courses error:", error);
    return res.status(200).json({ success: true, courses: [] });
  }
});

/**
 * Assign subject to instructor
 * POST /api/subject-evaluation/instructor-courses
 * Updates subjects table with instructor_id
 */
router.post("/instructor-courses", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { instructor_id, course_section_id } = req.body;
    
    if (!instructor_id || !course_section_id) {
      return res.status(400).json({ success: false, message: "Instructor ID and Subject ID are required" });
    }
    
    // Update subjects table with instructor_id
    const query = "UPDATE subjects SET instructor_id = ? WHERE id = ?";
    db.query(query, [instructor_id, course_section_id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Database error" });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Subject not found" });
      return res.status(201).json({ success: true, message: "Subject assigned to instructor successfully" });
    });
  } catch (error) {
    console.error("Assign course error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Remove instructor from subject
 * DELETE /api/subject-evaluation/instructor-courses/:courseId
 * Sets instructor_id to NULL in subjects
 */
router.delete("/instructor-courses/:courseId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Set instructor_id to NULL in subjects
    const query = "UPDATE subjects SET instructor_id = NULL WHERE id = ?";
    db.query(query, [courseId], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Failed to remove instructor" });
      if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Subject not found" });
      return res.status(200).json({ success: true, message: "Instructor removed from subject" });
    });
  } catch (error) {
    console.error("Remove course error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ============================================================
// Student Enrollments Routes (directly enroll students in courses)
// ============================================================
// Student Enrollments Routes (enroll students in subjects)
// ============================================================

/**
 * Get all student enrollments
 * GET /api/subject-evaluation/student-enrollments
 * Uses subject_enrollments table with direct subject references
 */
router.get("/student-enrollments", verifyToken, async (req, res) => {
  try {
    // Get from subject_enrollments table (direct subject references)
    const query = `
      SELECT 
        se.id,
        se.student_id,
        se.subject_id,
        s.subject_code,
        s.subject_name,
        s.section,
        s.year_level,
        s.department as subject_department,
        s.instructor_id,
        u.full_name as student_name,
        u.email as student_email,
        se.enrolled_at
      FROM subject_enrollments se
      INNER JOIN subjects s ON se.subject_id = s.id
      LEFT JOIN users u ON se.student_id = u.id
      ORDER BY u.full_name, s.subject_code
    `;
    
    db.query(query, (err, enrollments) => {
      if (err) {
        console.error("Error fetching enrollments:", err);
        return res.status(200).json({ success: true, enrollments: [] });
      }
      
      return res.status(200).json({ success: true, enrollments: enrollments || [] });
    });
  } catch (error) {
    console.error("Get enrollments error:", error);
    return res.status(200).json({ success: true, enrollments: [] });
  }
});

/**
 * Enroll student in subject
 * POST /api/subject-evaluation/student-enrollments
 * Supports both new format (subject_instructor_id) and legacy format (course_section_id)
 * When using course_section_id, also creates entries in new tables (subjects, subject_instructors, student_subjects)
 */
router.post("/student-enrollments", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { student_id, subject_instructor_id, course_section_id, subject_id, academic_year } = req.body;
    const year = academic_year || new Date().getFullYear().toString();
    
    // Validate required field
    if (!student_id) {
      return res.status(400).json({ success: false, message: "Student ID is required" });
    }
    
    // Determine which ID to use for enrollment
    let enrollSubjectId = null;
    
    if (subject_id) {
      // Use subject_id directly (new format with subjects table)
      enrollSubjectId = subject_id;
    } else if (course_section_id) {
      // Use course_section_id - but now this maps to subjects table
      enrollSubjectId = course_section_id;
    } else if (subject_instructor_id) {
      // Use subject_instructor_id - need to get the subject_id from subject_instructors
      const getSiQuery = "SELECT subject_id FROM subject_instructors WHERE id = ?";
      db.query(getSiQuery, [subject_instructor_id], (siErr, siResults) => {
        if (siErr || siResults.length === 0) {
          return res.status(400).json({ success: false, message: "Subject instructor not found" });
        }
        enrollSubjectInDb(siResults[0].subject_id, student_id, year, res);
      });
      return;
    } else {
      return res.status(400).json({ success: false, message: "Either subject_id, course_section_id, or subject_instructor_id is required" });
    }
    
    // If we have the subject ID, proceed with enrollment
    if (enrollSubjectId) {
      enrollSubjectInDb(enrollSubjectId, student_id, year, res);
    }
  } catch (error) {
    console.error("Enroll student error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Helper function to enroll student in subject
function enrollSubjectInDb(subjectId, studentId, year, res) {
  // First, get the student's id from the students table using user_id
  const getStudentQuery = "SELECT id FROM students WHERE user_id = ?";
  db.query(getStudentQuery, [studentId], (studentErr, studentResults) => {
    let studentDbId = null;
    
    if (studentErr || studentResults.length === 0) {
      console.log("Student not found in students table, creating record");
      // Create a student record
      const insertStudentQuery = "INSERT INTO students (user_id, studentID) VALUES (?, ?)";
      db.query(insertStudentQuery, [studentId, `STUDENT-${studentId}`], (insertErr, insertResult) => {
        if (insertErr) {
          console.error("Error creating student record:", insertErr);
          // Try to enroll using subject_enrollments
          doEnrollDirectly();
        } else {
          studentDbId = insertResult.insertId;
          doEnroll();
        }
      });
    } else {
      studentDbId = studentResults[0].id;
      doEnroll();
    }
    
    function doEnrollDirectly() {
      // Use subject_enrollments table (has subject_id column)
      const enrollQuery = "INSERT IGNORE INTO subject_enrollments (student_id, subject_id, enrolled_at) VALUES (?, ?, NOW())";
      db.query(enrollQuery, [studentId, subjectId], (enrollErr) => {
        if (enrollErr && enrollErr.code !== 'ER_DUP_ENTRY') {
          console.error("Error in direct enrollment:", enrollErr);
          return res.status(500).json({ success: false, message: "Failed to enroll student" });
        }
        return res.status(201).json({ success: true, message: "Student enrolled successfully" });
      });
    }
    
    function doEnroll() {
      // Use subject_enrollments table (has subject_id column)
      const enrollQuery = "INSERT IGNORE INTO subject_enrollments (student_id, subject_id, enrolled_at) VALUES (?, ?, NOW())";
      db.query(enrollQuery, [studentId, subjectId], (legacyErr) => {
        if (legacyErr && legacyErr.code !== 'ER_DUP_ENTRY') {
          console.error("Error in subject_enrollments enrollment:", legacyErr);
        }
        
        return res.status(201).json({ success: true, message: "Student enrolled successfully" });
      });
    }
  });
}

/**
 * Remove student enrollment
 * DELETE /api/subject-evaluation/student-enrollments/:enrollmentId
 */
router.delete("/student-enrollments/:enrollmentId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const parsedId = parseInt(enrollmentId);
    
    if (isNaN(parsedId)) {
      return res.status(400).json({ success: false, message: "Invalid enrollment ID" });
    }
    
    // Delete from both tables
    // First try student_subjects (uses students.id)
    const deleteSSQuery = "DELETE FROM student_subjects WHERE id = ?";
    db.query(deleteSSQuery, [parsedId], (ssErr, ssResult) => {
      if (ssErr) {
        console.error("Error removing from student_subjects:", ssErr);
      }
      
      // Delete from subject_enrollments table
    const deleteSEQuery = "DELETE FROM subject_enrollments WHERE id = ? OR subject_id = ?";
    db.query(deleteSEQuery, [parsedId, parsedId], (seErr, seResult) => {
        if (seErr) {
          console.error("Error removing from subject_enrollments:", seErr);
        }
        
        if (ssResult.affectedRows === 0 && seResult.affectedRows === 0) {
          return res.status(404).json({ success: false, message: "Enrollment not found" });
        }
        
        return res.status(200).json({ success: true, message: "Student removed from subject" });
      });
    });
  } catch (error) {
    console.error("Remove enrollment error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ============================================================
// Student Subject Evaluation - Get Student's Enrolled Subjects
// Uses subjects and subject_enrollments tables
// ============================================================

/**
 * Get user's subjects based on role
 * GET /api/subject-evaluation/my-subjects
 * - For students: returns enrolled subjects
 * - For instructors: returns their assigned subjects
 */
router.get("/my-subjects", verifyToken, async (req, res) => {
  try {
    const userId = req.userId || (req.user && req.user.id);
    const { current } = req.query;
    
    // Get current settings if requested
    let currentSettings = null;
    if (current === 'true') {
      try {
        currentSettings = await getCurrentSettings();
      } catch (e) {
        console.error("Error getting settings:", e);
      }
    }
    
    // Get user role from database since JWT might not have it
    const userQuery = "SELECT role FROM users WHERE id = ?";
    db.query(userQuery, [userId], (err, userResults) => {
      if (err || userResults.length === 0) {
        console.error("Could not get user role:", err);
        return res.status(200).json({ success: true, subjects: [] });
      }
      
      const userRole = userResults[0].role;
      console.log("Fetching subjects for userId:", userId, "role:", userRole);
      
      if (!userId) {
        console.error("No userId found in request");
        return res.status(200).json({ success: true, subjects: [] });
      }
      
      // If user is an instructor, get their assigned subjects
      if (userRole === 'instructor') {
        return getInstructorSubjects(userId, res);
      }
      
      // Otherwise, get student's enrolled subjects
      return getStudentSubjects(userId, res);
    });
  } catch (error) {
    console.error("Get my subjects error:", error);
    return res.status(200).json({ success: true, subjects: [] });
  }
});

/**
 * Get student's assigned evaluations
 * GET /api/subject-evaluation/my-evaluations
 * Returns subject-instructor pairs that have forms assigned for the student to evaluate
 */
router.get("/my-evaluations", verifyToken, async (req, res) => {
  try {
    const userId = req.userId || (req.user && req.user.id);
    
    // Get user's role
    const userQuery = "SELECT role FROM users WHERE id = ?";
    db.query(userQuery, [userId], (err, userResults) => {
      if (err || userResults.length === 0) {
        return res.status(200).json({ success: true, evaluations: [] });
      }
      
      const userRole = userResults[0].role;
      
      // Only students can access this endpoint
      if (userRole !== 'student') {
        return res.status(200).json({ success: true, evaluations: [] });
      }
      
      // Get student's enrolled subjects with assigned forms
      const query = `
        SELECT 
          si.id as subject_instructor_id,
          si.form_id,
          si.evaluation_type,
          si.start_date,
          si.end_date,
          s.id as subject_id,
          s.subject_code,
          s.subject_name,
          s.department,
          si.instructor_id,
          u.full_name as instructor_name,
          u.email as instructor_email,
          si.semester,
          si.academic_year,
          f.title as form_title,
          f.description as form_description,
          f.category as form_category,
          CASE WHEN ses.id IS NOT NULL THEN true ELSE false END as is_submitted
        FROM subject_enrollments se
        INNER JOIN subject_instructors si ON se.subject_id = si.subject_id
        INNER JOIN subjects s ON si.subject_id = s.id
        LEFT JOIN users u ON si.instructor_id = u.id
        LEFT JOIN forms f ON si.form_id = f.id
        LEFT JOIN subject_evaluation_submissions ses ON ses.subject_instructor_id = si.id AND ses.student_id = ?
        WHERE se.student_id = ? AND si.form_id IS NOT NULL AND si.status = 'active'
        ORDER BY s.subject_code, si.semester
      `;
      
      db.query(query, [userId, userId], (queryErr, results) => {
        if (queryErr) {
          console.error("Error fetching evaluations:", queryErr);
          return res.status(200).json({ success: true, evaluations: [] });
        }
        return res.status(200).json({ success: true, evaluations: results || [] });
      });
    });
  } catch (error) {
    console.error("Get my evaluations error:", error);
    return res.status(200).json({ success: true, evaluations: [] });
  }
});

// Helper function to get instructor's subjects
function getInstructorSubjects(instructorId, res) {
  console.log("getInstructorSubjects called with instructorId:", instructorId);
  
  // First get instructor details
  const instructorQuery = `
    SELECT u.id as user_id, u.full_name, u.email, u.role
    FROM users u
    WHERE u.id = ?
  `;
  
  db.query(instructorQuery, [instructorId], (err, instructorResults) => {
    if (err) {
      console.error("Error fetching instructor:", err);
      return res.status(200).json({ success: true, instructor: null, subjects: [] });
    }

    console.log("User results:", instructorResults);
    
    if (instructorResults.length === 0) {
      return res.status(200).json({ success: true, instructor: null, subjects: [] });
    }

    const user = instructorResults[0];
    const instructor = {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      department: 'General',
      instructor_id: user.user_id.toString(),
      image: null
    };
    
    // Get subjects from subjects table for this instructor
    const query = `
      SELECT 
        s.id as subject_instructor_id,
        s.id as form_id,
        s.id as subject_id,
        s.subject_code,
        s.subject_name as form_name,
        s.department as description,
        s.department as category,
        s.status,
        s.section as semester,
        s.year_level as academic_year,
        0 as response_count,
        0 as total_responses,
        s.created_at as shared_at,
        s.created_at as start_date,
        s.created_at as end_date,
        0.0 as avg_rating
      FROM subjects s
      WHERE s.instructor_id = ?
    `;
    
    db.query(query, [instructorId, instructorId], (err, subjects) => {
      if (err) {
        console.error("Error fetching instructor subjects:", err);
        return res.status(200).json({ success: true, instructor: instructor, subjects: [] });
      }
      console.log("Subjects found for instructor", instructorId, ":", subjects);
      return res.status(200).json({ success: true, instructor: instructor, subjects: subjects || [] });
    });
  });
}

// Helper function to get student's enrolled subjects
function getStudentSubjects(userId, res) {
  // First, get the student's id from the students table
  const getStudentQuery = "SELECT id FROM students WHERE user_id = ?";
  db.query(getStudentQuery, [userId], (studentErr, studentResults) => {
    let studentDbId = null;
    
    if (studentErr || studentResults.length === 0) {
      console.log("Student not found in students table, using legacy queries only");
    } else {
      studentDbId = studentResults[0].id;
    }
    
    // If we have a valid student ID, run the new query
    if (studentDbId) {
      runStudentSubjectsQueries(studentDbId, userId, res);
    } else {
      // Run legacy queries only
      runLegacyQueries(userId, res);
    }
  });
}

function runStudentSubjectsQueries(studentDbId, userId, res) {
  // Method 1: Get subjects from student_subjects table (new format)
  const newQuery = `
    SELECT 
      s.id as subject_id,
      s.subject_code,
      s.subject_name,
      s.department,
      s.units,
      si.id as subject_instructor_id,
      si.semester,
      si.academic_year,
      si.course_section_id,
      u.id as instructor_id,
      u.full_name as instructor_name,
      u.email as instructor_email,
      i.department as instructor_department,
      i.image as instructor_image,
      ss.id as enrollment_id,
      ss.enrolled_at
    FROM student_subjects ss
    INNER JOIN subject_instructors si ON ss.subject_instructor_id = si.id
    INNER JOIN subjects s ON si.subject_id = s.id
    LEFT JOIN users u ON si.instructor_id = u.id
    LEFT JOIN instructors i ON u.id = i.user_id
    WHERE ss.student_id = ? 
      AND s.status = 'active'
      AND si.status = 'active'
    ORDER BY s.subject_code, si.semester, si.academic_year
  `;
  
  db.query(newQuery, [studentDbId], (err, newSubjects) => {
    if (err) console.error("Error fetching new subjects:", err);
    
    // Also run legacy queries to get all subjects
    runLegacyQueries(userId, res, newSubjects);
  });
}

function runLegacyQueries(userId, res, existingSubjects = []) {
  // Get subjects from subjects table
  const subjectsQuery = `
    SELECT 
      s.id as subject_id,
      s.subject_code,
      s.subject_name,
      s.department,
      3.0 as units,
      s.id as subject_instructor_id,
      '' as semester,
      '' as academic_year,
      s.id as course_section_id,
      s.instructor_id,
      u.full_name as instructor_name,
      u.email as instructor_email,
      inst.department as instructor_department,
      inst.image as instructor_image,
      s.id as enrollment_id,
      s.created_at as enrolled_at
    FROM subjects s
    LEFT JOIN users u ON s.instructor_id = u.id
    LEFT JOIN instructors inst ON u.id = inst.user_id
    WHERE s.status = 'active'
    ORDER BY s.subject_code
  `;
  
  // Get from subject_enrollments table
  const newFormatQuery = `
    SELECT 
      s.id as subject_id,
      s.subject_code,
      s.subject_name,
      s.department,
      3.0 as units,
      s.id as subject_instructor_id,
      '' as semester,
      '' as academic_year,
      s.id as course_section_id,
      s.instructor_id,
      u.full_name as instructor_name,
      u.email as instructor_email,
      inst.department as instructor_department,
      inst.image as instructor_image,
      s.id as enrollment_id,
      s.created_at as enrolled_at
    FROM subjects s
    LEFT JOIN users u ON s.instructor_id = u.id
    LEFT JOIN instructors inst ON u.id = inst.user_id
    WHERE s.status = 'active'
    ORDER BY s.subject_code
  `;
   
  // Method 3: Get from subject_enrollments table
  const altNewFormatQuery = `
    SELECT 
      s.id as subject_id,
      s.subject_code,
      s.subject_name,
      s.department,
      3.0 as units,
      s.id as subject_instructor_id,
      '' as semester,
      '' as academic_year,
      s.id as course_section_id,
      s.instructor_id,
      u.full_name as instructor_name,
      u.email as instructor_email,
      inst.department as instructor_department,
      inst.image as instructor_image,
      se.id as enrollment_id,
      se.enrolled_at
    FROM subject_enrollments se
    INNER JOIN subjects s ON se.subject_id = s.id
    LEFT JOIN users u ON s.instructor_id = u.id
    LEFT JOIN instructors inst ON u.id = inst.user_id
    WHERE se.student_id = ? AND s.status = 'active'
    ORDER BY s.subject_code
  `;
  
  // Run queries
  db.query(subjectsQuery, [userId], (err2, legacySubjects) => {
    if (err2) console.error("Error fetching subjects:", err2);
    
    db.query(altNewFormatQuery, [userId], (err3, altLegacySubjects) => {
      if (err3) console.error("Error fetching alt subjects:", err3);
      
      // Combine results from all methods
      let allSubjects = [...existingSubjects];
      const existingIds = new Set(existingSubjects.map(s => s.subject_id));
      
      // Add subjects from subjects table
      if (legacySubjects && legacySubjects.length > 0) {
        legacySubjects.forEach(subject => {
          if (!existingIds.has(subject.subject_id)) {
            allSubjects.push(subject);
            existingIds.add(subject.subject_id);
          }
        });
      }
      
      // Add alt format subjects (subject_enrollments)
      if (altLegacySubjects && altLegacySubjects.length > 0) {
        altLegacySubjects.forEach(subject => {
          if (!existingIds.has(subject.subject_id)) {
            allSubjects.push(subject);
            existingIds.add(subject.subject_id);
          }
        });
      }
      
      console.log("Found subjects:", allSubjects.length);
      return res.status(200).json({ success: true, subjects: allSubjects });
    });
  });
}

module.exports = router;
