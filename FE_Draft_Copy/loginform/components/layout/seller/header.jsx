"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import apiClient from "../../../lib/apiClient";
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

export default function SellerHeader() {
  const router = useRouter();
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiClient.defaults.baseURL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      });

      if (res.ok) {
        // Logout thành công từ BE
        console.log("Logout success");
      } else if (res.status === 401) {
        // Token hết hạn → vẫn coi là logout thành công
        console.warn("Token expired, auto logout");
      } else {
        // Lỗi khác
        let errMessage = "Logout failed";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const err = await res.json();
            errMessage = err.message || JSON.stringify(err);
          } else {
            const text = await res.text();
            errMessage = text || "Unknown error";
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        console.error(errMessage);
      }

      // Xoá token ở client trong mọi trường hợp
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");

      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Dù lỗi FE vẫn xóa token
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      router.push("/");
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Welcome , bach
          </h2>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-10 h-10 rounded-full bg-gray-200"
              >
                <div className="w-8 h-8 rounded-full bg-gray-400"></div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
            
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPasswordModal(true)}>
                Change Password
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => setShowTopUpModal(true)}>
                Request Top-Up Money
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
