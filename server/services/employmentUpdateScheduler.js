// Employment Update Scheduler - Automated 11-month follow-up system
// This scheduler runs daily to check and send employment update request emails

const db = require('../config/database');
const { queryDatabase } = require('../utils/helpers');
const emailService = require('../utils/emailService');

/**
 * Check and send employment update emails for alumni due for follow-up
 * This should be run daily via cron job
 */
const checkAndScheduleEmploymentUpdates = async () => {
  console.log('[Employment Update Scheduler] Running daily check...');
  
  try {
    // Find alumni who have status='scheduled' and next_email_date has passed
    const query = `
      SELECT 
        ae.id,
        ae.alumni_user_id,
        u.email,
        u.full_name,
        ae.company_name,
        ae.job_title,
        ae.last_update_received,
        ae.last_update_sent,
        ae.update_status,
        ae.next_email_date,
        DATEDIFF(NOW(), ae.last_update_received) as days_since_update
      FROM alumni_employment ae
      JOIN users u ON ae.alumni_user_id = u.id
      WHERE u.role = 'alumni'
      AND ae.update_status = 'scheduled'
      AND ae.next_email_date <= NOW()
    `;
    
    const alumniToProcess = await queryDatabase(db, query, []);
    
    if (alumniToProcess.length === 0) {
      console.log('[Employment Update Scheduler] No alumni due for update');
      return { processed: 0, sent: 0, failed: 0 };
    }

    console.log(`[Employment Update Scheduler] Found ${alumniToProcess.length} alumni due for update`);

    let sentCount = 0;
    let failedCount = 0;

    for (const alumnus of alumniToProcess) {
      try {
        // Send the update request email
        const subject = 'Employment Information Update Request - ACTS Computer College';
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Employment Information Update Request</h2>
            <p>Dear ${alumnus.full_name},</p>
            <p>Good day!</p>
            <p>We hope this message finds you well.</p>
            <p>We are reaching out from <strong>ACTS Computer College</strong> to kindly request an update on your employment information. It's been over 11 months since your last update, and we'd love to hear about your career progress.</p>
            <p>Your continued participation helps us:</p>
            <ul>
              <li>Track the career progression of our alumni</li>
              <li>Maintain accurate employment statistics</li>
              <li>Connect you with relevant career opportunities</li>
              <li>Improve our curriculum based on industry feedback</li>
            </ul>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your Current Employment Record:</h3>
              <p><strong>Company:</strong> ${alumnus.company_name || 'Not specified'}</p>
              <p><strong>Job Title:</strong> ${alumnus.job_title || 'Not specified'}</p>
              <p><strong>Last Updated:</strong> ${new Date(alumnus.last_update_received).toLocaleDateString()}</p>
            </div>
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
          const nextEmailDate = new Date();
          nextEmailDate.setMonth(nextEmailDate.getMonth() + 11);

          const updateQuery = `
            UPDATE alumni_employment 
            SET update_status = 'scheduled',
                last_update_sent = NOW(),
                next_email_date = ?,
                update_email_count = update_email_count + 1,
                response_deadline = DATE_ADD(NOW(), INTERVAL 30 DAY)
            WHERE id = ?
          `;
          
          await queryDatabase(db, updateQuery, [nextEmailDate, alumnus.id]);
          
          // Also add to the queue table
          const queueQuery = `
            INSERT INTO employment_update_queue (alumni_user_id, scheduled_date, status, email_sent_at)
            VALUES (?, ?, 'sent', NOW())
          `;
          await queryDatabase(db, queueQuery, [alumnus.alumni_user_id, nextEmailDate]);

          console.log(`[Employment Update Scheduler] Email sent to ${alumnus.email}`);
          sentCount++;
        } else {
          console.error(`[Employment Update Scheduler] Failed to send email to ${alumnus.email}`);
          failedCount++;
        }

        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`[Employment Update Scheduler] Error processing ${alumnus.email}:`, error);
        failedCount++;
      }
    }

    console.log(`[Employment Update Scheduler] Completed: ${sentCount} sent, ${failedCount} failed`);
    
    return { 
      processed: alumniToUpdate.length, 
      sent: sentCount, 
      failed: failedCount 
    };

  } catch (error) {
    console.error('[Employment Update Scheduler] Critical error:', error);
    return { processed: 0, sent: 0, failed: 0, error: error.message };
  }
};

/**
 * Get upcoming scheduled updates
 */
const getUpcomingScheduledUpdates = async (days = 30) => {
  try {
    const query = `
      SELECT 
        ae.id,
        ae.alumni_user_id,
        u.full_name,
        u.email,
        ae.next_email_date,
        ae.company_name,
        ae.job_title
      FROM alumni_employment ae
      JOIN users u ON ae.alumni_user_id = u.id
      WHERE u.role = 'alumni'
      AND ae.next_email_date IS NOT NULL
      AND ae.next_email_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
      AND ae.update_status = 'scheduled'
      ORDER BY ae.next_email_date ASC
    `;
    
    const results = await queryDatabase(db, query, [days]);
    return results;
  } catch (error) {
    console.error('[Employment Update Scheduler] Error getting upcoming updates:', error);
    return [];
  }
};

/**
 * Manual trigger for sending update emails (admin function)
 */
const triggerManualUpdate = async (alumniUserId) => {
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
        <p>We are reaching out from <strong>ACTS Computer College</strong> to kindly request an update on your employment information.</p>
        ${employment ? `
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Current Employment Record:</h3>
          <p><strong>Company:</strong> ${employment.company_name || 'Not specified'}</p>
          <p><strong>Job Title:</strong> ${employment.job_title || 'Not specified'}</p>
        </div>
        ` : ''}
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/alumni-employment" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Update Employment Information
          </a>
        </div>
        <p>Should you have any questions, please contact us at feedbacts@gmail.com.</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This is an automated message from ACTS Computer College - FeedbACTS System.
        </p>
      </div>
    `;

    const emailResult = await emailService.sendEmail(alumnus.email, subject, html);

    if (emailResult) {
      const nextEmailDate = new Date();
      nextEmailDate.setMonth(nextEmailDate.getMonth() + 11);

      if (employment) {
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
        const insertQuery = `
          INSERT INTO alumni_employment (alumni_user_id, update_status, last_update_sent, next_email_date, update_email_count, response_deadline)
          VALUES (?, 'sent', NOW(), ?, 1, DATE_ADD(NOW(), INTERVAL 30 DAY))
        `;
        await queryDatabase(db, insertQuery, [alumniUserId, nextEmailDate]);
      }

      return { success: true, message: 'Update request sent successfully' };
    } else {
      return { success: false, message: 'Failed to send email' };
    }
  } catch (error) {
    console.error('[Employment Update Scheduler] Manual trigger error:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  checkAndScheduleEmploymentUpdates,
  getUpcomingScheduledUpdates,
  triggerManualUpdate
};
