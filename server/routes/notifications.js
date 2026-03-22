// Notification Routes for FeedbACTS
const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { verifyToken } = require('../middleware/auth');
const emailService = require('../utils/emailService');

// Email templates for notifications
const getEmailTemplate = (notification) => {
  const templates = {
    'form_assigned': {
      subject: `New Feedback Form Assigned: ${notification.title}`,
      getHtml: (n) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1bd449;">New Feedback Form Assigned</h2>
          <p>Dear User,</p>
          <p>${n.message}</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/submit-feedback" 
               style="background-color: #17cf57; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
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
          <h2 style="color: #1cc54f;">Employment Information Update</h2>
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
               style="background-color: #22d47b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
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
    }
  };
  return templates[notification.type];
};

/**
 * Send batch notification emails simultaneously
 * @param {Array} userIds - Array of user IDs
 * @param {Array} notifications - Array of notification objects
 * @returns {Promise<Object>} - Results summary
 */
const sendBatchNotificationEmails = async (userIds, notifications) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  if (!userIds || userIds.length === 0) {
    return results;
  }

  try {
    // Get all user emails in parallel
    const userEmailPromises = userIds.map(async (userId) => {
      const email = await notificationService.getUserEmail(userId);
      return { userId, email };
    });

    const userEmails = await Promise.all(userEmailPromises);

    // Build email batch
    const emailBatch = [];
    userEmails.forEach(({ userId, email }) => {
      if (email) {
        const notification = notifications.find(n => n.user_id === userId);
        if (notification) {
          const template = getEmailTemplate(notification);
          if (template) {
            emailBatch.push({
              to: email,
              subject: template.subject,
              html: template.getHtml(notification)
            });
          }
        }
      }
    });

    // Send all emails simultaneously
    const emailResults = await emailService.sendBatchEmails(emailBatch);
    return emailResults;
  } catch (error) {
    console.error('Error sending batch notification emails:', error);
    return results;
  }
};

/**
 * Get all notifications for the current user
 * GET /api/notifications
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await notificationService.getNotificationsForUser(userId, page, limit);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications'
    });
  }
});

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      unread_count: count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
});

/**
 * Mark a notification as read
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);
    
    const result = await notificationService.markAsRead(notificationId, userId);
    
    res.json(result);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

/**
 * Mark multiple notifications as read
 * PUT /api/notifications/mark-read
 */
router.put('/mark-read', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notification_ids } = req.body;
    
    if (!notification_ids || !Array.isArray(notification_ids)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification_ids array'
      });
    }
    
    const result = await notificationService.markMultipleAsRead(notification_ids, userId);
    
    res.json(result);
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
});

/**
 * Mark all notifications as read
 * PUT /api/notifications/mark-all-read
 */
router.put('/mark-all-read', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await notificationService.markAllAsRead(userId);
    
    res.json(result);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);
    
    const result = await notificationService.deleteNotification(notificationId, userId);
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
});

/**
 * Send form assignment notification (Admin only)
 * POST /api/notifications/form-assignment
 */
router.post('/form-assignment', verifyToken, async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const { user_ids, form_id, form_title, form_category, due_date, send_email } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'user_ids is required and must be a non-empty array'
      });
    }
    
    if (!form_id || !form_title) {
      return res.status(400).json({
        success: false,
        message: 'form_id and form_title are required'
      });
    }

    // Create notifications for all users
    const notifications = user_ids.map(userId => ({
      user_id: userId,
      type: 'form_assigned',
      title: `New ${form_category || 'Feedback'} Form Assigned`,
      message: `You have been assigned the form "${form_title}".${due_date ? ` Please complete it by ${due_date}.` : ' Please complete it at your earliest convenience.'}`,
      related_form_id: form_id,
      metadata: {
        form_title,
        form_category,
        due_date,
        priority: 'high'
      }
    }));

    const result = await notificationService.createBulkNotifications(notifications);
    
    // Send emails in batch if requested (simultaneous sending)
    if (send_email) {
      setImmediate(async () => {
        await sendBatchNotificationEmails(user_ids, notifications);
      });
    }

    res.json({
      success: true,
      message: `Created ${result.created} notifications`,
      results: result
    });
  } catch (error) {
    console.error('Error sending form assignment notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send form assignment notification'
    });
  }
});

/**
 * Send employment update notification to alumni (Admin only)
 * POST /api/notifications/employment-update
 */
router.post('/employment-update', verifyToken, async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }

    const { user_ids, academic_year, deadline, send_email } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'user_ids is required and must be a non-empty array'
      });
    }

    const year = academic_year || new Date().getFullYear();
    
    // Create notifications for all alumni users
    const notifications = user_ids.map(userId => ({
      user_id: userId,
      type: 'employment_update_required',
      title: `Annual Employment Update - ${year}`,
      message: `Please update your employment information for the ${year} annual alumni survey.${deadline ? ` Deadline: ${deadline}.` : ''}`,
      metadata: {
        academic_year: year,
        deadline,
        priority: 'high'
      }
    }));

    const result = await notificationService.createBulkNotifications(notifications);
    
    // Send emails in batch if requested (simultaneous sending)
    if (send_email) {
      setImmediate(async () => {
        await sendBatchNotificationEmails(user_ids, notifications);
      });
    }

    res.json({
      success: true,
      message: `Created ${result.created} employment update notifications`,
      results: result
    });
  } catch (error) {
    console.error('Error sending employment update notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send employment update notification'
    });
  }
});

module.exports = router;
