"use client";

import { useState } from "react";
import SellerSidebar from "@/components/layout/seller/sidebar";
import SellerHeader from "@/components/layout/seller/header";
import YearMonthDayView from "@/components/order-overview/year-month-day-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrderOverviewPage() {
  const [currentPage, setCurrentPage] = useState("order-overview");

  const generateMockOrders = () => {
    const orders = [];
    const statuses = [
      "Draft",
      "Assigned Designer",
      "Designing",
      "Check File Design",
      "Seller Approved Design",
      "Seller Reject Design",
    ];
    const customerNames = [
      "Emma Thompson",
      "James Wilson",
      "Lisa Chen",
      "Robert Davis",
      "Maria Garcia",
      "David Kim",
      "Alice Brown",
      "John Smith",
      "Sarah Johnson",
      "Michael Brown",
      "Jennifer Lee",
      "Christopher Martinez",
    ];
    const products = [
      { name: "Custom Acrylic Keychain", price: 87.5 },
      { name: "Acrylic Phone Stand", price: 75.0 },
      { name: "Acrylic Display Case", price: 125.0 },
      { name: "Custom Keychain", price: 125.0 },
      { name: "Custom Acrylic Art", price: 200.0 },
      { name: "Gaming Keychain Set", price: 200.0 },
      { name: "Custom Badge", price: 90.0 },
      { name: "Acrylic Coaster Set", price: 60.0 },
      { name: "Custom Plaque", price: 180.0 },
      { name: "Acrylic Name Tag", price: 100.0 },
    ];

    let orderId = 1;
    // Generate orders for 5 years (2020-2025)
    for (let year = 2020; year <= 2025; year++) {
      // Generate orders for all 12 months
      for (let month = 0; month < 12; month++) {
        // Generate 3-8 orders per month
        const ordersPerMonth = Math.floor(Math.random() * 6) + 3;
        for (let i = 0; i < ordersPerMonth; i++) {
          const day = Math.floor(Math.random() * 28) + 1;
          const date = new Date(year, month, day);
          const dateString = date.toISOString().split("T")[0];

          orders.push({
            id: orderId++,
            orderId: `ORD-S${String(orderId).padStart(3, "0")}`,
            orderDate: dateString,
            customerName:
              customerNames[Math.floor(Math.random() * customerNames.length)],
            phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(
              4,
              "0"
            )}`,
            email: `customer${orderId}@email.com`,
            products: [
              {
                ...products[Math.floor(Math.random() * products.length)],
                quantity: Math.floor(Math.random() * 100) + 5,
                size: "5x5cm",
                accessory: "Key Ring",
              },
            ],
            address: "123 Main Street, City, State 12345",
            shipTo: "Same as billing",
            status: statuses[Math.floor(Math.random() * statuses.length)],
            totalAmount: `$${(Math.random() * 400 + 50).toFixed(2)}`,
            timeCreated: "Recently",
          });
        }
      }
    }

    return orders;
  };

  const orders = generateMockOrders();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* <SellerSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      /> */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-blue-200 shadow-sm">
              <h1 className="text-2xl font-bold text-blue-900">
                Order Overview
              </h1>
              <p className="text-blue-600 mt-1">
                View your orders organized by year, month, and week
              </p>
            </div>

            {/* Year-Month-Week View */}
            <Card>
              <CardHeader>
                <CardTitle>Orders by Date</CardTitle>
              </CardHeader>
              <CardContent>
                <YearMonthDayView orders={orders} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
