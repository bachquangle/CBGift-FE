"use client";

import { useState, useEffect } from "react"; // 1. Import useEffect
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import apiClient from "../../../lib/apiClient";
import NotificationBell from "../../../components/ui/NotificationBell";
import { User, Lock, LogOut } from "lucide-react"; // Bỏ import Bell ở đây vì NotificationBell đã lo rồi

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TopUpModal from "@/components/modals/top-up-modal";
import ProfileModal from "@/components/modals/profile-modal";
import PasswordModal from "@/components/modals/password-modal";

export default function DesignerHeader() {
  const router = useRouter();
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // 2. Khởi tạo state cho userName
  const [userName, setUserName] = useState(""); 
  // Có thể thêm state loading nếu muốn
  // const [loading, setLoading] = useState(true);

  // 3. Hàm gọi API lấy thông tin User
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await apiClient.get("/api/Auth/profile");
        const nameToShow = res.data.fullName || res.data.username || "Designer";
        setUserName(nameToShow);
        
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        // Nếu lỗi (ví dụ 401), có thể set tên mặc định hoặc để trống
        setUserName("Designer");
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      const res = await fetch(`${apiClient.defaults.baseURL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      });

      if (res.ok) {
        console.log("Logout success");
      } else if (res.status === 401) {
        console.warn("Token expired, auto logout");
      } else {
        // Xử lý lỗi logout (chỉ log ra console)
        console.error("Logout failed on server");
      }

      // Xoá token ở client
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      localStorage.removeItem("user"); // Xóa cả user info nếu có lưu

      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      router.push("/");
    }
  };

  return (    
    <>
      <header className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <h2 className="text-lg font-semibold text-foreground">
            Welcome, <span className="font-bold text-primary">{userName || "..."}</span>
          </h2>

          <div className="flex items-center gap-4">
            
            {/* Notification Bell (Dùng component đã tách riêng) */}
            <NotificationBell />

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 w-10 rounded-full p-0 ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center font-semibold text-primary-foreground text-sm">
                    {/* Lấy chữ cái đầu, nếu chưa có tên thì hiện "?" */}
                    {userName ? userName.charAt(0).toUpperCase() : "?"}
                  </div>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-3 mb-2">
                  <p className="text-sm font-medium text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground">Designer Account</p>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowProfileModal(true)} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowPasswordModal(true)} className="cursor-pointer">
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <TopUpModal open={showTopUpModal} onOpenChange={setShowTopUpModal} />
      <ProfileModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
      />
      <PasswordModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
      />
    </>
  );
}