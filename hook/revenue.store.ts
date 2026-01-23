import { create } from "zustand";
import type { RevenueEntry, CreateRevenuePayload } from "@/types";
import { revenueAPI } from "@/lib/api-client";

export type { RevenueEntry };

const computeRevenue = (entry: Record<string, unknown>): RevenueEntry => {
  const base20 = Number(entry.base20 ?? 0);
  const tva20 = Number(entry.tva20 ?? 0);
  const base5_5 = Number(entry.base5_5 ?? 0);
  const tva5_5 = Number(entry.tva5_5 ?? 0);
  const totalHT = base20 + base5_5;
  const totalTTC = totalHT + tva20 + tva5_5;

  return {
    id: entry.id as string,
    date: entry.date as string,
    base20,
    tva20,
    base5_5,
    tva5_5,
    createdAt: entry.createdAt as string,
    updatedAt: (entry.updatedAt as string) ?? (entry.createdAt as string),
    totalHT,
    totalTTC,
  };
};

type RevenueStore = {
  entries: RevenueEntry[];
  loading: boolean;
  error: string | null;
  addEntry: (entry: CreateRevenuePayload) => Promise<void>;
  fetchEntries: () => Promise<void>;
  clear: () => Promise<void>;
};

export const storeRevenue = create<RevenueStore>((set) => ({
  entries: [],
  loading: false,
  error: null,

  /**
   * Récupère toutes les entrées depuis l'API
   */
  fetchEntries: async () => {
    set({ loading: true, error: null });
    try {
      const data = await revenueAPI.getAll();
      const mapped = Array.isArray(data) ? data.map(computeRevenue) : [];
      set({ entries: mapped, loading: false });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erreur lors de la récupération";
      set({ error: errorMsg, loading: false, entries: [] });
    }
  },

  /**
   * Ajoute une nouvelle entrée via l'API et met à jour l'état
   */
  addEntry: async (entry: CreateRevenuePayload) => {
    try {
      const newEntry = await revenueAPI.create(entry);
      set((state) => ({
        entries: [computeRevenue(newEntry), ...state.entries],
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
      await revenueAPI.deleteAll();
      set({ entries: [], error: null });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erreur lors de la suppression";
      set({ error: errorMsg });
      throw error;
    }
  },
}));
