import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: ({ access_token, refresh_token, user_id, role, full_name }) => {
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)
        set({
          user: { id: user_id, role, full_name },
          accessToken: access_token,
          refreshToken: refresh_token,
          isAuthenticated: true,
        })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      updateUser: (data) => set((state) => ({ user: { ...state.user, ...data } })),

      get role() { return get().user?.role },
      get isCitizen()  { return get().user?.role === 'citizen' },
      get isAdvocate() { return get().user?.role === 'advocate' },
      get isAdmin()    { return get().user?.role === 'admin' },
    }),
    {
      name: 'ai-docmaster-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

export default useAuthStore
