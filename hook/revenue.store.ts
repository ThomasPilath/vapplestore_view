import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RevenueEntry, CreateRevenuePayload } from "@/types";

export type { RevenueEntry };

type RevenueStore = {
  entries: RevenueEntry[];
  addEntry: (entry: CreateRevenuePayload) => void;
  clear: () => void;
};

export const storeRevenue = create<RevenueStore>()(
  persist(
    (set) => ({
      entries: [],
      addEntry(entry) {
        const fullEntry: RevenueEntry = {
          ...entry,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ entries: [fullEntry, ...s.entries] }));
      },
      clear() {
        set({ entries: [] });
      },
    }),
    {
      name: "revenue-store",
      partialize: (state) => ({ entries: state.entries }),
    }
  )
);
