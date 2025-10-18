import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { BookOpen as BookOpenIcon, User, Shield, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import useAuthStore from "../store/useAuthStore";
import userIcon from "../assets/user.jpg";
import { authAPI, collegesAPI } from "../services/api";

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

  const roleOptions = useMemo(() => {
    let options = [...ALL_ROLES];
    // if (isAdminUser && !isSuperAdmin) {
    //   options = options.filter((r) => r.id !== "admin");
    // }
    return options;
  }, [isAdminUser, isSuperAdmin]);

  const [selectedRole, setSelectedRole] = useState(roleOptions[0]?.id || "student");

  useEffect(() => {
    if (!roleOptions.find((r) => r.id === selectedRole)) {
      setSelectedRole(roleOptions[0]?.id || "student");
    }
  }, [roleOptions, selectedRole]);

  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch, resetField } = useForm();
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const roleIsStudent = selectedRole === "student";
  const roleIsAdmin = selectedRole === "admin";
  const roleIsInstructor = selectedRole === "instructor";
  const [colleges, setColleges] = useState([]);
  
  const onSelectRole = (roleId) => {
    setSelectedRole(roleId);
  };

  useEffect(() => {
    async function fetchColleges() {
      try {
        const res = await collegesAPI.getColleges();
        setColleges(res.data?.data?.items || []);
      } catch (err) {
        console.error("Failed to fetch colleges", err);
        setColleges([]);
      }
    }
    fetchColleges();
  }, []);
  
  useEffect(() => {
    if (isAdminUser && !isSuperAdmin && currentUser?.collegeId) {
      setValue("collegeId", currentUser.collegeId);
    }
  }, [isAdminUser, isSuperAdmin, currentUser, setValue]);

  const selectedCollegeId = watch("collegeId");

  const collegeIdToFetch = selectedCollegeId || (isAdminUser && !isSuperAdmin ? currentUser?.collegeId : null);

 useEffect(() => {
    async function fetchDepartmentsForCollege() {
      if (!collegeIdToFetch) {
        setDepartments([]);
        return;
      }
      try {
        setLoadingDepartments(true);
        const res = await collegesAPI.getDepartmentsForCollege(collegeIdToFetch);
        
        setDepartments(res.data?.data?.items || []);
        resetField("departmentId");
      } catch (err) {
        console.error("💥 FAILED to fetch departments:", err);
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    }

    fetchDepartmentsForCollege();
  }, [collegeIdToFetch, resetField]);

  const onSubmit = async (data) => {
    // ... (rest of the code is unchanged)
    setIsLoading(true);
    try {
      const body = {
        fullName: (data.fullName || "").trim(),
        email: data.email,
        role: selectedRole,
        departmentId: (roleIsStudent || roleIsInstructor) ? data.departmentId : undefined,
        year: roleIsStudent ? data.year : undefined,
        rollNumber: roleIsStudent ? data.rollNumber : undefined,
        academicYear: roleIsStudent ? data.academicYear : undefined,
        mobile: data.mobile || undefined,
        collegeId: data.collegeId,
        sendInvite: true,
      };
      
      const res = await authAPI.register(body);
      if (res?.data?.success === false) throw new Error(res.data.message || "Registration failed");
      
      toast.success("User created. A temporary password has been emailed.");
      reset();
      navigate("/login");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Registration failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const collegeDropdown = (
    <div className="flex flex-col">
      <label className="text-gray-700 font-medium mb-1">College</label>
      <select 
        {...register("collegeId", { required: "College is required" })}
        className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-300"
      >
        <option value="">Select a college</option>
        {(colleges || []).map((college) => (
          <option key={college.id} value={college.id}>
            {college.name}
          </option>
        ))}
      </select>
      {errors.collegeId && (
        <p className="text-red-500 text-sm mt-1">{errors.collegeId.message}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <div className="flex items-center justify-center mb-4">
          <img src={userIcon} alt="User Icon" className="h-10 w-10 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Add Users</h2>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="mt-4">
            <h2 className="text-base font-medium text-gray-900 text-center mb-4">Select User Role</h2>
            <div className="flex justify-center gap-6 mb-6">
              {roleOptions.map((role) => (
                <div
                  key={role.id}
                  onClick={() => onSelectRole(role.id)}
                  className={`w-36 h-36 flex flex-col items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedRole === role.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <div className={`p-2 rounded-full ${role.color} mb-2`}>{role.icon}</div>
                  <span className="text-sm font-medium text-gray-900">{role.title}</span>
                </div>
              ))}
            </div>
          </div>

          {roleIsInstructor && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label htmlFor="departmentId">Department</label>
                <div className="relative">
                  <select
                    id="departmentId"
                    {...register("departmentId", { required: "Department is required" })}
                    className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-300"
                    disabled={!collegeIdToFetch || loadingDepartments}
                    defaultValue=""
                  >
                    <option value="">{!collegeIdToFetch ? "Select a college first" : (loadingDepartments ? "Loading..." : "Select a department")}</option>
                    {(departments || []).map((dept) => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
                  </select>
                </div>
                {errors.departmentId && <p className="mt-2 text-sm text-red-600">{errors.departmentId.message}</p>}
              </div>
              {(!isAdminUser || isSuperAdmin) && collegeDropdown}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Full Name" type="text" {...register("fullName", { required: "Full name is required" })} error={errors.fullName?.message}/>
            {roleIsAdmin && (!isAdminUser || isSuperAdmin) && collegeDropdown}
            <Input label="Email" type="email" {...register("email", { required: "Email is required" })} error={errors.email?.message}/>
          </div>
          
          {roleIsStudent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Year" type="text" {...register("year")} />
              <div className="flex flex-col">
                <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <div className="relative">
                  <select
                    id="department"
                    {...register("departmentId", { required: "Department is required" })}
                    className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-300"
                    disabled={!collegeIdToFetch || loadingDepartments}
                    defaultValue=""
                  >
                    <option value="" disabled>{!collegeIdToFetch ? "Select a college first" : (loadingDepartments ? "Loading..." : "Select a department")}</option>
                    {(departments || []).map((dept) => (<option key={dept.id} value={dept.id}>{dept.name}</option>))}
                  </select>
                </div>
                {errors.departmentId && <p className="mt-2 text-sm text-red-600">{errors.departmentId.message}</p>}
              </div>
              <Input label="Roll Number" type="text" {...register("rollNumber")} />
              <Input label="Academic Year" type="text" {...register("academicYear")} />
              {(!isAdminUser || isSuperAdmin) && collegeDropdown}
            </div>
          )}

          <Input label="Mobile" type="tel" {...register("mobile", { pattern: { value: /^[6-9]\d{9}$/, message: "Please enter a valid 10-digit Indian mobile number" } })} error={errors.mobile?.message}/>
          
          <Button type="submit" size="sm" className="w-32 mx-auto flex justify-center py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add User"}
          </Button>
        </form>
      </div>
    </div>
  );
}