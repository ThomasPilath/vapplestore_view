import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsStore {
  hideSundays: boolean;
  setHideSundays: (value: boolean) => void;
}

export const storeSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      hideSundays: true,
      setHideSundays: (value: boolean) => set({ hideSundays: value }),
    }),
    {
      name: "settings-store",
      partialize: (state) => ({ hideSundays: state.hideSundays }),
    }
  )
);
