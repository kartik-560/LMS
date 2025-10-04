import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { BookOpen as BookOpenIcon, User, Shield, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { authAPI } from "../services/api";
import useAuthStore from "../store/useAuthStore";
import userIcon from "../assets/user.jpg";

const ALL_ROLES = [
  { id: "student", title: "Student", icon: <User size={24} />, color: "bg-blue-100 text-blue-600" },
  { id: "instructor", title: "Instructor", icon: <BookOpenIcon size={24} />, color: "bg-green-100 text-green-600" },
  { id: "admin", title: "Admin", icon: <Shield size={24} />, color: "bg-purple-100 text-purple-600" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const roleLC = (currentUser?.role || "").toLowerCase();
  const isAdminUser = roleLC === "admin";
  const isSuperAdmin = roleLC === "superadmin";

  const [mode, setMode] = useState("single");
  const [limits, setLimits] = useState({ instructor: { limit: null, current: null } });

  const roleOptions = useMemo(() => {
    let options = [...ALL_ROLES];
    if (isAdminUser && !isSuperAdmin) {
      options = options.filter((r) => r.id !== "admin");
    }
    return options;
  }, [isAdminUser, isSuperAdmin]);

  const [selectedRole, setSelectedRole] = useState(roleOptions[0]?.id || "student");

  useEffect(() => {
    if (!roleOptions.find((r) => r.id === selectedRole)) {
      setSelectedRole(roleOptions[0]?.id || "student");
    }
  }, [roleOptions, selectedRole]);

  const [isLoading, setIsLoading] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSummary, setBulkSummary] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();

  const roleIsStudent = selectedRole === "student";
  const roleIsAdmin = selectedRole === "admin";
  const roleIsInstructor = selectedRole === "instructor";

  const onSelectRole = (roleId) => {
    setSelectedRole(roleId);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const fullNamePayload = roleIsAdmin
        ? (data.collegeName || "").trim()
        : (data.fullName || "").trim();

      const body = {
        fullName: fullNamePayload,
        email: data.email,
        role: selectedRole, // ✅ lowercase for schema
        branch: roleIsStudent ? (data.branch || undefined) : undefined,
        year: roleIsStudent ? (data.year || undefined) : undefined,
        rollNumber: roleIsStudent ? (data.rollNumber || undefined) : undefined,
        academicYear: roleIsStudent ? (data.academicYear || undefined) : undefined,
        mobile: data.mobile || undefined,
        collegeId: data.collegeId || undefined, // optional field
        sendInvite: true,
      };

      const res = await authAPI.register(body);
      if (res?.data?.success === false) throw new Error(res.data.message || "Registration failed");

      toast.success("User created. A temporary password has been emailed.");
      reset();
      navigate("/login");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.msg ||
        err?.message || "Registration failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="flex items-center justify-center mb-4">
          <img src={userIcon} alt="User Icon" className="h-10 w-10 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Add Users</h2>
        </div>

        {/* Single User Form */}
        {mode === "single" && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Selection */}
            <div className="mt-4">
              <h2 className="text-base font-medium text-gray-900 text-center mb-4">Select User Role</h2>
              <div className="flex justify-center gap-6 mb-6">
                {roleOptions.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => onSelectRole(role.id)}
                    className={`w-36 h-36 flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedRole === role.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`p-2 rounded-full ${role.color} mb-2`}>{role.icon}</div>
                    <span className="text-sm font-medium text-gray-900">{role.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!roleIsAdmin ? (
                <Input
                  label="Full Name"
                  type="text"
                  {...register("fullName", { required: "Full name is required" })}
                  error={errors.fullName?.message}
                />
              ) : (
                <Input
                  label="College Name"
                  type="text"
                  {...register("collegeName", { required: "College name is required" })}
                  error={errors.collegeName?.message}
                />
              )}
              <Input
                label="Email"
                type="email"
                {...register("email", { required: "Email is required" })}
                error={errors.email?.message}
              />
            </div>

            {/* Student Specific Fields */}
            {roleIsStudent && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Year" type="text" {...register("year")} />
                <Input label="Branch" type="text" {...register("branch")} />
                <Input label="Roll Number" type="text" {...register("rollNumber")} />
                <Input label="Academic Year" type="text" {...register("academicYear")} />
              </div>
            )}

            <Input label="Mobile" type="text" {...register("mobile")} />
            <Input label="College ID" type="text" {...register("collegeId")} />

            <Button
              type="submit"
              size="sm"
              className="w-32 mx-auto flex justify-center py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add User"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
