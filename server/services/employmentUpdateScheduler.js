// Employment Update Scheduler - Automated 11-month follow-up system
// This scheduler runs daily to check and send employment update request emails

const db = require('../config/database');
const { queryDatabase } = require('../utils/helpers');
const emailService = require('../utils/emailService');

/**
 * Check and send employment update emails for alumni due for follow-up
 * This should be run daily via cron job
 * 
 * WORKFLOW:
 * 1. First Employment Email: graduation_date + 1 year (365 days) AND never updated employment
 * 2. Follow-up Email: last_update_received + 11 months (335 days) AND status = 'updated'
 * 3. Scheduled Due: next_email_date <= CURDATE() AND status = 'scheduled'
 * 
 * Status Flow:
 * - pending → sent (after first email sent)
 * - sent → updated (after alumni updates employment)
 * - updated → scheduled (immediately after alumni updates)
 * - scheduled → sent (after follow-up email sent, then back to updated after alumni responds)
 */
const checkAndScheduleEmploymentUpdates = async () => {
  console.log('[Employment Update Scheduler] Running daily check...');
  
  try {
    // ============================================
    // CONDITION 1: First Employment Update Request (1 year after graduation)
    // Find alumni who graduated 1+ year ago but have never updated their employment
    // ============================================
    const firstUpdateQuery = `
      SELECT 
        ae.id,
        ae.alumni_user_id,
        u.email,
        u.full_name,
        ae.company_name,
        ae.job_title,
        ae.graduation_date,
        ae.last_update_received,
        ae.last_update_sent,
        ae.update_status,
        ae.next_email_date,
        ae.update_email_count,
        DATEDIFF(NOW(), ae.graduation_date) as days_since_graduation
      FROM alumni_employment ae
      JOIN users u ON ae.alumni_user_id = u.id
      WHERE u.role = 'alumni'
      AND ae.graduation_date IS NOT NULL
      AND DATEDIFF(NOW(), ae.graduation_date) >= 365  -- 1 year since graduation
      AND ae.last_update_received IS NULL  -- Never updated employment
      AND ae.update_status = 'pending'  -- Still in pending status
    `;
    
    // ============================================
    // CONDITION 2: Follow-up Email (After Alumni Updates Employment)
    // Find alumni who updated 11+ months ago and need follow-up request
    // This triggers when alumni previously updated their employment and we need to ask again
    // ============================================
    const followUpQuery = `
      SELECT 
        ae.id,
        ae.alumni_user_id,
        u.email,
        u.full_name,
        ae.company_name,
        ae.job_title,
        ae.graduation_date,
        ae.last_update_received,
        ae.last_update_sent,
        ae.update_status,
        ae.next_email_date,
        ae.update_email_count,
        DATEDIFF(NOW(), ae.last_update_received) as days_since_update
      FROM alumni_employment ae
      JOIN users u ON ae.alumni_user_id = u.id
      WHERE u.role = 'alumni'
      AND ae.last_update_received IS NOT NULL  -- Has updated before
      AND DATEDIFF(NOW(), ae.last_update_received) >= 335  -- 11 months (approx 335 days)
      AND ae.update_status = 'updated'  -- Status is 'updated' (waiting for next email date)
      AND ae.next_email_date IS NOT NULL
      AND ae.next_email_date <= CURDATE()  -- Next email date has passed
    `;
    
    // Execute both queries
    const firstUpdateAlumni = await queryDatabase(db, firstUpdateQuery, []);
    const followUpAlumni = await queryDatabase(db, followUpQuery, []);
    
    // ============================================
    // CONDITION 3: Check if 'updated' alumni need status changed to 'scheduled'
    // This runs when alumni already updated after receiving email - just update status without sending email
    // Set next_email_date if not set, and change status to 'scheduled'
    // ============================================
    const alreadyUpdatedQuery = `
      SELECT 
        ae.id,
        ae.alumni_user_id,
        u.email,
        u.full_name,
        ae.company_name,
        ae.job_title,
        ae.graduation_date,
        ae.last_update_received,
        ae.last_update_sent,
        ae.update_status,
        ae.next_email_date,
        ae.update_email_count
      FROM alumni_employment ae
      JOIN users u ON ae.alumni_user_id = u.id
      WHERE u.role = 'alumni'
      AND ae.update_status = 'updated'
      AND (
        ae.next_email_date IS NULL  -- No next_email_date set yet
        OR ae.next_email_date > CURDATE()  -- Next email date is in the future
      )
    `;
    const alreadyUpdatedAlumni = await queryDatabase(db, alreadyUpdatedQuery, []);
    
    // Process alumni who already updated - set next_email_date if needed and change status to 'scheduled'
    for (const alumnus of alreadyUpdatedAlumni) {
      try {
        // Calculate next email date (11 months from last_update_received)
        const nextEmailDate = new Date(alumnus.last_update_received);
        nextEmailDate.setMonth(nextEmailDate.getMonth() + 11);
        
        const updateQuery = `
          UPDATE alumni_employment 
          SET update_status = 'scheduled',
              next_email_date = ?
          WHERE id = ?
        `;
        await queryDatabase(db, updateQuery, [nextEmailDate, alumnus.id]);
        console.log(`[Employment Update Scheduler] Marked ${alumnus.email} as scheduled (next email: ${nextEmailDate.toISOString().split('T')[0]})`);
      } catch (error) {
        console.error(`[Employment Update Scheduler] Error updating status for ${alumnus.email}:`, error);
      }
    }
    
    // Combine results for email sending (first update and follow-up)
    const alumniToProcess = [...firstUpdateAlumni, ...followUpAlumni];
    
    // ============================================
    // CONDITION 4: Check if 'scheduled' alumni need new email sent
    // This runs when next_email_date has passed - send new follow-up email
    // ============================================
    const scheduledDueQuery = `
      SELECT 
        ae.id,
        ae.alumni_user_id,
        u.email,
        u.full_name,
        ae.company_name,
        ae.job_title,
        ae.graduation_date,
        ae.last_update_received,
        ae.last_update_sent,
        ae.update_status,
        ae.next_email_date,
        ae.update_email_count
      FROM alumni_employment ae
      JOIN users u ON ae.alumni_user_id = u.id
      WHERE u.role = 'alumni'
      AND ae.update_status = 'scheduled'
      AND ae.next_email_date IS NOT NULL
      AND ae.next_email_date <= CURDATE()
    `;
    const scheduledDueAlumni = await queryDatabase(db, scheduledDueQuery, []);
    
    // Add scheduled due alumni to the list for email processing
    const allAlumniToProcess = [...alumniToProcess, ...scheduledDueAlumni];
    
    if (allAlumniToProcess.length === 0) {
      console.log('[Employment Update Scheduler] No alumni due for update');
      return { processed: 0, sent: 0, failed: 0 };
    }

    console.log(`[Employment Update Scheduler] Found ${allAlumniToProcess.length} alumni due for update`);

    let sentCount = 0;
    let failedCount = 0;

    for (const alumnus of allAlumniToProcess) {
      try {
        // Determine email type for custom message
        const isFirstEmail = !alumnus.last_update_received;
        const emailType = isFirstEmail ? 'Initial Employment Update Request' : 'Follow-up Employment Update Request';
        
        // Send the update request email
        const subject = 'Employment Information Update Request - ACTS Computer College';
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">${emailType}</h2>
            <p>Dear ${alumnus.full_name},</p>
            <p>Good day!</p>
            <p>We hope this message finds you well.</p>
            ${isFirstEmail ? `
            <p>We are reaching out from <strong>ACTS Computer College</strong> as it's been over a year since your graduation. We would like to request an update on your employment information.</p>
            ` : `
            <p>We are reaching out from <strong>ACTS Computer College</strong> to kindly request an update on your employment information. It's been over 11 months since your last update, and we'd love to hear about your career progress.</p>
            <p>Please let us know if you have a <strong>new company</strong> or are still at the <strong>same company</strong>.</p>
            `}
            <p>Your continued participation helps us:</p>
            <ul>
              <li>Track the career progression of our alumni</li>
              <li>Maintain accurate employment statistics</li>
              <li>Connect you with relevant career opportunities</li>
              <li>Improve our curriculum based on industry feedback</li>
            </ul>
            ${alumnus.company_name ? `
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your Current Employment Record:</h3>
              <p><strong>Company:</strong> ${alumnus.company_name || 'Not specified'}</p>
              <p><strong>Job Title:</strong> ${alumnus.job_title || 'Not specified'}</p>
              ${alumnus.last_update_received ? `<p><strong>Last Updated:</strong> ${new Date(alumnus.last_update_received).toLocaleDateString()}</p>` : ''}
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
          // Update the employment record - status should be 'sent' when email is first sent
          const nextEmailDate = new Date();
          nextEmailDate.setMonth(nextEmailDate.getMonth() + 11);

          const updateQuery = `
            UPDATE alumni_employment 
            SET update_status = 'sent',
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

          // Create in-app notification for the alumni
          const notificationService = require('./notificationService');
          await notificationService.createNotification({
            user_id: alumnus.alumni_user_id,
            type: 'EMPLOYMENT_UPDATE_REQUIRED',
            title: 'Annual Employment Update Required',
            message: `It's been over 11 months since your last employment update. Please review and update your employment information.`,
            related_employment_id: alumnus.id
          });

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
      processed: allAlumniToProcess.length, 
      sent: sentCount, 
      failed: failedCount 
    };

  } catch (error) {
    console.error('[Employment Update Scheduler] Critical error:', error);
    return { processed: 0, sent: 0, failed: 0, error: error.message };
  }
};

/**
 * Get upcoming scheduled updates (for admin dashboard)
 * This shows alumni due for update in the next X days based on their last_update_received date
 */
const getUpcomingScheduledUpdates = async (days = 30) => {
  try {
    // Unified approach - find alumni who will be due for update within the specified days
    const query = `
      SELECT 
        ae.id,
        ae.alumni_user_id,
        u.full_name,
        u.email,
        ae.last_update_received,
        ae.next_email_date,
        ae.company_name,
        ae.job_title,
        DATEDIFF(DATE_ADD(ae.last_update_received, INTERVAL 11 MONTH), NOW()) as days_until_due
      FROM alumni_employment ae
      JOIN users u ON ae.alumni_user_id = u.id
      WHERE u.role = 'alumni'
      AND ae.last_update_received IS NOT NULL
      AND DATEDIFF(DATE_ADD(ae.last_update_received, INTERVAL 11 MONTH), NOW()) BETWEEN 0 AND ?
      ORDER BY days_until_due ASC
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
