"use client"

import { useState } from "react"
import ManagerSidebar from "@/components/layout/manager/sidebar"
import ManagerHeader from "@/components/layout/manager/header"
import OperationsReport from "@/components/operations-reports/OperationsReport"

export default function OperationsPage() {
  const [currentPage, setCurrentPage] = useState("operations")

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ManagerHeader />

        <main className="flex-1 overflow-y-auto">
          <OperationsReport />
        </main>
      </div>
    </div>
  )
}
