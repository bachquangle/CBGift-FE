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
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DesignerSidebar({ currentPage, setCurrentPage }) {
  const router = useRouter();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      // icon: <Home className="h-4 w-4" />,
      path: "/designer/dashboard",
    },
    {
      id: "design-assign",
      label: "Design Assign by Seller",
      // icon: <Palette className="h-4 w-4" />,
      path: "/designer/design-assign",
    },
    {
      label: "Design History",
      path: "/designer/design-history",
      // icon: <History className="h-4 w-4" />,
      id: "design-history",
    },
  ];

  const handleNavigation = (item) => {
    setCurrentPage(item.id);
    router.push(item.path);
  };

  return (
    <div className="w-64 bg-indigo-50 shadow-md flex flex-col border-r border-indigo-100">
      <div className="p-6 border-b border-indigo-200 bg-gradient-to-r from-indigo-100 to-blue-50">
        <h1 className="text-xl font-bold text-indigo-900">CNC - Designer</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={currentPage === item.id ? "default" : "ghost"}
            className={`w-full justify-start gap-3 transition-colors ${
              currentPage === item.id
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                : "text-indigo-900 hover:bg-indigo-100 hover:text-indigo-900"
            }`}
            onClick={() => handleNavigation(item)}
          >
            {item.icon} {item.label}
          </Button>
        ))}
      </nav>
    </div>
  );
}
