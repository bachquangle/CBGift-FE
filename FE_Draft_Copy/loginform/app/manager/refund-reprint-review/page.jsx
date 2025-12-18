// File: app/manager/refund-reprint-review/page.jsx (Updated with Status Filter)

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
    X, Check, DollarSign, Printer, Search, Loader, Eye, ChevronLeft, ChevronRight
} from "lucide-react";
import apiClient from "../../../lib/apiClient";
import Swal from "sweetalert2";

// Import Modals (đã giả định tồn tại)
import ReviewRefundModal from "@/components/modals/ReviewRefundModal";
import ReviewReprintModal from "@/components/modals/ReviewReprintModal";

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
    
    // STATE QUAN TRỌNG: Mặc định là 'refund'
    const [filterType, setFilterType] = useState("refund"); // 'refund' hoặc 'reprint' 
    
    // ✨ STATE MỚI: LỌC THEO STATUS ✨
    const [statusFilter, setStatusFilter] = useState("pending"); // Mặc định là 'pending'

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    // STATE PHÂN TRANG
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRequests, setTotalRequests] = useState(0); 

    // --- HELPER: GET BASE PARAMS ---
    const getBaseParams = () => {
        const params = new URLSearchParams();
        if (searchTerm) params.append("searchTerm", searchTerm);
        
        // ✨ THÊM PARAM STATUS FILTER VÀO QUERY STRING ✨
        if (statusFilter && statusFilter !== 'all') {
            params.append("statusFilter", statusFilter); 
        }

        params.append("page", page);
        params.append("pageSize", pageSize);
        return params.toString();
    }

    // --- API FETCH: REFUND (Có phân trang) ---
    const fetchRefundRequestsPaginated = async (params) => {
        try {
            const apiUrl = `${apiClient.defaults.baseURL}/api/Refund/pending-requests-paginated?${params}`;
            const res = await fetch(apiUrl, { credentials: "include" });
            if (!res.ok) return { items: [], total: 0 };
            
            const result = await res.json();
            const mappedItems = (result.items || []).map(item => ({
                ...item,
                type: 'REFUND', // Đảm bảo type được set đúng
                requestedAmount: item.totalRequestedAmount,
                reason: item.reasonSummary,
            }));
            return { items: mappedItems, total: result.total };
        } catch (err) {
            console.error("Error fetching Refund requests:", err);
            return { items: [], total: 0 };
        }
    };

    // --- API FETCH: REPRINT (Có phân trang) ---
    const fetchReprintRequestsPaginated = async (params) => {
        try {
            const apiUrl = `${apiClient.defaults.baseURL}/api/Reprint/reprint-requests-paginated?${params}`;
            const res = await fetch(apiUrl, { credentials: "include" });
            if (!res.ok) return { items: [], total: 0 };

            const result = await res.json();
            const mappedItems = (result.items || []).map(item => ({
                ...item,
                type: 'REPRINT', // Đảm bảo type được set đúng
                requestedAmount: 0, 
                reason: item.reasonSummary,
                id: item.primaryReprintId,
            }));
            return { items: mappedItems, total: result.total };
        } catch (err) {
            console.error("Error fetching Reprint requests:", err);
            return { items: [], total: 0 };
        }
    };


    // --- API FETCH LIST REQUESTS (Chỉ fetch 1 loại) ---
    const fetchRequests = async () => {
        try {
            setIsLoading(true);
            const params = getBaseParams();

            let result;
            if (filterType === 'refund') {
                result = await fetchRefundRequestsPaginated(params);
            } else if (filterType === 'reprint') {
                result = await fetchReprintRequestsPaginated(params);
            } else {
                result = { items: [], total: 0 }; 
            }
            
            setRequests(result.items);
            setTotalRequests(result.total); 

        } catch (err) {
            Swal.fire("Error", "Could not load review list.", "error");
            setRequests([]);
            setTotalRequests(0);
        } finally {
            setIsLoading(false);
        }
    };


    // --- HÀM 1: REVIEW REFUND (Dùng Path Parameter ID) ---
