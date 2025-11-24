// File: components/modals/RequestRefundModal.jsx

"use client";

import { useState, useMemo } from 'react';
import { X, Zap, File } from 'lucide-react'; // Đảm bảo các icon cần thiết được import

export default function RequestRefundModal({ isOpen, onClose, productDetail, onSubmit }) {
    if (!isOpen) return null;

    // --- 1. XÁC ĐỊNH KIỂU DỮ LIỆU & LẤY DANH SÁCH SẢN PHẨM ---
    const isOrderLevel = productDetail.products && Array.isArray(productDetail.products);
    
    // productList: Lấy mảng products (cấp Order) hoặc mảng 1 phần tử (cấp Product)
    const productList = isOrderLevel ? productDetail.products : [productDetail];
    
    // --- STATE VÀ LOGIC CHUNG ---
    const [reason, setReason] = useState('');
    const [proofFiles, setProofFiles] = useState([]);
    
    // State theo dõi số tiền và selection cho từng sản phẩm
    const [itemDetails, setItemDetails] = useState(() => {
        return productList.reduce((acc, item) => {
            acc[item.id] = { 
                selected: !isOrderLevel, // Mặc định chọn nếu là cấp Product
                amount: item.priceRaw || 0 // Giả định đã có priceRaw
            };
            return acc;
        }, {});
    });

    // Tính tổng số tiền hoàn lại hiện tại
    const totalRefundAmount = useMemo(() => {
        return productList.reduce((sum, item) => {
            const detail = itemDetails[item.id];
            if (detail && detail.selected) {
                // Đảm bảo không trả về NaN
                return sum + (Number(detail.amount) || 0); 
            }
            return sum;
        }, 0);
    }, [itemDetails, productList]);

    const handleAmountChange = (id, newAmount) => {
        const maxAmount = productList.find(p => p.id === id)?.priceRaw || 0;
        const validAmount = Math.max(0, Math.min(Number(newAmount), maxAmount));
        
        setItemDetails(prevDetails => ({
            ...prevDetails,
            [id]: { ...prevDetails[id], amount: validAmount }
        }));
    };

    const handleItemSelect = (id, isChecked) => {
        setItemDetails(prevDetails => ({
            ...prevDetails,
            [id]: { ...prevDetails[id], selected: isChecked }
        }));
    };
    
    const handleSubmit = () => {
        const selectedItems = Object.entries(itemDetails)
            .filter(([id, detail]) => detail.selected)
            .map(([id, detail]) => ({
                orderDetailId: Number(id),
                refundAmount: detail.amount
            }));

        if (!reason || selectedItems.length === 0) {
            alert("Vui lòng chọn ít nhất 1 sản phẩm và cung cấp lý do.");
            return;
        }

        onSubmit({
            orderId: isOrderLevel ? productDetail.id : productDetail.orderId,
            reason: reason,
            selectedItems: selectedItems,
            totalRefundAmount: totalRefundAmount,
            proofFiles: proofFiles,
        });
        onClose();
    };
    
    // --- RENDER ---
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-lg shadow-xl w-full ${isOrderLevel ? 'max-w-2xl' : 'max-w-lg'}`}>
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b flex-shrink-0">
                    <h3 className="text-xl font-semibold text-red-600 flex items-center gap-2">
                        <Zap className="h-6 w-6" /> Request Refund ({isOrderLevel ? `Order: ${productDetail.id}` : `Product: ${productList[0]?.name}`})
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto flex-1">
                    
                    {/* 1. Product Selection Table (CHỈ HIỆN KHI LÀ CẤP ORDER) */}
                    {isOrderLevel && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3">
                                1. Select Items for Refund
                            </h4>
                            <div className="border border-gray-200 rounded-lg overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-10">Select</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-24">Price</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-32">Refund Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {productList.map((item) => {
                                            const detail = itemDetails[item.id];
                                            return (
                                                <tr key={item.id} className={detail.selected ? 'bg-red-50' : ''}>
                                                    <td className="px-4 py-2">
                                                        <input type="checkbox" checked={detail.selected} onChange={(e) => handleItemSelect(item.id, e.target.checked)} className="h-4 w-4 text-red-600 border-gray-300 rounded" />
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                                        {item.name} <span className="text-xs text-gray-500">(SKU: {item.sku})</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-700 font-semibold">
                                                        {item.productionCost}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input type="number" value={detail.amount} onChange={(e) => handleAmountChange(item.id, e.target.value)} min="0" max={item.priceRaw} disabled={!detail.selected} className="w-full p-1 border border-gray-300 rounded-md text-sm" />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-sm mt-3 font-semibold text-gray-800">
                                Total Refund: <span className="text-red-600">{totalRefundAmount.toLocaleString()} đ</span>
                            </p>
                        </div>
                    )}
                    
                    {/* 2. Single Product View (CHỈ HIỆN KHI LÀ CẤP PRODUCT) */}
                    {!isOrderLevel && productList[0] && (
                        <div>
                            <p className="text-sm text-gray-600 mb-4">
                                Product: <strong>{productList[0].name}</strong> (SKU: {productList[0].sku})
                            </p>
                            
                            {/* Form cũ cho Single Product (Cần được cải tiến nếu logic phức tạp) */}
                            <div className="space-y-4">
                                
                                {/* Lựa chọn Full/Partial (Giả lập bằng cách đặt vào state) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Refund Type</label>
                                    <select 
                                        value={productList[0].priceRaw === itemDetails[productList[0].id]?.amount ? 'FULL' : 'PARTIAL'} 
                                        onChange={(e) => {
                                            const newAmount = e.target.value === 'FULL' ? productList[0].priceRaw : 0;
                                            handleAmountChange(productList[0].id, newAmount);
                                        }}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="FULL">Full Refund ({productList[0].productionCost})</option>
                                        <option value="PARTIAL">Partial Refund</option>
                                    </select>
                                </div>
                                
                                {/* Input Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount (Max: {productList[0].productionCost})</label>
                                    <input 
                                        type="number" 
                                        value={itemDetails[productList[0].id]?.amount || 0}
                                        onChange={(e) => handleAmountChange(productList[0].id, Number(e.target.value))}
                                        min="0"
                                        max={productList[0].priceRaw}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. Global Reason (VẤN ĐỀ CỦA BẠN ĐANG Ở ĐÂY) */}
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-3">
                            {isOrderLevel ? '2. Global Reason & Proof' : 'Reason & Proof'}
                        </h4>
                        
                        {/* REASON TEXTAREA */}
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Required)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows="3"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Please detail why a refund is necessary..."
                        />
                    </div>

                    {/* 4. Proof Upload (VẤN ĐỀ CỦA BẠN ĐANG Ở ĐÂY) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proof (Images/Videos of Defect)</label>
                        <input 
                            type="file" 
                            multiple
                            onChange={(e) => setProofFiles(Array.from(e.target.files))}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-600 hover:file:bg-red-100"
                        />
                    </div>
                    
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-5 border-t flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700" disabled={!reason || totalRefundAmount <= 0}>
                        Submit Refund Request
                    </button>
                </div>
            </div>
        </div>
    );
}