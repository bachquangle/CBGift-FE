"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import apiClient from "../../lib/apiClient";
import { toast } from "sonner"; // Hoặc thư viện toast bạn đang dùng
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ProfileModal({ open, onOpenChange }) {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    userName: ""
  });
  const [loading, setLoading] = useState(false);

  // Gọi API lấy thông tin khi modal mở
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `${apiClient.defaults.baseURL}/api/auth/profile`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            // Nếu dùng apiClient có interceptor tự gắn token thì có thể bỏ credentials
            // Nếu dùng fetch thuần thì cần dòng dưới để gửi cookie
             credentials: "include", 
            // Tuy nhiên bạn đang import apiClient, nên dùng apiClient luôn cho đồng bộ:
          }
        );

        // Chuyển sang dùng apiClient để tận dụng interceptor (nếu có)
        // const res = await apiClient.get("/api/auth/profile");
        
        // Code cũ của bạn dùng fetch thuần:
        if (res.ok) {
           const data = await res.json();
           // Map dữ liệu vào state, xử lý null
           setProfile({
             fullName: data.fullName || "",
             email: data.email || "",
             phoneNumber: data.phoneNumber || "",
             userName: data.userName || ""
           });
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
      }
    };

    if (open) {
      fetchProfile();
    }
  }, [open]);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gọi API Update Profile
  const handleSave = async () => {
    setLoading(true);
    try {
      // Dùng fetch thuần (giống code cũ của bạn) hoặc apiClient
      const res = await fetch(`${apiClient.defaults.baseURL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": `Bearer ...` // Nếu dùng cookie thì không cần header này
        },
        credentials: "include", // Quan trọng để gửi kèm Cookie Auth
        body: JSON.stringify({
          fullName: profile.fullName,
          phoneNumber: profile.phoneNumber
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Profile updated successfully!");
        onOpenChange(false); // Đóng modal sau khi thành công
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("An error occurred while updating profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Email - Read Only */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* User Name - Read Only */}
          {/* <div className="space-y-2">
            <Label htmlFor="userName">Username</Label>
            <Input
              id="userName"
              value={profile.userName}
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
          </div> */}

          {/* Full Name - Editable */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={profile.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </div>

          {/* Phone Number - Editable */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              value={profile.phoneNumber}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}