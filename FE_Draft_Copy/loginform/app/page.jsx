"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  const router = useRouter();

  // ================== PASSWORD VISIBILITY ==================
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ================== FORM STATES ==================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  // Forgot password
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordStep, setForgotPasswordStep] = useState("email");

  // OTP
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(120);
  const [isOtpExpired, setIsOtpExpired] = useState(false);

  // Reset password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Success
  const [successOpen, setSuccessOpen] = useState(false);

  // ============ OTP countdown =============
  useEffect(() => {
    let interval;

    if (forgotPasswordStep === "otp" && otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev - 1 === 0) setIsOtpExpired(true);
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [forgotPasswordStep, otpCountdown]);

  // ============ LOGIN =============
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
        headers: { "Content-Type": "application/json" },
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
        setError("No token received");
        setOpen(true);
        return;
      }

      const decoded = jwtDecode(token);

      const roles =
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      const userId =
        decoded[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ] || decoded.sub;

      if (userId) localStorage.setItem("userId", userId);
      if (rememberMe) localStorage.setItem("token", token);
      else sessionStorage.setItem("token", token);

      if (roles?.includes("Seller")) router.push("/seller/dashboard");
      else if (roles?.includes("Designer")) router.push("/designer/dashboard");
      else if (roles?.includes("Manager")) router.push("/manager/dashboard");
      else if (roles?.includes("QC")) router.push("/qc/dashboard");
      else if (roles?.includes("Staff")) router.push("/staff/dashboard");
      else router.push("/");
    } catch (err) {
      setError("Something went wrong!");
      setOpen(true);
    }
  };

  // ============ FORGOT PASSWORD OPEN =============
  const handleForgotPasswordClick = () => {
    setForgotPasswordOpen(true);
    setForgotPasswordStep("email");
    setOtpError("");
  };

  // ============ SEND OTP EMAIL =============
  const handleSendResetEmail = async () => {
    if (!forgotPasswordEmail) {
      setError("Please enter your email");
      setOpen(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setError("Please enter a valid email");
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
        setError(err.message || "Failed to send OTP");
        setOpen(true);
        return;
      }

      setForgotPasswordStep("otp");
      setOtp("");
      setOtpCountdown(120);
      setIsOtpExpired(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ VERIFY OTP =============
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }

    if (isOtpExpired) {
      setOtpError("OTP expired");
      return;
    }

    setIsLoading(true);
    setOtpError("");

    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: forgotPasswordEmail,
            otp: otp,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setOtpError(err.message || "Invalid OTP");
        return;
      }

      setForgotPasswordStep("reset");
    } finally {
      setIsLoading(false);
    }
  };

  // ============ RESET PASSWORD ============
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      setOpen(true);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
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
        setError(err.message || "Failed to reset password");
        setOpen(true);
        return;
      }

      setForgotPasswordOpen(false);
      setSuccessOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // ============ BACK BUTTON ============
  const handleBack = () => {
    if (forgotPasswordStep === "otp") {
      setForgotPasswordStep("email");
      setOtp("");
    } else if (forgotPasswordStep === "reset") {
      setForgotPasswordStep("otp");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  // ============ CLOSE ============
  const handleCloseForgotPassword = () => {
    setForgotPasswordOpen(false);
    setForgotPasswordStep("email");
    setForgotPasswordEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setOtpError("");
    setOtpCountdown(120);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* LEFT LOGIN SECTION */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Login</h1>
              <p className="text-gray-600 mt-1">
                See your growth and get support!
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* EMAIL */}
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

              {/* PASSWORD WITH EYE */}
              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-gray-700">
                  Password*
                </label>

                <Input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10"
                />

                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-10 text-gray-600"
                >
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* REMEMBER + FORGOT */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                  />
                  <label className="text-sm text-gray-600">Remember me</label>
                </div>

                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Forgot password?
                </button>
              </div>

              {/* LOGIN BUTTON */}
              <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3">
                Login
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* RIGHT IMAGE */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-purple-50 items-center justify-center p-8">
        <img
          src="/isometric-3d-illustration-of-people-working-with-d.jpg"
          alt="People working with data visualization"
          className="w-full h-auto"
        />
      </div>

      {/* ======================================================
           FORGOT PASSWORD DIALOG
      ====================================================== */}
      <Dialog
        open={forgotPasswordOpen}
        onOpenChange={handleCloseForgotPassword}
      >
        <DialogContent className="sm:max-w-[425px]">
          {/* STEP 1: ENTER EMAIL */}
          {forgotPasswordStep === "email" && (
            <>
              <DialogHeader>
                <DialogTitle>Forgot Password</DialogTitle>
                <DialogDescription>
                  Enter your email address to receive OTP.
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
                    disabled={isLoading}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseForgotPassword}>
                  Cancel
                </Button>
                <Button onClick={handleSendResetEmail}>
                  {isLoading ? "Sending..." : "Send OTP"}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* STEP 2: ENTER OTP */}
          {forgotPasswordStep === "otp" && (
            <>
              <DialogHeader>
                <DialogTitle>Verify OTP</DialogTitle>
                <DialogDescription>
                  OTP sent to {forgotPasswordEmail}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
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

                {otpError && (
                  <p className="text-sm text-red-600 text-center">{otpError}</p>
                )}

                <p className="text-center text-sm">
                  OTP expires in:{" "}
                  <span className="font-bold text-blue-600">
                    {Math.floor(otpCountdown / 60)}:
                    {String(otpCountdown % 60).padStart(2, "0")}
                  </span>
                </p>

                {isOtpExpired && (
                  <p className="text-xs text-red-500 text-center">
                    OTP expired. Please request again.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || isOtpExpired}
                >
                  Verify OTP
                </Button>
              </DialogFooter>
            </>
          )}

          {/* STEP 3: RESET PASSWORD */}
          {forgotPasswordStep === "reset" && (
            <>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>Enter your new password.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* NEW PASSWORD WITH EYE */}
                <div className="space-y-2 relative">
                  <label className="text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password (min 8 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-10 text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* CONFIRM PASSWORD WITH EYE */}
                <div className="space-y-2 relative">
                  <label className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-10 text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={!newPassword || !confirmPassword}
                >
                  Reset Password
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* SUCCESS */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">
              Password Reset Successful!
            </DialogTitle>
          </DialogHeader>
          <p className="py-4 text-gray-700">
            Your password has been reset successfully.
          </p>
          <DialogFooter>
            <Button onClick={() => setSuccessOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
