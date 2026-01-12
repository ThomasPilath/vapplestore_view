"use client"

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storeRevenue } from "@/hook/revenue.store";

const fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

type Props = {
  onSubmitted?: () => void;
  onClose?: () => void;
};

export default function RevenueForm({ onSubmitted, onClose }: Props) {
  const addEntry = storeRevenue((s) => s.addEntry);

  const todayISO = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(todayISO);

  const [base20, setBase20] = useState<string>("");
  const [tva20, setTva20] = useState<string>("");
  const [base5_5, setBase5_5] = useState<string>("");
  const [tva5_5, setTva5_5] = useState<string>("");

  const ht = useMemo(() => Number(base20 || 0) + Number(base5_5 || 0), [base20, base5_5]);
  const tvaTotal = useMemo(() => Number(tva20 || 0) + Number(tva5_5 || 0), [tva20, tva5_5]);
  const ttc = useMemo(() => ht + tvaTotal, [ht, tvaTotal]);

  function handleSend() {
    addEntry({ date, base20: Number(base20 || 0), tva20: Number(tva20 || 0), base5_5: Number(base5_5 || 0), tva5_5: Number(tva5_5 || 0), ht, ttc });
    setDate(todayISO);
    setBase20("");
    setTva20("");
    setBase5_5("");
    setTva5_5("");

    if (onSubmitted) onSubmitted();
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-slate-700 rounded shadow relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          aria-label="Fermer"
        >
          ✕
        </button>
      )}
      <h3 className="text-lg text-slate-700 dark:text-slate-200 font-semibold mb-4">Saisie chiffre d'affaires</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col col-span-2">
          <Label htmlFor="date-saisie">Date de saisie</Label>
          <Input
            id="date-saisie"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2"
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor="base20">Base 20%</Label>
          <Input
            id="base20"
            type="number"
            placeholder="0"
            value={base20}
            onChange={(e) => setBase20(e.target.value)}
            className="mt-2"
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor="tva20">TVA 20%</Label>
          <Input
            id="tva20"
            type="number"
            placeholder="0"
            value={tva20}
            onChange={(e) => setTva20(e.target.value)}
            className="mt-2"
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor="base55">Base 5,5%</Label>
          <Input
            id="base55"
            type="number"
            placeholder="0"
            value={base5_5}
            onChange={(e) => setBase5_5(e.target.value)}
            className="mt-2"
          />
        </div>

        <div className="flex flex-col">
          <Label htmlFor="tva55">TVA 5,5%</Label>
          <Input
            id="tva55"
            type="number"
            placeholder="0"
            value={tva5_5}
            onChange={(e) => setTva5_5(e.target.value)}
            className="mt-2"
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="text-sm text-slate-500">Chiffre d'affaires HT</div>
          <div className="text-xl text-slate-700 dark:text-slate-200 font-semibold">{fmt.format(ht)}</div>
        </div>

        <div>
          <div className="text-sm text-slate-500">Chiffre d'affaires TTC</div>
          <div className="text-xl text-slate-700 dark:text-slate-200 font-semibold">{fmt.format(ttc)}</div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={handleSend}>
          Envoyer
        </Button>
      </div>
    </div>
  );
}
