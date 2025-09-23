import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { BookOpen, Shield, Mail } from "lucide-react";
import { toast } from "react-hot-toast";
import { authAPI } from "../services/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import useAuthStore from "../store/useAuthStore"; // Import Zustand store

const LoginPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState("choice"); // For Google/Email choice
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const ROLE = {
    SUPERADMIN: "SUPERADMIN",
    ADMIN: "ADMIN",
    INSTRUCTOR: "INSTRUCTOR",
    STUDENT: "STUDENT",
  };

  // Google login handler
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`;  // Adjust URL as needed
  };

  const normalizeRole = (raw) =>
    String(raw || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, "_");

  // Handle email signup
  const handleEmailSignup = async ({ email, password }) => {
    console.log("user.role", useAuthStore.getState().user?.role);
    setIsLoading(true);
    try {
      const resp = await authAPI.login({ email, password });
      const response = resp.data.data; // { user, token }
      const user = response.user;
      const token = response.token;

      // Canonicalize role to one of ROLE values
      const roleRaw = normalizeRole(user.role);
      // Map common variants to canonical constants
      const canonicalRole =
        roleRaw === "SUPERADMIN" ? ROLE.SUPERADMIN :
          roleRaw === "ADMIN" ? ROLE.ADMIN :
            roleRaw === "INSTRUCTOR" ? ROLE.INSTRUCTOR :
              ROLE.STUDENT;

      // Persist
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user_role", canonicalRole);
      localStorage.setItem("user", JSON.stringify({ ...user, role: canonicalRole }));

      // Zustand store
      useAuthStore.getState().login({ ...user, role: canonicalRole }, token);

      // Redirect by role
      console.log("Login successful, role:", canonicalRole);
      switch (canonicalRole) {
        case ROLE.SUPERADMIN:
          navigate("/superadmin", { replace: true });
          break;
        case ROLE.ADMIN:
          navigate("/admin", { replace: true });
          break;
        case ROLE.INSTRUCTOR:
          navigate("/instructor", { replace: true });
          break;
        default:
          navigate("/dashboard", { replace: true }); // student
      }

      toast.success("Login successful!");
    } catch (e) {
      console.log("Login error:", e);
      toast.error(e?.response?.data?.message || "Login failed");
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
            Login to access your learning account
          </p>
          <Link to="/signup">

            <div className="text-large text-blue-700">
              signup to your account
            </div>
          </Link>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 sm:py-8 sm:px-10 shadow-xl sm:rounded-2xl border border-gray-100">
          {step === "choice" && (
            <div className="space-y-4">
              {/* Google signup button */}
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

              {/* Email signup button */}
              <Button
                onClick={() => setStep("email")}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
                size="lg"
              >
                <Mail size={20} className="text-gray-500" />
                <span>Login with Email</span>
              </Button>
            </div>
          )}

          {step === "email" && (
            <form
              className="space-y-5 sm:space-y-6"
              onSubmit={handleSubmit(handleEmailSignup)}
            >
              {/* Email input */}
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

              {/* Password input */}
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
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          )}

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
        <p className="mt-2 text-xs text-gray-400">
          © 2025 Pugarch. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
