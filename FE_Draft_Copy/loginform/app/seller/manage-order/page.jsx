"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import React from "react";
import { RotateCcw, XCircle, MoreVertical, CheckCircle2 } from "lucide-react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import apiClient from "../../../lib/apiClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import MakeManualModal from "@/components/modals/make-manual-modal";
import {
  Search,
  Upload,
  FileText,
  Package,
  Eye,
  Download,
  QrCode,
  Save,
  Clock,
  CheckCircle,
  AlertTriangle,
  Handshake,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Trash2,
  FileEdit,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";

import ImportOrdersModal from "@/components/modals/import-orders-modal";

const STATS_CONFIG = [
  {
    title: "Total Order",
    color: "bg-blue-50 border-blue-200",
    icon: Package,
    iconColor: "text-blue-500",
    statusFilter: null,
  },
  {
    title: "Draft",
    color: "bg-gray-50 border-gray-200",
    icon: FileEdit,
    iconColor: "text-gray-500",
    statusFilter: "Draft (Nháp)",
  },
  {
    title: "Need Design",
    color: "bg-yellow-50 border-yellow-200",
    icon: Handshake,
    iconColor: "text-yellow-500",
    statusFilter: "Cần Design",
  },
  {
    title: "Designing",
    color: "bg-purple-50 border-purple-200",
    icon: Clock,
    iconColor: "text-purple-500",
    statusFilter: "Đang làm Design",
  },
  {
    title: "Need Check Design",
    color: "bg-green-50 border-green-200",
    icon: ListTodo,
    iconColor: "text-green-500",
    statusFilter: "Cần Check Design",
  },
  {
    title: "Close Order (Lock Seller)",
    color: "bg-orange-50 border-orange-200",
    icon: CheckCircle,
    iconColor: "text-orange-500",
    statusFilter: "Chốt Đơn (Khóa Seller)",
  },
  {
    title: "Redesign (Design Error)",
    color: "bg-red-50 border-red-200",
    icon: AlertTriangle,
    iconColor: "text-red-500",
    statusFilter: "Thiết kế Lại (Design Lỗi)",
  },
  {
    title: "Production Ready",
    color: "bg-cyan-50 border-cyan-200",
    icon: Package,
    iconColor: "text-cyan-500",
    statusFilter: "Sẵn sàng Sản xuất",
  },
  {
    title: "Production Done",
    color: "bg-teal-50 border-teal-200",
    icon: CheckCircle,
    iconColor: "text-teal-500",
    statusFilter: "Sản xuất Xong",
  },
  {
    title: "Manufacturing Defect (Requires Rework)",
    color: "bg-red-50 border-red-200",
    icon: AlertTriangle,
    iconColor: "text-red-600",
    statusFilter: "Sản xuất Lại",
  },
  {
    title: "Quality Checked",
    color: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle,
    iconColor: "text-emerald-500",
    statusFilter: "Đã Kiểm tra Chất lượng",
  },
  {
    title: "Shipped",
    color: "bg-blue-50 border-blue-200",
    icon: Package,
    iconColor: "text-blue-600",
    statusFilter: "Đã Ship",
  },
  {
    title: "Cancel",
    color: "bg-gray-50 border-gray-300",
    icon: AlertTriangle,
    iconColor: "text-gray-600",
    statusFilter: "Cancel",
  },
  {
    title: "Return the product",
    color: "bg-amber-50 border-amber-200",
    icon: Package,
    iconColor: "text-amber-600",
    statusFilter: "Hoàn Hàng",
  },
];

const getInitialDateRange = () => {
  return { from: undefined, to: undefined };
};

// Hàm tiện ích để chuyển đổi chuỗi "yyyy-mm-dd" sang Date object (ở UTC)
const convertStringToDate = (dateString) => {
  if (!dateString) return undefined;
  // Dùng Date.UTC để đảm bảo ngày tháng được parse là UTC 00:00:00
  const [year, month, day] = dateString.split("-").map(Number);
  // Month trong JS Date là 0-indexed.
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
};

export default function ManageOrder() {
  const [currentPage, setCurrentPage] = useState("manage-order");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStat, setSelectedStat] = useState("Total Order");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showMakeManualModal, setShowMakeManualModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedOrder, setEditedOrder] = useState(null);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  const [sortColumn, setSortColumn] = useState("orderDate");
  const [sortDirection, setSortDirection] = useState("desc");

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showCannotAssignDialog, setShowCannotAssignDialog] = useState(false);
  const [cannotAssignMessage, setCannotAssignMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isAssignPopupOpen, setIsAssignPopupOpen] = useState(false);
  const [designers, setDesigners] = useState([]);
  const [selectedDesignerId, setSelectedDesignerId] = useState("");
  const [selectedStatusCode, setSelectedStatusCode] = useState(null);

  const [showDesignCheckDialog, setShowDesignCheckDialog] = useState(false);
  const [designCheckAction, setDesignCheckAction] = useState(null);
  const [designCheckOrderId, setDesignCheckOrderId] = useState(null);
  const [isSubmittingDetail, setIsSubmittingDetail] = useState(null);

  const [dateRange, setDateRange] = useState(getInitialDateRange());

  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);

  const [orderStats, setOrderStats] = useState({
    total: 0,
    needActionCount: 0,
    urgentCount: 0,
    completedCount: 0,
    stageGroups: {},
  });

  const getProductionStatusName = (status) => {
    switch (Number(status)) {
      case 0:
        return "Draft";
      case 1:
        return "Created";
      case 2:
        return "Need Design";
      case 3:
        return "Designing";
      case 4:
        return "Check Design";
      case 5:
        return "Design Redo";
      case 6:
        return "Ready for Production";
      case 7:
        return "In Production";
      case 8:
        return "Finished";
      case 9:
        return "Quality Checked";
      case 10:
        return "Quality Failed";
      case 11:
        return "Production Rework";
      case 12:
        return "Packing";
      case 13:
        return "On Hold";
      case 14:
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  const canApproveOrReject = (order, item) => {
    const orderStatus = Number(order.statusOrder);
    const itemProductionStatus = Number(item.productionStatus);
    return orderStatus === 5 && itemProductionStatus === 4;
  };
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedStatConfig, setSelectedStatConfig] = useState(null);
  const toggleDateFilter = () => setIsDateFilterOpen(!isDateFilterOpen);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("File", file);
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/images/upload-media`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Upload failed: ${res.status} - ${errText}`);
      }

      const data = await res.json();
      console.log("Upload success:", data);
      return data.secureUrl || data.url || data.path || null;
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage("Upload failed: " + err.message);
      setShowErrorDialog(true);
      return null;
    }
  };

  const hasDesignFile = (order) => {
    if (!order.products || order.products.length === 0) return false;
    return order.products.some(
      (p) => p.linkFileDesign && p.linkFileDesign.trim() !== null
    );
  };

  const openRefundPopup = async (order) => {
    let proofUrl = null;

    const { value: reason } = await Swal.fire({
      title: `Refund order #${order.orderId}`,
      html: `
      <textarea id="refundReason" class="swal2-textarea" placeholder="Nhập lý do hoàn tiền (tối thiểu 5 ký tự)"></textarea>
      <input type="file" id="refundMediaInput" accept="image/*,video/*" style="margin-top: 10px;" />
      <div id="uploadStatus" style="margin-top:10px; display:none;">
        <div class="swal2-loader" style="display:inline-block;"></div>
        <span>Loading file...</span>
      </div>
      <img id="refundImagePreview" style="display:none; margin-top: 10px; max-width:100%; max-height:150px; border-radius: 5px;" />
      <video id="refundVideoPreview" controls style="display:none; margin-top: 10px; max-width:100%; max-height:150px; border-radius: 5px;"></video>
    `,
      showCancelButton: true,
      confirmButtonText: "Submit request",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d97706",
      cancelButtonColor: "#6b7280",

      didOpen: () => {
        const fileInput = document.getElementById("refundMediaInput");
        const imgPreview = document.getElementById("refundImagePreview");
        const videoPreview = document.getElementById("refundVideoPreview");
        const uploadStatus = document.getElementById("uploadStatus");

        fileInput.addEventListener("change", async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          uploadStatus.style.display = "block";
          imgPreview.style.display = "none";
          videoPreview.style.display = "none";

          const uploadedUrl = await uploadImage(file);

          uploadStatus.style.display = "none";

          if (uploadedUrl) {
            proofUrl = uploadedUrl;

            if (file.type.startsWith("video/")) {
              videoPreview.src = proofUrl;
              videoPreview.style.display = "block";
            } else if (file.type.startsWith("image/")) {
              imgPreview.src = proofUrl;
              imgPreview.style.display = "block";
            }
          } else {
            Swal.fire({
              icon: "error",
              title: "Upload thất bại",
              text: "Không thể upload file. Vui lòng thử lại.",
            });
          }
        });
      },

      preConfirm: () => {
        const reasonValue = document.getElementById("refundReason").value;
        if (!reasonValue || reasonValue.trim().length < 5) {
          Swal.showValidationMessage("Lý do hoàn tiền phải ít nhất 5 ký tự!");
          return false;
        }
        return reasonValue;
      },
    });

    if (!reason) return;
    try {
      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/order/${order.id}/request-refund`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason, proofUrl }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Không thể gửi yêu cầu hoàn tiền.");
      }
      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Yêu cầu hoàn tiền đã được gửi!",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: err.message,
      });
    }
  };

  const openCancelPopup = async (order) => {
    const { value: reason } = await Swal.fire({
      title: `Cancel order #${order.orderId}`,
      input: "text",
      inputLabel: "Enter reason for cancellation",
      inputPlaceholder:
        "For example: Customer changed his mind, wrong information...",
      inputAttributes: {
        maxlength: 200,
        autocapitalize: "off",
        autocorrect: "off",
      },
      showCancelButton: true,
      confirmButtonText: "Submit request",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      preConfirm: (value) => {
        if (!value || value.trim().length < 5) {
          Swal.showValidationMessage("Reason must be at least 5 characters!");
          return false;
        }
        return value;
      },
    });

    if (!reason) return;

    try {
      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/Order/${order.id}/request-cancellation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return Swal.fire({
          icon: "error",
          title: "Oops...",
          text: error.message || "Có lỗi xảy ra khi gửi yêu cầu!",
        });
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Cancellation request has been sent.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Lỗi kết nối!",
        text: "Không thể kết nối tới server.",
      });
    }
  };

  // ✅ SỬ DỤNG useCallback CHO fetchOrders
  const fetchOrders = useCallback(
    async (statusOverride = undefined) => {
      try {
        setLoading(true);
        setError(null);

        let statusValue = null;

        if (statusOverride !== undefined) {
          statusValue = statusOverride;
        } else if (selectedStatusCode) {
          statusValue = selectedStatusCode;
        } else {
          const selectedStatConfigInList = STATS_CONFIG.find(
            (stat) => stat.title === selectedStat
          );
          const statusFilterFromConfig = selectedStatConfigInList?.statusFilter;
          if (selectedStat !== "Total Order" && statusFilterFromConfig) {
            statusValue = statusFilterFromConfig;
          }
        }

        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: itemsPerPage.toString(),
          searchTerm: searchTerm || "",
          sortColumn: sortColumn || "orderDate",
          sortDirection: sortDirection,
        });

        if (statusValue) {
          params.append("status", statusValue);
        }

        // ✅ LOGIC LỌC NGÀY ĐƯỢC SỬA ĐỂ DÙNG dateRange (Date Objects)
        if (dateRange?.from instanceof Date) {
          // Gửi ngày bắt đầu (00:00:00 UTC của ngày đó)
          params.append("fromDate", dateRange.from.toISOString());
        }

        if (dateRange?.to instanceof Date) {
          // Lấy ngày kết thúc và tăng thêm 1 ngày UTC để bao phủ trọn vẹn ngày cuối
          const nextDay = new Date(dateRange.to.valueOf());
          nextDay.setUTCDate(nextDay.getUTCDate() + 1); // Sử dụng setUTCDate để cộng thêm ngày, giữ nguyên múi giờ UTC
          params.append("toDate", nextDay.toISOString());
        }

        const url = `${
          apiClient.defaults.baseURL
        }/api/Seller?${params.toString()}`;

        const response = await fetch(url, { credentials: "include" });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { total, orders: data } = await response.json();
        setTotalOrdersCount(total);

        const mappedOrders = data.map((order) => ({
          id: order.orderId,
          orderId: order.orderCode,
          statusOrder: order.statusOrder,
          // orderDate: new Date(order.orderDate).toISOString().split("T")[0],
          orderDate: new Date(order.orderDate).toLocaleDateString("en-CA"),
          customerName: order.customerName,
          phone: order.phone || "",
          email: order.email || "",
          paymentStatus: order.paymentStatus || "",
          products: order.details.map((detail) => ({
            name: detail.productName || `Product ${detail.productVariantID}`,
            quantity: detail.quantity,
            price: detail.price,
            size: detail.size || "",
            accessory: detail.accessory || "",
            activeTTS: order.activeTts || false,
            linkFileDesign: detail.linkFileDesign,
            linkThanksCard: detail.linkThanksCard,
            linkImg: detail.linkImg,
            orderDetailID: detail.orderDetailID,
            status: detail.status,
            productionStatus: detail.productionStatus,
          })),
          address: order.address || "",
          shipTo: "",
          status: order.statusOderName,
          totalAmount: `$${order.totalCost.toFixed(2)}`,
          timeCreated: new Date(order.creationDate).toLocaleString(),
          selected: false,
          customerInfo: {
            name: order.customerName,
            phone: order.phone,
            email: order.email,
            address: order.address,
            city: order.city,
            state: order.state,
            zipcode: order.zipcode,
            country: order.country,
          },
          orderNotes: order.details[0]?.note || "",
          uploadedFiles: {
            linkImg: {
              name: "image.jpg",
              url: order.details[0]?.linkImg || "/placeholder.svg",
            },
            linkThanksCard: {
              name: "thanks-card.jpg",
              url: order.details[0]?.linkThanksCard || "#",
            },
            linkFileDesign: {
              name: "design-file.psd",
              url: order.details[0]?.linkFileDesign || "#",
            },
          },
        }));

        setOrders(mappedOrders);
      } catch (err) {
        console.error("[v0] Error fetching orders:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [
      page,
      itemsPerPage,
      searchTerm,
      selectedStat,
      selectedStatusCode,
      sortColumn,
      sortDirection,
      dateRange,
    ]
  );

  // ✅ Bọc fetchStats trong useCallback
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Seller/stats`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setOrderStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    itemsPerPage,
    searchTerm,
    selectedStat,
    selectedStatusCode,
    sortColumn,
    sortDirection,
    dateRange,
    fetchOrders,
    fetchStats,
  ]);

  const stats = STATS_CONFIG;

  const statsWithCounts = useMemo(() => {
    let newStats = STATS_CONFIG.map((stat) => ({
      ...stat,
      value: stat.statusFilter
        ? orders.filter((o) => o.status === stat.statusFilter).length
        : 0,
    }));

    newStats = newStats.map((stat, i) =>
      i === 0 ? { ...stat, value: totalOrdersCount } : stat
    );
    return newStats;
  }, [orders, stats, totalOrdersCount]);

  const totalPages = Math.ceil(totalOrdersCount / itemsPerPage);
  const paginatedOrders = orders;

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    setPage(1);
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

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleStatClick = (statTitle) => {
    setSelectedStat(statTitle);
    setPage(1);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setPage(1);
  };

  // ✅ SỬA LOGIC DÙNG dateRange và Date Objects
  const handleFromDateInputChange = (e) => {
    const dateString = e.target.value;
    const newDate = convertStringToDate(dateString);

    setDateRange((prev) => {
      let toDate = prev.to;
      // Reset toDate nếu newDate lớn hơn toDate cũ
      if (newDate && toDate && newDate.getTime() > toDate.getTime()) {
        toDate = undefined;
      }
      return { from: newDate, to: toDate };
    });
    setPage(1);
  };

  // ✅ SỬA LOGIC DÙNG dateRange và Date Objects
  const handleToDateInputChange = (e) => {
    const dateString = e.target.value;
    const newDate = convertStringToDate(dateString);

    setDateRange((prev) => {
      let fromDate = prev.from;
      // Reset fromDate nếu newDate nhỏ hơn fromDate cũ
      if (newDate && fromDate && newDate.getTime() < fromDate.getTime()) {
        fromDate = undefined;
      }
      return { from: fromDate, to: newDate };
    });
    setPage(1);
  };

  // ✅ HÀM MỚI: Clear tất cả các bộ lọc
  const handleClearAllFilters = () => {
    setSearchTerm("");
    setDateRange(getInitialDateRange());
    setSelectedStat("Total Order");
    setSelectedStatusCode(null);
    setPage(1);
    // Fetch sẽ được gọi qua useEffect
  };

  const handleOpenAssignPopup = async () => {
    const selectedOrdersData = orders.filter((order) =>
      selectedOrders.includes(order.id)
    );
    const nonDraftOrders = selectedOrdersData.filter(
      (order) => order.status !== "DRAFT"
    );
    if (nonDraftOrders.length > 0) {
      setCannotAssignMessage(
        `Cannot assign ${nonDraftOrders.length} order(s) to designer. Only orders with "Draft" status can be assigned.`
      );
      setShowCannotAssignDialog(true);
      return;
    }

    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Seller/my-designer`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to fetch designers");
      const data = await res.json();
      setDesigners(data);
      setIsAssignPopupOpen(true);
    } catch (err) {
      console.error("Fetch designers failed:", err);
      alert("❌ Failed to load designers");
    }
  };

  const handleConfirmAssignDesigner = async () => {
    const confirm = await Swal.fire({
      icon: "question",
      title: "Confirm Assign Designer",
      text: `Are you sure you want to assign ${selectedOrders.length} order(s) to this designer?`,
      showCancelButton: true,
      confirmButtonText: "Yes, assign",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    if (!selectedDesignerId || selectedOrders.length === 0) {
      setErrorMessage("⚠️ Please select a designer and at least one order.");
      setShowErrorDialog(true);
      return;
    }

    try {
      for (const orderId of selectedOrders) {
        const res = await fetch(
          `${apiClient.defaults.baseURL}/api/Seller/orders/${orderId}/assign-designer`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ designerUserId: selectedDesignerId }),
          }
        );

        if (!res.ok) throw new Error(`Failed to assign for order ${orderId}`);
      }

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: `Assigned designer to ${selectedOrders.length} order(s).`,
        timer: 1500,
        showConfirmButton: false,
      });

      setIsAssignPopupOpen(false);
      setSelectedDesignerId("");

      setTimeout(() => {
        fetchOrders();
        fetchStats();
        setSelectedOrders([]);
        setSelectAll(false);
      }, 800);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
      });
    }
  };

  const handleExport = async () => {
    const confirm = await Swal.fire({
      icon: "question",
      title: "Export Orders?",
      text: "Do you want to export the order list?",
      showCancelButton: true,
      confirmButtonText: "Yes, export",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      const selectedStatConfigInList = STATS_CONFIG.find(
        (stat) => stat.title === selectedStat
      );
      const statusFilter =
        selectedStatConfig?.statusFilter ||
        selectedStatConfigInList?.statusFilter ||
        (selectedStat !== "Total Order" ? selectedStat : null);

      const params = new URLSearchParams({
        searchTerm: searchTerm || "",
        sortColumn: sortColumn || "orderDate",
        sortDirection: sortDirection || "desc",
      });

      if (selectedStatusCode) {
        params.append("statusCode", selectedStatusCode);
      }
      // ✅ LOGIC EXPORT DÙNG dateRange
      if (dateRange?.from instanceof Date)
        params.append("fromDate", dateRange.from.toISOString());
      if (dateRange?.to instanceof Date) {
        const nextDay = new Date(dateRange.to.valueOf());
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        params.append("toDate", nextDay.toISOString());
      }

      const url = `${
        apiClient.defaults.baseURL
      }/api/Seller/export?${params.toString()}`;
      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Export failed: ${res.status}`);
      }

      const blob = await res.blob();
      const fileName = `Orders_${new Date().toISOString().slice(0, 10)}.xlsx`;

      saveAs(blob, fileName);

      Swal.fire({
        icon: "success",
        title: "Export Completed",
        text: "File downloaded successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: err.message,
      });
    }
  };

  // Helper: định dạng MySQL (giữ lại nhưng không dùng)
  function formatMySQLDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const pad = (n) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}`;
  }

  const handleDelete = async (orderId) => {
    if (!orderId) return;
    try {
      const orderToDelete = orders.find((o) => o.id === orderId);
      if (!orderToDelete) {
        setResultMessage("⚠️ Không tìm thấy đơn hàng để xóa.");
        setShowResultDialog(true);
        return;
      }

      if (orderToDelete.status !== "DRAFT") {
        setResultMessage(
          `Can't delete the order have status "${orderToDelete.status}". Only can delete the order have status DRAFT".`
        );
        setShowResultDialog(true);
        return;
      }

      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/Order/${orderId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (response.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));

        setResultMessage(result.message || "Delete Successfully");
        fetchOrders();
        fetchStats();
      } else {
        setResultMessage(result.message || "Can't delete this order");
      }
    } catch (error) {
      console.error("❌ Delete failed:", error);
      setResultMessage("Have some error");
    } finally {
      setShowResultDialog(true);
    }
  };

  const handleStatusClick = (status) => {
    console.log("🔍 Clicked status:", status);
    setSelectedStat(status);
    setSelectedStatConfig({ statusFilter: status });
    setPage(1);
    fetchOrders();
    fetchStats();
  };

  const handleStatusCodeClick = (code) => {
    const newStatusCode = selectedStatusCode === code ? null : code;
    setSelectedStatusCode(newStatusCode);
    setSelectedStat(newStatusCode === null ? "Total Order" : newStatusCode);
    setPage(1);
    fetchOrders(newStatusCode);
    fetchStats();
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    if (newSelectAll) {
      setSelectedOrders(paginatedOrders.map((order) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleOrderSelect = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const handleFileImport = () => {
    setShowImportModal(true);
  };

  const handleAssignClick = () => {
    const selectedOrdersData = orders.filter((order) =>
      selectedOrders.includes(order.id)
    );
    const nonDraftOrders = selectedOrdersData.filter(
      (order) => order.status !== "DRAFT"
    );
    if (nonDraftOrders.length > 0) {
      setCannotAssignMessage(
        `Cannot assign ${nonDraftOrders.length} order(s) to designer. Only orders with "Draft Seller Order" status can be assigned.`
      );
      setShowCannotAssignDialog(true);
    } else {
      setShowAssignDialog(true);
    }
  };

  const handleAssignToDesigner = () => {
    console.log("Assigning orders to designer:", selectedOrders);
    setShowAssignDialog(false);
    setSelectedOrders([]);
    setSelectAll(false);
  };

  const handleDownload = (file) => {
    console.log(`Downloading file: ${file.name}`);
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  const handleViewDetails = async (order) => {
    try {
      console.log("🧾 Selected order (before fetch):", order);
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Seller/${order.id}`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const fullOrder = await res.json();
      console.log("✅ Full order fetched:", fullOrder);

      if (!fullOrder) {
        alert("Không tìm thấy chi tiết đơn hàng này!");
        return;
      }

      const mappedOrder = {
        id: fullOrder.orderId,
        orderId: fullOrder.orderCode,
        orderDate: new Date(fullOrder.orderDate).toISOString().split("T")[0],
        customerName: fullOrder.customerName,
        reason: fullOrder.reason,
        rejectionReason: fullOrder.rejectionReason,
        proofUrl: fullOrder.proofUrl,
        refundAmount: fullOrder.refundAmount,
        isRefundPending: fullOrder.isRefundPending,
        phone: fullOrder.phone || "",
        email: fullOrder.email || "",
        address: fullOrder.address || "",
        shipTo: `${fullOrder.shipCity || ""}, ${fullOrder.shipState || ""}, ${
          fullOrder.shipCountry || ""
        }`,
        status: fullOrder.statusOderName,
        totalAmount: `$${fullOrder.totalCost?.toFixed(2) || 0}`,
        timeCreated: new Date(fullOrder.creationDate).toLocaleString(),
        customerInfo: {
          name: fullOrder.customerName,
          phone: fullOrder.phone || "",
          email: fullOrder.email || "",
          address: fullOrder.address || "",
          address1: fullOrder.address1 || "",
          city: fullOrder.shipCity || "",
          state: fullOrder.shipState || "",
          zipcode: fullOrder.zipcode || "",
          country: fullOrder.shipCountry || "",
        },
        orderNotes: fullOrder.details[0]?.note || "",
        uploadedFiles: {
          linkImg: {
            name: "image.jpg",
            url: fullOrder.details[0]?.linkImg || "/placeholder.svg",
          },
          linkThanksCard: {
            name: "thanks-card.jpg",
            url: fullOrder.details[0]?.linkThanksCard || "#",
          },
          linkFileDesign: {
            name: "design-file.psd",
            url: fullOrder.details[0]?.linkFileDesign || "#",
          },
        },
        products: fullOrder.details.map((detail) => ({
          name: detail.productName || `Product ${detail.productVariantID}`,
          quantity: detail.quantity,
          price: detail.price,
          size: detail.size || "",
          accessory: detail.accessory || "",
          activeTTS: fullOrder.activeTts || false,
          linkFileDesign: detail.linkFileDesign,
          linkThanksCard: detail.linkThanksCard,
          linkImg: detail.linkImg,
          orderDetailId: detail.orderDetailID,
          productionStatus: detail.productionStatus,
        })),
      };

      console.log("🎯 Mapped order for modal:", mappedOrder);
      setEditedOrder(mappedOrder);
      setIsDialogOpen(true);
    } catch (err) {
      console.error("❌ Failed to fetch order details:", err);
      alert("Failed to load order details. Please try again.");
    }
  };

  const handleEditMode = () => {
    setIsEditMode(true);
  };

  const handleSaveUpdate = () => {
    console.log("Saving updated order:", editedOrder);
    setIsEditMode(false);
    setSelectedOrder(editedOrder);
    setIsDialogOpen(false);
  };

  const handleCancelEdit = () => {
    setEditedOrder(editedOrder);
    setIsEditMode(false);
    setIsDialogOpen(false);
  };

  const handleFieldChange = (field, value) => {
    setEditedOrder((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCustomerInfoChange = (field, value) => {
    setEditedOrder((prev) => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        [field]: value,
      },
    }));
  };

  const handleProductChange = (index, field, value) => {
    setEditedOrder((prev) => ({
      ...prev,
      products: prev.products.map((product, i) =>
        i === index ? { ...product, [field]: value } : product
      ),
    }));
  };

  const handleApproveDesign = async (orderId) => {
    try {
      if (!orderId) {
        console.error("[v0] Invalid orderId:", orderId);
        throw new Error("Order ID is missing");
      }

      console.log(
        "[v0] Approving design for order:",
        orderId,
        "Type:",
        typeof orderId
      );
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Seller/orders/${orderId}/approve-or-reject-design`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ productionStatus: 6 }), // 6 = READY_PROD (Approve)
        }
      );
      console.log("[v0] API Response status:", res.status);
      console.log("[v0] API Response headers:", res.headers);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("[v0] API Error response text:", errorText);

        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error("[v0] Failed to parse error response as JSON");
        }

        throw new Error(
          errorData.message || `HTTP ${res.status}: Failed to approve design`
        );
      }

      setSuccessMessage("✅ Design approved successfully!");
      setShowSuccessDialog(true);
      setIsDialogOpen(false);

      setTimeout(() => {
        fetchOrders();
        fetchStats();
      }, 1500);
    } catch (err) {
      console.error("[v0] Approve design failed:", err);
      setErrorMessage(`❌ Failed to approve: ${err.message}`);
      setShowErrorDialog(true);
    }
  };

  const handleRejectDesign = async (orderId) => {
    try {
      if (!orderId) {
        console.error("[v0] Invalid orderId:", orderId);
        throw new Error("Order ID is missing");
      }

      console.log(
        "[v0] Rejecting design for order:",
        orderId,
        "Type:",
        typeof orderId
      );
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Seller/orders/${orderId}/approve-or-reject-design`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ productionStatus: 5 }), // 5 = DESIGN_REDO (Reject)
        }
      );
      console.log("[v0] API Response status:", res.status);
      console.log("[v0] API Response headers:", res.headers);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("[v0] API Error response text:", errorText);

        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error("[v0] Failed to parse error response as JSON");
        }

        throw new Error(
          errorData.message || `HTTP ${res.status}: Failed to reject design`
        );
      }

      setSuccessMessage("✅ Design rejected successfully!");
      setShowSuccessDialog(true);
      setIsDialogOpen(false);

      setTimeout(() => {
        fetchOrders();
        fetchStats();
      }, 1500);
    } catch (err) {
      console.error("[v0] Reject design failed:", err);
      setErrorMessage(`❌ Failed to reject: ${err.message}`);
      setShowErrorDialog(true);
    }
  };
  const handleApproveOrderDetail = async (orderDetailId) => {
    setIsSubmittingDetail(orderDetailId);
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Seller/order/order-details/${orderDetailId}/design-status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            productionStatus: 6,
            reason: null,
          }),
        }
      );

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }

      if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`);
      }

      setSuccessMessage(`✅ Details successfully approved #${orderDetailId}!`);
      setShowSuccessDialog(true);
      setIsDialogOpen(false);
      setTimeout(() => fetchOrders(), 1500);
    } catch (err) {
      console.error("Approve detail failed:", err);
      setErrorMessage(`❌ Lỗi: ${err.message}`);
      setShowErrorDialog(true);
    } finally {
      setIsSubmittingDetail(null);
    }
  };

  const handleRejectOrderDetail = async (orderDetailId) => {
    const { value: reason } = await Swal.fire({
      title: `Reject application details `,
      input: "textarea",
      inputPlaceholder:
        "Enter reason for rejection (at least 10 characters)...",
      inputAttributes: {
        "aria-label": "Reason",
      },
      showCancelButton: true,
      confirmButtonText: "Submit request",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      preConfirm: (value) => {
        if (!value || value.trim().length < 10) {
          Swal.showValidationMessage(
            "Rejection reason must be 10 characters or more!"
          );
          return false;
        }
        return value;
      },
    });

    if (!reason) return;

    setIsSubmittingDetail(orderDetailId);

    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Seller/order/order-details/${orderDetailId}/design-status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            productionStatus: 5,
            reason: reason,
          }),
        }
      );

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }

      if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`);
      }

      await Swal.fire({
        icon: "success",
        title: "Request sent!",
        text: `Request to redo details #${orderDetailId} has been sent successfully.`,
        timer: 2000,
        showConfirmButton: false,
      });

      setTimeout(() => fetchOrders(), 1000);
    } catch (err) {
      console.error("Reject detail failed:", err);
      Swal.fire({
        icon: "error",
        title: "Lỗi!",
        text: err.message || "Có lỗi xảy ra khi gửi yêu cầu.",
      });
    } finally {
      setIsSubmittingDetail(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending Design":
        return <Badge variant="secondary">Pending Design</Badge>;
      case "In Progress":
        return <Badge variant="secondary">In Progress</Badge>;
      case "Completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "Assigned Designer":
        return <Badge variant="secondary">Đã Kiểm tra Chất lượng</Badge>;
      case "Đã Ship":
        return <Badge variant="secondary">Đã Ship</Badge>;
      case "Cancel":
        return <Badge variant="secondary">Cancel</Badge>;
      case "Hoàn Hàng":
        return <Badge variant="secondary">Hoàn Hàng</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleAssignStaff = async () => {
    if (selectedOrders.length === 0) {
      setCannotAssignMessage("Please select at least one order.");
      setShowCannotAssignDialog(true);
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "Confirm Assign Staff",
      text: `Assign ${selectedOrders.length} order(s) to staff?`,
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      const failedOrders = [];

      for (const orderId of selectedOrders) {
        try {
          const res = await fetch(
            `${apiClient.defaults.baseURL}/api/Seller/orders/${orderId}/send-to-staff`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            }
          );

          if (!res.ok) failedOrders.push(orderId);
        } catch (err) {
          failedOrders.push(orderId);
        }
      }

      if (failedOrders.length === 0) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: `Assigned ${selectedOrders.length} order(s) to staff.`,
          timer: 1500,
          showConfirmButton: false,
        });

        setSelectedOrders([]);
        setSelectAll(false);
        fetchOrders();
        fetchStats();
      } else {
        Swal.fire({
          icon: "warning",
          title: "Some orders failed",
          text: `${failedOrders.length} orders failed to assign.`,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message,
      });
    }
  };

  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportSuccess = (importedData) => {
    console.log("Imported data:", importedData);
    Swal.fire({
      icon: "success",
      title: "Import Successful",
      text: `Successfully imported ${importedData.length} orders!`,
    });
    setShowImportModal(false);
  };

  return (
    <div className="flex h-screen bg-blue-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border-2 border-blue-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold text-slate-900">
                    Welcome back, Seller!
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Manage your customer orders
                  </p>
                </div>
                <div className="mt-3 sm:mt-0">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Package className="h-4 w-4" />
                    <span>{totalOrdersCount} orders</span>
                  </div>
                </div>
              </div>
            </div>

            {/* --- DROPDOWN GIAI ĐOẠN --- */}
            <div className="flex flex-wrap justify-between gap-4 mb-8">
              {Object.entries(orderStats.stageGroups || {}).map(
                ([stageName, statusList]) => (
                  <div
                    key={stageName}
                    className="flex-1 min-w-[240px] max-w-[300px] border rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out"
                    style={{ alignSelf: "flex-start" }}
                  >
                    <details
                      className="group w-full"
                      onToggle={(e) => {
                        e.currentTarget.scrollIntoView({
                          block: "nearest",
                          behavior: "smooth",
                        });
                      }}
                    >
                      <summary className="cursor-pointer select-none py-2 px-4 font-semibold text-gray-700 bg-gray-50 rounded-t-lg hover:bg-gray-100 transition">
                        {stageName}
                      </summary>

                      <div className="p-2 animate-fadeIn">
                        {statusList.map((s) => (
                          <button
                            key={s.status}
                            onClick={() => handleStatusCodeClick(s.status)}
                            className={`flex justify-between w-full px-3 py-2 text-sm rounded-md
                              ${
                                selectedStatusCode === s.status
                                  ? "bg-blue-100 font-bold text-blue-700"
                                  : "hover:bg-gray-100 text-gray-700"
                              }
                            `}
                          >
                            <span>{s.status}</span>
                            <span className="font-semibold">{s.count}</span>
                          </button>
                        ))}
                      </div>
                    </details>
                  </div>
                )
              )}
            </div>

            <div className="bg-blue-50 p-4 sm:p-6 rounded-lg shadow-sm border border-blue-100">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                  <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Search Orders
                    </label>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        placeholder="Order ID, Customer, Product..."
                        value={searchTerm}
                        onChange={(e) => {
                          handleSearchChange(e.target.value);
                        }}
                        className="pl-10 bg-white border-blue-100 focus:border-blue-300"
                      />
                    </div>
                  </div>

                  <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      From Date
                    </label>
                    <Input
                      type="date"
                      // ✅ SỬA: Dùng dateRange.from và format Date Object sang string
                      value={
                        dateRange.from instanceof Date
                          ? format(dateRange.from, "yyyy-MM-dd")
                          : ""
                      }
                      onChange={handleFromDateInputChange}
                      className="w-full bg-white border-blue-100 focus:border-blue-300"
                      // Giới hạn max date là toDate (nếu có)
                      max={
                        dateRange.to instanceof Date
                          ? format(dateRange.to, "yyyy-MM-dd")
                          : ""
                      }
                    />
                  </div>

                  <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      To Date
                    </label>
                    <Input
                      type="date"
                      // ✅ SỬA: Dùng dateRange.to và format Date Object sang string
                      value={
                        dateRange.to instanceof Date
                          ? format(dateRange.to, "yyyy-MM-dd")
                          : ""
                      }
                      onChange={handleToDateInputChange}
                      className="w-full bg-white border-blue-100 focus:border-blue-300"
                      // Giới hạn min date là fromDate (nếu có)
                      min={
                        dateRange.from instanceof Date
                          ? format(dateRange.from, "yyyy-MM-dd")
                          : ""
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    className="border-blue-100 hover:bg-blue-50 bg-transparent"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Export file</span>
                    <span className="sm:hidden">Export</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowImportModal(true)}
                    className="border-blue-100 hover:bg-blue-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Import file</span>
                    <span className="sm:hidden">Import</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowMakeManualModal(true)}
                    className="border-blue-100 hover:bg-blue-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Make manual</span>
                    <span className="sm:hidden">Manual</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleSelectAll}
                className="bg-white border-blue-100 hover:bg-blue-50"
              >
                {selectAll ? "Deselect All" : "Select All"}
              </Button>

              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleOpenAssignPopup}
                disabled={selectedOrders.length === 0}
              >
                Assign Designer ({selectedOrders.length})
              </Button>

              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleAssignStaff}
                disabled={selectedOrders.length === 0}
              >
                Assign Staff ({selectedOrders.length})
              </Button>

              {/* ✅ NÚT CLEAR ALL FILTERS */}
              {(searchTerm ||
                dateRange.from ||
                dateRange.to ||
                selectedStatusCode) && (
                <Button
                  variant="outline"
                  onClick={handleClearAllFilters}
                  className="bg-white border-red-200 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>

            <AlertDialog
              open={showAssignDialog}
              onOpenChange={setShowAssignDialog}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Assign Orders to Designer</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to send {selectedOrders.length}{" "}
                    order(s) to the designer?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No</AlertDialogCancel>
                  <AlertDialogAction className="bg-indigo-600 hover:bg-indigo-700">
                    Yes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
              open={showCannotAssignDialog}
              onOpenChange={setShowCannotAssignDialog}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cannot Assign Orders</AlertDialogTitle>
                  <AlertDialogDescription>
                    {cannotAssignMessage}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction className="bg-indigo-600 hover:bg-indigo-700">
                    OK
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-100">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading orders...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                    <p className="mt-4 text-red-600 font-medium">
                      Error loading orders
                    </p>
                    <p className="mt-2 text-slate-600 text-sm">{error}</p>
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
                        <TableRow className="bg-blue-100 hover:bg-blue-100">
                          <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                            <Checkbox
                              checked={selectAll}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead
                            className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap cursor-pointer hover:bg-blue-200 transition-colors"
                            onClick={() => handleSort("orderId")}
                          >
                            Order ID {renderSortIcon("orderId")}
                          </TableHead>
                          <TableHead
                            className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap cursor-pointer hover:bg-blue-200 transition-colors"
                            onClick={() => handleSort("orderDate")}
                          >
                            Order Date {renderSortIcon("orderDate")}
                          </TableHead>
                          <TableHead
                            className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap cursor-pointer hover:bg-blue-200 transition-colors"
                            onClick={() => handleSort("customerName")}
                          >
                            Customer {renderSortIcon("customerName")}
                          </TableHead>
                          <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                            Status
                          </TableHead>
                          <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                            Payment Status
                          </TableHead>
                          <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                            Exist File Design
                          </TableHead>
                          <TableHead
                            className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap cursor-pointer hover:bg-blue-200 transition-colors"
                            onClick={() => handleSort("totalAmount")}
                          >
                            Amount {renderSortIcon("totalAmount")}
                          </TableHead>
                          <TableHead
                            className="font-medium text-slate-700 uppercase text-xs tracking-wide
whitespace-nowrap"
                          >
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOrders.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="text-center py-8 text-slate-500"
                            >
                              No orders found
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedOrders.map((order) => (
                            <React.Fragment key={order.id}>
                              <TableRow className="hover:bg-blue-50 transition-colors">
                                <TableCell>
                                  <Checkbox
                                    checked={selectedOrders.includes(order.id)}
                                    onCheckedChange={() =>
                                      handleOrderSelect(order.id)
                                    }
                                  />
                                </TableCell>
                                <TableCell className="font-medium text-slate-900 whitespace-nowrap">
                                  <Link
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={`../seller/order-view/${order.id}`}
                                    className="hover:underline text-blue-600"
                                  >
                                    {order.orderId}
                                  </Link>
                                </TableCell>
                                <TableCell className="text-slate-600 whitespace-nowrap">
                                  {order.orderDate}
                                </TableCell>
                                <TableCell className="min-w-[200px]">
                                  <div>
                                    <div className="font-medium text-slate-900">
                                      {order.customerName}
                                    </div>

                                    {order.email && (
                                      <div className="text-sm text-slate-500">
                                        {order.email}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {getStatusBadge(order.status)}
                                </TableCell>
                                <TableCell className="text-slate-600 whitespace-nowrap">
                                  {order.paymentStatus}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {hasDesignFile(order) ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                  )}
                                </TableCell>
                                <TableCell className="font-medium text-slate-900 whitespace-nowrap">
                                  {order.totalAmount}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className={`bg-transparent hover:bg-blue-100 border-blue-200 transition-colors ${
                                        expandedOrderId === order.id
                                          ? "bg-blue-100"
                                          : ""
                                      }`}
                                      onClick={() =>
                                        setExpandedOrderId(
                                          expandedOrderId === order.id
                                            ? null
                                            : order.id
                                        )
                                      }
                                      title="Expand Details"
                                    >
                                      <ChevronDown
                                        className={`h-4 w-4 transition-transform ${
                                          expandedOrderId === order.id
                                            ? "rotate-180"
                                            : ""
                                        }`}
                                      />
                                    </Button>

                                    {/* Menu hành động */}
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="bg-transparent hover:bg-blue-100 border-blue-200"
                                          title="More actions"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-40 p-2">
                                        <div className="flex flex-col gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleViewDetails(order)
                                            }
                                            className="justify-start"
                                          >
                                            <Eye className="h-4 w-4 mr-2 text-blue-600" />
                                            View Details
                                          </Button>

                                          {order.status === "Đã Ship" && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() =>
                                                openRefundPopup(order)
                                              }
                                              className="justify-start text-amber-600 hover:text-amber-700"
                                            >
                                              <RotateCcw className="h-4 w-4 mr-2" />
                                              Refund
                                            </Button>
                                          )}

                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleDelete(order.id)
                                            }
                                            className="justify-start text-gray-600 hover:text-gray-800"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </Button>
                                        </div>
                                      </PopoverContent>
                                    </Popover>

                                    <Dialog
                                      open={isDialogOpen}
                                      onOpenChange={setIsDialogOpen}
                                    >
                                      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                          <DialogTitle className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <Package className="h-5 w-5" />
                                              Order Details -
                                              {editedOrder?.orderId}
                                            </div>
                                          </DialogTitle>
                                        </DialogHeader>

                                        {editedOrder && (
                                          <div className="space-y-6">
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                              <h3 className="font-semibold text-lg mb-3 text-slate-900">
                                                Customer Information
                                              </h3>

                                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div>
                                                  <Label className="text-sm text-slate-500 font-medium">
                                                    Name *
                                                  </Label>
                                                  {isEditMode ? (
                                                    <Input
                                                      value={
                                                        editedOrder.customerInfo
                                                          .name
                                                      }
                                                      onChange={(e) =>
                                                        handleCustomerInfoChange(
                                                          "name",
                                                          e.target.value
                                                        )
                                                      }
                                                      className="mt-1 border-blue-100 focus:border-blue-300"
                                                    />
                                                  ) : (
                                                    <p className="font-medium text-slate-900 mt-1">
                                                      {editedOrder.customerInfo
                                                        .name || "N/A"}
                                                    </p>
                                                  )}
                                                </div>
                                                <div>
                                                  <Label className="text-sm text-slate-500 font-medium">
                                                    Phone *
                                                  </Label>

                                                  {isEditMode ? (
                                                    <Input
                                                      value={
                                                        editedOrder.customerInfo
                                                          .phone
                                                      }
                                                      onChange={(e) =>
                                                        handleCustomerInfoChange(
                                                          "phone",
                                                          e.target.value
                                                        )
                                                      }
                                                      className="mt-1 border-blue-100 focus:border-blue-300"
                                                    />
                                                  ) : (
                                                    <p className="font-medium text-slate-900 mt-1">
                                                      {editedOrder.customerInfo
                                                        .phone || "N/A"}
                                                    </p>
                                                  )}
                                                </div>
                                                <div>
                                                  <Label className="text-sm text-slate-500 font-medium">
                                                    Email *
                                                  </Label>

                                                  {isEditMode ? (
                                                    <Input
                                                      value={
                                                        editedOrder.customerInfo
                                                          .email
                                                      }
                                                      onChange={(e) =>
                                                        handleCustomerInfoChange(
                                                          "email",
                                                          e.target.value
                                                        )
                                                      }
                                                      className="mt-1 border-blue-100 focus:border-blue-300"
                                                    />
                                                  ) : (
                                                    <p className="font-medium text-slate-900 mt-1">
                                                      {editedOrder.customerInfo
                                                        .email || "N/A"}
                                                    </p>
                                                  )}
                                                </div>
                                                <div>
                                                  <Label className="text-sm text-slate-500 font-medium">
                                                    Address *
                                                  </Label>

                                                  {isEditMode ? (
                                                    <Input
                                                      value={
                                                        editedOrder.customerInfo
                                                          .address
                                                      }
                                                      onChange={(e) =>
                                                        handleCustomerInfoChange(
                                                          "address",
                                                          e.target.value
                                                        )
                                                      }
                                                      className="mt-1 border-blue-100 focus:border-blue-300"
                                                    />
                                                  ) : (
                                                    <p className="font-medium text-slate-900 mt-1">
                                                      {editedOrder.customerInfo
                                                        .address || "N/A"}
                                                    </p>
                                                  )}
                                                </div>
                                                <div>
                                                  <Label className="text-sm text-slate-500 font-medium">
                                                    Address Line 2
                                                  </Label>

                                                  {isEditMode ? (
                                                    <Input
                                                      value={
                                                        editedOrder.customerInfo
                                                          .address1 || ""
                                                      }
                                                      onChange={(e) =>
                                                        handleCustomerInfoChange(
                                                          "address1",
                                                          e.target.value
                                                        )
                                                      }
                                                      className="mt-1 border-blue-100 focus:border-blue-300"
                                                    />
                                                  ) : (
                                                    <p className="font-medium text-slate-900 mt-1">
                                                      {editedOrder.customerInfo
                                                        .address1 || "N/A"}
                                                    </p>
                                                  )}
                                                </div>
                                                <div>
                                                  <Label className="text-sm text-slate-500 font-medium">
                                                    Zipcode *
                                                  </Label>

                                                  {isEditMode ? (
                                                    <Input
                                                      value={
                                                        editedOrder.customerInfo
                                                          .zipcode
                                                      }
                                                      onChange={(e) =>
                                                        handleCustomerInfoChange(
                                                          "zipcode",
                                                          e.target.value
                                                        )
                                                      }
                                                      className="mt-1 border-blue-100 focus:border-blue-300"
                                                    />
                                                  ) : (
                                                    <p className="font-medium text-slate-900 mt-1">
                                                      {editedOrder.customerInfo
                                                        .zipcode || "N/A"}
                                                    </p>
                                                  )}
                                                </div>
                                                <div>
                                                  <Label className="text-sm text-slate-500 font-medium">
                                                    Ship City *
                                                  </Label>

                                                  {isEditMode ? (
                                                    <Select
                                                      value={
                                                        editedOrder.customerInfo
                                                          .city
                                                      }
                                                      onValueChange={(value) =>
                                                        handleCustomerInfoChange(
                                                          "city",
                                                          value
                                                        )
                                                      }
                                                      className="mt-1 border-blue-100 focus:border-blue-300"
                                                    >
                                                      <SelectTrigger>
                                                        <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        {/* Thêm các SelectItem cần thiết */}
                                                      </SelectContent>
                                                    </Select>
                                                  ) : (
                                                    <p className="font-medium text-slate-900 mt-1">
                                                      {editedOrder.customerInfo
                                                        .city || "N/A"}
                                                    </p>
                                                  )}
                                                </div>
                                                <div>
                                                  <Label className="text-sm text-slate-500 font-medium">
                                                    Ship State *
                                                  </Label>

                                                  {isEditMode ? (
                                                    <Input
                                                      value={
                                                        editedOrder.customerInfo
                                                          .state
                                                      }
                                                      onChange={(e) =>
                                                        handleCustomerInfoChange(
                                                          "state",
                                                          e.target.value
                                                        )
                                                      }
                                                      className="mt-1 border-blue-100 focus:border-blue-300"
                                                    />
                                                  ) : (
                                                    <p className="font-medium text-slate-900 mt-1">
                                                      {editedOrder.customerInfo
                                                        .state || "N/A"}
                                                    </p>
                                                  )}
                                                </div>
                                                <div>
                                                  <Label className="text-sm text-slate-500 font-medium">
                                                    Ship Country *
                                                  </Label>

                                                  {isEditMode ? (
                                                    <Input
                                                      value={
                                                        editedOrder.customerInfo
                                                          .country
                                                      }
                                                      onChange={(e) =>
                                                        handleCustomerInfoChange(
                                                          "country",
                                                          e.target.value
                                                        )
                                                      }
                                                      className="mt-1 border-blue-100 focus:border-blue-300"
                                                    />
                                                  ) : (
                                                    <p className="font-medium text-slate-900 mt-1">
                                                      {editedOrder.customerInfo
                                                        .country || "N/A"}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            <div>
                                              <h3 className="font-semibold text-lg mb-3 text-slate-900">
                                                Product Details
                                              </h3>
                                              <div className="space-y-4">
                                                {editedOrder.products.map(
                                                  (product, index) => (
                                                    <div
                                                      key={index}
                                                      className="border border-blue-100 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                                                    >
                                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                                        <div>
                                                          <Label className="text-sm text-slate-500 font-medium">
                                                            Product Name
                                                          </Label>

                                                          {isEditMode ? (
                                                            <Input
                                                              value={
                                                                product.name
                                                              }
                                                              onChange={(e) =>
                                                                handleProductChange(
                                                                  index,
                                                                  "name",
                                                                  e.target.value
                                                                )
                                                              }
                                                              className="mt-1 border-blue-100 focus:border-blue-300"
                                                            />
                                                          ) : (
                                                            <p className="font-medium text-slate-900 mt-1">
                                                              {product.name}
                                                            </p>
                                                          )}
                                                        </div>

                                                        <div>
                                                          <Label className="text-sm text-slate-500 font-medium">
                                                            Size/Variant
                                                          </Label>
                                                          {isEditMode ? (
                                                            <Input
                                                              value={
                                                                product.size
                                                              }
                                                              onChange={(e) =>
                                                                handleProductChange(
                                                                  index,
                                                                  "size",
                                                                  e.target.value
                                                                )
                                                              }
                                                              className="mt-1 border-blue-100 focus:border-blue-300"
                                                            />
                                                          ) : (
                                                            <p className="font-medium text-slate-900 mt-1">
                                                              {product.size ||
                                                                "N/A"}
                                                            </p>
                                                          )}
                                                        </div>

                                                        <div>
                                                          <Label className="text-sm text-slate-500 font-medium">
                                                            Quantity
                                                          </Label>
                                                          {isEditMode ? (
                                                            <Input
                                                              type="number"
                                                              value={
                                                                product.quantity
                                                              }
                                                              onChange={(e) =>
                                                                handleProductChange(
                                                                  index,
                                                                  "quantity",
                                                                  Number.parseInt(
                                                                    e.target
                                                                      .value
                                                                  )
                                                                )
                                                              }
                                                              className="mt-1 border-blue-100 focus:border-blue-300"
                                                            />
                                                          ) : (
                                                            <p className="font-medium text-slate-900 mt-1">
                                                              {product.quantity}
                                                            </p>
                                                          )}
                                                        </div>

                                                        <div>
                                                          <Label className="text-sm text-slate-500 font-medium">
                                                            Unit Price
                                                          </Label>

                                                          <p className="font-medium text-slate-900 mt-1">
                                                            $
                                                            {product.price?.toFixed(
                                                              2
                                                            ) || "0.00"}
                                                          </p>
                                                        </div>
                                                        <div>
                                                          <Label className="text-sm text-slate-500 font-medium">
                                                            Total Price
                                                          </Label>

                                                          <p className="font-bold text-indigo-600 text-lg mt-1">
                                                            $
                                                            {(
                                                              (product.price ||
                                                                0) *
                                                              (product.quantity ||
                                                                1)
                                                            ).toFixed(2)}
                                                          </p>
                                                        </div>

                                                        <div>
                                                          <Label className="text-sm text-slate-500 font-medium">
                                                            Accessory
                                                          </Label>

                                                          {isEditMode ? (
                                                            <Input
                                                              value={
                                                                product.accessory
                                                              }
                                                              onChange={(e) =>
                                                                handleProductChange(
                                                                  index,
                                                                  "accessory",
                                                                  e.target.value
                                                                )
                                                              }
                                                              className="mt-1 border-blue-100 focus:border-blue-300"
                                                            />
                                                          ) : (
                                                            <p className="font-medium text-slate-900 mt-1">
                                                              {product.accessory ||
                                                                "None"}
                                                            </p>
                                                          )}
                                                        </div>

                                                        <div className="flex items-center space-x-2 lg:col-span-2">
                                                          <Checkbox
                                                            id={`activeTTS-${index}`}
                                                            checked={
                                                              product.activeTTS ||
                                                              false
                                                            }
                                                            disabled={
                                                              !isEditMode
                                                            }
                                                            onCheckedChange={(
                                                              checked
                                                            ) =>
                                                              handleProductChange(
                                                                index,
                                                                "activeTTS",
                                                                checked
                                                              )
                                                            }
                                                          />

                                                          <Label
                                                            htmlFor={`activeTTS-${index}`}
                                                            className="text-sm"
                                                          >
                                                            Active TTS (+$1.00)
                                                          </Label>
                                                        </div>
                                                      </div>

                                                      <div className="mt-4 pt-4 border-t border-blue-100">
                                                        <h4 className="font-medium text-sm text-slate-700 mb-3">
                                                          Order Files for this
                                                          Product
                                                        </h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                          {/* Design File */}
                                                          <div
                                                            className="border border-blue-100
                                                            rounded-lg p-3 hover:shadow-md transition-shadow bg-blue-50"
                                                          >
                                                            <Label className="text-xs text-slate-500 font-medium">
                                                              Design File
                                                            </Label>

                                                            <div className="mt-2">
                                                              {product.linkFileDesign &&
                                                              product.linkFileDesign !==
                                                                "#" ? (
                                                                <>
                                                                  <img
                                                                    src={
                                                                      product.linkFileDesign ||
                                                                      "/placeholder.svg"
                                                                    }
                                                                    alt="Design File"
                                                                    className="w-full h-32 object-cover rounded border border-blue-200"
                                                                    onError={(
                                                                      e
                                                                    ) => {
                                                                      console.log(
                                                                        "[v0] Design file image failed to load:",
                                                                        e.target
                                                                          .src
                                                                      );
                                                                      e.target.style.display =
                                                                        "none";
                                                                      e.target.nextElementSibling.style.display =
                                                                        "flex";
                                                                    }}
                                                                  />

                                                                  <div
                                                                    className="w-full h-32 bg-blue-100 rounded border border-blue-200 flex items-center justify-center"
                                                                    style={{
                                                                      display:
                                                                        "none",
                                                                    }}
                                                                  >
                                                                    <QrCode className="h-8 w-8 text-indigo-400" />
                                                                  </div>
                                                                </>
                                                              ) : (
                                                                <div className="w-full h-32 bg-blue-100 rounded border border-blue-200 flex items-center justify-center">
                                                                  <QrCode className="h-8 w-8 text-indigo-400" />
                                                                </div>
                                                              )}

                                                              <p className="text-xs mt-2 text-slate-600 truncate">
                                                                design-file-
                                                                {index + 1}.psd
                                                              </p>

                                                              {product.linkFileDesign &&
                                                                product.linkFileDesign !==
                                                                  "#" && (
                                                                  <a
                                                                    href={
                                                                      product.linkFileDesign
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-indigo-600 hover:underline block mt-1 truncate"
                                                                  >
                                                                    View file
                                                                  </a>
                                                                )}

                                                              <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="mt-2 w-full bg-transparent hover:bg-blue-100 border-blue-200"
                                                                onClick={() =>
                                                                  handleDownload(
                                                                    {
                                                                      name: `design-file-${
                                                                        index +
                                                                        1
                                                                      }.psd`,
                                                                      url: product.linkFileDesign,
                                                                    }
                                                                  )
                                                                }
                                                                disabled={
                                                                  !product.linkFileDesign ||
                                                                  product.linkFileDesign ===
                                                                    "#"
                                                                }
                                                              >
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Download
                                                              </Button>
                                                            </div>
                                                          </div>

                                                          {/* Thanks Card */}

                                                          <div className="border border-blue-100 rounded-lg p-3 hover:shadow-md transition-shadow bg-blue-50">
                                                            <Label className="text-xs text-slate-500 font-medium">
                                                              Thanks Card
                                                            </Label>
                                                            <div className="mt-2">
                                                              {product.linkThanksCard &&
                                                              product.linkThanksCard !==
                                                                "#" ? (
                                                                <>
                                                                  <img
                                                                    src={
                                                                      product.linkThanksCard ||
                                                                      "/placeholder.svg"
                                                                    }
                                                                    alt="Thanks Card"
                                                                    className="w-full h-32 object-cover rounded border border-blue-200"
                                                                    onError={(
                                                                      e
                                                                    ) => {
                                                                      console.log(
                                                                        "[v0] Thanks card image failed to load:",
                                                                        e.target
                                                                          .src
                                                                      );
                                                                      e.target.style.display =
                                                                        "none";
                                                                      e.target.nextElementSibling.style.display =
                                                                        "flex";
                                                                    }}
                                                                  />

                                                                  <div
                                                                    className="w-full h-32 bg-blue-100 rounded border border-blue-200 flex items-center justify-center"
                                                                    style={{
                                                                      display:
                                                                        "none",
                                                                    }}
                                                                  >
                                                                    <QrCode className="h-8 w-8 text-indigo-400" />
                                                                  </div>
                                                                </>
                                                              ) : (
                                                                <div className="w-full h-32 bg-blue-100 rounded border border-blue-200 flex items-center justify-center">
                                                                  <QrCode className="h-8 w-8 text-indigo-400" />
                                                                </div>
                                                              )}

                                                              <p className="text-xs mt-2 text-slate-600 truncate">
                                                                thanks-card-
                                                                {index + 1}.jpg
                                                              </p>

                                                              {product.linkThanksCard &&
                                                                product.linkThanksCard !==
                                                                  "#" && (
                                                                  <a
                                                                    href={
                                                                      product.linkThanksCard
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-indigo-600 hover:underline block mt-1 truncate"
                                                                  >
                                                                    View file
                                                                  </a>
                                                                )}

                                                              <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="mt-2 w-full bg-transparent hover:bg-blue-100 border-blue-200"
                                                                onClick={() =>
                                                                  handleDownload(
                                                                    {
                                                                      name: `thanks-card-${
                                                                        index +
                                                                        1
                                                                      }.jpg`,
                                                                      url: product.linkThanksCard,
                                                                    }
                                                                  )
                                                                }
                                                                disabled={
                                                                  !product.linkThanksCard ||
                                                                  product.linkThanksCard ===
                                                                    "#"
                                                                }
                                                              >
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Download
                                                              </Button>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>

                                                      {product.orderDetailId && (
                                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                                          <h5 className="font-semibold text-sm text-slate-700 mb-2">
                                                            Detail ID: #
                                                            {
                                                              product.orderDetailId
                                                            }
                                                          </h5>
                                                          <div className="flex items-center gap-3">
                                                            <button
                                                              className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded border ${
                                                                canApproveOrReject(
                                                                  order,
                                                                  product
                                                                )
                                                                  ? "bg-green-50 text-green-700 border-green-200 hover:shadow"
                                                                  : "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200"
                                                              }`}
                                                              onClick={() =>
                                                                handleApproveOrderDetail(
                                                                  product.orderDetailId
                                                                )
                                                              }
                                                              disabled={
                                                                isSubmittingDetail ===
                                                                  product.orderDetailId ||
                                                                !canApproveOrReject(
                                                                  order,
                                                                  product
                                                                )
                                                              }
                                                            >
                                                              {isSubmittingDetail ===
                                                              product.orderDetailId ? (
                                                                <span className="inline-block animate-spin w-4 h-4 border-2 rounded-full mr-2 border-current"></span>
                                                              ) : (
                                                                "✓ Approve Design"
                                                              )}
                                                            </button>

                                                            <button
                                                              className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded border ${
                                                                canApproveOrReject(
                                                                  order,
                                                                  product
                                                                )
                                                                  ? "bg-red-50 text-red-700 border-red-200 hover:shadow"
                                                                  : "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200"
                                                              }`}
                                                              onClick={() =>
                                                                handleRejectOrderDetail(
                                                                  product.orderDetailId
                                                                )
                                                              }
                                                              disabled={
                                                                isSubmittingDetail ===
                                                                  product.orderDetailId ||
                                                                !canApproveOrReject(
                                                                  order,
                                                                  product
                                                                )
                                                              }
                                                            >
                                                              {isSubmittingDetail ===
                                                              product.orderDetailId ? (
                                                                <span className="inline-block animate-spin w-4 h-4 border-2 rounded-full mr-2 border-current"></span>
                                                              ) : (
                                                                "✕ Reject Design"
                                                              )}
                                                            </button>
                                                          </div>
                                                        </div>
                                                      )}
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                              {editedOrder.orderNotes && (
                                                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                                  <Label className="text-sm text-amber-800 font-medium">
                                                    Order Notes
                                                  </Label>

                                                  {isEditMode ? (
                                                    <Textarea
                                                      value={
                                                        editedOrder.orderNotes
                                                      }
                                                      onChange={(e) =>
                                                        handleFieldChange(
                                                          "orderNotes",
                                                          e.target.value
                                                        )
                                                      }
                                                      className="mt-1 bg-white border-amber-200 focus:border-amber-300"
                                                      rows={3}
                                                    />
                                                  ) : (
                                                    <p className="text-amber-800 mt-1">
                                                      {editedOrder.orderNotes}
                                                    </p>
                                                  )}
                                                </div>
                                              )}
                                            </div>

                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                              <h3 className="font-semibold text-lg mb-3 text-slate-900">
                                                Order Status & Timeline
                                              </h3>
                                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div>
                                                  <Label className="text-sm text-slate-500 font-medium">
                                                    Current Status
                                                  </Label>

                                                  {isEditMode ? (
                                                    <Select
                                                      value={editedOrder.status}
                                                      onValueChange={(value) =>
                                                        handleFieldChange(
                                                          "status",
                                                          value
                                                        )
                                                      }
                                                    >
                                                      <SelectTrigger className="mt-1 bg-white border-blue-100 focus:border-blue-300">
                                                        <SelectValue />
                                                      </SelectTrigger>

                                                      <SelectContent>
                                                        <SelectItem value="Draft">
                                                          Draft
                                                        </SelectItem>

                                                        <SelectItem value="Pending Design">
                                                          Pending Design
                                                        </SelectItem>

                                                        <SelectItem value="Assigned Designer">
                                                          Assigned Designer
                                                        </SelectItem>
                                                        <SelectItem value="Designing">
                                                          Designing
                                                        </SelectItem>
                                                        <SelectItem value="Check File Design">
                                                          Check File Design
                                                        </SelectItem>

                                                        <SelectItem value="Seller Approved Design">
                                                          Seller Approved Design
                                                        </SelectItem>

                                                        <SelectItem value="Seller Reject Design">
                                                          Seller Reject Design
                                                        </SelectItem>
                                                        <SelectItem value="In Progress">
                                                          In Progress
                                                        </SelectItem>
                                                        <SelectItem value="Completed">
                                                          Completed
                                                        </SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  ) : (
                                                    <div className="mt-1">
                                                      {getStatusBadge(
                                                        editedOrder.status
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                                <div>
                                                  <Label
                                                    className="text-sm
                                                    text-slate-500 font-medium"
                                                  >
                                                    Order Date
                                                  </Label>
                                                  <p className="font-medium text-slate-900 mt-1">
                                                    {editedOrder.orderDate}
                                                  </p>
                                                </div>
                                                <div>
                                                  <Label className="text-sm text-slate-500 font-medium">
                                                    Created Time
                                                  </Label>
                                                  <p className="font-medium text-slate-900 mt-1">
                                                    {editedOrder.timeCreated ||
                                                      "N/A"}
                                                  </p>
                                                </div>

                                                <div>
                                                  <Label className="text-sm text-slate-500 font-medium">
                                                    Order ID
                                                  </Label>
                                                  <p className="font-medium text-slate-900 mt-1">
                                                    {editedOrder.orderId}
                                                  </p>
                                                </div>
                                                <div>
                                                  <Label className="text-sm text-slate-500 font-medium">
                                                    Total Amount
                                                  </Label>
                                                  <p className="font-bold text-indigo-600 text-lg mt-1">
                                                    {editedOrder.totalAmount}
                                                  </p>
                                                </div>
                                              </div>
                                              {(editedOrder.reason ||
                                                editedOrder.rejectionReason ||
                                                editedOrder.refundAmount >
                                                  0) && (
                                                <div
                                                  className={`mt-4 p-4 rounded-lg border ${
                                                    editedOrder.rejectionReason
                                                      ? "bg-red-50 border-red-200"
                                                      : "bg-orange-50 border-orange-200"
                                                  }`}
                                                >
                                                  <h3
                                                    className={`font-semibold text-lg mb-3 ${
                                                      editedOrder.rejectionReason
                                                        ? "text-red-800"
                                                        : "text-orange-800"
                                                    }`}
                                                  >
                                                    Request Details
                                                    (Refund/Cancel)
                                                  </h3>

                                                  <div className="space-y-3 text-sm">
                                                    {editedOrder.refundAmount >
                                                      0 && (
                                                      <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                                                        <span className="font-medium text-gray-700">
                                                          Requested Refund
                                                          Amount:
                                                        </span>
                                                        <span className="font-bold text-green-600 text-lg">
                                                          $
                                                          {editedOrder.refundAmount?.toFixed(
                                                            2
                                                          )}
                                                        </span>
                                                      </div>
                                                    )}

                                                    {editedOrder.reason && (
                                                      <div>
                                                        <span className="block font-medium text-gray-700 mb-1">
                                                          Reason:
                                                        </span>
                                                        <div className="bg-white p-3 rounded border border-gray-200 text-gray-800 italic">
                                                          "{editedOrder.reason}"
                                                        </div>
                                                      </div>
                                                    )}

                                                    {editedOrder.proofUrl && (
                                                      <div>
                                                        <span className="block font-medium text-gray-700 mb-1">
                                                          Evidence / Proof:
                                                        </span>
                                                        <a
                                                          href={
                                                            editedOrder.proofUrl
                                                          }
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 bg-white px-3 py-2 rounded border border-blue-200 hover:shadow-sm transition-all"
                                                        >
                                                          <span>
                                                            📷 View Proof Image
                                                          </span>
                                                          <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                          >
                                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                            <polyline points="15 3 21 3 21 9"></polyline>
                                                            <line
                                                              x1="10"
                                                              y1="14"
                                                              x2="21"
                                                              y2="3"
                                                            ></line>
                                                          </svg>
                                                        </a>
                                                      </div>
                                                    )}

                                                    {editedOrder.rejectionReason && (
                                                      <div className="mt-2">
                                                        <span className="block font-medium text-red-700 mb-1">
                                                          Rejection Reason
                                                          (Admin):
                                                        </span>
                                                        <div className="bg-white p-3 rounded border border-red-200 text-red-600 font-medium">
                                                          "
                                                          {
                                                            editedOrder.rejectionReason
                                                          }
                                                          "
                                                        </div>
                                                      </div>
                                                    )}

                                                    {editedOrder.isRefundPending && (
                                                      <div className="mt-2 flex items-center gap-2 text-amber-600 font-bold bg-amber-100 p-2 rounded justify-center">
                                                        <span className="animate-pulse">
                                                          ⚠️ Waiting for Staff
                                                          Approval
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {editedOrder?.status ===
                                          "Cần Check Design" &&
                                          !isEditMode && (
                                            <DialogFooter className="flex gap-2">
                                              <Button
                                                variant="outline"
                                                onClick={() =>
                                                  setIsDialogOpen(false)
                                                }
                                              >
                                                Close
                                              </Button>
                                              <Button
                                                onClick={() =>
                                                  handleRejectDesign(
                                                    editedOrder.id
                                                  )
                                                }
                                                className="bg-red-600 hover:bg-red-700"
                                              >
                                                ✕ Reject Design
                                              </Button>
                                              <Button
                                                onClick={() =>
                                                  handleApproveDesign(
                                                    editedOrder.id
                                                  )
                                                }
                                                className="bg-green-600 hover:bg-green-700"
                                              >
                                                ✓ Approve Design
                                              </Button>
                                            </DialogFooter>
                                          )}

                                        {isEditMode && (
                                          <DialogFooter className="flex gap-2">
                                            <Button
                                              variant="outline"
                                              onClick={handleCancelEdit}
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              onClick={handleSaveUpdate}
                                              className="bg-indigo-600 hover:bg-indigo-700"
                                            >
                                              <Save className="h-4 w-4 mr-2" />
                                              Save Changes
                                            </Button>
                                          </DialogFooter>
                                        )}
                                      </DialogContent>
                                    </Dialog>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        {/* <Button variant="outline" size="sm" className="bg-transparent hover:bg-red-50 text-red-600 hover:text-red-700 border-red-200">
                                            <Trash2 className="h-4 w-4" />
                                          </Button> */}
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Delete Order
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete
                                            order {order.orderId}? This action
                                            cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              handleDelete(order.id)
                                            }
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>

                              {expandedOrderId === order.id &&
                                (order.products || order.details) &&
                                (order.products?.length > 0 ||
                                  order.details?.length > 0) && (
                                  <TableRow className="bg-blue-100">
                                    <TableCell colSpan={8} className="p-4">
                                      <div className="space-y-3">
                                        <h4 className="font-semibold text-slate-900 text-sm">
                                          Order Items:
                                        </h4>
                                        <div className="space-y-2">
                                          {(
                                            order.products || order.details
                                          ).map((item, idx) => {
                                            console.log(
                                              "🧩 OrderDetail debug:",
                                              item,
                                              "| Keys:",
                                              Object.keys(item)
                                            );

                                            return (
                                              <div
                                                key={idx}
                                                className="flex items-start gap-3 p-3 bg-white rounded border border-blue-200 hover:shadow-sm transition-shadow"
                                              >
                                                {/* Product Image */}
                                                {item.linkImg ? (
                                                  <img
                                                    src={
                                                      item.linkImg ||
                                                      "/placeholder.svg"
                                                    }
                                                    alt={item.name || "Product"}
                                                    className="w-16 h-16 rounded object-cover border border-blue-200"
                                                    onError={(e) => {
                                                      console.log(
                                                        "Error loading image:",
                                                        e.target.src
                                                      );
                                                      e.target.style.display =
                                                        "none";
                                                      e.target.nextElementSibling.style.display =
                                                        "flex";
                                                    }}
                                                  />
                                                ) : (
                                                  <div className="w-16 h-16 rounded bg-blue-100 border border-blue-200 flex items-center justify-center text-slate-400 text-xs">
                                                    No Image
                                                  </div>
                                                )}

                                                {/* Item Details */}
                                                <div className="flex-1">
                                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                      <span className="text-slate-600 font-medium">
                                                        Base Cost:
                                                      </span>
                                                      <p className="text-slate-900 font-semibold">
                                                        ${item.price || "0"}
                                                      </p>
                                                    </div>
                                                    <div>
                                                      <span className="text-slate-600 font-medium">
                                                        Quantity:
                                                      </span>
                                                      <p className="text-slate-900 font-semibold">
                                                        {item.quantity || "0"}
                                                      </p>
                                                    </div>
                                                    {/* <div>
                                                      <span className="text-slate-600 font-medium">
                                                        Total:
                                                      </span>
                                                      <p className="text-indigo-600 font-bold">
                                                        $
                                                        {(
                                                          Number(
                                                            item.price || 0
                                                          ) *
                                                          (item.quantity || 0)
                                                        ).toFixed(2)}
                                                      </p>
                                                    </div> */}
                                                    <div>
                                                      <span className="text-slate-600 font-medium">
                                                        Name:
                                                      </span>
                                                      <p className="text-slate-900">
                                                        {item.name || "N/A"}
                                                      </p>
                                                    </div>
                                                    {/* ✅ Thêm status ở đây */}
                                                    <div>
                                                      <span className="text-slate-600 font-medium">
                                                        Status:
                                                      </span>
                                                      <p
                                                        className={`font-semibold ${
                                                          item.status === 4
                                                            ? "text-yellow-600"
                                                            : item.status === 5
                                                            ? "text-green-600"
                                                            : "text-gray-600"
                                                        }`}
                                                      >
                                                        {getProductionStatusName(
                                                          item.status
                                                        )}
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Action buttons */}
                                                <div className="mt-3 flex items-center gap-2">
                                                  <button
                                                    className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded border ${
                                                      canApproveOrReject(
                                                        order,
                                                        item
                                                      )
                                                        ? "bg-green-50 text-green-700 border-green-200 hover:shadow"
                                                        : "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200"
                                                    }`}
                                                    onClick={() =>
                                                      handleApproveOrderDetail(
                                                        item.orderDetailID
                                                      )
                                                    }
                                                    disabled={
                                                      isSubmittingDetail ===
                                                        item.orderDetailID ||
                                                      !canApproveOrReject(
                                                        order,
                                                        item
                                                      )
                                                    }
                                                  >
                                                    {isSubmittingDetail ===
                                                    item.orderDetailID ? (
                                                      <span className="inline-block animate-spin w-4 h-4 border-2 rounded-full mr-2 border-current"></span>
                                                    ) : (
                                                      "✓ Approve"
                                                    )}
                                                  </button>

                                                  <button
                                                    className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded border ${
                                                      canApproveOrReject(
                                                        order,
                                                        item
                                                      )
                                                        ? "bg-red-50 text-red-700 border-red-200 hover:shadow"
                                                        : "opacity-50 cursor-not-allowed bg-gray-50 text-gray-400 border-gray-200"
                                                    }`}
                                                    onClick={() =>
                                                      handleRejectOrderDetail(
                                                        item.orderDetailID
                                                      )
                                                    }
                                                    disabled={
                                                      isSubmittingDetail ===
                                                        item.orderDetailID ||
                                                      !canApproveOrReject(
                                                        order,
                                                        item
                                                      )
                                                    }
                                                  >
                                                    {isSubmittingDetail ===
                                                    item.orderDetailID ? (
                                                      <span className="inline-block animate-spin w-4 h-4 border-2 rounded-full mr-2 border-current"></span>
                                                    ) : (
                                                      "✕ Reject"
                                                    )}
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                            </React.Fragment>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Footer */}
                  <div className="bg-blue-100 px-4 py-3 border-t border-blue-200 sm:px-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Thêm Items Per Page Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">
                          Items per page:
                        </span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={handleItemsPerPageChange}
                        >
                          <SelectTrigger className="w-[70px] bg-white border-blue-200 hover:bg-blue-50">
                            <SelectValue placeholder={itemsPerPage} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="text-sm text-slate-600">
                        Showing{" "}
                        {paginatedOrders.length > 0
                          ? (page - 1) * itemsPerPage + 1
                          : 0}{" "}
                        to {Math.min(page * itemsPerPage, totalOrdersCount)} of{" "}
                        {totalOrdersCount}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                          className="disabled:opacity-50 border-blue-200 hover:bg-blue-50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Chỉ hiển thị tối đa 5 nút trang */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(
                            (pageNum) =>
                              pageNum === 1 ||
                              pageNum === totalPages ||
                              (pageNum >= page - 2 && pageNum <= page + 2)
                          )
                          .map((pageNum, index, arr) => (
                            <React.Fragment key={pageNum}>
                              {/* Thêm dấu ... nếu cần */}
                              {index > 0 && pageNum > arr[index - 1] + 1 && (
                                <span className="text-slate-600 mx-1">...</span>
                              )}

                              <Button
                                key={pageNum}
                                variant={
                                  page === pageNum ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setPage(pageNum)}
                                className={`w-8 h-8 p-0 ${
                                  page === pageNum
                                    ? "bg-indigo-600 hover:bg-indigo-700"
                                    : "border-blue-200 hover:bg-blue-50"
                                }`}
                              >
                                {pageNum}
                              </Button>
                            </React.Fragment>
                          ))}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page === totalPages}
                          onClick={() => setPage(page + 1)}
                          className="disabled:opacity-50 border-blue-200 hover:bg-blue-50"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* Result Popup */}
          <AlertDialog
            open={showResultDialog}
            onOpenChange={setShowResultDialog}
          >
            <AlertDialogContent className="max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Result Action</AlertDialogTitle>
                <AlertDialogDescription>{resultMessage}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction className="bg-indigo-600 hover:bg-indigo-700">
                  OK
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
      <ImportOrdersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />
      <MakeManualModal
        isOpen={showMakeManualModal}
        onClose={() => setShowMakeManualModal(false)}
      />
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">Success</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 py-4">{successMessage}</p>

          <DialogFooter>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="bg-green-600 hover:bg-green-700"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Error</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 py-4">{errorMessage}</p>
          <DialogFooter>
            <Button
              onClick={() => setShowErrorDialog(false)}
              className="bg-red-600 hover:bg-red-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isAssignPopupOpen} onOpenChange={setIsAssignPopupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Designer</DialogTitle>
          </DialogHeader>

          {designers.length > 0 ? (
            <div className="space-y-3">
              <Label>Select a designer:</Label>
              <Select
                onValueChange={(value) => setSelectedDesignerId(value)}
                value={selectedDesignerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose designer..." />
                </SelectTrigger>
                <SelectContent>
                  {designers.map((d) => (
                    <SelectItem key={d.designerUserId} value={d.designerUserId}>
                      {d.designerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p>No designers found for this seller.</p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignPopupOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 text-white"
              onClick={handleConfirmAssignDesigner}
              disabled={!selectedDesignerId}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
