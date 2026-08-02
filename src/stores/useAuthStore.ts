import { create } from 'zustand'

export type StaffRole = 'administrator' | 'manager' | 'cashier' | 'storekeeper'

export interface StaffUser {
  id: string
  name: string
  email: string
  role: StaffRole
}

interface AuthState {
  user: StaffUser | null
  isAuthenticated: boolean
  setUser: (user: StaffUser | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))
