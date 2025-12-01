// File: StaffSidebar.jsx

"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react"; // ✨ Import useState
import { 
    ChevronLeft, 
    ChevronRight, 
    LayoutDashboard, 
    Package, 
    ClipboardList, // Manage Order
    Factory,       // Needs Production / Produced
    Receipt,       // Manage Invoice
    Printer,       // Printer Bill
} from "lucide-react"; // ✨ Import icons

export default function StaffSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false); // ✨ State cho trạng thái thu gọn

  // ✨ Ánh xạ icon cho từng menu item ✨
  const menuItems = [
    { id: "dashboard", label: "Dashboard", path: "/staff/dashboard", icon: LayoutDashboard },
    { id: "manage-order", label: "Manage Order", path: "/staff/manage-order", icon: ClipboardList },
    {
      id: "needs-production",
      label: "Needs Production",
      path: "/staff/needs-production",
      icon: Factory,
    },
    { id: "produced", label: "Produced", path: "/staff/produced", icon: Package },
    {
      id: "manage-invoice",
      label: "Manage Invoice",
      path: "/staff/manage-invoice",
      icon: Receipt,
    },
    { id: "printer-bill", label: "Printer Bill", path: "/staff/printer-bill", icon: Printer },
  ];

  const handleNavigation = (path) => {
    router.push(path);
  };

  const isActive = (path) => pathname === path;
    
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
        {!isCollapsed && <h1 className="text-xl font-bold text-indigo-900 whitespace-nowrap">CNC - Staff</h1>}
        
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
                variant={isActive(item.path) ? "default" : "ghost"}
                // ✨ CẬP NHẬT CLASS CHO TRẠNG THÁI THU GỌN ✨
                className={`w-full justify-start transition-colors px-3 py-2 ${
                    isCollapsed ? 'justify-center' : 'gap-3'
                } ${
                  isActive(item.path)
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    : "text-indigo-900 hover:bg-indigo-100 hover:text-indigo-900"
                }`}
                onClick={() => handleNavigation(item.path)}
                title={isCollapsed ? item.label : undefined} // Thêm Tooltip khi thu gọn
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