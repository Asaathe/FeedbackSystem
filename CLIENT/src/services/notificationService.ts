// Notification Service - API calls for notification management

import {
  Notification,
  NotificationsListResponse,
  NotificationResponse,
  MarkAsReadRequest,
  FormAssignmentNotificationRequest,
  EmploymentUpdateNotificationRequest,
} from '../types/notifications';

/**
 * Get authentication token from storage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('token') || sessionStorage.getItem('authToken');
};

/**
 * Fetch all notifications for the current user
 */
export const getNotifications = async (
  page: number = 1,
  limit: number = 20
): Promise<NotificationsListResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    console.warn('No authentication token found');
    return {
      success: false,
      notifications: [],
      unread_count: 0,
    };
  }

  try {
    const response = await fetch(`/api/notifications?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch notifications:', response.statusText);
      return {
        success: false,
        notifications: [],
        unread_count: 0,
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return {
      success: false,
      notifications: [],
      unread_count: 0,
    };
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<number> => {
  const token = getAuthToken();
  
  if (!token) {
    return 0;
  }

  try {
    const response = await fetch('/api/notifications/unread-count', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch unread count:', response.statusText);
      return 0;
    }

    const result = await response.json();
    return result.unread_count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (notificationId: number): Promise<NotificationResponse> => {
  const token = getAuthToken();
  
  if (!token) {
    return {
      success: false,
      notification: {} as Notification,
      message: 'No authentication token',
    };
  }

  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return {
      success: false,
      notification: {} as Notification,
      message: 'Failed to mark as read',
    };
  }
};

/**
 * Mark multiple notifications as read
 */
export const markMultipleAsRead = async (notificationIds: number[]): Promise<{ success: boolean; message: string }> => {
  const token = getAuthToken();
  
  if (!token) {
    return {
      success: false,
      message: 'No authentication token',
    };
  }

  try {
    const response = await fetch('/api/notifications/mark-read', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notification_ids: notificationIds } as MarkAsReadRequest),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return {
      success: false,
      message: 'Failed to mark as read',
    };
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<{ success: boolean; message: string }> => {
  const token = getAuthToken();
  
  if (!token) {
    return {
      success: false,
      message: 'No authentication token',
    };
  }

  try {
    const response = await fetch('/api/notifications/mark-all-read', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return {
      success: false,
      message: 'Failed to mark all as read',
    };
  }
};

/**
 * Delete/dismiss a notification
 */
export const dismissNotification = async (notificationId: number): Promise<{ success: boolean; message: string }> => {
  const token = getAuthToken();
  
  if (!token) {
    return {
      success: false,
      message: 'No authentication token',
    };
  }

  try {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error dismissing notification:', error);
    return {
      success: false,
      message: 'Failed to dismiss notification',
    };
  }
};

/**
 * Send form assignment notification to users (Admin only)
 * This triggers both system notification and email
 */
export const sendFormAssignmentNotification = async (
  request: FormAssignmentNotificationRequest
): Promise<{ success: boolean; message: string; results?: any }> => {
  const token = getAuthToken();
  
  if (!token) {
    return {
      success: false,
      message: 'No authentication token',
    };
  }

  try {
    const response = await fetch('/api/notifications/form-assignment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending form assignment notification:', error);
    return {
      success: false,
      message: 'Failed to send form assignment notification',
    };
  }
};

/**
 * Send employment update notification to alumni (Admin only)
 */
export const sendEmploymentUpdateNotification = async (
  request: EmploymentUpdateNotificationRequest
): Promise<{ success: boolean; message: string; results?: any }> => {
  const token = getAuthToken();
  
  if (!token) {
    return {
      success: false,
      message: 'No authentication token',
    };
  }

  try {
    const response = await fetch('/api/notifications/employment-update', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending employment update notification:', error);
    return {
      success: false,
      message: 'Failed to send employment update notification',
    };
  }
};

/**
 * Format timestamp to human-readable relative time
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString();
};

/**
 * Get notification icon based on type
 */
export const getNotificationIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    'form_assigned': '📋',
    'employment_update_required': '💼',
    'feedback_reminder': '⏰',
    'form_deadline_approaching': '⚠️',
    'feedback_received': '✅',
    'system_announcement': '📢',
  };
  
  return iconMap[type] || '🔔';
};
