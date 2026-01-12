import { create } from "zustand";









// EXEMPLES ------------------------------------------------------------
// EXEMPLE de store d'objet simple
type ItemType = {
  item: string | null;
  updateItem: (it: string) => void
}

export const storeItem = create<ItemType>((set) => ({
  item: null,
  updateItem(it) {
    set({item: it})
  }
}))

// EXEMPLE de store d'un tableau
type TableType = {
  table: Set<number>;
  changeTable: (item: number) => void
}

export const storeTable = create<TableType>((set) => ({
  table: new Set(),
  changeTable(newCount) {
    set((current) => {
      const newTable = new Set([...current.table, newCount])
      return { table: newTable }
    })
  }
}))