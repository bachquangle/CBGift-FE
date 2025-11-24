"use client"

import { useState } from "react"
import ManagerSidebar from "@/components/layout/manager/sidebar"
import ManagerHeader from "@/components/layout/manager/header"
import ManagerReports from "@/components/manager-reports/ManagerReports"

export default function ReportsPage() {
  const [currentPage, setCurrentPage] = useState("report")

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ManagerHeader />

        {/* <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Business Intelligence & Analytics</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Monitor financial metrics, payment tracking, and operational efficiency
              </p>
            </div>
          </div>
        </header> */}

        <main className="flex-1 overflow-y-auto">
          <ManagerReports />
        </main>
      </div>
    </div>
  )
}
