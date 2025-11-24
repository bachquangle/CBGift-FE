// File: components/modals/ReviewRefundModal.jsx (ĐÃ SỬA LỖI TRUY CẬP ITEMS)

"use client";

import { useState } from 'react';
import { X, DollarSign, Check, X as RejectIcon, Image, FileText, Zap } from 'lucide-react'; 
import { Textarea } from "@/components/ui/textarea"; 
import { Button } from "@/components/ui/button"; 

// Props: requestData (dữ liệu yêu cầu), onReview (hàm xử lý Approve/Reject)
export default function ReviewRefundModal({ 
    isOpen, 
    onClose, 
    requestData, 
    onReview 
}) {
    if (!isOpen || !requestData) return null;

    const request = requestData;
    const isPending = request.status === 'PENDING';
    
    // State cho việc Manager nhập lý do từ chối
    const [rejectionReason, setRejectionReason] = useState(request.rejectionReason || '');
    const [isRejecting, setIsRejecting] = useState(false); 
    
    // Tính toán dữ liệu hiển thị
    const isOrderLevel = request.productName === 'Order-Level';
    const totalRefundAmount = request.requestedAmount || 0;
    
    // ✨ FIX LỖI: Sử dụng request.items (từ mock data) ✨
    // Fallback sang mảng rỗng nếu không có dữ liệu
    const requestedItems = request.items || []; 


    // Hàm gọi review action
    const handleReview = (approved) => {
        if (!approved && isRejecting && rejectionReason.trim() === '') {
            alert("Vui lòng nhập lý do từ chối.");
            return;
        }
        
        // Cần đảm bảo hàm onReview được truyền đúng Order ID, Request Type, Approval status và Reason
        onReview(request.id, request.type, approved, approved ? null : rejectionReason);
        onClose();
    };

    // --- RENDER ---
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-lg shadow-xl w-full max-w-2xl`}>
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b flex-shrink-0">
                    <h3 className="text-xl font-semibold text-red-600 flex items-center gap-2">
                        <Zap className="h-6 w-6" /> Review Refund Request #{request.id} (Order: {request.orderCode})
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto flex-1">
                    
                    {/* 1. Status & Summary */}
                    <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-red-50">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Status</p>
                            <span className={`font-bold text-lg ${isPending ? 'text-yellow-600' : (request.status === 'APPROVED' ? 'text-green-600' : 'text-red-600')}`}>
                                {request.status}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Requested Refund Amount</p>
                            <p className="text-xl font-bold text-red-600">
                                {totalRefundAmount.toLocaleString()} đ
                            </p>
                        </div>
                        <div className="col-span-2">
                             <p className="text-xs text-gray-500 font-medium">Target Level</p>
                             <span className={`font-semibold text-sm ${isOrderLevel ? 'text-red-700' : 'text-blue-700'}`}>
                                {isOrderLevel ? 'ORDER-WIDE (Multiple Items)' : `DETAIL: ${request.productName}`}
                            </span>
                        </div>
                    </div>

                    {/* 2. Items for Refund (Read-Only Table) */}
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            Items Requested for Refund ({requestedItems.length} items)
                        </h4>
                        <div className="border border-gray-200 rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product (SKU)</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Original Price</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-red-600">Refund Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {requestedItems.length > 0 ? (
                                        requestedItems.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                                    {item.name} <span className="text-xs text-gray-500">({item.sku})</span>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-700">
                                                    {item.quantity || 1}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-700">
                                                    {item.originalPrice?.toLocaleString() || '0'} đ
                                                </td>
                                                <td className="px-4 py-2 text-sm font-semibold text-red-600">
                                                    {item.refundAmount?.toLocaleString() || '0'} đ
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-4 text-gray-500 italic">
                                                No item details available in this request.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 3. Reason & Proof */}
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Reason Provided by Seller</h4>
                        <div className="p-3 border border-gray-300 rounded-md bg-gray-50 whitespace-pre-wrap">
                            {request.reason || "No detailed reason provided."}
                        </div>
                    </div>
                    
                    {/* 4. Manager Rejection Input */}
                    {isPending && (
                        <div className={`border p-4 rounded-lg transition-all ${isRejecting ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
                            <h4 className="font-semibold text-gray-700 mb-2">
                                Manager Decision
                            </h4>
                            <div className="flex gap-3 mb-3">
                                <Button onClick={() => setIsRejecting(false)} className={!isRejecting ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}>
                                    Approve
                                </Button>
                                <Button onClick={() => setIsRejecting(true)} className={isRejecting ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400'}>
                                    Reject
                                </Button>
                            </div>
                            
                            {isRejecting && (
                                <div>
                                    <label className="block text-sm font-medium text-red-700 mb-1">Rejection Reason (Required)</label>
                                    <Textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows="3"
                                        placeholder="Enter detailed reason for rejection..."
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* 5. Proof */}
                    {request.proofUrl && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1">
                                <Image className="h-4 w-4 text-gray-600" /> Proof Link
                            </h4>
                            <a href={request.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                                {request.proofUrl}
                            </a>
                        </div>
                    )}
                    
                </div>

                {/* Footer - Review Actions */}
                <div className="flex justify-end gap-3 p-5 border-t flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Close
                    </button>
                    {isPending && (
                        <button 
                            onClick={() => handleReview(!isRejecting)} 
                            className={`px-4 py-2 text-sm font-medium text-white ${!isRejecting ? 'bg-green-600' : 'bg-red-600'}`}
                            disabled={isRejecting && rejectionReason.trim() === ''}
                        >
                            {isRejecting ? 'Confirm Reject' : 'Confirm Approve'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}