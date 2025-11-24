// File: app/manager/refund-reprint-review/page.jsx

"use client";

import { useState, useEffect } from "react";
import ManagerSidebar from "@/components/layout/manager/sidebar";
import ManagerHeader from "@/components/layout/manager/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import {
  X, Check, DollarSign, Printer, Search, Loader, Eye,
} from "lucide-react";
import apiClient from "../../../lib/apiClient";
import Swal from "sweetalert2";

// ✨ IMPORT MODAL REVIEW MỚI ✨
import ReviewRefundModal from "@/components/modals/ReviewRefundModal"; 
import ReviewReprintModal from "@/components/modals/ReviewReprintModal"; 

// --- MOCK DATA SETUP ---
const MOCK_REVIEW_REQUESTS = [
    // 1. REFUND - CẤP ĐỘ DETAIL (Pending - Partial Refund)
    {
        id: 201,
        type: 'REFUND',
        orderId: 1001,
        orderCode: 'ORD-A1001-REF',
        productName: 'Custom Shape Suncatcher Mix',
        status: 'PENDING',
        requestedAmount: 1500,
        reason: 'Sản phẩm bị trầy xước nhẹ ở mặt in, khách yêu cầu hoàn tiền 50% chi phí sản phẩm.',
        proofUrl: 'https://cdn.example.com/proof/201_photo.jpg',
        dateRequested: '2025-11-23T10:00:00Z',
        items: [
            { id: 347, name: 'Suncatcher Mix', sku: 'VAR-2', quantity: 1, originalPrice: 3000, refundAmount: 1500 }
        ]
    },
    // 2. REPRINT - CẤP ĐỘ ORDER-WIDE (Pending - Production Error)
    {
        id: 202,
        type: 'REPRINT',
        orderId: 1002,
        orderCode: 'ORD-B2002-REP',
        productName: 'Order-Level',
        status: 'PENDING',
        requestedAmount: 0, 
        reason: 'Lỗi sản xuất hàng loạt (Màu nhuộm bị sai tông) cho 2 sản phẩm.',
        detailReason: 'Cần in lại toàn bộ lô hàng T-Shirt và Mugs do lỗi máy in.',
        needsDesignChange: false,
        newDesignFileUrl: null,
        dateRequested: '2025-11-23T11:00:00Z',
        items: [
            { id: 501, name: 'T-Shirt Pro - M', sku: 'TS-M', quantity: 5, originalPrice: 5000, reprintSelected: true },
            { id: 502, name: 'Coffee Mug 11oz', sku: 'MUG-11', quantity: 10, originalPrice: 3000, reprintSelected: true }
        ]
    },
    // 3. REFUND - CẤP ĐỘ DETAIL (Approved - Đã Duyệt)
    {
        id: 203,
        type: 'REFUND',
        orderId: 1003,
        orderCode: 'ORD-C3003-REF',
        productName: 'Hoodie Cotton Black',
        status: 'APPROVED',
        requestedAmount: 10000,
        reason: 'Khách hàng nhận sai size.',
        dateRequested: '2025-11-22T09:00:00Z',
        rejectionReason: null,
        items: [
            { id: 601, name: 'Hoodie Black XL', sku: 'HOOD-XL', quantity: 1, originalPrice: 10000, refundAmount: 10000 }
        ]
    },
    // 4. REPRINT - CẤP ĐỘ DETAIL (Pending - Needs Design Change)
    {
        id: 204,
        type: 'REPRINT',
        orderId: 1004,
        orderCode: 'ORD-D4004-RED',
        productName: 'Poster A3 Glossy',
        status: 'PENDING',
        requestedAmount: 0,
        reason: 'Khách hàng muốn đổi ảnh (Khách hàng trả phí).',
        detailReason: 'Khách hàng gửi file thiết kế mới qua email, cần sử dụng file này.',
        needsDesignChange: true, // Yêu cầu thay đổi file
        newDesignFileUrl: 'https://cdn.example.com/new_design/d4004_v2.pdf', // File mới đã upload
        dateRequested: '2025-11-24T12:00:00Z',
        items: [
            { id: 701, name: 'Poster A3', sku: 'POSTER-A3', quantity: 2, originalPrice: 500, reprintSelected: true }
        ]
    },
    // 5. REFUND - CẤP ĐỘ ORDER-WIDE (Rejected - Đã Bị Từ Chối)
    {
        id: 205,
        type: 'REFUND',
        orderId: 1005,
        orderCode: 'ORD-E5005-REJ',
        productName: 'Order-Level',
        status: 'REJECTED',
        requestedAmount: 750,
        reason: 'Yêu cầu do khách đổi ý, không thuộc phạm vi bảo hành.',
        rejectionReason: 'Yêu cầu không hợp lệ. Đổi ý không được hoàn tiền.',
        proofUrl: null,
        dateRequested: '2025-11-20T15:00:00Z',
        items: [
            { id: 801, name: 'Sticker Pack A', sku: 'STICK-A', quantity: 1, originalPrice: 750, refundAmount: 750 }
        ]
    },
    // 6. REFUND - CẤP ĐỘ ORDER-WIDE (Pending - Partial Refund cho 1/2 items)
    {
        id: 206,
        type: 'REFUND',
        orderId: 1006,
        orderCode: 'ORD-F6006-PART',
        productName: 'Order-Level',
        status: 'PENDING',
        requestedAmount: 2000,
        reason: 'Chỉ sản phẩm A bị rách bao bì.',
        proofUrl: 'https://cdn.example.com/proof/206_damage.png',
        dateRequested: '2025-11-25T17:00:00Z',
        items: [
            { id: 901, name: 'Key Chain Oval', sku: 'KEY-OV', quantity: 2, originalPrice: 1500, refundAmount: 1500 }, // Selected
            { id: 902, name: 'Pin Button 1inch', sku: 'PIN-1', quantity: 3, originalPrice: 500, refundAmount: 500 } // Selected, but only partial
        ]
    },
    // 7. REPRINT - CẤP ĐỘ DETAIL (Approved)
    {
        id: 207,
        type: 'REPRINT',
        orderId: 1007,
        orderCode: 'ORD-G7007-APP',
        productName: 'Canvas Print 20x30',
        status: 'APPROVED',
        requestedAmount: 0,
        reason: 'Lỗi cắt viền do máy móc (đã xác nhận).',
        detailReason: 'Đã chấp thuận in lại miễn phí.',
        needsDesignChange: false,
        newDesignFileUrl: null,
        dateRequested: '2025-11-20T08:00:00Z',
        items: [
            { id: 1001, name: 'Canvas Print 20x30', sku: 'CANV-20x30', quantity: 1, originalPrice: 15000, reprintSelected: true }
        ]
    }
];

