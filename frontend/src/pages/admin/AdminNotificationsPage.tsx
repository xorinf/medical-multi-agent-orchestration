import React, { useEffect, useState } from 'react';
import { notificationService } from '../../services/notificationService';
import type { PlatformNotification } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckCheck, Info, ShieldAlert } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const AdminNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    notificationService.getNotifications().then(setNotifications);
  }, []);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast('All system alerts marked as read', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100">
            Platform Alerts & Notifications
          </h1>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
            System warnings, credential review requests, and clinical pipeline events
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleMarkAllRead} leftIcon={<CheckCheck className="w-3.5 h-3.5" />}>
          Mark All as Read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map(n => (
          <Card
            key={n.id}
            className={`p-5 flex items-start gap-4 transition-all ${
              !n.read
                ? 'border-l-4 border-l-sage-600 bg-sage-50/20 dark:bg-sage-950/10'
                : 'opacity-80'
            }`}
          >
            <div className="mt-0.5">
              {n.type === 'warning' ? (
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              ) : (
                <Info className="w-5 h-5 text-sage-600" />
              )}
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">{n.title}</h3>
                <span className="text-[10px] text-charcoal-400">
                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400 leading-relaxed">
                {n.message}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