const reviewRefundRequest = async (refundIdToPass, approved, rejectionReason = null) => {
    const requestType = 'REFUND';
    try {
        if (!refundIdToPass) throw new Error("Refund ID is missing.");

        const endpoint = `${apiClient.defaults.baseURL}/api/Refund/${refundIdToPass}/review`;
        const bodyContent = { approved, rejectionReason };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(bodyContent)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.message || (errorData.errors ? JSON.stringify(errorData.errors) : `${requestType} Review failed with status: ${response.status}`);
            throw new Error(errorMsg);
        }
        return true; // Trả về thành công
    } catch (error) {
        throw error;
    }
};

// --- HÀM 2: REVIEW REPRINT (Dùng Body List OriginalOrderDetailIds) ---
const reviewReprintRequest = async (originalOrderDetailIds, approved, rejectionReason = null) => {
    const requestType = 'REPRINT';
    try {
        if (!Array.isArray(originalOrderDetailIds) || originalOrderDetailIds.length === 0) {
            throw new Error("Reprint requires a list of OriginalOrderDetailIds.");
        }
        
        const endpoint = `${apiClient.defaults.baseURL}/api/Reprint/${approved ? 'approve' : 'reject'}`;
        
        const bodyContent = {
            originalOrderDetailIds: originalOrderDetailIds, // List<int>
            rejectReason: approved ? "approved" : rejectionReason 
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(bodyContent)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.message || (errorData.errors ? JSON.stringify(errorData.errors) : `${requestType} Review failed with status: ${response.status}`);
            throw new Error(errorMsg);
        }
        return true; // Trả về thành công
    } catch (error) {
        throw error;
    }
};


