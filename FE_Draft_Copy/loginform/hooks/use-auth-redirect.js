"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export const useAuthRedirect = (allowedRoles = []) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 1. Chỉ lấy từ localStorage (vì Mobile không đọc được session/cookie)
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.replace("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      
      // 2. CHỈ KIỂM TRA ROLE
      const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      // Fallback nếu token dùng key ngắn gọn "role"
      const roles = decoded[roleKey] || decoded.role;
      
      // Chuyển thành mảng để xử lý an toàn
      const userRoles = Array.isArray(roles) ? roles : [roles || ""];

      // Nếu không truyền allowedRoles (mảng rỗng) -> Cho qua
      // Nếu có truyền -> Check xem user có role đó không
      const isAuthorized = allowedRoles.length === 0 || 
                           allowedRoles.some((role) => userRoles.includes(role));

      if (!isAuthorized) {
        router.replace("/"); // Hoặc trang 403
        return;
      }

      // HỢP LỆ
      setIsAuthenticated(true);

    } catch (e) {
      // Chỉ logout khi Token bị lỗi format (không decode được)
      console.error("Token invalid:", e);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.replace("/");
    }
  }, [router, allowedRoles]); 

  return isAuthenticated;
};