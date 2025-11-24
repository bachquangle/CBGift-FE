"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function StaffSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", path: "/staff/dashboard" },
    { id: "ManageOrder", label: "ManageOrder", path: "/staff/manage-order" },
    {
      id: "needs-production",
      label: "Needs Production",
      path: "/staff/needs-production",
    },
    { id: "produced", label: "Produced", path: "/staff/produced" },
    {
      id: "manage-invoice",
      label: "Manage Invoice",
      path: "/staff/manage-invoice",
    },
    { id: "printer-bill", label: "Printer Bill", path: "/staff/printer-bill" },
  ];

  const handleNavigation = (path) => {
    router.push(path);
  };

  const isActive = (path) => pathname === path;

  return (
    <div className="w-64 bg-indigo-50 shadow-md flex flex-col border-r border-indigo-100">
      <div className="p-6 border-b border-indigo-200 bg-gradient-to-r from-indigo-100 to-blue-50">
        <h1 className="text-xl font-bold text-indigo-900">CNC - Staff</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={isActive(item.path) ? "default" : "ghost"}
            className={`w-full justify-start transition-colors ${
              isActive(item.path)
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                : "text-indigo-900 hover:bg-indigo-100 hover:text-indigo-900"
            }`}
            onClick={() => handleNavigation(item.path)}
          >
            {item.label}
          </Button>
        ))}
      </nav>
    </div>
  );
}
