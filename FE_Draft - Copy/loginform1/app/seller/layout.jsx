// app/seller/layout.jsx

"use client";

// Import các component layout chung của Seller
import SellerHeader from "@/components/layout/seller/header";
import SellerSidebar from "@/components/layout/seller/sidebar";

// Import component blocker mà chúng ta đã tạo
import OverdueInvoiceBlocker from "@/components/layout/seller/OverdueInvoiceBlocker";

export default function SellerLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SellerHeader />
        
        {/* Main content 
          Chúng ta đặt Blocker ở đây để nó kiểm tra MỌI trang của seller
        */}
        <main className="flex-1 overflow-y-auto p-6">
          <OverdueInvoiceBlocker>
            {/* {children} chính là file page.jsx của bạn (ví dụ: dashboard/page.jsx) */}
            {children}
          </OverdueInvoiceBlocker>
        </main>

      </div>
    </div>
  );
}