// Subject Evaluation Routes
const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/auth");
const db = require("../config/database");

// ============================================================
// Course Sections (Subjects) Management
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
 * Get instructor's own subjects (for instructor dashboard)
 * GET /api/subject-evaluation/my-subjects
 */
router.get("/my-subjects", verifyToken, async (req, res) => {
  try {
    const instructorId = req.userId;
    
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

      // Get forms assigned to this instructor for evaluation
      const formsQuery = `
        SELECT 
          f.id as form_id,
          f.title as form_name,
          f.description,
          f.category,
          f.status,
          f.submission_count as response_count,
          f.start_date,
          f.end_date,
          sr.shared_at
        FROM forms f
        INNER JOIN shared_responses sr ON sr.form_id = f.id
        WHERE sr.shared_with_instructor_id = ?
        ORDER BY f.created_at DESC
      `;
      
      db.query(formsQuery, [instructorId], (err, formsResults) => {
        if (err) {
          console.error("Error fetching forms:", err);
          return res.status(200).json({
            success: true,
            instructor: instructorResults[0],
            subjects: [],
          });
        }

        // For each form, get the average rating
        const formsWithRatings = (formsResults || []).map(form => ({
          ...form,
          avg_rating: 0,
          total_responses: 0
        }));

        return res.status(200).json({
          success: true,
          instructor: instructorResults[0],
          subjects: formsWithRatings,
        });
      });
    });
  } catch (error) {
    console.error("Get my subjects error:", error);
    return res.status(200).json({
      success: true,
      instructor: null,
      subjects: [],
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
    
    // Get total students, courses, feedback count, average rating
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT ic.student_id) as total_students,
        COUNT(DISTINCT ic.program_id) as total_courses,
        0 as total_feedbacks,
        0.0 as avg_rating
      FROM instructor_courses ic
      WHERE ic.instructor_id = ?
    `;
    
    db.query(statsQuery, [instructorId], (err, results) => {
      if (err) {
        console.error("Error fetching stats:", err);
        return res.status(200).json({
          success: true,
          stats: { total_students: 0, total_courses: 0, total_feedbacks: 0, avg_rating: 0 },
        });
      }

      return res.status(200).json({
        success: true,
        stats: results[0] || { total_students: 0, total_courses: 0, total_feedbacks: 0, avg_rating: 0 },
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
 * Uses subject_enrollments table for many-to-many relationship
 */
router.get("/student-enrollments", verifyToken, async (req, res) => {
  try {
    // First create the subject_enrollments table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS subject_enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        course_section_id INT NOT NULL,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_student_id (student_id),
        INDEX idx_course_section_id (course_section_id),
        UNIQUE KEY unique_enrollment (student_id, course_section_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    db.query(createTableQuery, (tableErr) => {
      if (tableErr) {
        console.error("Error creating subject_enrollments table:", tableErr);
      }
      
      // Get enrollments from subject_enrollments table
      const query = `
        SELECT 
          se.id,
          se.student_id,
          se.course_section_id,
          cs.course_code,
          cs.course_name,
          cs.section,
          cs.year_level,
          cs.department,
          u.full_name as student_name,
          u.email as student_email
        FROM subject_enrollments se
        INNER JOIN course_sections cs ON se.course_section_id = cs.id
        LEFT JOIN users u ON se.student_id = u.id
        ORDER BY u.full_name, cs.course_code
      `;
      
      db.query(query, (err, enrollments) => {
        if (err) {
          console.error("Error fetching enrollments:", err);
          return res.status(200).json({ success: true, enrollments: [] });
        }
        
        const result = enrollments.map(e => ({
          id: e.id,
          student_id: e.student_id,
          course_section_id: e.course_section_id,
          course_code: e.course_code,
          course_name: e.course_name,
          section: e.section,
          year_level: e.year_level,
          department: e.department,
          student_name: e.student_name,
          student_email: e.student_email
        }));
        
        return res.status(200).json({ success: true, enrollments: result });
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
 */
router.post("/student-enrollments", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { student_id, course_section_id } = req.body;
    
    if (!student_id || !course_section_id) {
      return res.status(400).json({ success: false, message: "Student ID and Subject ID are required" });
    }
    
    // Insert into subject_enrollments table
    const query = "INSERT INTO subject_enrollments (student_id, course_section_id) VALUES (?, ?)";
    db.query(query, [student_id, course_section_id], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ success: false, message: "Student already enrolled in this subject" });
        }
        console.error("Error enrolling student:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      return res.status(201).json({ success: true, message: "Student enrolled successfully" });
    });
  } catch (error) {
    console.error("Enroll student error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Remove student enrollment
 * DELETE /api/subject-evaluation/student-enrollments/:enrollmentId
 */
router.delete("/student-enrollments/:enrollmentId", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    
    // Delete from subject_enrollments table
    const query = "DELETE FROM subject_enrollments WHERE id = ?";
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

module.exports = router;
