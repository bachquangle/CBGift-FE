// File: ManagerSidebar.jsx

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react"; 
import { 
    ChevronLeft, 
    ChevronRight, 
    LayoutDashboard, 
    ClipboardList, // Manage Order
    Users,         // Manage Account
    Package,       // Manage Product
    BarChart3,     // Reports
    
    // ✨ ICONS MỚI CHO CÁC MỤC KHÁC BIỆT ✨
    Handshake,     // Manage Relationship
    Tags,          // Manage Category
    Factory,       // Operations & Production Report
} from "lucide-react"; 

// ✨ NHẬN isCollapsed VÀ toggleCollapse TỪ PROPS CHA ✨
export default function ManagerSidebar({ 
    currentPage, 
    setCurrentPage, 
    isCollapsed = false, 
    toggleCollapse = () => {} 
}) {
  const router = useRouter();

  // ✨ Ánh xạ icon cho từng menu item ✨
  const menuItems = [
    { id: "dashboard", label: "Dashboard", path: "/manager/dashboard", icon: LayoutDashboard },
    {
      id: "manage-order",
      label: "Manage Order",
      path: "/manager/manage-order",
      icon: ClipboardList
    },
    {
      id: "manage-account",
      label: "Manage Account",
      path: "/manager/manage-account",
      icon: Users
    },
    {
      id: "manage-relationship",
      label: "Manage Relationship",
      path: "/manager/manage-relationship",
      icon: Handshake // ✨ SỬ DỤNG HANDSHAKE ✨
    },
    {
      id: "manage-catalog",
      label: "Manage Product",
      path: "/manager/manage-catalog",
      icon: Package
    },
    {
      id: "manage-category",
      label: "Manage Category",
      path: "/manager/manage-category",
      icon: Tags // ✨ SỬ DỤNG TAGS (Phân loại) ✨
    },
    { id: "report", label: "Reports", path: "/manager/reports", icon: BarChart3 },
    {
      id: "operations",
      label: "Operations & Production Report",
      path: "/manager/operations",
      icon: Factory // ✨ SỬ DỤNG FACTORY (Sản xuất/Vận hành) ✨
    },
  ];

  const handleNavigation = (item) => {
    setCurrentPage(item.id);
    router.push(item.path);
  };

  return (
    <div 
        className={`shadow-md flex flex-col border-r border-indigo-100 h-screen transition-all duration-300 ${
            isCollapsed ? 'w-20' : 'w-64'
        } bg-indigo-50`}
    >
      <div 
        className={`p-6 border-b border-indigo-200 bg-gradient-to-r from-indigo-100 to-blue-50 flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center`}
      >
        {/* Tiêu đề */}
        {!isCollapsed && <h1 className="text-xl font-bold text-indigo-900 whitespace-nowrap">CNC - Manager</h1>}
        
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
        {menuItems.map((item) => {
            const IconComponent = item.icon;

            return (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "default" : "ghost"}
                className={`w-full justify-start transition-colors px-3 py-2 ${
                    isCollapsed ? 'justify-center' : 'gap-3'
                } ${
                  currentPage === item.id
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    : "text-indigo-900 hover:bg-indigo-100 hover:text-indigo-900"
                }`}
                onClick={() => handleNavigation(item)}
                title={isCollapsed ? item.label : undefined}
              >
                {/* ICON */}
                <IconComponent className={`h-5 w-5 ${!isCollapsed ? 'mr-3' : ''}`} />
                
                {/* LABEL */}
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Button>
            )
        })}
      </nav>
    </div>
  );
}