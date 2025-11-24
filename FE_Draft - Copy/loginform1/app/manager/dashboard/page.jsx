"use client";

import { useState } from "react";
import RoleSidebar from "@/components/layout/shared/role-sidebar";
import ManagerSidebar from "@/components/layout/manager/sidebar";
import ManagerHeader from "@/components/layout/manager/header";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Package, CheckCircle, Clock, TrendingUp } from "lucide-react";

export default function ManagerDashboard() {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const dashboardStats = {
    totalOrders: 156,
    ordersInProduction: 23,
    ordersQACompleted: 89,
    totalRevenue: 45250,
    recentOrders: [
      {
        id: "ORD-001",
        customerName: "John Doe",
        products: [{ name: "Acrylic Keychain", quantity: 50, price: 125.0 }],
        status: "In Production",
        orderDate: "2024-01-15",
        totalAmount: "$125.00",
      },
      {
        id: "ORD-002",
        customerName: "Jane Smith",
        products: [{ name: "Acrylic Stand", quantity: 25, price: 89.5 }],
        status: "QA Completed",
        orderDate: "2024-01-16",
        totalAmount: "$89.50",
      },
      {
        id: "ORD-003",
        customerName: "Mike Johnson",
        products: [
          { name: "Acrylic Charm", quantity: 50, price: 100.0 },
          { name: "Custom Keychain", quantity: 30, price: 75.0 },
          { name: "Phone Stand", quantity: 20, price: 25.0 },
        ],
        status: "Design Phase",
        orderDate: "2024-01-17",
        totalAmount: "$200.00",
      },
      {
        id: "ORD-004",
        customerName: "Sarah Wilson",
        products: [
          { name: "Custom Keychain Set", quantity: 100, price: 250.0 },
          { name: "Acrylic Display", quantity: 25, price: 100.0 },
        ],
        status: "In Production",
        orderDate: "2024-01-18",
        totalAmount: "$350.00",
      },
      {
        id: "ORD-005",
        customerName: "David Brown",
        products: [{ name: "Acrylic Display", quantity: 35, price: 175.25 }],
        status: "QA Completed",
        orderDate: "2024-01-19",
        totalAmount: "$175.25",
      },
    ],
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "In Production":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
            In Production
          </Badge>
        );
      case "QA Completed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            QA Completed
          </Badge>
        );
      case "Design Phase":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
            Design Phase
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ManagerHeader />
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Manager Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Overview of all orders and production status
              </p>
            </div>
            <div className="mt-3 sm:mt-0">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg px-4 py-2">
                <p className="text-sm font-medium text-blue-800">
                  Welcome back, Manager!
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Total Orders
                    </h3>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {dashboardStats.totalOrders}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border-l-4 border-yellow-500 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                      In Production
                    </h3>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {dashboardStats.ordersInProduction}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border-l-4 border-green-500 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                      QA Completed
                    </h3>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {dashboardStats.ordersQACompleted}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border-l-4 border-purple-500 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                  <div className="ml-3 sm:ml-4">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Total Revenue
                    </h3>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      ${dashboardStats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Recent Orders
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Latest orders in the system
                    </p>
                  </div>
                  <div className="mt-3 sm:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent"
                    >
                      View All Orders
                    </Button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide">
                        Order ID
                      </TableHead>
                      <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide">
                        Customer
                      </TableHead>
                      <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide">
                        Products
                      </TableHead>
                      <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide">
                        Status
                      </TableHead>
                      <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide">
                        Order Date
                      </TableHead>
                      <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide">
                        Amount
                      </TableHead>
                      <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardStats.recentOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="font-medium text-gray-900">
                          {order.id}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {order.customerName}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          <div className="space-y-1">
                            {order.products
                              .slice(0, 2)
                              .map((product, index) => (
                                <div key={index} className="text-sm">
                                  {product.name} (x{product.quantity})
                                </div>
                              ))}
                            {order.products.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{order.products.length - 2} more items
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-gray-600">
                          {order.orderDate}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {order.totalAmount}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent hover:bg-gray-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
