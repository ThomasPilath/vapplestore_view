import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RevenueEntry = {
  id: string;
  /** date de saisie (YYYY-MM-DD) */
  date: string;
  base20: number;
  tva20: number;
  base5_5: number;
  tva5_5: number;
  ht: number;
  ttc: number;
  createdAt: string;
};

type RevenueStore = {
  entries: RevenueEntry[];
  addEntry: (entry: Omit<RevenueEntry, "id" | "createdAt">) => void;
  clear: () => void;
};

export const storeRevenue = create<RevenueStore>()(
  persist(
    (set) => ({
      entries: [],
      addEntry(entry) {
        const fullEntry: RevenueEntry = {
          ...entry,
          id: String(Date.now()),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ entries: [fullEntry, ...s.entries] }));
        // pour debug : log la donnée envoyée
        // eslint-disable-next-line no-console
        console.log("Revenue stored:", fullEntry);
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
