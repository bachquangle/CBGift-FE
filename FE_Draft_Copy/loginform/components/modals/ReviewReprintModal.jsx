// File: components/modals/ReviewReprintModal.jsx

"use client";

import { useState } from 'react';
import { X, Printer, Check, X as RejectIcon, FileText, Upload, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'; // Import LinkIcon, ImageIcon
import { Textarea } from "@/components/ui/textarea"; 
import { Button } from "@/components/ui/button"; 

export default function ReviewReprintModal({ 
    isOpen, 
    onClose, 
    requestData, 
    onReview 
}) {
    if (!isOpen || !requestData) return null;

    const request = requestData;
    const isPending = request.status;
    
    const [rejectionReason, setRejectionReason] = useState(request.rejectionReason || '');
    const [isRejecting, setIsRejecting] = useState(false); 
    
    // LƯU Ý: Nếu Reprint luôn là cấp DETAIL, có thể bỏ isOrderLevel
    const isOrderLevel = request.targetLevel === 'ORDER-WIDE'; 
    
    // Hàm gọi review action (giữ nguyên)
   const handleReview = (approved) => {
    if (!approved && isRejecting && rejectionReason.trim() === '') {
        alert("Vui lòng nhập lý do từ chối.");
        return;
    }
    
    // 🎯 FIX LỖI: LẤY TẤT CẢ OriginalOrderDetailId từ mảng requestedItems
    const orderDetailIdsToPass = request.requestedItems 
        ? request.requestedItems.map(item => item.orderDetailId) 
        : []; 
    
    // Debugging: Kiểm tra xem mảng ID có được thu thập không
    // console.log("IDs to be passed for review:", orderDetailIdsToPass);

    if (orderDetailIdsToPass.length === 0) {
          alert("Lỗi: Không tìm thấy ID sản phẩm gốc (OriginalOrderDetailId) để duyệt. Vui lòng kiểm tra API Detail.");
          return;
    }
    
    // Truyền MẢNG ID (vd: [399, 400]) làm tham số đầu tiên (requestId)
    // onReview sẽ nhận: ([int, int], 'REPRINT', bool, string/null)
    onReview(orderDetailIdsToPass, request.type, approved, approved ? null : rejectionReason);
    // Bỏ onClose()
    };
    // Giả định: Dữ liệu chi tiết sản phẩm nằm trong trường 'requestedItems'
    const requestedItems = request.requestedItems || [];
    
    // --- RENDER ---
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-lg shadow-xl w-full max-w-2xl`}>
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b flex-shrink-0">
                    <h3 className="text-xl font-semibold text-blue-600 flex items-center gap-2">
                        <Printer className="h-6 w-6" /> Review Reprint Request #{request.id} (Order: {request.orderCode})
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto flex-1">
                    
                    {/* 1. Status & Summary */}
                    <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-blue-50">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Status</p>
                            <span className={`font-bold text-lg ${isPending ? 'text-yellow-600' : (request.status === 'APPROVED' ? 'text-green-600' : 'text-red-600')}`}>
                                {request.status}
                            </span>
                        </div>
                        <div className="col-span-2">
                             <p className="text-xs text-gray-500 font-medium">Target Level</p>
                             <span className={`font-semibold text-sm ${isOrderLevel ? 'text-red-700' : 'text-blue-700'}`}>
                                 {request.targetLevel || (isOrderLevel ? 'ORDER-WIDE' : 'DETAIL')}
                             </span>
                        </div>
                    </div>

                    {/* 2. Detail Reason */}
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1">
                            <FileText className="h-4 w-4 text-gray-600" /> Request Reason
                        </h4>
                        <div className="p-3 border border-gray-300 rounded-md bg-gray-50 whitespace-pre-wrap">
                            {request.reason || "No detailed reason provided."}
                        </div>
                    </div>

                    {/* 3. Proof URL (Link Bằng chứng) */}
                    {request.proofUrl && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1">
                                <ImageIcon className="h-4 w-4 text-gray-600" /> Seller Proof / Design File
                            </h4>
                            <a 
                                href={request.proofUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 break-all p-3 border border-blue-200 rounded-md bg-blue-50 transition"
                            >
                                <LinkIcon className="h-4 w-4" />
                                <span className="text-sm font-medium">{request.proofUrl}</span>
                            </a>
                        </div>
                    )}
                    
                    {/* 4. Items for Reprint (Read-Only Table) */}
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            Items Requested for Reprint ({requestedItems.length} item(s))
                        </h4>
                        <div className="border border-gray-200 rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product (SKU)</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Reprint</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {requestedItems.length > 0 ? requestedItems.map((item) => (
                                        <tr key={item.orderDetailId}>
                                            <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                                {item.productName} <span className="text-xs text-gray-500">({item.sku})</span>
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-700">
                                                {item.quantity || 1}
                                            </td>
                                            <td className="px-4 py-2 text-sm font-semibold text-blue-600">
                                                {item.reprintSelected ? 'YES' : 'NO'}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                                                No items found in detail data.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    
                    {request.rejectionReason && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-2 text-red-500">
                                Rejection Reason (Manager)
                            </h4>
                            <div className="p-3 border border-red-300 rounded-md bg-red-50 whitespace-pre-wrap">
                                {request.rejectionReason}
                            </div>
                        </div>
                    )}

                    {/* 5. Manager Decision Input */}
                    {isPending == "Pending" && (
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
                    
                </div>

                {/* Footer - Review Actions */}
                <div className="flex justify-end gap-3 p-5 border-t flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Close
                    </button>
                    {isPending == "Pending" && (
                        <button 
                            onClick={() => handleReview(!isRejecting)} 
                            className={`px-4 py-2 text-sm font-medium text-white ${!isRejecting ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
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