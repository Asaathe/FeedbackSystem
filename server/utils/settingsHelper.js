const db = require("../config/database");

/**
 * Auto-update statuses based on current date
 * This ensures periods are marked 'active' when their date range includes today
 * @returns {Promise<void>}
 */
function autoUpdateStatuses() {
  return new Promise((resolve) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Set periods to 'active' if today is within their date range
    const activateQuery = `
      UPDATE academic_periods 
      SET status = 'active' 
      WHERE status != 'archived'
      AND start_date <= ? 
      AND end_date >= ?
    `;
    db.query(activateQuery, [today, today], (err) => {
      if (err) console.error("Auto-activate error:", err);
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
        // Use DATE() for proper date comparison
        query = `
          SELECT * FROM academic_periods 
          WHERE department = ? 
          AND status = 'active'
          AND DATE(CURDATE()) BETWEEN DATE(start_date) AND DATE(end_date)
          ORDER BY start_date DESC 
          LIMIT 1
        `;
        params = [department];
      } else {
        // Get any active period - date-based + status check
        query = `
          SELECT * FROM academic_periods 
          WHERE status = 'active'
          AND DATE(CURDATE()) BETWEEN DATE(start_date) AND DATE(end_date)
          ORDER BY start_date DESC 
          LIMIT 1
        `;
      }

      db.query(query, params, (err, results) => {
        const today = new Date().toISOString().split('T')[0];
        console.log("📋 Debug - department:", department, "| today:", today);
        if (err) {
          console.error("Error getting active academic period:", err);
          resolve(null);
          return;
        }
        
        // Debug: Check what periods exist in DB for this department
        if (department) {
          const debugQuery = `SELECT id, department, period_type, academic_year, period_number, start_date, end_date, status FROM academic_periods WHERE department = ?`;
          db.query(debugQuery, [department], (debugErr, debugResults) => {
            if (!debugErr && debugResults.length > 0) {
              console.log("📋 All periods in DB for", department, ":", debugResults.map(p => ({
                id: p.id, dept: p.department, status: p.status, 
                start: p.start_date, end: p.end_date, 
                today: today,
                // Compare as date strings (YYYY-MM-DD)
                inRange: String(p.start_date).substring(0, 10) <= today && today <= String(p.end_date).substring(0, 10)
              })));
            }
          });
        }
        
        // Debug logging
        if (results.length > 0) {
          console.log("✅ Found active academic period (date-based):", {
            id: results[0].id,
            department: results[0].department,
            period_type: results[0].period_type,
            academic_year: results[0].academic_year,
            period_number: results[0].period_number,
            start_date: results[0].start_date,
            end_date: results[0].end_date,
            status: results[0].status,
            today: today
          });
        } else {
          console.log("⚠️ No active academic period found for today" + (department ? ` (${department})` : ''));
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
  // Get active periods for both departments - purely date-based detection
  const collegePeriod = await getActiveAcademicPeriod('College');
  const seniorHighPeriod = await getActiveAcademicPeriod('Senior High');
  
  // Convert period_number to semester name
  const getSemesterName = (period) => {
    if (!period) return null;
    const num = period.period_number;
    const suffix = num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th';
    if (period.period_type === 'quarter') {
      return `${num}${suffix} Quarter`;
    }
    return `${num}${suffix}`;
  };
  
  const collegeSemester = collegePeriod ? getSemesterName(collegePeriod) : null;
  const seniorHighSemester = seniorHighPeriod ? getSemesterName(seniorHighPeriod) : null;
  
  if (!department) {
    // Return all departments - each independently detected by date
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
 * Get current semester for a department (synchronous helper for use in queries)
 * @param {string} department - 'College' or 'Senior High'
 * @returns {Object} - { semester, academic_year }
 */
function getCurrentSettingsSync(department = null) {
  // This is a simplified synchronous version that returns defaults
  // For actual values, use getCurrentSettings() async function
  return {
    semester: "1st",
    academic_year: "2025-2026"
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
  getCurrentSettingsSync,
  getNextAcademicYear,
  getYearLevelRange,
  getDepartmentFromYearLevel,
  getAcademicPeriodIdFromYearSemester
};
