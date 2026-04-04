// Subject Management Controller
// REWRITTEN - Now uses subject_offerings and evaluation_subjects instead of legacy tables
const db = require("../config/database");

/**
 * Get all subjects
 */
const getAllSubjects = async (req, res) => {
  try {
    const { status, department, search } = req.query;
    
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
        (SELECT COUNT(*) FROM subject_offerings so WHERE so.subject_id = s.id AND so.status = 'active') as offering_count,
        (SELECT COUNT(DISTINCT so.instructor_id) FROM subject_offerings so WHERE so.subject_id = s.id AND so.instructor_id IS NOT NULL) as instructor_count
      FROM evaluation_subjects s
      WHERE 1=1
    `;
    
    const params = [];
    
    if (status) {
      query += " AND s.status = ?";
      params.push(status);
    }
    
    if (department) {
      query += " AND s.department = ?";
      params.push(department);
    }
    
    if (search) {
      query += " AND (s.subject_code LIKE ? OR s.subject_name LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += " ORDER BY s.subject_code";
    
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
 * Get subject by ID
 */
const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM subject_offerings so WHERE so.subject_id = s.id AND so.status = 'active') as offering_count
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
 * Create subject
 */
const createSubject = async (req, res) => {
  try {
    const { subject_code, subject_name, department, units, description, status } = req.body;
    
    if (!subject_code || !subject_name) {
      return res.status(400).json({ success: false, message: "Subject code and name are required" });
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
      
      const insertQuery = `
        INSERT INTO evaluation_subjects (subject_code, subject_name, department, units, description, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      db.query(insertQuery, [subject_code, subject_name, department || null, units || 3, description || null, status || 'active'], (insertErr, result) => {
        if (insertErr) {
          console.error("Error creating subject:", insertErr);
          return res.status(500).json({ success: false, message: "Failed to create subject" });
        }
        
        return res.status(201).json({ 
          success: true, 
          message: "Subject created successfully",
          subject_id: result.insertId
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
      
      // Check for duplicate subject code
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
    
    // Check if subject has offerings
    const checkQuery = "SELECT id FROM subject_offerings WHERE subject_id = ? AND status = 'active'";
    db.query(checkQuery, [id], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking subject:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (checkResults.length > 0) {
        return res.status(400).json({ success: false, message: "Cannot delete subject with active offerings" });
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
 * Assign instructor to subject - uses subject_offerings
 */
const assignInstructorToSubject = async (req, res) => {
  try {
    const { subject_id, program_id, year_level, section, academic_year, semester, instructor_id, department } = req.body;
    
    if (!subject_id || !program_id || !academic_year || !semester) {
      return res.status(400).json({ success: false, message: "Subject ID, program, academic year, and semester are required" });
    }
    
    // Get academic_period_id
    let academicPeriodId = null;
    try {
      let dept = department;
      if (!dept) {
        const subjectQuery = "SELECT department FROM evaluation_subjects WHERE id = ?";
        const subjectResult = await new Promise((resolve, reject) => {
          db.query(subjectQuery, [subject_id], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
        if (subjectResult.length > 0) {
          dept = subjectResult[0].department;
        }
      }
      
      let periodNumber = 1;
      const semStr = String(semester).toLowerCase();
      if (semStr === '2nd' || semStr === '2') periodNumber = 2;
      else if (semStr === '3rd' || semStr === '3' || semStr === 'summer') periodNumber = 3;
      
      const periodQuery = `
        SELECT id FROM academic_periods 
        WHERE department = ? 
        AND academic_year = ? 
        AND period_number = ?
        LIMIT 1
      `;
      const periodResult = await new Promise((resolve, reject) => {
        db.query(periodQuery, [dept, academic_year, periodNumber], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });
      
      if (periodResult.length > 0) {
        academicPeriodId = periodResult[0].id;
      }
    } catch (periodErr) {
      console.error("Error getting academic period:", periodErr);
    }
    
    // Require academic period - no fallback to old columns
    if (!academicPeriodId) {
      return res.status(400).json({
        success: false,
        message: "Academic period is required for instructor assignment"
      });
    }

    const checkQuery = `
      SELECT id FROM subject_offerings
      WHERE subject_id = ? AND program_id = ? AND year_level = ? AND section = ? AND academic_period_id = ? AND status = 'active'
    `;
    const checkParams = [subject_id, program_id, year_level, section, academicPeriodId];
    
    db.query(checkQuery, checkParams, (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking offering:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (checkResults.length > 0) {
        // Update existing offering
        const updateQuery = "UPDATE subject_offerings SET instructor_id = ? WHERE id = ?";
        const updateParams = [instructor_id, checkResults[0].id];
        
        db.query(updateQuery, updateParams, (updateErr) => {
          if (updateErr) {
            console.error("Error updating offering:", updateErr);
            return res.status(500).json({ success: false, message: "Failed to assign instructor" });
          }
          
          return res.status(200).json({ success: true, message: "Instructor assigned successfully" });
        });
      } else {
        // Create new offering - include academic_period_id if available
        const insertQuery = `
          INSERT INTO subject_offerings (subject_id, program_id, year_level, section, academic_year, semester, instructor_id, academic_period_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        db.query(insertQuery, [subject_id, program_id, year_level, section, academic_year, semester, instructor_id, academicPeriodId], (insertErr, result) => {
          if (insertErr) {
            console.error("Error creating offering:", insertErr);
            return res.status(500).json({ success: false, message: "Failed to create offering" });
          }
          
          return res.status(201).json({ success: true, message: "Offering created with instructor" });
        });
      }
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
    
    // The id here is the offering ID
    const updateQuery = "UPDATE subject_offerings SET instructor_id = NULL WHERE id = ?";
    db.query(updateQuery, [id], (err, result) => {
      if (err) {
        console.error("Error removing instructor:", err);
        return res.status(500).json({ success: false, message: "Failed to remove instructor" });
      }
      
      return res.status(200).json({ success: true, message: "Instructor removed successfully" });
    });
  } catch (error) {
    console.error("Remove instructor error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get subject instructors - uses subject_offerings
 * ONLY uses academic_period_id - no fallback to academic_year/semester
 */
const getSubjectInstructors = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { academic_period_id } = req.query;
    
    // If no academic_period_id, return empty - no fallback
    if (!academic_period_id) {
      return res.status(200).json({ success: true, instructors: [] });
    }
    
    let query = `
      SELECT DISTINCT
        u.id as instructor_id,
        u.full_name as instructor_name,
        i.department as instructor_department,
        i.school_role,
        ap.academic_year,
        ap.period_number as semester
      FROM subject_offerings so
      INNER JOIN users u ON so.instructor_id = u.id
      LEFT JOIN instructors i ON u.id = i.user_id
      LEFT JOIN academic_periods ap ON so.academic_period_id = ap.id
      WHERE so.subject_id = ? AND so.instructor_id IS NOT NULL
      AND so.academic_period_id = ?
    `;
    
    const params = [subjectId, academic_period_id];
    
    query += " ORDER BY u.full_name";
    
    db.query(query, params, (err, results) => {
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
 * Get subject students - uses subject_offerings + students table
 * ONLY uses academic_period_id - no fallback to academic_year/semester
 */
const getSubjectStudents = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { academic_period_id } = req.query;
    
    // If no academic_period_id, return empty - no fallback
    if (!academic_period_id) {
      return res.status(200).json({ success: true, students: [] });
    }
    
    let query = `
      SELECT DISTINCT
        u.id as user_id,
        u.full_name,
        u.email,
        st.studentID,
        so.year_level,
        so.section,
        ap.academic_year,
        ap.period_number as semester
      FROM subject_offerings so
      INNER JOIN students st ON so.program_id = st.program_id
      INNER JOIN users u ON st.user_id = u.id
      LEFT JOIN academic_periods ap ON so.academic_period_id = ap.id
      WHERE so.subject_id = ? AND u.status = 'active'
      AND so.academic_period_id = ?
    `;
    
    const params = [subjectId, academic_period_id];
    
    query += " ORDER BY u.full_name";
    
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
 * Enroll student in subject - now just returns info (students auto-enrolled via program)
 */
const enrollStudent = async (req, res) => {
  return res.status(200).json({ 
    success: true, 
    message: "Students are automatically enrolled based on their program enrollment in subject_offerings" 
  });
};

/**
 * Unenroll student from subject
 */
const unenrollStudent = async (req, res) => {
  return res.status(200).json({ 
    success: true, 
    message: "Student cannot be manually unenrolled. They will be automatically unenrolled when their program changes." 
  });
};

/**
 * Get all enrolled students for assignment
 */
const getAllEnrolledStudents = async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.full_name, u.email, st.studentID, cm.course_section
      FROM students st
      INNER JOIN users u ON st.user_id = u.id
      LEFT JOIN course_management cm ON st.program_id = cm.id
      WHERE u.status = 'active'
      ORDER BY u.full_name
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching enrolled students:", err);
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
 * Bulk enroll students - now just returns info
 */
const bulkEnrollStudents = async (req, res) => {
  return res.status(200).json({ 
    success: true, 
    message: "Bulk enrollment is now handled automatically through subject_offerings based on program enrollment" 
  });
};

/**
 * Get students by program
 */
const getStudentsByProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    
    const query = `
      SELECT u.id, u.full_name, u.email, st.studentID, cm.course_section
      FROM students st
      INNER JOIN users u ON st.user_id = u.id
      LEFT JOIN course_management cm ON st.program_id = cm.id
      WHERE st.program_id = ? AND u.status = 'active'
      ORDER BY u.full_name
    `;
    
    db.query(query, [programId], (err, results) => {
      if (err) {
        console.error("Error fetching students by program:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch students" });
      }
      
      return res.status(200).json({ success: true, students: results });
    });
  } catch (error) {
    console.error("Get students by program error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get all instructors for assignment
 */
const getAllInstructorsForAssignment = async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.full_name, i.department, i.school_role
      FROM users u
      INNER JOIN instructors i ON u.id = i.user_id
      WHERE u.role = 'instructor' AND u.status = 'active'
      ORDER BY u.full_name
    `;
    
    db.query(query, (err, results) => {
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

// Subject Offerings functions

/**
 * Get all subject offerings
 * ONLY uses academic_period_id - no fallback to academic_year/semester
 */
const getAllSubjectOfferings = async (req, res) => {
  try {
    const { academic_period_id, program_id, instructor_id } = req.query;
    
    let query = `
      SELECT 
        so.*,
        es.subject_code,
        es.subject_name,
        es.department,
        COALESCE(c.program_name, CONCAT('Program ', so.program_id)) as program_name,
        COALESCE(c.program_code, 'N/A') as program_code,
        COALESCE(c.course_section, CONCAT('Year ', so.year_level, ' - Section ', so.section)) as course_section,
        c.department as program_department,
        u.full_name as instructor_name,
        ap.academic_year,
        ap.period_number as semester
      FROM subject_offerings so
      LEFT JOIN evaluation_subjects es ON so.subject_id = es.id
      LEFT JOIN course_management c ON so.program_id = c.id
      LEFT JOIN users u ON so.instructor_id = u.id
      LEFT JOIN academic_periods ap ON so.academic_period_id = ap.id
      WHERE so.status != 'archived'
    `;
    
    const params = [];
    
    // ONLY use academic_period_id - no fallback
    if (academic_period_id) {
      query += " AND so.academic_period_id = ?";
      params.push(academic_period_id);
    }
    
    if (program_id) {
      query += " AND so.program_id = ?";
      params.push(program_id);
    }
    
    if (instructor_id) {
      query += " AND so.instructor_id = ?";
      params.push(instructor_id);
    }
    
    query += " ORDER BY es.subject_code, c.course_section";
    
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Error fetching subject offerings:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch offerings" });
      }
      
      return res.status(200).json({ success: true, offerings: results });
    });
  } catch (error) {
    console.error("Get all subject offerings error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Create subject offering
 */
const createSubjectOffering = async (req, res) => {
  try {
    const { subject_id, program_id, year_level, section, academic_year, semester, instructor_id, status, department, academic_period_id } = req.body;
    
    if (!subject_id || !program_id || !academic_year || !semester) {
      return res.status(400).json({ success: false, message: "Subject, program, academic year, and semester are required" });
    }
    
    // Get academic_period_id - prioritize explicitly passed value, otherwise look it up
    let academicPeriodId = academic_period_id || null;
    
    // If not explicitly provided, try to look it up based on academic_year, semester, and department
    if (!academicPeriodId) {
      try {
        // Determine department from the subject if not provided
        let dept = department;
        if (!dept) {
          const subjectQuery = "SELECT department FROM evaluation_subjects WHERE id = ?";
          const subjectResult = await new Promise((resolve, reject) => {
            db.query(subjectQuery, [subject_id], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });
          if (subjectResult.length > 0) {
            dept = subjectResult[0].department;
          }
        }
        
        // Map semester to period_number
        let periodNumber = 1;
        const semStr = String(semester).toLowerCase();
        if (semStr === '2nd' || semStr === '2') periodNumber = 2;
        else if (semStr === '3rd' || semStr === '3' || semStr === 'summer') periodNumber = 3;
        
        // Find the academic period
        const periodQuery = `
          SELECT id FROM academic_periods 
          WHERE department = ? 
          AND academic_year = ? 
          AND period_number = ?
          LIMIT 1
        `;
        const periodResult = await new Promise((resolve, reject) => {
          db.query(periodQuery, [dept, academic_year, periodNumber], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
        
        if (periodResult.length > 0) {
          academicPeriodId = periodResult[0].id;
        }
      } catch (periodErr) {
        console.error("Error getting academic period:", periodErr);
        // Continue without academic_period_id if not found
      }
    }
    
    // Check for duplicate - only check active offerings, not archived ones
    // This allows creating a new offering for a new semester even if the same subject was offered before
    // Require academic period - no fallback to year/semester
    if (!academicPeriodId) {
      return res.status(400).json({
        success: false,
        message: "Academic period is required for subject offering creation"
      });
    }

    const checkQuery = `
      SELECT id FROM subject_offerings
      WHERE subject_id = ? AND program_id = ? AND year_level = ? AND section = ? AND academic_period_id = ? AND status != 'archived'
    `;
    const checkParams = [subject_id, program_id, year_level, section, academicPeriodId];
    
    db.query(checkQuery, checkParams, (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking offering:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (checkResults.length > 0) {
        return res.status(400).json({ success: false, message: "Subject offering already exists for this semester" });
      }
      
      const insertQuery = `
        INSERT INTO subject_offerings (subject_id, program_id, year_level, section, academic_year, semester, instructor_id, status, academic_period_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.query(insertQuery, [subject_id, program_id, year_level, section, academic_year, semester, instructor_id, status || 'active', academicPeriodId], (insertErr, result) => {
        if (insertErr) {
          console.error("Error creating offering:", insertErr);
          return res.status(500).json({ success: false, message: "Failed to create offering" });
        }
        
        return res.status(201).json({ success: true, message: "Subject offering created successfully", offering_id: result.insertId });
      });
    });
  } catch (error) {
    console.error("Create subject offering error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Update subject offering
 */
const updateSubjectOffering = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_id, program_id, year_level, section, academic_year, semester, instructor_id, status } = req.body;
    
    const updateQuery = `
      UPDATE subject_offerings
      SET subject_id = COALESCE(?, subject_id),
          program_id = COALESCE(?, program_id),
          year_level = COALESCE(?, year_level),
          section = COALESCE(?, section),
          academic_year = COALESCE(?, academic_year),
          semester = COALESCE(?, semester),
          instructor_id = COALESCE(?, instructor_id),
          status = COALESCE(?, status)
      WHERE id = ?
    `;
    
    db.query(updateQuery, [subject_id, program_id, year_level, section, academic_year, semester, instructor_id, status, id], (err) => {
      if (err) {
        console.error("Error updating offering:", err);
        return res.status(500).json({ success: false, message: "Failed to update offering" });
      }
      
      return res.status(200).json({ success: true, message: "Subject offering updated successfully" });
    });
  } catch (error) {
    console.error("Update subject offering error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Delete subject offering
 */
const deleteSubjectOffering = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleteQuery = "DELETE FROM subject_offerings WHERE id = ?";
    db.query(deleteQuery, [id], (err) => {
      if (err) {
        console.error("Error deleting offering:", err);
        return res.status(500).json({ success: false, message: "Failed to delete offering" });
      }
      
      return res.status(200).json({ success: true, message: "Subject offering deleted successfully" });
    });
  } catch (error) {
    console.error("Delete subject offering error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get students in a subject offering
 */
const getSubjectOfferingStudents = async (req, res) => {
  try {
    const { offeringId } = req.params;
    
    // First get the offering details
    const offeringQuery = "SELECT * FROM subject_offerings WHERE id = ?";
    const offeringResults = await new Promise((resolve, reject) => {
      db.query(offeringQuery, [offeringId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (!offeringResults.length) {
      return res.status(404).json({ success: false, message: "Offering not found" });
    }
    
    const offering = offeringResults[0];
    
    // Get students from this program
    const query = `
      SELECT u.id, u.full_name, u.email, st.studentID, cm.course_section
      FROM students st
      INNER JOIN users u ON st.user_id = u.id
      LEFT JOIN course_management cm ON st.program_id = cm.id
      WHERE st.program_id = ? AND u.status = 'active'
      ORDER BY u.full_name
    `;
    
    db.query(query, [offering.program_id], (err, results) => {
      if (err) {
        console.error("Error fetching offering students:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch students" });
      }
      
      return res.status(200).json({ success: true, students: results });
    });
  } catch (error) {
    console.error("Get subject offering students error:", error);
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
  getStudentsByProgram,
  // Subject Offerings
  getAllSubjectOfferings,
  createSubjectOffering,
  updateSubjectOffering,
  deleteSubjectOffering,
  getSubjectOfferingStudents
};
