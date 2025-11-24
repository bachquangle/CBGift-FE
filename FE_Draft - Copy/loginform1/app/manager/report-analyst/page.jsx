"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import RoleSidebar from "@/components/layout/shared/role-sidebar";
import ManagerSidebar from "@/components/layout/manager/sidebar";
import ManagerHeader from "@/components/layout/manager/header";
export default function ReportAnalystPage() {
  const [currentPage, setCurrentPage] = useState("report-analyst");
  const [revenueFilter, setRevenueFilter] = useState("monthly");
  const [trendingFilter, setTrendingFilter] = useState("monthly");
  const [loading, setLoading] = useState(true);

  // Mock revenue data
  const revenueData = {
    monthly: [
      { period: "Jan 2024", revenue: 45000 },
      { period: "Feb 2024", revenue: 52000 },
      { period: "Mar 2024", revenue: 48000 },
      { period: "Apr 2024", revenue: 61000 },
      { period: "May 2024", revenue: 55000 },
      { period: "Jun 2024", revenue: 67000 },
      { period: "Jul 2024", revenue: 71000 },
      { period: "Aug 2024", revenue: 69000 },
      { period: "Sep 2024", revenue: 78000 },
      { period: "Oct 2024", revenue: 82000 },
      { period: "Nov 2024", revenue: 85000 },
      { period: "Dec 2024", revenue: 92000 },
    ],
    quarterly: [
      { period: "Q1 2024", revenue: 145000 },
      { period: "Q2 2024", revenue: 183000 },
      { period: "Q3 2024", revenue: 218000 },
      { period: "Q4 2024", revenue: 259000 },
    ],
  };

  // Mock trending products data
  const trendingData = {
    monthly: [
      { product: "Logo Design", orders: 145 },
      { product: "Business Cards", orders: 132 },
      { product: "Website Design", orders: 98 },
      { product: "Brochure Design", orders: 87 },
      { product: "Social Media Kit", orders: 76 },
      { product: "Packaging Design", orders: 65 },
    ],
    quarterly: [
      { product: "Logo Design", orders: 420 },
      { product: "Business Cards", orders: 385 },
      { product: "Website Design", orders: 298 },
      { product: "Brochure Design", orders: 245 },
      { product: "Social Media Kit", orders: 198 },
      { product: "Packaging Design", orders: 167 },
    ],
  };

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <ManagerSidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar
        currentRole="manager"
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ManagerHeader />
        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Report and Analyst
              </h1>
              <p className="text-gray-600 mt-1">
                Business analytics and performance reports
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue Analytics</CardTitle>
                    <CardDescription>
                      Track revenue performance over time
                    </CardDescription>
                  </div>
                  <Select
                    value={revenueFilter}
                    onValueChange={setRevenueFilter}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    revenue: {
                      label: "Revenue",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData[revenueFilter]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={formatCurrency} />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value) => [
                          formatCurrency(value),
                          "Revenue",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-revenue)"
                        strokeWidth={3}
                        dot={{
                          fill: "var(--color-revenue)",
                          strokeWidth: 2,
                          r: 6,
                        }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Trending Products Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Trending Products</CardTitle>
                    <CardDescription>
                      Most popular products by order volume
                    </CardDescription>
                  </div>
                  <Select
                    value={trendingFilter}
                    onValueChange={setTrendingFilter}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    orders: {
                      label: "Orders",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={trendingData[trendingFilter]}
                      layout="horizontal"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="product" type="category" width={120} />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value) => [value, "Orders"]}
                      />
                      <Bar
                        dataKey="orders"
                        fill="var(--color-orders)"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        $805,000
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Orders
                      </p>
                      <p className="text-2xl font-bold text-blue-600">2,847</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Sellers
                      </p>
                      <p className="text-2xl font-bold text-purple-600">156</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Designers
                      </p>
                      <p className="text-2xl font-bold text-orange-600">89</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
