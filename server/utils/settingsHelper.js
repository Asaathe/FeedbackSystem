const db = require("../config/database");

/**
 * Get current semester and academic year for a specific department
 * @param {string} department - 'College' or 'Senior High' (optional, defaults to all)
 * @returns {Promise<Object>} - { semester, academic_year }
 */
function getCurrentSettings(department = null) {
  return new Promise((resolve, reject) => {
    let query;
    let params = [];

    if (department) {
      // Get department-specific settings first, fall back to general settings
      query = `
        SELECT setting_key, setting_value, department 
        FROM system_settings 
        WHERE setting_key IN ('current_semester', 'current_academic_year')
        AND (department = ? OR department IS NULL)
        ORDER BY department DESC
      `;
      params = [department];
    } else {
      // Get all settings
      query = `
        SELECT setting_key, setting_value, department 
        FROM system_settings 
        WHERE setting_key IN ('current_semester', 'current_academic_year')
        ORDER BY department, setting_key
      `;
    }

    db.query(query, params, (err, results) => {
      if (err) {
        console.error("Error getting current settings:", err);
        reject(err);
        return;
      }

      if (!department) {
        // Return all settings organized by department
        const settings = {
          college: { semester: "1st", academic_year: "2025-2026" },
          seniorHigh: { semester: "1st", academic_year: "2025-2026" }
        };

        results.forEach(row => {
          if (row.department === 'College') {
            if (row.setting_key === 'current_semester') settings.college.semester = row.setting_value;
            if (row.setting_key === 'current_academic_year') settings.college.academic_year = row.setting_value;
          } else if (row.department === 'Senior High') {
            if (row.setting_key === 'current_semester') settings.seniorHigh.semester = row.setting_value;
            if (row.setting_key === 'current_academic_year') settings.seniorHigh.academic_year = row.setting_value;
          }
        });

        resolve(settings);
      } else {
        // Return settings for specific department
        const deptSettings = results.find(r => r.department === department);
        const generalSettings = results.find(r => r.department === null);

        const semester = deptSettings?.setting_key === 'current_semester'
          ? deptSettings.setting_value
          : generalSettings?.setting_value || '1st';

        const academicYear = results.find(r => r.setting_key === 'current_academic_year')?.setting_value || '2025-2026';

        resolve({
          semester,
          academic_year: academicYear,
          department
        });
      }
    });
  });
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
  getDepartmentFromYearLevel
};