// Hàm Mock Fetch
const mockFetchPendingRequests = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(MOCK_REVIEW_REQUESTS);
        }, 500);
    });
};

const REQUEST_STATUSES = {
  PENDING: { name: "PENDING", color: "bg-yellow-100 text-yellow-800" },
  APPROVED: { name: "APPROVED", color: "bg-green-100 text-green-800" },
  REJECTED: { name: "REJECTED", color: "bg-red-100 text-red-800" },
};


export default function RefundReprintReview() {
  const [currentPage, setCurrentPage] = useState("review-requests");
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); 
  const [selectedRequest, setSelectedRequest] = useState(null); 
  const [showDetailModal, setShowDetailModal] = useState(false); 


  // --- API REVIEW: Gửi quyết định Approve/Reject (Giả định) ---
  // Hàm này được truyền vào các Modal Review để xử lý hành động
  const reviewRequest = async (requestId, requestType, approved, reason = null) => {
    try {
      Swal.fire({ title: "Đang xử lý...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      
      // LOGIC MOCK: Thay đổi trạng thái trong state (thay cho API call)
      const updatedRequests = requests.map(req => 
          req.id === requestId 
              ? { 
                  ...req, 
                  status: approved ? 'APPROVED' : 'REJECTED', 
                  rejectionReason: reason 
                } 
              : req
      );
      setRequests(updatedRequests);
      Swal.close();

      Swal.fire("Thành công!", `${requestType} đã được ${approved ? 'duyệt' : 'từ chối'}.`, "success");
      // Sau khi xử lý xong, đóng modal
      if(showDetailModal) setShowDetailModal(false);
      
    } catch (error) {
      Swal.fire("Thất bại", error.message, "error");
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setIsLoading(true);
      const data = await mockFetchPendingRequests(); 
      // Thêm trường items nếu request là cấp Detail (chỉ để đảm bảo Modal Review nhận mảng)
      const sanitizedData = data.map(req => ({
          ...req,
          items: req.productName !== 'Order-Level' && !req.items ? [{ id: req.id, name: req.productName, sku: 'N/A', quantity: 1, originalPrice: req.requestedAmount, refundAmount: req.requestedAmount }] : req.items
      }));
      setRequests(sanitizedData);
    } catch (err) {
      console.error("Error fetching requests:", err);
      Swal.fire("Lỗi", "Không thể tải danh sách yêu cầu.", "error");
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  // --- HANDLERS (Sử dụng hàm reviewRequest) ---
  // Handler Approve trực tiếp từ bảng (Sẽ gọi lại hàm reviewRequest)
  const handleApprove = (request) => {
    Swal.fire({
      title: `Xác nhận Duyệt ${request.type}?`,
      text: `Duyệt yêu cầu ${request.type} cho đơn ${request.orderCode}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đồng ý Duyệt",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#10b981",
    }).then((result) => {
      if (result.isConfirmed) {
        // Gọi hàm reviewRequest đã định nghĩa ở trên
        reviewRequest(request.id, request.type, true);
      }
    });
  };

  // Handler Reject trực tiếp từ bảng (Sử dụng SweetAlert2 để lấy Reason)
  const handleReject = async (request) => {
    const { value: reason } = await Swal.fire({
      title: `Từ chối yêu cầu ${request.type} #${request.orderCode}`,
      input: "textarea",
      inputPlaceholder: "Nhập lý do từ chối (bắt buộc, tối thiểu 5 ký tự)...",
      showCancelButton: true,
      confirmButtonText: "Từ chối",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
      preConfirm: (value) => {
        if (!value || value.trim().length < 5) {
          Swal.showValidationMessage("Lý do phải ít nhất 5 ký tự!");
        }
        return value;
      },
    });

    if (reason) {
      // Gọi hàm reviewRequest đã định nghĩa ở trên
      reviewRequest(request.id, request.type, false, reason);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  }

  // --- LOGIC FILTERING ---
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.productName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || request.type.toLowerCase() === filterType;

    return matchesSearch && matchesType;
  });

  // --- RENDER HELPERS ---
  const getRequestTypeBadge = (type) => {
    const isRefund = type === 'REFUND';
    const color = isRefund ? "text-red-600" : "text-blue-600";
    return <span className={`font-semibold ${color}`}>{type}</span>;
  };
  
  const getStatusBadge = (status) => {
    const statusInfo = REQUEST_STATUSES[status.toUpperCase()] || REQUEST_STATUSES.PENDING;
    return <Badge className={statusInfo.color}>{statusInfo.name}</Badge>;
  };
  
  // Hàm hiển thị Target Level
  const getTargetBadge = (productName) => {
      const isOrderLevel = productName === 'Order-Level';
      if (isOrderLevel) {
          return <Badge className="bg-red-100 text-red-800 border border-red-300">ORDER-WIDE</Badge>;
      }
      return <Badge className="bg-blue-100 text-blue-800 border border-blue-300">DETAIL</Badge>;
  };


  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ManagerHeader />
        
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Review Requests (Refund/Reprint)
          </h1>
          <p className="text-gray-600 mt-1">
            Duyệt và từ chối các yêu cầu Hoàn tiền/In lại từ Seller.
          </p>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="space-y-6">
            
            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by Order Code or Reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md w-full md:w-auto text-sm"
              >
                <option value="all">All Types</option>
                <option value="refund">Refund</option>
                <option value="reprint">Reprint</option>
              </select>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-6 w-6 text-blue-600 animate-spin mr-2" />
                  <span className="text-gray-600">Loading requests...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead>Type</TableHead>
                      <TableHead>Target Level</TableHead> 
                      <TableHead>Order Code</TableHead>
                      <TableHead>Product/Detail</TableHead>
                      <TableHead>Requested Amount</TableHead>
                      <TableHead>Reason Summary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                          Không có yêu cầu nào đang chờ xử lý.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests.map((request) => {
                        const isOrderLevel = request.productName === 'Order-Level';
                        const displayProduct = isOrderLevel ? 'ALL ITEMS' : request.productName;
                        
                        return (
                          <TableRow key={request.id} className={isOrderLevel ? 'bg-red-50/50 hover:bg-red-50 border-y-2 border-red-200' : 'hover:bg-gray-50'}>
                            <TableCell>{getRequestTypeBadge(request.type)}</TableCell>
                            
                            {/* Cột Target Level */}
                            <TableCell>{getTargetBadge(request.productName)}</TableCell>

                            <TableCell className="font-medium">{request.orderCode}</TableCell>
                            
                            <TableCell className="text-sm">
                                {request.type === 'REFUND' ? <DollarSign className="h-3 w-3 inline mr-1 text-red-600" /> : <Printer className="h-3 w-3 inline mr-1 text-blue-600" />}
                                {displayProduct}
                            </TableCell>
                            
                            <TableCell className="font-semibold text-red-600">
                              {request.type === 'REFUND' ? `${request.requestedAmount?.toLocaleString() || 'N/A'} đ` : 'N/A'}
                            </TableCell>
                            
                            <TableCell className="text-sm max-w-xs truncate">{request.reason || request.detailReason || 'N/A'}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                
                                <Button variant="outline" size="sm" onClick={() => handleViewDetails(request)}>
                                  <Eye className="h-4 w-4 mr-1" /> View Details
                                </Button>

                                {request.status === 'PENDING' && (
                                  <>
                                    <Button variant="outline" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200" onClick={() => handleApprove(request)}>
                                      <Check className="h-4 w-4 mr-1" /> Approve
                                    </Button>
                                    <Button variant="outline" size="sm" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200" onClick={() => handleReject(request)}>
                                      <X className="h-4 w-4 mr-1" /> Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* Detail Modal */}
      {selectedRequest && (
          selectedRequest.type === 'REFUND' ? (
              <ReviewRefundModal // Sử dụng Modal Review MỚI
                  isOpen={showDetailModal}
                  onClose={() => setShowDetailModal(false)}
                  requestData={selectedRequest} 
                  onReview={reviewRequest} // Gọi hàm xử lý review
              />
          ) : (
              <ReviewReprintModal // Sử dụng Modal Review MỚI
                  isOpen={showDetailModal}
                  onClose={() => setShowDetailModal(false)}
                  requestData={selectedRequest}
                  onReview={reviewRequest} // Gọi hàm xử lý review
              />
          )
      )}
    </div>
  );
}