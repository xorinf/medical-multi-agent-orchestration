import type { PlatformNotification, UserRole } from '../types';
import { mockNotifications } from './mockData';

let notificationsState = [...mockNotifications];

export const notificationService = {
  async getNotifications(role?: UserRole): Promise<PlatformNotification[]> {
    if (!role) return notificationsState;
    return notificationsState.filter(n => n.roleTarget === role || n.roleTarget === 'all' || !n.roleTarget);
  },

  async markAsRead(id: string): Promise<void> {
    notificationsState = notificationsState.map(n => n.id === id ? { ...n, read: true } : n);
  },

  async markAllAsRead(): Promise<void> {
    notificationsState = notificationsState.map(n => ({ ...n, read: true }));
  }
};
