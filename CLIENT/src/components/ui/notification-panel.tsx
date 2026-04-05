// Notification Panel Component with Bell Icon
// Reusable component for displaying notifications in dashboards

import React, { useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  Loader2, 
  FileText, 
  Briefcase, 
  AlertCircle,
  Clock,
  GraduationCap,
  Mail
} from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { ScrollArea } from './scroll-area';
import { 
  Notification, 
  NotificationsListResponse,
  NotificationType 
} from '../../types/notifications';
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  dismissNotification,
  formatRelativeTime 
} from '../../services/notificationService';
import { toast } from 'sonner';

interface NotificationPanelProps {
  userRole?: 'student' | 'alumni' | 'instructor' | 'employer' | 'admin';
  onNotificationClick?: (notification: Notification) => void;
  children?: React.ReactNode;
}

/**
 * Get icon based on notification type
 */
const getNotificationTypeIcon = (type: NotificationType): React.ReactNode => {
  switch (type) {
    case 'form_assigned':
      return <FileText className="w-4 h-4 text-blue-500" />;
    case 'employment_update_required':
      return <Briefcase className="w-4 h-4 text-purple-500" />;
    case 'feedback_reminder':
      return <Clock className="w-4 h-4 text-orange-500" />;
    case 'form_deadline_approaching':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'feedback_received':
      return <Check className="w-4 h-4 text-green-500" />;
    case 'system_announcement':
      return <Mail className="w-4 h-4 text-gray-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
};

/**
 * Get badge color based on notification type
 */
const getTypeBadgeColor = (type: NotificationType): string => {
  switch (type) {
    case 'form_assigned':
      return 'bg-blue-100 text-blue-700';
    case 'employment_update_required':
      return 'bg-purple-100 text-purple-700';
    case 'feedback_reminder':
      return 'bg-orange-100 text-orange-700';
    case 'form_deadline_approaching':
      return 'bg-red-100 text-red-700';
    case 'feedback_received':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

/**
 * Single notification item component
 */
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDismiss: (id: number) => void;
  onClick?: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDismiss,
  onClick,
}) => {
  return (
    <div 
      className={`
        p-4 border-b border-gray-100 last:border-0 transition-colors
        ${notification.is_read 
          ? 'bg-white hover:bg-gray-50' 
          : 'bg-blue-50 hover:bg-blue-100'
        }
        cursor-pointer
      `}
      onClick={() => onClick?.(notification)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {getNotificationTypeIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className={`text-sm font-medium truncate ${
                  notification.is_read ? 'text-gray-700' : 'text-gray-900'
                }`}>
                  {notification.title}
                </h4>
                {!notification.is_read && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getTypeBadgeColor(notification.type)}`}
                >
                  {notification.type.replace(/_/g, ' ')}
                </Badge>
                <span className="text-xs text-gray-400">
                  {formatRelativeTime(notification.created_at)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  title="Mark as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(notification.id);
                }}
                title="Dismiss"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Notification Panel Component
 */
export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  userRole = 'student',
  onNotificationClick,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const [panelPosition, setPanelPosition] = useState<{ top: number; right: number; width?: number; height?: string }>({ top: 0, right: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Fetch notifications when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Fetch unread count periodically - always show bell, fetch count in background
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadCount();
        // Only update count if we get a valid number (non-negative)
        if (typeof count === 'number' && count >= 0) {
          setUnreadCount(count);
        }
      } catch (error) {
        // On error, keep the current count (default is 0)
        console.log('Using default unread count');
      } finally {
        setHasAttemptedFetch(true);
      }
    };

    // Initial fetch
    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        const bellButton = document.getElementById('notification-bell');
        if (bellButton && !bellButton.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate panel position based on bell button position
  const updatePanelPosition = useCallback(() => {
    if (bellButtonRef.current && isOpen) {
      const buttonRect = bellButtonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth < 640;

      const mobile = viewportWidth < 640;
      setIsMobile(mobile);
      if (mobile) {
        // Bottom sheet on mobile
        setPanelPosition({
          bottom: 0,
          left: 0,
          right: 0,
          width: viewportWidth,
          height: '80vh'
        });
      } else {
        // Position panel using fixed positioning relative to viewport
        // Position below the button with some spacing
        const top = buttonRect.bottom + 8;

        // Calculate right position to maximize space in upper right
        // Use button's right position plus some offset for better positioning
        const right = viewportWidth - buttonRect.right;

        // Calculate max width based on available space
        const maxWidth = Math.min(
          viewportWidth - right - 32, // Subtract right offset and padding
          600 // Max panel width
        );

        setPanelPosition({
          top,
          right: Math.max(16, right),
          width: Math.max(350, maxWidth)
        });
      }
    }
  }, [isOpen]);

  // Update panel position when opened and on scroll
  useEffect(() => {
    if (isOpen) {
      updatePanelPosition();
      
      // Add scroll listener to update position when page scrolls
      window.addEventListener('scroll', updatePanelPosition, true);
      window.addEventListener('resize', updatePanelPosition);
      
      return () => {
        window.removeEventListener('scroll', updatePanelPosition, true);
        window.removeEventListener('resize', updatePanelPosition);
      };
    }
  }, [isOpen, updatePanelPosition]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const result: NotificationsListResponse = await getNotifications(1, 20);
      if (result.success) {
        setNotifications(result.notifications);
        setUnreadCount(result.unread_count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    const result = await markAsRead(id);
    if (result.success) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead();
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    }
  };

  const handleDismiss = async (id: number) => {
    const result = await dismissNotification(id);
    if (result.success) {
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification dismissed');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    // Call the optional click handler
    onNotificationClick?.(notification);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon Button */}
      <Button
        id="notification-bell"
        ref={bellButtonRef}
        variant="ghost"
        size="sm"
        className="relative p-2 text-black hover:bg-gray-200 rounded-md w-10 h-10"
        onClick={() => setIsOpen(!isOpen)}
        title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-1 flex h-4 w-4 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </Button>

      {/* Render children (additional buttons/controls) */}
      {children}

      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Notification Panel Dropdown */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white border border-gray-200 overflow-hidden ${isMobile ? '' : 'rounded-lg shadow-2xl'}`}
          style={{
            ...(panelPosition.top !== undefined ? {
              top: panelPosition.top,
              right: panelPosition.right,
              width: panelPosition.width || 400,
              maxHeight: 'calc(100vh - 100px)'
            } : {
              bottom: panelPosition.bottom,
              left: panelPosition.left,
              right: panelPosition.right,
              width: panelPosition.width,
              height: panelPosition.height
            }),
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-blue-600 hover:text-blue-700"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notification List with custom scrollbar styling */}
          <ScrollArea className={isMobile ? "h-[calc(80vh - 120px)]" : "h-[calc(80vh-180px)]"}>
            <div className="custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1 px-4" >   
                  You'll see updates here when you receive notifications
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDismiss={handleDismiss}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>
            )}
            </div>
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-600 hover:text-gray-900"
                onClick={() => {
                  // Could navigate to a full notifications page
                  toast.info('View all notifications');
                }}
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Simplified notification bell for dashboard headers
 * Standalone component that renders just the bell button with unread count badge
 */
interface NotificationBellProps {
  className?: string;
  showLabel?: boolean;
  onClick?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
  showLabel = false,
  onClick,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUnread = async () => {
      setIsLoading(true);
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnread();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className={`p-2 text-black hover:bg-gray-200 rounded-md w-10 h-10 ${className}`}
        onClick={onClick}
        title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
      </Button>
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </span>
      )}
      {showLabel && (
        <span className="ml-2 text-sm text-gray-600">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-1 text-red-500">({unreadCount})</span>
          )}
        </span>
      )}
    </div>
  );
};

export default NotificationPanel;
