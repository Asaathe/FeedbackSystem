// Subject Management Controller
// Handles CRUD operations for subjects, instructors, and students
const db = require("../config/database");

/**
 * Get all subjects
 */
const getAllSubjects = async (req, res) => {
  try {
    const { search, status, department } = req.query;
    
    let query = `
      SELECT 
        s.id,
        s.subject_code,
        s.subject_name,
        s.department,
        s.units,
        s.description,
        s.status,
        s.created_at,
        (SELECT COUNT(*) FROM subject_students ss WHERE ss.subject_id = s.id AND ss.status = 'enrolled') as enrolled_count,
        (SELECT COUNT(*) FROM subject_instructors si WHERE si.subject_id = s.id) as instructor_count
      FROM evaluation_subjects s
      WHERE 1=1
    `;
    
    const params = [];
    
    if (search) {
      query += ` AND (s.subject_code LIKE ? OR s.subject_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (status) {
      query += ` AND s.status = ?`;
      params.push(status);
    }
    
    if (department) {
      query += ` AND s.department = ?`;
      params.push(department);
    }
    
    query += ` ORDER BY s.subject_code`;
    
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Error fetching subjects:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch subjects" });
      }
      return res.status(200).json({ success: true, subjects: results });
    });
  } catch (error) {
    console.error("Get all subjects error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get single subject by ID
 */
const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM subject_students ss WHERE ss.subject_id = s.id AND ss.status = 'enrolled') as enrolled_count
      FROM evaluation_subjects s
      WHERE s.id = ?
    `;
    
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error("Error fetching subject:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch subject" });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: "Subject not found" });
      }
      
      return res.status(200).json({ success: true, subject: results[0] });
    });
  } catch (error) {
    console.error("Get subject by ID error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Create new subject
 */
const createSubject = async (req, res) => {
  try {
    const { subject_code, subject_name, department, units, description } = req.body;
    
    if (!subject_code || !subject_name) {
      return res.status(400).json({ 
        success: false, 
        message: "Subject code and name are required" 
      });
    }
    
    // Check if subject code already exists
    const checkQuery = "SELECT id FROM evaluation_subjects WHERE subject_code = ?";
    db.query(checkQuery, [subject_code], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking subject:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (checkResults.length > 0) {
        return res.status(400).json({ success: false, message: "Subject code already exists" });
      }
      
      // Insert the subject
      const insertQuery = `
        INSERT INTO evaluation_subjects (subject_code, subject_name, department, units, description) 
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(insertQuery, [subject_code, subject_name, department || null, units || 3, description || null], (insertErr, result) => {
        if (insertErr) {
          console.error("Error creating subject:", insertErr);
          return res.status(500).json({ success: false, message: "Failed to create subject" });
        }
        
        return res.status(201).json({ 
          success: true, 
          message: "Subject created successfully",
          subjectId: result.insertId
        });
      });
    });
  } catch (error) {
    console.error("Create subject error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Update subject
 */
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_code, subject_name, department, units, description, status } = req.body;
    
    // Check if subject exists
    const checkQuery = "SELECT id FROM evaluation_subjects WHERE id = ?";
    db.query(checkQuery, [id], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking subject:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (checkResults.length === 0) {
        return res.status(404).json({ success: false, message: "Subject not found" });
      }
      
      // Check if subject_code is being changed to an existing one
      if (subject_code) {
        const duplicateQuery = "SELECT id FROM evaluation_subjects WHERE subject_code = ? AND id != ?";
        db.query(duplicateQuery, [subject_code, id], (dupErr, dupResults) => {
          if (dupErr) {
            console.error("Error checking duplicate:", dupErr);
            return res.status(500).json({ success: false, message: "Database error" });
          }
          
          if (dupResults.length > 0) {
            return res.status(400).json({ success: false, message: "Subject code already exists" });
          }
          
          // Proceed with update
          updateSubjectRecord();
        });
      } else {
        updateSubjectRecord();
      }
      
      function updateSubjectRecord() {
        const updateQuery = `
          UPDATE evaluation_subjects 
          SET subject_code = COALESCE(?, subject_code),
              subject_name = COALESCE(?, subject_name),
              department = COALESCE(?, department),
              units = COALESCE(?, units),
              description = COALESCE(?, description),
              status = COALESCE(?, status)
          WHERE id = ?
        `;
        db.query(updateQuery, [subject_code, subject_name, department, units, description, status, id], (updateErr) => {
          if (updateErr) {
            console.error("Error updating subject:", updateErr);
            return res.status(500).json({ success: false, message: "Failed to update subject" });
          }
          
          return res.status(200).json({ success: true, message: "Subject updated successfully" });
        });
      }
    });
  } catch (error) {
    console.error("Update subject error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Delete subject
 */
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if subject has enrollments
    const checkQuery = "SELECT id FROM subject_students WHERE subject_id = ? AND status = 'enrolled'";
    db.query(checkQuery, [id], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking enrollments:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (checkResults.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot delete subject with enrolled students. Remove enrollments first." 
        });
      }
      
      // Delete the subject
      const deleteQuery = "DELETE FROM evaluation_subjects WHERE id = ?";
      db.query(deleteQuery, [id], (deleteErr) => {
        if (deleteErr) {
          console.error("Error deleting subject:", deleteErr);
          return res.status(500).json({ success: false, message: "Failed to delete subject" });
        }
        
        return res.status(200).json({ success: true, message: "Subject deleted successfully" });
      });
    });
  } catch (error) {
    console.error("Delete subject error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Assign instructor to subject
 */
const assignInstructorToSubject = async (req, res) => {
  try {
    const { subject_id, instructor_id, academic_year, semester } = req.body;
    
    if (!subject_id || !instructor_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Subject ID and Instructor ID are required" 
      });
    }
    
    // Check if assignment already exists
    const checkQuery = `
      SELECT id FROM subject_instructors 
      WHERE subject_id = ? AND instructor_id = ? 
      AND academic_year = ? AND semester = ?
    `;
    db.query(checkQuery, [subject_id, instructor_id, academic_year || '2025-2026', semester || '1st'], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking assignment:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (checkResults.length > 0) {
        return res.status(400).json({ success: false, message: "Instructor already assigned to this subject" });
      }
      
      // Insert the assignment
      const insertQuery = `
        INSERT INTO subject_instructors (subject_id, instructor_id, academic_year, semester) 
        VALUES (?, ?, ?, ?)
      `;
      db.query(insertQuery, [subject_id, instructor_id, academic_year || '2025-2026', semester || '1st'], (insertErr, result) => {
        if (insertErr) {
          console.error("Error assigning instructor:", insertErr);
          return res.status(500).json({ success: false, message: "Failed to assign instructor" });
        }
        
        return res.status(201).json({ success: true, message: "Instructor assigned successfully" });
      });
    });
  } catch (error) {
    console.error("Assign instructor error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Remove instructor from subject
 */
const removeInstructorFromSubject = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleteQuery = "DELETE FROM subject_instructors WHERE id = ?";
    db.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error("Error removing instructor:", err);
        return res.status(500).json({ success: false, message: "Failed to remove instructor" });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Assignment not found" });
      }
      
      return res.status(200).json({ success: true, message: "Instructor removed successfully" });
    });
  } catch (error) {
    console.error("Remove instructor error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get instructors for a subject
 */
const getSubjectInstructors = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const query = `
      SELECT 
        si.id,
        si.subject_id,
        si.instructor_id,
        si.academic_year,
        si.semester,
        u.full_name as instructor_name,
        u.email as instructor_email,
        i.department as instructor_department
      FROM subject_instructors si
      INNER JOIN users u ON si.instructor_id = u.id
      LEFT JOIN instructors i ON u.id = i.user_id
      WHERE si.subject_id = ?
      ORDER BY si.academic_year DESC, si.semester
    `;
    
    db.query(query, [subjectId], (err, results) => {
      if (err) {
        console.error("Error fetching subject instructors:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch instructors" });
      }
      return res.status(200).json({ success: true, instructors: results });
    });
  } catch (error) {
    console.error("Get subject instructors error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Enroll student in subject
 */
const enrollStudent = async (req, res) => {
  try {
    const { subject_id, student_id, academic_year, semester } = req.body;
    
    if (!subject_id || !student_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Subject ID and Student ID are required" 
      });
    }
    
    // Check if enrollment already exists
    const checkQuery = `
      SELECT id FROM subject_students 
      WHERE subject_id = ? AND student_id = ? 
      AND academic_year = ? AND semester = ?
    `;
    db.query(checkQuery, [subject_id, student_id, academic_year || '2025-2026', semester || '1st'], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking enrollment:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (checkResults.length > 0) {
        return res.status(400).json({ success: false, message: "Student already enrolled in this subject" });
      }
      
      // Insert the enrollment
      const insertQuery = `
        INSERT INTO subject_students (subject_id, student_id, academic_year, semester, status) 
        VALUES (?, ?, ?, ?, 'enrolled')
      `;
      db.query(insertQuery, [subject_id, student_id, academic_year || '2025-2026', semester || '1st'], (insertErr, result) => {
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
 * Unenroll student from subject
 */
const unenrollStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const updateQuery = "UPDATE subject_students SET status = 'dropped' WHERE id = ?";
    db.query(updateQuery, [id], (err, result) => {
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
 * Get students for a subject
 */
const getSubjectStudents = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { status } = req.query;
    
    let query = `
      SELECT 
        ss.id,
        ss.subject_id,
        ss.student_id,
        ss.academic_year,
        ss.semester,
        ss.status,
        ss.created_at,
        u.full_name as student_name,
        u.email as student_email,
        st.studentID as student_number
      FROM subject_students ss
      INNER JOIN users u ON ss.student_id = u.id
      LEFT JOIN students st ON u.id = st.user_id
      WHERE ss.subject_id = ?
    `;
    
    const params = [subjectId];
    
    if (status) {
      query += ` AND ss.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY u.full_name`;
    
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Error fetching subject students:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch students" });
      }
      return res.status(200).json({ success: true, students: results });
    });
  } catch (error) {
    console.error("Get subject students error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get all enrolled students (for assignment to subjects)
 */
const getAllEnrolledStudents = async (req, res) => {
  try {
    const { search, department } = req.query;
    
    let query = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        st.studentID,
        st.department as student_department,
        st.year_level
      FROM users u
      INNER JOIN students st ON u.id = st.user_id
      WHERE u.role = 'student' AND u.status = 'active'
    `;
    
    const params = [];
    
    if (search) {
      query += ` AND (u.full_name LIKE ? OR st.studentID LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (department) {
      query += ` AND st.department = ?`;
      params.push(department);
    }
    
    query += ` ORDER BY u.full_name`;
    
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Error fetching students:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch students" });
      }
      return res.status(200).json({ success: true, students: results });
    });
  } catch (error) {
    console.error("Get all enrolled students error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get all instructors (for subject assignment)
 */
const getAllInstructorsForAssignment = async (req, res) => {
  try {
    const { search, department } = req.query;
    
    let query = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        i.department as instructor_department,
        i.instructor_id as instructor_number
      FROM users u
      INNER JOIN instructors i ON u.id = i.user_id
      WHERE u.role = 'instructor' AND u.status = 'active'
    `;
    
    const params = [];
    
    if (search) {
      query += ` AND (u.full_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (department) {
      query += ` AND i.department = ?`;
      params.push(department);
    }
    
    query += ` ORDER BY u.full_name`;
    
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Error fetching instructors:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch instructors" });
      }
      return res.status(200).json({ success: true, instructors: results });
    });
  } catch (error) {
    console.error("Get all instructors error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Bulk enroll students by program
 */
const bulkEnrollStudents = async (req, res) => {
  try {
    const { subject_id, program_id, academic_year, semester } = req.body;
    
    if (!subject_id || !program_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Subject ID and Program ID are required" 
      });
    }
    
    // Get all students in the program
    const studentsQuery = `
      SELECT s.user_id 
      FROM students s 
      WHERE s.program_id = ?
    `;
    
    db.query(studentsQuery, [program_id], async (err, students) => {
      if (err) {
        console.error("Error fetching program students:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch program students" });
      }
      
      if (students.length === 0) {
        return res.status(400).json({ success: false, message: "No students found in this program" });
      }
      
      let enrolledCount = 0;
      let skippedCount = 0;
      const academicYear = academic_year || '2025-2026';
      const semesterVal = semester || '1st';
      
      // Enroll each student
      for (const student of students) {
        try {
          // Check if already enrolled
          const checkQuery = `
            SELECT id FROM subject_students 
            WHERE subject_id = ? AND student_id = ? 
            AND academic_year = ? AND semester = ?
          `;
          
          const checkResult = await new Promise((resolve, reject) => {
            db.query(checkQuery, [subject_id, student.user_id, academicYear, semesterVal], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });
          
          if (checkResult.length > 0) {
            skippedCount++;
            continue;
          }
          
          // Insert enrollment
          const insertQuery = `
            INSERT INTO subject_students (subject_id, student_id, academic_year, semester, status) 
            VALUES (?, ?, ?, ?, 'enrolled')
          `;
          
          await new Promise((resolve, reject) => {
            db.query(insertQuery, [subject_id, student.user_id, academicYear, semesterVal], (err, result) => {
              if (err) {
                // Skip duplicate entries
                if (err.code === 'ER_DUP_ENTRY') {
                  skippedCount++;
                  resolve();
                } else {
                  reject(err);
                }
              } else {
                enrolledCount++;
                resolve();
              }
            });
          });
        } catch (studentErr) {
          console.error("Error enrolling student:", studentErr);
          skippedCount++;
        }
      }
      
      return res.status(200).json({ 
        success: true, 
        message: `Enrolled ${enrolledCount} students, skipped ${skippedCount} already enrolled`,
        enrolledCount,
        skippedCount
      });
    });
  } catch (error) {
    console.error("Bulk enroll students error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get students by program
 */
const getStudentsByProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    const { academic_year, semester } = req.query;
    
    if (!programId) {
      return res.status(400).json({ 
        success: false, 
        message: "Program ID is required" 
      });
    }
    
    const query = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        st.studentID,
        st.program_id,
        st.year_level
      FROM users u
      INNER JOIN students st ON u.id = st.user_id
      WHERE st.program_id = ? AND u.role = 'student' AND u.status = 'active'
      ORDER BY u.full_name
    `;
    
    db.query(query, [programId], (err, results) => {
      if (err) {
        console.error("Error fetching program students:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch students" });
      }
      return res.status(200).json({ success: true, students: results });
    });
  } catch (error) {
    console.error("Get students by program error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  assignInstructorToSubject,
  removeInstructorFromSubject,
  getSubjectInstructors,
  enrollStudent,
  unenrollStudent,
  getSubjectStudents,
  getAllEnrolledStudents,
  getAllInstructorsForAssignment,
  bulkEnrollStudents,
  getStudentsByProgram
};