// --- HÀM ĐIỀU PHỐI (Chuyển đổi thành onReview để truyền vào Modal) ---
const reviewRequest = async (idOrIds, requestType, approved, rejectionReason = null) => {
    try {
        Swal.fire({ title: "Processing...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        let success = false;

        if (requestType === 'REFUND') {
            // idOrIds là RefundId (số)
            success = await reviewRefundRequest(idOrIds, approved, rejectionReason);
        } else if (requestType === 'REPRINT') {
            // idOrIds là List<OriginalOrderDetailIds> (mảng)
            success = await reviewReprintRequest(idOrIds, approved, rejectionReason);
        }

        if (success) {
            Swal.close();
            Swal.fire("Success! 🎉", `${requestType} request has been ${approved ? 'approved' : 'rejected'}.`, "success");

            setShowDetailModal(false);
            fetchRequests(); // Tải lại danh sách
        }
    } catch (error) {
        Swal.fire("Submission Failed", error.message, "error");
    }
  };

    // --- API FETCH DETAIL (Giữ nguyên) ---
    const fetchRequestDetails = async (request) => {
        try {
            const baseApi = request.type === 'REFUND' ? 'Refund' : 'Reprint';
            // Sử dụng id đã được ánh xạ (primaryRefundId/primaryReprintId)
            const primaryId = request.type === 'REFUND' ? request.primaryRefundId : request.id; 
            
            const endpoint = `${apiClient.defaults.baseURL}/api/${baseApi}/${primaryId}/details`;
            const res = await fetch(endpoint, { credentials: "include" });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to load details: ${res.status}`);
            }

            return await res.json();
        } catch (err) {
            Swal.fire("Error", `Cannot load detail: ${err.message}`, "error");
            return null;
        }
    }


    const handleViewDetails = async (request) => {
        Swal.fire({ title: "Loading Details...", showConfirmButton: false, didOpen: () => Swal.showLoading() });
        const fullData = await fetchRequestDetails(request);
        Swal.close();

        if (fullData) {
            setSelectedRequest({
                ...request,
                ...fullData,
                type: request.type, // Đảm bảo type không bị mất
            });
            setShowDetailModal(true);
        }
    }

    const handleApprove = (request) => {
        Swal.fire({
            title: `Confirm Approve ${request.type}?`,
            text: `Are you sure you want to approve request #${request.id}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Approve",
            confirmButtonColor: "#10b981",
        }).then((result) => {
            if (result.isConfirmed) {
                reviewRequest(request.id, request.type, true);
            }
        });
    };

    const handleReject = async (request) => {
        const { value: reason } = await Swal.fire({
            title: `Reject Request #${request.id} - Reason:`,
            input: "textarea",
            inputPlaceholder: "Enter rejection reason (required)...",
            showCancelButton: true,
            confirmButtonText: "Reject",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#ef4444",
            preConfirm: (value) => {
                if (!value || value.trim().length < 5) {
                    Swal.showValidationMessage("Reason must be at least 5 characters!");
                }
                return value;
            },
        });

        if (reason) {
            reviewRequest(request.id, request.type, false, reason);
        }
    };


    // LOGIC CHUYỂN TRANG
    const handlePageChange = (newPage) => {
        const totalPages = Math.ceil(totalRequests / pageSize);
        if (newPage > 0 && newPage <= totalPages) {
            setPage(newPage);
        }
    };
    
    // HANDLER CHỌN LOẠI (cho nút bấm Refund/Reprint)
    const handleTypeSelect = (type) => {
        if (filterType !== type) {
            setFilterType(type);
            setPage(1); // Reset trang về 1 khi đổi loại
            setSearchTerm(""); // Reset tìm kiếm
            setStatusFilter("pending"); // Reset status về pending khi đổi loại
        }
    }
    
    // --- EFFECTS ---
    useEffect(() => {
        // Tải lại dữ liệu khi filterType, searchTerm, page, pageSize hoặc statusFilter thay đổi
        fetchRequests();
    }, [filterType, searchTerm, page, pageSize, statusFilter]); 

    // --- RENDER HELPERS ---
    const totalPages = Math.ceil(totalRequests / pageSize);

    const getRequestTypeBadge = (type) => {
        const isRefund = type === 'REFUND';
        const color = isRefund ? "text-red-600" : "text-blue-600";
        return <span className={`font-semibold ${color}`}>{type}</span>;
    };

    const getStatusBadge = (status) => {
        const statusInfo = REQUEST_STATUSES[status.toUpperCase()] || REQUEST_STATUSES.PENDING;
        return <Badge className={statusInfo.color}>{statusInfo.name}</Badge>;
    };

    const getTargetBadge = (targetLevel) => {
        const isOrderLevel = targetLevel === 'ORDER-WIDE';
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
                        Review Requests ({filterType.toUpperCase()})
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Duyệt và từ chối các yêu cầu {filterType === 'refund' ? 'Hoàn tiền' : 'In lại'} từ Seller.
                    </p>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="space-y-6">

                        {/* Search, Type Buttons, Status Filter, and PageSize */}
                        <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row gap-4 justify-between items-center">
                            
                            {/* Type Buttons */}
                            <div className="flex gap-2">
                                <Button 
                                    variant={filterType === 'refund' ? 'default' : 'outline'} 
                                    onClick={() => handleTypeSelect('refund')}
                                    className={filterType === 'refund' ? 'bg-red-600 hover:bg-red-700 text-white' : 'border-red-300 text-red-600 hover:bg-red-50'}
                                >
                                    <DollarSign className="h-4 w-4 mr-2" /> Refund Requests
                                </Button>
                                <Button 
                                    variant={filterType === 'reprint' ? 'default' : 'outline'} 
                                    onClick={() => handleTypeSelect('reprint')}
                                    className={filterType === 'reprint' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}
                                >
                                    <Printer className="h-4 w-4 mr-2" /> Reprint Requests
                                </Button>
                            </div>

                            <div className="flex gap-4 w-full md:w-auto">
                                {/* Search */}
                                <div className="flex-1 relative min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder={`Search ${filterType} by Order Code/Reason...`}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                
                                {/* ✨ FILTER STATUS MỚI ✨ */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1); // Reset trang khi thay đổi status
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-md w-full md:w-auto text-sm"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="all">All Statuses</option>
                                </select>
                                
                                {/* PageSize */}
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-md w-full md:w-auto text-sm"
                                >
                                    <option value={10}>10 per page</option>
                                    <option value={20}>20 per page</option>
                                    <option value={50}>50 per page</option>
                                </select>
                            </div>
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
                                        {requests.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                                    Không có yêu cầu {filterType} nào với trạng thái "{statusFilter === 'all' ? 'bất kỳ' : statusFilter}".
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            requests.map((request) => {
                                                const isOrderLevel = request.targetLevel === 'ORDER-WIDE';
                                                const displayProduct = isOrderLevel ? `ALL ITEMS (${request.countOfItems || 1})` : request.productName;

                                                return (
                                                    <TableRow 
                                                        key={request.id || request.primaryRefundId || request.primaryReprintId} 
                                                        className={isOrderLevel && request.type === 'REFUND' ? 'bg-red-50/50 hover:bg-red-50 border-y-2 border-red-200' : 'hover:bg-gray-50'}
                                                    >
                                                        <TableCell>{getRequestTypeBadge(request.type)}</TableCell>
                                                        <TableCell>{getTargetBadge(request.targetLevel)}</TableCell>
                                                        <TableCell className="font-medium">{request.orderCode}</TableCell>

                                                        <TableCell className="text-sm">
                                                            {request.type === 'REFUND' ? <DollarSign className="h-3 w-3 inline mr-1 text-red-600" /> : <Printer className="h-3 w-3 inline mr-1 text-blue-600" />}
                                                            {displayProduct}
                                                        </TableCell>

                                                        <TableCell className="font-semibold text-red-600">
                                                            {request.type === 'REFUND' ? `${request.requestedAmount?.toLocaleString() || '0'} đ` : 'N/A'}
                                                        </TableCell>

                                                        <TableCell className="text-sm max-w-xs truncate">{request.reason || 'N/A'}</TableCell>
                                                        <TableCell>{getStatusBadge(request.status)}</TableCell>

                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">

                                                                <Button variant="outline" size="sm" onClick={() => handleViewDetails(request)}>
                                                                    <Eye className="h-4 w-4 mr-1" /> View Details
                                                                </Button>

                                                                {/* {request.status.toUpperCase() === 'PENDING' && (
                                                                    <>
                                                                        <Button variant="outline" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200" onClick={() => handleApprove(request)}>
                                                                            <Check className="h-4 w-4 mr-1" /> Approve
                                                                        </Button>
                                                                        <Button variant="outline" size="sm" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200" onClick={() => handleReject(request)}>
                                                                            <X className="h-4 w-4 mr-1" /> Reject
                                                                        </Button>
                                                                    </>
                                                                )} */}
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
                        
                        {/* PHÂN TRANG CONTROL */}
                        {totalRequests > 0 && totalPages > 1 && (
                            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow mt-4">
                                <div className="text-sm text-gray-700">
                                    Page {page} of {totalPages} ({totalRequests} total {filterType} requests)
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                                    </Button>
                                    <div className="px-2 py-1 text-sm border rounded-md flex items-center">{page}</div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page === totalPages}
                                    >
                                        Next <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* Detail Modal */}
            {selectedRequest && (
                selectedRequest.type === 'REFUND' ? (
                    <ReviewRefundModal
                        isOpen={showDetailModal}
                        onClose={() => setShowDetailModal(false)}
                        requestData={selectedRequest}
                        onReview={reviewRequest}
                    />
                ) : (
                    <ReviewReprintModal
                        isOpen={showDetailModal}
                        onClose={() => setShowDetailModal(false)}
                        requestData={selectedRequest}
                        onReview={reviewRequest}
                    />
                )
            )}
        </div>
    );
}