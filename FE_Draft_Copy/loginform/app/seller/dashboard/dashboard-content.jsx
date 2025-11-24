"use client";

import { useState, useEffect } from "react";
import apiClient from "../../../lib/apiClient";
import {
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Handshake,
  ListTodo,
  FileEdit,
  DollarSign,
} from "lucide-react";

export default function DashboardContent() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== Fetch dữ liệu orders từ BE =====
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${apiClient.defaults.baseURL}/api/seller`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // ✅ Sửa lỗi: Nhận response từ BE (hiện đã là cấu trúc phân trang {total, orders})
        const responseData = await res.json();

        // ✅ Lấy mảng orders từ object response
        const orderList = responseData.orders || responseData || [];

        console.log("📦 Orders fetched:", orderList);
        setOrders(orderList); // Gán mảng đơn hàng thực tế
      } catch (err) {
        console.error("❌ Fetch orders failed:", err);
        //alert("Không thể tải danh sách đơn hàng: " + err.message); // Giữ lại alert nếu cần
        setOrders([]); // Đảm bảo orders là mảng rỗng nếu lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // ===== Stats giống ManageOrder =====
  const stats = [
    {
      title: "Total Order",
      color: "bg-blue-50 border-blue-200",
      icon: Package,
      iconColor: "text-blue-500",
      statusFilter: null,
    },
    {
      title: "Draft (Nháp)",
      color: "bg-gray-50 border-gray-200",
      icon: FileEdit,
      iconColor: "text-gray-500",
      statusFilter: "Draft (Nháp)",
    },
    {
      title: "Cần Design",
      color: "bg-yellow-50 border-yellow-200",
      icon: Handshake,
      iconColor: "text-yellow-500",
      statusFilter: "Cần Design",
    },
    {
      title: "Đang làm Design",
      color: "bg-purple-50 border-purple-200",
      icon: Clock,
      iconColor: "text-purple-500",
      statusFilter: "Đang làm Design",
    },
    {
      title: "Cần Check Design",
      color: "bg-green-50 border-green-200",
      icon: ListTodo,
      iconColor: "text-green-500",
      statusFilter: "Cần Check Design",
    },
    {
      title: "Chốt Đơn (Khóa Seller)",
      color: "bg-orange-50 border-orange-200",
      icon: CheckCircle,
      iconColor: "text-orange-500",
      statusFilter: "Chốt Đơn (Khóa Seller)",
    },
    {
      title: "Thiết kế Lại (Design Lỗi)",
      color: "bg-red-50 border-red-200",
      icon: AlertTriangle,
      iconColor: "text-red-500",
      statusFilter: "Thiết kế Lại (Design Lỗi)",
    },
  ];

  // ✅ Sửa lỗi: Đảm bảo orders là một mảng trước khi gọi filter
  const safeOrders = Array.isArray(orders) ? orders : [];

  let statsWithCounts = stats.map((stat) => ({
    ...stat,
    value: stat.statusFilter
      ? safeOrders.filter(
          // ✅ Sử dụng safeOrders
          (o) => (o.status || o.statusOderName) === stat.statusFilter
        ).length
      : 0,
  }));

  const totalCount = statsWithCounts
    .filter((s) => s.statusFilter)
    .reduce((sum, s) => sum + s.value, 0);

  statsWithCounts[0].value = totalCount;

  // ===== Lấy Top 5 order mới nhất =====
  // ✅ Sửa lỗi: Đảm bảo orders là mảng trước khi dùng sort
  const recentOrders = [...safeOrders]
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
    .slice(0, 5);

  // ===== Tổng tiền toàn bộ đơn hàng =====
  const totalRevenue = safeOrders.reduce(
    (sum, o) => sum + (o.totalCost || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-blue-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-blue-800">
              Seller Dashboard
            </h2>
            <p className="text-sm sm:text-base text-blue-600 mt-1">
              Track your orders and performance
            </p>
          </div>
          {/* <div className="mt-3 sm:mt-0 flex items-center gap-2 text-sm text-blue-700">
            <DollarSign className="h-4 w-4" />
            <span>Total Revenue: ${totalRevenue.toFixed(2)}</span>
          </div> */}
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-6">Loading orders...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3">
          {statsWithCounts.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`p-3 sm:p-4 rounded-lg border-2 ${stat.color} hover:shadow-md transition-shadow`}
              >
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconColor}`} />
                  <div>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <h3 className="text-[10px] sm:text-xs font-medium text-gray-600 uppercase tracking-wide">
                      {stat.title}
                    </h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Total Revenue Summary */}
      {/* <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 rounded-lg text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-medium mb-2">
              Total Money Earned
            </h3>
            <p className="text-2xl sm:text-3xl font-bold">
              ${totalRevenue.toFixed(2)}
            </p>
            <p className="text-sm text-blue-100 mt-1">+12.5% from last month</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <DollarSign className="h-12 w-12 sm:h-16 sm:w-16 text-blue-200" />
          </div>
        </div>
      </div> */}

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          <p className="text-sm text-gray-600 mt-1">Top 5 latest orders</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Order Date
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Phone
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Address
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {recentOrders.map((order, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-600">
                    {order.orderDate
                      ? new Date(order.orderDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="py-3 px-4 text-gray-900">
                    {order.customerName || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {order.phone || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-gray-600 truncate max-w-xs">
                    {order.address || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {order.statusOderName || "Unknown"}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    ${order.totalCost?.toFixed(2) || "0.00"}
                  </td>
                </tr>
              ))}

              {recentOrders.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-4 text-gray-500 italic"
                  >
                    No recent orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
