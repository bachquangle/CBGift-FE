"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import apiClient from "../../lib/apiClient";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const res = await apiClient.get("/api/Notification/unread-count");
      if (res.data && typeof res.data.unreadCount === 'number') {
        setUnreadCount(res.data.unreadCount);
      } else if (typeof res.data === 'number') {
        setUnreadCount(res.data);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get("/api/Notification");
      setNotifications(res.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const handleReadNotification = async (notification) => {
    if (notification.isRead) return;
    try {
      await apiClient.put(`/api/Notification/${notification.id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (open) {
      fetchNotifications();
      fetchUnreadCount();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-secondary">
          <Bell className="h-6 w-6 text-foreground/70" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0 sm:w-96" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs font-normal">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 opacity-20 mb-2" />
              <p className="text-xs">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleReadNotification(notification)}
                  className={`flex flex-col gap-1 p-3 text-sm transition-colors cursor-pointer hover:bg-muted/50 ${
                    !notification.isRead ? "bg-blue-50/50" : "bg-background"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`font-medium ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                      {notification.title || "System Message"}
                    </span>
                    {!notification.isRead && <span className="h-2 w-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-muted-foreground text-xs line-clamp-2">
                    {notification.message || notification.content}
                  </p>
                  <span className="text-[10px] text-muted-foreground/60 pt-1">
                    {notification.createdDate 
                      ? formatDistanceToNow(new Date(notification.createdDate), { addSuffix: true }) 
                      : "Just now"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="border-t p-2 text-center bg-muted/10">
            <Button variant="ghost" className="w-full h-8 text-xs" onClick={fetchNotifications}>
                Refresh
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}