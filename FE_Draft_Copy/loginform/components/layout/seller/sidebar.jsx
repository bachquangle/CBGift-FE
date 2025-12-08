// File: SellerSidebar.jsx

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react"; // ✨ Import useState
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Package,
  FileText,
  DollarSign,
  LocateFixed,
} from "lucide-react"; // ✨ Import icons

export default function SellerSidebar({ currentPage }) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false); // ✨ State mới cho trạng thái thu gọn

  // ✨ Ánh xạ icon cho từng menu item ✨
  const menuItems = [
    // { id: "dashboard", label: "Dashboard", path: "/seller/dashboard", icon: LayoutDashboard },
    {
      id: "manage-order",
      label: "Manage Order",
      path: "/seller/manage-order",
      icon: Package,
    },
    {
      id: "product-catalog",
      label: "Product Catalog",
      path: "/seller/product-catalog",
      icon: FileText,
    },
    {
      id: "manage-invoice",
      label: "Manage Invoice",
      path: "/seller/manage-invoice",
      icon: DollarSign,
    },
    {
      id: "tracking-order-shipping",
      label: "Tracking",
      path: "/seller/tracking-order-shipping",
      icon: LocateFixed,
    },
  ];

  const handleNavigation = (item) => {
    router.push(item.path);
  };

  // Toggle trạng thái thu gọn
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      // ✨ ĐIỀU CHỈNH ĐỘ RỘNG VÀ TRANSITION ✨
      className={`shadow-md flex flex-col border-r border-indigo-100 h-screen transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      } bg-indigo-50`}
    >
      <div
        className={`p-6 border-b border-indigo-200 bg-gradient-to-r from-indigo-100 to-blue-50 flex ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        {/* Tiêu đề */}
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-indigo-900 whitespace-nowrap">
            CNC - Seller
          </h1>
        )}

        {/* Nút Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className={`p-1 h-auto w-auto text-indigo-800 hover:bg-indigo-200 transition-colors ${
            isCollapsed ? "mx-auto" : ""
          }`}
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
          const IconComponent = item.icon; // Lấy Icon Component

          return (
            // ✨ POPOVER/TOOLTIP cho trạng thái thu gọn ✨
            <div key={item.id}>
              <Button
                variant={currentPage === item.id ? "default" : "ghost"}
                className={`w-full justify-start transition-colors px-3 py-2 ${
                  currentPage === item.id
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    : "text-indigo-900 hover:bg-indigo-100 hover:text-indigo-900"
                }`}
                onClick={() => handleNavigation(item)}
              >
                <IconComponent
                  className={`h-5 w-5 ${!isCollapsed ? "mr-3" : ""}`}
                />

                {/* Ẩn Label khi thu gọn */}
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Button>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
