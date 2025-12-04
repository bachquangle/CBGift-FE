"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Loader2, CheckCheck, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
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
  
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = useRef(null);
  const PAGE_SIZE = 10;

  // --- HÀM HELPER ĐỂ XỬ LÝ GIỜ ---
  const parseUtcDate = (dateString) => {
      if (!dateString) return new Date();
      
      // Nếu chuỗi thời gian server trả về không có 'Z' (UTC marker) 
      // và không có dấu '+' (Timezone offset), ta thủ công thêm 'Z' vào.
      // Điều này ép trình duyệt hiểu: "Đây là giờ UTC (London), hãy tự quy đổi sang giờ VN khi hiển thị".
      if (!dateString.endsWith("Z") && !dateString.includes("+")) {
          return new Date(dateString + "Z");
      }
      
      return new Date(dateString);
  };

  // --- CÁC HÀM FETCH API ---
  const fetchUnreadCount = async () => {
    try {
      const res = await apiClient.get("/api/Notification/unread-count");
      const count = res.data?.unreadCount ?? res.data ?? 0;
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const fetchNotifications = async (pageIndex, isRefresh = false) => {
    if (loading) return;
    setLoading(true);
    
    try {
      const res = await apiClient.get(`/api/Notification?pageIndex=${pageIndex}&pageSize=${PAGE_SIZE}`);
      const newNotifications = res.data || [];

      if (isRefresh) {
        setNotifications(newNotifications);
      } else {
        setNotifications((prev) => [...prev, ...newNotifications]);
      }

      if (newNotifications.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReadNotification = async (notification) => {
    // Logic redirect...
    if (notification.isRead) return;

    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await apiClient.put(`/api/Notification/${notification.id}/read`);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await apiClient.put(`/api/Notification/read-all`);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      fetchUnreadCount();
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight + 20 && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  const handleRefresh = () => {
      if(loading) return;
      setPage(1);
      setHasMore(true);
      fetchNotifications(1, true);
      if(scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
      }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (open) {
      setPage(1);
      setHasMore(true);
      fetchNotifications(1, true);
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
      
      <PopoverContent className="w-80 p-0 sm:w-96 border shadow-lg rounded-lg" align="end">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-base text-gray-800">Thông báo</h4>
            {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px] h-5 px-1.5 font-normal">
                {unreadCount} mới
                </Badge>
            )}
          </div>
          
          {unreadCount > 0 && (
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
                onClick={handleMarkAllAsRead}
            >
                <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
                Đọc tất cả
            </Button>
          )}
        </div>
        
        {/* List */}
        <div 
            ref={scrollContainerRef}
            className="max-h-[400px] overflow-y-auto custom-scrollbar bg-white"
            onScroll={handleScroll}
        >
          {notifications.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Bell className="h-10 w-10 opacity-20 mb-3" />
              <p className="text-sm">Bạn không có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleReadNotification(notification)}
                  className={`flex flex-col gap-1 p-3.5 text-sm transition-all cursor-pointer ${
                    !notification.isRead 
                        ? "bg-blue-50 hover:bg-blue-100" 
                        : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-sm ${
                        !notification.isRead 
                        ? "font-bold text-gray-900" 
                        : "font-medium text-gray-600"
                    }`}>
                      {notification.title || "Hệ thống"}
                    </span>
                    {!notification.isRead && (
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-600 mt-1.5 shrink-0 shadow-sm ring-2 ring-blue-50" />
                    )}
                  </div>
                  
                  <p className={`text-xs line-clamp-3 leading-relaxed ${
                      !notification.isRead 
                      ? "text-gray-800 font-medium" 
                      : "text-gray-500" 
                  }`}>
                    {notification.message || notification.content}
                  </p>
                  
                  {/* --- SỬA Ở ĐÂY: DÙNG HÀM parseUtcDate --- */}
                  <span className={`text-[11px] mt-1 ${
                        !notification.isRead ? "text-blue-600 font-medium" : "text-gray-400"
                  }`}>
                    {notification.createdAt 
                      ? formatDistanceToNow(parseUtcDate(notification.createdAt), { addSuffix: true, locale: vi }) 
                      : "Vừa xong"}
                  </span>
                </div>
              ))}
              
              {loading && (
                  <div className="flex justify-center p-3 bg-white">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-2 bg-gray-50 flex justify-center rounded-b-lg">
            <Button 
                variant="ghost" 
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="h-8 text-xs w-full gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
            >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Làm mới danh sách
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}