"use client";

import { Button } from "@/components/ui/button";
import { 
    ChevronDown, 
    FileText, 
    Image as ImageIcon, 
    Gift, 
    Text, 
    Wallet,
    Printer 
} from 'lucide-react';
import { useState } from "react";
import ProductTimeline from "./product-timeline";
import RequestRefundModal from "@/components/modals/RequestRefundModal";
import RequestReprintModal from "@/components/modals/RequestReprintModal";

export default function ProductItem({
    product,
    showDetails = false,
    onDetailClick,
    isOrderEligible,
    orderStatus,
}) {
    const [expanded, setExpanded] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
    // Hàm cảnh báo khi nút bị disabled được click
    const handleDisabledClick = (action) => {
        alert(`Không thể ${action} sản phẩm. Trạng thái đơn hàng phải là SHIPPED hoặc COMPLETED. Trạng thái hiện tại: ${orderStatus}.`);
    };
    // Xử lý khi Submit Refund
    const handleRefundSubmit = (data) => {
        console.log("Submitting Refund Request:", data);
        alert("Refund request submitted successfully!");
    };

    // Xử lý khi Submit Reprint
    const handleReprintSubmit = (data) => {
        console.log("Submitting Reprint Request:", data);
        alert("Reprint request submitted successfully!");
    };

    return (
        <>
            <div className="relative border border-gray-200 rounded-lg p-6 mb-4 shadow-sm hover:shadow-md transition-shadow">
                
                {/* NÚT DETAIL (Định vị tuyệt đối ở góc trên bên phải) */}
                <div className="absolute top-4 right-4 z-10"> 
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setExpanded(!expanded);
                            onDetailClick && onDetailClick();
                        }}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50 font-semibold transition-all w-24"
                    >
                        <ChevronDown
                            className={`h-4 w-4 mr-1 transition-transform ${
                                expanded ? "rotate-180" : ""
                            }`}
                        />
                        {expanded ? "Collapse" : "Detail"}
                    </Button>
                </div>

                {/* Hàng Nội dung Chính (Image + Text/Timeline) */}
                <div className="flex items-start gap-4">
                    {/* Cột 1: Product Image */}
                    <div className="w-24 h-24 flex-shrink-0 border border-gray-100 rounded-md overflow-hidden">
                        <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Cột 2: Product Details (Tên, SKU, Supplier & Timeline) */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                            {product.name}
                        </h3>
                        <p className="text-sm text-[#384551] mb-2">
                            <span className="font-bold">SKU:</span> {product.sku}
                        </p>
                        <p className="text-xs text-[#384551] mb-3">
                            <span className="font-bold">Print in:</span> {product.supplier}
                        </p>

                        {/* Timeline */}
                        <div className="mt-4">
                            <ProductTimeline productDetails={product} />
                        </div>
                    </div>
                </div>

                {/* Product Info Grid (Luôn hiển thị - Dưới Timeline) */}
                <div className="grid grid-cols-3 gap-6 mt-4 pt-4 border-t border-gray-100">
                    
                    {/* Print Side */}
                    <div className="flex items-center gap-2">
                        <Text className="h-4 w-4 text-[#384551]" />
                        <div>
                            <p className="text-xs text-[#384551] font-bold leading-none">
                                Print Side
                            </p>
                            <p className="font-bold text-sm text-[#384551]">
                                {product.printSide}
                            </p>
                        </div>
                    </div>
                    
                    {/* Production Cost */}
                    <div className="flex items-center gap-2">
                        {/* <DollarSign className="h-4 w-4 text-[#384551]" /> */}
                        <div>
                            <p className="text-xs text-[#384551] font-bold leading-none">
                                Production Cost
                            </p>
                            <p className="font-bold text-sm text-[#384551]">
                                {product.productionCost}
                            </p>
                        </div>
                    </div>
                    
                    {/* Tracking Status */}
                    <div>
                        <p className="text-xs text-[#384551] font-bold mb-1">
                            Tracking Status
                        </p>
                        <p className="font-bold text-sm text-[#384551]">
                            {product.trackingDetail}
                        </p>
                    </div>
                </div>
                
                {/* Expanded Details */}
                {expanded && (
                    <div className="mt-6 pt-6 border-t border-gray-100 bg-gray-50 p-4 rounded-b-lg -mx-6 -mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"> 
                            
                            {/* Cột 1: Product Specifications */}
                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">
                                    Product Specs
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p>
                                        <span className="font-medium text-gray-600">Name:</span>{" "}
                                        {product.name}
                                    </p>
                                    <p>
                                        <span className="font-medium text-gray-600">SKU:</span>{" "}
                                        {product.sku}
                                    </p>
                                    <p>
                                        <span className="font-medium text-gray-600">Supplier:</span>{" "}
                                        {product.supplier}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Cột 2: Production Details */}
                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">
                                    Production Details
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p>
                                        <span className="font-medium text-gray-600">Cost:</span>{" "}
                                        <span className="font-bold text-gray-900">
                                            {product.productionCost}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="font-medium text-gray-600">Print Side:</span>{" "}
                                        {product.printSide}
                                    </p>
                                </div>
                            </div>

                            {/* Cột 3: Design & Media Links (Dùng Button) */}
                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">
                                    Design Files
                                </h4>
                                <div className="space-y-3">
                                    
                                    {product.linkFileDesign && (
                                        <a href={product.linkFileDesign} target="_blank" rel="noopener noreferrer" className="block">
                                            <Button variant="secondary" className="w-full justify-start bg-gray-100 hover:bg-gray-200 text-gray-800">
                                                <FileText className="h-4 w-4 mr-2" /> View Design File
                                            </Button>
                                        </a>
                                    )}

                                    {product.linkThanksCard && (
                                        <a href={product.linkThanksCard} target="_blank" rel="noopener noreferrer" className="block">
                                            <Button variant="secondary" className="w-full justify-start bg-gray-100 hover:bg-gray-200 text-gray-800">
                                                <Gift className="h-4 w-4 mr-2" /> View Thanks Card
                                            </Button>
                                        </a>
                                    )}

                                    {product.image && (
                                        <a href={product.image} target="_blank" rel="noopener noreferrer" className="block">
                                            <Button variant="secondary" className="w-full justify-start bg-gray-100 hover:bg-gray-200 text-gray-800">
                                                <ImageIcon className="h-4 w-4 mr-2" /> View Product Image
                                            </Button>
                                        </a>
                                    )}
                                    
                                    {!product.linkFileDesign && !product.linkThanksCard && !product.image && (
                                        <p className="text-sm text-gray-500 italic">No media links available.</p>
                                    )}
                                </div>
                            </div>

                            {/* Cột 4: Order Detail Actions */}
                            <div className="p-3 bg-white rounded-lg border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">
                                    Actions
                                </h4>
                                <div className="space-y-3">
                                    
                                    {/* Nút Yêu cầu Hoàn tiền */}
                                    <Button 
                                        variant="destructive" 
                                        // ✨ DISABLE NẾU KHÔNG ĐỦ ĐIỀU KIỆN ✨
                                            disabled={!isOrderEligible} 
                                            onClick={isOrderEligible ? () => setIsRefundModalOpen(true) : () => handleDisabledClick('Hoàn tiền')} 
                                            className="w-full justify-start text-xs h-8 bg-red-500 hover:bg-red-600"
                                            title={!isOrderEligible ? `Trạng thái Order phải là SHIPPED/COMPLETED (Hiện tại: ${orderStatus})` : `Yêu cầu Hoàn tiền cho sản phẩm ${product.id}`}>
                                        <Wallet className="h-4 w-4 mr-2" /> Request Refund
                                    </Button>

                                    {/* Nút Yêu cầu In lại */}
                                    <Button 
                                        variant="outline" 
                                        // ✨ DISABLE NẾU KHÔNG ĐỦ ĐIỀU KIỆN ✨
                                        disabled={!isOrderEligible} 
                                        onClick={isOrderEligible ? () => setIsReprintModalOpen(true) : () => handleDisabledClick('In lại')}
                                        className="w-full justify-start text-xs h-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                                        title={!isOrderEligible ? `Trạng thái Order phải là SHIPPED/COMPLETED (Hiện tại: ${orderStatus})` : `Yêu cầu In lại cho sản phẩm ${product.id}`}>
                                        <Printer className="h-4 w-4 mr-2" /> Request Reprint
                                    </Button>
                                    
                                </div>
                            </div>
                            
                        </div>
                    </div>
                )}
            </div>
            
            {/* 🚀 Render Modals 🚀 */}
            <RequestRefundModal 
                isOpen={isRefundModalOpen}
                onClose={() => setIsRefundModalOpen(false)}
                productDetail={product}
                onSubmit={handleRefundSubmit}
            />

            <RequestReprintModal 
                isOpen={isReprintModalOpen}
                onClose={() => setIsReprintModalOpen(false)}
                productDetail={product}
                onSubmit={handleReprintSubmit}
            />
        </>
    );
}