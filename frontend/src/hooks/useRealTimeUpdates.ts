/**
 * Real-time Updates Hook
 * Provides polling-based real-time updates for feedback status and notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { FeedbackItem } from '../types';

interface NotificationItem {
  id: string;
  type: 'status_change' | 'new_response' | 'resolution';
  title: string;
  message: string;
  feedbackId: string;
  trackingId: string;
  timestamp: string;
  read: boolean;
}

interface RealTimeUpdatesState {
  notifications: NotificationItem[];
  unreadCount: number;
  lastUpdate: string | null;
  isPolling: boolean;
}

interface UseRealTimeUpdatesOptions {
  pollingInterval?: number; // in milliseconds
  enabled?: boolean;
}

export const useRealTimeUpdates = (options: UseRealTimeUpdatesOptions = {}) => {
  const {
    pollingInterval = 30000, // 30 seconds default
    enabled = true
  } = options;

  const [state, setState] = useState<RealTimeUpdatesState>({
    notifications: [],
    unreadCount: 0,
    lastUpdate: null,
    isPolling: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFeedbackStatusRef = useRef<Map<string, string>>(new Map());

  // Check for status changes in feedback items
  const checkForStatusChanges = useCallback((newFeedback: FeedbackItem[]) => {
    const newNotifications: NotificationItem[] = [];
    
    newFeedback.forEach((feedback) => {
      const lastStatus = lastFeedbackStatusRef.current.get(feedback.id);
      
      if (lastStatus && lastStatus !== feedback.status) {
        // Status changed - create notification
        const notification: NotificationItem = {
          id: `${feedback.id}-${Date.now()}`,
          type: 'status_change',
          title: 'Feedback Status Updated',
          message: `Your feedback "${feedback.title}" is now ${feedback.status.replace('_', ' ')}`,
          feedbackId: feedback.id,
          trackingId: feedback.tracking_id,
          timestamp: new Date().toISOString(),
          read: false,
        };
        
        newNotifications.push(notification);
      }
      
      // Update the status reference
      lastFeedbackStatusRef.current.set(feedback.id, feedback.status);
    });

    if (newNotifications.length > 0) {
      setState(prev => ({
        ...prev,
        notifications: [...newNotifications, ...prev.notifications].slice(0, 50), // Keep last 50
        unreadCount: prev.unreadCount + newNotifications.length,
        lastUpdate: new Date().toISOString(),
      }));

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        newNotifications.forEach(notification => {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id,
          });
        });
      }
    }
  }, []);

  // Poll for updates
  const pollForUpdates = useCallback(async () => {
    if (!enabled) return;

    try {
      setState(prev => ({ ...prev, isPolling: true }));
      
      // Fetch recent feedback to check for status changes
      const response = await apiService.getUserFeedbackList(10);
      const recentFeedback = response.data?.results || [];
      
      checkForStatusChanges(recentFeedback);
      
    } catch (error) {
      console.error('Error polling for updates:', error);
    } finally {
      setState(prev => ({ ...prev, isPolling: false }));
    }
  }, [enabled, checkForStatusChanges]);

  // Start/stop polling
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial poll
    pollForUpdates();

    // Set up interval
    intervalRef.current = setInterval(pollForUpdates, pollingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, pollingInterval, pollForUpdates]);

  // Request notification permission on mount
  useEffect(() => {
    if (enabled && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [enabled]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }));
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: [],
      unreadCount: 0,
    }));
  }, []);

  // Force refresh
  const forceRefresh = useCallback(() => {
    pollForUpdates();
  }, [pollForUpdates]);

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    lastUpdate: state.lastUpdate,
    isPolling: state.isPolling,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    forceRefresh,
  };
};
