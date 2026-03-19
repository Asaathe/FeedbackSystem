// Notification Types for FeedbACTS System

/**
 * Notification type enumeration
 */
export type NotificationType = 
  | 'form_assigned'
  | 'employment_update_required'
  | 'feedback_reminder'
  | 'form_deadline_approaching'
  | 'feedback_received'
  | 'system_announcement';

/**
 * User role that can receive notifications
 */
export type NotificationRecipientRole = 
  | 'student'
  | 'alumni'
  | 'instructor'
  | 'employer'
  | 'admin';

/**
 * Core notification interface
 */
export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
  // Related entity IDs (optional, for linking to relevant content)
  related_form_id?: number;
  related_employment_id?: number;
  // Metadata for additional context
  metadata?: NotificationMetadata;
}

/**
 * Additional metadata for notifications
 */
export interface NotificationMetadata {
  form_title?: string;
  form_category?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  action_url?: string;
  sender_name?: string;
}

/**
 * API response for notifications list
 */
export interface NotificationsListResponse {
  success: boolean;
  notifications: Notification[];
  unread_count: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * API response for single notification
 */
export interface NotificationResponse {
  success: boolean;
  notification: Notification;
  message?: string;
}

/**
 * Request to mark notification as read
 */
export interface MarkAsReadRequest {
  notification_ids: number[];
}

/**
 * Request to create a notification (internal use)
 */
export interface CreateNotificationRequest {
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  related_form_id?: number;
  related_employment_id?: number;
  metadata?: NotificationMetadata;
}

/**
 * Request to send form assignment notification
 */
export interface FormAssignmentNotificationRequest {
  user_ids: number[];
  form_id: number;
  form_title: string;
  form_category: string;
  due_date?: string;
  send_email: boolean;
}

/**
 * Employment update notification request (for alumni)
 */
export interface EmploymentUpdateNotificationRequest {
  user_ids: number[];
  academic_year: number;
  deadline?: string;
  send_email: boolean;
}

/**
 * Notification bell props for dashboard integration
 */
export interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  className?: string;
}

/**
 * Notification item props for list rendering
 */
export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDismiss: (id: number) => void;
  onClick?: (notification: Notification) => void;
}

/**
 * Notification panel container props
 */
export interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: number) => void;
  onNotificationClick?: (notification: Notification) => void;
}

/**
 * Form assignment with notification trigger
 */
export interface FormAssignmentWithNotification {
  form_id: number;
  form_title: string;
  target_audience: string;
  user_ids: number[];
  due_date?: string;
  send_notification: boolean;
  send_email: boolean;
}
