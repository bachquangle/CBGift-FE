// File: components/modals/RequestReprintModal.jsx

"use client";

import { useState, useMemo } from 'react';
// Import các component và icons cần thiết, sử dụng cho việc render và logic
import { X, Printer, Loader, Zap, Badge } from 'lucide-react'; 
import Swal from "sweetalert2";
// Giả định Textarea, Button, Table, Input, Select đã có sẵn và apiClient được định nghĩa.
import apiClient from "../../lib/apiClient"; // Yêu cầu API client

// Khai báo hàm uploadImage (Logic tải file)
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


export default function RequestReprintModal({ isOpen, onClose, productDetail, onSubmit }) {
    if (!isOpen) return null;

    const isOrderLevel = productDetail.products && Array.isArray(productDetail.products);
    const productList = isOrderLevel ? productDetail.products : [productDetail];
    
    // --- STATE VÀ LOGIC CHUNG ---
    const [reason, setReason] = useState(''); // Lý do chi tiết (sử dụng làm Reason chính)
    const [proofFiles, setProofFiles] = useState([]); // Chứa 1 File object
    const [uploadedUrl, setUploadedUrl] = useState(null); 
    const [isUploading, setIsUploading] = useState(false); // Quản lý trạng thái disabled của nút

    // State theo dõi selection cho từng sản phẩm
    const [itemSelection, setItemSelection] = useState(() => {
        return productList.reduce((acc, item) => {
            acc[item.id] = !isOrderLevel;
            return acc;
        }, {});
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setProofFiles(file ? [file] : []);
        setUploadedUrl(null); // Reset URL nếu file mới được chọn
    }

    const handleItemSelect = (id, isChecked) => {
        setItemSelection(prev => ({
            ...prev,
            [id]: isChecked
        }));
    };

    const handleSubmit = async () => {
        const selectedItems = Object.entries(itemSelection)
            .filter(([id, selected]) => selected)
            .map(([id]) => ({
                originalOrderDetailId: Number(id)
            }));
        
        if (!reason || selectedItems.length === 0) {
            alert("Vui lòng điền chi tiết lý do và chọn ít nhất một sản phẩm.");
            return;
        }

        let finalProofUrl = uploadedUrl;

        // 1. TẢI FILE LÊN NẾU CÓ VÀ CHƯA ĐƯỢC TẢI
        if (proofFiles.length > 0 && !finalProofUrl) {
            setIsUploading(true); // Bật trạng thái disabled của nút

            // ✨ HIỂN THỊ SWAL LOADING SPINNER ✨
            Swal.fire({
                title: 'Uploading Proof...',
                html: 'Please wait while your file is uploaded.',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => Swal.showLoading()
            });
            
            try {
                // Cho phép UI repaint trước khi gọi fetch
                await new Promise(resolve => setTimeout(resolve, 10)); 
                
                const url = await uploadImage(proofFiles[0]);
                
                if (!url) {
                    throw new Error("Failed to get URL after upload.");
                }
                finalProofUrl = url;
                setUploadedUrl(url); 
                
                Swal.close(); // Đóng spinner sau khi upload thành công

            } catch (error) {
                Swal.close();
                Swal.fire("Upload Failed", `Lỗi tải file: ${error.message}`, "error");
                setIsUploading(false); 
                return;
            } finally {
                setIsUploading(false); 
            }
        }

        // 2. Gửi dữ liệu đơn giản hóa lên handleOrderReprintSubmit
        onSubmit({
            orderId: productDetail.id,
            reason: reason, 
            selectedItems: selectedItems,
            proofUrl: finalProofUrl, // URL bằng chứng
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
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-10">Select</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-24">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {productList.map((item) => {
                                            return (
                                                <tr key={item.id} className={itemSelection[item.id] ? 'bg-blue-50' : ''}>
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
                    
                    {/* 2. Single Product View (CHỈ HIỆN KHI LÀ CẤP PRODUCT) */}
                    {!isOrderLevel && productList[0] && (
                        <p className="text-sm text-gray-600 mb-4">
                            Product: <strong>{productList[0].name}</strong> (SKU: {productList[0].sku})
                        </p>
                    )}

                    {/* 3. Reason & Proof (HỢP NHẤT) */}
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-3">
                            {isOrderLevel ? '2. Reason & Proof' : 'Reason & Proof'}
                        </h4>
                        
                        {/* REASON TEXTAREA */}
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Required)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows="4"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Describe the issue or the requested change..."
                        />
                    </div>
                    
                    {/* PROOF UPLOAD (SINGLE FILE) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proof Image/File (Optional)</label>
                        <div className="flex gap-2 items-center">
                             <input 
                                type="file" 
                                onChange={handleFileChange}
                                disabled={isUploading || uploadedUrl} 
                                className="flex-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 disabled:opacity-50"
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
                <div className="flex justify-end gap-3 p-5 border-t">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center justify-center" disabled={!reason || productList.length === 0 || isUploading}>
                        {isUploading ? (
                            <>
                                <Loader className="h-4 w-4 mr-2 animate-spin" /> Uploading...
                            </>
                        ) : (
                            "Submit Reprint Request"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}