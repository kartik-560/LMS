import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token") || null,
      isAuthenticated: !!(localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")),
      userRole: null,
      
      login: (userData, token) => {
        set({
          user: userData,
          token,
          isAuthenticated: true,
          userRole: userData.role
        });
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          userRole: null
        });
        localStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_token");
      },
      
      updateUser: (userData) => {
        set({ user: userData });
      },
      
      isStudent: () => get().userRole === 'student',
      isInstructor: () => get().userRole === 'instructor',
      isAdmin: () => get().userRole === 'admin',
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated,
        userRole: state.userRole
      }),
    }
  )
);


export default useAuthStore
