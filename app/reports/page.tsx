"use client"

import React, { useState } from "react";
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
  const entries = storeRevenue((s) => s.entries);
  const purchases = storePurchase((s) => s.entries);

  // filtre et tri
  const today = new Date().toISOString().slice(0, 7); // YYYY-MM format
  const [filterMonth, setFilterMonth] = useState<string>(today);
  const [sortAsc, setSortAsc] = useState<boolean>(false);

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
                    <TableHead className="min-w-[100px]">Date</TableHead>
                    <TableHead className="min-w-[100px]">Base 20%</TableHead>
                    <TableHead className="min-w-[100px]">TVA 20%</TableHead>
                    <TableHead className="min-w-[100px]">Base 5,5%</TableHead>
                    <TableHead className="min-w-[100px]">TVA 5,5%</TableHead>
                    <TableHead className="min-w-[100px]">Total HT</TableHead>
                    <TableHead className="text-right min-w-[120px]">Total TTC</TableHead>
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
                      <TableCell>{fmt.format(e.ht)}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">{fmt.format(e.ttc)}</TableCell>
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
                    <TableHead className="min-w-[100px]">Date</TableHead>
                    <TableHead className="min-w-[100px]">Prix HT</TableHead>
                    <TableHead className="min-w-[100px]">TVA 20%</TableHead>
                    <TableHead className="min-w-[100px]">Frais de port</TableHead>
                    <TableHead className="text-right min-w-[120px]">Total TTC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPurchases.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{new Date(p.date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>{fmt.format(p.priceHT)}</TableCell>
                      <TableCell>{fmt.format(p.tva)}</TableCell>
                      <TableCell>{fmt.format(p.shippingFee)}</TableCell>
                      <TableCell className="text-right font-bold text-red-600">{fmt.format(p.ttc)}</TableCell>
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
