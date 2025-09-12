import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Eye,
  EyeOff,
  BookOpen,
  Shield,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { authAPI } from "../services/api";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const startLockTimer = () => {
    setIsLocked(true);
    setLockTimer(15 * 60); // 15 minutes in seconds

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

const toBool = (v) => v === true || v === "true" || v === 1 || v === "1";

const onSubmit = async ({ email, password }) => {
  setIsLoading(true);
  try {
    const { data } = await authAPI.login({
      email: String(email || "").trim().toLowerCase(),
      password,
    });

    const env   = data?.data ?? data ?? {};
    const user  = env.user ?? env.userInfo ?? env.profile ?? null;
    const token = env.token ?? env.accessToken ?? env.jwt ?? null;

    if (!user || !token) throw new Error("Invalid login response");

    const mustChangePassword = toBool(
      env.mustChangePassword ??
      env.must_change_password ??
      user?.mustChangePassword ??
      user?.must_change_password
    );

    const apiRole = String(user.role || "").toLowerCase();
    const role =
      apiRole === "super_admin" ? "superadmin" :
      apiRole === "admin"       ? "admin"       :
      apiRole === "instructor"  ? "instructor"  :
                                  "student";

    const uiUser = {
      ...user,
      name: user.fullName || user.name || "User",
      role,
      mustChangePassword,
    };

    // persist + store
    sessionStorage.setItem("auth_token", token); // or localStorage if you prefer
    sessionStorage.setItem("auth_user", JSON.stringify(uiUser));
    login(uiUser, token);

    // simple, reliable redirect
    if (mustChangePassword) {
      navigate("/first-login", { replace: true });
      return;
    }

    // role routes
    if (role === "superadmin") navigate("/superadmin", { replace: true });
    else if (role === "admin") navigate("/admin", { replace: true });
    else if (role === "instructor") navigate("/instructor", { replace: true });
    else navigate("/dashboard", { replace: true });

  } catch (e) {
    toast.error(e?.response?.data?.message || "Invalid credentials");
  } finally {
    setIsLoading(false);
  }
};




  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Header */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpen size={32} className="text-white" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Pugarch
          </h2>
          <p className="text-gray-600 mb-2">
            Sign in to access your learning dashboard
          </p>
          <Link
            to="/"
            className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
          >
            <Button>Back To Home</Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          {/* Security Status */}
          {isLocked && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Lock size={16} className="text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Account Temporarily Locked
                </span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Too many failed attempts. Try again in{" "}
                {formatLockTime(lockTimer)}
              </p>
            </div>
          )}

          {/* Login Attempts Warning */}
          {loginAttempts > 0 && !isLocked && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle size={16} className="text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  {loginAttempts} failed attempt{loginAttempts > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                {5 - loginAttempts} attempt{5 - loginAttempts !== 1 ? "s" : ""}{" "}
                remaining before account lock
              </p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <Input
                label="Email address"
                type="email"
                autoComplete="email"
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
            </div>

            <div>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                leftElement={
                  <Lock
                    size={20}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                }
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
                className="pl-10 pr-10"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me for 30 days
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full relative"
                loading={isLoading}
                disabled={isLoading || isLocked}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="mr-2 animate-spin" />
                    Signing you in...
                  </>
                ) : isLocked ? (
                  <>
                    <Lock size={20} className="mr-2" />
                    Locked ({formatLockTime(lockTimer)})
                  </>
                ) : (
                  "Sign in to Pugarch"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Shield size={14} className="text-gray-500" />
              <span className="text-xs text-gray-600">
                Your data is protected with enterprise-grade security
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
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
        <p className="mt-2 text-xs text-gray-400">
          © 2025 Pugarch. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
