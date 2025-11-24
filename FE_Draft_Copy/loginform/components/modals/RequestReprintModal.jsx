// File: components/modals/RequestReprintModal.jsx (CẬP NHẬT)

"use client";

import { useState } from 'react';
import { X, Printer, FileText } from 'lucide-react';

export default function RequestReprintModal({ isOpen, onClose, productDetail, onSubmit }) {
    if (!isOpen) return null;

    // --- 1. XÁC ĐỊNH KIỂU DỮ LIỆU & LẤY DANH SÁCH SẢN PHẨM ---
    const isOrderLevel = productDetail.products && Array.isArray(productDetail.products);
    const productList = isOrderLevel ? productDetail.products : [productDetail];
    
    // --- STATE VÀ LOGIC CHUNG ---
    const [reasonType, setReasonType] = useState('PROD_ERROR');
    const [detailReason, setDetailReason] = useState('');
    const [needsDesignChange, setNeedsDesignChange] = useState(false);
    const [newDesignFile, setNewDesignFile] = useState(null);

    // State theo dõi selection cho từng sản phẩm (chỉ cần ID và selection)
    const [itemSelection, setItemSelection] = useState(() => {
        return productList.reduce((acc, item) => {
            acc[item.id] = !isOrderLevel; // Mặc định chọn nếu là cấp Product
            return acc;
        }, {});
    });

    const handleItemSelect = (id, isChecked) => {
        setItemSelection(prev => ({
            ...prev,
            [id]: isChecked
        }));
    };

    const handleSubmit = () => {
        const selectedItems = Object.entries(itemSelection)
            .filter(([id, selected]) => selected)
            .map(([id]) => ({
                orderDetailId: Number(id)
            }));
        
        if (!detailReason || selectedItems.length === 0 || (needsDesignChange && !newDesignFile)) {
            alert("Please fill out the reason, select products, and provide a new design file if requested.");
            return;
        }

        onSubmit({
            orderId: isOrderLevel ? productDetail.id : productDetail.orderId,
            reasonType: reasonType,
            detailReason: detailReason,
            selectedItems: selectedItems,
            newDesignFile: newDesignFile,
        });
        onClose();
    };

    // --- RENDER ---
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b flex-shrink-0">
                    <h3 className="text-xl font-semibold text-blue-600 flex items-center gap-2">
                        <Printer className="h-6 w-6" /> Request Reprint ({isOrderLevel ? `Order: ${productDetail.id}` : `Product: ${productList[0]?.name}`})
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    
                    {/* 1. Product Selection Table (CHỈ HIỆN KHI LÀ CẤP ORDER) */}
                    {isOrderLevel && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3">
                                1. Select Items for Reprint
                            </h4>
                            <div className="border border-gray-200 rounded-lg overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        {/* Header Table */}
                                        {/* ... */}
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {productList.map((item) => {
                                            return (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-2">
                                                        <input type="checkbox" checked={itemSelection[item.id]} onChange={(e) => handleItemSelect(item.id, e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                                        {item.name} <span className="text-xs text-gray-500">(SKU: {item.sku})</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-700 font-semibold">
                                                        {item.productionCost}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Reason Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason Type</label>
                        <select 
                            value={reasonType} 
                            onChange={(e) => setReasonType(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            <option value="PROD_ERROR">Production Error (Free Reprint)</option>
                            <option value="CUSTOMER_CHANGE">Customer Change (May incur cost)</option>
                        </select>
                    </div>
                    
                    {/* Detail Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Reason (Required)</label>
                        <textarea
                            value={detailReason}
                            onChange={(e) => setDetailReason(e.target.value)}
                            rows="4"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Describe the issue or the requested change..."
                        />
                    </div>

                    {/* Design Change Checkbox */}
                    <div className="flex items-center">
                        <input 
                            id="design-change"
                            type="checkbox" 
                            checked={needsDesignChange}
                            onChange={(e) => setNeedsDesignChange(e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <label htmlFor="design-change" className="ml-2 text-sm text-gray-900">
                            Requires Design File Change?
                        </label>
                    </div>

                    {/* New Design File (Conditional) */}
                    {needsDesignChange && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Design File (Required)</label>
                            <input 
                                type="file" 
                                onChange={(e) => setNewDesignFile(e.target.files[0])}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-5 border-t">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        Submit Reprint Request
                    </button>
                </div>
            </div>
        </div>
    );
}