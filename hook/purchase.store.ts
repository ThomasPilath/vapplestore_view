import { create } from "zustand";
import type { PurchaseEntry, CreatePurchasePayload } from "@/types";
import { purchaseAPI } from "@/lib/api-client";

export type { PurchaseEntry };

const normalizePurchase = (entry: any): PurchaseEntry => {
  return {
    id: entry.id,
    date: entry.date,
    totalHT: Number(entry.totalHT ?? 0),
    tva: Number(entry.tva ?? 0),
    shippingFee: Number(entry.shippingFee ?? 0),
    totalTTC: Number(entry.totalTTC ?? 0),
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt ?? entry.createdAt,
  };
};

type PurchaseStore = {
  entries: PurchaseEntry[];
  loading: boolean;
  error: string | null;
  addEntry: (entry: CreatePurchasePayload) => Promise<void>;
  fetchEntries: () => Promise<void>;
  clear: () => Promise<void>;
};

export const storePurchase = create<PurchaseStore>((set) => ({
  entries: [],
  loading: false,
  error: null,

  /**
   * Récupère toutes les entrées depuis l'API
   */
  fetchEntries: async () => {
    set({ loading: true, error: null });
    try {
      const data = await purchaseAPI.getAll();
      const mapped = Array.isArray(data) ? data.map(normalizePurchase) : [];
      set({ entries: mapped, loading: false });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erreur lors de la récupération";
      set({ error: errorMsg, loading: false, entries: [] });
    }
  },

  /**
   * Ajoute une nouvelle entrée via l'API et met à jour l'état
   */
  addEntry: async (entry: CreatePurchasePayload) => {
    try {
      const newEntry = await purchaseAPI.create(entry);
      set((state) => ({
        entries: [normalizePurchase(newEntry), ...state.entries],
        error: null,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erreur lors de l'ajout";
      set({ error: errorMsg });
      throw error;
    }
  },

  /**
   * Supprime toutes les entrées via l'API
   */
  clear: async () => {
    try {
      await purchaseAPI.deleteAll();
      set({ entries: [], error: null });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erreur lors de la suppression";
      set({ error: errorMsg });
      throw error;
    }
  },
}));
