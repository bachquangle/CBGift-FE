// app/designer/layout.jsx

"use client";

// Nhập hook kiểm tra quyền truy cập
import { useAuthRedirect } from "@/hooks/use-auth-redirect";

// Import các component Layout chung của Designer (nếu có)
// Ví dụ: import DesignerHeader from "@/components/layout/designer/header";
// import DesignerSidebar from "@/components/layout/designer/sidebar";

// 1. CHỈ ĐỊNH CÁC VAI TRÒ ĐƯỢC PHÉP
// Chỉ cho phép role "Designer" truy cập các route này
const ALLOWED_ROLES = ["Designer"];

export default function DesignerLayout({ children }) {
  // 2. SỬ DỤNG HOOK ĐỂ KIỂM TRA VÀ CHUYỂN HƯỚNG
  const isAuthenticated = useAuthRedirect(ALLOWED_ROLES);

  // 3. HIỂN THỊ TRẠNG THÁI CHỜ/CHẶN NẾU CHƯA XÁC THỰC
  if (!isAuthenticated) {
    // Hiển thị màn hình tải hoặc thông báo trong khi chuyển hướng về Login
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-gray-500">
        Checking permissions and redirecting...
      </div>
    );
  }

  // 4. NẾU XÁC THỰC THÀNH CÔNG, RENDER NỘI DUNG LAYOUT
  return (
    // Đây là cấu trúc Layout chung của Designer
    <div className="flex h-screen bg-gray-50">
      {/* <DesignerSidebar /> */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* <DesignerHeader /> */}

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
