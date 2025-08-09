"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSession } from "next-auth/react";

interface Notification {
  id: string;
  type: 'PROJECT_SUBMITTED' | 'PROJECT_APPROVED' | 'PROJECT_REJECTED' | 'VERSION_READY' | 'AZURE_SYNC_COMPLETED' | 'AZURE_SYNC_FAILED';
  title: string;
  message: string;
  projectId?: string;
  projectName?: string;
  versionId?: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PROJECT_APPROVED':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'PROJECT_REJECTED':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'PROJECT_SUBMITTED':
      case 'VERSION_READY':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'AZURE_SYNC_COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'AZURE_SYNC_FAILED':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'PROJECT_APPROVED':
        return 'border-r-emerald-500 bg-emerald-50/50';
      case 'PROJECT_REJECTED':
        return 'border-r-red-500 bg-red-50/50';
      case 'PROJECT_SUBMITTED':
      case 'VERSION_READY':
        return 'border-r-blue-500 bg-blue-50/50';
      case 'AZURE_SYNC_COMPLETED':
        return 'border-r-green-500 bg-green-50/50';
      case 'AZURE_SYNC_FAILED':
        return 'border-r-orange-500 bg-orange-50/50';
      default:
        return 'border-r-gray-500 bg-gray-50/50';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative h-10 w-10 rounded-full p-0 hover:bg-accent hover:text-accent-foreground transition-all duration-200 cursor-pointer"
          aria-label="اعلانات"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
                        <PopoverContent className="w-96 p-0" align="start" dir="rtl">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">اعلانات</CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs h-8 px-2 hover:bg-accent"
                >
                  علامت‌گذاری همه
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">اعلانی وجود ندارد</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b last:border-b-0 border-r-4 transition-all duration-200 cursor-pointer hover:bg-accent/50 ${getNotificationColor(notification.type)} ${
                      !notification.isRead ? 'bg-muted/30' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                      if (notification.projectId) {
                        window.location.href = `/projects/${notification.projectId}`;
                      }
                      setIsOpen(false);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!notification.isRead) {
                          markAsRead(notification.id);
                        }
                        if (notification.projectId) {
                          window.location.href = `/projects/${notification.projectId}`;
                        }
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium text-right">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground text-right leading-relaxed mb-2">
                          {notification.message}
                        </p>
                        {notification.projectName && (
                          <p className="text-xs text-muted-foreground text-right mb-1">
                            پروژه: {notification.projectName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground text-right">
                          {new Date(notification.createdAt).toLocaleDateString('fa-IR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
