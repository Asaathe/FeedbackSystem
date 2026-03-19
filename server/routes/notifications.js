// Notification Routes for FeedbACTS
const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { verifyToken } = require('../middleware/auth');

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
    
    // Send emails asynchronously if requested
    if (send_email) {
      setImmediate(async () => {
        for (const userId of user_ids) {
          const userEmail = await notificationService.getUserEmail(userId);
          if (userEmail) {
            // Get the first notification for this user
            const notification = notifications.find(n => n.user_id === userId);
            await notificationService.sendNotificationEmail(userId, notification, userEmail);
          }
        }
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
    
    // Send emails asynchronously if requested
    if (send_email) {
      setImmediate(async () => {
        for (const userId of user_ids) {
          const userEmail = await notificationService.getUserEmail(userId);
          if (userEmail) {
            const notification = notifications.find(n => n.user_id === userId);
            await notificationService.sendNotificationEmail(userId, notification, userEmail);
          }
        }
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
