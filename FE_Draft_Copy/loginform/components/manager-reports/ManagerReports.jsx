"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import apiClient from "../../lib/apiClient";

// Import các component con
import FilterHeader from "./FilterHeader";
import KPICard from "./KPICard";
import RevenueChart from "./RevenueChart";
import FinancialIssuesChart from "./FinancialIssuesChart";
import ReprintReasonsChart from "./ReprintReasonsChart";
import TopSellersTable from "./TopSellersTable";

// Component Skeleton để hiển thị hiệu ứng đang tải
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`}></div>
);

export default function ManagerReports() {
  // --- 1. State quản lý dữ liệu riêng biệt ---
  const [kpis, setKpis] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [issuesData, setIssuesData] = useState(null);
  const [reasonsData, setReasonsData] = useState(null);
  const [topSellers, setTopSellers] = useState(null);

  // --- 2. State quản lý Loading riêng biệt ---
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [loadingReasons, setLoadingReasons] = useState(true);
  const [loadingSellers, setLoadingSellers] = useState(true);

  // --- 3. Filter State ---
  // Mặc định lấy 30 ngày gần nhất
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [selectedSeller, setSelectedSeller] = useState("all");

  // --- 4. Hàm Fetch Data Song Song ---
  useEffect(() => {
    const fetchAllData = () => {
      // Reset state về null để hiện Skeleton khi filter thay đổi
      setKpis(null); setRevenueData(null); setIssuesData(null); setReasonsData(null); setTopSellers(null);
      setLoadingKpi(true); setLoadingRevenue(true); setLoadingIssues(true); setLoadingReasons(true); setLoadingSellers(true);

      // Chuẩn bị Query Params
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        sellerId: selectedSeller,
      }).toString();

      const baseUrl = `${apiClient.defaults.baseURL}/api/reports/financial`;
      const fetchOptions = {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      };

      // --- Gọi API 1: KPIs (Thường nhanh nhất) ---
      fetch(`${baseUrl}/kpis?${params}`, fetchOptions)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => setKpis(data))
        .catch((err) => console.error("Err KPIs:", err))
        .finally(() => setLoadingKpi(false));

      // --- Gọi API 2: Revenue Chart ---
      fetch(`${baseUrl}/revenue-chart?${params}`, fetchOptions)
        .then((res) => res.ok ? res.json() : [])
        .then((data) => setRevenueData(data))
        .catch((err) => console.error("Err Revenue:", err))
        .finally(() => setLoadingRevenue(false));

      // --- Gọi API 3: Issues Chart ---
      fetch(`${baseUrl}/issues-chart?${params}`, fetchOptions)
        .then((res) => res.ok ? res.json() : [])
        .then((data) => setIssuesData(data))
        .catch((err) => console.error("Err Issues:", err))
        .finally(() => setLoadingIssues(false));

      // --- Gọi API 4: Reasons Chart ---
      fetch(`${baseUrl}/reasons-chart?${params}`, fetchOptions)
        .then((res) => res.ok ? res.json() : [])
        .then((data) => setReasonsData(data))
        .catch((err) => console.error("Err Reasons:", err))
        .finally(() => setLoadingReasons(false));

      // --- Gọi API 5: Top Sellers (Thường chậm nhất) ---
      fetch(`${baseUrl}/top-sellers?${params}`, fetchOptions)
        .then((res) => res.ok ? res.json() : [])
        .then((data) => setTopSellers(data))
        .catch((err) => console.error("Err Sellers:", err))
        .finally(() => setLoadingSellers(false));
    };

    fetchAllData();
  }, [dateRange, selectedSeller]);

  // Hàm refresh thủ công (gắn vào nút Refresh ở Header)
  const handleRefresh = () => {
    // Trigger lại useEffect bằng cách set lại state (hoặc tách hàm fetch ra ngoài)
    // Ở đây đơn giản nhất là spread lại object dateRange để trigger change
    setDateRange({ ...dateRange });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <FilterHeader
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedSeller={selectedSeller}
        setSelectedSeller={setSelectedSeller}
        onRefresh={handleRefresh}
      />

      {/* --- SECTION 1: KPIs --- */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loadingKpi || !kpis ? (
          // Skeleton Loading cho 4 cards
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 bg-white border border-gray-200" />)
        ) : (
          <>
            <KPICard
              title="Total Revenue"
              value={`$${kpis.totalRevenue.toLocaleString()}`}
              subtitle="Invoiced amount"
              icon={DollarSign}
              trend="Current Period"
              color="blue"
            />
            <KPICard
              title="Cash Collected"
              value={`$${kpis.cashCollected.toLocaleString()}`}
              subtitle={`Outstanding Debt: $${kpis.outstandingDebt.toLocaleString()}`}
              icon={TrendingUp}
              trend="Real Cash Flow"
              color="green"
            />
            <KPICard
              title="Total Refunds"
              value={`$${kpis.totalRefunds.toLocaleString()}`}
              subtitle="Financial loss"
              icon={TrendingDown}
              trend="Approved Refunds"
              color="red"
            />
            <KPICard
              title="Reprint Rate"
              value={`${kpis.reprintRate}%`}
              subtitle="Operational Efficiency"
              icon={AlertCircle}
              trend="Based on Orders"
              color="orange"
            />
          </>
        )}
      </div>

      {/* --- SECTION 2: Main Charts --- */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        {loadingRevenue ? (
          <Skeleton className="h-[350px] bg-white border border-gray-200" />
        ) : (
          <RevenueChart data={revenueData} />
        )}

        {/* Issues Chart */}
        {loadingIssues ? (
          <Skeleton className="h-[350px] bg-white border border-gray-200" />
        ) : (
          <FinancialIssuesChart data={issuesData} />
        )}
      </div>

      {/* --- SECTION 3: Detailed Analysis --- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Reasons Pie Chart */}
        {loadingReasons ? (
          <Skeleton className="h-[350px] bg-white border border-gray-200" />
        ) : (
          <ReprintReasonsChart data={reasonsData} />
        )}

        {/* Top Sellers Table */}
        {loadingSellers ? (
          <Skeleton className="h-[350px] bg-white border border-gray-200" />
        ) : (
          <TopSellersTable data={topSellers} />
        )}
      </div>
    </div>
  );
}