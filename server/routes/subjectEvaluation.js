// Subject Evaluation Routes
const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/auth");
const db = require("../config/database");

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
 * Get subject-instructor assignments
 * GET /api/subject-evaluation/subject-instructors
 */
router.get("/subject-instructors", verifyToken, async (req, res) => {
  try {
    const { subject_id, instructor_id } = req.query;
    
    let conditions = ["si.status = 'active'"];
    let params = [];
    
    if (subject_id) {
      conditions.push("si.subject_id = ?");
      params.push(subject_id);
    }
    if (instructor_id) {
      conditions.push("si.instructor_id = ?");
      params.push(instructor_id);
    }
    
    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    
    const query = `
      SELECT 
        si.*,
        s.subject_code,
        s.subject_name,
        s.department,
        u.full_name as instructor_name,
        u.email as instructor_email
      FROM subject_instructors si
      INNER JOIN subjects s ON si.subject_id = s.id
      LEFT JOIN users u ON si.instructor_id = u.id
      ${whereClause}
      ORDER BY s.subject_code, si.semester, si.academic_year
    `;
    
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Error fetching subject-instructors:", err);
        return res.status(200).json({ success: true, data: [] });
      }
      return res.status(200).json({ success: true, data: results || [] });
    });
  } catch (error) {
    console.error("Get subject-instructors error:", error);
    return res.status(200).json({ success: true, data: [] });
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
    // First check if course_sections table exists
    const checkTableQuery = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'course_sections'
    `;
    
    db.query(checkTableQuery, (err, results) => {
      if (err || results[0].count === 0) {
        // Table doesn't exist, create it without foreign keys
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS course_sections (
            id INT AUTO_INCREMENT PRIMARY KEY,
            course_code VARCHAR(50) NOT NULL,
            course_name VARCHAR(255) NOT NULL,
            section VARCHAR(10),
            year_level INT,
            department VARCHAR(100),
            instructor_id INT,
            student_id INT,
            status ENUM('active', 'inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_course_code (course_code),
            INDEX idx_instructor_id (instructor_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        db.query(createTableQuery, (err) => {
          if (err) {
            console.error("Error creating course_sections table:", err);
            return res.status(200).json({ success: true, sections: [] });
          }
          return res.status(200).json({ success: true, sections: [] });
        });
      } else {
        // Table exists - check if columns need to be modified (for older tables with foreign keys)
        const alterQuery = `
          ALTER TABLE course_sections 
          MODIFY COLUMN instructor_id INT NULL,
          MODIFY COLUMN section VARCHAR(10) NULL,
          MODIFY COLUMN year_level INT NULL,
          ADD COLUMN IF NOT EXISTS student_id INT NULL AFTER instructor_id
        `;
        
        db.query(alterQuery, (err) => {
          // Ignore errors if columns already exist or have different types
          
          // Fetch data
          const query = `
            SELECT 
              cs.id,
              cs.course_code,
              cs.course_name,
              cs.section,
              cs.year_level,
              cs.department,
              cs.instructor_id,
              cs.status,
              u.full_name as instructor_name
            FROM course_sections cs
            LEFT JOIN users u ON cs.instructor_id = u.id
            WHERE cs.status = 'active'
            ORDER BY cs.course_code, cs.year_level, cs.section
          `;
          
          db.query(query, (err, sections) => {
            if (err) {
              console.error("Error fetching course sections:", err);
              return res.status(200).json({ success: true, sections: [] });
            }
            return res.status(200).json({ success: true, sections: sections || [] });
          });
        });
      }
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
    const { course_code, course_name, section, year_level, department } = req.body;
    
    if (!course_code || !course_name) {
      return res.status(400).json({ success: false, message: "Course code and name are required" });
    }
    
    const query = `
      INSERT INTO course_sections (course_code, course_name, status) 
      VALUES (?, ?, 'active')
    `;
    db.query(query, [course_code, course_name], (err, result) => {
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
    const { course_code, course_name } = req.body;
    
    if (!course_code || !course_name) {
      return res.status(400).json({ success: false, message: "Course code and name are required" });
    }
    
    const query = `
      UPDATE course_sections 
      SET course_code = ?, course_name = ? 
      WHERE id = ?
    `;
    db.query(query, [course_code, course_name, id], (err, result) => {
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
    
    const query = `DELETE FROM course_sections WHERE id = ?`;
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
    // Get instructors with subject count from course_sections
    const query = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        i.department,
        i.instructor_id,
        i.image,
        (SELECT COUNT(*) FROM course_sections cs WHERE cs.instructor_id = u.id AND cs.status = 'active') as total_subjects,
        0 as total_feedbacks,
        0.0 as avg_rating
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

      // Get subjects from course_sections table
      const subjectsQuery = `
        SELECT 
          cs.id as section_id,
          cs.course_name as subject_name,
          cs.course_code as subject_code,
          cs.section,
          cs.year_level,
          cs.department,
          (SELECT COUNT(*) FROM course_sections cs2 WHERE cs2.instructor_id = cs.instructor_id AND cs2.status = 'active') as student_count,
          0 as feedback_count,
          0.0 as avg_rating
        FROM course_sections cs
        WHERE cs.instructor_id = ? AND cs.status = 'active'
        ORDER BY cs.course_code ASC
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

        return res.status(200).json({
          success: true,
          instructor: instructorResults[0],
          subjects: subjectResults || [],
        });
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
    
    // Get form responses for this subject
    const query = `
      SELECT 
        fr.id as response_id,
        fr.response_data,
        fr.submitted_at,
        u.full_name as student_name,
        u.email as student_email
      FROM form_responses fr
      LEFT JOIN users u ON fr.user_id = u.id
      WHERE fr.form_id = ?
      ORDER BY fr.submitted_at DESC
    `;
    
    db.query(query, [subjectId], (err, results) => {
      if (err) {
        console.error("Error fetching feedback:", err);
        return res.status(200).json({
          success: true,
          feedback: [],
          statistics: { total_responses: 0, avg_rating: 0, rating_distribution: {5:0,4:0,3:0,2:0,1:0} },
        });
      }

      // Calculate statistics
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
        
        // Extract rating values
        if (Array.isArray(parsedData)) {
          parsedData.forEach(val => {
            const numVal = parseFloat(val);
            if (!isNaN(numVal) && numVal >= 1 && numVal <= 5) {
              ratings.push(numVal);
            }
          });
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
    
    // Get stats using both new schema (subject_instructors) and legacy (course_sections)
    const statsQuery = `
      SELECT 
        COALESCE(
          (SELECT COUNT(DISTINCT ss.student_id) 
           FROM student_subjects ss
           INNER JOIN subject_instructors si ON ss.subject_instructor_id = si.id
           WHERE si.instructor_id = ?), 0) +
        COALESCE(
          (SELECT COUNT(DISTINCT se.student_id) 
           FROM student_enrollments se
           INNER JOIN course_sections cs ON se.course_section_id = cs.id
           WHERE cs.instructor_id = ?), 0) as total_students,
        
        COALESCE(
          (SELECT COUNT(*) 
           FROM subject_instructors si
           WHERE si.instructor_id = ? AND si.status = 'active'), 0) +
        COALESCE(
          (SELECT COUNT(*) 
           FROM course_sections cs
           WHERE cs.instructor_id = ? AND cs.status = 'active'), 0) as total_courses,
        
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
// Instructor Courses Routes (links instructors to course_sections)
// ============================================================

/**
 * Get all instructor courses
 * GET /api/subject-evaluation/instructor-courses
 */
router.get("/instructor-courses", verifyToken, async (req, res) => {
  try {
    // Check if course_sections table exists
    const checkTableQuery = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'course_sections'
    `;
    
    db.query(checkTableQuery, (err, results) => {
      if (err || results[0].count === 0) {
        return res.status(200).json({ success: true, courses: [] });
      }
      
      // Use course_sections table directly - instructor_id is stored in course_sections
      const query = `
        SELECT 
          cs.id,
          cs.course_code,
          cs.course_name,
          cs.section,
          cs.year_level,
          cs.department,
          cs.instructor_id,
          u.full_name as instructor_name,
          (SELECT COUNT(*) FROM course_sections cs2 WHERE cs2.instructor_id = cs.instructor_id AND cs2.status = 'active') as instructor_count
        FROM course_sections cs
        LEFT JOIN users u ON cs.instructor_id = u.id
        WHERE cs.status = 'active'
        ORDER BY cs.course_code, cs.year_level, cs.section
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
              course_code: c.course_code,
              course_name: c.course_name,
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
    });
  } catch (error) {
    console.error("Get instructor courses error:", error);
    return res.status(200).json({ success: true, courses: [] });
  }
});

/**
 * Assign subject (course_section) to instructor
 * POST /api/subject-evaluation/instructor-courses
 * Now updates course_sections table directly with instructor_id
 */
router.post("/instructor-courses", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { instructor_id, course_section_id } = req.body;
    
    if (!instructor_id || !course_section_id) {
      return res.status(400).json({ success: false, message: "Instructor ID and Subject ID are required" });
    }
    
    // Update course_sections table with instructor_id
    const query = "UPDATE course_sections SET instructor_id = ? WHERE id = ?";
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
 * Sets instructor_id to NULL in course_sections
 */
router.delete("/instructor-courses/:courseId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Set instructor_id to NULL in course_sections
    const query = "UPDATE course_sections SET instructor_id = NULL WHERE id = ?";
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
 * Fetches from both student_subjects (new) and student_enrollments (legacy)
 */
router.get("/student-enrollments", verifyToken, async (req, res) => {
  try {
    // First try to get from student_subjects table (new format)
    const newQuery = `
      SELECT 
        ss.id,
        ss.student_id,
        ss.subject_instructor_id,
        s.subject_code,
        s.subject_name,
        s.department as subject_department,
        si.semester,
        si.academic_year,
        u.full_name as student_name,
        u.email as student_email
      FROM student_subjects ss
      INNER JOIN subject_instructors si ON ss.subject_instructor_id = si.id
      INNER JOIN subjects s ON si.subject_id = s.id
      LEFT JOIN users u ON ss.student_id = u.id
      ORDER BY u.full_name, s.subject_code
    `;
    
    // Also get from student_enrollments table (legacy format)
    const legacyQuery = `
      SELECT 
        se.id,
        se.student_id,
        se.course_section_id as subject_instructor_id,
        cs.course_code as subject_code,
        cs.course_name as subject_name,
        cs.department as subject_department,
        '' as semester,
        '' as academic_year,
        u.full_name as student_name,
        u.email as student_email
      FROM student_enrollments se
      INNER JOIN course_sections cs ON se.course_section_id = cs.id
      LEFT JOIN users u ON se.student_id = u.id
      ORDER BY u.full_name, cs.course_code
    `;
    
    // Run both queries
    db.query(newQuery, (err, newEnrollments) => {
      if (err) {
        console.error("Error fetching new enrollments:", err);
      }
      
      db.query(legacyQuery, (err2, legacyEnrollments) => {
        if (err2) {
          console.error("Error fetching legacy enrollments:", err2);
        }
        
        // Combine results
        const allEnrollments = [...(newEnrollments || []), ...(legacyEnrollments || [])];
        return res.status(200).json({ success: true, enrollments: allEnrollments });
      });
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
    const { student_id, subject_instructor_id, course_section_id, academic_year } = req.body;
    const year = academic_year || new Date().getFullYear().toString();
    
    // New format: using subject_instructors table directly
    if (subject_instructor_id) {
      // First, get the student's internal ID from the students table
      const getStudentQuery = "SELECT id FROM students WHERE user_id = ?";
      db.query(getStudentQuery, [student_id], (studentErr, studentResults) => {
        let studentDbId = null;
        
        if (studentErr || studentResults.length === 0) {
          // Student not in students table - create a record or use user_id directly
          console.log("Student not found in students table, creating record or using user_id");
          
          // Try to create a student record
          const insertStudentQuery = "INSERT INTO students (user_id, studentID) VALUES (?, ?)";
          db.query(insertStudentQuery, [student_id, `STUDENT-${student_id}`], (insertErr, insertResult) => {
            if (insertErr) {
              console.error("Error creating student record:", insertErr);
              // Use user_id directly as fallback
              studentDbId = student_id;
              doEnrollment();
            } else {
              studentDbId = insertResult.insertId;
              doEnrollment();
            }
          });
        } else {
          studentDbId = studentResults[0].id;
          doEnrollment();
        }
        
        function doEnrollment() {
          const query = "INSERT INTO student_subjects (student_id, subject_instructor_id, academic_year) VALUES (?, ?, ?)";
          db.query(query, [studentDbId, subject_instructor_id, year], (err, result) => {
            if (err) {
              if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: "Student already enrolled in this subject" });
              }
              console.error("Error enrolling student:", err);
              return res.status(500).json({ success: false, message: "Database error" });
            }
            return res.status(201).json({ success: true, message: "Student enrolled successfully" });
          });
        }
      });
      return;
    }
    
    // Legacy format: using course_section_id
    if (course_section_id) {
      // First, get the course section details
      const getCSQuery = "SELECT * FROM course_sections WHERE id = ?";
      db.query(getCSQuery, [course_section_id], (csErr, csResults) => {
        if (csErr || csResults.length === 0) {
          console.error("Error fetching course section:", csErr);
          return res.status(400).json({ success: false, message: "Course section not found" });
        }
        
        const courseSection = csResults[0];
        
        // Check if a subject with this code already exists in subjects table
        const checkSubjectQuery = "SELECT id FROM subjects WHERE subject_code = ?";
        db.query(checkSubjectQuery, [courseSection.course_code], (subjErr, subjResults) => {
          let subjectId;
          let existingSiId = null;
          
          if (subjResults.length > 0) {
            // Subject exists, get its ID
            subjectId = subjResults[0].id;
            
            // Check if subject_instructor exists (only if there's a valid instructor)
            if (courseSection.instructor_id && courseSection.instructor_id > 0) {
              const checkSIQuery = "SELECT id FROM subject_instructors WHERE subject_id = ? AND instructor_id = ? LIMIT 1";
              db.query(checkSIQuery, [subjectId, courseSection.instructor_id], (siErr, siResults) => {
                if (siResults && siResults.length > 0) {
                  existingSiId = siResults[0].id;
                }
                enrollStudentInSubject(courseSection, subjectId, existingSiId, student_id, course_section_id, year, res);
              });
            } else {
              // No instructor assigned, use legacy enrollment only
              enrollLegacyOnly(student_id, course_section_id, res);
            }
          } else {
            // Create new subject in subjects table
            const insertSubjectQuery = "INSERT INTO subjects (subject_code, subject_name, department, units, status) VALUES (?, ?, COALESCE(?, 'General'), 3, 'active')";
            db.query(insertSubjectQuery, [courseSection.course_code, courseSection.course_name, courseSection.department], (insertSubjErr, insertResult) => {
              if (insertSubjErr) {
                console.error("Error creating subject:", insertSubjErr);
                // Try to continue with legacy enrollment
              }
              
              if (insertResult && insertResult.insertId) {
                subjectId = insertResult.insertId;
                
                // Only create subject_instructor if there's a valid instructor_id
                if (courseSection.instructor_id && courseSection.instructor_id > 0) {
                  const insertSIQuery = "INSERT INTO subject_instructors (subject_id, instructor_id, semester, academic_year, course_section_id, status) VALUES (?, ?, '1st', ?, ?, 'active')";
                  db.query(insertSIQuery, [subjectId, courseSection.instructor_id, year, course_section_id], (insertSIErr, insertSIResult) => {
                    if (insertSIErr) {
                      console.error("Error creating subject_instructor:", insertSIErr);
                    }
                    
                    const siId = insertSIResult ? insertSIResult.insertId : null;
                    enrollStudentInSubject(courseSection, subjectId, siId, student_id, course_section_id, year, res);
                  });
                } else {
                  // No instructor, use legacy enrollment only
                  enrollLegacyOnly(student_id, course_section_id, res);
                }
              } else {
                // Fall back to legacy enrollment
                enrollLegacyOnly(student_id, course_section_id, res);
              }
            });
          }
        });
      });
      return;
    }
    
    return res.status(400).json({ success: false, message: "Either subject_instructor_id or course_section_id is required" });
  } catch (error) {
    console.error("Enroll student error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Helper function to enroll student in subject (new tables)
function enrollStudentInSubject(courseSection, subjectId, subjectInstructorId, studentId, courseSectionId, year, res) {
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
          // Fall back to legacy enrollment only
          return enrollLegacyOnly(studentId, courseSectionId, res);
        }
        studentDbId = insertResult.insertId;
        doEnrollment();
      });
    } else {
      studentDbId = studentResults[0].id;
      doEnrollment();
    }
    
    function doEnrollment() {
      if (subjectInstructorId) {
        // Enroll in student_subjects table using students.id
        const enrollQuery = "INSERT INTO student_subjects (student_id, subject_instructor_id, academic_year) VALUES (?, ?, ?)";
        db.query(enrollQuery, [studentDbId, subjectInstructorId, year], (enrollErr) => {
          if (enrollErr && enrollErr.code !== 'ER_DUP_ENTRY') {
            console.error("Error in student_subjects enrollment:", enrollErr);
          }
          
          // Also add to legacy table using users.id
          const legacyQuery = "INSERT IGNORE INTO student_enrollments (student_id, course_section_id) VALUES (?, ?)";
          db.query(legacyQuery, [studentId, courseSectionId], (legacyErr) => {
            if (legacyErr && legacyErr.code !== 'ER_DUP_ENTRY') {
              console.error("Error in legacy enrollment:", legacyErr);
            }
            
            return res.status(201).json({ success: true, message: "Student enrolled successfully" });
          });
        });
      } else {
        // No subject_instructor, use legacy only
        enrollLegacyOnly(studentId, courseSectionId, res);
      }
    }
  });
}

// Fallback to legacy enrollment only
function enrollLegacyOnly(studentId, courseSectionId, res) {
  const legacyQuery = "INSERT IGNORE INTO student_enrollments (student_id, course_section_id) VALUES (?, ?)";
  db.query(legacyQuery, [studentId, courseSectionId], (legacyErr) => {
    if (legacyErr && legacyErr.code !== 'ER_DUP_ENTRY') {
      console.error("Error in legacy enrollment:", legacyErr);
      return res.status(201).json({ success: true, message: "Student enrolled (legacy)" });
    }
    return res.status(201).json({ success: true, message: "Student enrolled successfully" });
  });
}

/**
 * Remove student enrollment
 * DELETE /api/subject-evaluation/student-enrollments/:enrollmentId
 */
router.delete("/student-enrollments/:enrollmentId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    
    // Delete from student_subjects table
    const query = "DELETE FROM student_subjects WHERE id = ?";
    db.query(query, [enrollmentId], (err, result) => {
      if (err) {
        console.error("Error removing enrollment:", err);
        return res.status(500).json({ success: false, message: "Failed to remove enrollment" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Enrollment not found" });
      }
      return res.status(200).json({ success: true, message: "Student removed from subject" });
    });
  } catch (error) {
    console.error("Remove enrollment error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// ============================================================
// Student Subject Evaluation - Get Student's Enrolled Subjects
// Supports both new tables (subjects, subject_instructors, student_subjects)
// and legacy tables (course_sections with student_id)
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
    
    // Get subjects from course_sections (legacy) - this is what admin uses
    const query = `
      SELECT 
        cs.id as subject_instructor_id,
        cs.id as form_id,
        cs.id as subject_id,
        cs.course_code as subject_code,
        cs.course_name as form_name,
        cs.department as description,
        cs.department as category,
        cs.status,
        cs.section as semester,
        cs.year_level as academic_year,
        0 as response_count,
        0 as total_responses,
        cs.created_at as shared_at,
        cs.created_at as start_date,
        cs.created_at as end_date,
        0.0 as avg_rating
      FROM course_sections cs
      WHERE cs.instructor_id = ?
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
  // Method 2: Get subjects from course_sections table (legacy with student_id)
  const legacyQuery = `
    SELECT 
      cs.id as subject_id,
      cs.course_code as subject_code,
      cs.course_name as subject_name,
      cs.department,
      3.0 as units,
      cs.id as subject_instructor_id,
      '' as semester,
      '' as academic_year,
      cs.id as course_section_id,
      cs.instructor_id,
      u.full_name as instructor_name,
      u.email as instructor_email,
      inst.department as instructor_department,
      inst.image as instructor_image,
      cs.id as enrollment_id,
      cs.created_at as enrolled_at
    FROM course_sections cs
    LEFT JOIN users u ON cs.instructor_id = u.id
    LEFT JOIN instructors inst ON u.id = inst.user_id
    WHERE cs.student_id = ? AND cs.status = 'active'
    ORDER BY cs.course_code
  `;
  
  // Method 3: Get from student_enrollments table
  const altLegacyQuery = `
    SELECT 
      cs.id as subject_id,
      cs.course_code as subject_code,
      cs.course_name as subject_name,
      cs.department,
      3.0 as units,
      cs.id as subject_instructor_id,
      '' as semester,
      '' as academic_year,
      cs.id as course_section_id,
      cs.instructor_id,
      u.full_name as instructor_name,
      u.email as instructor_email,
      inst.department as instructor_department,
      inst.image as instructor_image,
      se.id as enrollment_id,
      se.enrolled_at
    FROM student_enrollments se
    INNER JOIN course_sections cs ON se.course_section_id = cs.id
    LEFT JOIN users u ON cs.instructor_id = u.id
    LEFT JOIN instructors inst ON u.id = inst.user_id
    WHERE se.student_id = ? AND cs.status = 'active'
    ORDER BY cs.course_code
  `;
  
  // Run legacy queries
  db.query(legacyQuery, [userId], (err2, legacySubjects) => {
    if (err2) console.error("Error fetching legacy subjects:", err2);
    
    db.query(altLegacyQuery, [userId], (err3, altLegacySubjects) => {
      if (err3) console.error("Error fetching alt legacy subjects:", err3);
      
      // Combine results from all methods
      let allSubjects = [...existingSubjects];
      const existingIds = new Set(existingSubjects.map(s => s.subject_id));
      
      // Add legacy format subjects (course_sections with student_id)
      if (legacySubjects && legacySubjects.length > 0) {
        legacySubjects.forEach(subject => {
          if (!existingIds.has(subject.subject_id)) {
            allSubjects.push(subject);
            existingIds.add(subject.subject_id);
          }
        });
      }
      
      // Add alt legacy format subjects (student_enrollments)
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
