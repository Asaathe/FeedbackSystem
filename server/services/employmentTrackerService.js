// Employment Tracker Service - Backend service for Alumni Employment Update Tracker
const db = require('../config/database');
const { queryDatabase } = require('../utils/helpers');
const emailService = require('../utils/emailService');

/**
 * Get all alumni employment records with tracking status
 * @param {object} filters - Optional filters (status, search, etc.)
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<object>} Result with alumni records
 */
const getAlumniEmploymentTracker = async (filters = {}, page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    let whereClause = "WHERE u.role = 'alumni'";
    const params = [];

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      // Handle special 'due' filter - alumni due for update (11+ months since last update)
      if (filters.status === 'due') {
        whereClause += " AND ae.last_update_received IS NOT NULL AND DATEDIFF(NOW(), ae.last_update_received) >= 335";
      } else {
        whereClause += " AND ae.update_status = ?";
        params.push(filters.status);
      }
    }

    if (filters.search) {
      whereClause += " AND (u.full_name LIKE ? OR u.email LIKE ? OR ae.company_name LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM alumni_employment ae
      JOIN users u ON ae.alumni_user_id = u.id
      ${whereClause}
    `;
    const countResult = await queryDatabase(db, countQuery, params);
    const total = countResult[0].total;

    // Get paginated records
    const query = `
      SELECT 
        ae.id,
        ae.alumni_user_id,
        u.full_name AS alumni_name,
        u.email AS alumni_email,
        ae.company_name,
        ae.job_title,
        ae.employment_status,
        ae.update_status,
        ae.last_update_sent,
        ae.last_update_received,
        ae.next_email_date,
        ae.update_email_count,
        ae.response_deadline,
        ae.graduation_date,
        ae.created_at,
        CASE 
          WHEN ae.update_status = 'pending' THEN 'No update request has been sent yet'
          WHEN ae.update_status = 'sent' THEN 'Update request email has been sent'
          WHEN ae.update_status = 'updated' THEN 'Employment information has been updated'
          WHEN ae.update_status = 'scheduled' THEN CONCAT('Next email scheduled for ', CAST(ae.next_email_date AS CHAR))
          ELSE 'Unknown status'
        END AS status_description,
        CASE
          WHEN ae.last_update_received IS NULL THEN DATEDIFF(NOW(), ae.created_at)
          ELSE DATEDIFF(NOW(), ae.last_update_received)
        END AS days_since_last_update
      FROM alumni_employment ae
      JOIN users u ON ae.alumni_user_id = u.id
      ${whereClause}
      ORDER BY ae.updated_at DESC
      LIMIT ? OFFSET ?
    `;

    const records = await queryDatabase(db, query, [...params, limit, offset]);

    // Get status counts for summary
    const statusQuery = `
      SELECT 
        update_status,
        COUNT(*) as count
      FROM alumni_employment ae
      JOIN users u ON ae.alumni_user_id = u.id
      WHERE u.role = 'alumni'
      GROUP BY update_status
    `;
    const statusCounts = await queryDatabase(db, statusQuery, []);

    return {
      success: true,
      records,
      status_counts: statusCounts,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting alumni employment tracker:', error);
    return {
      success: false,
      message: 'Failed to fetch alumni employment tracker data',
      records: [],
      status_counts: []
    };
  }
};

/**
 * Get a single alumni employment record by ID
 * @param {number} id - Employment record ID
 * @returns {Promise<object>} Result with alumni record
 */
const getAlumniEmploymentRecord = async (id) => {
  try {
    const query = `
      SELECT 
        ae.*,
        u.full_name AS alumni_name,
        u.email AS alumni_email,
        u.role,
        CASE 
          WHEN ae.update_status = 'pending' THEN 'No update request has been sent yet'
          WHEN ae.update_status = 'sent' THEN 'Update request email has been sent'
          WHEN ae.update_status = 'updated' THEN 'Employment information has been updated'
          WHEN ae.update_status = 'scheduled' THEN CONCAT('Next email scheduled for ', CAST(ae.next_email_date AS CHAR))
          ELSE 'Unknown status'
        END AS status_description
      FROM alumni_employment ae
      JOIN users u ON ae.alumni_user_id = u.id
      WHERE ae.id = ?
    `;

    const records = await queryDatabase(db, query, [id]);
    
    if (records.length === 0) {
      return {
        success: false,
        message: 'Employment record not found'
      };
    }

    return {
      success: true,
      record: records[0]
    };
  } catch (error) {
    console.error('Error getting alumni employment record:', error);
    return {
      success: false,
      message: 'Failed to fetch employment record'
    };
  }
};

/**
 * Send employment update request email to an alumni
 * @param {number} alumniUserId - Alumni user ID
 * @returns {Promise<object>} Result
 */
const sendUpdateRequestEmail = async (alumniUserId) => {
  try {
    // Get alumni details
    const userQuery = 'SELECT * FROM users WHERE id = ?';
    const users = await queryDatabase(db, userQuery, [alumniUserId]);
    
    if (users.length === 0) {
      return { success: false, message: 'Alumni not found' };
    }

    const alumnus = users[0];

    // Get employment record
    const employmentQuery = 'SELECT * FROM alumni_employment WHERE alumni_user_id = ?';
    const employmentRecords = await queryDatabase(db, employmentQuery, [alumniUserId]);
    
    const employment = employmentRecords.length > 0 ? employmentRecords[0] : null;

    // Send email
    const subject = 'Employment Information Update Request - ACTS Computer College';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Employment Information Update Request</h2>
        <p>Dear ${alumnus.full_name},</p>
        <p>Good day!</p>
        <p>We hope this message finds you well.</p>
        <p>We are reaching out from <strong>ACTS Computer College</strong> to kindly request an update on your employment information. Your continued participation helps us:</p>
        <ul>
          <li>Track the career progression of our alumni</li>
          <li>Maintain accurate employment statistics</li>
          <li>Connect you with relevant career opportunities</li>
          <li>Improve our curriculum based on industry feedback</li>
        </ul>
        ${employment ? `
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Current Employment Record:</h3>
          <p><strong>Company:</strong> ${employment.company_name || 'Not specified'}</p>
          <p><strong>Job Title:</strong> ${employment.job_title || 'Not specified'}</p>
          <p><strong>Status:</strong> ${employment.employment_status || 'Not specified'}</p>
        </div>
        ` : ''}
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/alumni-employment" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Update Employment Information
          </a>
        </div>
        <p>Or copy this link: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/alumni-employment</p>
        <p>Should you have any questions, please contact us at feedbacts@gmail.com.</p>
        <p>Thank you very much for your time and support.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This is an automated message from ACTS Computer College - FeedbACTS System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `;

    const emailResult = await emailService.sendEmail(alumnus.email, subject, html);

    if (emailResult) {
      // Update the employment record
      const now = new Date();
      const nextEmailDate = new Date();
      nextEmailDate.setMonth(nextEmailDate.getMonth() + 11); // 11 months from now

      if (employment) {
        // Update existing record
        const updateQuery = `
          UPDATE alumni_employment 
          SET update_status = 'sent',
              last_update_sent = NOW(),
              next_email_date = ?,
              update_email_count = update_email_count + 1,
              response_deadline = DATE_ADD(NOW(), INTERVAL 30 DAY)
          WHERE alumni_user_id = ?
        `;
        await queryDatabase(db, updateQuery, [nextEmailDate, alumniUserId]);
      } else {
        // Create new record
        const insertQuery = `
          INSERT INTO alumni_employment (alumni_user_id, update_status, last_update_sent, next_email_date, update_email_count, response_deadline)
          VALUES (?, 'sent', NOW(), ?, 1, DATE_ADD(NOW(), INTERVAL 30 DAY))
        `;
        await queryDatabase(db, insertQuery, [alumnus.id, nextEmailDate]);
      }

      return {
        success: true,
        message: 'Update request email sent successfully'
      };
    } else {
      return {
        success: false,
        message: 'Failed to send email'
      };
    }
  } catch (error) {
    console.error('Error sending update request email:', error);
    return {
      success: false,
      message: 'Failed to send update request email'
    };
  }
};

