// File: DesignerSidebar.jsx

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Palette,
  History,
  Settings,
  User,
  LogOut,
  Package,
  ClipboardList,
  // ✨ THÊM CÁC ICON CẦN THIẾT CHO CHỨC NĂNG VÀ MENU ✨
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Brush, // Thay thế Palette/Settings cho Design Assign/AI
  Megaphone, // Dùng cho AI Design
  Sparkles, 
  Bot, 
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react"; // ✨ Import useState

export default function DesignerSidebar({ currentPage, setCurrentPage }) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false); // ✨ State mới cho trạng thái thu gọn

  // ✨ BỔ SUNG CÁC ICON BỊ THIẾU VÀ ĐỊNH NGHĨA ICON MỚI ✨
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      path: "/designer/dashboard",
    },
    {
      id: "design-assign",
      label: "Design Assign by Seller",
      icon: <Palette className="h-4 w-4" />,
      path: "/designer/design-assign",
    },
    {
      label: "Design History",
      path: "/designer/design-history",
      icon: <History className="h-4 w-4" />,
      id: "design-history",
    },
    {
      label: "AI Design",
      path: "/designer/ai",
      icon: <Sparkles className="h-4 w-4" />,
      id: "ai-design",
    },
  ];

  const handleNavigation = (item) => {
    setCurrentPage(item.id);
    router.push(item.path);
  };
  
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div 
        // ✨ ĐIỀU CHỈNH ĐỘ RỘNG VÀ TRANSITION ✨
        className={`shadow-md flex flex-col border-r border-indigo-100 h-screen transition-all duration-300 ${
            isCollapsed ? 'w-20' : 'w-64'
        } bg-indigo-50`}
    >
      <div 
        className={`p-6 border-b border-indigo-200 bg-gradient-to-r from-indigo-100 to-blue-50 flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center`}
      >
        {/* Tiêu đề */}
        {!isCollapsed && <h1 className="text-xl font-bold text-indigo-900 whitespace-nowrap">CNC - Designer</h1>}
        
        {/* Nút Toggle */}
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className={`p-1 h-auto w-auto text-indigo-800 hover:bg-indigo-200 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
            title={isCollapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"}
        >
            {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
            ) : (
                <ChevronLeft className="h-5 w-5" />
            )}
        </Button>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-x-hidden">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={currentPage === item.id ? "default" : "ghost"}
            // ✨ CẬP NHẬT CLASS CHO TRẠNG THÁI THU GỌN ✨
            className={`w-full justify-start transition-colors px-3 py-2 ${
                isCollapsed ? 'justify-center' : 'gap-3'
            } ${
              currentPage === item.id
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                : "text-indigo-900 hover:bg-indigo-100 hover:text-indigo-900"
            }`}
            onClick={() => handleNavigation(item)}
            title={isCollapsed ? item.label : undefined} // ✨ Thêm Tooltip khi thu gọn
          >
            {item.icon} 
            {/* ✨ Ẩn Label khi thu gọn ✨ */}
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </Button>
        ))}
      </nav>
    </div>
  );
}