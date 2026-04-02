// Notification Service - Backend notification management

const db = require('../config/database');
const { queryDatabase } = require('../utils/helpers');
const emailService = require('../utils/emailService');

/**
 * Create a notification for a user
 * @param {object} notificationData - Notification data
 * @returns {Promise<object>} Result with created notification
 */
const createNotification = async (notificationData) => {
  const { user_id, type, title, message, related_form_id, related_employment_id, metadata } = notificationData;
  
  try {
    const query = `
      INSERT INTO Notifications (user_id, type, title, message, related_form_id, related_employment_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await queryDatabase(db, query, [
      user_id,
      type,
      title,
      message,
      related_form_id || null,
      related_employment_id || null,
      metadata ? JSON.stringify(metadata) : null
    ]);
    
    // Get the created notification
    const getQuery = 'SELECT * FROM Notifications WHERE id = ?';
    const created = await queryDatabase(db, getQuery, [result.insertId]);
    
    return {
      success: true,
      notification: created[0]
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    return {
      success: false,
      message: 'Failed to create notification'
    };
  }
};

/**
 * Get notifications for a user
 * @param {number} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<object>} Result with notifications
 */
const getNotificationsForUser = async (userId, page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    
    // Get total count
    const countQuery = 'SELECT COUNT(*) as total, SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread FROM Notifications WHERE user_id = ?';
    const countResult = await queryDatabase(db, countQuery, [userId]);
    const total = countResult[0].total;
    const unreadCount = countResult[0].unread || 0;
    
    // Get notifications with pagination
    const query = `
      SELECT * FROM Notifications 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const notifications = await queryDatabase(db, query, [userId, limit, offset]);
    
    return {
      success: true,
      notifications,
      unread_count: unreadCount,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting notifications:', error);
    return {
      success: false,
      notifications: [],
      unread_count: 0
    };
  }
};

/**
 * Get unread notification count for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>} Unread count
 */
const getUnreadCount = async (userId) => {
  try {
    const query = 'SELECT COUNT(*) as count FROM Notifications WHERE user_id = ? AND is_read = FALSE';
    const result = await queryDatabase(db, query, [userId]);
    return result[0].count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Mark a notification as read
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<object>} Result
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const query = 'UPDATE Notifications SET is_read = TRUE WHERE id = ? AND user_id = ?';
    const result = await queryDatabase(db, query, [notificationId, userId]);
    
    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Notification not found or unauthorized'
      };
    }
    
    return {
      success: true,
      message: 'Notification marked as read'
    };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return {
      success: false,
      message: 'Failed to mark notification as read'
    };
  }
};

/**
 * Mark multiple notifications as read
 * @param {Array} notificationIds - Array of notification IDs
 * @param {number} userId - User ID
 * @returns {Promise<object>} Result
 */
const markMultipleAsRead = async (notificationIds, userId) => {
  try {
    if (!notificationIds || notificationIds.length === 0) {
      return { success: true, message: 'No notifications to mark' };
    }
    
    const placeholders = notificationIds.map(() => '?').join(',');
    const query = `UPDATE Notifications SET is_read = TRUE WHERE id IN (${placeholders}) AND user_id = ?`;
    const result = await queryDatabase(db, query, [...notificationIds, userId]);
    
    return {
      success: true,
      message: `${result.affectedRows} notifications marked as read`
    };
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return {
      success: false,
      message: 'Failed to mark notifications as read'
    };
  }
};

/**
 * Mark all notifications as read for a user
 * @param {number} userId - User ID
 * @returns {Promise<object>} Result
 */
const markAllAsRead = async (userId) => {
  try {
    const query = 'UPDATE Notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE';
    const result = await queryDatabase(db, query, [userId]);
    
    return {
      success: true,
      message: `${result.affectedRows} notifications marked as read`
    };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return {
      success: false,
      message: 'Failed to mark all notifications as read'
    };
  }
};

/**
 * Delete a notification
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID (for authorization)
 * @returns {Promise<object>} Result
 */
