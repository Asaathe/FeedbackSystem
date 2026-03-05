// Evaluation Form Controller
// Handles evaluation form creation, linking, and response collection
const db = require("../config/database");

/**
 * Link an evaluation form to a subject
 */
const linkEvaluationForm = async (req, res) => {
  try {
    const { form_id, subject_id, instructor_id, academic_year, semester } = req.body;
    
    if (!form_id || !subject_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Form ID and Subject ID are required" 
      });
    }
    
    // Check if link already exists
    const checkQuery = `
      SELECT id FROM evaluation_forms 
      WHERE form_id = ? AND subject_id = ?
    `;
    db.query(checkQuery, [form_id, subject_id], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking evaluation form:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (checkResults.length > 0) {
        // Update existing
        const updateQuery = `
          UPDATE evaluation_forms 
          SET instructor_id = ?, academic_year = ?, semester = ?, is_active = TRUE
          WHERE form_id = ? AND subject_id = ?
        `;
        db.query(updateQuery, [instructor_id, academic_year || '2025-2026', semester || '1st', form_id, subject_id], (updateErr) => {
          if (updateErr) {
            console.error("Error updating evaluation form:", updateErr);
            return res.status(500).json({ success: false, message: "Failed to update evaluation form" });
          }
          return res.status(200).json({ success: true, message: "Evaluation form updated successfully" });
        });
      } else {
        // Insert new
        const insertQuery = `
          INSERT INTO evaluation_forms (form_id, subject_id, instructor_id, academic_year, semester)
          VALUES (?, ?, ?, ?, ?)
        `;
        db.query(insertQuery, [form_id, subject_id, instructor_id, academic_year || '2025-2026', semester || '1st'], (insertErr, result) => {
          if (insertErr) {
            console.error("Error linking evaluation form:", insertErr);
            return res.status(500).json({ success: false, message: "Failed to link evaluation form" });
          }
          return res.status(201).json({ success: true, message: "Evaluation form linked successfully" });
        });
      }
    });
  } catch (error) {
    console.error("Link evaluation form error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Unlink an evaluation form from a subject
 */
const unlinkEvaluationForm = async (req, res) => {
  try {
    const { id } = req.params;
    
    const updateQuery = "UPDATE evaluation_forms SET is_active = FALSE WHERE id = ?";
    db.query(updateQuery, [id], (err, result) => {
      if (err) {
        console.error("Error unlinking evaluation form:", err);
        return res.status(500).json({ success: false, message: "Failed to unlink evaluation form" });
      }
      
      return res.status(200).json({ success: true, message: "Evaluation form unlinked successfully" });
    });
  } catch (error) {
    console.error("Unlink evaluation form error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get evaluation forms for a subject
 */
const getSubjectEvaluationForms = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const query = `
      SELECT 
        ef.id,
        ef.form_id,
        ef.subject_id,
        ef.instructor_id,
        ef.academic_year,
        ef.semester,
        ef.is_active,
        f.title as form_title,
        f.description as form_description,
        u.full_name as instructor_name
      FROM evaluation_forms ef
      INNER JOIN Forms f ON ef.form_id = f.id
      LEFT JOIN users u ON ef.instructor_id = u.id
      WHERE ef.subject_id = ?
      ORDER BY ef.created_at DESC
    `;
    
    db.query(query, [subjectId], (err, results) => {
      if (err) {
        console.error("Error fetching evaluation forms:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch evaluation forms" });
      }
      return res.status(200).json({ success: true, forms: results });
    });
  } catch (error) {
    console.error("Get subject evaluation forms error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get evaluation forms for a student (to submit)
 */
const getStudentEvaluationForms = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log("🔍 [getStudentEvaluationForms] User ID:", userId);
    
    // First check if student has any enrollments
    const checkEnrollmentsQuery = `
      SELECT COUNT(*) as count FROM student_enrollments 
      WHERE student_id = ? AND status = 'enrolled'
    `;
    db.query(checkEnrollmentsQuery, [userId], (enrollErr, enrollResults) => {
      if (enrollErr) {
        console.error("🔍 [getStudentEvaluationForms] Error checking enrollments:", enrollErr);
      } else {
        console.log("🔍 [getStudentEvaluationForms] Enrollment count:", enrollResults[0].count);
      }
    });
    
    // Check if there are any subject_evaluation_forms entries
    const checkFormsQuery = `SELECT COUNT(*) as count FROM subject_evaluation_forms`;
    db.query(checkFormsQuery, [], (formsErr, formsResults) => {
      if (formsErr) {
        console.error("🔍 [getStudentEvaluationForms] Error checking forms:", formsErr);
      } else {
        console.log("🔍 [getStudentEvaluationForms] Total subject_evaluation_forms:", formsResults[0].count);
      }
    });
    
    // Check Forms status
    const checkFormsStatusQuery = `SELECT id, title, status FROM Forms LIMIT 10`;
    db.query(checkFormsStatusQuery, [], (statusErr, statusResults) => {
      if (statusErr) {
        console.error("🔍 [getStudentEvaluationForms] Error checking form status:", statusErr);
      } else {
        console.log("🔍 [getStudentEvaluationForms] Forms status:", statusResults);
      }
    });
    
    // Get subjects the student is enrolled in, joined with subject_evaluation_forms
    // Key insight: subject_evaluation_forms.subject_instructor_id stores the subject_id, not the instructor_courses.id
    const enrollmentsQuery = `
      SELECT DISTINCT
        se.subject_id,
        s.subject_code,
        s.subject_name,
        s.department,
        s.units,
        sef.id as evaluation_form_id,
        COALESCE(si.id, ic.id) as subject_instructor_id,
        COALESCE(si.instructor_id, ic.instructor_id) as instructor_id,
        COALESCE(si.semester, '1st Semester') as semester,
        COALESCE(si.academic_year, '2025-2026') as academic_year,
        COALESCE(siu.full_name, iu.full_name) as instructor_name,
        sef.form_id,
        f.title as form_title,
        f.description as form_description,
        f.category as form_category,
        sef.start_date,
        sef.end_date
      FROM student_enrollments se
      INNER JOIN subjects s ON se.subject_id = s.id
      LEFT JOIN subject_instructors si ON s.id = si.subject_id
      LEFT JOIN users siu ON si.instructor_id = siu.id
      LEFT JOIN instructor_courses ic ON s.id = ic.subject_id
      LEFT JOIN users iu ON ic.instructor_id = iu.id
      LEFT JOIN subject_evaluation_forms sef ON (
        sef.subject_id = s.id 
        OR sef.subject_instructor_id = s.id
        OR sef.subject_instructor_id = si.subject_id
        OR sef.subject_instructor_id = ic.subject_id
      )
      INNER JOIN Forms f ON sef.form_id = f.id
      WHERE se.student_id = ? 
        AND se.status = 'enrolled'
        AND s.status = 'active'
        AND f.status = 'active'
        AND sef.form_id IS NOT NULL
      ORDER BY s.subject_code
    `;
    
    db.query(enrollmentsQuery, [userId], async (err, results) => {
      if (err) {
        console.error("Error fetching student evaluation forms:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch evaluation forms" });
      }
      
      // Handle empty or null results
      if (!results || results.length === 0) {
        return res.status(200).json({ success: true, forms: [] });
      }
      
      // Check which forms have already been submitted
      const formsWithSubmissionStatus = await Promise.all(results.map(async (form) => {
        const checkQuery = `
          SELECT id FROM subject_evaluation_responses 
          WHERE student_id = ? AND evaluation_form_id = ?
        `;
        return new Promise((resolve) => {
          db.query(checkQuery, [userId, form.evaluation_form_id], (err, checkResults) => {
            resolve({
              ...form,
              is_submitted: checkResults && checkResults.length > 0
            });
          });
        });
      }));
      
      return res.status(200).json({ success: true, evaluations: formsWithSubmissionStatus });
    });
  } catch (error) {
    console.error("Get student evaluation forms error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Submit evaluation response
 */
const submitEvaluationResponse = async (req, res) => {
  try {
    const userId = req.user.id;
    const { evaluation_form_id, responses } = req.body;
    
    if (!evaluation_form_id || !responses) {
      return res.status(400).json({ 
        success: false, 
        message: "Evaluation form ID and responses are required" 
      });
    }
    
    // Get evaluation form details
    const formQuery = `
      SELECT sef.*, f.title as form_title 
      FROM subject_evaluation_forms sef
      INNER JOIN Forms f ON sef.form_id = f.id
      WHERE sef.id = ?
    `;
    
    db.query(formQuery, [evaluation_form_id], async (err, formResults) => {
      if (err) {
        console.error("Error fetching evaluation form:", err);
        return res.status(500).json({ success: false, message: "Database error" });
      }
      
      if (formResults.length === 0) {
        return res.status(404).json({ success: false, message: "Evaluation form not found or inactive" });
      }
      
      const evaluationForm = formResults[0];
      
      // Check if already submitted
      const checkQuery = `
        SELECT id FROM subject_evaluation_responses 
        WHERE student_id = ? AND evaluation_form_id = ?
      `;
      db.query(checkQuery, [userId, evaluation_form_id], (checkErr, checkResults) => {
        if (checkErr) {
          console.error("Error checking existing response:", checkErr);
          return res.status(500).json({ success: false, message: "Database error" });
        }
        
        if (checkResults.length > 0) {
          return res.status(400).json({ success: false, message: "You have already submitted this evaluation" });
        }
        
        // Calculate overall rating from responses
        const ratings = Object.values(responses).filter(r => typeof r === 'number');
        const overallRating = ratings.length > 0 
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
          : 0;
        
        // Insert the response (disable foreign key checks temporarily)
        db.query('SET FOREIGN_KEY_CHECKS = 0', (fkErr) => {
          const insertQuery = `
            INSERT INTO subject_evaluation_responses 
              (evaluation_form_id, subject_id, instructor_id, student_id, academic_year, semester, responses, overall_rating)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          // Get instructor_id from subject_instructor_id or set to null
          const instructorId = evaluationForm.subject_instructor_id || null;
          
          db.query(insertQuery, [
            evaluation_form_id,
            evaluationForm.subject_id,
            instructorId,
            userId,
            evaluationForm.academic_year || null,
            evaluationForm.semester || null,
            JSON.stringify(responses),
            overallRating
          ], (insertErr, result) => {
            // Re-enable foreign key checks
            db.query('SET FOREIGN_KEY_CHECKS = 1', () => {});
            
            if (insertErr) {
              console.error("Error submitting evaluation:", insertErr);
              return res.status(500).json({ success: false, message: "Failed to submit evaluation" });
            }
            
            return res.status(201).json({ success: true, message: "Evaluation submitted successfully" });
          });
        });
      });
    });
  } catch (error) {
    console.error("Submit evaluation response error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get evaluation results for a subject (with analytics)
 */
const getSubjectEvaluationResults = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { academic_year, semester } = req.query;
    
    // Validate subjectId
    if (!subjectId || isNaN(parseInt(subjectId))) {
      return res.status(400).json({ success: false, message: "Invalid subject ID" });
    }
    
    // Get subject info from subjects table
    const subjectQuery = "SELECT * FROM subjects WHERE id = ?";
    db.query(subjectQuery, [subjectId], async (err, subjectResults) => {
      if (err) {
        console.error("Error fetching subject:", err);
        return res.status(500).json({ success: false, message: "Database error: " + err.message });
      }
      
      if (subjectResults.length === 0) {
        return res.status(404).json({ success: false, message: "Subject not found. Subject ID " + subjectId + " does not exist in subjects table." });
      }
      
      const subject = subjectResults[0];
      
      // Build response query
      let responseQuery = `
        SELECT 
          ser.*,
          u.full_name as student_name,
          st.studentID as student_number
        FROM subject_evaluation_responses ser
        INNER JOIN users u ON ser.student_id = u.id
        LEFT JOIN students st ON u.id = st.user_id
        WHERE ser.subject_id = ?
      `;
      
      const params = [subjectId];
      
      if (academic_year) {
        responseQuery += ` AND ser.academic_year = ?`;
        params.push(academic_year);
      }
      
      if (semester) {
        responseQuery += ` AND ser.semester = ?`;
        params.push(semester);
      }
      
      responseQuery += ` ORDER BY ser.submitted_at DESC`;
      
      db.query(responseQuery, params, async (err, responses) => {
        if (err) {
          console.error("Error fetching responses:", err);
          return res.status(500).json({ success: false, message: "Failed to fetch responses" });
        }
        
        // Get enrolled students count from student_enrollments
        const enrolledQuery = `
          SELECT COUNT(*) as count FROM student_enrollments 
          WHERE subject_id = ? AND status = 'enrolled'
        `;
        const enrolledResult = await new Promise((resolve, reject) => {
          db.query(enrolledQuery, [subjectId], (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        
        const totalEnrolled = enrolledResult[0]?.count || 0;
        const totalResponses = responses.length;
        
        // Calculate analytics if there are responses
        let analytics = null;
        if (responses.length > 0) {
          // Parse all responses
          const allResponses = responses.map(r => ({
            ...r,
            parsed_responses: JSON.parse(r.responses)
          }));
          
          // Get all unique question keys
          const questionKeys = new Set();
          allResponses.forEach(r => {
            Object.keys(r.parsed_responses).forEach(key => questionKeys.add(key));
          });
          
          // Calculate average for each question
          const questionAverages = {};
          questionKeys.forEach(key => {
            const ratings = allResponses
              .map(r => r.parsed_responses[key])
              .filter(r => typeof r === 'number');
            
            if (ratings.length > 0) {
              questionAverages[key] = {
                sum: ratings.reduce((a, b) => a + b, 0),
                count: ratings.length,
                average: ratings.reduce((a, b) => a + b, 0) / ratings.length
              };
            }
          });
          
          // Calculate overall average
          const overallRatings = allResponses
            .map(r => r.overall_rating)
            .filter(r => r !== null);
          
          const overallAverage = overallRatings.length > 0
            ? overallRatings.reduce((a, b) => a + b, 0) / overallRatings.length
            : 0;
          
          // Rating distribution
          const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          overallRatings.forEach(rating => {
            const rounded = Math.round(rating);
            if (rounded >= 1 && rounded <= 5) {
              ratingDistribution[rounded]++;
            }
          });
          
          analytics = {
            total_responses: totalResponses,
            total_enrolled: totalEnrolled,
            response_rate: totalEnrolled > 0 ? (totalResponses / totalEnrolled * 100).toFixed(1) : 0,
            overall_average: parseFloat(overallAverage.toFixed(2)),
            question_averages: questionAverages,
            rating_distribution: ratingDistribution
          };
        }
        
        return res.status(200).json({
          success: true,
          subject,
          responses: responses.map(r => ({
            ...r,
            responses: JSON.parse(r.responses)
          })),
          analytics
        });
      });
    });
  } catch (error) {
    console.error("Get subject evaluation results error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get evaluation results grouped by section/program (for admin dashboard)
 */
const getEvaluationSummaryBySection = async (req, res) => {
  try {
    const { academic_year, semester } = req.query;
    
    const query = `
      SELECT 
        es.subject_code,
        es.subject_name,
        es.department,
        u.full_name as instructor_name,
        COUNT(DISTINCT ss.student_id) as total_enrolled,
        COUNT(DISTINCT ser.id) as total_responses,
        AVG(ser.overall_rating) as average_rating
      FROM evaluation_subjects es
      LEFT JOIN subject_instructors si ON es.id = si.subject_id 
        AND si.academic_year = COALESCE(?, si.academic_year)
        AND si.semester = COALESCE(?, si.semester)
      LEFT JOIN users u ON si.instructor_id = u.id
      LEFT JOIN subject_students ss ON es.id = ss.subject_id 
        AND ss.status = 'enrolled'
        AND ss.academic_year = COALESCE(?, ss.academic_year)
        AND ss.semester = COALESCE(?, ss.semester)
      LEFT JOIN subject_evaluation_responses ser ON es.id = ser.subject_id 
        AND ser.academic_year = COALESCE(?, ser.academic_year)
        AND ser.semester = COALESCE(?, ser.semester)
      WHERE es.status = 'active'
      GROUP BY es.id, es.subject_code, es.subject_name, es.department, u.full_name
      ORDER BY es.subject_code
    `;
    
    const params = [academic_year, semester, academic_year, semester, academic_year, semester];
    
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Error fetching evaluation summary:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch summary" });
      }
      
      return res.status(200).json({ success: true, summary: results });
    });
  } catch (error) {
    console.error("Get evaluation summary error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get instructor evaluation results
 */
const getInstructorEvaluationResults = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { academic_year, semester } = req.query;
    
    // Get subjects taught by instructor
    const subjectsQuery = `
      SELECT 
        es.id as subject_id,
        es.subject_code,
        es.subject_name,
        es.department
      FROM subject_instructors si
      INNER JOIN evaluation_subjects es ON si.subject_id = es.id
      WHERE si.instructor_id = ?
    `;
    
    const params = [instructorId];
    
    if (academic_year) {
      subjectsQuery += ` AND si.academic_year = ?`;
      params.push(academic_year);
    }
    
    if (semester) {
      subjectsQuery += ` AND si.semester = ?`;
      params.push(semester);
    }
    
    db.query(subjectsQuery, params, async (err, subjects) => {
      if (err) {
        console.error("Error fetching instructor subjects:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch subjects" });
      }
      
      // Get results for each subject
      const subjectsWithResults = await Promise.all(subjects.map(async (subject) => {
        const result = await new Promise((resolve) => {
          const query = `
            SELECT 
              COUNT(*) as total_responses,
              AVG(overall_rating) as average_rating
            FROM subject_evaluation_responses
            WHERE subject_id = ? AND instructor_id = ?
          `;
          
          const params = [subject.subject_id, instructorId];
          
          if (academic_year) {
            params.push(academic_year);
          }
          if (semester) {
            params.push(semester);
          }
          
          db.query(query, params, (err, results) => {
            if (err) resolve(null);
            else resolve(results[0]);
          });
        });
        
        return {
          ...subject,
          total_responses: result?.total_responses || 0,
          average_rating: result?.average_rating ? parseFloat(result.average_rating.toFixed(2)) : 0
        };
      }));
      
      // Calculate overall stats
      const totalResponses = subjectsWithResults.reduce((sum, s) => sum + s.total_responses, 0);
      const avgRating = subjectsWithResults.length > 0
        ? subjectsWithResults.reduce((sum, s) => sum + (s.average_rating * s.total_responses), 0) / (totalResponses || 1)
        : 0;
      
      return res.status(200).json({
        success: true,
        instructor_id: instructorId,
        subjects: subjectsWithResults,
        overall_stats: {
          total_subjects: subjects.length,
          total_responses: totalResponses,
          average_rating: parseFloat(avgRating.toFixed(2))
        }
      });
    });
  } catch (error) {
    console.error("Get instructor evaluation results error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get evaluation results by section with question category averages (C1, C2, C3)
 * Returns results grouped by program/section with question category breakdowns
 */
const getEvaluationResultsBySection = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { academic_year, semester } = req.query;

    // Validate subjectId
    if (!subjectId || isNaN(parseInt(subjectId))) {
      return res.status(400).json({ success: false, message: "Invalid subject ID" });
    }

    // First check if subject exists
    const subjectCheckQuery = "SELECT id, subject_code, subject_name FROM evaluation_subjects WHERE id = ?";
    db.query(subjectCheckQuery, [subjectId], async (err, subjectResults) => {
      if (err) {
        console.error("Error checking subject:", err);
        return res.status(500).json({ success: false, message: "Database error: " + err.message });
      }

      if (subjectResults.length === 0) {
        return res.status(404).json({ success: false, message: "Subject not found. Subject ID " + subjectId + " does not exist in evaluation_subjects table." });
      }

      const subject = subjectResults[0];

      // First, get all students enrolled in this subject grouped by program
      const studentsQuery = `
        SELECT 
          ss.student_id,
          ss.subject_id,
          st.program_id,
          p.program_name,
          st.year_level,
          st.section
        FROM subject_students ss
        LEFT JOIN students st ON ss.student_id = st.user_id
        LEFT JOIN programs p ON st.program_id = p.id
        WHERE ss.subject_id = ? 
          AND ss.status = 'enrolled'
          AND (? IS NULL OR ss.academic_year = ?)
          AND (? IS NULL OR ss.semester = ?)
      `;

      db.query(studentsQuery, [subjectId, academic_year, academic_year, semester, semester], async (err, students) => {
      if (err) {
        console.error("Error fetching students:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch students" });
      }

      // Group students by program/section
      const programGroups = {};
      students.forEach(student => {
        const key = student.program_id ? `${student.program_name} - Year ${student.year_level}${student.section ? ' Section ' + student.section : ''}` : 'General';
        if (!programGroups[key]) {
          programGroups[key] = {
            program_name: key,
            student_ids: [],
            total_enrolled: 0
          };
        }
        programGroups[key].student_ids.push(student.student_id);
        programGroups[key].total_enrolled++;
      });

      // Get evaluation responses for this subject
      const responsesQuery = `
        SELECT 
          ser.*,
          st.program_id,
          p.program_name,
          st.year_level,
          st.section
        FROM subject_evaluation_responses ser
        LEFT JOIN students st ON ser.student_id = st.user_id
        LEFT JOIN programs p ON st.program_id = p.id
        WHERE ser.subject_id = ?
          AND (? IS NULL OR ser.academic_year = ?)
          AND (? IS NULL OR ser.semester = ?)
      `;

      db.query(responsesQuery, [subjectId, academic_year, academic_year, semester, semester], (respErr, responses) => {
        if (respErr) {
          console.error("Error fetching responses:", respErr);
          return res.status(500).json({ success: false, message: "Failed to fetch responses" });
        }

        // Group responses by program and calculate averages
        const results = Object.keys(programGroups).map(key => {
          const group = programGroups[key];
          const groupResponses = responses.filter(r => {
            const rKey = r.program_id ? `${r.program_name} - Year ${r.year_level}${r.section ? ' Section ' + r.section : ''}` : 'General';
            return rKey === key;
          });

          // Calculate C1, C2, C3 averages from responses JSON
          let c1Sum = 0, c1Count = 0;
          let c2Sum = 0, c2Count = 0;
          let c3Sum = 0, c3Count = 0;
          let overallSum = 0;

          groupResponses.forEach(response => {
            if (response.responses) {
              try {
                const resp = typeof response.responses === 'string' 
                  ? JSON.parse(response.responses) 
                  : response.responses;
                
                // Calculate category averages - assuming questions are stored by ID
                Object.keys(resp).forEach(questionId => {
                  const value = parseFloat(resp[questionId]);
                  if (!isNaN(value)) {
                    // C1: Questions 1-3 (Teaching Effectiveness)
                    if (['1', '2', '3'].includes(questionId)) {
                      c1Sum += value;
                      c1Count++;
                    }
                    // C2: Questions 4-6 (Course Content)
                    else if (['4', '5', '6'].includes(questionId)) {
                      c2Sum += value;
                      c2Count++;
                    }
                    // C3: Questions 7-9 (Assessment)
                    else if (['7', '8', '9'].includes(questionId)) {
                      c3Sum += value;
                      c3Count++;
                    }
                    overallSum += value;
                  }
                });
              } catch (parseErr) {
                console.error("Error parsing response:", parseErr);
              }
            }
            if (response.overall_rating) {
              overallSum += parseFloat(response.overall_rating);
            }
          });

          const c1 = c1Count > 0 ? (c1Sum / c1Count).toFixed(1) : 'N/A';
          const c2 = c2Count > 0 ? (c2Sum / c2Count).toFixed(1) : 'N/A';
          const c3 = c3Count > 0 ? (c3Sum / c3Count).toFixed(1) : 'N/A';
          const average = groupResponses.length > 0 
            ? ((parseFloat(c1) || 0) + (parseFloat(c2) || 0) + (parseFloat(c3) || 0)) / 3
            : 0;

          return {
            respondents: key,
            total_enrolled: group.total_enrolled,
            total_responses: groupResponses.length,
            c1: c1,
            c2: c2,
            c3: c3,
            average: average > 0 ? average.toFixed(1) : 'N/A'
          };
        });

        return res.status(200).json({ success: true, results });
      });
      });
    });
  } catch (error) {
    console.error("Get evaluation results by section error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  linkEvaluationForm,
  unlinkEvaluationForm,
  getSubjectEvaluationForms,
  getStudentEvaluationForms,
  submitEvaluationResponse,
  getSubjectEvaluationResults,
  getEvaluationSummaryBySection,
  getInstructorEvaluationResults,
  getEvaluationResultsBySection
};
