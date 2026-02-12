import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      // Filter client-side for now allows seeing own notifications if RLS isn't strict yet, 
      // but RLS should handle "my notifications" on the backend.
      // Assuming getNotifications returns all visible to user (handled by RLS).
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Optional: Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    if (!user) return;
    try {
      // Optimistic update
      const tempId = Date.now().toString();
      const newNotification: Notification = {
        ...notification,
        id: tempId,
        createdAt: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [newNotification, ...prev]);

      await api.createNotification({
        ...notification,
        userId: user.id
      });

      await fetchNotifications(); // Refresh to get real ID
    } catch (error) {
      console.error('Failed to create notification', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Optimistic
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      await api.markNotificationRead(id);
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      await api.markAllNotificationsRead(user.id);
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  };

  const removeNotification = async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await api.deleteNotification(id);
    } catch (error) {
      console.error('Failed to remove notification', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
