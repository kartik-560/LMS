import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { BookOpen, Shield, Mail, Loader2, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { authAPI } from "../services/api";

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [step, setStep] = useState("choice"); // "choice" | "email" | "passwordLogin"
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const startLockTimer = () => {
    setIsLocked(true);
    setLockTimer(15 * 60);
    const interval = setInterval(() => {
      setLockTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsLocked(false);
          setLoginAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatLockTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Google login
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;
  };

  // OTP flow
  const handleSendOtp = async ({ email }) => {
    setIsLoading(true);
    try {
      const response = await authAPI.loginOtpBegin({ email });
      const userExists = response?.data?.userExists;
      setIsFirstTimeUser(!userExists);

      toast.success("OTP sent successfully!");
      setOtpSent(true);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async ({ email, otp, password }) => {
    setIsLoading(true);
    try {
      const response = await authAPI.loginOtpVerify(email, otp);
      const { token } = response.data.data;

      if (!isFirstTimeUser) {
        const passwordValid = await authAPI.verifyPassword({ email, password });
        if (!passwordValid) throw new Error("Invalid password");
      }

      localStorage.setItem("auth_token", token);
      sessionStorage.setItem("auth_token", token);
      useAuthStore.getState().setToken(token);

      navigate("/dashboard", { replace: true });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Invalid OTP or password");
    } finally {
      setIsLoading(false);
    }
  };

  // Password-only login
  const handlePasswordLogin = async ({ email, password }) => {
    setIsLoading(true);
    try {
      const response = await authAPI.loginWithPassword({ email, password });
      const { token } = response.data;

      localStorage.setItem("auth_token", token);
      sessionStorage.setItem("auth_token", token);
      useAuthStore.getState().setToken(token);

      navigate("/dashboard", { replace: true });
    } catch (e) {
      toast.error(e?.response?.data?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpen size={28} className="text-white" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome to PugArch LMS
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-3">
            Sign in to access your learning dashboard
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 sm:py-8 sm:px-10 shadow-xl sm:rounded-2xl border border-gray-100">
          {step === "choice" && (
            <div className="space-y-4">
              {/* Google */}
              <Button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center space-x-2"
                size="lg"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google logo"
                  className="w-5 h-5"
                />
                <span>Continue with Google</span>
              </Button>

              {/* OTP Email */}
              <Button
                onClick={() => setStep("email")}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
                size="lg"
              >
                <Mail size={20} className="text-gray-500" />
                <span>Continue with Email (OTP)</span>
              </Button>

              {/* Password */}
              <Button
                onClick={() => setStep("passwordLogin")}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
                size="lg"
              >
                <Lock size={20} className="text-gray-500" />
                <span>Continue with Password</span>
              </Button>
            </div>
          )}

          {/* OTP flow */}
          {step === "email" && (
            <form
              className="space-y-5 sm:space-y-6"
              onSubmit={handleSubmit(otpSent ? handleVerifyOtp : handleSendOtp)}
            >
              <Input
                label="Email address"
                type="email"
                placeholder="Enter your email"
                error={errors.email?.message}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Please enter a valid email address",
                  },
                })}
                leftElement={
                  <Mail
                    size={20}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                }
                className="pl-10"
              />

              {otpSent && (
                <>
                  <Input
                    label="OTP"
                    type="text"
                    placeholder="Enter the OTP"
                    error={errors.otp?.message}
                    {...register("otp", {
                      required: "OTP is required",
                      minLength: { value: 4, message: "OTP must be at least 4 digits" },
                    })}
                  />

                  {!isFirstTimeUser && (
                    <Input
                      label="Password"
                      type="password"
                      placeholder="Enter your password"
                      error={errors.password?.message}
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 6,
                          message: "Password must be at least 6 characters",
                        },
                      })}
                    />
                  )}
                </>
              )}

              <Button
                type="submit"
                className="w-full flex items-center justify-center"
                disabled={isLoading || isLocked}
                size="lg"
              >
                {isLoading && <Loader2 size={20} className="mr-2 animate-spin" />}
                {isLocked && !isLoading && <Lock size={20} className="mr-2" />}
                {isLoading
                  ? otpSent
                    ? "Verifying OTP..."
                    : "Sending OTP..."
                  : isLocked
                  ? `Locked (${formatLockTime(lockTimer)})`
                  : otpSent
                  ? "Verify OTP"
                  : "Send OTP"}
              </Button>

              <Button
                type="button"
                onClick={() => setStep("choice")}
                variant="ghost"
                className="w-full"
              >
                ← Back
              </Button>
            </form>
          )}

          {/* Password login */}
          {step === "passwordLogin" && (
            <form
              className="space-y-5 sm:space-y-6"
              onSubmit={handleSubmit(handlePasswordLogin)}
            >
              <Input
                label="Email address"
                type="email"
                placeholder="Enter your email"
                error={errors.email?.message}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Please enter a valid email address",
                  },
                })}
                leftElement={
                  <Mail
                    size={20}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                }
                className="pl-10"
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />

              <Button
                type="submit"
                className="w-full flex items-center justify-center"
                disabled={isLoading}
                size="lg"
              >
                {isLoading && <Loader2 size={20} className="mr-2 animate-spin" />}
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>

              <Button
                type="button"
                onClick={() => setStep("choice")}
                variant="ghost"
                className="w-full"
              >
                ← Back
              </Button>
            </form>
          )}

          {/* Security note */}
          <div className="mt-5 sm:mt-6 p-3 bg-gray-50 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-2">
              <Shield size={14} className="text-gray-500" />
              <span className="text-xs sm:text-sm text-gray-600">
                Your data is protected with enterprise-grade security
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 sm:mt-8 text-center">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
          <Link to="/help" className="hover:text-gray-700 transition-colors">
            Help Center
          </Link>
          <Link to="/privacy" className="hover:text-gray-700 transition-colors">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-gray-700 transition-colors">
            Terms
          </Link>
        </div>
        <p className="mt-2 text-xs text-gray-400">© 2025 Pugarch. All rights reserved.</p>
      </div>
    </div>
  );
};

export default LoginPage;
