"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ManagerSidebar({ currentPage, setCurrentPage }) {
  const router = useRouter();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", path: "/manager/dashboard" },
    {
      id: "manage-order",
      label: "Manage Order",
      path: "/manager/manage-order",
    },
    {
      id: "manage-account",
      label: "Manage Account",
      path: "/manager/manage-account",
    },
    {
      id: "manage-relationship",
      label: "Manage Relationship",
      path: "/manager/manage-relationship",
    },
    {
      id: "manage-topup",
      label: "Manage Top Up Money",
      path: "/manager/manage-topup",
    },
    {
      id: "manage-catalog",
      label: "Manage Product",
      path: "/manager/manage-catalog",
    },
    {
      id: "manage-category",
      label: "Manage Category",
      path: "/manager/manage-category",
    },
    {
      id: "report-analyst",
      label: "Report and Analyst",
      path: "/manager/report-analyst",
    },
    { id: "report", label: "Reports", path: "/manager/reports" },
    {
      id: "operations",
      label: "Operations & Production Report",
      path: "/manager/operations",
    },
  ];

  const handleNavigation = (item) => {
    setCurrentPage(item.id);
    router.push(item.path);
  };

  return (
    <div className="w-64 bg-indigo-50 shadow-md flex flex-col border-r border-indigo-100">
      <div className="p-6 border-b border-indigo-200 bg-gradient-to-r from-indigo-100 to-blue-50">
        <h1 className="text-xl font-bold text-indigo-900">CNC - Manager</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={currentPage === item.id ? "default" : "ghost"}
            className={`w-full justify-start transition-colors ${
              currentPage === item.id
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                : "text-indigo-900 hover:bg-indigo-100 hover:text-indigo-900"
            }`}
            onClick={() => handleNavigation(item)}
          >
            {item.label}
          </Button>
        ))}
      </nav>
    </div>
  );
}
