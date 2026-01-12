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
    <div className="flex flex-col h-screen">
      <div className="flex p-4 justify-between items-center gap-2">
        <div className="flex gap-2 absolute">
          <Button variant={"secondary"} onClick={() => setOpenRevenue(true)}>
            + ENTREE
          </Button>
          <Button variant={"secondary"} onClick={() => setOpenPurchase(true)}>
            + SORTIE
          </Button>
        </div>
        <h2 className="h-auto w-min mx-auto text-2xl font-bold m-2 p-2 border-2 rounded-2xl border-slate-500">RAPPORTS</h2>
      </div>

      <main className="p-6">
        <section className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold">Historique des entrées</h3>

            <div className="flex items-center gap-2">
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="text-sm max-w-xs"
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
            <div className="text-sm text-slate-500 py-8 text-center">Aucun envoi correspondant au filtre.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Base 20%</TableHead>
                    <TableHead>TVA 20%</TableHead>
                    <TableHead>Base 5,5%</TableHead>
                    <TableHead>TVA 5,5%</TableHead>
                    <TableHead>Total HT</TableHead>
                    <TableHead className="text-right">Total TTC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEntries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{new Date(e.date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>{fmt.format(e.base20)}</TableCell>
                      <TableCell>{fmt.format(e.tva20)}</TableCell>
                      <TableCell>{fmt.format(e.base5_5)}</TableCell>
                      <TableCell>{fmt.format(e.tva5_5)}</TableCell>
                      <TableCell>{fmt.format(e.ht)}</TableCell>
                      <TableCell className="text-right font-extrabold text-emerald-600">{fmt.format(e.ttc)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold">Historique des achats</h3>

            <div className="flex items-center gap-2">
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="text-sm max-w-xs"
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
            <div className="text-sm text-slate-500 py-8 text-center">Aucun achat correspondant au filtre.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Prix HT</TableHead>
                    <TableHead>TVA 20%</TableHead>
                    <TableHead>Frais de port</TableHead>
                    <TableHead className="text-right">Total TTC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPurchases.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>{fmt.format(p.priceHT)}</TableCell>
                      <TableCell>{fmt.format(p.tva)}</TableCell>
                      <TableCell>{fmt.format(p.shippingFee)}</TableCell>
                      <TableCell className="text-right font-extrabold text-red-600">{fmt.format(p.ttc)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </main>

      {openRevenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpenRevenue(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <RevenueForm onSubmitted={() => setOpenRevenue(false)} onClose={() => setOpenRevenue(false)} />
          </div>
        </div>
      )}

      {openPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpenPurchase(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <PurchaseForm onSubmitted={() => setOpenPurchase(false)} onClose={() => setOpenPurchase(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
