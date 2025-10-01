import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { BookOpen as BookOpenIcon, User, Shield, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { authAPI } from "../services/api";
import useAuthStore from "../store/useAuthStore";
// Don't forget to import the college icon if you're using it in the main heading
// import collegeIcon from "./assets/college.png";

// Import your user icon image
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
  const instructorLimit = limits?.instructor?.limit ?? null;
  const instructorCurrent = limits?.instructor?.current ?? null;
  const instructorLimitReached =
    typeof instructorLimit === "number" &&
    typeof instructorCurrent === "number" &&
    instructorCurrent >= instructorLimit;

  const roleOptions = useMemo(() => {
    let options = [...ALL_ROLES];
    if (isAdminUser && !isSuperAdmin) {
      options = options.filter((r) => r.id !== "admin");
      if (instructorLimitReached) options = options.filter((r) => r.id !== "instructor");
    }
    return options;
  }, [isAdminUser, isSuperAdmin, instructorLimitReached]);

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

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm();

  const roleIsStudent = selectedRole === "student";
  const roleIsAdmin = selectedRole === "admin";
  const roleIsInstructor = selectedRole === "instructor";

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const { data } = await authAPI.getOrgPermissions();
        if (!on) return;
        const lim = Number(data?.instructor?.limit ?? data?.limits?.instructor?.limit ?? NaN);
        const cur = Number(data?.instructor?.current ?? data?.limits?.instructor?.current ?? NaN);
        setLimits({ instructor: { limit: Number.isFinite(lim) ? lim : null, current: Number.isFinite(cur) ? cur : null } });
      } catch { }
    })();
    return () => { on = false; };
  }, []);

  const onSelectRole = (roleId) => {
    if (roleId !== "student") {
      setValue("year", "");
      setValue("branch", "");
    }
    if (roleId === "admin") {
      setValue("fullName", "");
    } else {
      setValue("collegeName", "");
    }
    setSelectedRole(roleId);
  };

  const onSubmit = async (data) => {
    if (isAdminUser && !isSuperAdmin && selectedRole === "admin") {
      toast.error("Admins are not allowed to create Admin accounts.");
      return;
    }
    if (roleIsInstructor && isAdminUser && !isSuperAdmin && instructorLimitReached) {
      toast.error("Instructor limit reached. You can’t add more instructors.");
      return;
    }

    setIsLoading(true);
    try {
      const fullNamePayload = roleIsAdmin
        ? (data.collegeName || "").trim()
        : (data.fullName || "").trim();

      const body = {
        fullName: fullNamePayload,
        email: data.email,
        role: String(selectedRole || "student").toUpperCase(),
        branch: roleIsStudent ? (data.branch || undefined) : undefined,
        year: roleIsStudent ? (data.year || undefined) : undefined,
        mobile: data.mobile || undefined,
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

  const onBulkUpload = async (e) => {
    e.preventDefault();
    if (isAdminUser && !isSuperAdmin && instructorLimitReached) {
      toast.error("Instructor limit reached. Bulk upload is disabled.");
      return;
    }
    if (!bulkFile) return toast.error("Please select an Excel/CSV file");
    setBulkLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", bulkFile);
      const { data } = await authAPI.registerBulk(fd);
      setBulkSummary(data.summary);
      toast.success("Bulk upload processed");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Bulk upload failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ["fullName", "email", "role", "year", "branch", "mobile"];
    const sample = [
      ["Alice Johnson", "alice@example.com", "student", "1", "CSE", "9876543210"],
      ["Riverdale College", "principal@riverdale.edu", "admin", "", "", "9876500001"],
      ["Bob Smith", "bob@example.com", "instructor", "", "ECE", "9876500002"],
    ];
    const rows = [headers, ...sample].map((r) => r.join(",")).join("\n");
    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-users-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-6 sm:p-8">
        {/* Main Title with Icon */}
        <div className="flex items-center justify-center mb-4">
          <img
            src={userIcon}
            alt="User Icon"
            className="h-10 w-10 mr-3"
          />
          <h2 className="text-2xl font-bold text-gray-900">
            Add Users
          </h2>
        </div>
        <p className="text-center text-gray-500 text-sm mb-6">
          Fill out the form below to add a new user or upload a list of users.
        </p>

        {/* Mode Toggle - Aligned Left */}
        <div className="mb-6 flex justify-start gap-3">
          <button 
            onClick={() => setMode("single")}
            className={`px-4 py-2 text-sm rounded-lg border-2 font-medium transition-all ${
              mode === "single" 
                ? "bg-blue-600 border-blue-600 text-white" 
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
            type="button">
            Single User
          </button>
          <button 
            onClick={() => setMode("bulk")}
            className={`px-4 py-2 text-sm rounded-lg border-2 font-medium transition-all ${
              mode === "bulk" 
                ? "bg-blue-600 border-blue-600 text-white" 
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
            type="button">
            Bulk Upload
          </button>
        </div>

        {/* SINGLE MODE */}
        {mode === "single" && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role selection */}
            <div className="mt-4">
              <h2 className="text-base font-medium text-gray-900 text-center mb-4">Select User Role</h2>
              <div className="flex justify-center gap-6 mb-6">
                {roleOptions.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => onSelectRole(role.id)}
                    className={`w-36 h-36 flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedRole === role.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`p-2 rounded-full ${role.color} mb-2`}>
                      {role.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {role.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Basic Information section */}
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-4 border-l-4 border-blue-500 pl-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!roleIsAdmin ? (
                  <Input label="Full name" type="text" autoComplete="name"
                    error={errors.fullName?.message}
                    {...register("fullName", { required: "Full name is required", minLength: { value: 2, message: "At least 2 characters" } })}
                  />
                ) : (
                  <Input label="College name" type="text" autoComplete="organization"
                    error={errors.collegeName?.message}
                    {...register("collegeName", { required: "College name is required", minLength: { value: 2, message: "At least 2 characters" } })}
                  />
                )}
                <Input label="Email address" type="email" autoComplete="email"
                  error={errors.email?.message}
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email" },
                  })}
                />
              </div>
            </div>

            {/* Student-specific fields */}
            {roleIsStudent && (
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-4 border-l-4 border-blue-500 pl-4">
                  Student Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Year (1/2/3/4)" type="text" {...register("year")} />
                  <Input label="Branch" type="text" {...register("branch")} />
                </div>
              </div>
            )}

            <Input label="Mobile" type="text" {...register("mobile")} />

            <div className="flex items-center mt-2">
              <input id="agree-terms" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                {...register("agreeTerms", { required: "You must agree to the terms" })} />
              <label htmlFor="agree-terms" className="ml-2 text-xs sm:text-sm text-gray-900">
                I agree to the <Link to="/terms" className="text-blue-600 hover:text-blue-500">Terms</Link> and <Link to="/privacy" className="text-blue-600 hover:text-blue-500">Privacy</Link>.
              </label>
            </div>
            {errors.agreeTerms && <p className="text-sm text-red-600">{errors.agreeTerms.message}</p>}

            <div className="mt-4">
              <Button
                type="submit"
                size="sm"
                className="w-32 mx-auto flex justify-center py-1.5 text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add User"}
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-2">
              A temporary password will be emailed to the user. They’ll be asked to set a new one on first login.
            </p>
          </form>
        )}

        {/* BULK MODE */}
        {mode === "bulk" && (
          <div className="mt-2">
            <h3 className="text-base font-semibold text-gray-800 mb-4 border-l-4 border-blue-500 pl-4">
              Bulk Upload
            </h3>
            {isAdminUser && !isSuperAdmin && instructorLimitReached && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">
                Instructor limit reached. Please ensure your CSV does not include instructor rows. Bulk upload is disabled for Admins while the limit is reached.
              </div>
            )}

            <form className="space-y-6" onSubmit={onBulkUpload}>
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-8">
                <p className="text-sm text-gray-700 mb-2">Upload a <span className="font-medium">CSV/XLSX</span> file with the following columns:</p>
                <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                  <li><code>fullName</code> (required; for Admin, put <em>College name</em> here)</li>
                  <li><code>email</code> (required)</li>
                  <li><code>role</code> (student | instructor | admin)</li>
                  <li><code>year</code> (students only)</li>
                  <li><code>branch</code> (students/instructors optional)</li>
                  <li><code>mobile</code></li>
                </ul>
                <div className="mt-6 flex items-center gap-4">
                  <input type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-900 file:mr-4 file:py-3 file:px-6 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    disabled={isAdminUser && !isSuperAdmin && instructorLimitReached}
                  />
                </div>
                <div className="mt-4 text-center">
                  <Button type="button" variant="secondary" onClick={downloadTemplate} className="w-full md:w-auto text-blue-600 hover:text-blue-500">
                    Download Template
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">For Admin rows, put the <strong>College name</strong> into <code>fullName</code>.</p>
              </div>

              <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700" loading={bulkLoading}
                disabled={bulkLoading || (isAdminUser && !isSuperAdmin && instructorLimitReached)}>
                <Upload className="mr-2" size={18} /> Upload & Create Accounts
              </Button>

              {bulkSummary && (
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                  <div><span className="font-medium">Total:</span> {bulkSummary.total}</div>
                  <div><span className="font-medium">Created:</span> {bulkSummary.created}</div>
                  <div><span className="font-medium">Skipped:</span> {bulkSummary.skipped}</div>
                  <div><span className="font-medium">Errors:</span> {bulkSummary.errors}</div>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}