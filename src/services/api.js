// src/services/api.js
import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const FALLBACK_THUMB =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
       <rect width="100%" height="100%" fill="#e5e7eb"/>
       <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
             font-family="Arial" font-size="28" fill="#6b7280">Course</text>
     </svg>`
  );

export const makeHeaders = () => {
  const token = useAuthStore.getState().token;
  const h = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  // 1. Try Zustand
  let token = useAuthStore.getState().token;

  // 2. Fallback to persisted storage
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

const AUTH_WHITELIST = ["/api/users/login", "/api/users/register"];

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url || "";

    if (status === 401 && !AUTH_WHITELIST.some((p) => url.includes(p))) {
      // clear auth
      useAuthStore.getState().logout?.();
      // avoid redirect loops
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(err);
  }
);

export async function fileToBase64(file) {
  if (!file) return "";
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const authAPI = {
  register: (payload) => api.post("/users/register", payload),

  registerBulk: (formData) =>
    api.post("/users/register-bulk", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  firstLoginSetPassword: (payload) =>
    api.post("/users/first-login/set-password", payload),

  login: (payload) => api.post("/users/login", payload),

  me: () => api.get("/users/me"),

  completeFirstLogin: (body, token) =>
    axios.patch("/users/first-login", body, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  // NEW helper for invite-based registration
  inviteUser: ({ fullName, email, role, year, branch, mobile }) =>
    api.post("/users/register", {
      fullName,
      email,
      role: role?.toUpperCase() || "STUDENT",
      year,
      branch,
      mobile,
      sendInvite: true,
    }),
    
};


export const coursesAPI = {
  list: (params = {}) => api.get("/courses", { params }),
  get: (id) => api.get(`/courses/${id}`),
  create: (payload) => api.post("/courses", payload),
  createFull: (payload) => api.post("/courses/full", payload),
  update: (id, payload) => api.patch(`/courses/${id}`, payload),
  setInstructors: (id, instructorIds) =>
    api.post(`/courses/${id}/instructors`, { instructorIds }),
  listForMeAsInstructor: () => api.get("/courses/me/list"),
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

export const courseInstructorsAPI = {
  setForCourse: (courseId, instructorIds) =>
    api.post(`/courses/${courseId}/instructors`, { instructorIds }),
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
