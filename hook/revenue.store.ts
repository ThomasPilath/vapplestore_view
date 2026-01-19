import { create } from "zustand";
import type { RevenueEntry, CreateRevenuePayload } from "@/types";
import { revenueAPI } from "@/lib/api-client";

export type { RevenueEntry };

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
      set({ entries: data || [], loading: false });
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
        entries: [newEntry, ...state.entries],
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
