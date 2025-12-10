// app/seller/layout.jsx

"use client";

import SellerHeader from "@/components/layout/seller/header";
import SellerSidebar from "@/components/layout/seller/sidebar";
import OverdueInvoiceBlocker from "@/components/layout/seller/OverdueInvoiceBlocker";
// 1. IMPORT HOOK BẢO VỆ
import { useAuthRedirect } from "@/hooks/use-auth-redirect";

// Chỉ định các vai trò được phép vào route /seller
// Giả định: Chỉ có "Seller" và "Manager" có thể xem. Nếu chỉ mình Seller, giữ lại ["Seller"]
const ALLOWED_ROLES = ["Seller"];

export default function SellerLayout({ children }) {
  // 2. SỬ DỤNG HOOK ĐỂ KIỂM TRA VÀ CHUYỂN HƯỚNG
  const isAuthenticated = useAuthRedirect(ALLOWED_ROLES);

  // 3. HIỂN THỊ TRẠNG THÁI CHỜ/CHẶN NẾU CHƯA XÁC THỰC
  if (!isAuthenticated) {
    // Hiển thị màn hình tải đơn giản trong khi chuyển hướng
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-500">
        Checking permissions and redirecting...
      </div>
    );
  }

  // 4. NẾU XÁC THỰC THÀNH CÔNG, RENDER NỘI DUNG CHÍNH
  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SellerHeader />

        <main className="flex-1 overflow-y-auto p-6">
          <OverdueInvoiceBlocker>{children}</OverdueInvoiceBlocker>
        </main>
      </div>
    </div>
  );
}
