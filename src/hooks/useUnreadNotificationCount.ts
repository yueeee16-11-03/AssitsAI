import { useState, useEffect } from 'react';
import NotificationApi from '../api/notificationApi';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  icon: string | null;
  color: string | null;
  actionRoute: string | null;
  read: boolean;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Hook to get the count of unread notifications.
 * Subscribes to real-time updates from Firestore.
 * Returns the count of notifications where read === false.
 */
export const useUnreadNotificationCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupSubscription = () => {
      try {
        // Subscribe to all notifications and calculate unread count
        unsubscribe = NotificationApi.subscribe((notifications: Notification[]) => {
          const count = notifications.filter((n) => !n.read).length;
          setUnreadCount(count);
          setLoading(false);
        });
      } catch (err) {
        console.warn('useUnreadNotificationCount: setup failed', err);
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { unreadCount, loading };
};
