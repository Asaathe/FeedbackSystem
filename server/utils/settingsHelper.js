const db = require("../config/database");

/**
 * Auto-update statuses based on current date
 * This ensures periods are marked 'active' when their date range includes today
 * @returns {Promise<void>}
 */
let lastAutoUpdateTimestamp = 0;
const AUTO_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

function autoUpdateStatuses() {
  return new Promise((resolve) => {
    const now = Date.now();
    if (now - lastAutoUpdateTimestamp < AUTO_UPDATE_INTERVAL_MS) {
      resolve();
      return;
    }
    lastAutoUpdateTimestamp = now;

    // Use CURDATE() for consistency with database timezone

    // Only auto-complete expired periods, don't auto-activate
    const completeQuery = `
      UPDATE academic_periods
      SET status = 'completed', is_current = FALSE
      WHERE status = 'active' AND DATE(end_date) < CURDATE()
    `;
    db.query(completeQuery, [], (err, result) => {
      if (err) {
        console.error("Auto-complete error:", err);
      }
      resolve();
    });
  });
}

/**
 * Get academic period ID from academic_year and semester/period
 * @param {string} department - 'College' or 'Senior High'
 * @param {string} academicYear - e.g., '2025-2026'
 * @param {string} semester - e.g., '1st', '2nd', '1st Quarter', '1', '2'
 * @returns {Promise<number|null>} - academic_period_id or null if not found
 */
async function getAcademicPeriodIdFromYearSemester(department, academicYear, semester) {
  if (!department || !academicYear || !semester) {
    return null;
  }
  
  // Map semester to period_number
  let periodNumber = 1;
  const semLower = String(semester).toLowerCase();
  
  // Handle semester values
  if (semLower.includes('1st') || semLower === '1') periodNumber = 1;
  else if (semLower.includes('2nd') || semLower === '2') periodNumber = 2;
  else if (semLower.includes('3rd') || semLower === '3' || semLower.includes('summer')) periodNumber = 3;
  else if (semLower.includes('4th') || semLower === '4') periodNumber = 4;
  
  // Map department to period_type
  const periodType = department === 'College' ? 'semester' : 'quarter';
  
  return new Promise((resolve) => {
    const query = `
      SELECT id FROM academic_periods 
      WHERE department = ? 
      AND academic_year = ? 
      AND period_type = ?
      AND period_number = ?
      LIMIT 1
    `;
    db.query(query, [department, academicYear, periodType, periodNumber], (err, results) => {
      if (err || results.length === 0) {
        resolve(null);
      } else {
        resolve(results[0].id);
      }
    });
  });
}

/**
 * Get active academic period from academic_periods table
 * AUTO-DETECTION: Finds period where CURRENT_DATE is between start_date and end_date
 * @param {string} department - 'College' or 'Senior High'
 * @returns {Promise<Object|null>} - { id, period_type, period_name, academic_year, start_date, end_date, is_current } or null
 */
function getActiveAcademicPeriod(department = null) {
  return new Promise(async (resolve, reject) => {
    // First auto-update statuses to ensure date-based activation
    await autoUpdateStatuses();
    
    // Then check if table exists and has data
    const checkQuery = `SELECT COUNT(*) as count FROM academic_periods`;
    db.query(checkQuery, (checkErr, checkResults) => {
      if (checkErr || checkResults[0].count === 0) {
        console.log("⚠️ academic_periods table is empty or doesn't exist");
        resolve(null);
        return;
      }
      
      let query;
      let params = [];

      if (department) {
        // Use department column directly (not period_type mapping)
        query = `
          SELECT * FROM academic_periods
          WHERE department = ?
          AND status = 'active'
          AND CURDATE() BETWEEN DATE(start_date) AND DATE(end_date)
          ORDER BY start_date DESC
          LIMIT 1
        `;
        params = [department];
      } else {
        // Get any active period - date-based + status check
        query = `
          SELECT * FROM academic_periods
          WHERE status = 'active'
          AND CURDATE() BETWEEN DATE(start_date) AND DATE(end_date)
          ORDER BY start_date DESC
          LIMIT 1
        `;
      }

      db.query(query, params, (err, results) => {
        if (err) {
          console.error("Error getting active academic period:", err);
          resolve(null);
          return;
        }
        
        if (results.length > 0) {
          console.log(`✅ Active period: ${results[0].department} ${results[0].period_type} ${results[0].period_number}, AY ${results[0].academic_year}`);
        } else {
          console.log(`⚠️ No active period for ${department || 'any department'}`);
        }
        resolve(results.length > 0 ? results[0] : null);
      });
    });
  });
}

