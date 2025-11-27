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
} from "@/components/ui/input-otp";

export default function LoginPage() {
  const router = useRouter();

  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Dialogs & error
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  // Forgot password system
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordStep, setForgotPasswordStep] = useState("email");

  // OTP
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(120);
  const [isOtpExpired, setIsOtpExpired] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Reset pwd
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loading
  const [isLoading, setIsLoading] = useState(false);

  // Success dialog
  const [successOpen, setSuccessOpen] = useState(false);

  // OTP Countdown
  useEffect(() => {
    if (forgotPasswordStep !== "otp") return;

    if (otpCountdown <= 0) {
      setIsOtpExpired(true);
      return;
    }

    const interval = setInterval(() => {
      setOtpCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [forgotPasswordStep, otpCountdown]);

  // MAIN LOGIN -------------------------------------------------------
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
        credentials: "include",
        body: JSON.stringify({
          userNameOrEmail: email,
          password: password,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Login failed");
        setOpen(true);
        return;
      }

      const data = await res.json();
      const token = data?.accessToken;

      if (!token) {
        setError("No token received from server");
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

      // Redirect by role
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

  // FORGOT PASSWORD --------------------------------------------------
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
        setError(err.message || "Sending request failed. Please try again.");
        setOpen(true);
        return;
      }

      setForgotPasswordStep("otp");
      setOtp("");
      setOtpError("");
      setOtpCountdown(120);
      setIsOtpExpired(false);
      setIsOtpVerified(false);
    } catch {
      setError("An error has occurred! Please try again.");
      setOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // VERIFY OTP -------------------------------------------------------
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
        setOtpError(err.message || "Invalid or expired OTP");
        return;
      }

      setIsOtpVerified(true);
      setForgotPasswordStep("reset");
    } catch {
      setOtpError("Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // RESET PASSWORD ---------------------------------------------------
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: forgotPasswordEmail,
            otp: otp,
            newPassword,
            confirmPassword,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Failed to reset password");
        setOpen(true);
        return;
      }

      // Reset UI
      setForgotPasswordOpen(false);
      setSuccessOpen(true);

      setForgotPasswordEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong!");
      setOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP BACK --------------------------------------------------------
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

  // CLOSE POPUP ------------------------------------------------------
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

  // RENDER -----------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* LEFT LOGIN FORM */}
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
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Password*
                </label>
                <Input
                  type="password"
                  placeholder="minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                  />
                  <label className="text-sm text-gray-600" htmlFor="remember">
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

      {/* RIGHT ILLUSTRATION */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-purple-50 items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <img
            src="/isometric-3d-illustration-of-people-working-with-d.jpg"
            alt="Illustration"
            className="w-full h-auto"
          />
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
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
                  Enter your email and we will send you an OTP.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <label className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  disabled={isLoading}
                />
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

          {forgotPasswordStep === "otp" && (
            <>
              <DialogHeader>
                <DialogTitle>Verify OTP</DialogTitle>
                <DialogDescription>
                  OTP sent to {forgotPasswordEmail}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
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
                  <p className="text-sm text-red-600 text-center">{otpError}</p>
                )}

                <p
                  className={`text-center text-sm ${
                    isOtpExpired ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  OTP expires in:{" "}
                  <span
                    className={`font-bold ${
                      isOtpExpired ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    {Math.floor(otpCountdown / 60)}:
                    {String(otpCountdown % 60).padStart(2, "0")}
                  </span>
                </p>

                {isOtpExpired && (
                  <p className="text-xs text-red-500 text-center">
                    OTP has expired. Please request a new one.
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

          {forgotPasswordStep === "reset" && (
            <>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>Enter your new password.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <label className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <label className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
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

      {/* SUCCESS DIALOG */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">
              Password Changed!
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

      {/* ERROR DIALOG */}
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
