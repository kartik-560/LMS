import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Fallback thumbnail for missing images
export const FALLBACK_THUMB =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
       <rect width="100%" height="100%" fill="#e5e7eb"/>
       <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
             font-family="Arial" font-size="28" fill="#6b7280">Course</text>
     </svg>`
  );

// Headers for API calls, including authorization if token exists
export const makeHeaders = () => {
  const token = useAuthStore.getState().token;
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

// Create an axios instance
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor to attach token to every request if available
api.interceptors.request.use((config) => {
  let token = useAuthStore.getState().token;

  // Fallback to localStorage/sessionStorage if token is missing in Zustand
  if (!token) {
    token =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor to handle 401 errors (token expired or invalid)
const AUTH_WHITELIST = ["/api/auth/login", "/api/auth/register"];

api.interceptors.response.use(
  (res) => res, // Pass the successful response
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url || "";

    if (status === 401 && !AUTH_WHITELIST.some((p) => url.includes(p))) {
      // Log out the user on token expiry or invalid token
      useAuthStore.getState().logout?.();
      // Avoid redirect loops
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(err); // Pass the error along
  }
);

// Utility function to convert file to base64 (for file uploads)
export async function fileToBase64(file) {
  if (!file) return "";
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Auth-related API calls
export const authAPI = {
  // Register a user
  register: (payload) => api.post("/auth/registrations", payload),

  // Standard login (with username and password)
  login: async (payload) => {
    try {
      const response = await api.post("/auth/login", payload);
      const { token, user } = response.data.data;

      // Store token in localStorage and sessionStorage
      localStorage.setItem("auth_token", token);
      sessionStorage.setItem("auth_token", token);

      // Update Zustand store with token
      useAuthStore.getState().setToken(token);

      return { success: true, user, token };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  },

  // OTP - Step 1: Request OTP
  loginOtpBegin: async (payload) => {
    try {
      const response = await api.post("/auth/signup/begin", payload);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to send OTP",
      };
    }
  },

  // OTP - Step 2: Verify OTP
  loginOtpVerify: async (email, otp) => {
    try {
      return await api
        .post("/auth/signup/verify", { email, otp })
        .then((response) => response.data);
      const token = response.data.token;

      // Store token in localStorage and sessionStorage
      localStorage.setItem("auth_token", token);
      sessionStorage.setItem("auth_token", token);

      // Update Zustand store with token
      // useAuthStore.getState().setToken(token);

      return { success: true, token };
    } catch (error) {
      console.error("OTP verification failed:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Invalid OTP",
      };
    }
  },

  me: () => api.get("/auth/me"),

  logout: () => {
    useAuthStore.getState().logout();

    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_token");

    // Redirect to login page
    window.location.href = "/login";
  },

  // Optional: Check if user is logged in
  isAuthenticated: () => {
    const token =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");
    return token ? true : false;
  },
};


export const chaptersAPI = {
  listByCourse: (courseId) => api.get("/chapters", { params: { courseId } }),
  create: (courseId, payload) =>
    api.post(`/courses/${courseId}/chapters`, payload),
  update: (id, payload) => api.patch(`/chapters/${id}`, payload),
  remove: (id) => api.delete(`/chapters/${id}`),
};

export const uploadsAPI = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      // Use the central 'api' axios instance
      const res = await api.post("/uploads/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.url; // Returns the public URL
    } catch (error) {
      console.error("File upload failed:", error);
      throw error;
    }
  },
};
export const enrollmentsAPI = {
  list: (params = {}) => api.get("/enrollments", { params }),

  listByStudent: (studentId) =>
    api.get("/enrollments", { params: { studentId } }),

  listByCourseAdmin: (courseId) => api.get(`/courses/${courseId}/enrollments`),

  enrollStudent: (courseId, studentId) =>
    api.post(`/courses/${courseId}/enrollments`, { studentId }),

  unenroll: (enrollmentId) => api.delete(`/enrollments/${enrollmentId}`),

  listSelf: () => api.get("/enrollments/self"),
};

export const enrollmentRequestsAPI = {
  create: (courseId) => api.post(`/courses/${courseId}/enrollment-requests`),
  listMine: () => api.get("/enrollments/self"),
  listForInstructor: () => api.get("/instructor/enrollment-requests"),
  actOn: (requestId, action) =>
    api.patch(`/enrollment-requests/${requestId}`, { action }),
};

export const instructorsAPI = {
  list: () => api.get("/courses/instructors-list"),
};

export const assessmentsAPI = {
  listByChapter: (chapterId) =>
    api.get("/assessments", { params: { chapterId } }),
  get: (id) => api.get(`/assessments/${id}`),
  createForChapter: (chapterId, payload) =>
    api.post(`/assessments/chapters/${chapterId}`, payload),
  update: (id, payload) => api.put(`/assessments/${id}`, payload),
  remove: (id) => api.delete(`/assessments/${id}`),
};

export const progressAPI = {
  completeChapter: (chapterId) =>
    api.post(`/progress/chapters/${chapterId}/complete`),
  completedChapters: (courseId) =>
    api.get(`/progress/course/${courseId}/completed`),
  courseSummary: (courseId) => api.get(`/progress/course/${courseId}/summary`),
  dashboard: () => api.get(`/progress/dashboard`),
};

export const adminAPI = {
  overview: () => api.get("/admin/overview"),
  courses: () => api.get("/admin/courses"),
  students: () => api.get("/admin/students"),
  instructors: () => api.get("/admin/instructors"),
  setInstructorPermissions: (id, payload) =>
    api.patch(`/admin/instructors/${id}/permissions`, payload),
};

export default api;
