import { create } from 'zustand'

type UIMode = 'consultant' | 'client'

type UIStore = {
  mode: UIMode
  reasoningDrawerOpen: boolean
  sidebarCollapsed: boolean

  setMode: (mode: UIMode) => void
  toggleReasoningDrawer: () => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  mode: 'consultant',
  reasoningDrawerOpen: false,
  sidebarCollapsed: false,

  setMode: (mode) => set({ mode }),
  toggleReasoningDrawer: () =>
    set((state) => ({ reasoningDrawerOpen: !state.reasoningDrawerOpen })),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
