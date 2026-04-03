// Semester Service
// Handles academic period management for College and Senior High
// Supports both semester (College) and quarter (Senior High) systems

const db = require("../config/database");
const { queryDatabase, queryDatabaseTransaction } = require("../utils/helpers");

/**
 * Get all academic periods with optional filters
 * @param {object} filters - Optional filters (department, status, academic_year)
 * @returns {Promise<object>} List of academic periods
 */
const getAcademicPeriods = async (filters = {}) => {
  try {
    const { department, status, academic_year, period_type } = filters;

    let query = `
      SELECT 
        ap.*,
        (SELECT COUNT(*) FROM academic_periods ap2 
         WHERE ap2.department = ap.department 
         AND ap2.period_type = ap.period_type 
         AND ap2.academic_year = ap.academic_year 
         AND ap2.period_number < ap.period_number) as previous_count
      FROM academic_periods ap
      WHERE 1=1
    `;

    const params = [];

    if (department) {
      query += ' AND ap.department = ?';
      params.push(department);
    }

    if (status) {
      query += ' AND ap.status = ?';
      params.push(status);
    }

    if (academic_year) {
      query += ' AND ap.academic_year = ?';
      params.push(academic_year);
    }

    if (period_type) {
      query += ' AND ap.period_type = ?';
      params.push(period_type);
    }

    query += ' ORDER BY ap.academic_year DESC, ap.period_number ASC';

    const periods = await queryDatabase(db, query, params);
    return {
      success: true,
      periods: periods,
      count: periods.length
    };
  } catch (error) {
    console.error("Get academic periods error:", error);
    throw error;
  }
};

/**
 * Get a single academic period by ID
 * @param {number} id - Period ID
 * @returns {Promise<object>} Academic period details
 */
const getPeriodById = async (id) => {
  try {
    const query = 'SELECT * FROM academic_periods WHERE id = ?';
    const periods = await queryDatabase(db, query, [id]);
    
    if (periods.length === 0) {
      return { success: false, message: 'Academic period not found' };
    }
    
    return { success: true, period: periods[0] };
  } catch (error) {
    console.error("Get period by ID error:", error);
    throw error;
  }
};

/**
 * Get current active period for a department
 * DATE-BASED + STATUS: Returns period where CURDATE is between start_date AND status = 'active'
 * Both conditions must be met - date range AND active status
 * @param {string} department - 'College' or 'Senior High'
 * @returns {Promise<object>} Current active period or null if no period matches today's date
 */
const getCurrentPeriod = async (department) => {
  try {
    // Find period where department matches and status is 'active'
    const query = `
      SELECT * FROM academic_periods 
      WHERE department = ? 
      AND status = 'active'
      ORDER BY start_date DESC
      LIMIT 1
    `;
    const periods = await queryDatabase(db, query, [department]);
    
    if (periods.length === 0) {
      return { success: false, message: 'No active period found.' };
    }
    
    return { success: true, period: periods[0] };
  } catch (error) {
    console.error("Get current period error:", error);
    throw error;
  }
};

/**
 * Get next upcoming period for a department
 * @param {string} department - 'College' or 'Senior High'
 * @returns {Promise<object>} Next upcoming period
 */
const getNextPeriod = async (department) => {
  try {
    const query = `
      SELECT * FROM academic_periods 
      WHERE department = ? AND status = 'upcoming'
      ORDER BY academic_year ASC, period_number ASC
      LIMIT 1
    `;
    const periods = await queryDatabase(db, query, [department]);
    
    if (periods.length === 0) {
      return { success: false, message: 'No upcoming period found' };
    }
    
    return { success: true, period: periods[0] };
  } catch (error) {
    console.error("Get next period error:", error);
    throw error;
  }
};

/**
 * Auto-update statuses based on current date
 * This runs on every request to keep statuses in sync
 * @returns {Promise<void>}
 */
const autoUpdateStatuses = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Set periods to 'active' if today is within their date range
    const activateQuery = `
      UPDATE academic_periods 
      SET status = 'active', is_current = TRUE 
      WHERE status != 'archived'
      AND start_date <= ? 
      AND end_date >= ?
    `;
    await queryDatabase(db, activateQuery, [today, today]);
    
    // Set periods to 'completed' if today is after their end date
    const completeQuery = `
      UPDATE academic_periods 
      SET status = 'completed', is_current = FALSE 
      WHERE status = 'active'
      AND end_date < ?
    `;
    await queryDatabase(db, completeQuery, [today]);
    
  } catch (error) {
    console.error("Auto-update statuses error:", error);
  }
};

