"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { jwtDecode } from "jwt-decode";
import apiClient from "../lib/apiClient";
import { Eye, EyeOff } from "lucide-react"; // Thêm import icon
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
  const [showPassword, setShowPassword] = useState(false); // State cho form login
  const [showNewPassword, setShowNewPassword] = useState(false); // State cho form reset

  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password");
      setOpen(true);
      return;
    }

    try {
      // 1. Dùng apiClient thay vì fetch để tận dụng cấu hình BaseURL và withCredentials
      const res = await apiClient.post("/api/auth/login", {
        userNameOrEmail: email,
        password: password,
      });

      // 2. Lấy data từ response
      // Controller .NET trả về: { accessToken, refreshToken, userName, email }
      // (Lưu ý: .NET Core thường trả về camelCase JSON mặc định)
      const data = res.data;
      
      // Xử lý trường hợp chữ hoa/thường tùy config server
      const token = data.accessToken || data.AccessToken;
      const refreshToken = data.refreshToken || data.RefreshToken;

      if (!token) {
        setError("No token received from server");
        setOpen(true);
        return;
      }

      // 3. [HYBRID AUTH FIX] Lưu Token vào LocalStorage
      // Đây là bước quan trọng để Mobile (và Interceptor) hoạt động được
      localStorage.setItem("accessToken", token);
      
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      // 4. Giải mã Token để lấy UserID và Role
      const decoded = jwtDecode(token);
      
      const roleClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      const idClaim = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
      
      const roles = decoded[roleClaim] || decoded.role; // Fallback nếu tên claim ngắn gọn
      const userId = decoded[idClaim] || decoded.sub;

      if (userId) localStorage.setItem("userId", userId);
      
      // Xử lý Remember Me (Logic cũ của bạn, nhưng giờ LocalStorage là chính)
      if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
      } else {
          localStorage.removeItem("rememberMe");
      }

      // 5. Điều hướng dựa trên Role
      // Chuyển roles thành mảng nếu nó là string đơn
      const userRoles = Array.isArray(roles) ? roles : [roles];

      if (userRoles.includes("Seller")) router.push("/seller/manage-order");
      else if (userRoles.includes("Designer")) router.push("/designer/design-assign");
      else if (userRoles.includes("Manager")) router.push("/manager/dashboard");
      else if (userRoles.includes("QC")) router.push("/qc/check-product");
      else if (userRoles.includes("Staff")) router.push("/staff/manage-order");
      else router.push("/"); // Default cho Admin hoặc User thường

    } catch (err) {
      console.error("Login Error:", err);
      const message = err.response?.data?.message || "Login failed. Please check your credentials.";
      setError(message);
      setOpen(true);
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-cyan-400 rounded"></div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Login</h1>
              <p className="text-gray-600 mt-1">
                See your growth and get support!
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email*
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Password*
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                  />
                  <label htmlFor="remember" className="text-sm text-gray-600">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3"
              >
                Login
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-purple-50 items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <img
            src="/isometric-3d-illustration-of-people-working-with-d.jpg"
            alt="Illustration"
            className="w-full h-auto"
          />
        </div>
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
                  Set your new password (min. 8 characters).
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
