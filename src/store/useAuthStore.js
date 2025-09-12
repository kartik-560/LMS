import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      userRole: null,
      
      login: (userData, token) => {
        set({
          user: userData,
          token,
          isAuthenticated: true,
          userRole: userData.role
        })
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          userRole: null
        })
      },
      
      updateUser: (userData) => {
        set({ user: userData })
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
)

export default useAuthStore