const deleteNotification = async (notificationId, userId) => {
  try {
    const query = 'DELETE FROM Notifications WHERE id = ? AND user_id = ?';
    const result = await queryDatabase(db, query, [notificationId, userId]);
    
    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'Notification not found or unauthorized'
      };
    }
    
    return {
      success: true,
      message: 'Notification deleted'
    };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return {
      success: false,
      message: 'Failed to delete notification'
    };
  }
};

/**
 * Create notifications for multiple users (bulk)
 * @param {Array} notifications - Array of notification data
 * @returns {Promise<object>} Result
 */
const createBulkNotifications = async (notifications) => {
  try {
    const created = [];
    const failed = [];
    
    for (const notification of notifications) {
      const result = await createNotification(notification);
      if (result.success) {
        created.push(result.notification);
      } else {
        failed.push(notification);
      }
    }
    
    return {
      success: true,
      created: created.length,
      failed: failed.length,
      notifications: created
    };
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return {
      success: false,
      message: 'Failed to create bulk notifications'
    };
  }
};

/**
 * Send notification email to user
 * @param {number} userId - User ID
 * @param {object} notification - Notification data
 * @param {string} userEmail - User email address
 * @returns {Promise<object>} Result
 */
const sendNotificationEmail = async (userId, notification, userEmail) => {
  const emailTemplates = {
    'form_assigned': {
      subject: `New Feedback Form Assigned: ${notification.title}`,
      getHtml: (n) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Feedback Form Assigned</h2>
          <p>Dear User,</p>
          <p>${n.message}</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/submit-feedback" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Complete Feedback Form
            </a>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This is an automated message from FeedbACTS System.<br>
            Please do not reply to this email.
          </p>
        </div>
      `
    },
    'employment_update_required': {
      subject: `Employment Information Update - ACTS Computer College`,
      getHtml: (n) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Employment Information Update</h2>
          <p>Dear Alumni,</p>
          <p>Good day.</p>
          <p>We hope this message finds you well.</p>
          <p>We are reaching out from <strong>ACTS Computer College</strong> to kindly remind you to update your employment information. Your continued participation helps us:</p>
          <ul>
            <li>Track the career progression of our alumni</li>
            <li>Maintain accurate employment statistics</li>
            <li>Connect you with relevant career opportunities</li>
          </ul>
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
      `
    },
    'feedback_reminder': {
      subject: `Reminder: ${notification.title}`,
      getHtml: (n) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ea580c;">Feedback Form Reminder</h2>
          <p>Dear User,</p>
          <p>${n.message}</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/submit-feedback" 
               style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Complete Now
            </a>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This is an automated message from FeedbACTS System.<br>
            Please do not reply to this email.
          </p>
        </div>
      `
    },
    'form_deadline_approaching': {
      subject: `Urgent: ${notification.title}`,
      getHtml: (n) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Deadline Approaching</h2>
          <p>Dear User,</p>
          <p>${n.message}</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/submit-feedback" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Submit Now
            </a>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This is an automated message from FeedbACTS System.<br>
            Please do not reply to this email.
          </p>
        </div>
      `
    }
  };

  const template = emailTemplates[notification.type];
  if (!template) {
    console.log('No email template for notification type:', notification.type);
    return { success: false, message: 'No email template found' };
  }

  try {
    const subject = template.subject;
    const html = template.getHtml(notification);
    
    const emailResult = await emailService.sendEmail(userEmail, subject, html);
    
    return {
      success: emailResult,
      message: emailResult ? 'Email sent' : 'Failed to send email'
    };
  } catch (error) {
    console.error('Error sending notification email:', error);
    return {
      success: false,
      message: 'Failed to send notification email'
    };
  }
};

/**
 * Get user email by user ID
 * @param {number} userId - User ID
 * @returns {Promise<string|null>} User email
 */
const getUserEmail = async (userId) => {
  try {
    const query = 'SELECT email FROM users WHERE id = ?';
    const result = await queryDatabase(db, query, [userId]);
    return result.length > 0 ? result[0].email : null;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
};

module.exports = {
  createNotification,
  getNotificationsForUser,
  getUnreadCount,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  createBulkNotifications,
  sendNotificationEmail,
  getUserEmail
};