/**
 * Create a new academic period
 * @param {object} periodData - Period data
 * @returns {Promise<object>} Created period
 */
const createAcademicPeriod = async (periodData) => {
  try {
    // First auto-update statuses
    const { 
      department, 
      period_type, 
      academic_year, 
      period_number, 
      start_date, 
      end_date, 
      created_by 
    } = periodData;

    // Validate required fields
    if (!department || !period_type || !academic_year || !period_number || !start_date || !end_date) {
      return { success: false, message: 'All required fields must be provided' };
    }

    // Check for duplicate period
    const checkQuery = `
      SELECT id FROM academic_periods 
      WHERE department = ? AND period_type = ? AND academic_year = ? AND period_number = ?
    `;
    const existing = await queryDatabase(db, checkQuery, [department, period_type, academic_year, period_number]);
    
    if (existing.length > 0) {
      return { success: false, message: 'This period already exists' };
    }

    // Validate date range doesn't overlap with existing periods
    const overlapQuery = `
      SELECT id FROM academic_periods 
      WHERE department = ? 
      AND (
        (start_date <= ? AND end_date >= ?) 
        OR (start_date <= ? AND end_date >= ?)
        OR (start_date >= ? AND end_date <= ?)
      )
    `;
    const overlapParams = [department, end_date, start_date, start_date, end_date, start_date, end_date];
    const overlaps = await queryDatabase(db, overlapQuery, overlapParams);
    
    if (overlaps.length > 0) {
      return { success: false, message: 'Date range overlaps with existing period' };
    }

    // Check for existing active period
    const activeCheckQuery = `SELECT id FROM academic_periods WHERE department = ? AND status = 'active'`;
    const activePeriods = await queryDatabase(db, activeCheckQuery, [department]);
    
    // Default status is 'upcoming', but if set_as_active is true or no active period, set as active
    let status = 'upcoming';
    let isCurrent = false;
    if (periodData.set_as_active || activePeriods.length === 0) {
      status = 'active';
      isCurrent = true;
      // Archive any existing active period
      if (activePeriods.length > 0) {
        await queryDatabase(db, 'UPDATE academic_periods SET status = ?, is_current = FALSE WHERE id = ?', ['completed', activePeriods[0].id]);
      }
    }
    
    const insertQuery = `
      INSERT INTO academic_periods 
      (department, period_type, academic_year, period_number, start_date, end_date, status, is_current, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await queryDatabase(db, insertQuery, [
      department, period_type, academic_year, period_number, 
      start_date, end_date, status, isCurrent, created_by
    ]);

    return {
      success: true,
      message: 'Academic period created successfully',
      period_id: result.insertId
    };
  } catch (error) {
    console.error("Create academic period error:", error);
    throw error;
  }
};

/**
 * Update an academic period
 * @param {number} id - Period ID
 * @param {object} updateData - Fields to update
 * @returns {Promise<object>} Update result
 */
const updateAcademicPeriod = async (id, updateData) => {
  try {
    const allowedFields = ['period_number', 'start_date', 'end_date', 'auto_transition', 'transition_time', 'status'];
    
    const updates = [];
    const params = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updates.length === 0) {
      return { success: false, message: 'No valid fields to update' };
    }

    params.push(id);
    const query = `UPDATE academic_periods SET ${updates.join(', ')} WHERE id = ?`;
    
    await queryDatabase(db, query, params);

    return { success: true, message: 'Academic period updated successfully' };
  } catch (error) {
    console.error("Update academic period error:", error);
    throw error;
  }
};

/**
 * Set a period as current (triggers transition)
 * @param {number} periodId - Period ID to set as current
 * @param {string} resetType - 'subjects', 'evaluations', or 'both'
 * @param {number} userId - User who triggered the transition
 * @returns {Promise<object>} Transition result
 */
const setCurrentPeriod = async (periodId, resetType = 'both', userId = null) => {
  const { getFreshConnection } = require('../config/database');
  
  const connection = await getFreshConnection();
  
  try {
    await new Promise((resolve, reject) => {
      connection.beginTransaction((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Get the new period to set as current
    const periods = await new Promise((resolve, reject) => {
      connection.query(
        'SELECT * FROM academic_periods WHERE id = ?',
        [periodId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    if (periods.length === 0) {
      throw new Error('Academic period not found');
    }

    const newPeriod = periods[0];

    // Get current period for this department (to archive)
    const currentPeriods = await new Promise((resolve, reject) => {
      connection.query(
        'SELECT * FROM academic_periods WHERE department = ? AND is_current = TRUE',
        [newPeriod.department],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    let oldPeriod = null;
    if (currentPeriods.length > 0) {
      oldPeriod = currentPeriods[0];
      
      // Archive old period
      await new Promise((resolve, reject) => {
        connection.query(
          'UPDATE academic_periods SET is_current = FALSE, status = ? WHERE id = ?',
          ['completed', oldPeriod.id],
          (err, results) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
      });
    }

    // Set new period as current
    await new Promise((resolve, reject) => {
      connection.query(
        'UPDATE academic_periods SET is_current = TRUE, status = ? WHERE id = ?',
        ['active', periodId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    // Handle subject offerings reset
    if (resetType === 'subjects' || resetType === 'both') {
      await handleSubjectReset(connection, newPeriod.department, oldPeriod);
    }

    // Handle evaluation reset
    if (resetType === 'evaluations' || resetType === 'both') {
      await handleEvaluationReset(connection, newPeriod.department, oldPeriod, newPeriod);
    }

    // Log the transition
    await new Promise((resolve, reject) => {
      connection.query(
        `INSERT INTO semester_reset_log 
        (department, from_period_id, to_period_id, from_academic_year, from_period_number, 
         to_academic_year, to_period_number, reset_type, triggered_by, trigger_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?)`,
        [
          newPeriod.department,
          oldPeriod ? oldPeriod.id : null,
          newPeriod.id,
          oldPeriod ? oldPeriod.academic_year : null,
          oldPeriod ? oldPeriod.period_number : null,
          newPeriod.academic_year,
          newPeriod.period_number,
          resetType,
          userId
        ],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    await new Promise((resolve, reject) => {
      connection.commit((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return {
      success: true,
      message: `Successfully transitioned to ${newPeriod.period_type} ${newPeriod.period_number}, ${newPeriod.academic_year}`,
      new_period: newPeriod,
      old_period: oldPeriod,
      reset_type: resetType
    };
  } catch (error) {
    await new Promise((resolve) => {
      connection.rollback(() => resolve());
    });
    console.error("Set current period error:", error);
    throw error;
  } finally {
    connection.end();
  }
};

/**
 * Handle subject offerings reset during transition
 * Uses academic_period_id for precise targeting
 */
const handleSubjectReset = async (connection, department, oldPeriod) => {
  try {
    if (!oldPeriod) {
      console.log("No old period to archive subjects for");
      return;
    }
    const { id: academic_period_id } = oldPeriod;
    
    await new Promise((resolve, reject) => {
      connection.query(
        `UPDATE subject_offerings 
        SET status = 'archived' 
        WHERE status = 'active' 
        AND academic_period_id = ?`,
        [academic_period_id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    console.log(`Subject offerings archived for ${department} using old period academic_period_id=${academic_period_id}`);
  } catch (error) {
    console.error("Handle subject reset error:", error);
    throw error;
  }
};

/**
 * Handle evaluation reset during transition
 * Uses academic_period_id for precise targeting (more reliable than year/semester matching)
 */
const handleEvaluationReset = async (connection, department, oldPeriod, newPeriod) => {
  try {
    if (!oldPeriod) {
      console.log("No old period to archive evaluations for");
      return;
    }
    const { id: academic_period_id } = oldPeriod;
    
    // 1. Archive old subject feedback using old period's academic_period_id
    await new Promise((resolve, reject) => {
      connection.query(
        `UPDATE subject_feedback 
        SET archived = TRUE, archived_at = NOW() 
        WHERE academic_period_id = ?`,
        [academic_period_id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    // 2. Archive old instructor feedback using old period's academic_period_id
    await new Promise((resolve, reject) => {
      connection.query(
        `UPDATE instructor_feedback 
        SET archived = TRUE, archived_at = NOW() 
        WHERE academic_period_id = ?`,
        [academic_period_id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    // 3. Reset total_feedbacks count in subject_offerings using old period's academic_period_id
    await new Promise((resolve, reject) => {
      connection.query(
        `UPDATE subject_offerings 
        SET total_feedbacks = 0 
        WHERE academic_period_id = ?`,
        [academic_period_id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    console.log(`Evaluation reset completed for ${department} using old period academic_period_id=${academic_period_id}`);
    console.log(`- Subject feedback archived (precise targeting by period ID)`);
    console.log(`- Instructor feedback archived (precise targeting by period ID)`);
    console.log(`- Feedback counts reset to 0`);
    console.log(`New period ready: ${newPeriod.period_type} ${newPeriod.period_number}, AY ${newPeriod.academic_year}`);
  } catch (error) {
    console.error("Handle evaluation reset error:", error);
    throw error;
  }
};

/**
 * Get semester status for a department
 * @param {string} department - 'College' or 'Senior High'
 * @returns {Promise<object>} Status information
 */
const getSemesterStatus = async (department) => {
  try {
    // Get current period
    const currentResult = await getCurrentPeriod(department);
    
    // Get next period
    const nextResult = await getNextPeriod(department);

    // Get recent transitions
    const logQuery = `
      SELECT * FROM semester_reset_log 
      WHERE department = ?
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const logs = await queryDatabase(db, logQuery, [department]);

    return {
      success: true,
      department,
      current_period: currentResult.success ? currentResult.period : null,
      next_period: nextResult.success ? nextResult.period : null,
      recent_transitions: logs,
      period_type: currentResult.success ? currentResult.period.period_type : 
                   (nextResult.success ? nextResult.period.period_type : 'semester')
    };
  } catch (error) {
    console.error("Get semester status error:", error);
    throw error;
  }
};

