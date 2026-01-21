import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsStore {
  hideSundays: boolean;
  setHideSundays: (value: boolean) => void;
  loadSettings: (settings: { hideSundays?: boolean }) => void;
}

export const storeSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      hideSundays: true,
      setHideSundays: (value: boolean) => set({ hideSundays: value }),
      loadSettings: (settings) => set({ hideSundays: settings.hideSundays ?? true }),
    }),
    {
      name: "settings-store",
      partialize: (state) => ({ hideSundays: state.hideSundays }),
    }
  )
);
