// File: components/modals/ReviewReprintModal.jsx

"use client";

import { useState } from 'react';
import { X, Printer, Check, X as RejectIcon, FileText, Upload } from 'lucide-react';
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
    const isPending = request.status === 'PENDING';
    
    const [rejectionReason, setRejectionReason] = useState(request.rejectionReason || '');
    const [isRejecting, setIsRejecting] = useState(false); 
    
    const isOrderLevel = request.productName === 'Order-Level';

    // Hàm gọi review action
    const handleReview = (approved) => {
        if (!approved && isRejecting && rejectionReason.trim() === '') {
            alert("Vui lòng nhập lý do từ chối.");
            return;
        }
        
        onReview(request.id, request.type, approved, approved ? null : rejectionReason);
        onClose();
    };

    // Giả định: Dữ liệu chi tiết sản phẩm nằm trong trường 'requestedItems'
    const requestedItems = request.requestedItems || [
        { id: 1, name: request.productName, sku: 'SKU001', quantity: 1 }
    ].filter(item => item.name !== 'Order-Level');
    
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
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Reason Type</p>
                            <span className="text-lg font-bold text-blue-600">
                                {request.reasonType === 'CUSTOMER_CHANGE' ? 'Customer Change' : 'Production Error'}
                            </span>
                        </div>
                        <div className="col-span-2">
                             <p className="text-xs text-gray-500 font-medium">Target Level</p>
                             <span className={`font-semibold text-sm ${isOrderLevel ? 'text-red-700' : 'text-blue-700'}`}>
                                {isOrderLevel ? 'ORDER-WIDE (All Items)' : `DETAIL: ${request.productName}`}
                            </span>
                        </div>
                    </div>

                    {/* 2. Items for Reprint (Read-Only Table) */}
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                            Items Requested for Reprint
                        </h4>
                        <div className="border border-gray-200 rounded-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product (SKU)</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {requestedItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                                {item.name} <span className="text-xs text-gray-500">({item.sku})</span>
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-700">
                                                {item.quantity || 1}
                                            </td>
                                            <td className="px-4 py-2 text-sm font-semibold text-blue-600">
                                                {item.reprintSelected ? 'Selected' : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 3. Detail Reason */}
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">
                            Detailed Reason Provided
                        </h4>
                        <div className="p-3 border border-gray-300 rounded-md bg-gray-50 whitespace-pre-wrap">
                            {request.reason || request.detailReason || "No detailed reason provided."}
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


                    {/* 5. New Design File Link (Conditional) */}
                    {(request.newDesignFileUrl || request.needsDesignChange) && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-1">
                                <Upload className="h-4 w-4 text-gray-600" /> Design File Requirement
                            </h4>
                            <div className={`p-3 rounded-md font-medium ${request.needsDesignChange ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                {request.needsDesignChange ? 'Requires NEW Design File' : 'Uses OLD Design File'}
                            </div>
                            {request.newDesignFileUrl && (
                                <a href={request.newDesignFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm break-all block mt-2">
                                    View Uploaded File
                                </a>
                            )}
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