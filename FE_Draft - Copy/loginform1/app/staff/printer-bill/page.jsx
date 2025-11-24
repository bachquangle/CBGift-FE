"use client";

import { useState, useEffect } from "react";
import StaffSidebar from "@/components/layout/staff/sidebar";
import StaffHeader from "@/components/layout/staff/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InvoiceDetailsModal from "@/components/modals/InvoiceDetailsModal";
import apiClient from "../../../lib/apiClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  FileDown,
  Package,
  AlertTriangle,
  CheckCircle,
  CalendarIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Printer,
  Badge,
  Label,
  List,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function PrinterBillPage() {
  const [currentPage, setCurrentPage] = useState("printer-bill");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState("all");
  const [sellers, setSellers] = useState([]);
  
  // State cho phần Invoice
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState(null);
  const [showInvoices, setShowInvoices] = useState(false);
  
  const [isInvoiceDetailsOpen, setIsInvoiceDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPrinterBillDialogOpen, setIsPrinterBillDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [printerBillForm, setPrinterBillForm] = useState({
    startDate: "",
    endDate: "",
    notes: "",
  });
  const [pendingPrintAction, setPendingPrintAction] = useState(null);

  // 1. Fetch Sellers
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await fetch(
          `${apiClient.defaults.baseURL}/api/Order/GetUniqueSellers?status=SHIPPED`,
          {
            credentials: "include", 
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch sellers");
        }
        const sellerData = await response.json();
        setSellers(sellerData);
      } catch (e) {
        console.error("[v1] Failed to fetch sellers:", e);
        setSellers([]);
      }
    };
    fetchSellers();
  }, []);

  // 2. Fetch Orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        params.append("status", "SHIPPED");

        if (searchTerm) {
          params.append("searchTerm", searchTerm);
        }
        if (dateRange.from) {
          params.append("fromDate", dateRange.from.toISOString());
        }
        if (dateRange.to) {
          let toDateEnd = new Date(dateRange.to);
          toDateEnd.setDate(toDateEnd.getDate() + 1);
          params.append("toDate", toDateEnd.toISOString().split('T')[0]);
        }

        if (selectedSeller !== "all") {
          params.append("seller", selectedSeller);
        }

        if (sortColumn) {
          params.append("sortColumn", sortColumn);
          params.append("sortDirection", sortDirection);
        }

        params.append("page", page);
        params.append("pageSize", itemsPerPage);

        const response = await fetch(
          `${apiClient.defaults.baseURL}/api/Order/GetAllOrdersForInvoice?${params.toString()}`,
          {
            method: "GET",
            credentials: "include", // <--- DÒNG NÀY SẼ SỬA LỖI 401
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // BE trả về { orders: [...], total: ... }
        setOrders(data.orders || []);
        setTotalOrders(data.total || 0);

      } catch (e) {
        console.error("[v1] Failed to fetch orders:", e);
        setError("Could not load orders. Please try again later."); 
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, itemsPerPage, searchTerm, dateRange, sortColumn, sortDirection, selectedSeller]);

  const totalPages = Math.ceil(totalOrders / itemsPerPage); 
  const paginatedOrders = orders; 
  
  // Logic tính index để hiển thị text (nếu cần)
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (column) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1 inline" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1 inline" />
    );
  };

  const handleDateSelect = (range) => {
    setDateRange(range);
    setPage(1);
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    // [FIX] Phải dùng "SHIPPED" code thay vì "Đã Ship" để khớp với BE
    params.append("status", "SHIPPED"); 
    
    if (searchTerm) params.append("searchTerm", searchTerm);
    if (dateRange.from) params.append("fromDate", dateRange.from.toISOString());
    if (dateRange.to) {
      let toDateEnd = new Date(dateRange.to);
      toDateEnd.setDate(toDateEnd.getDate() + 1);
      params.append("toDate", toDateEnd.toISOString().split('T')[0]);
    }
    if (selectedSeller !== "all") {
      params.append("seller", selectedSeller);
    }
    if (sortColumn) {
      params.append("sortColumn", sortColumn);
      params.append("sortDirection", sortDirection);
    }
    
    params.append("page", "1");
    params.append("pageSize", totalOrders > 0 ? totalOrders : 10000);

    try {
      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/Order/GetAllOrdersForInvoice?${params.toString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch data for export");

      const data = await response.json();
      const allOrdersForExport = data.orders || [];

      const exportData = allOrdersForExport.map((order) => ({
        "Order ID": order.orderCode,
        "Customer Name": order.customerName,
        "Seller Name": order.sellerName,
        "Order Date": format(new Date(order.orderDate), "MMM dd, yyyy"),
        "Payment Status": order.paymentStatus,
        "Total Amount": order.totalCost,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData); 
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Printer Bills");
      
      saveAs(
        new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })]),
        `printer-bills-${format(new Date(), "yyyy-MM-dd")}.xlsx`
      );
    } catch (e) {
      console.error("Export failed", e);
      alert("Could not export data. Please try again.");
    }
  };

  const handleSelectOrder = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === paginatedOrders.length) {
      setSelectedOrders(new Set());
    } else {
      const allIds = new Set(paginatedOrders.map((order) => order.orderId));
      setSelectedOrders(allIds);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrderDetails(order);
    setIsDetailsOpen(true);
  };

  const handlePageSizeChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setPage(1);
  };

  const handlePrintBill = (order) => {
    if (order.paymentStatus === "Paid") {
      alert("⚠️ This order has already been paid. Cannot print bill for paid orders.");
      return;
    }
    setPendingPrintAction({ type: "single", order });
    setIsPrinterBillDialogOpen(true);
  };

  const handlePrintSelectedBills = () => {
    if (selectedOrders.size === 0) {
      alert("Please select at least one order to print");
      return;
    }

    const paidOrders = paginatedOrders.filter(
      (order) =>
        selectedOrders.has(order.orderId) && order.paymentStatus === "Paid"
    );
    if (paidOrders.length > 0) {
      alert(`⚠️ Cannot print bills for ${paidOrders.length} paid order(s). Only unpaid orders can be printed.`);
      return;
    }

    setPendingPrintAction({
      type: "multiple",
      orderIds: Array.from(selectedOrders),
    });
    setIsPrinterBillDialogOpen(true);
  };

  const [errorDialog, setErrorDialog] = useState({
    open: false,
    message: "",
  });

  const handlePrinterBillSubmit = async () => {
    try {
      const sellerId =
        pendingPrintAction.type === "single"
          ? pendingPrintAction.order.sellerId
          : orders.find((o) => o.orderId === pendingPrintAction.orderIds[0])?.sellerId;

      // Chuẩn bị payload khớp với CreateInvoiceRequest DTO
      const payload = {
        sellerId: sellerId,
        orderIds:
          pendingPrintAction.type === "single"
            ? [pendingPrintAction.order.orderId]
            : pendingPrintAction.orderIds,
        notes: printerBillForm.notes || "Generated from Printer Bill page",
        // startDate và endDate không bắt buộc nếu dùng orderIds (theo Logic BE Scenario 1)
      };

      const response = await fetch(`${apiClient.defaults.baseURL}/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let shortMessage = "Tạo hóa đơn thất bại.";
        if (
          errorText.includes("Order already had invoice") ||
          errorText.includes("đã được xuất hóa đơn")
        ) {
          shortMessage = "Đơn hàng này đã có hóa đơn rồi.";
        }

        setIsPrinterBillDialogOpen(false);
        setErrorDialog({
          open: true,
          message: shortMessage,
        });
        return;
      }

      // ✅ Thành công
      const data = await response.json();
      console.log("✅ Invoice created:", data);

      setIsPrinterBillDialogOpen(false);
      setIsSuccessDialogOpen(true);
    } catch (error) {
      console.error("❌ Error creating invoice:", error);
      setErrorDialog({
        open: true,
        message: "Lỗi hệ thống: " + error.message,
      });
    }
  };

  const handleSuccessDialogClose = () => {
    setIsSuccessDialogOpen(false);
    if (pendingPrintAction?.type === "multiple") {
      setSelectedOrders(new Set());
    }
    // Reload danh sách hóa đơn nếu đang mở
    if (showInvoices) {
      fetchInvoices();
    }
  };

  // 3. Fetch Invoices (ĐÃ SỬA LỖI ĐỌC API MỚI)
  const fetchInvoices = async () => {
    setInvoicesLoading(true);
    setInvoicesError(null);
    try {
      // [FIX] Thêm tham số page & pageSize vì BE mới trả về PaginatedResult
      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/invoices/all?page=1&pageSize=100`, 
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // [FIX] BE trả về object { items: [], total: ... } chứ không phải mảng trực tiếp
      if (data && data.items) {
        setInvoices(data.items);
      } else {
        setInvoices([]);
      }
      
    } catch (e) {
      console.error("Failed to fetch invoices:", e);
      setInvoicesError("Could not load invoice data.");
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleToggleInvoices = () => {
    const nextShowState = !showInvoices;
    setShowInvoices(nextShowState);
    if (nextShowState) {
      fetchInvoices(); // Luôn gọi lại để lấy dữ liệu mới nhất
    }
  };

  const handleViewInvoiceDetails = async (invoiceId) => {
    const basicInvoice = invoices.find((inv) => inv.invoiceId === invoiceId);
    setSelectedInvoice(basicInvoice);
    setIsInvoiceDetailsOpen(true);

    try {
      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/invoices/${invoiceId}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch details");
      const detailedInvoice = await response.json();
      setSelectedInvoice(detailedInvoice);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
    }
  };

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders,
      color: "bg-blue-50 border-blue-200",
      icon: Package,
      iconColor: "text-blue-500",
    },
    {
      title: "Shipped",
      value: totalOrders,
      color: "bg-emerald-50 border-emerald-200",
      icon: CheckCircle,
      iconColor: "text-emerald-500",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <StaffSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <StaffHeader />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-blue-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold text-blue-800">
                    Printer Bill Management
                  </h1>
                  <p className="text-sm sm:text-base text-blue-600 mt-1">
                    View and manage orders ready for printing
                  </p>
                </div>
                <div className="mt-3 sm:mt-0">
                  <Button onClick={handleToggleInvoices} variant="outline">
                    <List className="h-4 w-4 mr-2" />
                    {showInvoices ? "Hide Invoices" : "View All Invoices"}
                    {showInvoices ? (
                      <ChevronUp className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Bảng Hóa đơn */}
            {showInvoices && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <h2 className="p-4 text-lg font-semibold text-gray-800 border-b">
                  All Invoices
                </h2>
                {invoicesLoading ? (
                  <div className="p-12 text-center text-gray-500">
                    Loading invoices...
                  </div>
                ) : invoicesError ? (
                  <div className="p-12 text-center text-red-500">
                    {invoicesError}
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Date Created</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-4 text-gray-500">No invoices found</TableCell>
                        </TableRow>
                      ) : (
                        invoices.map((invoice) => (
                        <TableRow key={invoice.invoiceId}>
                          <TableCell className="font-medium">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-800">
                                {invoice.sellerName || "N/A"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {invoice.status ? (
                              <span
                                className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full
                                ${
                                  invoice.status.trim().toLowerCase() === "paid"
                                    ? "bg-green-100 text-green-800"
                                    : invoice.status.trim().toLowerCase() === "issued"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {invoice.status}
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                                Unknown
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={invoice.notes}>
                            {invoice.notes || "N/A"}
                          </TableCell>
                          <TableCell className="font-semibold">
                            ${invoice.totalAmount.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewInvoiceDetails(invoice.invoiceId)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )))}
                    </TableBody>
                  </Table>
                  </div>
                )}
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 ${stat.color} hover:shadow-lg transition-all`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <IconComponent className={`h-5 w-5 ${stat.iconColor}`} />
                      <div>
                        <p className="text-lg font-bold text-gray-900">
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

            {/* Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                  <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Orders
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Order ID, Customer..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value.replace(/\s+/g, ""));
                          setPage(1);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === " ") e.preventDefault();
                        }}
                        className="pl-10 bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter by Seller
                    </label>
                    <select
                      value={selectedSeller}
                      onChange={(e) => {
                        setSelectedSeller(e.target.value);
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Sellers</option>
                      {sellers.map((seller) => (
                        <option key={seller} value={seller}>
                          {seller}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter by Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-white"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "MMM dd, yyyy")} -{" "}
                                {format(dateRange.to, "MMM dd, yyyy")}
                              </>
                            ) : (
                              format(dateRange.from, "MMM dd, yyyy")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={handleDateSelect}
                          numberOfMonths={2}
                          initialFocus
                        />
                        {(dateRange.from || dateRange.to) && (
                          <div className="p-3 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full bg-transparent"
                              onClick={() =>
                                handleDateSelect({ from: null, to: null })
                              }
                            >
                              Clear Filter
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                  <Button variant="outline" onClick={handleExport}>
                    <FileDown className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Export file</span>
                    <span className="sm:hidden">Export</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Thanh Actions khi chọn nhiều Order */}
            {paginatedOrders.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      selectedOrders.size === paginatedOrders.length &&
                      paginatedOrders.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {selectedOrders.size > 0
                      ? `${selectedOrders.size} selected`
                      : "Select All"}
                  </span>
                </div>
                <Button
                  onClick={handlePrintSelectedBills}
                  disabled={selectedOrders.size === 0}
                  className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Bills ({selectedOrders.size})
                </Button>
              </div>
            )}

            {/* Bảng Orders */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading orders...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                    <p className="mt-4 text-red-600 font-medium">
                      Error loading orders
                    </p>
                    <p className="mt-2 text-gray-600 text-sm">{error}</p>
                    <Button
                      onClick={() => window.location.reload()}
                      className="mt-4"
                      variant="outline"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-12 font-medium text-gray-600 uppercase text-xs tracking-wide">
                            <Checkbox
                              checked={
                                selectedOrders.size ===
                                  paginatedOrders.length &&
                                paginatedOrders.length > 0
                              }
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                            Order ID
                          </TableHead>
                          <TableHead
                            className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("orderDate")}
                          >
                            Order Date {renderSortIcon("orderDate")}
                          </TableHead>
                          <TableHead
                            className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("customerName")}
                          >
                            Customer {renderSortIcon("customerName")}
                          </TableHead>
                          <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                            Seller Name
                          </TableHead>
                          <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                            Payment Status
                          </TableHead>
                          <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                            Status
                          </TableHead>
                          <TableHead
                            className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort("totalCost")}
                          >
                            Amount {renderSortIcon("totalCost")}
                          </TableHead>
                          <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOrders.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={10}
                              className="text-center py-8 text-gray-500"
                            >
                              No orders found
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedOrders.map((order) => (
                            <TableRow
                              key={order.orderId}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedOrders.has(order.orderId)}
                                  onCheckedChange={() =>
                                    handleSelectOrder(order.orderId)
                                  }
                                />
                              </TableCell>
                              <TableCell className="font-medium text-gray-900">
                                {order.orderCode}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {format(
                                  new Date(order.orderDate),
                                  "MMM dd, yyyy"
                                )}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {order.customerName}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {order.sellerName || "N/A"}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${
                                    order.paymentStatus === "Paid"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {order.paymentStatus || "N/A"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                  <span className="w-2 h-2 me-1 bg-emerald-500 rounded-full"></span>
                                  Shipped
                                </span>
                              </TableCell>
                              <TableCell className="text-gray-900 font-medium">
                                ${order.totalCost}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDetails(order)}
                                    className="bg-transparent hover:bg-gray-50"
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {order.paymentStatus !== "Paid" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePrintBill(order)}
                                      className="bg-transparent hover:bg-blue-50 text-blue-600"
                                      title="Print Bill"
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages >= 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-gray-200">
                      
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                          Page {page} of {totalPages} ({totalOrders} total orders)
                        </div>
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor="itemsPerPage"
                            className="text-sm font-medium text-gray-600"
                          >
                            Page Size:
                          </label>
                          <select
                            id="itemsPerPage"
                            value={itemsPerPage}
                            onChange={handlePageSizeChange}
                            className="px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
        <InvoiceDetailsModal
          isOpen={isInvoiceDetailsOpen}
          onClose={() => setIsInvoiceDetailsOpen(false)}
          invoice={selectedInvoice}
        />
      </div>

      <Dialog
        open={isPrinterBillDialogOpen}
        onOpenChange={setIsPrinterBillDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Print Bill Information
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={printerBillForm.notes}
                onChange={(e) =>
                  setPrinterBillForm({
                    ...printerBillForm,
                    notes: e.target.value,
                  })
                }
                placeholder="Add any additional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPrinterBillDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePrinterBillSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSuccessDialogOpen}
        onOpenChange={handleSuccessDialogClose}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Success
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-700 font-medium">
              {pendingPrintAction?.type === "single"
                ? `Bill for order ${pendingPrintAction?.order?.orderCode} has been printed successfully!`
                : `Bills for ${pendingPrintAction?.orderIds?.length} selected order(s) have been printed successfully!`}
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSuccessDialogClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details - {selectedOrderDetails?.orderId}
            </DialogTitle>
          </DialogHeader>
          {selectedOrderDetails && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 font-medium">
                      Name
                    </label>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedOrderDetails.customerName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 font-medium">
                      Phone
                    </label>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedOrderDetails.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 font-medium">
                      Email
                    </label>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedOrderDetails.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 font-medium">
                      Address
                    </label>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedOrderDetails.address || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 font-medium">
                      Zipcode
                    </label>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedOrderDetails.zipcode || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 font-medium">
                      City
                    </label>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedOrderDetails.shipCity || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 font-medium">
                      State
                    </label>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedOrderDetails.shipState || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 font-medium">
                      Country
                    </label>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedOrderDetails.shipCountry || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                  Order Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 font-medium">
                      Order ID
                    </label>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedOrderDetails.orderId}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 font-medium">
                      Order Code
                    </label>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedOrderDetails.orderCode}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 font-medium">
                      Order Date
                    </label>
                    <p className="font-medium text-gray-900 mt-1">
                      {format(
                        new Date(selectedOrderDetails.orderDate),
                        "MMM dd, yyyy"
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 font-medium">
                      Seller Name
                    </label>
                    <p className="font-medium text-gray-900 mt-1">
                      {selectedOrderDetails.sellerName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 font-medium">
                      Payment Status
                    </label>
                    <p className="font-medium text-green-600 mt-1">
                      {selectedOrderDetails.paymentStatus || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 font-medium">
                      Total Amount
                    </label>
                    <p className="font-bold text-blue-600 text-lg mt-1">
                      ${selectedOrderDetails.totalCost}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              {selectedOrderDetails.details &&
                selectedOrderDetails.details.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-gray-900">
                      Product Details
                    </h3>
                    <div className="space-y-4">
                      {selectedOrderDetails.details.map((product, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-4 bg-white"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                              <label className="text-sm text-gray-500 font-medium">
                                Product Name
                              </label>
                              <p className="font-medium text-gray-900 mt-1">
                                {product.productName}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500 font-medium">
                                Size/Variant
                              </label>
                              <p className="font-medium text-gray-900 mt-1">
                                {product.size || "N/A"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500 font-medium">
                                Quantity
                              </label>
                              <p className="font-medium text-gray-900 mt-1">
                                {product.quantity}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500 font-medium">
                                Unit Price
                              </label>
                              <p className="font-medium text-gray-900 mt-1">
                                ${product.price?.toFixed(2) || "0.00"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500 font-medium">
                                Total Price
                              </label>
                              <p className="font-bold text-blue-600 mt-1">
                                $
                                {(
                                  (product.price || 0) * (product.quantity || 1)
                                ).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-500 font-medium">
                                Accessory
                              </label>
                              <p className="font-medium text-gray-900 mt-1">
                                {product.accessory || "None"}
                              </p>
                            </div>
                          </div>

                          {/* Product Note */}
                          {product.note && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <label className="text-sm text-yellow-700 font-medium">
                                Note
                              </label>
                              <p className="text-yellow-800 mt-1 text-sm">
                                {product.note}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            {selectedOrderDetails?.paymentStatus !== "Paid" && (
              <Button
                onClick={() => {
                  handlePrintBill(selectedOrderDetails);
                  setIsDetailsOpen(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Bill
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={errorDialog.open}
        onOpenChange={(v) => setErrorDialog({ ...errorDialog, open: v })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Error
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-gray-700">{errorDialog.message}</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setErrorDialog({ open: false, message: "" })}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}