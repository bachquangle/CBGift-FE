// File: components/modals/RequestRefundModal.jsx

"use client";

import { useState, useMemo } from 'react';
// Import các component và icons cần thiết (Loader, X, Zap)
import { X, Zap, Loader, Badge } from 'lucide-react'; 
import Swal from "sweetalert2";
import apiClient from "../../lib/apiClient";
// Giả định các components UI (Button, Textarea, Input, etc.) và apiClient đã được định nghĩa và import đúng.
// Giả định apiClient được truy cập global.

// Khai báo hàm uploadImage trong scope này (CẦN SỬA ĐỔI ĐỂ KHÔNG CHỨA LỖI CS1503)
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
            const errorText = await res.text();
            throw new Error(`Upload failed: ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        return data.secureUrl || data.url || data.path || null;
    } catch (err) {
        console.error("Upload error:", err);
        throw new Error(`Lỗi mạng hoặc server khi tải file lên: ${err.message}`);
    }
};


export default function RequestRefundModal({ isOpen, onClose, productDetail, onSubmit }) {
    if (!isOpen) return null;

    // --- 1. XÁC ĐỊNH KIỂU DỮ LIỆU & PRODUCT LIST ---
    const isOrderLevel = productDetail.products && Array.isArray(productDetail.products);
    const productList = isOrderLevel ? productDetail.products : [productDetail];
    
    // --- STATE VÀ LOGIC CHUNG ---
    const [reason, setReason] = useState('');
    const [proofFiles, setProofFiles] = useState([]); // Chứa 1 File object
    const [uploadedUrl, setUploadedUrl] = useState(null); 
    const [isUploading, setIsUploading] = useState(false); // Quản lý trạng thái disabled của nút
    
    const [itemDetails, setItemDetails] = useState(() => {
        return productList.reduce((acc, item) => {
            acc[item.id] = { selected: !isOrderLevel, amount: item.priceRaw || 0 };
            return acc;
        }, {});
    });

    const totalRefundAmount = useMemo(() => {
        return productList.reduce((sum, item) => {
            const detail = itemDetails[item.id];
            if (detail && detail.selected) {
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
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setProofFiles(file ? [file] : []);
        setUploadedUrl(null); // Reset URL nếu file mới được chọn
    }

    const handleItemSelect = (id, isChecked) => {
        setItemDetails(prevDetails => ({
            ...prevDetails,
            [id]: { ...prevDetails[id], selected: isChecked }
        }));
    };
    
    const handleSubmit = async () => { 
        // 1. CHUẨN BỊ DỮ LIỆU
        const selectedItems = Object.entries(itemDetails)
            .filter(([id, detail]) => detail.selected && detail.amount > 0)
            .map(([id, detail]) => ({
                orderDetailId: Number(id),
                refundAmount: detail.amount
            }));

        if (!reason || selectedItems.length === 0) {
            alert("Please fill in the reason in detail and select at least one product.");
            return;
        }

        setIsUploading(true); // Bật trạng thái loading chung

        try {
            let finalProofUrl = uploadedUrl;
            
            // 2. UPLOAD ẢNH (NẾU CÓ)
            if (proofFiles.length > 0 && !finalProofUrl) {
                // Hiển thị Swal spinner riêng cho việc upload
                Swal.fire({
                    title: 'Uploading Proof...',
                    html: 'Please wait while your evidence is uploaded.',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: () => Swal.showLoading()
                });
                
                const url = await uploadImage(proofFiles[0]);
                
                if (!url) throw new Error("Failed to get URL after upload.");
                finalProofUrl = url;
                setUploadedUrl(url); 
                Swal.close(); 
            }
            
            // 3. GỬI DỮ LIỆU (QUAN TRỌNG: Thêm await)
            // Cần await để đảm bảo API chạy xong mới reload trang
            await onSubmit({
                orderId: isOrderLevel ? productDetail.id : productDetail.orderId,
                reason: reason,
                selectedItems: selectedItems,
                totalRefundAmount: totalRefundAmount,
                proofUrl: finalProofUrl,
            });
            
            // 4. LOAD LẠI TRANG
            // Hiện thông báo thành công ngắn rồi reload
            await Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Refund request submitted successfully!',
                timer: 1500,
                showConfirmButton: false
            });
            
            window.location.reload(); // <--- Dòng lệnh reload trang

        } catch (error) {
            console.error("Submit error:", error);
            Swal.fire("Error", `Có lỗi xảy ra: ${error.message}`, "error");
            setIsUploading(false); // Tắt loading nếu lỗi
        }
        // Không cần gọi onClose() ở đây nữa vì trang sẽ reload
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
                    
                    {/* 1. Product Selection Table / Single Product View (Giữ nguyên) */}
                    {isOrderLevel && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-3">
                                1. Select Items for Refund
                            </h4>
                            {/* Table List Items */}
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
                            <div className="space-y-4">
                                
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

                    {/* 3. Global Reason */}
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-3">
                            {isOrderLevel ? '2. Global Reason & Proof' : 'Reason & Proof'}
                        </h4>
                        
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Required)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows="3"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Please detail why a refund is necessary..."
                        />
                    </div>

                    {/* 4. Proof Upload (SINGLE FILE) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proof (Images/Videos of Defect)</label>
                        <div className="flex gap-2 items-center">
                             <input 
                                type="file" 
                                onChange={handleFileChange}
                                disabled={isUploading || uploadedUrl} 
                                className="flex-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-600 hover:file:bg-red-100 disabled:opacity-50"
                            />
                            {/* Hiển thị trạng thái file đã chọn/upload */}
                            {uploadedUrl && (
                                <Badge className="bg-green-100 text-green-800 whitespace-nowrap">
                                    Uploaded
                                </Badge>
                            )}
                            {proofFiles.length > 0 && !uploadedUrl && !isUploading && (
                                <Badge className="bg-yellow-100 text-yellow-800 whitespace-nowrap">
                                    Ready to upload
                                </Badge>
                            )}
                        </div>
                    </div>
                    
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-5 border-t flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center justify-center" 
                        disabled={!reason || totalRefundAmount <= 0 || isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader className="h-4 w-4 mr-2 animate-spin" /> Uploading...
                            </>
                        ) : (
                            "Submit Refund Request"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}