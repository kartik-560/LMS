import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

const SignupPage = ({ userData }) => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const role = userData?.role || "STUDENT"; 

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: userData?.fullName || "",
      email: userData?.email || "",
      mobile: userData?.mobile || "",
      password: "",   
      year: userData?.year || "",
      branch: userData?.branch || "",
      role: role,
      departments: userData?.departments || [],
    },
  });

  useEffect(() => {
    if (role === "ADMIN") {
      fetch("/signup/departments-catalog")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setDepartments(data.data.items || []);
        })
        .catch((err) => console.error("Failed to load departments", err));
    }
  }, [role]);

  const onSubmit = async (formData) => {
    try {
      const res = await fetch("/auth/updateUserInfo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        if (role === "ADMIN") navigate("/admin", { replace: true });
        else if (role === "INSTRUCTOR") navigate("/instructor", { replace: true });
        else if (role === "SUPERADMIN") navigate("/superadmin", { replace: true });
        else navigate("/dashboard", { replace: true });
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8 bg-white border rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">
        Complete Your Signup
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            {...register("fullName", { required: "Full name is required" })}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
          {errors.fullName && (
            <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email (readonly) */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            {...register("email")}
            className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
            readOnly
          />
        </div>

        {/* Mobile */}
        <div>
          <label className="block text-sm font-medium mb-1">Mobile</label>
          <input
            type="text"
            {...register("mobile", { required: "Mobile is required" })}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
          {errors.mobile && (
            <p className="text-red-500 text-xs mt-1">{errors.mobile.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            {...register("password", { required: "Password is required" })}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Departments for Admin only */}
        {role === "ADMIN" && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Departments (Select Multiple)
            </label>
            <select
              multiple
              {...register("departments", {
                required: "Select at least one department",
              })}
              className="w-full border rounded-lg px-3 py-2 h-32 focus:ring-2 focus:ring-blue-500"
            >
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold <kbd>Ctrl</kbd> (Windows) or <kbd>Cmd</kbd> (Mac) to select
              multiple
            </p>
            {errors.departments && (
              <p className="text-red-500 text-xs mt-1">
                {errors.departments.message}
              </p>
            )}
          </div>
        )}

        {/* Year/Branch only for Students */}
        {role === "STUDENT" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                Year (Optional)
              </label>
              <input
                type="text"
                {...register("year")}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Branch (Optional)
              </label>
              <input
                type="text"
                {...register("branch")}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default SignupPage;
