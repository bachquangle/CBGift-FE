"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jwtDecode } from "jwt-decode";
import apiClient from "../lib/apiClient";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false); // State quản lý Dialog lỗi
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState("email");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(120);
  const [isOtpExpired, setIsOtpExpired] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const router = useRouter();

  // useEffect cho Forgot Password OTP Countdown
  useEffect(() => {
    let interval;
    if (forgotPasswordStep === "otp" && otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev - 1 === 0) {
            setIsOtpExpired(true);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [forgotPasswordStep, otpCountdown]);

  // =========================================================
  // ✨ USE EFFECT MỚI: Tự động tắt Dialog lỗi sau 5 giây (5000ms)
  // =========================================================
  useEffect(() => {
    let timer;
    if (open) {
      // Nếu hộp thoại lỗi đang mở, thiết lập timeout 5 giây
      timer = setTimeout(() => {
        setOpen(false); // Tự động đóng hộp thoại
      }, 5000); // 5000 milliseconds = 5 giây
    }

    // Cleanup function để xóa timer nếu component unmount hoặc 'open' thay đổi
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [open]);
  // =========================================================

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      setOpen(true);
      return;
    }

    try {
      // 1. Gọi API qua apiClient (đã config withCredentials)
      const res = await apiClient.post("/api/auth/login", {
        userNameOrEmail: email,
        password: password,
      });

      const data = res.data;

      // ... (Phần xử lý token và điều hướng không thay đổi)
      // 2. Lấy token (Xử lý cả trường hợp viết hoa/thường)
      const accessToken = data.accessToken || data.AccessToken;
      const refreshToken = data.refreshToken || data.RefreshToken;

      if (!accessToken) {
        throw new Error("No token received from server");
      }

      // 3. [QUAN TRỌNG] Lưu vào LocalStorage (Để Mobile hoạt động)
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      // 4. Giải mã Token
      const decoded = jwtDecode(accessToken);

      // Lấy Role và UserID (Xử lý các key claim dài dòng của Microsoft)
      const roleKey =
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      const idKey =
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

      const roles = decoded[roleKey] || decoded.role;
      const userId = decoded[idKey] || decoded.sub;

      // Lưu UserID
      if (userId) localStorage.setItem("userId", userId);

      // Xử lý Remember Me (Logic phụ)
      if (rememberMe) localStorage.setItem("rememberMe", "true");
      else localStorage.removeItem("rememberMe");

      // 5. Điều hướng (Chuyển roles thành mảng để check cho an toàn)
      const userRoles = Array.isArray(roles) ? roles : [roles];

      if (userRoles.includes("Seller")) router.push("/seller/manage-order");
      else if (userRoles.includes("Designer"))
        router.push("/designer/design-assign");
      else if (userRoles.includes("Manager"))
        router.push("/manager/manage-account");
      else if (userRoles.includes("QC")) router.push("/qc/check-product");
      else if (userRoles.includes("Staff")) router.push("/staff/manage-order");
      else router.push("/"); // Trang chủ mặc định
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "Login failed";
      setError(msg);
      setOpen(true); // Mở Dialog lỗi
    }
  };

  const handleForgotPasswordClick = () => {
    setForgotPasswordOpen(true);
    setForgotPasswordStep("email");
    setOtpError("");
  };

  const handleSendResetEmail = async () => {
    if (!forgotPasswordEmail) {
      setError("Please enter your email");
      setOpen(true);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setError("Please enter a valid email address");
      setOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotPasswordEmail }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Sending request failed.");
        setOpen(true);
        return;
      }

      setForgotPasswordStep("otp");
      setOtp("");
      setOtpCountdown(120);
      setIsOtpExpired(false);
    } catch (error) {
      setError("An error occurred!");
      setOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: forgotPasswordEmail, otp: otp }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setOtpError(err.message || "Invalid OTP");
        return;
      }
      setForgotPasswordStep("reset");
    } catch (error) {
      setOtpError("Failed to verify OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      setOpen(true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/auth/reset-password-with-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: forgotPasswordEmail,
            otp: otp,
            newPassword: newPassword,
            confirmPassword: confirmPassword,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Reset failed");
        setOpen(true);
        return;
      }

      setForgotPasswordOpen(false);
      setSuccessOpen(true);
    } catch (error) {
      setError("Something went wrong!");
      setOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (forgotPasswordStep === "otp") setForgotPasswordStep("email");
    else if (forgotPasswordStep === "reset") setForgotPasswordStep("otp");
  };

  const handleCloseForgotPassword = () => {
    setForgotPasswordOpen(false);
    setForgotPasswordStep("email");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
              <img
                src="/Logo.jpg"
                alt="CBGift Logo"
                className="w-10 h-10 object-contain"
              />
            </div>

            <h1 className="text-4xl font-bold text-gray-900 ml-3">CBGift</h1>
          </div>
          <p className="text-lg text-gray-700 font-medium">
            Log in with your CBGift account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Email
            </label>
            <Input
              type="email"
              placeholder="Your@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 border-gray-300 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Password
              </label>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 pr-12 border-gray-300 rounded-lg"
              />

              {/* eye icon */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* reset password */}
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="text-xs font-medium text-gray-600 hover:text-gray-900 uppercase tracking-wide"
              >
                Forgot Your Password ?
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm uppercase tracking-wide rounded-lg"
          >
            Log In
          </Button>
        </form>

        {/* Sign Up Link */}
        {/* <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{" "}
          <a href="#" className="text-gray-900 font-semibold hover:underline">
            Sign Up
          </a>
        </p> */}
      </div>

      {/* Dialog Forgot Password */}
      <Dialog
        open={forgotPasswordOpen}
        onOpenChange={handleCloseForgotPassword}
      >
        <DialogContent className="sm:max-w-[425px]">
          {forgotPasswordStep === "email" && (
            <>
              <DialogHeader>
                <DialogTitle>Forgot Password</DialogTitle>
                <DialogDescription>
                  Enter your email address to receive an OTP.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseForgotPassword}>
                  Cancel
                </Button>
                <Button onClick={handleSendResetEmail} disabled={isLoading}>
                  Send OTP
                </Button>
              </DialogFooter>
            </>
          )}

          {forgotPasswordStep === "otp" && (
            <>
              <DialogHeader>
                <DialogTitle>Verify OTP</DialogTitle>
                <DialogDescription>
                  We sent an OTP to {forgotPasswordEmail}.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 flex flex-col items-center space-y-4">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={isOtpExpired}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <p
                  className={`text-sm ${
                    isOtpExpired ? "text-red-500" : "text-gray-500"
                  }`}
                >
                  Expires in: {Math.floor(otpCountdown / 60)}:
                  {String(otpCountdown % 60).padStart(2, "0")}
                </p>
                {otpError && <p className="text-sm text-red-600">{otpError}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6 || isOtpExpired}
                >
                  Verify
                </Button>
              </DialogFooter>
            </>
          )}

          {forgotPasswordStep === "reset" && (
            <>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Set your new password (min. 6 characters).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleResetPassword} disabled={isLoading}>
                  Reset
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Success/Error Dialogs */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">Success</DialogTitle>
          </DialogHeader>
          <p>Password changed successfully!</p>
          <DialogFooter>
            <Button onClick={() => setSuccessOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Error</DialogTitle>
          </DialogHeader>
          <p>{error}</p>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