/**
 * Get current semester and academic year for a specific department
 * Uses date-based detection from academic_periods table (no fallback)
 * @param {string} department - 'College' or 'Senior High' (optional, defaults to all)
 * @returns {Promise<Object>} - { semester, academic_year, period_id, source }
 */
async function getCurrentSettings(department = null) {
  // Get current periods for both departments - prioritize manually set, fallback to date-based
  const { getCurrentPeriod } = require('../services/semesterService');
  const collegePeriodResult = await getCurrentPeriod('College');
  const seniorHighPeriodResult = await getCurrentPeriod('Senior High');

  const collegePeriod = collegePeriodResult.success ? collegePeriodResult.period : null;
  const seniorHighPeriod = seniorHighPeriodResult.success ? seniorHighPeriodResult.period : null;
  
  // Convert period_number to semester name
  const getSemesterName = (period) => {
    if (!period) return null;
    const num = period.period_number;

    if (period.period_type === 'quarter') {
      const suffix = num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th';
      return `${num}${suffix} Quarter`;
    } else if (period.period_type === 'semester') {
      // Special handling for semesters: 3 = Summer
      if (num === 3) return 'Summer';
      const suffix = num === 1 ? 'st' : num === 2 ? 'nd' : 'th';
      return `${num}${suffix}`;
    }

    return `${num}`;
  };
  
  const collegeSemester = collegePeriod ? getSemesterName(collegePeriod) : null;
  const seniorHighSemester = seniorHighPeriod ? getSemesterName(seniorHighPeriod) : null;
  
  if (!department) {
    // Return all departments - prioritize manually set current periods
    // Only return non-null if period found for that department
    const college = collegePeriod ? 
      { semester: collegeSemester, academic_year: collegePeriod.academic_year, period_id: collegePeriod.id } : 
      null;
    const seniorHigh = seniorHighPeriod ? 
      { semester: seniorHighSemester, academic_year: seniorHighPeriod.academic_year, period_id: seniorHighPeriod.id } : 
      null;
    
    // If at least one department has an active period, return with academic_periods source
    if (college || seniorHigh) {
      return {
        college,
        seniorHigh,
        source: 'academic_periods'
      };
    }
    
    // No periods found
    return {
      college: null,
      seniorHigh: null,
      source: 'none'
    };
  }
  
  // Return specific department
  const period = department === 'College' ? collegePeriod : seniorHighPeriod;
  if (period) {
    return {
      semester: department === 'College' ? collegeSemester : seniorHighSemester,
      academic_year: period.academic_year,
      period_id: period.id,
      period_type: period.period_type,
      source: 'academic_periods'
    };
  }
  
  // No academic period found - return null (no fallback to system_settings)
  console.log("⚠️ No academic period found for:", department);
  
  return {
    semester: null,
    academic_year: null,
    department,
    period_id: null,
    period_type: null,
    source: 'none'
  };
}

/**
 * Calculate the next academic year based on current
 * @param {string} currentYear - Format: '2025-2026'
 * @returns {string} - Next year: '2026-2027'
 */
function getNextAcademicYear(currentYear) {
  if (!currentYear || !currentYear.includes('-')) {
    const current = new Date().getFullYear();
    return `${current}-${current + 1}`;
  }
  
  const [start, end] = currentYear.split('-');
  return `${parseInt(start) + 1}-${parseInt(end) + 1}`;
}

/**
 * Get year level range for a department
 * @param {string} department - 'College' or 'Senior High'
 * @returns {Object} - { minYear, maxYear, label }
 */
function getYearLevelRange(department) {
  if (department === 'Senior High') {
    return { minYear: 11, maxYear: 12, label: 'Grade Level' };
  }
  return { minYear: 1, maxYear: 4, label: 'Year Level' };
}

/**
 * Determine department from year level
 * @param {number} yearLevel 
 * @returns {string} - 'College' or 'Senior High'
 */
function getDepartmentFromYearLevel(yearLevel) {
  if (yearLevel >= 11 && yearLevel <= 12) {
    return 'Senior High';
  }
  return 'College';
}

module.exports = {
  getCurrentSettings,
  getNextAcademicYear,
  getYearLevelRange,
  getDepartmentFromYearLevel,
  getAcademicPeriodIdFromYearSemester
};