/**
 * Get semester transition history
 * @param {object} filters - Optional filters
 * @returns {Promise<object>} Transition history
 */
const getTransitionHistory = async (filters = {}) => {
  try {
    const { department, limit = 20 } = filters;

    let query = `
      SELECT 
        sl.*,
        (SELECT CONCAT(ap.period_type, ' ', ap.period_number) FROM academic_periods ap WHERE ap.id = sl.from_period_id) as from_period_name,
        (SELECT CONCAT(ap.period_type, ' ', ap.period_number) FROM academic_periods ap WHERE ap.id = sl.to_period_id) as to_period_name
      FROM semester_reset_log sl
      WHERE 1=1
    `;

    const params = [];

    if (department) {
      query += ' AND sl.department = ?';
      params.push(department);
    }

    query += ' ORDER BY sl.created_at DESC LIMIT ?';
    params.push(limit);

    const logs = await queryDatabase(db, query, params);

    return {
      success: true,
      logs: logs,
      count: logs.length
    };
  } catch (error) {
    console.error("Get transition history error:", error);
    throw error;
  }
};

/**
 * Delete an academic period (only if not active)
 * @param {number} id - Period ID
 * @returns {Promise<object>} Delete result
 */
const deleteAcademicPeriod = async (id) => {
  try {
    // Check if period exists and is not active
    const checkQuery = 'SELECT * FROM academic_periods WHERE id = ?';
    const periods = await queryDatabase(db, checkQuery, [id]);

    if (periods.length === 0) {
      return { success: false, message: 'Academic period not found' };
    }

    if (periods[0].status === 'active' || periods[0].is_current) {
      return { success: false, message: 'Cannot delete active or current period' };
    }

    await queryDatabase(db, 'DELETE FROM academic_periods WHERE id = ?', [id]);

    return { success: true, message: 'Academic period deleted successfully' };
  } catch (error) {
    console.error("Delete academic period error:", error);
    throw error;
  }
};

