import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { authAPI } from "../services/api";

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [userData, setUserData] = useState(null);

  // Fetch user data from localStorage and update state
  useEffect(() => {
    const storedData = localStorage.getItem("reg_data");

    // Check if the storedData is a valid JSON string
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log("Stored registration data:", parsedData);

        setUserData(parsedData);
        setRole(parsedData.role); // Set role based on registration data
      } catch (error) {
        console.error("Error parsing JSON from localStorage:", error);
        navigate("/otp"); // Redirect to OTP page if data is corrupted
      }
    } else {
      navigate("/otp"); // Redirect to OTP page if no registration data is available
    }
  }, [navigate]);

  // Form setup using react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue, // To set values manually after data is fetched
    getValues, // To access current form values
  } = useForm();

  // Once userData is fetched, set form default values
  useEffect(() => {
    if (userData) {
      // Dynamically set form data using `setValue` based on userData
      setValue("fullName", userData?.fullName || "");
      setValue("email", userData?.email || "");
      setValue("mobile", userData?.mobile || "");
      setValue("year", userData?.year || "");
      setValue("branch", userData?.branch || "");
      setValue("rollNumber", userData?.rollNumber || "");
    }
  }, [userData, setValue]);

  const onSubmit = async (formData) => {
    try {
      // Attach email from registration data (this is already available in localStorage)
      const registrationData = JSON.parse(localStorage.getItem("reg_data"));

      if (!registrationData) {
        toast.error("No registration data found. Please verify OTP first.");
        navigate("/signup");
        return;
      }

      formData.email = registrationData.email;

      console.log("Submitting registration with data:", formData);

      // Send the registration data to complete the signup process
      const response = await authAPI.completeSignup(formData);

      if (response.success) {
        toast.success("Registration complete! Please log in.");
        navigate("/login"); // Redirect to login page after successful registration
      } else {
        toast.error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      toast.error(
        error?.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  // If userData is not available, render a loading state or return
  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-lg mx-auto p-8 bg-white border rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Registration</h2>

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

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            {...register("confirmPassword", {
              required: "Confirm password is required",
              validate: (value) =>
                value === getValues("password") || "Passwords do not match",
            })}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Conditional Fields for Different Roles */}
        {role === "STUDENT" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <input
                type="text"
                {...register("year")}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Branch</label>
              <input
                type="text"
                {...register("branch")}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Roll Number</label>
              <input
                type="text"
                {...register("rollNumber")}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {role === "INSTRUCTOR" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <input
                type="text"
                value={role}
                disabled
                className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
              />
            </div>
          </>
        )}

        {role === "ADMIN" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <input
                type="text"
                value={role}
                disabled
                className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Complete Registration
        </button>
      </form>
    </div>
  );
};

export default Register;
