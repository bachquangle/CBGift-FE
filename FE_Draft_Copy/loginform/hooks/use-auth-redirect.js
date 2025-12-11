"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export const useAuthRedirect = (allowedRoles = []) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.replace("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      // Token hết hạn
      if (decoded.exp < currentTime) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        router.replace("/");
        return;
      }

      // Kiểm tra Role
      const roleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      const roles = decoded[roleKey] || decoded.role;
      const userRoles = Array.isArray(roles) ? roles : [roles];

      // Nếu không truyền allowedRoles (rỗng) thì cho qua (chỉ cần đăng nhập)
      // Hoặc check nếu có role phù hợp
      const isAuthorized = allowedRoles.length === 0 || allowedRoles.some((role) => userRoles.includes(role));

      if (!isAuthorized) {
        router.replace("/"); // Hoặc trang 403 Forbidden
        return;
      }

      setIsAuthenticated(true);
    } catch (e) {
      // Token lỗi
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.replace("/");
    }
  }, [router, allowedRoles]);

  return isAuthenticated;
};
