"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SellerSidebar({ currentPage }) {
  const router = useRouter();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", path: "/seller/dashboard" },
    { id: "manage-order", label: "Manage Order", path: "/seller/manage-order" },
    // {
    //   id: "order-overview",
    //   label: "Order Overview",
    //   path: "/seller/order-overview",
    // },
    {
      id: "product-catalog",
      label: "Product Catalog",
      path: "/seller/product-catalog",
    },
    {
      id: "manage-invoice",
      label: "Manage Invoice",
      path: "/seller/manage-invoice",
    },
    { id: "receive-bill", label: "Receive Bill", path: "/seller/receive-bill" },
  ];

  const handleNavigation = (item) => {
    router.push(item.path);
  };

  return (
    <div className="w-64 bg-indigo-50 shadow-md flex flex-col border-r border-indigo-100">
      <div className="p-6 border-b border-indigo-200 bg-gradient-to-r from-indigo-100 to-blue-50">
        <h1 className="text-xl font-bold text-indigo-900">CNC - Seller</h1>
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
