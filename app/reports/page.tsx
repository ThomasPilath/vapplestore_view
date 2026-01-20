"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import RevenueForm from "@/components/revenue-form";
import PurchaseForm from "@/components/purchase-form";
import { storeRevenue } from "@/hook/revenue.store";
import { storePurchase } from "@/hook/purchase.store";

const fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export default function Reports() {
  const [openRevenue, setOpenRevenue] = useState(false);
  const [openPurchase, setOpenPurchase] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const entries = storeRevenue((s) => s.entries);
  const purchases = storePurchase((s) => s.entries);
  const revenueLoading = storeRevenue((s) => s.loading);
  const purchaseLoading = storePurchase((s) => s.loading);

  // Charger les données au démarrage
  useEffect(() => {
    storeRevenue.getState().fetchEntries();
    storePurchase.getState().fetchEntries();
  }, []);

  // Afficher un indicateur de chargement pendant le fetch initial
  if (revenueLoading || purchaseLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    )
  }

  const filteredEntries = entries.filter((e) => {
    if (!filterMonth) return true;
    return e.date.startsWith(filterMonth);
  });

  const sortedEntries = filteredEntries.slice().sort((a, b) => {
    return sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
  });

  const filteredPurchases = purchases.filter((p) => {
    if (!filterMonth) return true;
    return p.date.startsWith(filterMonth);
  });

  const sortedPurchases = filteredPurchases.slice().sort((a, b) => {
    return sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
  });

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header avec titre et boutons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center md:text-left">RAPPORTS</h2>
          <div className="flex gap-2">
            <Button variant={"default"} onClick={() => setOpenRevenue(true)}>
              + ENTRÉE
            </Button>
            <Button variant={"default"} onClick={() => setOpenPurchase(true)}>
              + SORTIE
            </Button>
          </div>
        </div>

        {/* Historique des entrées */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-lg md:text-xl font-semibold">Historique des entrées</h3>

            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="text-sm w-full sm:w-auto sm:max-w-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterMonth("")}
              >
                Réinitialiser
              </Button>

              <Button
                variant={sortAsc ? "default" : "outline"}
                size="sm"
                onClick={() => setSortAsc((s) => !s)}
              >
                {sortAsc ? "Chrono ↑" : "Chrono ↓"}
              </Button>
            </div>
          </div>

          {sortedEntries.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center border rounded-lg">
              Aucune entrée correspondant au filtre.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-25">Date</TableHead>
                    <TableHead className="min-w-25">Base 20%</TableHead>
                    <TableHead className="min-w-25">TVA 20%</TableHead>
                    <TableHead className="min-w-25">Base 5,5%</TableHead>
                    <TableHead className="min-w-25">TVA 5,5%</TableHead>
                    <TableHead className="min-w-25">Total HT</TableHead>
                    <TableHead className="text-right min-w-30">Total TTC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEntries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{new Date(e.date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>{fmt.format(e.base20)}</TableCell>
                      <TableCell>{fmt.format(e.tva20)}</TableCell>
                      <TableCell>{fmt.format(e.base5_5)}</TableCell>
                      <TableCell>{fmt.format(e.tva5_5)}</TableCell>
                      <TableCell>{fmt.format(e.totalHT)}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">{fmt.format(e.totalTTC)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Historique des achats */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-lg md:text-xl font-semibold">Historique des achats</h3>

            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="text-sm w-full sm:w-auto sm:max-w-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterMonth("")}
              >
                Réinitialiser
              </Button>

              <Button
                variant={sortAsc ? "default" : "outline"}
                size="sm"
                onClick={() => setSortAsc((s) => !s)}
              >
                {sortAsc ? "Chrono ↑" : "Chrono ↓"}
              </Button>
            </div>
          </div>

          {sortedPurchases.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center border rounded-lg">
              Aucun achat correspondant au filtre.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-25">Date</TableHead>
                    <TableHead className="min-w-25">Total HT</TableHead>
                    <TableHead className="min-w-25">TVA 20%</TableHead>
                    <TableHead className="min-w-25">Frais de port</TableHead>
                    <TableHead className="text-right min-w-30">Total TTC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPurchases.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{new Date(p.date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>{fmt.format(p.totalHT)}</TableCell>
                      <TableCell>{fmt.format(p.tva)}</TableCell>
                      <TableCell>{fmt.format(p.shippingFee)}</TableCell>
                      <TableCell className="text-right font-bold text-red-600">{fmt.format(p.totalTTC)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>

      {openRevenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpenRevenue(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
            <RevenueForm onSubmitted={() => setOpenRevenue(false)} onClose={() => setOpenRevenue(false)} />
          </div>
        </div>
      )}

      {openPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpenPurchase(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
            <PurchaseForm onSubmitted={() => setOpenPurchase(false)} onClose={() => setOpenPurchase(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
