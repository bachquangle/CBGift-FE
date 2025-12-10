// File: ManagerSidebar.jsx

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  BarChart3,
  Handshake,
  Tags,
  Factory,
} from "lucide-react";

// ✨ NHẬN isCollapsed VÀ toggleCollapse TỪ PROPS CHA, NHƯNG LẠI DÙNG useState NỘI BỘ ✨
export default function ManagerSidebar({
  currentPage,
  setCurrentPage,
  // Giữ lại props này, nhưng chúng ta sẽ ưu tiên state nội bộ (local)
  // Nếu bạn muốn ưu tiên props truyền vào: bạn nên bỏ isLocalCollapsed và dùng thẳng props.isCollapsed
  // Để giữ cho nút toggle luôn hoạt động, ta dùng useState cho isLocalCollapsed.
}) {
  const router = useRouter();
  // ✨ STATE NỘI BỘ MỚI để quản lý trạng thái thu gọn/mở rộng ✨
  const [isLocalCollapsed, setIsLocalCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsLocalCollapsed((prev) => !prev);
  };

  // Ánh xạ icon cho từng menu item (Giữ nguyên)
  const menuItems = [
    // { id: "dashboard", label: "Dashboard", path: "/manager/dashboard", icon: LayoutDashboard },
    {
      id: "manage-order",
      label: "Manage Order",
      path: "/manager/manage-order",
      icon: ClipboardList,
    },
    {
      id: "manage-account",
      label: "Manage Account",
      path: "/manager/manage-account",
      icon: Users,
    },
    {
      id: "manage-relationship",
      label: "Manage Relationship",
      path: "/manager/manage-relationship",
      icon: Handshake,
    },
    {
      id: "manage-catalog",
      label: "Manage Product",
      path: "/manager/manage-catalog",
      icon: Package,
    },
    {
      id: "manage-category",
      label: "Manage Category",
      path: "/manager/manage-category",
      icon: Tags,
    },
    {
      id: "report",
      label: "Reports",
      path: "/manager/reports",
      icon: BarChart3,
    },
    {
      id: "operations",
      label: "Operations & Production Report",
      path: "/manager/operations",
      icon: Factory,
    },
  ];

  const handleNavigation = (item) => {
    setCurrentPage(item.id);
    router.push(item.path);
    // ✨ KHÔNG THAY ĐỔI TRẠNG THÁI THU GỌN Ở ĐÂY ✨
    // (Để giữ trạng thái người dùng đã chọn)
  };

  return (
    <div
      // Sử dụng isLocalCollapsed
      className={`shadow-md flex flex-col border-r border-indigo-100 h-screen transition-all duration-300 ${
        isLocalCollapsed ? "w-20" : "w-64"
      } bg-indigo-50`}
    >
      <div
        className={`p-6 border-b border-indigo-200 bg-gradient-to-r from-indigo-100 to-blue-50 flex ${
          isLocalCollapsed ? "justify-center" : "justify-between"
        } items-center`}
      >
        {/* Tiêu đề */}
        {!isLocalCollapsed && (
          <h1 className="text-xl font-bold text-indigo-900 whitespace-nowrap">
            CNC - Manager
          </h1>
        )}

        {/* Nút Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse} // ✨ GỌI HÀM TOGGLE NỘI BỘ ✨
          className={`p-1 h-auto w-auto text-indigo-800 hover:bg-indigo-200 transition-colors ${
            isLocalCollapsed ? "mx-auto" : ""
          }`}
          title={isLocalCollapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"}
        >
          {isLocalCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-x-hidden">
        {menuItems.map((item) => {
          const IconComponent = item.icon;

          return (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "default" : "ghost"}
              className={`w-full justify-start transition-colors px-3 py-2 ${
                isLocalCollapsed ? "justify-center" : "gap-3"
              } ${
                currentPage === item.id
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                  : "text-indigo-900 hover:bg-indigo-100 hover:text-indigo-900"
              }`}
              onClick={() => handleNavigation(item)}
              title={isLocalCollapsed ? item.label : undefined}
            >
              {/* ICON */}
              <IconComponent
                className={`h-5 w-5 ${!isLocalCollapsed ? "mr-3" : ""}`}
              />

              {/* LABEL */}
              {!isLocalCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
