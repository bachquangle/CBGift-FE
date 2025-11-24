"use client";

import { useState, useEffect } from "react";
import apiClient from "../../lib/apiClient";

// Import components con
import OperationsFilters from "./OperationsFilters";
import KPICards from "./KPICards";
import OrderStatusChart from "./OrderStatusChart";
import IncomingOutgoingChart from "./IncomingOutgoingChart";
import IssueBreakdownChart from "./IssueBreakdownChart";
import CriticalAlertsTable from "./CriticalAlertsTable";

// Component Skeleton (Khung loading mờ)
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}></div>
);

export default function OperationsReport() {
  // 1. State riêng biệt cho từng phần dữ liệu
  const [kpis, setKpis] = useState(null);
  const [statusDist, setStatusDist] = useState(null);
  const [inOutData, setInOutData] = useState(null);
  const [issuesData, setIssuesData] = useState(null);
  const [criticals, setCriticals] = useState(null);

  // 2. Filter State
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSeller, setSelectedSeller] = useState("all");

  // 3. Fetch Data Song Song
  useEffect(() => {
    const fetchAll = () => {
      // Reset state để hiện loading
      setKpis(null); setStatusDist(null); setInOutData(null); setIssuesData(null); setCriticals(null);

      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        sellerId: selectedSeller === "all" || selectedSeller === "All Sellers" ? "" : selectedSeller,
      }).toString();

      const baseUrl = `${apiClient.defaults.baseURL}/api/reports/operations`;
      const opts = { credentials: "include" };

      // --- API 1: KPIs ---
      fetch(`${baseUrl}/kpis?${params}`, opts)
        .then(res => res.ok ? res.json() : null)
        .then(data => setKpis(data))
        .catch(e => console.error("KPI Error:", e));

      // --- API 2: Status Chart ---
      fetch(`${baseUrl}/status-chart?${params}`, opts)
        .then(res => res.ok ? res.json() : [])
        .then(data => setStatusDist(data))
        .catch(e => console.error("Status Error:", e));

      // --- API 3: Incoming/Outgoing ---
      fetch(`${baseUrl}/incoming-outgoing?${params}`, opts)
        .then(res => res.ok ? res.json() : [])
        .then(data => setInOutData(data))
        .catch(e => console.error("In/Out Error:", e));

      // --- API 4: Issues Breakdown ---
      fetch(`${baseUrl}/issues-breakdown?${params}`, opts)
        .then(res => res.ok ? res.json() : [])
        .then(data => setIssuesData(data))
        .catch(e => console.error("Issues Error:", e));

      // --- API 5: Critical Alerts ---
      fetch(`${baseUrl}/critical-alerts?${params}`, opts)
        .then(res => res.ok ? res.json() : [])
        .then(data => setCriticals(data))
        .catch(e => console.error("Criticals Error:", e));
    };

    fetchAll();
  }, [dateRange, selectedStatus, selectedSeller]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <OperationsFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedSeller={selectedSeller}
        setSelectedSeller={setSelectedSeller}
        onRefresh={() => setDateRange({ ...dateRange })} // Refresh ảo để trigger useEffect
      />

      {/* --- SECTION 1: KPIs --- */}
      <div className="mb-8">
        {!kpis ? (
           // Skeleton cho 4 thẻ KPI
           <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
             {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 bg-white border border-gray-200" />)}
           </div>
        ) : (
           <KPICards kpis={kpis} />
        )}
      </div>

      {/* --- SECTION 2: Charts --- */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {!statusDist ? <Skeleton className="h-[350px] bg-white" /> : <OrderStatusChart data={statusDist} />}
        {!inOutData ? <Skeleton className="h-[350px] bg-white" /> : <IncomingOutgoingChart data={inOutData} />}
      </div>

      {/* --- SECTION 3: Issues & Alerts --- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {!issuesData ? <Skeleton className="h-[350px] bg-white" /> : <IssueBreakdownChart data={issuesData} />}
        {!criticals ? <Skeleton className="h-[350px] bg-white" /> : <CriticalAlertsTable data={criticals} />}
      </div>
    </div>
  );
}