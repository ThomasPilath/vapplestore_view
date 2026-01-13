import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PurchaseEntry, CreatePurchasePayload } from "@/types";

export type { PurchaseEntry };

type PurchaseStore = {
  entries: PurchaseEntry[];
  addEntry: (entry: CreatePurchasePayload) => void;
  clear: () => void;
};

export const storePurchase = create<PurchaseStore>()(
  persist(
    (set) => ({
      entries: [],
      addEntry(entry) {
        const fullEntry: PurchaseEntry = {
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
      name: "purchase-store",
      partialize: (state) => ({ entries: state.entries }),
    }
  )
);