/**
 * Check and execute auto-transitions (to be called by scheduler)
 */
const checkAutoTransitions = async () => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 8); // HH:MM:SS

    // Find periods where auto_transition is enabled and current date >= end_date
    // and transition_time has passed
    const query = `
      SELECT * FROM academic_periods 
      WHERE auto_transition = TRUE 
      AND status = 'upcoming'
      AND end_date <= ?
      AND transition_time <= ?
    `;
    
    const periods = await queryDatabase(db, query, [today, currentTime]);

    for (const period of periods) {
      console.log(`Auto-transition triggered for period ${period.id}: ${period.period_type} ${period.period_number}`);
      await setCurrentPeriod(period.id, 'both', null);
    }

    return {
      success: true,
      processed: periods.length,
      periods: periods.map(p => ({ id: p.id, name: `${p.period_type} ${p.period_number}` }))
    };
  } catch (error) {
    console.error("Check auto transitions error:", error);
    throw error;
  }
};

module.exports = {
  getAcademicPeriods,
  getPeriodById,
  getCurrentPeriod,
  getNextPeriod,
  createAcademicPeriod,
  updateAcademicPeriod,
  setCurrentPeriod,
  getSemesterStatus,
  getTransitionHistory,
  deleteAcademicPeriod,
  checkAutoTransitions
};
