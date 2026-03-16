// Feedback Template Controller
// Handles feedback template categories and evaluation periods
const db = require("../config/database");

// ============================================
// FEEDBACK TEMPLATE CATEGORIES
// ============================================

/**
 * Get all feedback template categories
 */
const getCategories = async (req, res) => {
  try {
    const { feedback_type } = req.query;
    
    let query = `
      SELECT id, category_name, description, display_order, feedback_type, is_active, created_at, updated_at, parent_category_id
      FROM feedback_template_categories
    `;
    
    let params = [];
    
    if (feedback_type) {
      query += " WHERE feedback_type = ? OR feedback_type = 'general'";
      params.push(feedback_type);
    }
    
    query += " ORDER BY display_order ASC";
    
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Error fetching categories:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch categories" });
      }
      return res.status(200).json({ success: true, categories: results });
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Add a new feedback category
 */
const addCategory = async (req, res) => {
  try {
    const { category_name, description, display_order, feedback_type, parent_category_id } = req.body;

    if (!category_name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    // Check if category already exists for this feedback type (only for main categories)
    const checkQuery = parent_category_id 
      ? "SELECT id FROM feedback_template_categories WHERE category_name = ? AND parent_category_id = ?"
      : "SELECT id FROM feedback_template_categories WHERE category_name = ? AND (parent_category_id IS NULL OR parent_category_id = 0)";
    
    const checkParams = parent_category_id ? [category_name, parent_category_id] : [category_name];
    
    db.query(checkQuery, checkParams, (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking category:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (checkResults.length > 0) {
        return res.status(400).json({ success: false, message: "Category already exists" });
      }

      // Get the next display order if not provided
      let order = display_order;
      if (order === undefined || order === null) {
        const orderQuery = "SELECT MAX(display_order) as max_order FROM feedback_template_categories";
        db.query(orderQuery, (orderErr, orderResults) => {
          if (orderErr) {
            console.error("Error getting max order:", orderErr);
            order = 1;
          } else {
            order = (orderResults[0].max_order || 0) + 1;
          }
          insertCategory();
        });
      } else {
        insertCategory();
      }

      function insertCategory() {
        const insertQuery = "INSERT INTO feedback_template_categories (category_name, description, display_order, feedback_type, parent_category_id) VALUES (?, ?, ?, ?, ?)";
        db.query(insertQuery, [category_name, description || null, order, feedback_type || 'subject', parent_category_id || null], (insertErr, result) => {
          if (insertErr) {
            console.error("Error adding category:", insertErr);
            return res.status(500).json({ success: false, message: "Failed to add category" });
          }
          return res.status(201).json({ 
            success: true, 
            message: "Category added successfully",
            category: { id: result.insertId, category_name, description, display_order: order, feedback_type, parent_category_id }
          });
        });
      }
    });
  } catch (error) {
    console.error("Add category error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Update a feedback category
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, description, display_order, is_active, feedback_type, parent_category_id } = req.body;

    if (!category_name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    // Check if category exists
    const checkQuery = "SELECT id FROM feedback_template_categories WHERE id = ?";
    db.query(checkQuery, [id], (checkErr, checkResults) => {
      if (checkErr) {
        console.error("Error checking category:", checkErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }

      // Prevent a category from being its own parent
      if (parent_category_id && parseInt(parent_category_id) === parseInt(id)) {
        return res.status(400).json({ success: false, message: "A category cannot be its own parent" });
      }

      // Check if category name is already used by another category (in same parent or same level)
      const nameCheckQuery = parent_category_id 
        ? "SELECT id FROM feedback_template_categories WHERE category_name = ? AND id != ? AND parent_category_id = ?"
        : "SELECT id FROM feedback_template_categories WHERE category_name = ? AND id != ? AND (parent_category_id IS NULL OR parent_category_id = 0)";
      
      const nameCheckParams = parent_category_id ? [category_name, id, parent_category_id] : [category_name, id];
      
      db.query(nameCheckQuery, nameCheckParams, (nameCheckErr, nameCheckResults) => {
        if (nameCheckErr) {
          console.error("Error checking category name:", nameCheckErr);
          return res.status(500).json({ success: false, message: "Database error" });
        }

        if (nameCheckResults.length > 0) {
          return res.status(400).json({ success: false, message: "Category name already exists" });
        }

        const updateQuery = `
          UPDATE feedback_template_categories 
          SET category_name = ?, description = ?, display_order = ?, is_active = ?, feedback_type = ?, parent_category_id = ?
          WHERE id = ?
        `;
        db.query(updateQuery, [category_name, description, display_order, is_active, feedback_type || 'subject', parent_category_id || null, id], (updateErr) => {
          if (updateErr) {
            console.error("Error updating category:", updateErr);
            return res.status(500).json({ success: false, message: "Failed to update category" });
          }
          return res.status(200).json({ success: true, message: "Category updated successfully" });
        });
      });
    });
  } catch (error) {
    console.error("Update category error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Delete a feedback category
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Also delete all subcategories
    const deleteSubcategoriesQuery = "DELETE FROM feedback_template_categories WHERE parent_category_id = ?";
    db.query(deleteSubcategoriesQuery, [id], (subDeleteErr) => {
      if (subDeleteErr) {
        console.error("Error deleting subcategories:", subDeleteErr);
        // Continue with deletion anyway
      }
      
      const deleteQuery = "DELETE FROM feedback_template_categories WHERE id = ?";
      db.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error("Error deleting category:", err);
        return res.status(500).json({ success: false, message: "Failed to delete category" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }

      return res.status(200).json({ success: true, message: "Category deleted successfully" });
      });
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Reorder categories
 */
const reorderCategories = async (req, res) => {
  try {
    const { categories } = req.body; // Array of { id, display_order }

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ success: false, message: "Categories array is required" });
    }

    const updatePromises = categories.map(cat => {
      return new Promise((resolve, reject) => {
        const updateQuery = "UPDATE feedback_template_categories SET display_order = ? WHERE id = ?";
        db.query(updateQuery, [cat.display_order, cat.id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    await Promise.all(updatePromises);
    return res.status(200).json({ success: true, message: "Categories reordered successfully" });
  } catch (error) {
    console.error("Reorder categories error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ============================================
// EVALUATION PERIODS
// ============================================

/**
 * Get all evaluation periods
 */
const getEvaluationPeriods = async (req, res) => {
  try {
    const query = `
      SELECT id, name, start_date, end_date, is_active, academic_year, semester, created_at, updated_at
      FROM evaluation_periods
      ORDER BY start_date DESC
    `;
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching evaluation periods:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch evaluation periods" });
      }
      return res.status(200).json({ success: true, periods: results });
    });
  } catch (error) {
    console.error("Get evaluation periods error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Get active evaluation period
 */
const getActiveEvaluationPeriod = async (req, res) => {
  try {
    const query = `
      SELECT id, name, start_date, end_date, is_active, academic_year, semester
      FROM evaluation_periods
      WHERE is_active = TRUE
      ORDER BY start_date DESC
      LIMIT 1
    `;
    db.query(query, (err, results) => {
      if (err) {
        console.error("Error fetching active period:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch active period" });
      }

      if (results.length === 0) {
        return res.status(200).json({ success: true, period: null });
      }

      const period = results[0];
      
      // Check if period is within valid date range
      const now = new Date();
      const startDate = new Date(period.start_date);
      const endDate = new Date(period.end_date);
      
      const isWithinPeriod = now >= startDate && now <= endDate;
      
      return res.status(200).json({ 
        success: true, 
        period: { ...period, is_within_period: isWithinPeriod }
      });
    });
  } catch (error) {
    console.error("Get active evaluation period error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Create a new evaluation period
 */
const createEvaluationPeriod = async (req, res) => {
  try {
    const { name, start_date, end_date, academic_year, semester } = req.body;

    if (!name || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: "Name, start date, and end date are required" });
    }

    // Check for overlapping periods
    const overlapQuery = `
      SELECT id FROM evaluation_periods 
      WHERE ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?) OR (start_date >= ? AND end_date <= ?))
    `;
    db.query(overlapQuery, [start_date, start_date, end_date, end_date, start_date, end_date], (overlapErr, overlapResults) => {
      if (overlapErr) {
        console.error("Error checking overlap:", overlapErr);
        return res.status(500).json({ success: false, message: "Database error" });
      }

      if (overlapResults.length > 0) {
        return res.status(400).json({ success: false, message: "Evaluation period overlaps with existing period" });
      }

      const insertQuery = `
        INSERT INTO evaluation_periods (name, start_date, end_date, academic_year, semester, is_active)
        VALUES (?, ?, ?, ?, ?, FALSE)
      `;
      db.query(insertQuery, [name, start_date, end_date, academic_year || null, semester || null], (insertErr, result) => {
        if (insertErr) {
          console.error("Error creating evaluation period:", insertErr);
          return res.status(500).json({ success: false, message: "Failed to create evaluation period" });
        }
        return res.status(201).json({ 
          success: true, 
          message: "Evaluation period created successfully",
          period: { id: result.insertId, name, start_date, end_date, academic_year, semester, is_active: false }
        });
      });
    });
  } catch (error) {
    console.error("Create evaluation period error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Update evaluation period
 */
const updateEvaluationPeriod = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, start_date, end_date, academic_year, semester, is_active } = req.body;

    if (!name || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: "Name, start date, and end date are required" });
    }

    // If activating this period, deactivate all others first
    if (is_active === true) {
      const deactivateQuery = "UPDATE evaluation_periods SET is_active = FALSE";
      db.query(deactivateQuery, (deactivateErr) => {
        if (deactivateErr) {
          console.error("Error deactivating periods:", deactivateErr);
        }
        updatePeriod();
      });
    } else {
      updatePeriod();
    }

    function updatePeriod() {
      const updateQuery = `
        UPDATE evaluation_periods 
        SET name = ?, start_date = ?, end_date = ?, academic_year = ?, semester = ?, is_active = ?
        WHERE id = ?
      `;
      db.query(updateQuery, [name, start_date, end_date, academic_year, semester, is_active || false, id], (updateErr) => {
        if (updateErr) {
          console.error("Error updating evaluation period:", updateErr);
          return res.status(500).json({ success: false, message: "Failed to update evaluation period" });
        }
        return res.status(200).json({ success: true, message: "Evaluation period updated successfully" });
      });
    }
  } catch (error) {
    console.error("Update evaluation period error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Delete evaluation period
 */
const deleteEvaluationPeriod = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = "DELETE FROM evaluation_periods WHERE id = ?";
    db.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error("Error deleting evaluation period:", err);
        return res.status(500).json({ success: false, message: "Failed to delete evaluation period" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Evaluation period not found" });
      }

      return res.status(200).json({ success: true, message: "Evaluation period deleted successfully" });
    });
  } catch (error) {
    console.error("Delete evaluation period error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Toggle evaluation period active status
 */
const toggleEvaluationPeriod = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // If activating, deactivate all others first
    if (is_active === true) {
      const deactivateQuery = "UPDATE evaluation_periods SET is_active = FALSE";
      db.query(deactivateQuery, (deactivateErr) => {
        if (deactivateErr) {
          console.error("Error deactivating periods:", deactivateErr);
        }
        activatePeriod();
      });
    } else {
      activatePeriod();
    }

    function activatePeriod() {
      const updateQuery = "UPDATE evaluation_periods SET is_active = ? WHERE id = ?";
      db.query(updateQuery, [is_active, id], (updateErr) => {
        if (updateErr) {
          console.error("Error toggling evaluation period:", updateErr);
          return res.status(500).json({ success: false, message: "Failed to toggle evaluation period" });
        }
        return res.status(200).json({ success: true, message: `Evaluation period ${is_active ? 'activated' : 'deactivated'} successfully` });
      });
    }
  } catch (error) {
    console.error("Toggle evaluation period error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ============================================
// STUDENT FEEDBACK SUBMISSION
// ============================================

/**
 * Get student's enrolled subjects with instructor info
 * Now includes subject_offerings for proper subject offering data
 */
const getStudentEnrolledSubjects = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current academic year and semester
    const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
    let semester = '1st';
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
      
      // Get active evaluation period
      const periodQuery = `
        SELECT id, name, start_date, end_date, is_active
        FROM evaluation_periods
        WHERE is_active = TRUE
        LIMIT 1
      `;
      db.query(periodQuery, (periodErr, periodResults) => {
        if (periodErr) {
          console.error("Error fetching period:", periodErr);
        }
        
        const activePeriod = periodResults && periodResults.length > 0 ? periodResults[0] : null;
        
        // First get student's program info
        const studentProgramQuery = "SELECT program_id FROM students WHERE user_id = ?";
        db.query(studentProgramQuery, [userId], (studentErr, studentResults) => {
          if (studentErr) {
            console.error("Error fetching student info:", studentErr);
          }
          
          const studentProgramId = studentResults && studentResults.length > 0 ? studentResults[0].program_id : null;
          console.log("Student program query results:", studentResults);
          console.log("Student program ID:", studentProgramId);
          console.log("Query params - academicYear:", academicYear, "semester:", semester);
          
          // Query from subject_offerings (main table for subject offerings)
          // Try without program filter if program_id is null
          let subjectOfferingsQuery = null;
          if (studentProgramId) {
            subjectOfferingsQuery = `
              SELECT 
                so.id as offering_id,
                so.subject_id,
                es.subject_code,
                es.subject_name,
                es.department,
                es.units,
                so.program_id,
                so.year_level,
                so.section,
                so.academic_year,
                so.semester,
                so.instructor_id,
                u.full_name as instructor_name,
                inst.image as instructor_image,
                'subject_offering' as source
              FROM subject_offerings so
              LEFT JOIN evaluation_subjects es ON so.subject_id = es.id
              LEFT JOIN users u ON so.instructor_id = u.id
              LEFT JOIN instructors inst ON u.id = inst.user_id
              WHERE so.program_id = ?
            `;
          } else {
            // If no program_id, get all active subject offerings
            subjectOfferingsQuery = `
              SELECT 
                so.id as offering_id,
                so.subject_id,
                es.subject_code,
                es.subject_name,
                es.department,
                es.units,
                so.program_id,
                so.year_level,
                so.section,
                so.academic_year,
                so.semester,
                so.instructor_id,
                u.full_name as instructor_name,
                inst.image as instructor_image,
                'subject_offering' as source
              FROM subject_offerings so
              LEFT JOIN evaluation_subjects es ON so.subject_id = es.id
              LEFT JOIN users u ON so.instructor_id = u.id
              LEFT JOIN instructors inst ON u.id = inst.user_id
            `;
          }
          
          // Execute the query - only use subject_offerings now
          const executeQueries = async () => {
            let subjectOfferingResults = [];
            console.log("Subject offerings query:", subjectOfferingsQuery);
            
            if (subjectOfferingsQuery) {
              const queryParams = studentProgramId ? [studentProgramId] : [];
              console.log("Query params:", queryParams);
              subjectOfferingResults = await new Promise((resolve, reject) => {
                db.query(subjectOfferingsQuery, queryParams, (err, results) => {
                  if (err) reject(err);
                  else {
                    console.log("Subject offering raw results:", JSON.stringify(results));
                    resolve(results);
                  }
                });
              });
            }
            
            const results = subjectOfferingResults || [];
            console.log("Student enrolled subjects:", results.length);
            
            const subjects = results.map(row => ({
              subject_id: row.subject_id,
              subject_code: row.subject_code,
              subject_name: row.subject_name,
              department: row.department,
              units: row.units,
              instructor_id: row.instructor_id || row.instructor_user_id,
              instructor_name: row.instructor_name,
              instructor_image: row.instructor_image,
              year_level: row.year_level || 1,
              section: row.section || '-',
              has_subject_feedback: false,
              has_instructor_feedback: false
            }));
            
            return res.status(200).json({ 
              success: true, 
              subjects,
              academic_year: academicYear,
              semester: semester,
              evaluation_active: activePeriod !== null,
              evaluation_period: activePeriod
            });
          };
          
          executeQueries().catch(err => {
            console.error("Error in getStudentEnrolledSubjects query:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch subjects" });
          });
        });
      });
    });
  } catch (error) {
    console.error("Get student enrolled subjects error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Submit subject feedback
 */
const submitSubjectFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject_id, instructor_id, responses, overall_rating, academic_year, semester } = req.body;

    if (!subject_id || !responses) {
      return res.status(400).json({ success: false, message: "Subject ID and responses are required" });
    }

    // Variables for academic year and semester (scoped to try block)
    let acadYear = academic_year;
    let sem = semester;

    // Validate that subject_id exists in evaluation_subjects table
    const validateSubjectQuery = "SELECT id FROM evaluation_subjects WHERE id = ?";
    db.query(validateSubjectQuery, [subject_id], (validateErr, validateResults) => {
      if (validateErr) {
        console.error("Error validating subject:", validateErr);
        return res.status(500).json({ success: false, message: "Internal server error" });
      }
      
      if (validateResults.length === 0) {
        // Subject doesn't exist - cannot sync from legacy table anymore
        return res.status(400).json({ success: false, message: "Invalid subject ID. Subject does not exist in evaluation system." });
      } else {
        getAcademicYearAndSemester();
      }
    });

    function getAcademicYearAndSemester() {
      // Get academic year and semester from settings if not provided
      if (!acadYear || !sem) {
        const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
        db.query(settingsQuery, (settingsErr, settingsResults) => {
          if (!settingsErr && settingsResults.length > 0) {
            settingsResults.forEach((setting) => {
              if (setting.setting_key === 'current_semester') sem = setting.setting_value;
              if (setting.setting_key === 'current_academic_year') acadYear = setting.setting_value;
            });
          }
          insertFeedback();
        });
      } else {
        insertFeedback();
      }
    }

    function insertFeedback() {
      // Calculate overall_rating from responses if not provided
      let finalOverallRating = overall_rating;
      if (finalOverallRating === undefined || finalOverallRating === null) {
        try {
          const responseValues = Object.values(responses || {});
          if (responseValues.length > 0) {
            const sum = responseValues.reduce((a, b) => a + (Number(b) || 0), 0);
            finalOverallRating = sum / responseValues.length;
          }
        } catch (e) {
          console.error('Error calculating overall rating:', e);
          finalOverallRating = null;
        }
      }
      
      const insertQuery = `
        INSERT INTO subject_feedback (student_id, subject_id, instructor_id, responses, overall_rating, academic_year, semester)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(insertQuery, [userId, subject_id, instructor_id || null, JSON.stringify(responses), finalOverallRating, acadYear, sem], (insertErr, result) => {
        if (insertErr) {
          // Check for duplicate
          if (insertErr.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "You have already submitted feedback for this subject" });
          }
          console.error("Error submitting subject feedback:", insertErr);
          return res.status(500).json({ success: false, message: "Failed to submit feedback" });
        }
        return res.status(201).json({ success: true, message: "Subject feedback submitted successfully" });
      });
    }
  } catch (error) {
    console.error("Submit subject feedback error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Submit instructor feedback
 */
const submitInstructorFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject_id, instructor_id, responses, overall_rating, academic_year, semester } = req.body;

    if (!instructor_id || !responses) {
      return res.status(400).json({ success: false, message: "Instructor ID and responses are required" });
    }

    // Variables for academic year and semester (scoped to try block)
    let acadYear = academic_year;
    let sem = semester;

    // Validate that subject_id exists in evaluation_subjects table (if provided)
    if (subject_id) {
      const validateSubjectQuery = "SELECT id FROM evaluation_subjects WHERE id = ?";
      db.query(validateSubjectQuery, [subject_id], (validateErr, validateResults) => {
        if (validateErr) {
          console.error("Error validating subject:", validateErr);
          return res.status(500).json({ success: false, message: "Internal server error" });
        }
        
        if (validateResults.length === 0) {
          // Subject doesn't exist - cannot sync from legacy table anymore
          return res.status(400).json({ success: false, message: "Invalid subject ID. Subject does not exist in evaluation system." });
        } else {
          proceedWithInsert();
        }
      });
    } else {
      proceedWithInsert();
    }

    function proceedWithInsert() {
      // Get academic year and semester from settings if not provided
      if (!acadYear || !sem) {
        const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
        db.query(settingsQuery, (settingsErr, settingsResults) => {
          if (!settingsErr && settingsResults.length > 0) {
            settingsResults.forEach((setting) => {
              if (setting.setting_key === 'current_semester') sem = setting.setting_value;
              if (setting.setting_key === 'current_academic_year') acadYear = setting.setting_value;
            });
          }
          insertFeedback();
        });
      } else {
        insertFeedback();
      }
    }

    function insertFeedback() {
      // Calculate overall_rating from responses if not provided
      let finalOverallRating = overall_rating;
      if (finalOverallRating === undefined || finalOverallRating === null) {
        try {
          const responseValues = Object.values(responses || {});
          if (responseValues.length > 0) {
            const sum = responseValues.reduce((a, b) => a + (Number(b) || 0), 0);
            finalOverallRating = sum / responseValues.length;
          }
        } catch (e) {
          console.error('Error calculating overall rating:', e);
          finalOverallRating = null;
        }
      }
      
      const insertQuery = `
        INSERT INTO instructor_feedback (student_id, instructor_id, subject_id, responses, overall_rating, academic_year, semester)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(insertQuery, [userId, instructor_id, subject_id || null, JSON.stringify(responses), finalOverallRating, acadYear, sem], (insertErr, result) => {
        if (insertErr) {
          // Check for duplicate
          if (insertErr.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "You have already submitted feedback for this instructor" });
          }
          console.error("Error submitting instructor feedback:", insertErr);
          return res.status(500).json({ success: false, message: "Failed to submit feedback" });
        }
        return res.status(201).json({ success: true, message: "Instructor feedback submitted successfully" });
      });
    }
  } catch (error) {
    console.error("Submit instructor feedback error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Submit feedback (general endpoint that handles both subject and instructor)
 */
const submitFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject_id, instructor_id, feedback_type, ratings, responses, overall_rating, academic_year, semester } = req.body;

    if (!feedback_type) {
      return res.status(400).json({ success: false, message: "Feedback type is required" });
    }

    // Use ratings if responses is not provided (client compatibility)
    const feedbackResponses = responses || ratings;

    if (feedback_type === 'subject') {
      if (!subject_id) {
        return res.status(400).json({ success: false, message: "Subject ID is required for subject feedback" });
      }

      // Validate that subject_id exists in evaluation_subjects table
      const validateSubjectQuery = "SELECT id FROM evaluation_subjects WHERE id = ?";
      db.query(validateSubjectQuery, [subject_id], (validateErr, validateResults) => {
        if (validateErr) {
          console.error("Error validating subject:", validateErr);
          return res.status(500).json({ success: false, message: "Internal server error" });
        }

        if (validateResults.length === 0) {
          // Subject doesn't exist - cannot sync from legacy table anymore
          return res.status(400).json({ success: false, message: "Invalid subject ID. Subject does not exist in evaluation system." });
        } else {
          insertSubjectFeedback();
        }
      });

      function insertSubjectFeedback() {
        let acadYear = academic_year;
        let sem = semester;

        // Get academic year and semester from settings if not provided
        if (!acadYear || !sem) {
          const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
          db.query(settingsQuery, (settingsErr, settingsResults) => {
            if (!settingsErr && settingsResults.length > 0) {
              settingsResults.forEach((setting) => {
                if (setting.setting_key === 'current_semester') sem = setting.setting_value;
                if (setting.setting_key === 'current_academic_year') acadYear = setting.setting_value;
              });
            }
            doInsertSubjectFeedback(acadYear, sem);
          });
        } else {
          doInsertSubjectFeedback(acadYear, sem);
        }
      }

      function doInsertSubjectFeedback(acadYear, sem) {
        // Calculate overall_rating from responses if not provided
        let finalOverallRating = overall_rating;
        if (finalOverallRating === undefined || finalOverallRating === null) {
          try {
            const responseValues = Object.values(feedbackResponses || {});
            if (responseValues.length > 0) {
              const sum = responseValues.reduce((a, b) => a + (Number(b) || 0), 0);
              finalOverallRating = sum / responseValues.length;
            }
          } catch (e) {
            console.error('Error calculating overall rating:', e);
            finalOverallRating = null;
          }
        }
        
        const insertQuery = `
          INSERT INTO subject_feedback (student_id, subject_id, instructor_id, responses, overall_rating, academic_year, semester)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(insertQuery, [userId, subject_id, instructor_id || null, JSON.stringify(feedbackResponses), finalOverallRating, acadYear, sem], (insertErr, result) => {
          if (insertErr) {
            if (insertErr.code === 'ER_DUP_ENTRY') {
              return res.status(400).json({ success: false, message: "You have already submitted feedback for this subject" });
            }
            console.error("Error submitting subject feedback:", insertErr);
            return res.status(500).json({ success: false, message: "Failed to submit feedback" });
          }
          return res.status(201).json({ success: true, message: "Subject feedback submitted successfully" });
        });
      }
    } else if (feedback_type === 'instructor') {
      if (!instructor_id) {
        return res.status(400).json({ success: false, message: "Instructor ID is required for instructor feedback" });
      }

      let acadYear = academic_year;
      let sem = semester;

      // Get academic year and semester from settings if not provided
      if (!acadYear || !sem) {
        const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
        db.query(settingsQuery, (settingsErr, settingsResults) => {
          if (!settingsErr && settingsResults.length > 0) {
            settingsResults.forEach((setting) => {
              if (setting.setting_key === 'current_semester') sem = setting.setting_value;
              if (setting.setting_key === 'current_academic_year') acadYear = setting.setting_value;
            });
          }
          doInsertInstructorFeedback(acadYear, sem);
        });
      } else {
        doInsertInstructorFeedback(acadYear, sem);
      }

      function doInsertInstructorFeedback(acadYear, sem) {
        // Calculate overall_rating from responses if not provided
        let finalOverallRating = overall_rating;
        if (finalOverallRating === undefined || finalOverallRating === null) {
          try {
            const responseValues = Object.values(feedbackResponses || {});
            if (responseValues.length > 0) {
              const sum = responseValues.reduce((a, b) => a + (Number(b) || 0), 0);
              finalOverallRating = sum / responseValues.length;
            }
          } catch (e) {
            console.error('Error calculating overall rating:', e);
            finalOverallRating = null;
          }
        }
        
        const insertQuery = `
          INSERT INTO instructor_feedback (student_id, instructor_id, subject_id, responses, overall_rating, academic_year, semester)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(insertQuery, [userId, instructor_id, subject_id || null, JSON.stringify(feedbackResponses), finalOverallRating, acadYear, sem], (insertErr, result) => {
          if (insertErr) {
            if (insertErr.code === 'ER_DUP_ENTRY') {
              return res.status(400).json({ success: false, message: "You have already submitted feedback for this instructor" });
            }
            console.error("Error submitting instructor feedback:", insertErr);
            return res.status(500).json({ success: false, message: "Failed to submit feedback" });
          }
          return res.status(201).json({ success: true, message: "Instructor feedback submitted successfully" });
        });
      }
    } else {
      return res.status(400).json({ success: false, message: "Invalid feedback type. Must be 'subject' or 'instructor'" });
    }
  } catch (error) {
    console.error("Submit feedback error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * Check if student has submitted feedback for subjects
 */
const getStudentFeedbackStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get academic year and semester
    const settingsQuery = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('current_semester', 'current_academic_year')";
    let semester = '1st Semester';
    let academicYear = '2025-2026';
    
    db.query(settingsQuery, (settingsErr, settingsResults) => {
      if (!settingsErr && settingsResults.length > 0) {
        settingsResults.forEach((setting) => {
          if (setting.setting_key === 'current_semester') semester = setting.setting_value;
          if (setting.setting_key === 'current_academic_year') academicYear = setting.setting_value;
        });
      }
      
      // Get subject feedback status
      const subjectQuery = `
        SELECT subject_id, submitted_at
        FROM subject_feedback
        WHERE student_id = ? AND academic_year = ? AND semester = ?
      `;
      db.query(subjectQuery, [userId, academicYear, semester], (subjectErr, subjectResults) => {
        if (subjectErr) {
          console.error("Error fetching subject feedback:", subjectErr);
        }
        
        const subjectFeedbackMap = {};
        (subjectResults || []).forEach(row => {
          subjectFeedbackMap[row.subject_id] = row.submitted_at;
        });
        
        // Get instructor feedback status
        const instructorQuery = `
          SELECT instructor_id, subject_id, submitted_at
          FROM instructor_feedback
          WHERE student_id = ? AND academic_year = ? AND semester = ?
        `;
        db.query(instructorQuery, [userId, academicYear, semester], (instructorErr, instructorResults) => {
          if (instructorErr) {
            console.error("Error fetching instructor feedback:", instructorErr);
          }
          
          const instructorFeedbackMap = {};
          (instructorResults || []).forEach(row => {
            instructorFeedbackMap[`${row.subject_id}-${row.instructor_id}`] = row.submitted_at;
          });
          
          return res.status(200).json({ 
            success: true, 
            subject_feedback: subjectFeedbackMap,
            instructor_feedback: instructorFeedbackMap
          });
        });
      });
    });
  } catch (error) {
    console.error("Get student feedback status error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ============================================
// ANALYTICS (For Admin)
// ============================================

/**
 * Get feedback analytics
 */
const getFeedbackAnalytics = async (req, res) => {
  try {
    const { subject_id, instructor_id, academic_year, semester } = req.query;
    
    let subjectFilter = '';
    let instructorFilter = '';
    const params = [];
    
    if (subject_id) {
      subjectFilter = 'AND sf.subject_id = ?';
      params.push(subject_id);
    }
    
    if (instructor_id) {
      instructorFilter = 'AND sf.instructor_id = ?';
      params.push(instructor_id);
    }
    
    const query = `
      SELECT 
        sf.subject_id,
        s.subject_name,
        s.subject_code,
        sf.instructor_id,
        u.full_name as instructor_name,
        COUNT(*) as total_responses,
        AVG(sf.overall_rating) as average_rating,
        sf.responses
      FROM subject_feedback sf
      LEFT JOIN evaluation_subjects s ON sf.subject_id = s.id
      LEFT JOIN users u ON sf.instructor_id = u.id
      WHERE 1=1 ${subjectFilter} ${instructorFilter}
      GROUP BY sf.subject_id, sf.instructor_id
    `;
    
    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Error fetching analytics:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
      }
      
      return res.status(200).json({ success: true, analytics: results });
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  // Categories
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  
  // Evaluation Periods
  getEvaluationPeriods,
  getActiveEvaluationPeriod,
  createEvaluationPeriod,
  updateEvaluationPeriod,
  deleteEvaluationPeriod,
  toggleEvaluationPeriod,
  
  // Student Feedback
  getStudentEnrolledSubjects,
  submitSubjectFeedback,
  submitInstructorFeedback,
  submitFeedback,
  getStudentFeedbackStatus,
  
  // Analytics
  getFeedbackAnalytics
};
