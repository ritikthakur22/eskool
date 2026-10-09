// import { create } from "zustand";

// type UIState = {
//   sidebarCollapsed: boolean;
//   mobileSidebarOpen: boolean;
//   toggleSidebar: () => void;
//   setMobileSidebar: (open: boolean) => void;
// };

// export const useUIStore = create<UIState>((set) => ({
//   sidebarCollapsed: false,
//   mobileSidebarOpen: false,
//   toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
//   setMobileSidebar: (open) => set({ mobileSidebarOpen: open }),
// }));


import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type UIState = {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  setMobileSidebar: (open: boolean) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileSidebar: (open) => set({ mobileSidebarOpen: open }),
    }),
    {
      name: "ui-storage", // Key used in localStorage
      storage: createJSONStorage(() => localStorage), // Defaults to localStorage if omitted, but explicit is better
    }
  )
);