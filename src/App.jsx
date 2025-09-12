import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/useAuthStore";
import Navbar from "./components/layout/Navbar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import CourseCatalogPage from "./pages/CourseCatalogPage";
import StudentDashboardPage from "./pages/StudentDashboardPage";
import InstructorDashboardPage from "./pages/InstructorDashboardPage";
import CreateCoursePage from "./pages/CreateCoursePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import SuperAdminDashboardPage from "./pages/SuperAdminDashboardPage";
import CourseViewerPage from "./pages/CourseViewerPage";
import RegisterPage from "./pages/RegisterPage";
import { useLocation } from "react-router-dom";
// ✅ Import Terms & Privacy pages
import Terms from "./pages/TermsPage";
import Privacy from "./pages/PrivacyPage";
import EditCoursePage from "./pages/EditCoursePage";
import FirstLoginPage from "./pages/FirstLoginPage";
import { useEffect } from "react";
// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, userRole } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirects authenticated users)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, userRole } = useAuthStore();

  const location = useLocation();
  const allowWhenLoggedIn = location.state?.allowWhenLoggedIn === true;
  if (isAuthenticated && !allowWhenLoggedIn) {
    if (userRole === "superadmin") {
      return <Navigate to="/superadmin" replace />;
    } else if (userRole === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (userRole === "instructor") {
      return <Navigate to="/instructor" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

const App = () => {
  const { isAuthenticated } = useAuthStore();
 

  return (
    <div className="App">
      {isAuthenticated && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/courses" element={<CourseCatalogPage />} />

        {/* Legal Pages */}
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Auth Routes */}
        <Route
          path="/first-login"
          element={
         
            <ProtectedRoute allowedRoles={["student", "instructor", "admin", "superadmin"]}> 
              <FirstLoginPage />
             </ProtectedRoute>
            
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        

        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor"
          element={
            <ProtectedRoute allowedRoles={["instructor", "admin"]}>
              <InstructorDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses/:courseId"
          element={
            <ProtectedRoute
              allowedRoles={["student", "instructor", "admin", "superadmin"]}
            >
              <CourseViewerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses/create"
          element={
            <ProtectedRoute
              allowedRoles={["instructor", "admin", "superadmin"]}
            >
              <CreateCoursePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/courses/:courseId/edit"
          element={
            <ProtectedRoute
              allowedRoles={["instructor", "admin", "superadmin"]}
            >
              <EditCoursePage />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <SuperAdminDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
