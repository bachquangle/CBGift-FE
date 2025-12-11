"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

export default function RevenueChart({ data }) {
  // Format VND currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date (short: dd/MM)
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", { // Changed to en-GB for standard dd/MM format
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle>Revenue vs. Cash Flow</CardTitle>
        <CardDescription>
          Comparison of invoiced value and actual payments over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate} 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />

              <YAxis 
                tickFormatter={(value) => formatCurrency(value)} 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={100}
              />

              <Tooltip
                formatter={(value) => [formatCurrency(value), ""]}
                labelFormatter={(label) => `Date: ${formatDate(label)}`}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "13px"
                }}
                itemStyle={{ padding: 0 }}
              />

              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
              />

              <Line
                type="monotone"
                dataKey="invoiced"
                stroke="#3b82f6"
                name="Invoiced Value"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />

              <Line
                type="monotone"
                dataKey="collected"
                stroke="#10b981"
                name="Actual Payments"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}