/**
 * Send bulk update request emails to multiple alumni
 * @param {Array} alumniUserIds - Array of alumni user IDs
 * @returns {Promise<object>} Result with success/failure counts
 */
const sendBulkUpdateRequestEmails = async (alumniUserIds) => {
  const results = {
    success: 0,
    failed: 0,
    failed_emails: []
  };

  for (const alumniUserId of alumniUserIds) {
    const result = await sendUpdateRequestEmail(alumniUserId);
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.failed_emails.push(alumniUserId);
    }
  }

  return results;
};

/**
 * Update employment tracking status manually
 * @param {number} id - Employment record ID
 * @param {string} status - New status
 * @returns {Promise<object>} Result
 */
const updateTrackingStatus = async (id, status) => {
  try {
    const validStatuses = ['pending', 'sent', 'updated', 'scheduled'];
    
    if (!validStatuses.includes(status)) {
      return { success: false, message: 'Invalid status' };
    }

    let updateFields = 'update_status = ?';
    const params = [status];

    // If status is 'updated', update last_update_received
    if (status === 'updated') {
      updateFields += ', last_update_received = NOW()';
      
      // Calculate next email date (11 months from now)
      const nextEmailDate = new Date();
      nextEmailDate.setMonth(nextEmailDate.getMonth() + 11);
      updateFields += ', next_email_date = ?';
      params.push(nextEmailDate);
    }

    // If status is 'scheduled', make sure next_email_date is set
    if (status === 'scheduled') {
      const nextEmailDate = new Date();
      nextEmailDate.setMonth(nextEmailDate.getMonth() + 11);
      if (!updateFields.includes('next_email_date')) {
        updateFields += ', next_email_date = ?';
        params.push(nextEmailDate);
      }
    }

    params.push(id);

    const query = `UPDATE alumni_employment SET ${updateFields} WHERE id = ?`;
    const result = await queryDatabase(db, query, params);

    if (result.affectedRows === 0) {
      return { success: false, message: 'Employment record not found' };
    }

    return { success: true, message: 'Status updated successfully' };
  } catch (error) {
    console.error('Error updating tracking status:', error);
    return { success: false, message: 'Failed to update status' };
  }
};

