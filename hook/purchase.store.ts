import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PurchaseEntry = {
  id: string;
  /** date d'achat (YYYY-MM-DD) */
  date: string;
  priceHT: number;
  tva: number;
  shippingFee: number;
  ttc: number;
  createdAt: string;
};

type PurchaseStore = {
  entries: PurchaseEntry[];
  addEntry: (entry: Omit<PurchaseEntry, "id" | "createdAt">) => void;
  clear: () => void;
};

export const storePurchase = create<PurchaseStore>()(
  persist(
    (set) => ({
      entries: [],
      addEntry(entry) {
        const fullEntry: PurchaseEntry = {
          ...entry,
          id: String(Date.now()),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ entries: [fullEntry, ...s.entries] }));
        // eslint-disable-next-line no-console
        console.log("Purchase stored:", fullEntry);
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
