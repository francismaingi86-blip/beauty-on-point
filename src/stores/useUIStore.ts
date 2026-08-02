import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  aiPanelOpen: boolean
  notificationsOpen: boolean
  toggleSidebar: () => void
  toggleAIPanel: () => void
  toggleNotifications: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  aiPanelOpen: false,
  notificationsOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleAIPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen, notificationsOpen: false })),
  toggleNotifications: () => set((s) => ({ notificationsOpen: !s.notificationsOpen, aiPanelOpen: false })),
}))
