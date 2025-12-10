// File: hooks/use-auth-redirect.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

/**
 * @param {string[]} allowedRoles - Danh sách role được phép truy cập.
 */
export const useAuthRedirect = (allowedRoles = []) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      // KHÔNG CÓ TOKEN: Chuyển hướng ngay lập tức về trang login
      router.replace("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      // TOKEN HẾT HẠN
      if (decoded.exp < currentTime) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        router.replace("/");
        return;
      }

      // KIỂM TRA ROLE
      const roles =
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      const userRoles = Array.isArray(roles) ? roles : [roles];

      const isAuthorized = allowedRoles.some((role) =>
        userRoles.includes(role)
      );

      if (!isAuthorized) {
        router.replace("/");
        return;
      }

      // HỢP LỆ
      setIsAuthenticated(true);
    } catch (e) {
      // TOKEN LỖI DECODE
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      router.replace("/");
    }
  }, [router, allowedRoles]);

  return isAuthenticated;
};
