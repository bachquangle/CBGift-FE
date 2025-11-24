"use client";

import { useState } from "react";
import StaffSidebar from "@/components/layout/staff/sidebar";
import StaffHeader from "@/components/layout/staff/header";

const NeedsProductionIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" />
    <line x1="8" y1="16" x2="8" y2="22" />
    <line x1="16" y1="16" x2="16" y2="22" />
    <line x1="12" y1="12" x2="12" y2="22" />
  </svg>
);

const ProducedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 11 12 14 22 4"></polyline>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
  </svg>
);

const PrinterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 6 2 18 2 18 9"></polyline>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
    <rect x="6" y="14" width="12" height="8"></rect>
  </svg>
);

export default function StaffDashboard() {
  const [selectedStat, setSelectedStat] = useState(null);

  const statsWithCounts = [
    {
      title: "Needs Production",
      icon: NeedsProductionIcon,
      color: "bg-red-50 border-red-200",
      iconColor: "text-red-500",
      path: "/staff/needs-production",
    },
    {
      title: "Produced",
      icon: ProducedIcon,
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-500",
      path: "/staff/produced",
    },
    {
      title: "Printer Bill",
      icon: PrinterIcon,
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-500",
      path: "/staff/printer-bill",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <StaffSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <StaffHeader />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-blue-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-blue-800">
                      Welcome back, Staff!
                    </h1>
                    <p className="text-sm sm:text-base text-blue-600 mt-1">
                      Manage production orders and printer bills.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {statsWithCounts.map((stat, index) => {
                const IconComponent = stat.icon;
                const isActive = selectedStat === stat.title;
                return (
                  <a
                    key={index}
                    href={stat.path}
                    className={`p-6 rounded-lg border-2 ${
                      stat.color
                    } hover:shadow-lg transition-all cursor-pointer ${
                      isActive ? "ring-2 ring-blue-400 shadow-lg scale-105" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <IconComponent className={`h-8 w-8 ${stat.iconColor}`} />
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                          {stat.title}
                        </h3>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
