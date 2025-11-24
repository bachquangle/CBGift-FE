"use client";

import { useState } from "react";
//import SellerHeader from "@/components/layout/seller/header";
//import SellerSidebar from "@/components/layout/seller/sidebar";
import DashboardContent from "./dashboard-content";

export default function SellerDashboard() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar chỉ của seller */}
      {/* <SellerSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      /> */}

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <DashboardContent />
        </main>
      </div>
    </div>
  );
}
