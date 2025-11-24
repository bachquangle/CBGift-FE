"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { jwtDecode } from "jwt-decode";
import apiClient from "../lib/apiClient";
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
} from "@/components/ui/input-otp"; // import OTP input component

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState("email"); // "email" | "otp" | "reset"
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
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
      const res = await fetch(`${apiClient.defaults.baseURL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userNameOrEmail: email,
          password: password,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Login failed");
        setOpen(true);
        return;
      }

      const data = await res.json();
      const token = data.accessToken;

      if (!token) {
        setError("No token received from server");
        setOpen(true);
        return;
      }

      // decode JWT để lấy role
      const decoded = jwtDecode(token);
      const roles =
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      // ✅ Lưu userId vào localStorage (SignalR dùng để JoinGroup)
      const userId =
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ] || decoded.sub; // fallback nếu token không có claim này

      if (userId) {
        localStorage.setItem("userId", userId);
        console.log("💾 Saved userId:", userId);
      }

      console.log("Decoded token:", decoded);
      console.log("Roles:", roles);
      console.log("👤 Current userId:", localStorage.getItem("userId"));

      // Lưu token (có thể đổi sang cookie nếu muốn an toàn hơn)
      if (rememberMe) {
        localStorage.setItem("token", token);
      } else {
        sessionStorage.setItem("token", token);
      }

      // Điều hướng theo role
      if (roles?.includes("Seller")) {
        router.push("/seller/dashboard");
      } else if (roles?.includes("Designer")) {
        router.push("/designer/dashboard");
      } else if (roles?.includes("Manager")) {
        router.push("/manager/dashboard");
      } else if (roles?.includes("QC")) {
        router.push("/qc/dashboard");
      } else if (roles?.includes("Staff")) {
        router.push("/staff/dashboard");
      } else {
        router.push("/"); // fallback
      }
    } catch (error) {
      setError("Something went wrong!");
      setOpen(true);
    }
  };

  const handleForgotPasswordClick = () => {
    setForgotPasswordOpen(true);
    setForgotPasswordStep("email");
    setOtpError("");
  };

  const handleSendResetEmail = async () => {
    // 1.  Kiểm tra email rỗng
    if (!forgotPasswordEmail) {
      setError("Please enter your email"); 
      setOpen(true);
      return;
    }

    // 2. Thêm validation định dạng email bằng Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setError("Please enter a valid email address"); // Thêm validate
      setOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: forgotPasswordEmail,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Sending request failed. Please try again.");
        setOpen(true);
        setIsLoading(false);
        return;
      }

      // Xử lý khi thành công...
      setForgotPasswordStep("otp");
      setOtp("");
      setOtpError("");
      setOtpCountdown(120);
      setIsOtpExpired(false);
      setIsOtpVerified(false);
    } catch (error) {
      setError("An error has occurred! Please try again.");
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

    if (isOtpExpired) {
      setOtpError("OTP has expired. Please request a new one.");
      return;
    }

    setIsLoading(true);
    setOtpError("");

    try {
      const res = await fetch(`${apiClient.defaults.baseURL}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotPasswordEmail,
          otp: otp,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setOtpError(err.message || "Invalid or expired OTP");
        setIsLoading(false);
        return;
      }

      // OTP verified successfully, proceed to reset password
      setIsOtpVerified(true);
      setForgotPasswordStep("reset");
    } catch (error) {
      setOtpError("Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all password fields");
      setOpen(true);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
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
          headers: {
            "Content-Type": "application/json",
          },
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
        setError(err.message || "Failed to reset password");
        setOpen(true);
        setIsLoading(false);
        return;
      }

      // Close forgot password dialog and show success
      setForgotPasswordOpen(false);
      setSuccessOpen(true);
      setForgotPasswordEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError("Something went wrong!");
      setOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (forgotPasswordStep === "otp") {
      setForgotPasswordStep("email");
      setOtp("");
      setOtpError("");
      setIsOtpVerified(false);
    } else if (forgotPasswordStep === "reset") {
      setForgotPasswordStep("otp");
      setNewPassword("");
      setConfirmPassword("");
      setOtpError("");
      setIsOtpVerified(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setForgotPasswordOpen(false);
    setForgotPasswordStep("email");
    setForgotPasswordEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setOtpError("");
    setOtpCountdown(120);
    setIsOtpExpired(false);
    setIsOtpVerified(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-cyan-400 rounded"></div>
          </div>

          {/* Login Form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Login</h1>
              <p className="text-gray-600 mt-1">
                See your growth and get support!
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Input */}
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

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Password*
                </label>
                <Input
                  type="password"
                  placeholder="minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Remember Me & Forgot Password */}
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

              {/* Login Button */}
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
            alt="People working with data visualization"
            className="w-full h-auto"
          />
        </div>
      </div>

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
                  Enter your email address and we'll send you an OTP to reset
                  your password.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleCloseForgotPassword}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button onClick={handleSendResetEmail} disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send OTP"}
                </Button>
              </DialogFooter>
            </>
          )}

          {forgotPasswordStep === "otp" && (
            <>
              <DialogHeader>
                <DialogTitle>Verify OTP</DialogTitle>
                <DialogDescription>
                  We've sent a 6-digit OTP to {forgotPasswordEmail}. Please
                  enter it below.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Enter OTP
                  </label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                      disabled={isLoading || isOtpExpired}
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
                  </div>
                  {otpError && (
                    <p className="text-sm text-red-600 text-center">
                      {otpError}
                    </p>
                  )}
                  <div className="text-center">
                    <p
                      className={`text-sm font-medium ${
                        isOtpExpired ? "text-red-600" : "text-gray-600"
                      }`}
                    >
                      OTP expires in:{" "}
                      <span
                        className={
                          isOtpExpired
                            ? "text-red-600 font-bold"
                            : "text-blue-600 font-bold"
                        }
                      >
                        {Math.floor(otpCountdown / 60)}:
                        {String(otpCountdown % 60).padStart(2, "0")}
                      </span>
                    </p>
                    {isOtpExpired && (
                      <p className="text-xs text-red-500 mt-1">
                        OTP has expired. Please request a new one.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6 || isOtpExpired}
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </DialogFooter>
            </>
          )}

          {forgotPasswordStep === "reset" && (
            <>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Enter your new password below.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter new password (minimum 8 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={isLoading || !newPassword || !confirmPassword}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">
              Reset Link Sent!
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 py-4">Change Password Success</p>
          <DialogFooter>
            <Button onClick={() => setSuccessOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Error</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700">{error}</p>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