/**
 * Get dashboard statistics for the employment tracker
 * @returns {Promise<object>} Result with statistics
 */
const getTrackerStatistics = async () => {
  try {
    const query = `
      SELECT 
        update_status,
        COUNT(*) as count
      FROM alumni_employment ae
      JOIN users u ON ae.alumni_user_id = u.id
      WHERE u.role = 'alumni'
      GROUP BY update_status
    `;
    const statusCounts = await queryDatabase(db, query, []);

    // Get total alumni count
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM alumni_employment ae
      JOIN users u ON ae.alumni_user_id = u.id
      WHERE u.role = 'alumni'
    `;
    const totalResult = await queryDatabase(db, totalQuery, []);

    // Get alumni due for update (11+ months since last update)
    const dueQuery = `
      SELECT COUNT(*) as due_count
      FROM alumni_employment ae
      JOIN users u ON ae.alumni_user_id = u.id
      WHERE u.role = 'alumni'
      AND ae.last_update_received IS NOT NULL
      AND DATEDIFF(NOW(), ae.last_update_received) >= 335
    `;
    const dueResult = await queryDatabase(db, dueQuery, []);

    // Format status counts
    const stats = {
      total: totalResult[0].total || 0,
      pending: 0,
      sent: 0,
      updated: 0,
      scheduled: 0,
      due_for_update: dueResult[0].due_count || 0
    };

    statusCounts.forEach(item => {
      if (stats.hasOwnProperty(item.update_status)) {
        stats[item.update_status] = item.count;
      }
    });

    return {
      success: true,
      statistics: stats
    };
  } catch (error) {
    console.error('Error getting tracker statistics:', error);
    return {
      success: false,
      message: 'Failed to get statistics',
      statistics: {}
    };
  }
};

module.exports = {
  getAlumniEmploymentTracker,
  getAlumniEmploymentRecord,
  sendUpdateRequestEmail,
  sendBulkUpdateRequestEmails,
  updateTrackingStatus,
  getTrackerStatistics
};
