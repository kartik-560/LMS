import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Canonical role constants
const ROLE = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  INSTRUCTOR: 'INSTRUCTOR',
  STUDENT: 'STUDENT',
};

// Normalizer lives in THIS file so it's available wherever it's used below
const normalizeRole = (raw) => {
  const cleaned = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '_');

  // Map common variants to canonical roles
  switch (cleaned) {
    case 'SUPERADMIN':
    case 'SUPER_ADMIN':
    case 'SUPER-ADMIN':
    case 'SA':
      return ROLE.SUPERADMIN;

    case 'ADMIN':
      return ROLE.ADMIN;

    case 'INSTRUCTOR':
    case 'TEACHER':
      return ROLE.INSTRUCTOR;

    case 'STUDENT':
    case 'LEARNER':
      return ROLE.STUDENT;

    default:
      // Fallback to STUDENT if unknown
      return ROLE.STUDENT;
  }
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      userRole: null,
      hasHydrated: false,

      login: (userData, token) => {
        const canonicalRole = normalizeRole(userData?.role);
        set({
          user: { ...userData, role: canonicalRole },
          token,
          isAuthenticated: true,
          userRole: canonicalRole,
        });

        localStorage.setItem("user_role", canonicalRole);
      
        setAuthToken(token); 
      },

     logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          userRole: null,
        });

        setAuthToken(null); 
        localStorage.removeItem("user_role");
      },
      updateUser: (userData) => {
        const canonicalRole = normalizeRole(userData?.role);
        set({
          user: { ...userData, role: canonicalRole },
          userRole: canonicalRole,
        });
        localStorage.setItem("user_role", canonicalRole);
      },

       isStudent: () => get().userRole === ROLE.STUDENT,
      isInstructor: () => get().userRole === ROLE.INSTRUCTOR,
      isAdmin: () => get().userRole === ROLE.ADMIN,
      isSuperAdmin: () => get().userRole === ROLE.SUPERADMIN,
    }),
     {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        userRole: state.userRole,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.userRole) state.userRole = normalizeRole(state.userRole);
          state.hasHydrated = true;
        }
      },
    }
  )
);

export default useAuthStore;